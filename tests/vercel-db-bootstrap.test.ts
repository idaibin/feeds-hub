import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRuntimeDatabaseUrl,
  getBootstrapArguments,
  getBootstrapFingerprint,
  resolveBootstrapConfiguration,
} from '../scripts/lib/vercel-db-bootstrap';

const password = 'A'.repeat(43);
const ownerPooledUrl = 'postgresql://neondb_owner:owner-secret@ep-example-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
const ownerDirectUrl = 'postgresql://neondb_owner:owner-secret@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require';

function enabledEnv(): NodeJS.ProcessEnv {
  return {
    FEED_DB_BOOTSTRAP_ENABLED: 'true',
    VERCEL: '1',
    VERCEL_ENV: 'production',
    FEED_READ_SOURCE: 'content',
    FEED_WRITES_ENABLED: 'false',
    FEED_MCP_ENABLED: 'false',
    FEED_DB_BOOTSTRAP_RUNTIME_PASSWORD: password,
    FEED_DB_BOOTSTRAP_SOURCE_COMMIT: 'a'.repeat(40),
    FEED_DB_BOOTSTRAP_BACKUP_ID: 'backup-1234',
    FEED_DB_BOOTSTRAP_BACKUP_CREATED_AT: new Date(Date.now() - 60_000).toISOString(),
    FEED_DB_BOOTSTRAP_BACKUP_RETAIN_UNTIL: new Date(Date.now() + 86_400_000).toISOString(),
    FEED_DB_BOOTSTRAP_RECOVERY_REFERENCE: 'https://console.neon.tech/app/projects/project/branches',
    DATABASE_URL: ownerPooledUrl,
    DATABASE_URL_UNPOOLED: ownerDirectUrl,
  };
}

test('bootstrap is disabled unless explicitly enabled', () => {
  assert.equal(resolveBootstrapConfiguration({}), undefined);
});

test('bootstrap requires a safe Vercel Production posture', () => {
  assert.throws(() => resolveBootstrapConfiguration({ ...enabledEnv(), FEED_MCP_ENABLED: 'true' }), /MCP and writes disabled/);
  assert.throws(() => resolveBootstrapConfiguration({ ...enabledEnv(), VERCEL_ENV: 'preview' }), /Production build/);
});

test('bootstrap creates a pooled fixed-role runtime URL without changing the target database', () => {
  const configuration = resolveBootstrapConfiguration(enabledEnv());
  assert.ok(configuration);
  const runtime = createRuntimeDatabaseUrl(configuration);
  const url = new URL(runtime.url);
  assert.equal(url.username, 'feeds_app_runtime');
  assert.equal(url.password, password);
  assert.equal(url.hostname, 'ep-example-pooler.us-east-1.aws.neon.tech');
  assert.equal(url.pathname, '/neondb');
  assert.equal(runtime.identity.ownerRole, 'neondb_owner');
  assert.match(getBootstrapFingerprint(runtime.identity), /^[0-9a-f]{64}$/);
});

test('bootstrap rejects mismatched pooled and direct database identities', () => {
  const configuration = resolveBootstrapConfiguration({
    ...enabledEnv(),
    DATABASE_URL_UNPOOLED: ownerDirectUrl.replace('/neondb?', '/other?'),
  });
  assert.ok(configuration);
  assert.throws(() => createRuntimeDatabaseUrl(configuration), /same database and role/);
});

test('bootstrap arguments bind every operation to the reviewed backup and fingerprint', () => {
  const configuration = resolveBootstrapConfiguration(enabledEnv());
  assert.ok(configuration);
  const runtime = createRuntimeDatabaseUrl(configuration);
  const fingerprint = getBootstrapFingerprint(runtime.identity);
  const args = getBootstrapArguments('runtime-write-grants', fingerprint, configuration);
  assert.ok(args.includes(`--confirm-production=feeds-hub-production:runtime-write-grants:${fingerprint}`));
  assert.ok(args.includes(`--backup-database-fingerprint=${fingerprint}`));
  assert.ok(args.includes('--backup-id=backup-1234'));
});

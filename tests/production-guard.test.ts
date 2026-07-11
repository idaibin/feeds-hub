import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { sanitizeDatabaseError, validateProductionDatabaseContext } from '../scripts/lib/production-guard';
import { assertRuntimeDatabaseEnvironment, getRuntimeDatabaseUrl } from '../src/db/runtime-environment';

const pooledUrl = 'postgresql://feeds_app_runtime:runtime-secret@ep-example-pooler.us-east-2.aws.neon.tech/feeds?sslmode=require';
const directUrl = 'postgresql://feeds_migration_owner:owner-secret@ep-example.us-east-2.aws.neon.tech/feeds?sslmode=require';
const fingerprint = createHash('sha256').update(JSON.stringify({
  endpoint: 'ep-example.us-east-2.aws.neon.tech',
  database: 'feeds',
  runtimeRole: 'feeds_app_runtime',
  migrationRole: 'feeds_migration_owner',
})).digest('hex');

function baseEnv(): NodeJS.ProcessEnv {
  return {
    FEED_DB_TARGET: 'production',
    FEED_DB_EXPECTED_FINGERPRINT: fingerprint,
    FEED_DB_EXPECTED_MIGRATION_ROLE: 'feeds_migration_owner',
    DATABASE_URL: pooledUrl,
    DATABASE_URL_UNPOOLED: directUrl,
  };
}

test('accepts operational access only for one database with separate reviewed runtime and migration roles', () => {
  const context = validateProductionDatabaseContext({ mutation: false, env: baseEnv(), argv: [] });
  assert.equal(context.fingerprint.length, 64);
  assert.equal(context.runtimeRole, 'feeds_app_runtime');
  assert.equal(context.migrationRole, 'feeds_migration_owner');

  assert.throws(() => validateProductionDatabaseContext({
    mutation: false,
    env: { ...baseEnv(), DATABASE_URL_UNPOOLED: directUrl.replace('/feeds?', '/other?') },
    argv: [],
  }), /same endpoint and database/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: false,
    env: { ...baseEnv(), DATABASE_URL: directUrl },
    argv: [],
  }), /must be pooled/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: false,
    env: { ...baseEnv(), FEED_DB_EXPECTED_FINGERPRINT: '0'.repeat(64) },
    argv: [],
  }), /does not match/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: false,
    env: { ...baseEnv(), DATABASE_URL: pooledUrl.replace('feeds_app_runtime', 'feeds_admin') },
    argv: [],
  }), /fixed feeds_app_runtime/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: false,
    env: { ...baseEnv(), FEED_DB_EXPECTED_MIGRATION_ROLE: 'other_owner' },
    argv: [],
  }), /does not use/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: false,
    env: {
      ...baseEnv(),
      FEED_DB_EXPECTED_MIGRATION_ROLE: 'feeds_app_runtime',
      DATABASE_URL_UNPOOLED: directUrl.replace('feeds_migration_owner', 'feeds_app_runtime'),
    },
    argv: [],
  }), /roles must be different/);
});

test('Vercel build and runtime reject owner credentials and require the fixed pooled runtime role', () => {
  assert.doesNotThrow(() => assertRuntimeDatabaseEnvironment({
    VERCEL: '1',
    DATABASE_URL: pooledUrl,
  }));
  assert.equal(getRuntimeDatabaseUrl({ VERCEL_ENV: 'production', DATABASE_URL: pooledUrl }), pooledUrl);
  assert.equal(getRuntimeDatabaseUrl({
    VERCEL: '1',
    VERCEL_ENV: 'production',
    FEED_DB_BOOTSTRAP_ENABLED: 'true',
    FEED_RUNTIME_DATABASE_URL: pooledUrl,
    DATABASE_URL: pooledUrl.replace('feeds_app_runtime', 'feeds_migration_owner'),
  }), pooledUrl);
  assert.throws(() => assertRuntimeDatabaseEnvironment({
    VERCEL: '1',
    DATABASE_URL: pooledUrl,
    DATABASE_URL_UNPOOLED: directUrl,
  }), /DATABASE_URL_UNPOOLED must not be available/);
  assert.throws(() => assertRuntimeDatabaseEnvironment({
    VERCEL: '1',
    DATABASE_URL: pooledUrl,
    DATABASE_URL_UNPOOLED: pooledUrl,
  }), /DATABASE_URL_UNPOOLED must not be available/);
  assert.throws(() => assertRuntimeDatabaseEnvironment({
    VERCEL: '1',
    DATABASE_URL: pooledUrl,
    STORAGE_URL_UNPOOLED: directUrl,
  }), /STORAGE_URL_UNPOOLED must be pooled/);
  assert.throws(() => assertRuntimeDatabaseEnvironment({
    VERCEL_ENV: 'production',
    FEED_RUNTIME_DATABASE_URL: pooledUrl.replace('feeds_app_runtime', 'feeds_migration_owner'),
  }), /fixed feeds_app_runtime/);
  assert.throws(() => assertRuntimeDatabaseEnvironment({
    VERCEL: '1',
    DATABASE_URL: directUrl.replace('feeds_migration_owner', 'feeds_app_runtime'),
  }), /must be pooled/);

  const localTestUrl = 'postgresql://feeds_hub_test:test@127.0.0.1:55432/feeds_hub_test';
  assert.doesNotThrow(() => assertRuntimeDatabaseEnvironment({ DATABASE_URL: localTestUrl }));
  assert.doesNotThrow(() => assertRuntimeDatabaseEnvironment({
    VERCEL: '1',
    VERCEL_ENV: 'production',
    FEED_DB_BOOTSTRAP_ENABLED: 'true',
    DATABASE_URL_UNPOOLED: directUrl,
  }));
});

test('runtime grant operations require their own safe deployment posture and confirmation scope', () => {
  const backup = [
    '--apply',
    `--confirm-production=feeds-hub-production:runtime-read-grants:${fingerprint}`,
    '--backup-id=snapshot-grants-123',
    '--backup-created-at=2026-07-10T08:00:00Z',
    `--backup-database-fingerprint=${fingerprint}`,
    '--backup-retain-until=2026-07-17T08:00:00Z',
    '--recovery-reference=https://console.neon.tech/snapshots/snapshot-grants-123',
  ];
  const safeEnv = {
    ...baseEnv(),
    FEED_READ_SOURCE: 'content',
    FEED_WRITES_ENABLED: 'false',
    FEED_MCP_ENABLED: 'false',
  };
  assert.doesNotThrow(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'runtime-read-grants',
    env: safeEnv,
    argv: backup,
    now: new Date('2026-07-10T09:00:00Z'),
  }));
  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'runtime-write-grants',
    env: safeEnv,
    argv: backup.map((value) => value.replace('runtime-read-grants', 'runtime-write-grants')),
    now: new Date('2026-07-10T09:00:00Z'),
  }), /FEED_READ_SOURCE/);
  assert.doesNotThrow(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'runtime-write-grants',
    env: { ...safeEnv, FEED_READ_SOURCE: 'database' },
    argv: backup.map((value) => value.replace('runtime-read-grants', 'runtime-write-grants')),
    now: new Date('2026-07-10T09:00:00Z'),
  }));
});

test('requires disabled runtime writes, explicit confirmation, and complete backup evidence for mutation', () => {
  const env = {
    ...baseEnv(),
    FEED_READ_SOURCE: 'content',
    FEED_WRITES_ENABLED: 'false',
    FEED_MCP_ENABLED: 'false',
  };
  const completeArgs = [
    '--apply',
    `--confirm-production=feeds-hub-production:markdown-import:${fingerprint}`,
    '--backup-id=snapshot-123',
    '--backup-created-at=2026-07-10T08:00:00Z',
    `--backup-database-fingerprint=${fingerprint}`,
    '--backup-retain-until=2026-07-17T08:00:00Z',
    '--recovery-reference=https://console.neon.tech/snapshots/snapshot-123',
  ];

  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'markdown-import',
    env,
    argv: completeArgs.slice(0, 2),
  }), /backup evidence/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'markdown-import',
    env,
    argv: completeArgs.map((value) => value.startsWith('--backup-database-fingerprint=')
      ? `--backup-database-fingerprint=${'0'.repeat(64)}`
      : value),
  }), /does not cover/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'markdown-import',
    env: { ...env, FEED_WRITES_ENABLED: 'true' },
    argv: completeArgs,
  }), /FEED_WRITES_ENABLED/);

  const context = validateProductionDatabaseContext({
    mutation: true,
    operation: 'markdown-import',
    env,
    argv: completeArgs,
    now: new Date('2026-07-10T09:00:00Z'),
  });
  assert.equal(context.backup?.id, 'snapshot-123');

  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'foundation-migration',
    env,
    argv: completeArgs,
    now: new Date('2026-07-10T09:00:00Z'),
  }), /foundation-migration/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'markdown-import',
    env,
    argv: completeArgs.map((value) => value.startsWith('--recovery-reference=')
      ? '--recovery-reference=https://example.com/snapshot-123'
      : value),
    now: new Date('2026-07-10T09:00:00Z'),
  }), /Neon recovery entry/);
  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'markdown-import',
    env,
    argv: completeArgs.map((value) => value.startsWith('--backup-id=') ? '--backup-id=bad/id' : value),
    now: new Date('2026-07-10T09:00:00Z'),
  }), /provider identifier/);
});

test('redacts connection URLs and credential-shaped query parameters from errors', () => {
  const output = sanitizeDatabaseError(new Error(`failed ${pooledUrl} token=abc123`), [pooledUrl]);
  assert.equal(output.includes('secret'), false);
  assert.equal(output.includes('abc123'), false);
  assert.match(output, /redacted/);
});

test('runtime forward migration requires its own exact Production confirmation scope', () => {
  const env = {
    ...baseEnv(),
    FEED_READ_SOURCE: 'content',
    FEED_WRITES_ENABLED: 'false',
    FEED_MCP_ENABLED: 'false',
  };
  const args = [
    '--apply',
    `--confirm-production=feeds-hub-production:runtime-forward-migration:${fingerprint}`,
    '--backup-id=snapshot-forward-123',
    '--backup-created-at=2026-07-10T08:00:00Z',
    `--backup-database-fingerprint=${fingerprint}`,
    '--backup-retain-until=2026-07-17T08:00:00Z',
    '--recovery-reference=https://console.neon.tech/snapshots/snapshot-forward-123',
  ];
  const context = validateProductionDatabaseContext({
    mutation: true,
    operation: 'runtime-forward-migration',
    env,
    argv: args,
    now: new Date('2026-07-10T09:00:00Z'),
  });
  assert.equal(context.backup?.id, 'snapshot-forward-123');

  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'runtime-forward-migration',
    env,
    argv: args.map((value) => value.includes('runtime-forward-migration')
      ? value.replace('runtime-forward-migration', 'foundation-migration')
      : value),
    now: new Date('2026-07-10T09:00:00Z'),
  }), /runtime-forward-migration/);

  for (const [changedEnv, expected] of [
    [{ ...env, FEED_READ_SOURCE: 'database' }, /FEED_READ_SOURCE/],
    [{ ...env, FEED_WRITES_ENABLED: 'true' }, /FEED_WRITES_ENABLED/],
    [{ ...env, FEED_MCP_ENABLED: 'true' }, /FEED_MCP_ENABLED/],
  ] as const) {
    assert.throws(() => validateProductionDatabaseContext({
      mutation: true,
      operation: 'runtime-forward-migration',
      env: changedEnv,
      argv: args,
      now: new Date('2026-07-10T09:00:00Z'),
    }), expected);
  }
  assert.throws(() => validateProductionDatabaseContext({
    mutation: true,
    operation: 'runtime-forward-migration',
    env,
    argv: args.filter((value) => value !== '--apply'),
    now: new Date('2026-07-10T09:00:00Z'),
  }), /--apply/);
});

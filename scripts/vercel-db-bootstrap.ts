import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { neon } from '@neondatabase/serverless';
import { PRODUCTION_RUNTIME_ROLE } from '../src/db/runtime-environment';
import { assertRuntimeForwardSchema } from './lib/production-guard';
import { assertRuntimeGrants } from './lib/runtime-grants';
import {
  BOOTSTRAP_STATUS_PATH,
  createRuntimeDatabaseUrl,
  getBootstrapArguments,
  getBootstrapFingerprint,
  resolveBootstrapConfiguration,
} from './lib/vercel-db-bootstrap';

await rm(BOOTSTRAP_STATUS_PATH, { force: true });
const configuration = resolveBootstrapConfiguration(process.env);
if (!configuration) process.exit(0);

const runtime = createRuntimeDatabaseUrl(configuration);
const fingerprint = getBootstrapFingerprint(runtime.identity);
const ownerSql = neon(configuration.ownerDirectUrl);

try {
  await ownerSql.query(`
    DO $bootstrap$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${PRODUCTION_RUNTIME_ROLE}') THEN
        CREATE ROLE ${PRODUCTION_RUNTIME_ROLE}
          WITH LOGIN PASSWORD '${configuration.runtimePassword}'
          NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
      END IF;
    END
    $bootstrap$
  `);

  const commandEnv = {
    ...process.env,
    DATABASE_URL: runtime.url,
    DATABASE_URL_UNPOOLED: configuration.ownerDirectUrl,
    FEED_DB_TARGET: 'production',
    FEED_DB_EXPECTED_MIGRATION_ROLE: runtime.identity.ownerRole,
    FEED_DB_EXPECTED_FINGERPRINT: fingerprint,
    FEED_READ_SOURCE: 'content',
    FEED_WRITES_ENABLED: 'false',
    FEED_MCP_ENABLED: 'false',
  };
  const steps = [
    ['scripts/db-migrate.ts', 'foundation-migration'],
    ['scripts/db-migrate-forward.ts', 'runtime-forward-migration'],
    ['scripts/db-grant-runtime-write.ts', 'runtime-write-grants'],
  ] as const;

  const existing = await ownerSql`select to_regclass('public.feeds')::text as feeds` as Array<{ feeds: string | null }>;
  if (existing[0]?.feeds) {
    await assertRuntimeForwardSchema(ownerSql);
    await assertRuntimeGrants(ownerSql, 'write');
    const runtimeSql = neon(runtime.url);
    const runtimeIdentity = await runtimeSql`select current_database() as database, current_user as role` as Array<{
      database: string;
      role: string;
    }>;
    if (
      runtimeIdentity[0]?.database !== runtime.identity.database
      || runtimeIdentity[0]?.role !== PRODUCTION_RUNTIME_ROLE
    ) {
      throw new Error('Existing runtime database identity does not match the reviewed bootstrap target');
    }
  } else {
    for (const [script, operation] of steps) {
      if (operation === 'runtime-write-grants') commandEnv.FEED_READ_SOURCE = 'database';
      const result = spawnSync('pnpm', [
        'exec',
        'tsx',
        script,
        ...getBootstrapArguments(operation, fingerprint, configuration),
      ], {
        cwd: process.cwd(),
        env: commandEnv,
        encoding: 'utf8',
      });
      if (result.status !== 0) {
        throw new Error(`${operation} failed: ${(result.stderr || result.stdout || 'unknown failure').slice(0, 1000)}`);
      }
    }
  }

  const status = {
    ok: true,
    database: runtime.identity.database,
    pooledHost: runtime.identity.pooledHost,
    runtimeRole: PRODUCTION_RUNTIME_ROLE,
    databaseFingerprint: fingerprint,
    completedAt: new Date().toISOString(),
  };
  await mkdir('public/.well-known', { recursive: true });
  await writeFile(BOOTSTRAP_STATUS_PATH, `${JSON.stringify(status)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ ok: true, database: status.database, runtimeRole: status.runtimeRole }));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const redacted = message
    .replaceAll(configuration.ownerPooledUrl, '[redacted]')
    .replaceAll(configuration.ownerDirectUrl, '[redacted]')
    .replaceAll(configuration.runtimePassword, '[redacted]');
  console.error(`Vercel database bootstrap failed: ${redacted}`);
  process.exit(1);
}

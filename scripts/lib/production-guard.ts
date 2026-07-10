import { createHash } from 'node:crypto';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { PRODUCTION_RUNTIME_ROLE } from '../../src/db/runtime-environment';

export { PRODUCTION_RUNTIME_ROLE } from '../../src/db/runtime-environment';

const MAX_BACKUP_AGE_MS = 24 * 60 * 60 * 1000;

interface ConnectionIdentity {
  endpoint: string;
  database: string;
  role: string;
  pooled: boolean;
}

export interface ProductionDatabaseContext {
  pooledUrl: string;
  directUrl: string;
  fingerprint: string;
  database: string;
  runtimeRole: typeof PRODUCTION_RUNTIME_ROLE;
  migrationRole: string;
  backup?: {
    id: string;
    createdAt: string;
    databaseFingerprint: string;
    retainUntil: string;
    recoveryReference: string;
  };
}

export type ProductionMutationOperation =
  | 'foundation-migration'
  | 'runtime-forward-migration'
  | 'markdown-import'
  | 'runtime-read-grants'
  | 'runtime-write-grants';

function sha256(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function getArgument(argv: string[], name: string) {
  const exact = argv.find((value) => value.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function parseConnectionIdentity(value: string, expectedPooled: boolean): ConnectionIdentity {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Database URL is invalid');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Database URL must use PostgreSQL');
  if (!url.hostname.endsWith('.neon.tech')) throw new Error('Database URL must target Neon');

  const firstLabel = url.hostname.split('.')[0];
  const pooled = firstLabel.endsWith('-pooler');
  if (pooled !== expectedPooled) {
    throw new Error(expectedPooled ? 'DATABASE_URL must be pooled' : 'DATABASE_URL_UNPOOLED must be direct');
  }

  const endpoint = [firstLabel.replace(/-pooler$/, ''), ...url.hostname.split('.').slice(1)].join('.');
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const role = decodeURIComponent(url.username);
  if (!database || !role) throw new Error('Database URL must include a database and role');

  return { endpoint, database, role, pooled };
}

function requireExactValue(env: NodeJS.ProcessEnv, key: string, expected: string) {
  if (env[key] !== expected) throw new Error(`${key} must equal ${expected}`);
}

export function validateProductionDatabaseContext(options: {
  env?: NodeJS.ProcessEnv;
  argv?: string[];
  mutation: boolean;
  operation?: ProductionMutationOperation;
  now?: Date;
}): ProductionDatabaseContext {
  const env = options.env ?? process.env;
  const argv = options.argv ?? process.argv.slice(2);
  const pooledUrl = env.DATABASE_URL;
  const directUrl = env.DATABASE_URL_UNPOOLED;

  requireExactValue(env, 'FEED_DB_TARGET', 'production');
  if (!pooledUrl || !directUrl) throw new Error('DATABASE_URL and DATABASE_URL_UNPOOLED are both required');

  const pooledIdentity = parseConnectionIdentity(pooledUrl, true);
  const directIdentity = parseConnectionIdentity(directUrl, false);
  if (pooledIdentity.endpoint !== directIdentity.endpoint || pooledIdentity.database !== directIdentity.database) {
    throw new Error('Pooled runtime and direct migration URLs must resolve to the same endpoint and database');
  }
  if (pooledIdentity.role !== PRODUCTION_RUNTIME_ROLE) {
    throw new Error(`DATABASE_URL must use the fixed ${PRODUCTION_RUNTIME_ROLE} runtime role`);
  }
  const expectedMigrationRole = env.FEED_DB_EXPECTED_MIGRATION_ROLE;
  if (!expectedMigrationRole || !/^[a-z_][a-z0-9_]{0,62}$/.test(expectedMigrationRole)) {
    throw new Error('FEED_DB_EXPECTED_MIGRATION_ROLE must contain the reviewed migration owner role');
  }
  if (directIdentity.role !== expectedMigrationRole) {
    throw new Error('DATABASE_URL_UNPOOLED does not use FEED_DB_EXPECTED_MIGRATION_ROLE');
  }
  if (directIdentity.role === pooledIdentity.role) {
    throw new Error('Runtime and migration database roles must be different');
  }

  const fingerprint = sha256(JSON.stringify({
    endpoint: pooledIdentity.endpoint,
    database: pooledIdentity.database,
    runtimeRole: pooledIdentity.role,
    migrationRole: directIdentity.role,
  }));
  const expectedFingerprint = env.FEED_DB_EXPECTED_FINGERPRINT;
  if (!expectedFingerprint || !/^[0-9a-f]{64}$/.test(expectedFingerprint)) {
    throw new Error('FEED_DB_EXPECTED_FINGERPRINT must contain the reviewed database fingerprint');
  }
  if (fingerprint !== expectedFingerprint) {
    throw new Error('Database identity does not match FEED_DB_EXPECTED_FINGERPRINT');
  }

  const context = {
    pooledUrl,
    directUrl,
    fingerprint,
    database: pooledIdentity.database,
    runtimeRole: PRODUCTION_RUNTIME_ROLE,
    migrationRole: directIdentity.role,
  } as const;

  if (!options.mutation) return context;

  requireExactValue(env, 'FEED_WRITES_ENABLED', 'false');
  requireExactValue(env, 'FEED_MCP_ENABLED', 'false');
  if (!options.operation) throw new Error('Production mutation requires an operation scope');
  if (options.operation === 'runtime-read-grants') {
    if (!['content', 'database'].includes(env.FEED_READ_SOURCE ?? '')) {
      throw new Error('FEED_READ_SOURCE must equal content or database for runtime read grants');
    }
  } else if (options.operation === 'runtime-write-grants') {
    requireExactValue(env, 'FEED_READ_SOURCE', 'database');
  } else {
    requireExactValue(env, 'FEED_READ_SOURCE', 'content');
  }
  if (!argv.includes('--apply')) throw new Error('Production mutation requires --apply');
  const confirmation = `feeds-hub-production:${options.operation}:${fingerprint}`;
  if (getArgument(argv, '--confirm-production') !== confirmation) {
    throw new Error(`Production mutation requires --confirm-production=${confirmation}`);
  }

  const backup = {
    id: getArgument(argv, '--backup-id') ?? '',
    createdAt: getArgument(argv, '--backup-created-at') ?? '',
    databaseFingerprint: getArgument(argv, '--backup-database-fingerprint') ?? '',
    retainUntil: getArgument(argv, '--backup-retain-until') ?? '',
    recoveryReference: getArgument(argv, '--recovery-reference') ?? '',
  };
  if (Object.values(backup).some((value) => !value.trim())) {
    throw new Error('Production mutation requires complete backup evidence arguments');
  }
  if (!/^[A-Za-z0-9._:-]{4,200}$/.test(backup.id)) {
    throw new Error('Backup evidence contains an invalid provider identifier');
  }
  if (backup.databaseFingerprint !== fingerprint) {
    throw new Error('Backup evidence does not cover the reviewed database identity');
  }
  const now = options.now ?? new Date();
  const createdAt = new Date(backup.createdAt);
  if (
    Number.isNaN(createdAt.getTime())
    || createdAt.getTime() >= now.getTime()
    || now.getTime() - createdAt.getTime() > MAX_BACKUP_AGE_MS
  ) {
    throw new Error('Backup evidence must be valid, predate the operation, and be no more than 24 hours old');
  }
  const retainUntil = new Date(backup.retainUntil);
  if (Number.isNaN(retainUntil.getTime()) || retainUntil.getTime() <= now.getTime()) {
    throw new Error('Backup evidence must remain retained after the operation');
  }
  let recoveryEntry: URL;
  try {
    recoveryEntry = new URL(backup.recoveryReference);
  } catch {
    throw new Error('Backup evidence must include a valid Neon recovery entry');
  }
  if (
    recoveryEntry.protocol !== 'https:'
    || recoveryEntry.hostname !== 'console.neon.tech'
    || recoveryEntry.pathname === '/'
    || recoveryEntry.username
    || recoveryEntry.password
  ) {
    throw new Error('Backup evidence must include a valid Neon recovery entry');
  }

  return { ...context, backup };
}

export async function probeDatabaseIdentity(context: ProductionDatabaseContext) {
  const pooled = neon(context.pooledUrl);
  const direct = neon(context.directUrl);
  const [pooledRows, directRows] = await Promise.all([
    pooled`select current_database() as database, current_user as role`,
    direct`select current_database() as database, current_user as role`,
  ]);
  const pooledRow = pooledRows[0] as { database?: string; role?: string } | undefined;
  const directRow = directRows[0] as { database?: string; role?: string } | undefined;
  if (
    !pooledRow
    || !directRow
    || pooledRow.database !== context.database
    || directRow.database !== context.database
    || pooledRow.role !== context.runtimeRole
    || directRow.role !== context.migrationRole
  ) {
    throw new Error('Read-only runtime and migration identity probes do not match the reviewed roles');
  }
  return { fingerprint: context.fingerprint };
}

export async function assertEmptyApplicationSchema(sql: NeonQueryFunction<false, false>) {
  const relations = await sql`
    select n.nspname as schema, c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'drizzle')
      and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
    order by n.nspname, c.relname
  ` as Array<{ schema: string; name: string }>;
  const enumRows = await sql`
    select t.typname as name
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
    order by t.typname
  ` as Array<{ name: string }>;
  if (relations.length || enumRows.length) {
    throw new Error('Production application schema is not empty');
  }
}

export async function assertFoundationSchema(sql: NeonQueryFunction<false, false>) {
  const tables = await sql`
    select table_schema as schema, table_name as name
    from information_schema.tables
    where (table_schema = 'public' and table_name in ('feeds', 'feed_import_runs'))
       or (table_schema = 'drizzle' and table_name = '__drizzle_migrations')
    order by table_schema, table_name
  ` as Array<{ schema: string; name: string }>;
  const names = new Set(tables.map((row) => `${row.schema}.${row.name}`));
  for (const required of ['public.feeds', 'public.feed_import_runs', 'drizzle.__drizzle_migrations']) {
    if (!names.has(required)) throw new Error(`Foundation schema verification failed: missing ${required}`);
  }
}

export async function assertRuntimeForwardSchema(sql: NeonQueryFunction<false, false>) {
  await assertFoundationSchema(sql);
  const tables = await sql`
    select table_name as name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('feed_revisions', 'feed_audit_events', 'feed_idempotency_keys')
    order by table_name
  ` as Array<{ name: string }>;
  const tableNames = new Set(tables.map((row) => row.name));
  for (const required of ['feed_revisions', 'feed_audit_events', 'feed_idempotency_keys']) {
    if (!tableNames.has(required)) throw new Error(`Runtime forward verification failed: missing public.${required}`);
  }

  const extensions = await sql`
    select extname as name from pg_extension where extname = 'pg_trgm'
  ` as Array<{ name: string }>;
  if (extensions.length !== 1) throw new Error('Runtime forward verification failed: missing pg_trgm');

  const triggers = await sql`
    select trigger_name as name, event_object_table as table_name
    from information_schema.triggers
    where trigger_schema = 'public'
      and trigger_name in (
        'feeds_reject_delete',
        'feed_revisions_reject_mutation',
        'feed_audit_events_reject_mutation',
        'feed_idempotency_keys_reject_mutation'
      )
    order by trigger_name
  ` as Array<{ name: string; table_name: string }>;
  const triggerKeys = new Set(triggers.map((row) => `${row.table_name}.${row.name}`));
  for (const required of [
    'feeds.feeds_reject_delete',
    'feed_revisions.feed_revisions_reject_mutation',
    'feed_audit_events.feed_audit_events_reject_mutation',
    'feed_idempotency_keys.feed_idempotency_keys_reject_mutation',
  ]) {
    if (!triggerKeys.has(required)) throw new Error(`Runtime forward verification failed: missing trigger ${required}`);
  }
}

export function createDirectQuery(context: ProductionDatabaseContext) {
  return neon(context.directUrl);
}

export function sanitizeDatabaseError(error: unknown, secrets: string[] = []) {
  let message = error instanceof Error ? error.message : String(error);
  for (const secret of secrets) {
    if (secret) message = message.split(secret).join('[redacted]');
  }
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, '[postgres-url]')
    .replace(/(password|token|apikey|api_key)=([^\s&]+)/gi, '$1=[redacted]');
}

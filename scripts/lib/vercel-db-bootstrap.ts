import { createHash } from 'node:crypto';
import { PRODUCTION_RUNTIME_ROLE } from '../../src/db/runtime-environment';

export const BOOTSTRAP_STATUS_PATH = 'public/.well-known/feed-db-bootstrap.json';

export interface BootstrapConnectionIdentity {
  pooledHost: string;
  endpoint: string;
  database: string;
  ownerRole: string;
}

export interface BootstrapConfiguration {
  sourceCommit: string;
  ownerPooledUrl: string;
  ownerDirectUrl: string;
  runtimePassword: string;
  backup: {
    id: string;
    createdAt: string;
    retainUntil: string;
    recoveryReference: string;
  };
}

function parseNeonUrl(value: string, expectedPooled: boolean) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Bootstrap database URL is invalid');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname.endsWith('.neon.tech')) {
    throw new Error('Bootstrap database URL must target Neon PostgreSQL');
  }
  const firstLabel = url.hostname.split('.')[0];
  const pooled = firstLabel.endsWith('-pooler');
  if (pooled !== expectedPooled) {
    throw new Error(expectedPooled ? 'Bootstrap DATABASE_URL must be pooled' : 'Bootstrap DATABASE_URL_UNPOOLED must be direct');
  }
  const endpoint = [firstLabel.replace(/-pooler$/, ''), ...url.hostname.split('.').slice(1)].join('.');
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const role = decodeURIComponent(url.username);
  if (!database || !role) throw new Error('Bootstrap database URL must include a database and role');
  return { url, endpoint, database, role };
}

function requireValue(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required for the one-time database bootstrap`);
  return value;
}

export function resolveBootstrapConfiguration(env: NodeJS.ProcessEnv): BootstrapConfiguration | undefined {
  if (env.FEED_DB_BOOTSTRAP_ENABLED !== 'true') return undefined;
  if (env.VERCEL !== '1' || env.VERCEL_ENV !== 'production') {
    throw new Error('Database bootstrap may run only in a Vercel Production build');
  }
  if (env.FEED_READ_SOURCE !== 'content' || env.FEED_WRITES_ENABLED !== 'false' || env.FEED_MCP_ENABLED !== 'false') {
    throw new Error('Database bootstrap requires content reads with MCP and writes disabled');
  }

  const runtimePassword = requireValue(env, 'FEED_DB_BOOTSTRAP_RUNTIME_PASSWORD');
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(runtimePassword)) {
    throw new Error('FEED_DB_BOOTSTRAP_RUNTIME_PASSWORD must be a 43-128 character base64url secret');
  }
  const sourceCommit = requireValue(env, 'FEED_DB_BOOTSTRAP_SOURCE_COMMIT');
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) {
    throw new Error('FEED_DB_BOOTSTRAP_SOURCE_COMMIT must be a full reviewed Git commit SHA');
  }
  if (env.VERCEL_GIT_COMMIT_SHA && env.VERCEL_GIT_COMMIT_SHA !== sourceCommit) {
    throw new Error('Vercel deployment commit does not match FEED_DB_BOOTSTRAP_SOURCE_COMMIT');
  }

  const backup = {
    id: requireValue(env, 'FEED_DB_BOOTSTRAP_BACKUP_ID'),
    createdAt: requireValue(env, 'FEED_DB_BOOTSTRAP_BACKUP_CREATED_AT'),
    retainUntil: requireValue(env, 'FEED_DB_BOOTSTRAP_BACKUP_RETAIN_UNTIL'),
    recoveryReference: requireValue(env, 'FEED_DB_BOOTSTRAP_RECOVERY_REFERENCE'),
  };
  const now = Date.now();
  const createdAt = Date.parse(backup.createdAt);
  const retainUntil = Date.parse(backup.retainUntil);
  if (!Number.isFinite(createdAt) || createdAt >= now || now - createdAt > 24 * 60 * 60 * 1000) {
    throw new Error('Bootstrap backup must predate the build by no more than 24 hours');
  }
  if (!Number.isFinite(retainUntil) || retainUntil <= now) {
    throw new Error('Bootstrap backup must remain retained after the build');
  }
  const recoveryUrl = new URL(backup.recoveryReference);
  if (recoveryUrl.protocol !== 'https:' || recoveryUrl.hostname !== 'console.neon.tech' || recoveryUrl.pathname === '/') {
    throw new Error('Bootstrap recovery reference must be a Neon Console branch URL');
  }

  return {
    sourceCommit,
    ownerPooledUrl: requireValue(env, 'DATABASE_URL'),
    ownerDirectUrl: requireValue(env, 'DATABASE_URL_UNPOOLED'),
    runtimePassword,
    backup,
  };
}

export function createRuntimeDatabaseUrl(configuration: BootstrapConfiguration) {
  const pooled = parseNeonUrl(configuration.ownerPooledUrl, true);
  const direct = parseNeonUrl(configuration.ownerDirectUrl, false);
  if (pooled.endpoint !== direct.endpoint || pooled.database !== direct.database || pooled.role !== direct.role) {
    throw new Error('Bootstrap pooled and direct owner URLs must target the same database and role');
  }
  if (pooled.role === PRODUCTION_RUNTIME_ROLE) {
    throw new Error('Bootstrap owner role must differ from the runtime role');
  }

  pooled.url.username = PRODUCTION_RUNTIME_ROLE;
  pooled.url.password = configuration.runtimePassword;
  return {
    url: pooled.url.toString(),
    identity: {
      pooledHost: pooled.url.hostname,
      endpoint: pooled.endpoint,
      database: pooled.database,
      ownerRole: pooled.role,
    } satisfies BootstrapConnectionIdentity,
  };
}

export function getBootstrapFingerprint(identity: BootstrapConnectionIdentity) {
  return createHash('sha256').update(JSON.stringify({
    endpoint: identity.endpoint,
    database: identity.database,
    runtimeRole: PRODUCTION_RUNTIME_ROLE,
    migrationRole: identity.ownerRole,
  }), 'utf8').digest('hex');
}

export function getBootstrapArguments(
  operation: 'foundation-migration' | 'runtime-forward-migration' | 'runtime-write-grants',
  fingerprint: string,
  configuration: BootstrapConfiguration,
) {
  return [
    '--apply',
    `--confirm-production=feeds-hub-production:${operation}:${fingerprint}`,
    `--backup-id=${configuration.backup.id}`,
    `--backup-created-at=${configuration.backup.createdAt}`,
    `--backup-database-fingerprint=${fingerprint}`,
    `--backup-retain-until=${configuration.backup.retainUntil}`,
    `--recovery-reference=${configuration.backup.recoveryReference}`,
  ];
}

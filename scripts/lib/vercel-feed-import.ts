import { createHash } from 'node:crypto';
import { PRODUCTION_RUNTIME_ROLE, RUNTIME_DATABASE_URL_KEY } from '../../src/db/runtime-environment';

export interface VercelFeedImportConfiguration {
  mode: 'plan' | 'apply';
  sourceCommit: string;
  runtimeUrl: string;
  databaseFingerprint: string;
  backup?: {
    id: string;
    createdAt: string;
    retainUntil: string;
    recoveryReference: string;
  };
}

function requireValue(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required for the one-time Feed import`);
  return value;
}

export function getRuntimeImportFingerprint(runtimeUrl: string) {
  const url = new URL(runtimeUrl);
  const firstLabel = url.hostname.split('.')[0];
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol)
    || !url.hostname.endsWith('.neon.tech')
    || !firstLabel.endsWith('-pooler')
    || decodeURIComponent(url.username) !== PRODUCTION_RUNTIME_ROLE
    || !url.pathname.slice(1)
  ) {
    throw new Error(`One-time Feed import requires pooled Neon ${PRODUCTION_RUNTIME_ROLE} credentials`);
  }
  const endpoint = [firstLabel.replace(/-pooler$/, ''), ...url.hostname.split('.').slice(1)].join('.');
  return createHash('sha256').update(JSON.stringify({
    endpoint,
    database: decodeURIComponent(url.pathname.slice(1)),
    runtimeRole: PRODUCTION_RUNTIME_ROLE,
  }), 'utf8').digest('hex');
}

export function resolveVercelFeedImportConfiguration(
  env: NodeJS.ProcessEnv,
  now = new Date(),
): VercelFeedImportConfiguration | undefined {
  if (env.FEED_CONTENT_IMPORT_ENABLED !== 'true') return undefined;
  if (env.VERCEL !== '1' || env.VERCEL_ENV !== 'production') {
    throw new Error('One-time Feed import may run only in a Vercel Production build');
  }
  if (env.FEED_READ_SOURCE !== 'content' || env.FEED_WRITES_ENABLED !== 'false' || env.FEED_MCP_ENABLED !== 'false') {
    throw new Error('One-time Feed import requires content reads with MCP and writes disabled');
  }
  const sourceCommit = requireValue(env, 'FEED_CONTENT_IMPORT_SOURCE_COMMIT');
  if (!/^[0-9a-f]{40}$/.test(sourceCommit) || env.VERCEL_GIT_COMMIT_SHA !== sourceCommit) {
    throw new Error('One-time Feed import source commit must equal the Vercel deployment commit');
  }
  const runtimeUrl = requireValue(env, RUNTIME_DATABASE_URL_KEY);
  const databaseFingerprint = getRuntimeImportFingerprint(runtimeUrl);
  const mode = requireValue(env, 'FEED_CONTENT_IMPORT_MODE');
  if (mode !== 'plan' && mode !== 'apply') throw new Error('FEED_CONTENT_IMPORT_MODE must equal plan or apply');
  if (mode === 'plan') {
    return { mode, sourceCommit, runtimeUrl, databaseFingerprint };
  }
  if (requireValue(env, 'FEED_CONTENT_IMPORT_DATABASE_FINGERPRINT') !== databaseFingerprint) {
    throw new Error('One-time Feed import database fingerprint does not match the runtime database');
  }
  const backup = {
    id: requireValue(env, 'FEED_CONTENT_IMPORT_BACKUP_ID'),
    createdAt: requireValue(env, 'FEED_CONTENT_IMPORT_BACKUP_CREATED_AT'),
    retainUntil: requireValue(env, 'FEED_CONTENT_IMPORT_BACKUP_RETAIN_UNTIL'),
    recoveryReference: requireValue(env, 'FEED_CONTENT_IMPORT_RECOVERY_REFERENCE'),
  };
  if (!/^[A-Za-z0-9._:-]{4,200}$/.test(backup.id)) throw new Error('Feed import backup identifier is invalid');
  const createdAt = Date.parse(backup.createdAt);
  const retainUntil = Date.parse(backup.retainUntil);
  if (!Number.isFinite(createdAt) || createdAt >= now.getTime() || now.getTime() - createdAt > 24 * 60 * 60 * 1000) {
    throw new Error('Feed import backup must predate the build by no more than 24 hours');
  }
  if (!Number.isFinite(retainUntil) || retainUntil <= now.getTime()) {
    throw new Error('Feed import backup must remain retained after the build');
  }
  const recoveryUrl = new URL(backup.recoveryReference);
  if (recoveryUrl.protocol !== 'https:' || recoveryUrl.hostname !== 'console.neon.tech' || recoveryUrl.pathname === '/') {
    throw new Error('Feed import recovery reference must be a Neon Console entry');
  }
  return { mode, sourceCommit, runtimeUrl, databaseFingerprint, backup };
}

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getRuntimeImportFingerprint,
  resolveVercelFeedImportConfiguration,
} from '../scripts/lib/vercel-feed-import';
import { readFile } from 'node:fs/promises';

const runtimeUrl = 'postgresql://feeds_app_runtime:secret@ep-example-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sourceCommit = 'a'.repeat(40);
const now = new Date('2026-07-13T04:00:00Z');

function enabledEnv(): NodeJS.ProcessEnv {
  return {
    FEED_CONTENT_IMPORT_ENABLED: 'true', VERCEL: '1', VERCEL_ENV: 'production',
    VERCEL_GIT_COMMIT_SHA: sourceCommit, FEED_READ_SOURCE: 'content',
    FEED_WRITES_ENABLED: 'false', FEED_MCP_ENABLED: 'false',
    FEED_CONTENT_IMPORT_SOURCE_COMMIT: sourceCommit,
    FEED_CONTENT_IMPORT_MODE: 'apply',
    FEED_RUNTIME_DATABASE_URL: runtimeUrl,
    FEED_CONTENT_IMPORT_DATABASE_FINGERPRINT: getRuntimeImportFingerprint(runtimeUrl),
    FEED_CONTENT_IMPORT_BACKUP_ID: 'branch-backup-1234',
    FEED_CONTENT_IMPORT_BACKUP_CREATED_AT: '2026-07-13T03:00:00Z',
    FEED_CONTENT_IMPORT_BACKUP_RETAIN_UNTIL: '2026-07-20T04:00:00Z',
    FEED_CONTENT_IMPORT_RECOVERY_REFERENCE: 'https://console.neon.tech/app/projects/project/branches/branch',
  };
}

test('one-time Feed import is disabled by default', () => {
  assert.equal(resolveVercelFeedImportConfiguration({}, now), undefined);
});

test('plan mode derives the redacted fingerprint without backup or secret export', () => {
  const env = enabledEnv();
  env.FEED_CONTENT_IMPORT_MODE = 'plan';
  for (const key of Object.keys(env)) {
    if (key.startsWith('FEED_CONTENT_IMPORT_BACKUP_') || key === 'FEED_CONTENT_IMPORT_RECOVERY_REFERENCE') delete env[key];
  }
  delete env.FEED_CONTENT_IMPORT_DATABASE_FINGERPRINT;
  const configuration = resolveVercelFeedImportConfiguration(env, now);
  assert.equal(configuration?.mode, 'plan');
  assert.equal(configuration?.databaseFingerprint, getRuntimeImportFingerprint(runtimeUrl));
});

test('one-time Feed import binds Production, commit, runtime role and backup evidence', () => {
  const configuration = resolveVercelFeedImportConfiguration(enabledEnv(), now);
  assert.ok(configuration);
  assert.equal(configuration.sourceCommit, sourceCommit);
  assert.equal(configuration.databaseFingerprint, getRuntimeImportFingerprint(runtimeUrl));
});

test('one-time Feed import rejects unsafe posture and database identity', () => {
  assert.throws(() => resolveVercelFeedImportConfiguration({ ...enabledEnv(), FEED_MCP_ENABLED: 'true' }, now), /MCP and writes disabled/);
  assert.throws(() => resolveVercelFeedImportConfiguration({ ...enabledEnv(), VERCEL_GIT_COMMIT_SHA: 'b'.repeat(40) }, now), /deployment commit/);
  assert.throws(() => resolveVercelFeedImportConfiguration({
    ...enabledEnv(),
    FEED_RUNTIME_DATABASE_URL: runtimeUrl.replace('feeds_app_runtime', 'neondb_owner'),
  }, now), /feeds_app_runtime/);
});

test('runtime importer verifies hidden schema objects through catalogs without requiring table grants', async () => {
  const source = await readFile('scripts/vercel-feed-import.ts', 'utf8');
  assert.match(source, /to_regclass\('public\.feed_import_runs'\)/);
  assert.match(source, /from pg_trigger/);
  assert.doesNotMatch(source, /assertRuntimeForwardSchema/);
});

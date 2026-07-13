import { neon } from '@neondatabase/serverless';
import { applyRuntimeImport, fetchDatabaseFeeds, fetchExistingFeedIdentities } from './lib/database-feed';
import { buildImportPlan, loadContentBatch, stableJson } from './lib/feed-content';
import { verifyFeedDatabase } from './lib/feed-verify';
import { sanitizeDatabaseError } from './lib/production-guard';
import { assertRuntimeGrants } from './lib/runtime-grants';
import { resolveVercelFeedImportConfiguration } from './lib/vercel-feed-import';

const configuration = resolveVercelFeedImportConfiguration(process.env);
if (!configuration) process.exit(0);

const sql = neon(configuration.runtimeUrl);
try {
  const schema = await sql`
    select
      to_regclass('public.feeds')::text as feeds,
      to_regclass('public.feed_import_runs')::text as import_runs,
      to_regclass('public.feed_revisions')::text as revisions,
      to_regclass('public.feed_audit_events')::text as audit_events,
      to_regclass('public.feed_idempotency_keys')::text as idempotency_keys,
      exists (select 1 from pg_extension where extname = 'pg_trgm') as pg_trgm,
      (select count(*)::integer from pg_trigger
        where not tgisinternal and tgname in (
          'feeds_reject_delete', 'feed_revisions_reject_mutation',
          'feed_audit_events_reject_mutation', 'feed_idempotency_keys_reject_mutation'
        )) as protection_triggers
  ` as Array<Record<string, string | boolean | number | null>>;
  const verifiedSchema = schema[0];
  if (
    !verifiedSchema
    || verifiedSchema.feeds !== 'feeds'
    || verifiedSchema.import_runs !== 'feed_import_runs'
    || verifiedSchema.revisions !== 'feed_revisions'
    || verifiedSchema.audit_events !== 'feed_audit_events'
    || verifiedSchema.idempotency_keys !== 'feed_idempotency_keys'
    || verifiedSchema.pg_trgm !== true
    || verifiedSchema.protection_triggers !== 4
  ) {
    throw new Error('Runtime import schema verification failed');
  }
  await assertRuntimeGrants(sql, 'write');
  const identity = await sql`select current_user as role` as Array<{ role: string }>;
  if (identity[0]?.role !== 'feeds_app_runtime') throw new Error('Runtime import database role mismatch');
  const batch = await loadContentBatch();
  const plan = buildImportPlan(batch, await fetchExistingFeedIdentities(sql));
  if (batch.failures.length || plan.counts.update || plan.counts.invalid || plan.counts.conflict) {
    throw new Error('Runtime initialization plan must contain only insert or unchanged entries');
  }
  if (configuration.mode === 'plan') {
    console.log(stableJson({
      ok: true,
      mode: 'vercel-production-runtime-import-plan',
      sourceCommit: configuration.sourceCommit,
      sourceTreeHash: batch.sourceTreeHash,
      databaseFingerprint: configuration.databaseFingerprint,
      counts: plan.counts,
      duplicateSourceUrls: batch.duplicateSourceUrls,
    }));
    process.exit(0);
  }
  const result = await applyRuntimeImport({ sql, feeds: batch.feeds, plan });
  const verification = verifyFeedDatabase({
    markdown: batch.feeds,
    database: await fetchDatabaseFeeds(sql),
    duplicateSourceUrls: batch.duplicateSourceUrls,
  });
  if (!verification.ok) throw new Error('Runtime import post-verification failed');
  console.log(stableJson({
    ok: true,
    mode: 'vercel-production-runtime-import',
    sourceCommit: configuration.sourceCommit,
    sourceTreeHash: batch.sourceTreeHash,
    databaseFingerprint: configuration.databaseFingerprint,
    counts: plan.counts,
    result,
    verification: verification.counts,
  }));
} catch (error) {
  console.error(sanitizeDatabaseError(error, [configuration.runtimeUrl]));
  process.exit(1);
}

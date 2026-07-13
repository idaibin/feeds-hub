import { neon } from '@neondatabase/serverless';
import { applyRuntimeImport, fetchDatabaseFeeds, fetchExistingFeedIdentities } from './lib/database-feed';
import { buildImportPlan, loadContentBatch, stableJson } from './lib/feed-content';
import { verifyFeedDatabase } from './lib/feed-verify';
import { assertRuntimeForwardSchema, sanitizeDatabaseError } from './lib/production-guard';
import { assertRuntimeGrants } from './lib/runtime-grants';
import { resolveVercelFeedImportConfiguration } from './lib/vercel-feed-import';

const configuration = resolveVercelFeedImportConfiguration(process.env);
if (!configuration) process.exit(0);

const sql = neon(configuration.runtimeUrl);
try {
  await assertRuntimeForwardSchema(sql);
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

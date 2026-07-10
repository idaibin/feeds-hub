import {
  assertCleanGitWorktree,
  buildImportPlan,
  getGitSourceCommit,
  getMigrationHash,
  loadContentBatch,
  stableJson,
} from './lib/feed-content';
import { applyImport, fetchExistingFeedIdentities, findImportRun } from './lib/database-feed';
import {
  assertFoundationSchema,
  createDirectQuery,
  probeDatabaseIdentity,
  sanitizeDatabaseError,
  validateProductionDatabaseContext,
} from './lib/production-guard';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const compareDatabase = argv.includes('--database');
const batch = await loadContentBatch();

if (dryRun && !compareDatabase) {
  const plan = buildImportPlan(batch, []);
  console.log(stableJson({
    ok: plan.counts.invalid === 0 && plan.counts.conflict === 0,
    mode: 'offline-dry-run',
    databaseCompared: false,
    assumedEmptyTarget: true,
    sourceTreeHash: batch.sourceTreeHash,
    counts: plan.counts,
    duplicateSourceUrls: batch.duplicateSourceUrls,
    failures: batch.failures,
  }));
  if (plan.counts.invalid || plan.counts.conflict) process.exitCode = 1;
} else {
  const context = validateProductionDatabaseContext({
    mutation: !dryRun,
    operation: dryRun ? undefined : 'markdown-import',
    argv,
  });
  const sql = createDirectQuery(context);
  try {
    await probeDatabaseIdentity(context);
    await assertFoundationSchema(sql);
    const sourceCommit = getGitSourceCommit();
    const existing = await fetchExistingFeedIdentities(sql);
    const plan = buildImportPlan(batch, existing);
    const existingRun = await findImportRun(sql, sourceCommit);
    if (existingRun) {
      if (existingRun.sourceTreeHash !== batch.sourceTreeHash || existingRun.status !== 'succeeded') {
        throw new Error('Existing import run does not match the current source tree');
      }
      if (
        plan.counts.insert !== 0
        || plan.counts.update !== 0
        || plan.counts.conflict !== 0
        || plan.counts.invalid !== 0
        || plan.counts.unchanged !== batch.feeds.length
      ) {
        throw new Error('Idempotent replay requires a complete unchanged plan with no unexpected database rows');
      }
      console.log(stableJson({
        ok: true,
        mode: 'idempotent-replay',
        databaseFingerprint: context.fingerprint,
        counts: plan.counts,
        run: existingRun,
      }));
    } else {
      const planOutput = {
        ok: plan.counts.invalid === 0 && plan.counts.conflict === 0,
        mode: dryRun ? 'database-dry-run' : 'production-apply',
        databaseFingerprint: context.fingerprint,
        sourceCommit,
        sourceTreeHash: batch.sourceTreeHash,
        counts: plan.counts,
        duplicateSourceUrls: batch.duplicateSourceUrls,
        conflicts: plan.entries.filter((entry) => entry.action === 'conflict' || entry.action === 'invalid'),
      };
      if (dryRun) {
        console.log(stableJson(planOutput));
        if (!planOutput.ok) process.exitCode = 1;
      } else {
        if (!planOutput.ok) throw new Error('Import plan contains invalid or conflicting entries');
        assertCleanGitWorktree();
        const startedAt = new Date().toISOString();
        const result = await applyImport({
          sql,
          feeds: batch.feeds,
          plan,
          sourceCommit,
          sourceTreeHash: batch.sourceTreeHash,
          migrationHash: await getMigrationHash(),
          databaseFingerprint: context.fingerprint,
          startedAt,
        });
        console.log(stableJson({ ...planOutput, result }));
      }
    }
  } catch (error) {
    console.error(sanitizeDatabaseError(error, [context.pooledUrl, context.directUrl]));
    process.exitCode = 1;
  }
}

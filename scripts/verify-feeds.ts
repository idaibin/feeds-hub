import { fetchDatabaseFeeds } from './lib/database-feed';
import { loadContentBatch, stableJson } from './lib/feed-content';
import { verifyFeedDatabase } from './lib/feed-verify';
import {
  assertFoundationSchema,
  createDirectQuery,
  probeDatabaseIdentity,
  sanitizeDatabaseError,
  validateProductionDatabaseContext,
} from './lib/production-guard';

const context = validateProductionDatabaseContext({ mutation: false });
const sql = createDirectQuery(context);

try {
  await probeDatabaseIdentity(context);
  await assertFoundationSchema(sql);
  const batch = await loadContentBatch();
  if (batch.failures.length) {
    throw new Error(`Markdown normalization failed for ${batch.failures.length} feed(s)`);
  }
  const result = verifyFeedDatabase({
    markdown: batch.feeds,
    database: await fetchDatabaseFeeds(sql),
    duplicateSourceUrls: batch.duplicateSourceUrls,
  });
  console.log(stableJson({ ...result, databaseFingerprint: context.fingerprint }));
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  console.error(sanitizeDatabaseError(error, [context.pooledUrl, context.directUrl]));
  process.exitCode = 1;
}

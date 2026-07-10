import { assertCleanGitWorktree, stableJson } from './lib/feed-content';
import {
  assertRuntimeForwardSchema,
  createDirectQuery,
  probeDatabaseIdentity,
  sanitizeDatabaseError,
  validateProductionDatabaseContext,
} from './lib/production-guard';
import { applyRuntimeGrants, assertRuntimeGrants } from './lib/runtime-grants';

const context = validateProductionDatabaseContext({
  mutation: true,
  operation: 'runtime-read-grants',
});
assertCleanGitWorktree();
const sql = createDirectQuery(context);

try {
  await probeDatabaseIdentity(context);
  await assertRuntimeForwardSchema(sql);
  await applyRuntimeGrants(sql, 'read');
  const grants = await assertRuntimeGrants(sql, 'read');
  console.log(stableJson({ ok: true, target: 'production', databaseFingerprint: context.fingerprint, ...grants }));
} catch (error) {
  console.error(sanitizeDatabaseError(error, [context.pooledUrl, context.directUrl]));
  process.exitCode = 1;
}

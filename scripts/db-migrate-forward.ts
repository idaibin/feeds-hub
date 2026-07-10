import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { assertCleanGitWorktree, stableJson } from './lib/feed-content';
import {
  assertFoundationSchema,
  assertRuntimeForwardSchema,
  createDirectQuery,
  probeDatabaseIdentity,
  sanitizeDatabaseError,
  validateProductionDatabaseContext,
} from './lib/production-guard';
import {
  assertFoundationAndRuntimeForwardApplied,
  assertOnlyFoundationApplied,
  prepareFoundationMigrationSql,
  prepareRuntimeForwardMigrationSql,
  selectFoundationMigration,
  selectRuntimeForwardMigration,
  type AppliedMigrationRow,
  type DrizzleJournal,
} from './lib/reviewed-migrations';

const context = validateProductionDatabaseContext({
  mutation: true,
  operation: 'runtime-forward-migration',
});
assertCleanGitWorktree();

const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
const journal = JSON.parse(await readFile(journalPath, 'utf8')) as DrizzleJournal;
const foundationEntry = selectFoundationMigration(journal);
const forwardEntry = selectRuntimeForwardMigration(journal);
const foundationSql = await readFile(path.join(process.cwd(), 'drizzle', `${foundationEntry.tag}.sql`), 'utf8');
const forwardSql = await readFile(path.join(process.cwd(), 'drizzle', `${forwardEntry.tag}.sql`), 'utf8');
const foundation = prepareFoundationMigrationSql(foundationSql);
const forward = prepareRuntimeForwardMigrationSql(forwardSql);
const sql = createDirectQuery(context);

try {
  await probeDatabaseIdentity(context);
  await assertFoundationSchema(sql);
  const before = await sql`
    select hash, created_at::text as "createdAt"
    from drizzle.__drizzle_migrations
    order by created_at, id
  ` as AppliedMigrationRow[];
  assertOnlyFoundationApplied(before, foundation.hash, foundationEntry.when);

  const queries = [
    ...forward.statements.map((statement) => sql.query(statement)),
    sql.query(
      'insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)',
      [forward.hash, forwardEntry.when],
    ),
  ];
  await sql.transaction(queries, { isolationLevel: 'Serializable' });

  await assertRuntimeForwardSchema(sql);
  const after = await sql`
    select hash, created_at::text as "createdAt"
    from drizzle.__drizzle_migrations
    order by created_at, id
  ` as AppliedMigrationRow[];
  assertFoundationAndRuntimeForwardApplied(
    after,
    foundation.hash,
    foundationEntry.when,
    forward.hash,
    forwardEntry.when,
  );

  console.log(stableJson({
    ok: true,
    target: 'production',
    databaseFingerprint: context.fingerprint,
    reviewedMigration: forwardEntry.tag,
    migrationHash: forward.hash,
    statements: forward.statements.length,
  }));
} catch (error) {
  console.error(sanitizeDatabaseError(error, [context.pooledUrl, context.directUrl]));
  process.exitCode = 1;
}

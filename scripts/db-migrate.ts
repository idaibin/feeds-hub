import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { assertCleanGitWorktree, getMigrationHash, stableJson } from './lib/feed-content';
import {
  assertOnlyFoundationApplied,
  prepareFoundationMigrationSql,
  selectFoundationMigration,
  type AppliedMigrationRow,
  type DrizzleJournal,
} from './lib/reviewed-migrations';
import {
  assertEmptyApplicationSchema,
  assertFoundationSchema,
  createDirectQuery,
  probeDatabaseIdentity,
  sanitizeDatabaseError,
  validateProductionDatabaseContext,
} from './lib/production-guard';

const context = validateProductionDatabaseContext({ mutation: true, operation: 'foundation-migration' });
assertCleanGitWorktree();
const journalPath = path.join(process.cwd(), 'drizzle', 'meta', '_journal.json');
const journal = JSON.parse(await readFile(journalPath, 'utf8')) as DrizzleJournal;
const entry = selectFoundationMigration(journal);
const migrationPath = path.join(process.cwd(), 'drizzle', `${entry.tag}.sql`);
const migrationSql = await readFile(migrationPath, 'utf8');
const migration = prepareFoundationMigrationSql(migrationSql);
const sql = createDirectQuery(context);

try {
  await probeDatabaseIdentity(context);
  await assertEmptyApplicationSchema(sql);

  const repositoryMigrationHash = await getMigrationHash();
  const queries = [
    sql.query('create schema if not exists drizzle'),
    sql.query(`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint not null
      )
    `),
    ...migration.statements.map((statement) => sql.query(statement)),
    sql.query(
      'insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)',
      [migration.hash, entry.when],
    ),
  ];

  await sql.transaction(queries, { isolationLevel: 'Serializable' });
  await assertFoundationSchema(sql);
  const applied = await sql`
    select hash, created_at::text as "createdAt"
    from drizzle.__drizzle_migrations
    order by created_at, id
  ` as AppliedMigrationRow[];
  assertOnlyFoundationApplied(applied, migration.hash, entry.when);

  console.log(stableJson({
    ok: true,
    target: 'production',
    databaseFingerprint: context.fingerprint,
    migrationHash: migration.hash,
    repositoryMigrationHash,
    reviewedMigration: entry.tag,
    statements: migration.statements.length,
  }));
} catch (error) {
  console.error(sanitizeDatabaseError(error, [context.pooledUrl, context.directUrl]));
  process.exitCode = 1;
}

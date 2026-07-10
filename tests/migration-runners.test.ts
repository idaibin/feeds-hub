import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import path from 'node:path';
import {
  assertFoundationAndRuntimeForwardApplied,
  assertOnlyFoundationApplied,
  FOUNDATION_MIGRATION,
  prepareFoundationMigrationSql,
  prepareRuntimeForwardMigrationSql,
  RUNTIME_FORWARD_MIGRATION,
  selectFoundationMigration,
  selectRuntimeForwardMigration,
  type DrizzleJournal,
} from '../scripts/lib/reviewed-migrations';
import {
  RUNTIME_READ_GRANT_STATEMENTS,
  RUNTIME_WRITE_GRANT_STATEMENTS,
} from '../scripts/lib/runtime-grants';

async function fixture() {
  const journal = JSON.parse(await readFile('drizzle/meta/_journal.json', 'utf8')) as DrizzleJournal;
  const foundationSql = await readFile(path.join('drizzle', `${FOUNDATION_MIGRATION.tag}.sql`), 'utf8');
  const forwardSql = await readFile(path.join('drizzle', `${RUNTIME_FORWARD_MIGRATION.tag}.sql`), 'utf8');
  return { journal, foundationSql, forwardSql };
}

test('foundation runner selects only reviewed idx 0 even when later journal entries exist', async () => {
  const { journal, foundationSql } = await fixture();
  assert.ok(journal.entries.length > 1);
  assert.equal(selectFoundationMigration(journal).tag, FOUNDATION_MIGRATION.tag);
  assert.equal(prepareFoundationMigrationSql(foundationSql).hash, FOUNDATION_MIGRATION.hash);

  assert.throws(() => selectFoundationMigration({
    entries: journal.entries.map((entry) => entry.idx === 0 ? { ...entry, tag: '0000_changed' } : entry),
  }), /missing or changed/);
  assert.throws(() => selectFoundationMigration({
    entries: journal.entries.map((entry) => entry.idx === 0 ? { ...entry, when: entry.when + 1 } : entry),
  }), /missing or changed/);
  assert.throws(() => prepareFoundationMigrationSql(`${foundationSql}\nselect 1;`), /hash/);
});

test('forward runner accepts only reviewed idx 1 SQL and rejects destructive or changed input', async () => {
  const { journal, forwardSql } = await fixture();
  assert.equal(selectRuntimeForwardMigration(journal).tag, RUNTIME_FORWARD_MIGRATION.tag);
  assert.equal(prepareRuntimeForwardMigrationSql(forwardSql).hash, RUNTIME_FORWARD_MIGRATION.hash);

  assert.throws(() => selectRuntimeForwardMigration({
    entries: journal.entries.map((entry) => entry.idx === 1 ? { ...entry, tag: '0001_changed' } : entry),
  }), /missing or changed/);
  assert.throws(() => selectRuntimeForwardMigration({
    entries: journal.entries.map((entry) => entry.idx === 1 ? { ...entry, when: entry.when + 1 } : entry),
  }), /missing or changed/);
  assert.throws(() => prepareRuntimeForwardMigrationSql(`${forwardSql}\nDROP TABLE feeds;`), /destructive/);
  assert.throws(() => prepareRuntimeForwardMigrationSql(`${forwardSql}\nselect 1;`), /hash/);
});

test('applied journal verification requires exact foundation then exact forward rows', () => {
  const foundation = { hash: FOUNDATION_MIGRATION.hash, createdAt: String(FOUNDATION_MIGRATION.when) };
  const forward = { hash: RUNTIME_FORWARD_MIGRATION.hash, createdAt: String(RUNTIME_FORWARD_MIGRATION.when) };
  assert.doesNotThrow(() => assertOnlyFoundationApplied([foundation], foundation.hash, FOUNDATION_MIGRATION.when));
  assert.doesNotThrow(() => assertFoundationAndRuntimeForwardApplied(
    [foundation, forward],
    foundation.hash,
    FOUNDATION_MIGRATION.when,
    forward.hash,
    RUNTIME_FORWARD_MIGRATION.when,
  ));
  assert.throws(() => assertOnlyFoundationApplied([foundation, forward], foundation.hash, FOUNDATION_MIGRATION.when), /exactly/);
  assert.throws(() => assertFoundationAndRuntimeForwardApplied(
    [forward, foundation],
    foundation.hash,
    FOUNDATION_MIGRATION.when,
    forward.hash,
    RUNTIME_FORWARD_MIGRATION.when,
  ), /does not match/);
});

test('forward runner exposes no arbitrary migration, SQL, shell, or down-migration input', async () => {
  const source = await readFile('scripts/db-migrate-forward.ts', 'utf8');
  assert.match(source, /operation: 'runtime-forward-migration'/);
  assert.match(source, /selectRuntimeForwardMigration/);
  assert.doesNotMatch(source, /--(?:migration|sql|file|down|command)/);
  assert.doesNotMatch(source, /process\.stdin|child_process|exec\(|spawn\(/);
});

test('runtime grant runners target only the fixed least-privilege role and expose no arbitrary input', async () => {
  const readSql = RUNTIME_READ_GRANT_STATEMENTS.join('; ');
  const writeSql = RUNTIME_WRITE_GRANT_STATEMENTS.join('; ');

  assert.match(readSql, /GRANT SELECT ON TABLE public\.feeds TO feeds_runtime/);
  assert.doesNotMatch(readSql, /GRANT[^;]*(?:INSERT|UPDATE|DELETE|TRUNCATE)/);
  assert.match(writeSql, /GRANT SELECT, INSERT, UPDATE ON TABLE public\.feeds TO feeds_runtime/);
  assert.match(writeSql, /GRANT SELECT, INSERT ON TABLE public\.feed_audit_events TO feeds_runtime/);
  assert.doesNotMatch(writeSql, /GRANT[^;]*(?:DELETE|TRUNCATE|CREATE ON SCHEMA)/);

  for (const runner of ['scripts/db-grant-runtime-read.ts', 'scripts/db-grant-runtime-write.ts']) {
    const source = await readFile(runner, 'utf8');
    assert.match(source, /operation: 'runtime-(?:read|write)-grants'/);
    assert.doesNotMatch(source, /--(?:role|sql|file|command|shell|table|grant)/);
    assert.doesNotMatch(source, /process\.stdin|child_process|exec\(|spawn\(/);
  }

  const verifier = await readFile('scripts/lib/runtime-grants.ts', 'utf8');
  for (const ownershipCatalog of ['pg_class', 'pg_proc', 'pg_type', 'pg_namespace', 'pg_extension', 'pg_database']) {
    assert.match(verifier, new RegExp(`from ${ownershipCatalog}`));
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { applyImport } from '../scripts/lib/database-feed';
import { buildImportPlan, loadContentBatch } from '../scripts/lib/feed-content';

test('atomic import statement guards unchanged rows and rejects unexpected database rows', async () => {
  const batch = await loadContentBatch();
  const feed = batch.feeds[0];
  const plan = buildImportPlan(
    { feeds: [feed], failures: [], duplicateSourceUrls: [], sourceTreeHash: batch.sourceTreeHash },
    [{
      id: '00000000-0000-4000-8000-000000000001',
      slug: feed.slug,
      eventKey: feed.eventKey,
      contentHash: feed.contentHash,
      status: feed.status,
      origin: 'markdown',
      version: 1,
    }],
  );
  let statement = '';
  const sql = ((strings: TemplateStringsArray) => {
    statement = strings.join('?');
    return Promise.resolve([{ id: 'run-id', inserted: 0, updated: 0, unchanged: 1 }]);
  }) as unknown as NeonQueryFunction<false, false>;

  const result = await applyImport({
    sql,
    feeds: [feed],
    plan,
    sourceCommit: 'a'.repeat(40),
    sourceTreeHash: batch.sourceTreeHash,
    migrationHash: 'b'.repeat(64),
    databaseFingerprint: 'c'.repeat(64),
    startedAt: '2026-07-10T08:00:00Z',
  });

  assert.equal(result.unchanged, 1);
  assert.match(statement, /unchanged_rows as/);
  assert.match(statement, /feed\.version = item\."expectedVersion"/);
  assert.match(statement, /feed\.content_hash = item\."expectedContentHash"/);
  assert.match(statement, /unexpected_rows as/);
  assert.match(statement, /actual\.unexpected = 0/);
  assert.match(statement, /actual\.unchanged =/);
});

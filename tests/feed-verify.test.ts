import assert from 'node:assert/strict';
import test from 'node:test';
import type { DatabaseFeedRecord } from '../scripts/lib/database-feed';
import { loadContentBatch, type NormalizedFeed } from '../scripts/lib/feed-content';
import { verifyFeedDatabase } from '../scripts/lib/feed-verify';

function databaseRow(feed: NormalizedFeed, index: number): DatabaseFeedRecord {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    slug: feed.slug,
    title: feed.title,
    subtitle: feed.subtitle,
    category: feed.category,
    kind: feed.kind,
    topic: feed.topic,
    date: feed.date,
    eventAt: feed.eventAt,
    eventKey: feed.eventKey,
    cover: feed.cover,
    coverStatus: feed.coverStatus,
    tags: feed.tags,
    summary: feed.summary,
    source: feed.source,
    sourceUrl: feed.sourceUrl,
    body: feed.body,
    priority: feed.priority,
    status: feed.status,
    version: 1,
    origin: 'markdown',
    publishedAt: feed.status === 'published' ? feed.date : null,
    archivedAt: null,
    contentHash: feed.contentHash,
  };
}

test('verifies every imported field and all current list orderings', async () => {
  const batch = await loadContentBatch();
  const database = batch.feeds.map(databaseRow);
  const result = verifyFeedDatabase({
    markdown: batch.feeds,
    database,
    duplicateSourceUrls: batch.duplicateSourceUrls,
    now: Date.parse('2026-07-10T12:00:00Z'),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.counts, {
    markdownTotal: 236,
    databaseTotal: 236,
    draft: 1,
    published: 235,
    archived: 0,
  });
});

test('reports content mismatches and unexpected database rows', async () => {
  const batch = await loadContentBatch();
  const feed = batch.feeds[0];
  const row = databaseRow(feed, 1);
  const unexpected = { ...row, id: '00000000-0000-4000-8000-000000000002', slug: 'ai/unexpected' };
  const result = verifyFeedDatabase({
    markdown: [feed],
    database: [{ ...row, title: `${row.title} changed` }, unexpected],
    duplicateSourceUrls: [],
    now: Date.parse('2026-07-10T12:00:00Z'),
  });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.scope === feed.slug && issue.message === 'title mismatch'));
  assert.ok(result.issues.some((issue) => issue.scope === 'ai/unexpected' && issue.message === 'unexpected database row'));
});

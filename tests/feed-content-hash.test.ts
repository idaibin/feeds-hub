import assert from 'node:assert/strict';
import test from 'node:test';
import { loadContentBatch } from '../scripts/lib/feed-content';
import { calculateRuntimeContentHash } from '../src/lib/feed-validation';

test('runtime and importer use the same feed-v1 hash without drifting existing Markdown', async () => {
  const batch = await loadContentBatch();
  const imported = batch.feeds.find((feed) => feed.slug === 'ai/2026-07-01-ai-taste-product-design');
  assert.ok(imported);
  assert.equal(imported.contentHash, '397f90e21472092656ff25395e5957ff87f423ef423acd4d65e63b8a9b22646c');
  const { contentHash: _contentHash, status, date, eventAt, ...fields } = imported;
  assert.equal(
    calculateRuntimeContentHash({ ...fields, date: new Date(date), eventAt: new Date(eventAt) }, status),
    imported.contentHash,
  );
});

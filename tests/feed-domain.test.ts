import assert from 'node:assert/strict';
import test from 'node:test';
import { toDomainFeed } from '../src/lib/feed-content-adapter';

function contentEntry(reviewed: boolean) {
  return {
    id: 'ai/2026-07-10-domain-model',
    body: '正文内容。',
    data: {
      title: '领域模型测试',
      subtitle: 'Content adapter 保留展示字段',
      category: 'ai',
      kind: 'news',
      topic: 'AI 测试',
      date: new Date('2026-07-10T01:00:00Z'),
      eventAt: new Date('2026-07-10T02:00:00Z'),
      eventKey: 'ai:domain-model:2026-07-10',
      cover: '/images/ai/domain-model.webp',
      coverStatus: 'pending',
      tags: ['AI'],
      summary: '摘要内容。',
      source: 'Example',
      sourceUrl: 'https://example.com/domain-model',
      reviewed,
      priority: 3,
    },
  } as Parameters<typeof toDomainFeed>[0];
}

test('maps a reviewed Content entry to the stable Feed domain model', () => {
  const entry = contentEntry(true);
  const feed = toDomainFeed(entry);

  assert.equal(feed.id, entry.id);
  assert.equal(feed.slug, entry.id);
  assert.equal(feed.body, entry.body);
  assert.equal(feed.status, 'published');
  assert.equal(feed.origin, 'markdown');
  assert.equal(feed.version, 1);
  assert.equal(feed.publishedAt, entry.data.date);
  assert.equal(feed.archivedAt, null);
  assert.equal(feed.createdAt, entry.data.date);
  assert.equal(feed.updatedAt, entry.data.date);
});

test('maps an unreviewed Content entry to a draft without a publication date', () => {
  const feed = toDomainFeed(contentEntry(false));

  assert.equal(feed.status, 'draft');
  assert.equal(feed.publishedAt, null);
});

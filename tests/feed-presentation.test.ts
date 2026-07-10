import assert from 'node:assert/strict';
import test from 'node:test';
import type { Feed, FeedCategory } from '../src/domain/feed';
import { toFeedCardData } from '../src/lib/feed-card-data';
import { getFeedsByList, isStockCloseFeed, sortFeeds } from '../src/lib/feeds';

function feed(overrides: Partial<Feed> & { slug: string; category?: FeedCategory }): Feed {
  const { slug, category = 'ai', ...rest } = overrides;
  const date = new Date('2026-07-10T01:00:00Z');
  return {
    id: `uuid-${slug}`,
    slug,
    title: '测试标题',
    subtitle: '测试副标题',
    category,
    kind: 'news',
    topic: '测试主题',
    date,
    eventAt: new Date('2026-07-10T02:00:00Z'),
    eventKey: `event:${overrides.slug}`,
    cover: '/images/test.webp',
    coverStatus: 'pending',
    tags: [],
    summary: '测试摘要内容。',
    source: 'Example',
    sourceUrl: 'https://example.com/feed',
    body: '测试正文。',
    priority: 0,
    status: 'published',
    version: 1,
    origin: 'markdown',
    publishedAt: date,
    archivedAt: null,
    createdAt: date,
    updatedAt: date,
    ...rest,
  };
}

test('preserves list ordering and uses slug instead of database id as the final tie-break', () => {
  const now = Date.parse('2026-07-10T12:00:00Z');
  const values = [
    feed({ slug: 'lol/future-late', category: 'lol', eventAt: new Date('2026-07-12T02:00:00Z') }),
    feed({ slug: 'ai/tie-b', id: '0000', eventAt: new Date('2026-07-10T03:00:00Z') }),
    feed({ slug: 'ai/tie-a', id: 'ffff', eventAt: new Date('2026-07-10T03:00:00Z') }),
    feed({ slug: 'lol/future-early', category: 'lol', eventAt: new Date('2026-07-11T02:00:00Z') }),
    feed({ slug: 'ai/latest', eventAt: new Date('2026-07-10T04:00:00Z') }),
  ];

  assert.deepEqual(sortFeeds(values, now).map((item) => item.slug), [
    'ai/latest',
    'ai/tie-a',
    'ai/tie-b',
    'lol/future-early',
    'lol/future-late',
  ]);
});

test('preserves topic-group resolution before category fallback', () => {
  const values = [
    feed({ slug: 'ai/one', category: 'ai' }),
    feed({ slug: 'github/one', category: 'github' }),
    feed({ slug: 'compute/one', category: 'compute' }),
    feed({ slug: 'dev/one', category: 'dev' }),
    feed({ slug: 'rust/one', category: 'rust' }),
    feed({ slug: 'hot/one', category: 'hot' }),
  ];

  assert.deepEqual(getFeedsByList(values, 'ai').map((item) => item.category), ['ai', 'github', 'compute']);
  assert.deepEqual(getFeedsByList(values, 'dev').map((item) => item.category), ['dev', 'rust']);
  assert.deepEqual(getFeedsByList(values, 'hot').map((item) => item.category), ['hot']);
});

test('preserves the stock close list filter', () => {
  assert.equal(isStockCloseFeed(feed({
    slug: 'stock/us-close',
    category: 'stock',
    eventKey: 'stock:us:close:2026-07-10',
    topic: '美股收盘',
  })), true);
  assert.equal(isStockCloseFeed(feed({
    slug: 'stock/japan-close',
    category: 'stock',
    eventKey: 'stock:japan:close:2026-07-10',
    topic: '日本股市收盘',
  })), false);
});

test('keeps the pagination card payload exactly keyed by the public slug', () => {
  const value = feed({
    slug: 'ai/card-payload',
    id: 'database-uuid',
    title: '卡片标题',
    summary: '卡片摘要内容。',
    eventAt: new Date('2026-07-10T02:03:00Z'),
  });

  assert.deepEqual(toFeedCardData(value), {
    id: 'ai/card-payload',
    href: '/feed/ai/card-payload/',
    category: 'ai',
    categoryShortName: 'AI 科技',
    title: '卡片标题',
    summary: '卡片摘要内容。',
    eventAt: '2026-07-10T02:03:00.000Z',
    eventAtLabel: '2026-07-10 10:03',
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import type { Feed } from '../src/domain/feed';
import {
  AuthorizedFeedReadError,
  createAuthorizedFeedSearchPage,
  decodeAuthorizedFeedCursor,
} from '../src/lib/feed-authorized-read';
import { DatabaseFeedSource, PUBLIC_FEED_LIST_COLUMNS } from '../src/lib/feed-sources/database';
import { createFeedPage } from '../src/lib/feeds';
import { resolveFeedReadSource } from '../src/lib/feed-sources';

function feed(slug: string, category: Feed['category'], eventAt: string): Feed {
  const date = new Date(eventAt);
  return {
    id: slug,
    slug,
    title: '测试标题',
    subtitle: '测试副标题',
    category,
    kind: 'news',
    topic: category === 'stock' ? '美股收盘' : '测试主题',
    date,
    eventAt: date,
    eventKey: `${category}:close:${slug}`,
    cover: '/images/test.webp',
    coverStatus: 'pending',
    tags: [],
    summary: '测试摘要。',
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
  };
}

test('defaults read source to content and rejects unknown values', () => {
  assert.equal(resolveFeedReadSource({}), 'content');
  assert.equal(resolveFeedReadSource({ FEED_READ_SOURCE: 'database' }), 'database');
  assert.throws(() => resolveFeedReadSource({ FEED_READ_SOURCE: 'other' }), /must be content or database/);
});

test('creates the same filtered, sorted, paginated public feed page for every adapter', () => {
  const values = [
    feed('ai/new', 'ai', '2026-07-10T02:00:00Z'),
    feed('github/old', 'github', '2026-07-10T01:00:00Z'),
    feed('stock/close', 'stock', '2026-07-10T00:00:00Z'),
  ];
  const page = createFeedPage(values, { list: 'ai', page: 1, pageSize: 2 }, Date.parse('2026-07-10T12:00:00Z'));

  assert.deepEqual(page.items.map((item) => item.slug), ['ai/new', 'github/old']);
  assert.equal(page.hasMore, false);
  assert.equal(page.page, 1);
  assert.equal(page.pageSize, 2);
});

test('authorized search filters lifecycle/category/query and advances an opaque cursor', () => {
  const first = feed('ai/first', 'ai', '2026-07-10T02:00:00Z');
  const second = { ...feed('ai/second', 'ai', '2026-07-10T01:00:00Z'), title: 'Agent runtime' };
  const archived = { ...feed('ai/archived', 'ai', '2026-07-10T00:00:00Z'), status: 'archived' as const };
  const page = createAuthorizedFeedSearchPage([archived, second, first], { status: 'published', category: 'ai', limit: 1 }, 'content');
  assert.deepEqual(page.items.map((item) => item.slug), ['ai/first']);
  assert.ok(page.nextCursor);
  assert.equal(decodeAuthorizedFeedCursor(page.nextCursor!, 'content').id, 'ai/first');
  const next = createAuthorizedFeedSearchPage([archived, second, first], { status: 'published', query: 'agent', limit: 1, cursor: page.nextCursor! }, 'content');
  assert.deepEqual(next.items.map((item) => item.slug), ['ai/second']);
  assert.equal(next.nextCursor, null);
});

test('authorized search rejects malformed cursors and out-of-range limits', () => {
  assert.throws(() => createAuthorizedFeedSearchPage([], { cursor: 'not-json' }, 'content'), AuthorizedFeedReadError);
  assert.throws(() => createAuthorizedFeedSearchPage([], { limit: 101 }, 'content'), AuthorizedFeedReadError);
  assert.throws(() => createAuthorizedFeedSearchPage([], { query: 'a' }, 'content'), AuthorizedFeedReadError);
});

test('database authorized list ids can be passed back to getAuthorized', async () => {
  const id = '00000000-0000-4000-8000-000000000123';
  const date = new Date('2026-07-10T08:00:00.000Z');
  const row = {
    id,
    slug: 'ai/database-id-roundtrip',
    title: 'Database id roundtrip',
    subtitle: 'Authorized lookup contract',
    category: 'ai',
    kind: 'news',
    topic: 'MCP',
    date,
    eventAt: date,
    eventKey: 'ai:database-id-roundtrip',
    cover: '/images/ai/database.webp',
    coverStatus: 'pending',
    tags: ['AI'],
    summary: 'Database id summary.',
    source: 'Example',
    sourceUrl: 'https://example.com/database',
    body: 'Database id body.',
    priority: 0,
    status: 'published',
    version: 1,
    origin: 'mcp',
    publishedAt: date,
    archivedAt: null,
    contentHash: 'a'.repeat(64),
    createdAt: date,
    updatedAt: date,
    updatedAtMicros: (BigInt(date.getTime()) * 1000n).toString(),
  };
  let selectCount = 0;
  const database = {
    select() {
      selectCount += 1;
      const rows = selectCount === 1 ? [row, row] : [row];
      return {
        from() {
          return {
            where() {
              return {
                orderBy() { return { limit: async () => rows }; },
                limit: async () => rows,
              };
            },
          };
        },
      };
    },
  };
  const source = new DatabaseFeedSource(database as never);
  const page = await source.searchAuthorized({ limit: 1 });
  assert.equal(page.items[0].id, id);
  assert.equal(decodeAuthorizedFeedCursor(page.nextCursor!, 'database').source, 'database');
  const selected = await source.getAuthorized({ id: page.items[0].id });
  assert.equal(selected?.slug, 'ai/database-id-roundtrip');
});

test('database public pagination rejects unsafe or oversized bounds before querying', async () => {
  assert.equal('body' in PUBLIC_FEED_LIST_COLUMNS, false);
  const source = new DatabaseFeedSource({} as never);
  await assert.rejects(
    () => source.listPublished({ list: 'all', page: Number.MAX_SAFE_INTEGER, pageSize: 10 }),
    /page must be an integer between 1 and 1000/,
  );
  await assert.rejects(
    () => source.listPublished({ list: 'all', page: 1, pageSize: 101 }),
    /pageSize must be an integer between 1 and 100/,
  );
});

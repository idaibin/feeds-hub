import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FeedValidationError,
  POSTGRES_INT4_MAX,
  parseArchiveCommand,
  parseDuplicateQuery,
  parseFeedDraftInput,
  parsePublishCommand,
  parsePublishedFeedPatch,
  parseSaveDraftCommand,
  parseUpdatePublishedCommand,
} from '../src/lib/feed-validation';

function draft() {
  return {
    slug: 'ai/validated-feed',
    title: 'Validated feed',
    subtitle: 'Strict input validation',
    category: 'ai',
    kind: 'news',
    topic: 'Validation',
    date: '2026-07-10T08:00:00Z',
    eventAt: '2026-07-10T08:00:00Z',
    eventKey: 'ai:validated-feed:2026-07-10',
    cover: '/images/ai/validated-feed.webp',
    coverStatus: 'pending',
    tags: ['AI'],
    summary: 'Validated summary.',
    source: 'Example',
    sourceUrl: 'https://example.com/feed',
    body: 'Validated body.',
    priority: 0,
  };
}

test('feed draft validation normalizes dates and rejects unknown fields', () => {
  const parsed = parseFeedDraftInput(draft());
  assert.equal(parsed.date.toISOString(), '2026-07-10T08:00:00.000Z');
  assert.throws(() => parseFeedDraftInput({ ...draft(), status: 'published' }), FeedValidationError);
});

test('feed validation rejects URL userinfo and immutable published fields', () => {
  assert.throws(() => parseFeedDraftInput({ ...draft(), sourceUrl: 'https://user:secret@example.com/feed' }), FeedValidationError);
  assert.throws(() => parsePublishedFeedPatch({ eventKey: 'changed' }), FeedValidationError);
});

test('duplicate validation supports slug and requires at least one identity signal', () => {
  assert.deepEqual(parseDuplicateQuery({ slug: 'ai/validated-feed' }), { slug: 'ai/validated-feed' });
  assert.throws(() => parseDuplicateQuery({ category: 'ai' }), FeedValidationError);
});

test('every mutation parser bounds expectedVersion to PostgreSQL int4', () => {
  const context = { actor: 'api:feed-writer' as const, origin: 'api' as const, idempotencyKey: 'validation:key:0001', reason: '' };
  const id = '00000000-0000-4000-8000-000000000001';
  const validBodies: Array<() => unknown> = [
    () => parseSaveDraftCommand({ feedId: id, expectedVersion: POSTGRES_INT4_MAX, feed: draft(), reason: 'save' }, context),
    () => parsePublishCommand({ expectedVersion: POSTGRES_INT4_MAX, reason: 'publish' }, context, id),
    () => parseUpdatePublishedCommand({ expectedVersion: POSTGRES_INT4_MAX, patch: { summary: 'Updated summary' }, reason: 'update' }, context, id),
    () => parseArchiveCommand({ expectedVersion: POSTGRES_INT4_MAX, reason: 'archive' }, context, id),
  ];
  for (const parse of validBodies) assert.doesNotThrow(parse);

  const invalidBodies: Array<() => unknown> = [
    () => parseSaveDraftCommand({ feedId: id, expectedVersion: POSTGRES_INT4_MAX + 1, feed: draft(), reason: 'save' }, context),
    () => parsePublishCommand({ expectedVersion: POSTGRES_INT4_MAX + 1, reason: 'publish' }, context, id),
    () => parseUpdatePublishedCommand({ expectedVersion: POSTGRES_INT4_MAX + 1, patch: { summary: 'Updated summary' }, reason: 'update' }, context, id),
    () => parseArchiveCommand({ expectedVersion: POSTGRES_INT4_MAX + 1, reason: 'archive' }, context, id),
  ];
  for (const parse of invalidBodies) assert.throws(parse, FeedValidationError);
});

test('mutation context accepts server-derived OAuth MCP principals', () => {
  const context = {
    actor: 'mcp:auth0|user-123',
    origin: 'mcp' as const,
    idempotencyKey: 'validation:mcp:0001',
    reason: '',
  };

  assert.doesNotThrow(() => parseSaveDraftCommand({ feed: draft(), reason: 'save' }, context));
});

test('mutation context couples the writer principal to its request origin', () => {
  const base = { idempotencyKey: 'validation:actor:0001', reason: '' };
  const invalidContexts = [
    { ...base, actor: 'api:feed-writer', origin: 'mcp' as const },
    { ...base, actor: 'mcp:auth0|user-123', origin: 'api' as const },
    { ...base, actor: 'mcp:', origin: 'mcp' as const },
    { ...base, actor: 'mcp:unknown', origin: 'mcp' as const },
    { ...base, actor: 'mcp:user with spaces', origin: 'mcp' as const },
  ];

  for (const context of invalidContexts) {
    assert.throws(() => parseSaveDraftCommand({ feed: draft(), reason: 'save' }, context), FeedValidationError);
  }
});

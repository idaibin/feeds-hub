import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test, { after, before } from 'node:test';
import pg from 'pg';
import { inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Feed } from '../../src/domain/feed';
import { feeds } from '../../src/db/schema';
import { NeonFeedRepository, type FeedSqlExecutor } from '../../src/db/neon-feed-repository';
import { FeedService, FeedServiceError } from '../../src/lib/feed-service';
import { AuthorizedFeedReadError, encodeAuthorizedFeedCursor } from '../../src/lib/feed-authorized-read';
import { DatabaseFeedSource, toDatabaseFeed } from '../../src/lib/feed-sources/database';
import { createFeedPage } from '../../src/lib/feeds';
import type { FeedDraftInput, MutationContext } from '../../src/domain/feed-write';
import { createPostHandler as createDraftPostHandler } from '../../src/pages/api/feeds/drafts';
import { runMcpChild } from '../helpers/run-mcp-child';
import {
  RUNTIME_READ_GRANT_STATEMENTS,
  RUNTIME_WRITE_GRANT_STATEMENTS,
} from '../../scripts/lib/runtime-grants';

const expectedUrl = 'postgresql://feeds_hub_test:feeds_hub_test@127.0.0.1:55432/feeds_hub_test';
const connectionString = process.env.TEST_DATABASE_URL;
if (connectionString !== expectedUrl || process.env.FEED_DB_TARGET !== 'test') {
  throw new Error('Integration tests require the reviewed local feeds_hub_test database and FEED_DB_TARGET=test');
}

const pool = new pg.Pool({ connectionString, max: 8 });
const executor: FeedSqlExecutor = {
  async query<T extends Record<string, unknown>>(text: string, values: unknown[] = []) {
    const result = await pool.query(text, values);
    return result.rows as T[];
  },
};
const repository = new NeonFeedRepository(executor);
const service = new FeedService(repository, { FEED_WRITES_ENABLED: 'true' });

function draft(suffix: string): FeedDraftInput {
  return {
    slug: `ai/integration-${suffix}`,
    title: `Integration ${suffix}`,
    subtitle: 'Task 4 isolated database verification',
    category: 'ai',
    kind: 'news',
    topic: 'Integration',
    date: new Date('2026-07-10T08:00:00Z'),
    eventAt: new Date('2026-07-10T08:00:00Z'),
    eventKey: `ai:integration:${suffix}`,
    cover: `/images/ai/integration-${suffix}.webp`,
    coverStatus: 'pending',
    tags: ['AI'],
    summary: 'Integration test summary.',
    source: 'Example',
    sourceUrl: `https://example.com/${suffix}`,
    body: 'Integration test body.',
    priority: 0,
  };
}

function context(key: string, reason = 'integration verification'): MutationContext {
  return { actor: 'api:feed-writer', origin: 'api', idempotencyKey: `integration:${key.padEnd(16, '0')}`, reason };
}

function serviceWithIdempotencyPreflightBarrier(idempotencyKey: string) {
  let waiting = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const barrierExecutor: FeedSqlExecutor = {
    async query<T extends Record<string, unknown>>(text: string, values: unknown[] = []) {
      if (
        text.includes('from feed_idempotency_keys as key')
        && values[2] === idempotencyKey
        && waiting < 2
      ) {
        waiting += 1;
        if (waiting === 2) release();
        await gate;
      }
      return executor.query<T>(text, values);
    },
  };
  return new FeedService(new NeonFeedRepository(barrierExecutor), { FEED_WRITES_ENABLED: 'true' });
}

async function count(table: string) {
  const result = await pool.query(`select count(*)::integer as count from ${table}`);
  return result.rows[0].count as number;
}

before(async () => {
  await pool.query('drop schema if exists public cascade');
  await pool.query('create schema public');
  const files = (await readdir(path.join(process.cwd(), 'drizzle'))).filter((name) => name.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = await readFile(path.join(process.cwd(), 'drizzle', file), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint').map((item) => item.trim()).filter(Boolean)) {
      await pool.query(statement);
    }
  }
});

after(async () => {
  await pool.end();
});

test('draft, publish, update, and archive are atomic, versioned, audited, and idempotent', async () => {
  const input = draft('lifecycle');
  const createCommand = { ...context('create-lifecycle'), feed: input };
  const created = await service.saveDraft(createCommand);
  assert.equal(created.feed.status, 'draft');
  assert.equal(created.feed.version, 1);
  const titleDuplicates = await service.findDuplicates({ title: 'Integration lifecycle', category: 'ai' });
  assert.ok(titleDuplicates.some((candidate) => candidate.feedId === created.feed.id && candidate.reasons.includes('title_similarity')));

  const replay = await service.saveDraft(createCommand);
  assert.equal(replay.feed.id, created.feed.id);
  assert.equal(replay.auditEventId, created.auditEventId);
  assert.equal(await count('feed_audit_events'), 1);

  await assert.rejects(
    () => service.saveDraft({ ...createCommand, reason: 'different request' }),
    (error) => error instanceof FeedServiceError && error.code === 'IDEMPOTENCY_CONFLICT',
  );

  const updatedDraft = await service.saveDraft({
    ...context('update-draft'),
    feedId: created.feed.id,
    expectedVersion: 1,
    feed: { ...input, title: 'Updated draft title' },
  });
  assert.equal(updatedDraft.feed.version, 2);

  const publishCommand = { ...context('publish'), feedId: created.feed.id, expectedVersion: 2 };
  const published = await service.publish(publishCommand);
  assert.equal(published.feed.status, 'published');
  assert.equal(published.feed.version, 3);
  assert.equal((await service.publish(publishCommand)).auditEventId, published.auditEventId);
  await assert.rejects(
    () => service.publish({ ...publishCommand, reason: 'conflicting publish replay' }),
    (error) => error instanceof FeedServiceError && error.code === 'IDEMPOTENCY_CONFLICT',
  );

  await assert.rejects(
    () => service.archive({ ...context('stale-archive'), feedId: created.feed.id, expectedVersion: 2 }),
    (error) => error instanceof FeedServiceError && error.code === 'VERSION_CONFLICT',
  );

  const updateCommand = {
    ...context('update-published'),
    feedId: created.feed.id,
    expectedVersion: 3,
    patch: { summary: 'Updated published summary.' },
  };
  const editorial = await service.updatePublished(updateCommand);
  assert.equal(editorial.feed.version, 4);
  assert.equal(editorial.feed.summary, 'Updated published summary.');
  assert.equal((await service.updatePublished(updateCommand)).auditEventId, editorial.auditEventId);
  await assert.rejects(
    () => service.updatePublished({ ...updateCommand, reason: 'conflicting update replay' }),
    (error) => error instanceof FeedServiceError && error.code === 'IDEMPOTENCY_CONFLICT',
  );

  const archiveCommand = { ...context('archive'), feedId: created.feed.id, expectedVersion: 4 };
  const archived = await service.archive(archiveCommand);
  assert.equal(archived.feed.status, 'archived');
  assert.equal(archived.feed.version, 5);
  assert.equal((await service.archive(archiveCommand)).auditEventId, archived.auditEventId);
  await assert.rejects(
    () => service.archive({ ...archiveCommand, reason: 'conflicting archive replay' }),
    (error) => error instanceof FeedServiceError && error.code === 'IDEMPOTENCY_CONFLICT',
  );
  assert.equal(await count('feed_revisions'), 5);
  assert.equal(await count('feed_audit_events'), 5);
  assert.equal(await count('feed_idempotency_keys'), 5);
});

test('HTTP auth, JSON body, validation, and success envelope reach the local repository safely', async () => {
  const token = 'integration-http-token'.padEnd(48, '0');
  const env = { FEED_WRITES_ENABLED: 'true', FEED_WRITE_TOKEN: token };
  const route = createDraftPostHandler({ service, env });
  const input = draft('http-envelope');
  const makeRequest = (authorization: string, body: unknown) => new Request('https://feeds.example/api/feeds/drafts', {
    method: 'POST',
    headers: {
      authorization,
      'content-type': 'application/json',
      'idempotency-key': 'integration:http-envelope',
    },
    body: JSON.stringify(body),
  });
  const invoke = (request: Request) => route({ request, params: {} } as never);
  const unauthorized = await invoke(makeRequest('Bearer wrong', { feed: input, reason: 'http' }));
  assert.equal(unauthorized.status, 401);
  assert.equal((await unauthorized.json()).error.code, 'AUTH_REQUIRED');

  const invalid = await invoke(makeRequest(`Bearer ${token}`, { feed: { ...input, status: 'published' }, reason: 'http' }));
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, 'VALIDATION_FAILED');

  const response = await invoke(makeRequest(`Bearer ${token}`, { feed: input, reason: 'http integration' }));
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.feed.status, 'draft');
  assert.equal(payload.data.action, 'created');
});

test('database authorized cursor pages and id lookup round-trip while rejecting content cursors', async () => {
  const marker = `cursor-${process.pid}`;
  const first = await service.saveDraft({ ...context(`${marker}-first`), feed: { ...draft(`${marker}-first`), title: `Cursor ${marker} first` } });
  const second = await service.saveDraft({ ...context(`${marker}-second`), feed: { ...draft(`${marker}-second`), title: `Cursor ${marker} second` } });
  await pool.query(
    `update feeds
      set updated_at = case id
        when $1 then '2026-07-10T08:00:00.123456Z'::timestamptz
        when $2 then '2026-07-10T08:00:00.123400Z'::timestamptz
      end
      where id in ($1, $2)`,
    [first.feed.id, second.feed.id],
  );
  const source = new DatabaseFeedSource(drizzle(pool) as never);
  const firstPage = await source.searchAuthorized({ status: 'draft', query: marker, limit: 1 });
  assert.equal(firstPage.items.length, 1);
  assert.equal(firstPage.items[0].id, first.feed.id);
  assert.ok(firstPage.nextCursor);
  const secondPage = await source.searchAuthorized({ status: 'draft', query: marker, limit: 1, cursor: firstPage.nextCursor! });
  assert.equal(secondPage.items.length, 1);
  assert.equal(secondPage.items[0].id, second.feed.id);
  const selected = await source.getAuthorized({ id: firstPage.items[0].id });
  assert.equal(selected?.id, firstPage.items[0].id);
  const contentCursor = encodeAuthorizedFeedCursor({ id: first.feed.slug, updatedAt: first.feed.updatedAt }, 'content');
  await assert.rejects(
    () => source.searchAuthorized({ cursor: contentCursor }),
    (error) => error instanceof AuthorizedFeedReadError && /belongs to content source/.test(error.message),
  );
});

test('database authorized cursor uses UUID order when updated_at microseconds are identical', async () => {
  const marker = `cursor-tie-${process.pid}`;
  const left = await service.saveDraft({ ...context(`${marker}-left`), feed: { ...draft(`${marker}-left`), title: `Cursor ${marker} left` } });
  const right = await service.saveDraft({ ...context(`${marker}-right`), feed: { ...draft(`${marker}-right`), title: `Cursor ${marker} right` } });
  await pool.query(
    "update feeds set updated_at = '2026-07-10T08:00:00.654321Z'::timestamptz where id in ($1, $2)",
    [left.feed.id, right.feed.id],
  );
  const expected = [left.feed.id, right.feed.id].sort();
  const source = new DatabaseFeedSource(drizzle(pool) as never);
  const firstPage = await source.searchAuthorized({ status: 'draft', query: marker, limit: 1 });
  assert.deepEqual(firstPage.items.map((item) => item.id), [expected[0]]);
  assert.ok(firstPage.nextCursor);
  const secondPage = await source.searchAuthorized({ status: 'draft', query: marker, limit: 1, cursor: firstPage.nextCursor! });
  assert.deepEqual(secondPage.items.map((item) => item.id), [expected[1]]);
  assert.equal(secondPage.nextCursor, null);
  assert.equal(new Set([...firstPage.items, ...secondPage.items].map((item) => item.id)).size, 2);
});

test('database public pages push sports ordering, stock filtering, and bounded pagination into PostgreSQL', async () => {
  const now = new Date('2026-07-10T12:00:00.000Z');
  const database = drizzle(pool);
  const fixture = (
    slug: string,
    category: Feed['category'],
    eventAt: string,
    overrides: Partial<typeof feeds.$inferInsert> = {},
  ): typeof feeds.$inferInsert => ({
    slug,
    title: `Public parity ${slug}`,
    subtitle: 'Bounded PostgreSQL list fixture',
    category,
    kind: 'news',
    topic: category === 'stock' ? '美股收盘' : 'Public parity',
    date: new Date(eventAt),
    eventAt: new Date(eventAt),
    eventKey: `${category}:public-parity:${slug}`,
    cover: '/images/public-parity.webp',
    coverStatus: 'pending',
    tags: [],
    summary: 'Public parity summary.',
    source: 'Example',
    sourceUrl: `https://example.com/${slug}`,
    body: 'Public parity body.',
    priority: 0,
    status: 'published',
    version: 1,
    origin: 'markdown',
    publishedAt: new Date(eventAt),
    archivedAt: null,
    contentHash: 'b'.repeat(64),
    ...overrides,
  });
  const inputs = [
    fixture('worldcup/public-parity-past', 'worldcup', '2026-07-09T12:00:00.000Z'),
    fixture('worldcup/public-parity-future-first', 'worldcup', '2098-07-10T12:00:00.000Z'),
    fixture('lol/public-parity-future-second', 'lol', '2099-07-10T12:00:00.000Z'),
    fixture('stock/public-parity-valid-close', 'stock', '2026-07-10T11:00:00.000Z'),
    fixture('stock/public-parity-unsupported', 'stock', '2026-07-10T10:00:00.000Z', { topic: '全球股市收盘' }),
    fixture('stock/public-parity-not-close', 'stock', '2026-07-10T09:00:00.000Z', {
      topic: '美股盘中',
      eventKey: 'stock:public-parity:not-final',
      title: '美国市场盘中波动',
      subtitle: '交易仍在继续',
    }),
    fixture('global/public-parity-new', 'global', '2026-07-10T08:00:00.000Z'),
    fixture('global/public-parity-middle', 'global', '2026-07-10T07:00:00.000Z'),
    fixture('global/public-parity-old', 'global', '2026-07-10T06:00:00.000Z'),
  ];
  await database.insert(feeds).values(inputs);
  const slugs = inputs.map((item) => item.slug);
  const stored = (await database.select().from(feeds).where(inArray(feeds.slug, slugs))).map(toDatabaseFeed);
  const source = new DatabaseFeedSource(database as never, () => now);

  for (const query of [
    { list: 'sports', page: 1, pageSize: 10 },
    { list: 'stock', page: 1, pageSize: 10 },
    { list: 'global', page: 1, pageSize: 2 },
    { list: 'global', page: 2, pageSize: 2 },
  ]) {
    const expected = createFeedPage(stored, query, now.getTime());
    const actual = await source.listPublished(query);
    assert.deepEqual(actual.items.map((item) => item.slug), expected.items.map((item) => item.slug));
    assert.equal(actual.hasMore, expected.hasMore);
    assert.ok(actual.items.length <= query.pageSize);
    assert.ok(actual.items.every((item) => item.body === ''));
  }

  assert.deepEqual(
    (await source.listPublished({ list: 'sports', page: 1, pageSize: 10 })).items.map((item) => item.slug),
    ['worldcup/public-parity-past', 'worldcup/public-parity-future-first', 'lol/public-parity-future-second'],
  );
  assert.deepEqual(
    (await source.listPublished({ list: 'stock', page: 1, pageSize: 10 })).items.map((item) => item.slug),
    ['stock/public-parity-valid-close'],
  );
});

test('fixed runtime grants enforce read-only Phase B and append-only write Phase D privileges', async () => {
  await pool.query(`do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'feeds_runtime') then
      create role feeds_runtime nologin;
    end if;
  end $$`);
  await pool.query('alter role feeds_runtime nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls');
  for (const statement of RUNTIME_READ_GRANT_STATEMENTS) await pool.query(statement);

  const client = await pool.connect();
  const denied = async (statement: string) => {
    await assert.rejects(
      () => client.query(statement),
      (error: unknown) => typeof error === 'object' && error !== null && 'code' in error && error.code === '42501',
    );
  };
  try {
    await client.query('set role feeds_runtime');
    await client.query('select count(*) from feeds');
    await denied("insert into feeds (slug) values ('ai/runtime-read-denied')");
    await denied('create table public.runtime_read_denied(id integer)');
    await denied('create temporary table runtime_temp_denied(id integer)');
    await denied('truncate feeds');
    await client.query('reset role');

    for (const statement of RUNTIME_WRITE_GRANT_STATEMENTS) await client.query(statement);
    await client.query('begin');
    await client.query('set local role feeds_runtime');
    const inserted = await client.query<{ id: string }>(`
      insert into feeds (
        slug, title, subtitle, category, kind, topic, date, event_at, event_key, cover,
        cover_status, tags, summary, source, source_url, body, priority, status, version,
        origin, published_at, archived_at, content_hash
      ) values (
        'ai/runtime-write-grant', 'Runtime write grant', 'Least privilege integration', 'ai',
        'news', 'Runtime grants', now(), now(), 'ai:runtime-write-grant', '/images/runtime.webp',
        'pending', '[]', 'Runtime write grant summary.', 'Example', 'https://example.com/runtime-write-grant',
        'Runtime write body.', 0, 'draft', 1, 'api', null, null, $1
      ) returning id::text
    `, ['c'.repeat(64)]);
    const feedId = inserted.rows[0].id;
    const revision = await client.query<{ id: string }>(
      "insert into feed_revisions (feed_id, version, snapshot) values ($1, 1, '{}'::jsonb) returning id::text",
      [feedId],
    );
    const audit = await client.query<{ id: string }>(`
      insert into feed_audit_events (
        feed_id, resulting_version, actor, action, reason, origin, idempotency_key, request_metadata
      ) values ($1, 1, 'api:feed-writer', 'draft_created', 'least privilege test', 'api',
        'runtime:grant:test:0001', '{}'::jsonb) returning id::text
    `, [feedId]);
    await client.query(`
      insert into feed_idempotency_keys (
        actor, operation, idempotency_key, request_hash, feed_id, result_version,
        result_action, revision_id, audit_event_id
      ) values ('api:feed-writer', 'save_draft', 'runtime:grant:test:0001', $1, $2, 1,
        'created', $3, $4)
    `, ['d'.repeat(64), feedId, revision.rows[0].id, audit.rows[0].id]);
    await client.query('update feeds set summary = summary where id = $1', [feedId]);
    await client.query('rollback');

    await client.query('set role feeds_runtime');
    await denied('delete from feeds');
    await denied('truncate feeds');
    await denied('update feed_audit_events set reason = reason');
    await denied('create table public.runtime_write_denied(id integer)');
    await denied('create temporary table runtime_write_temp_denied(id integer)');
    await client.query('reset role');
  } finally {
    try { await client.query('reset role'); } catch {}
    try { await client.query('rollback'); } catch {}
    client.release();
  }
});

test('MCP draft to publish uses the isolated database and records mcp origin', async () => {
  const result = await runMcpChild('integration', process.env);
  assert.equal(result.draftStatus, 'draft');
  assert.equal(result.draftOrigin, 'mcp');
  assert.equal(result.publishedStatus, 'published');
  assert.equal(result.publishedVersion, 2);
  assert.match(String(result.createdAuditEventId), /^[0-9a-f-]{36}$/);
  assert.match(String(result.publishedAuditEventId), /^[0-9a-f-]{36}$/);
  assert.equal(result.createReplayAuditMatches, true);
  assert.equal(result.createConflictCode, 'IDEMPOTENCY_CONFLICT');
  assert.equal(result.duplicateFound, true);
  assert.equal(result.publishReplayAuditMatches, true);
  assert.equal(result.publishConflictCode, 'IDEMPOTENCY_CONFLICT');
  assert.equal(result.cursorAdvanced, true);
  assert.equal(result.listGetRoundtrip, true);
  assert.equal(result.updatedStatus, 'published');
  assert.equal(result.updateReplayAuditMatches, true);
  assert.equal(result.updateConflictCode, 'IDEMPOTENCY_CONFLICT');
  assert.equal(result.archivedStatus, 'archived');
  assert.equal(result.archiveReplayAuditMatches, true);
  assert.equal(result.archiveConflictCode, 'IDEMPOTENCY_CONFLICT');
  assert.deepEqual(result.auditActions, ['draft_created', 'published', 'published_updated', 'archived']);
  assert.deepEqual(result.auditActors, Array(4).fill('mcp:feed-writer'));
  assert.deepEqual(result.auditOrigins, Array(4).fill('mcp'));
});

test('publish records advisory source/title evidence without blocking valid repeats', async () => {
  const candidateInput = draft('advisory-candidate');
  const candidate = await service.saveDraft({ ...context('advisory-candidate'), feed: candidateInput });
  const targetInput = {
    ...draft('advisory-target'),
    title: candidateInput.title,
    sourceUrl: candidateInput.sourceUrl,
  };
  const target = await service.saveDraft({ ...context('advisory-target'), feed: targetInput });
  const published = await service.publish({ ...context('advisory-publish'), feedId: target.feed.id, expectedVersion: 1 });
  assert.equal(published.feed.status, 'published');
  const audit = await pool.query('select request_metadata from feed_audit_events where id = $1', [published.auditEventId]);
  assert.deepEqual(audit.rows[0].request_metadata.duplicateEvidence.exact, { eventKey: 0, slug: 0 });
  assert.ok(audit.rows[0].request_metadata.duplicateEvidence.advisory.sourceUrl >= 1);
  assert.ok(audit.rows[0].request_metadata.duplicateEvidence.advisory.titleSimilarity >= 1);
  assert.equal(candidate.feed.status, 'draft');
});

test('invalid lifecycle transitions do not add mutation evidence', async () => {
  const draftFeed = await service.saveDraft({ ...context('invalid-state-create'), feed: draft('invalid-state') });
  await assert.rejects(
    () => service.archive({ ...context('invalid-state-archive'), feedId: draftFeed.feed.id, expectedVersion: 1 }),
    (error) => error instanceof FeedServiceError && error.code === 'INVALID_STATE_TRANSITION',
  );
  await assert.rejects(
    () => service.updatePublished({ ...context('invalid-state-update'), feedId: draftFeed.feed.id, expectedVersion: 1, patch: { summary: 'Not allowed' } }),
    (error) => error instanceof FeedServiceError && error.code === 'INVALID_STATE_TRANSITION',
  );
  const published = await service.publish({ ...context('invalid-state-publish'), feedId: draftFeed.feed.id, expectedVersion: 1 });
  await assert.rejects(
    () => service.publish({ ...context('invalid-state-republish'), feedId: draftFeed.feed.id, expectedVersion: published.feed.version }),
    (error) => error instanceof FeedServiceError && error.code === 'INVALID_STATE_TRANSITION',
  );
});

test('concurrent idempotent create commits one feed, revision, audit, and key', async () => {
  const command = { ...context('concurrent-create'), feed: draft('concurrent') };
  const [first, second] = await Promise.all([service.saveDraft(command), service.saveDraft(command)]);
  assert.equal(first.feed.id, second.feed.id);
  assert.equal(first.auditEventId, second.auditEventId);
  const rows = await pool.query("select count(*)::integer as count from feeds where event_key = 'ai:integration:concurrent'");
  assert.equal(rows.rows[0].count, 1);
});

test('concurrent draft updates with the same expected version allow exactly one writer', async () => {
  const input = draft('optimistic-lock');
  const created = await service.saveDraft({ ...context('lock-create'), feed: input });
  const attempts = await Promise.allSettled([
    service.saveDraft({ ...context('lock-update-a'), feedId: created.feed.id, expectedVersion: 1, feed: { ...input, title: 'Writer A' } }),
    service.saveDraft({ ...context('lock-update-b'), feedId: created.feed.id, expectedVersion: 1, feed: { ...input, title: 'Writer B' } }),
  ]);
  assert.equal(attempts.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = attempts.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  assert.ok(rejected?.reason instanceof FeedServiceError);
  assert.equal(rejected.reason.code, 'VERSION_CONFLICT');
  const current = await repository.getById(created.feed.id);
  assert.equal(current?.version, 2);
});

test('zero-row publish race replays the same request and conflicts a different request with the same key', async () => {
  const sameTarget = await service.saveDraft({ ...context('publish-race-same-create'), feed: draft('publish-race-same') });
  const sameCommand = { ...context('publish-race-same'), feedId: sameTarget.feed.id, expectedVersion: 1 };
  const sameRaceService = serviceWithIdempotencyPreflightBarrier(sameCommand.idempotencyKey);
  const [first, second] = await Promise.all([
    sameRaceService.publish(sameCommand),
    sameRaceService.publish(sameCommand),
  ]);
  assert.equal(first.auditEventId, second.auditEventId);
  assert.equal(first.feed.version, 2);
  assert.equal(second.feed.version, 2);

  const conflictTarget = await service.saveDraft({ ...context('publish-race-conflict-create'), feed: draft('publish-race-conflict') });
  const shared = { ...context('publish-race-conflict'), feedId: conflictTarget.feed.id, expectedVersion: 1 };
  const conflictRaceService = serviceWithIdempotencyPreflightBarrier(shared.idempotencyKey);
  const attempts = await Promise.allSettled([
    conflictRaceService.publish({ ...shared, reason: 'writer A' }),
    conflictRaceService.publish({ ...shared, reason: 'writer B' }),
  ]);
  assert.equal(attempts.filter((result) => result.status === 'fulfilled').length, 1);
  const rejected = attempts.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  assert.ok(rejected?.reason instanceof FeedServiceError);
  assert.equal(rejected.reason.code, 'IDEMPOTENCY_CONFLICT');
});

test('zero-row save, published-update, and archive races replay their original result', async () => {
  const saveInput = draft('save-race');
  const saveCreated = await service.saveDraft({ ...context('save-race-create'), feed: saveInput });
  const saveCommand = {
    ...context('save-race-update'),
    feedId: saveCreated.feed.id,
    expectedVersion: 1,
    feed: { ...saveInput, title: 'Save race result' },
  };
  const saveRace = serviceWithIdempotencyPreflightBarrier(saveCommand.idempotencyKey);
  const [saveFirst, saveSecond] = await Promise.all([saveRace.saveDraft(saveCommand), saveRace.saveDraft(saveCommand)]);
  assert.equal(saveFirst.auditEventId, saveSecond.auditEventId);

  const updateDraft = await service.saveDraft({ ...context('published-update-race-create'), feed: draft('published-update-race') });
  const updatePublished = await service.publish({ ...context('published-update-race-publish'), feedId: updateDraft.feed.id, expectedVersion: 1 });
  const updateCommand = {
    ...context('published-update-race'),
    feedId: updateDraft.feed.id,
    expectedVersion: updatePublished.feed.version,
    patch: { summary: 'Concurrent published update.' },
  };
  const updateRace = serviceWithIdempotencyPreflightBarrier(updateCommand.idempotencyKey);
  const [updateFirst, updateSecond] = await Promise.all([
    updateRace.updatePublished(updateCommand),
    updateRace.updatePublished(updateCommand),
  ]);
  assert.equal(updateFirst.auditEventId, updateSecond.auditEventId);

  const archiveDraft = await service.saveDraft({ ...context('archive-race-create'), feed: draft('archive-race') });
  const archivePublished = await service.publish({ ...context('archive-race-publish'), feedId: archiveDraft.feed.id, expectedVersion: 1 });
  const archiveCommand = {
    ...context('archive-race'),
    feedId: archiveDraft.feed.id,
    expectedVersion: archivePublished.feed.version,
  };
  const archiveRace = serviceWithIdempotencyPreflightBarrier(archiveCommand.idempotencyKey);
  const [archiveFirst, archiveSecond] = await Promise.all([
    archiveRace.archive(archiveCommand),
    archiveRace.archive(archiveCommand),
  ]);
  assert.equal(archiveFirst.auditEventId, archiveSecond.auditEventId);
});

test('audit failure rolls back the feed, revision, audit, and idempotency key', async () => {
  await pool.query(`
    create function reject_forced_audit() returns trigger language plpgsql as $$
    begin
      if new.reason = 'force rollback' then raise exception 'forced audit failure'; end if;
      return new;
    end $$
  `);
  await pool.query('create trigger reject_forced_audit before insert on feed_audit_events for each row execute function reject_forced_audit()');
  const beforeCounts = await Promise.all(['feeds', 'feed_revisions', 'feed_audit_events', 'feed_idempotency_keys'].map(count));
  await assert.rejects(
    () => service.saveDraft({ ...context('forced-rollback', 'force rollback'), feed: draft('rollback') }),
    (error) => error instanceof FeedServiceError && error.code === 'DATABASE_UNAVAILABLE',
  );
  const afterCounts = await Promise.all(['feeds', 'feed_revisions', 'feed_audit_events', 'feed_idempotency_keys'].map(count));
  assert.deepEqual(afterCounts, beforeCounts);
  await pool.query('drop trigger reject_forced_audit on feed_audit_events');
  await pool.query('drop function reject_forced_audit()');
});

test('database rejects physical feed deletion and history mutation', async () => {
  const feed = await service.saveDraft({ ...context('immutability'), feed: draft('immutability') });
  await assert.rejects(() => pool.query('delete from feeds where id = $1', [feed.feed.id]), /physical feed deletion is prohibited/);
  await assert.rejects(() => pool.query('update feed_audit_events set reason = reason where id = $1', [feed.auditEventId]), /append-only/);
  await assert.rejects(() => pool.query('delete from feed_revisions where feed_id = $1', [feed.feed.id]), /append-only/);
  await assert.rejects(() => pool.query("delete from feed_idempotency_keys where actor = 'api:feed-writer' and operation = 'save_draft' and feed_id = $1", [feed.feed.id]), /append-only/);
});

test('publish command blocks exact eventKey and slug evidence inside its atomic SQL', async () => {
  const archiveTarget = await service.saveDraft({ ...context('legacy-archive-create'), feed: draft('legacy-archive') });
  const archivePublished = await service.publish({ ...context('legacy-archive-publish'), feedId: archiveTarget.feed.id, expectedVersion: 1 });
  const eventKeyTarget = await service.saveDraft({ ...context('exact-event-target'), feed: draft('exact-event-target') });
  await pool.query('drop index feeds_event_key_unique');
  await pool.query('drop index feeds_slug_unique');
  await pool.query(`
    insert into feeds (
      slug, title, subtitle, category, kind, topic, date, event_at, event_key, cover, cover_status,
      tags, summary, source, source_url, body, priority, status, version, origin, published_at,
      archived_at, content_hash
    )
    select slug || '-duplicate', title, subtitle, category, kind, topic, date, event_at, event_key,
      cover, cover_status, tags, summary, source, source_url, body, priority, 'draft', 1, 'api', null,
      null, content_hash
    from feeds where id = $1
  `, [eventKeyTarget.feed.id]);
  const slugTarget = await service.saveDraft({ ...context('exact-slug-target'), feed: draft('exact-slug-target') });
  await pool.query(`
    insert into feeds (
      slug, title, subtitle, category, kind, topic, date, event_at, event_key, cover, cover_status,
      tags, summary, source, source_url, body, priority, status, version, origin, published_at,
      archived_at, content_hash
    )
    select slug, title, subtitle, category, kind, topic, date, event_at, event_key || ':duplicate',
      cover, cover_status, tags, summary, source, source_url, body, priority, 'draft', 1, 'api', null,
      null, content_hash
    from feeds where id = $1
  `, [slugTarget.feed.id]);
  await pool.query(`
    insert into feeds (
      slug, title, subtitle, category, kind, topic, date, event_at, event_key, cover, cover_status,
      tags, summary, source, source_url, body, priority, status, version, origin, published_at,
      archived_at, content_hash
    )
    select slug || '-duplicate', title, subtitle, category, kind, topic, date, event_at, event_key,
      cover, cover_status, tags, summary, source, source_url, body, priority, 'draft', 1, 'api', null,
      null, content_hash
    from feeds where id = $1
  `, [archiveTarget.feed.id]);
  const archived = await service.archive({
    ...context('legacy-archive-final'),
    feedId: archiveTarget.feed.id,
    expectedVersion: archivePublished.feed.version,
  });
  assert.equal(archived.feed.status, 'archived');
  const archiveAudit = await pool.query('select request_metadata from feed_audit_events where id = $1', [archived.auditEventId]);
  assert.deepEqual(archiveAudit.rows[0].request_metadata, { operation: 'archive' });
  const auditBefore = await count('feed_audit_events');
  for (const [key, feedId] of [
    ['exact-event-publish', eventKeyTarget.feed.id],
    ['exact-slug-publish', slugTarget.feed.id],
  ]) {
    await assert.rejects(
      () => service.publish({ ...context(key), feedId, expectedVersion: 1 }),
      (error) => error instanceof FeedServiceError && error.code === 'DUPLICATE_CONFLICT',
    );
    assert.equal((await repository.getById(feedId))?.status, 'draft');
  }
  assert.equal(await count('feed_audit_events'), auditBefore);
});

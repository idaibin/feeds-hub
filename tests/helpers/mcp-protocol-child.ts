import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Feed } from '../../src/domain/feed';
import type { FeedSource } from '../../src/domain/feed-source';
import { NeonFeedRepository, type FeedSqlExecutor } from '../../src/db/neon-feed-repository';
import { FeedService } from '../../src/lib/feed-service';
import { DatabaseFeedSource } from '../../src/lib/feed-sources/database';
import { createMcpRoute } from '../../src/pages/api/mcp';

const mode = process.argv[2];
const token = 'isolated-mcp-test-token-0000000000000000';

const exampleFeed: Feed = {
  id: 'ai/example-feed',
  slug: 'ai/example-feed',
  title: 'Example feed',
  subtitle: 'MCP compatibility fixture',
  category: 'ai',
  kind: 'news',
  topic: 'MCP',
  date: new Date('2026-07-10T08:00:00.000Z'),
  eventAt: new Date('2026-07-10T08:00:00.000Z'),
  eventKey: 'ai:example-feed',
  cover: '/images/ai/example.webp',
  coverStatus: 'pending',
  tags: ['AI'],
  summary: 'Compatibility summary.',
  source: 'Example',
  sourceUrl: 'https://example.com/mcp',
  body: 'Compatibility body.',
  priority: 0,
  status: 'published',
  version: 1,
  origin: 'markdown',
  publishedAt: new Date('2026-07-10T08:00:00.000Z'),
  archivedAt: null,
  createdAt: new Date('2026-07-10T08:00:00.000Z'),
  updatedAt: new Date('2026-07-10T08:00:00.000Z'),
};

const fixtureSource: FeedSource = {
  async listPublished() { return { items: [exampleFeed], page: 1, pageSize: 10, hasMore: false }; },
  async getBySlug(slug) { return slug === exampleFeed.slug ? exampleFeed : undefined; },
  async searchAuthorized() { return { items: [exampleFeed], nextCursor: null }; },
  async getAuthorized(input) { return input.id === exampleFeed.id || input.slug === exampleFeed.slug ? exampleFeed : undefined; },
};

function ssePayload(text: string) {
  const data = text.split('\n').find((line) => line.startsWith('data: '));
  if (!data) throw new Error('MCP response did not contain an SSE data event');
  return JSON.parse(data.slice(6));
}

async function invoke(route: ReturnType<typeof createMcpRoute>, body: unknown, protocolVersion = '2025-06-18') {
  const response = await Promise.race([
    route({
      request: new Request('http://127.0.0.1:4499/api/mcp', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'mcp-protocol-version': protocolVersion,
        },
        body: JSON.stringify(body),
      }),
      params: {},
    } as never),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('MCP route response timed out')), 4_000)),
  ]);
  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  return {
    response,
    text,
    payload: response.status === 202
      ? undefined
      : contentType.startsWith('text/event-stream') ? ssePayload(text) : JSON.parse(text),
  };
}

async function callTool(route: ReturnType<typeof createMcpRoute>, id: number, name: string, args: unknown) {
  const output = await invoke(route, { jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
  const toolText = output.payload?.result?.content?.[0]?.text;
  if (typeof toolText !== 'string') throw new Error(`Tool ${name} did not return text content`);
  let tool: unknown;
  try {
    tool = JSON.parse(toolText);
  } catch {
    tool = { message: toolText };
  }
  return { ...output, tool: tool as Record<string, any> };
}

async function compatibility() {
  const env = {
    FEED_MCP_ENABLED: 'true',
    FEED_MCP_AUTH_MODE: 'token',
    FEED_MCP_TOKEN: token,
    FEED_READ_SOURCE: 'content',
    FEED_WRITES_ENABLED: 'false',
  };
  const service = new FeedService(undefined, env, fixtureSource);
  const route = createMcpRoute({ service, env });
  const initialized = await invoke(route, {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'compat-test', version: '1.0.0' } },
  });
  const listed = await invoke(route, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const invalidProtocol = await invoke(route, { jsonrpc: '2.0', id: 20, method: 'tools/list', params: {} }, 'unsupported');
  const feeds = await callTool(route, 3, 'list_feeds', { status: 'published', limit: 1 });
  const feed = await callTool(route, 4, 'get_feed', { id: feeds.tool.items[0].id });
  const unknownField = await callTool(route, 21, 'list_feeds', { status: 'published', limit: 1, unexpected: true });
  const write = await callTool(route, 5, 'save_feed_draft', {
    feed: {
      slug: 'ai/write-disabled', title: 'Write disabled', subtitle: 'Compatibility test', category: 'ai', kind: 'news', topic: 'MCP',
      date: '2026-07-10T08:00:00Z', eventAt: '2026-07-10T08:00:00Z', eventKey: 'ai:write-disabled', cover: '/images/ai/write.webp',
      coverStatus: 'pending', tags: ['AI'], summary: 'Write disabled summary.', source: 'Example', sourceUrl: 'https://example.com/write',
      body: 'Write disabled body.', priority: 0,
    },
    idempotencyKey: 'mcp:write-disabled:0001',
    reason: 'verify write kill switch',
  });
  return {
    initializeStatus: initialized.response.status,
    initializeContentType: initialized.response.headers.get('content-type'),
    protocolVersion: initialized.payload?.result?.protocolVersion,
    invalidProtocolStatus: invalidProtocol.response.status,
    invalidProtocolCode: invalidProtocol.payload?.error?.code,
    tools: listed.payload?.result?.tools?.map((tool: { name: string }) => tool.name),
    strictSchemas: listed.payload?.result?.tools?.map((tool: { inputSchema?: { additionalProperties?: boolean } }) => tool.inputSchema?.additionalProperties),
    listSlug: feeds.tool.items?.[0]?.slug,
    getSlug: feed.tool.feed?.slug,
    writeError: write.tool.code,
    writeIsError: write.payload?.result?.isError,
    unknownFieldIsError: unknownField.payload?.result?.isError,
  };
}

async function integration() {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (connectionString !== 'postgresql://feeds_hub_test:feeds_hub_test@127.0.0.1:55432/feeds_hub_test' || process.env.FEED_DB_TARGET !== 'test') {
    throw new Error('MCP integration child requires the reviewed local feeds_hub_test database');
  }
  const pool = new pg.Pool({ connectionString, max: 2 });
  const executor: FeedSqlExecutor = {
    async query<T extends Record<string, unknown>>(text: string, values: unknown[] = []) {
      const output = await pool.query(text, values);
      return output.rows as T[];
    },
  };
  const env = { FEED_MCP_ENABLED: 'true', FEED_MCP_AUTH_MODE: 'token', FEED_MCP_TOKEN: token, FEED_READ_SOURCE: 'database', FEED_WRITES_ENABLED: 'true' };
  const repository = new NeonFeedRepository(executor);
  const source = new DatabaseFeedSource(drizzle(pool) as never);
  const service = new FeedService(repository, env, source);
  const route = createMcpRoute({ service, env });
  const suffix = `mcp-${process.pid}`;
  try {
    const feed = {
      slug: `ai/${suffix}`, title: `MCP integration ${suffix}`, subtitle: 'Isolated database MCP verification', category: 'ai', kind: 'news', topic: 'MCP',
      date: '2026-07-10T08:00:00Z', eventAt: '2026-07-10T08:00:00Z', eventKey: `ai:${suffix}`, cover: `/images/ai/${suffix}.webp`,
      coverStatus: 'pending', tags: ['AI'], summary: 'MCP integration summary.', source: 'Example', sourceUrl: `https://example.com/${suffix}`,
      body: 'MCP integration body.', priority: 0,
    };
    const createArgs = {
      feed,
      idempotencyKey: `mcp:create:${suffix}:0001`,
      reason: 'isolated MCP integration verification',
    };
    const created = await callTool(route, 11, 'save_feed_draft', createArgs);
    if (created.payload?.result?.isError) throw new Error(`Draft failed: ${JSON.stringify(created.tool)}`);
    const createReplay = await callTool(route, 12, 'save_feed_draft', createArgs);
    const createConflict = await callTool(route, 13, 'save_feed_draft', { ...createArgs, reason: 'conflicting MCP create request' });
    const duplicates = await callTool(route, 14, 'find_feed_duplicates', { slug: feed.slug, sourceUrl: feed.sourceUrl });

    const publishArgs = {
      feedId: created.tool.feed.id,
      expectedVersion: created.tool.feed.version,
      idempotencyKey: `mcp:publish:${suffix}:0001`,
      reason: 'isolated MCP publish verification',
    };
    const published = await callTool(route, 15, 'publish_feed', publishArgs);
    if (published.payload?.result?.isError) throw new Error(`Publish failed: ${JSON.stringify(published.tool)}`);
    const publishReplay = await callTool(route, 16, 'publish_feed', publishArgs);
    const publishConflict = await callTool(route, 17, 'publish_feed', { ...publishArgs, reason: 'conflicting MCP publish request' });

    const secondSuffix = `${suffix}-second`;
    const secondCreated = await callTool(route, 18, 'save_feed_draft', {
      feed: { ...feed, slug: `ai/${secondSuffix}`, title: `MCP integration ${secondSuffix}`, eventKey: `ai:${secondSuffix}`, cover: `/images/ai/${secondSuffix}.webp`, sourceUrl: `https://example.com/${secondSuffix}` },
      idempotencyKey: `mcp:create:${secondSuffix}:0001`,
      reason: 'create a second cursor fixture',
    });
    const secondPublished = await callTool(route, 19, 'publish_feed', {
      feedId: secondCreated.tool.feed.id,
      expectedVersion: secondCreated.tool.feed.version,
      idempotencyKey: `mcp:publish:${secondSuffix}:0001`,
      reason: 'publish a second cursor fixture',
    });
    if (secondPublished.payload?.result?.isError) throw new Error(`Second publish failed: ${JSON.stringify(secondPublished.tool)}`);

    const firstPage = await callTool(route, 20, 'list_feeds', { status: 'published', query: 'MCP integration', limit: 1 });
    const secondPage = await callTool(route, 21, 'list_feeds', { status: 'published', query: 'MCP integration', limit: 1, cursor: firstPage.tool.nextCursor });
    const selected = await callTool(route, 22, 'get_feed', { id: firstPage.tool.items[0].id });

    const updateArgs = {
      feedId: published.tool.feed.id,
      expectedVersion: published.tool.feed.version,
      patch: { summary: 'MCP integration summary updated.' },
      idempotencyKey: `mcp:update:${suffix}:0001`,
      reason: 'isolated MCP update verification',
    };
    const updated = await callTool(route, 23, 'update_published_feed', updateArgs);
    const updateReplay = await callTool(route, 24, 'update_published_feed', updateArgs);
    const updateConflict = await callTool(route, 25, 'update_published_feed', { ...updateArgs, reason: 'conflicting MCP update request' });

    const archiveArgs = {
      feedId: updated.tool.feed.id,
      expectedVersion: updated.tool.feed.version,
      idempotencyKey: `mcp:archive:${suffix}:0001`,
      reason: 'isolated MCP archive verification',
    };
    const archived = await callTool(route, 26, 'archive_feed', archiveArgs);
    const archiveReplay = await callTool(route, 27, 'archive_feed', archiveArgs);
    const archiveConflict = await callTool(route, 28, 'archive_feed', { ...archiveArgs, reason: 'conflicting MCP archive request' });
    const audit = await pool.query(
      "select action, actor, origin from feed_audit_events where feed_id = $1 order by resulting_version",
      [created.tool.feed.id],
    );
    return {
      draftStatus: created.tool.feed.status,
      draftOrigin: created.tool.feed.origin,
      publishedStatus: published.tool.feed.status,
      publishedVersion: published.tool.feed.version,
      createdAuditEventId: created.tool.auditEventId,
      publishedAuditEventId: published.tool.auditEventId,
      createReplayAuditMatches: createReplay.tool.auditEventId === created.tool.auditEventId,
      createConflictCode: createConflict.tool.code,
      duplicateFound: duplicates.tool.candidates?.some((candidate: { feedId: string }) => candidate.feedId === created.tool.feed.id),
      publishReplayAuditMatches: publishReplay.tool.auditEventId === published.tool.auditEventId,
      publishConflictCode: publishConflict.tool.code,
      cursorAdvanced: Boolean(firstPage.tool.nextCursor) && firstPage.tool.items[0].id !== secondPage.tool.items[0].id,
      listGetRoundtrip: selected.tool.feed.id === firstPage.tool.items[0].id,
      updatedStatus: updated.tool.feed.status,
      updateReplayAuditMatches: updateReplay.tool.auditEventId === updated.tool.auditEventId,
      updateConflictCode: updateConflict.tool.code,
      archivedStatus: archived.tool.feed.status,
      archiveReplayAuditMatches: archiveReplay.tool.auditEventId === archived.tool.auditEventId,
      archiveConflictCode: archiveConflict.tool.code,
      auditActions: audit.rows.map((row) => row.action),
      auditActors: audit.rows.map((row) => row.actor),
      auditOrigins: audit.rows.map((row) => row.origin),
    };
  } finally {
    await pool.end();
  }
}

try {
  const output = mode === 'compat' ? await compatibility() : mode === 'integration' ? await integration() : (() => { throw new Error('Unknown child mode'); })();
  console.log(`MCP_CHILD_RESULT=${JSON.stringify(output)}`);
} catch (error) {
  console.error(`MCP_CHILD_ERROR=${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
}

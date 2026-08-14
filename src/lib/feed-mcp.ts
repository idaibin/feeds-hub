import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import {
  FEED_CATEGORIES,
  FEED_COVER_STATUSES,
  FEED_KINDS,
  FEED_STATUSES,
  type Feed,
} from '@/domain/feed';
import { AuthorizedFeedReadError } from '@/lib/feed-authorized-read';
import {
  McpScopeError,
  mcpActor,
  requireMcpScope,
} from '@/lib/feed-mcp-security';
import { FeedService, FeedServiceError } from '@/lib/feed-service';
import {
  FeedValidationError,
  POSTGRES_INT4_MAX,
  parseArchiveCommand,
  parseDuplicateQuery,
  parsePublishCommand,
  parseSaveDraftCommand,
  parseUpdatePublishedCommand,
} from '@/lib/feed-validation';

function summary(feed: Feed) {
  return {
    id: feed.id,
    slug: feed.slug,
    title: feed.title,
    subtitle: feed.subtitle,
    category: feed.category,
    kind: feed.kind,
    topic: feed.topic,
    eventAt: feed.eventAt.toISOString(),
    status: feed.status,
    version: feed.version,
    summary: feed.summary,
    source: feed.source,
    sourceUrl: feed.sourceUrl,
    updatedAt: feed.updatedAt.toISOString(),
  };
}

function serializedFeed(feed: Feed) {
  return {
    ...feed,
    date: feed.date.toISOString(),
    eventAt: feed.eventAt.toISOString(),
    publishedAt: feed.publishedAt?.toISOString() ?? null,
    archivedAt: feed.archivedAt?.toISOString() ?? null,
    createdAt: feed.createdAt.toISOString(),
    updatedAt: feed.updatedAt.toISOString(),
  };
}

function result(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}

function failure(error: unknown) {
  if (error instanceof McpScopeError) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          code: 'MCP_SCOPE_REQUIRED',
          message: error.message,
          requiredScope: error.requiredScope,
        }),
      }],
      isError: true,
    };
  }
  if (error instanceof FeedValidationError || error instanceof AuthorizedFeedReadError) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          code: 'VALIDATION_FAILED',
          message: error.message,
          issues: error instanceof FeedValidationError ? error.issues : [],
        }),
      }],
      isError: true,
    };
  }
  if (error instanceof FeedServiceError) {
    const currentVersion = error.details?.currentVersion;
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          code: error.code,
          message: error.message,
          issues: error.issues,
          ...(typeof currentVersion === 'number' ? { details: { currentVersion } } : {}),
        }),
      }],
      isError: true,
    };
  }
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Feed operation failed' }) }],
    isError: true,
  };
}

const authorizedSearchSchema = z.object({
  status: z.enum(FEED_STATUSES).optional(),
  category: z.enum(FEED_CATEGORIES).optional(),
  query: z.string().trim().min(2).max(300).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).max(2048).optional(),
}).strict();

const safeSlug = z.string().min(3).max(700).regex(/^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/);
const feedLookupSchema = z.object({
  id: z.union([z.uuid(), safeSlug]).optional(),
  slug: safeSlug.optional(),
}).strict();

const duplicateSchema = z.object({
  feedId: z.uuid().optional(),
  slug: safeSlug.optional(),
  eventKey: z.string().trim().min(2).max(700).optional(),
  sourceUrl: z.url().max(4096).optional(),
  title: z.string().trim().min(2).max(300).optional(),
  category: z.enum(FEED_CATEGORIES).optional(),
}).strict();

const feedDraftSchema = z.object({
  slug: safeSlug,
  title: z.string().min(2).max(300),
  subtitle: z.string().min(2).max(500),
  category: z.enum(FEED_CATEGORIES),
  kind: z.enum(FEED_KINDS),
  topic: z.string().min(2).max(300),
  date: z.string().min(20).max(40),
  eventAt: z.string().min(20).max(40),
  eventKey: z.string().min(2).max(700),
  cover: z.string().min(1).max(1200),
  coverStatus: z.enum(FEED_COVER_STATUSES),
  tags: z.array(z.string().min(1).max(100)).max(64),
  summary: z.string().min(2).max(3000),
  source: z.string().min(2).max(300),
  sourceUrl: z.url().max(4096),
  body: z.string().min(1).max(50000),
  priority: z.number().int().min(-1000).max(1000),
}).strict();

const publishedPatchSchema = feedDraftSchema.omit({ slug: true, eventKey: true }).partial().strict()
  .refine((input) => Object.keys(input).length > 0, { message: 'patch must include at least one field' });
const idempotencyKey = z.string().regex(/^[A-Za-z0-9._:-]{16,200}$/);
const reason = z.string().trim().min(1).max(500);
const expectedVersion = z.number().int().min(1).max(POSTGRES_INT4_MAX);
const feedId = z.uuid();
const saveDraftSchema = z.object({
  feedId: feedId.optional(),
  expectedVersion: expectedVersion.optional(),
  feed: feedDraftSchema,
  idempotencyKey,
  reason,
}).strict();
const existingMutationSchema = z.object({ feedId, expectedVersion, idempotencyKey, reason }).strict();
const updatePublishedSchema = existingMutationSchema.extend({ patch: publishedPatchSchema }).strict();

function mutationResult(value: Awaited<ReturnType<FeedService['saveDraft']>>) {
  return result({ feed: serializedFeed(value.feed), action: value.action, auditEventId: value.auditEventId });
}

async function call(operation: () => Promise<ReturnType<typeof result>>) {
  try {
    return await operation();
  } catch (error) {
    return failure(error);
  }
}

export interface FeedMcpHandlerOptions {
  writesEnabled?: boolean;
}

export function createFeedMcpHandler(
  service = new FeedService(),
  options: FeedMcpHandlerOptions = {},
) {
  const writesEnabled = options.writesEnabled ?? process.env.FEED_WRITES_ENABLED === 'true';
  return createMcpHandler(
    (server) => {
      server.registerTool(
        'list_feeds',
        {
          title: 'List feeds',
          description: 'List authorized feeds with bounded filters and cursor pagination.',
          inputSchema: authorizedSearchSchema,
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async (input, extra) => {
          return call(async () => {
            requireMcpScope(extra.authInfo, 'feeds:read');
            const page = await service.listAuthorized(input);
            return result({ items: page.items.map(summary), nextCursor: page.nextCursor });
          });
        },
      );

      server.registerTool(
        'get_feed',
        {
          title: 'Get feed',
          description: 'Get one authorized feed by id or slug.',
          inputSchema: feedLookupSchema,
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async (input, extra) => call(async () => {
          requireMcpScope(extra.authInfo, 'feeds:read');
          const feed = await service.getAuthorized(input);
          if (!feed) throw new FeedServiceError('FEED_NOT_FOUND', 'Feed was not found');
          return result({ feed: serializedFeed(feed) });
        }),
      );

      server.registerTool(
        'find_feed_duplicates',
        {
          title: 'Find feed duplicates',
          description: 'Find exact and advisory duplicate candidates for a feed.',
          inputSchema: duplicateSchema,
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async (input, extra) => call(async () => {
          requireMcpScope(extra.authInfo, 'feeds:read');
          return result({ candidates: await service.findDuplicates(parseDuplicateQuery(input)) });
        }),
      );

      if (!writesEnabled) return;

      server.registerTool(
        'save_feed_draft',
        {
          title: 'Save feed draft',
          description: 'Create or optimistically update a validated feed draft.',
          inputSchema: saveDraftSchema,
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ idempotencyKey: key, ...input }, extra) => call(async () => {
          const authInfo = requireMcpScope(extra.authInfo, 'feeds:write');
          return mutationResult(await service.saveDraft(parseSaveDraftCommand(
            input,
            { actor: mcpActor(authInfo), origin: 'mcp', idempotencyKey: key, reason: input.reason },
          )));
        }),
      );

      server.registerTool(
        'publish_feed',
        {
          title: 'Publish feed',
          description: 'Publish a reviewed draft using optimistic locking.',
          inputSchema: existingMutationSchema,
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ feedId: id, idempotencyKey: key, ...input }, extra) => call(async () => {
          const authInfo = requireMcpScope(extra.authInfo, 'feeds:publish');
          return mutationResult(await service.publish(parsePublishCommand(
            input,
            { actor: mcpActor(authInfo), origin: 'mcp', idempotencyKey: key, reason: input.reason },
            id,
          )));
        }),
      );

      server.registerTool(
        'update_published_feed',
        {
          title: 'Update published feed',
          description: 'Update allowlisted editorial fields using optimistic locking.',
          inputSchema: updatePublishedSchema,
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ feedId: id, idempotencyKey: key, ...input }, extra) => call(async () => {
          const authInfo = requireMcpScope(extra.authInfo, 'feeds:write');
          return mutationResult(await service.updatePublished(parseUpdatePublishedCommand(
            input,
            { actor: mcpActor(authInfo), origin: 'mcp', idempotencyKey: key, reason: input.reason },
            id,
          )));
        }),
      );

      server.registerTool(
        'archive_feed',
        {
          title: 'Archive feed',
          description: 'Soft-archive a published feed using optimistic locking.',
          inputSchema: existingMutationSchema,
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        },
        async ({ feedId: id, idempotencyKey: key, ...input }, extra) => call(async () => {
          const authInfo = requireMcpScope(extra.authInfo, 'feeds:archive');
          return mutationResult(await service.archive(parseArchiveCommand(
            input,
            { actor: mcpActor(authInfo), origin: 'mcp', idempotencyKey: key, reason: input.reason },
            id,
          )));
        }),
      );
    },
    { serverInfo: { name: 'feeds-hub', version: '1.0.0' } },
    {
      basePath: '/api',
      disableSse: true,
      sessionIdGenerator: undefined,
      verboseLogs: false,
      maxDuration: 60,
    },
  );
}

import type { APIRoute } from 'astro';
import { createFeedMcpHandler } from '@/lib/feed-mcp';
import { McpHttpError, mcpHttpErrorResponse, prepareMcpRequest } from '@/lib/feed-mcp-security';
import { FeedService } from '@/lib/feed-service';

export const prerender = false;

export interface FeedMcpRouteOptions {
  service?: FeedService;
  env?: NodeJS.ProcessEnv;
}

export function createMcpRoute(options: FeedMcpRouteOptions = {}): APIRoute {
  const env = options.env ?? process.env;
  let handler: ReturnType<typeof createFeedMcpHandler> | undefined;
  return async ({ request }) => {
    try {
      const prepared = await prepareMcpRequest(request, env);
      handler ??= createFeedMcpHandler(
        options.service ?? new FeedService(undefined, env),
        { writesEnabled: env.FEED_WRITES_ENABLED === 'true' },
      );
      return await handler(prepared.request);
    } catch (error) {
      if (error instanceof McpHttpError && error.status === 403) {
        console.warn('MCP request rejected', {
          code: error.code,
          origin: request.headers.get('origin'),
        });
      }
      return mcpHttpErrorResponse(error);
    }
  };
}

const route = createMcpRoute();
export const GET = route;
export const POST = route;

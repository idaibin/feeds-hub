import type { APIRoute } from 'astro';
import { createFeedMcpHandler } from '@/lib/feed-mcp';
import { mcpHttpErrorResponse, prepareMcpRequest } from '@/lib/feed-mcp-security';
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
      handler ??= createFeedMcpHandler(options.service ?? new FeedService(undefined, env));
      return await handler(prepared.request);
    } catch (error) {
      return mcpHttpErrorResponse(error);
    }
  };
}

const route = createMcpRoute();
export const GET = route;
export const POST = route;

import type { APIRoute } from 'astro';
import { handleFeedApi, type FeedApiHandlerOptions } from '@/lib/feed-api';
import { parseDuplicateQuery } from '@/lib/feed-validation';

export const prerender = false;

export function createPostHandler(options: FeedApiHandlerOptions = {}): APIRoute {
  return ({ request }) => handleFeedApi(request, async ({ body, service }) => {
    return service.findDuplicates(parseDuplicateQuery(body));
  }, options);
}

export const POST = createPostHandler();

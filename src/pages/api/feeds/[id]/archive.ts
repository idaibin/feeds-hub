import type { APIRoute } from 'astro';
import { handleFeedApi, requireIdempotencyKey, type FeedApiHandlerOptions } from '@/lib/feed-api';
import { parseArchiveCommand } from '@/lib/feed-validation';

export const prerender = false;

export function createPostHandler(options: FeedApiHandlerOptions = {}): APIRoute {
  return ({ request, params }) => handleFeedApi(request, async ({ body, service, actor, origin }) => {
    const command = parseArchiveCommand(body, {
      actor,
      origin,
      idempotencyKey: requireIdempotencyKey(request),
      reason: '',
    }, params.id ?? '');
    return service.archive(command);
  }, options);
}

export const POST = createPostHandler();

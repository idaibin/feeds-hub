import type { APIRoute } from 'astro';
import { handleFeedApi, requireIdempotencyKey, type FeedApiHandlerOptions } from '@/lib/feed-api';
import { parseSaveDraftCommand } from '@/lib/feed-validation';

export const prerender = false;

export function createPostHandler(options: FeedApiHandlerOptions = {}): APIRoute {
  return ({ request }) => handleFeedApi(request, async ({ body, service, actor, origin }) => {
    const command = parseSaveDraftCommand(body, {
      actor,
      origin,
      idempotencyKey: requireIdempotencyKey(request),
      reason: '',
    });
    return service.saveDraft(command);
  }, options);
}

export const POST = createPostHandler();

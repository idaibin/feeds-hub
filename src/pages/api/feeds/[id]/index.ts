import type { APIRoute } from 'astro';
import { handleFeedApi, requireIdempotencyKey, type FeedApiHandlerOptions } from '@/lib/feed-api';
import { parseUpdatePublishedCommand } from '@/lib/feed-validation';

export const prerender = false;

export function createPatchHandler(options: FeedApiHandlerOptions = {}): APIRoute {
  return ({ request, params }) => handleFeedApi(request, async ({ body, service, actor, origin }) => {
    const command = parseUpdatePublishedCommand(body, {
      actor,
      origin,
      idempotencyKey: requireIdempotencyKey(request),
      reason: '',
    }, params.id ?? '');
    return service.updatePublished(command);
  }, options);
}

export const PATCH = createPatchHandler();

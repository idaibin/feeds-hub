import { createHash, timingSafeEqual } from 'node:crypto';
import { FeedServiceError, resolveFeedWritesEnabled } from '@/lib/feed-service';

export const HTTP_FEED_ACTOR: 'api:feed-writer' = 'api:feed-writer';

function digest(value: string) {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function authenticateFeedWriteRequest(request: Request, env: NodeJS.ProcessEnv = process.env) {
  if (!resolveFeedWritesEnabled(env)) throw new FeedServiceError('WRITES_DISABLED', 'Feed writes are disabled');
  const expected = env.FEED_WRITE_TOKEN;
  const authorization = request.headers.get('authorization');
  const provided = authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!expected || expected.length < 32 || !provided) {
    throw new FeedServiceError('AUTH_REQUIRED', 'Bearer authentication is required');
  }
  if (!timingSafeEqual(digest(expected), digest(provided))) {
    throw new FeedServiceError('AUTH_REQUIRED', 'Bearer authentication is required');
  }
  return { actor: HTTP_FEED_ACTOR, origin: 'api' as const };
}

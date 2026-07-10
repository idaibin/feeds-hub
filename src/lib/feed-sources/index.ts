import type { FeedSource } from '@/domain/feed-source';

export type FeedReadSource = 'content' | 'database';

export function resolveFeedReadSource(env: NodeJS.ProcessEnv = process.env): FeedReadSource {
  const value = env.FEED_READ_SOURCE;
  if (value === undefined || value === 'content') return 'content';
  if (value === 'database') return 'database';
  throw new Error('FEED_READ_SOURCE must be content or database');
}

export async function getFeedSource(env: NodeJS.ProcessEnv = process.env): Promise<FeedSource> {
  const source = resolveFeedReadSource(env);

  if (source === 'content') {
    const { ContentFeedSource } = await import('@/lib/feed-sources/content');
    return new ContentFeedSource();
  }

  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required when FEED_READ_SOURCE=database');
  const { DatabaseFeedSource } = await import('@/lib/feed-sources/database');
  return new DatabaseFeedSource();
}

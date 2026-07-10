import { getCollection, getEntry } from 'astro:content';
import type { Feed } from '@/domain/feed';
import type {
  AuthorizedFeedLookup,
  AuthorizedFeedSearch,
  FeedSource,
  PublicFeedPageQuery,
} from '@/domain/feed-source';
import { createAuthorizedFeedSearchPage, normalizeAuthorizedFeedLookup } from '@/lib/feed-authorized-read';
import { toDomainFeed } from '@/lib/feed-content-adapter';
import { createFeedPage } from '@/lib/feeds';

export async function getPublishedContentFeeds(): Promise<Feed[]> {
  const entries = await getCollection('feeds', ({ data }) => data.reviewed === true);
  return entries.map(toDomainFeed);
}

export async function getAuthorizedContentFeeds(): Promise<Feed[]> {
  return (await getCollection('feeds')).map(toDomainFeed);
}

export class ContentFeedSource implements FeedSource {
  async listPublished(query: PublicFeedPageQuery) {
    return createFeedPage(await getPublishedContentFeeds(), query);
  }

  async getBySlug(slug: string) {
    const entry = await getEntry('feeds', slug);
    if (!entry || entry.data.reviewed !== true) return undefined;
    return toDomainFeed(entry);
  }

  async searchAuthorized(input: AuthorizedFeedSearch) {
    return createAuthorizedFeedSearchPage(await getAuthorizedContentFeeds(), input, 'content');
  }

  async getAuthorized(input: AuthorizedFeedLookup) {
    normalizeAuthorizedFeedLookup(input);
    const entry = await getEntry('feeds', input.slug ?? input.id ?? '');
    return entry ? toDomainFeed(entry) : undefined;
  }
}

import type { Feed, FeedCategory, FeedStatus } from '@/domain/feed';

export const MAX_PUBLIC_FEED_PAGE = 1_000;
export const MAX_PUBLIC_FEED_PAGE_SIZE = 100;

export interface PublicFeedPageQuery {
  list: string;
  page: number;
  pageSize: number;
}

export interface FeedPage {
  items: Feed[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AuthorizedFeedSearch {
  status?: FeedStatus;
  category?: FeedCategory;
  query?: string;
  limit?: number;
  cursor?: string;
}

export interface AuthorizedFeedSearchPage {
  items: Feed[];
  nextCursor: string | null;
}

export interface AuthorizedFeedLookup {
  id?: string;
  slug?: string;
}

export interface FeedSource {
  listPublished(query: PublicFeedPageQuery): Promise<FeedPage>;
  getBySlug(slug: string): Promise<Feed | undefined>;
  searchAuthorized(input: AuthorizedFeedSearch): Promise<AuthorizedFeedSearchPage>;
  getAuthorized(input: AuthorizedFeedLookup): Promise<Feed | undefined>;
}

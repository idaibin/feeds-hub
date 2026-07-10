import type { APIRoute } from 'astro';
import { getFeedSource } from '@/lib/feed-sources';
import { isPublicFeedList } from '@/lib/feeds';
import { toFeedCardData, type FeedCardData } from '@/lib/feed-card-data';
import { MAX_PUBLIC_FEED_PAGE } from '@/domain/feed-source';

const PAGE_SIZE = 10;
export const prerender = false;

interface FeedPagePayload {
  items: FeedCardData[];
  hasMore: boolean;
}

export const GET: APIRoute = async ({ params }) => {
  const list = params.list ?? '';
  const pageValue = params.page ?? '';
  const pageNumber = Number(pageValue);
  if (
    !isPublicFeedList(list)
    || !/^[1-9]\d*$/.test(pageValue)
    || !Number.isSafeInteger(pageNumber)
    || pageNumber < 2
    || pageNumber > MAX_PUBLIC_FEED_PAGE
  ) {
    return new Response(null, { status: 404, statusText: 'Not found' });
  }

  const page = await (await getFeedSource()).listPublished({
    list,
    page: pageNumber,
    pageSize: PAGE_SIZE,
  });
  if (page.items.length === 0) return new Response(null, { status: 404, statusText: 'Not found' });

  const payload: FeedPagePayload = {
    items: page.items.map(toFeedCardData),
    hasMore: page.hasMore,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
};

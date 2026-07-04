import type { APIRoute, GetStaticPaths } from 'astro';
import { CATEGORIES, getAllFeeds, getFeedsByCategory } from '@/lib/feeds';
import { toFeedCardData, type FeedCardData } from '@/lib/feed-card-data';

const PAGE_SIZE = 10;

interface FeedPagePayload {
  items: FeedCardData[];
  hasMore: boolean;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allFeeds = await getAllFeeds();
  const lists = [
    { id: 'all', entries: allFeeds },
    ...CATEGORIES.map((category) => ({
      id: category.id,
      entries: getFeedsByCategory(allFeeds, category.id)
    }))
  ];

  return lists.flatMap(({ id, entries }) => {
    const pageCount = Math.ceil(entries.length / PAGE_SIZE);

    return Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) => {
      const page = index + 2;
      const start = (page - 1) * PAGE_SIZE;
      const pageEntries = entries.slice(start, start + PAGE_SIZE);

      return {
        params: { list: id, page: String(page) },
        props: {
          items: pageEntries.map(toFeedCardData),
          hasMore: page < pageCount
        } satisfies FeedPagePayload
      };
    });
  });
};

export const GET: APIRoute = ({ props }) => {
  return new Response(JSON.stringify(props), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
};

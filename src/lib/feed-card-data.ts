import type { Feed } from '@/domain/feed';
import { getDisplaySummary, getDisplayTitle } from '@/lib/feed-display';
import { formatDate, getCategoryMeta } from '@/lib/feeds';

export interface FeedCardData {
  id: string;
  href: string;
  category: string;
  categoryShortName: string;
  title: string;
  summary: string;
  eventAt: string;
  eventAtLabel: string;
}

export function toFeedCardData(feed: Feed): FeedCardData {
  const category = getCategoryMeta(feed.category);
  const title = getDisplayTitle(feed.title, feed.source);

  return {
    id: feed.slug,
    href: `/feed/${feed.slug}/`,
    category: feed.category,
    categoryShortName: category.shortName,
    title,
    summary: getDisplaySummary(feed.summary, title, feed.source),
    eventAt: feed.eventAt.toISOString(),
    eventAtLabel: formatDate(feed.eventAt),
  };
}

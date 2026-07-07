import type { CollectionEntry } from 'astro:content';
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

export function toFeedCardData(entry: CollectionEntry<'feeds'>): FeedCardData {
  const category = getCategoryMeta(entry.data.category);
  const title = getDisplayTitle(entry.data.title, entry.data.source);

  return {
    id: entry.id,
    href: `/feed/${entry.id}/`,
    category: entry.data.category,
    categoryShortName: category.shortName,
    title,
    summary: getDisplaySummary(entry.data.summary, title, entry.data.source),
    eventAt: entry.data.eventAt.toISOString(),
    eventAtLabel: formatDate(entry.data.eventAt),
  };
}

import type { CollectionEntry } from 'astro:content';
import { getDisplaySummary, getDisplayTitle } from '@/lib/feed-display';
import { formatDate, getCategoryMeta } from '@/lib/feeds';
import { getFallbackCover, getPosterRatioClass } from '@/lib/poster-display';

export interface FeedCardData {
  id: string;
  href: string;
  category: string;
  categoryShortName: string;
  title: string;
  summary: string;
  cover: string;
  fallbackCover: string;
  coverStatus: string;
  hasGeneratedCover: boolean;
  eventAt: string;
  eventAtLabel: string;
  posterRatioClass: string;
}

export function toFeedCardData(entry: CollectionEntry<'feeds'>): FeedCardData {
  const category = getCategoryMeta(entry.data.category);
  const fallbackCover = getFallbackCover(entry.data.category, entry.data.fallbackCover);
  const title = getDisplayTitle(entry.data.title, entry.data.source);

  return {
    id: entry.id,
    href: `/feed/${entry.id}/`,
    category: entry.data.category,
    categoryShortName: category.shortName,
    title,
    summary: getDisplaySummary(entry.data.summary, title, entry.data.source),
    cover: entry.data.cover,
    fallbackCover,
    coverStatus: entry.data.coverStatus,
    hasGeneratedCover: entry.data.coverStatus === 'generated_webp',
    eventAt: entry.data.eventAt.toISOString(),
    eventAtLabel: formatDate(entry.data.eventAt),
    posterRatioClass: getPosterRatioClass(entry.data.category, entry.data.kind),
  };
}

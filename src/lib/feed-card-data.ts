import type { CollectionEntry } from 'astro:content';
import { getCategoryMeta } from '@/lib/feeds';

export interface FeedCardData {
  id: string;
  href: string;
  category: string;
  categoryShortName: string;
  title: string;
  summary: string;
  cover: string;
  fallbackCover: string;
}

export function toFeedCardData(entry: CollectionEntry<'feeds'>): FeedCardData {
  const category = getCategoryMeta(entry.data.category);

  return {
    id: entry.id,
    href: `/feed/${entry.id}/`,
    category: entry.data.category,
    categoryShortName: category.shortName,
    title: entry.data.title,
    summary: entry.data.summary,
    cover: entry.data.cover,
    fallbackCover: entry.data.fallbackCover ?? `/images/${entry.data.category}/init.webp`
  };
}

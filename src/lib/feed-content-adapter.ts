import type { CollectionEntry } from 'astro:content';
import type { Feed } from '@/domain/feed';

export function toDomainFeed(entry: CollectionEntry<'feeds'>): Feed {
  const status = entry.data.reviewed ? 'published' : 'draft';

  return {
    id: entry.id,
    slug: entry.id,
    title: entry.data.title,
    subtitle: entry.data.subtitle,
    category: entry.data.category,
    kind: entry.data.kind,
    topic: entry.data.topic,
    date: entry.data.date,
    eventAt: entry.data.eventAt,
    eventKey: entry.data.eventKey,
    cover: entry.data.cover,
    coverStatus: entry.data.coverStatus,
    tags: entry.data.tags,
    summary: entry.data.summary,
    source: entry.data.source,
    sourceUrl: entry.data.sourceUrl,
    body: entry.body ?? '',
    priority: entry.data.priority,
    status,
    version: 1,
    origin: 'markdown',
    publishedAt: status === 'published' ? entry.data.date : null,
    archivedAt: null,
    createdAt: entry.data.date,
    updatedAt: entry.data.date,
  };
}

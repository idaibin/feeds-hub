import { createHash } from 'node:crypto';
import type { FeedCategory, FeedCoverStatus, FeedKind, FeedStatus } from './feed';

export const FEED_HASH_VERSION = 'feed-v1';

export interface FeedHashInput {
  slug: string;
  title: string;
  subtitle: string;
  category: FeedCategory;
  kind: FeedKind;
  topic: string;
  date: string | Date;
  eventAt: string | Date;
  eventKey: string;
  cover: string;
  coverStatus: FeedCoverStatus;
  tags: readonly string[];
  summary: string;
  source: string;
  sourceUrl: string;
  body: string;
  priority: number;
  status: FeedStatus;
}

function timestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

export function calculateFeedV1ContentHash(feed: FeedHashInput) {
  const serialized = JSON.stringify({
    hashVersion: FEED_HASH_VERSION,
    slug: feed.slug,
    title: feed.title,
    subtitle: feed.subtitle,
    category: feed.category,
    kind: feed.kind,
    topic: feed.topic,
    date: timestamp(feed.date),
    eventAt: timestamp(feed.eventAt),
    eventKey: feed.eventKey,
    cover: feed.cover,
    coverStatus: feed.coverStatus,
    tags: feed.tags,
    summary: feed.summary,
    source: feed.source,
    sourceUrl: feed.sourceUrl,
    body: feed.body,
    priority: feed.priority,
    status: feed.status,
  });
  return createHash('sha256').update(serialized, 'utf8').digest('hex');
}

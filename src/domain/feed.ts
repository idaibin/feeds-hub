export const FEED_CATEGORIES = [
  'worldcup',
  'lol',
  'stock',
  'ai',
  'github',
  'hot',
  'compute',
  'global',
  'rust',
  'dev',
  'security',
  'product',
] as const;

export const FEED_KINDS = [
  'match_result',
  'match_schedule',
  'match_flow',
  'player_spotlight',
  'knockout_update',
  'worldcup_feed',
  'hot_topic',
  'market_brief',
  'policy_update',
  'news',
  'breaking',
  'insight',
  'ai',
  'data',
  'visual',
] as const;

export const FEED_COVER_STATUSES = ['pending'] as const;
export const FEED_STATUSES = ['draft', 'published', 'archived'] as const;
export const FEED_ORIGINS = ['markdown', 'api', 'mcp'] as const;

export type FeedCategory = (typeof FEED_CATEGORIES)[number];
export type FeedKind = (typeof FEED_KINDS)[number];
export type FeedCoverStatus = (typeof FEED_COVER_STATUSES)[number];
export type FeedStatus = (typeof FEED_STATUSES)[number];
export type FeedOrigin = (typeof FEED_ORIGINS)[number];

export interface Feed {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: FeedCategory;
  kind: FeedKind;
  topic: string;
  date: Date;
  eventAt: Date;
  eventKey: string;
  cover: string;
  coverStatus: FeedCoverStatus;
  tags: string[];
  summary: string;
  source: string;
  sourceUrl: string;
  body: string;
  priority: number;
  status: FeedStatus;
  version: number;
  origin: FeedOrigin;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

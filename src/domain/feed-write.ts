import type { Feed, FeedCategory, FeedCoverStatus, FeedKind, FeedStatus } from './feed';

export const FEED_MUTATION_OPERATIONS = ['save_draft', 'publish', 'update_published', 'archive'] as const;
export const FEED_AUDIT_ACTIONS = [
  'draft_created',
  'draft_updated',
  'published',
  'published_updated',
  'archived',
] as const;
export const FEED_MUTATION_RESULTS = ['created', 'published', 'updated', 'archived'] as const;

export type FeedMutationOperation = (typeof FEED_MUTATION_OPERATIONS)[number];
export type FeedAuditAction = (typeof FEED_AUDIT_ACTIONS)[number];
export type FeedMutationAction = (typeof FEED_MUTATION_RESULTS)[number];

export interface FeedDraftInput {
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
}

export type PublishedFeedPatch = Partial<Omit<FeedDraftInput, 'slug' | 'eventKey'>>;

export interface DuplicateQuery {
  feedId?: string;
  slug?: string;
  eventKey?: string;
  sourceUrl?: string;
  title?: string;
  category?: FeedCategory;
}

export interface DuplicateCandidate {
  feedId: string;
  slug: string;
  eventKey: string;
  sourceUrl: string;
  status: FeedStatus;
  reasons: Array<'event_key' | 'slug' | 'source_url' | 'title_similarity'>;
}

export interface MutationContext {
  actor: string;
  reason: string;
  idempotencyKey: string;
  origin: 'api' | 'mcp';
}

export interface SaveDraftCommand extends MutationContext {
  feedId?: string;
  expectedVersion?: number;
  feed: FeedDraftInput;
}

export interface PublishCommand extends MutationContext {
  feedId: string;
  expectedVersion: number;
}

export interface UpdatePublishedCommand extends MutationContext {
  feedId: string;
  expectedVersion: number;
  patch: PublishedFeedPatch;
}

export interface ArchiveCommand extends MutationContext {
  feedId: string;
  expectedVersion: number;
}

export interface MutationResult {
  feed: Feed;
  action: FeedMutationAction;
  auditEventId: string;
}

export type FeedWriteErrorCode =
  | 'AUTH_REQUIRED'
  | 'WRITES_DISABLED'
  | 'VALIDATION_FAILED'
  | 'DUPLICATE_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'VERSION_CONFLICT'
  | 'FEED_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ValidationIssue {
  path: string;
  message: string;
}

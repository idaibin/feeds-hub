import type { Feed, FeedStatus } from './feed';
import type {
  ArchiveCommand,
  DuplicateCandidate,
  DuplicateQuery,
  FeedMutationOperation,
  MutationResult,
  PublishCommand,
  SaveDraftCommand,
  UpdatePublishedCommand,
} from './feed-write';

export type RepositoryErrorCode =
  | 'DUPLICATE_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'VERSION_CONFLICT'
  | 'FEED_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'DATABASE_UNAVAILABLE';

export class FeedRepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'FeedRepositoryError';
  }
}

export interface FeedRepository {
  getById(feedId: string): Promise<Feed | undefined>;
  findDuplicates(input: DuplicateQuery): Promise<DuplicateCandidate[]>;
  findIdempotentResult(input: {
    actor: string;
    operation: FeedMutationOperation;
    idempotencyKey: string;
    requestHash: string;
  }): Promise<MutationResult | undefined>;
  saveDraft(command: SaveDraftCommand, requestHash: string, contentHash: string): Promise<MutationResult>;
  publish(command: PublishCommand, requestHash: string, contentHash: string): Promise<MutationResult>;
  updatePublished(command: UpdatePublishedCommand, requestHash: string, contentHash: string): Promise<MutationResult>;
  archive(command: ArchiveCommand, requestHash: string, contentHash: string): Promise<MutationResult>;
  getCurrentState(feedId: string): Promise<{ status: FeedStatus; version: number } | undefined>;
}

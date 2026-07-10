import type { FeedRepository } from '@/domain/feed-repository';
import { FeedRepositoryError } from '@/domain/feed-repository';
import type { AuthorizedFeedLookup, AuthorizedFeedSearch, FeedSource } from '@/domain/feed-source';
import type {
  ArchiveCommand,
  DuplicateQuery,
  FeedWriteErrorCode,
  MutationResult,
  PublishCommand,
  SaveDraftCommand,
  UpdatePublishedCommand,
  ValidationIssue,
} from '@/domain/feed-write';
import { NeonFeedRepository } from '@/db/neon-feed-repository';
import { getFeedSource } from '@/lib/feed-sources';
import {
  calculateRuntimeContentHash,
  feedToDraftInput,
  hashCanonicalRequest,
} from '@/lib/feed-validation';

export class FeedServiceError extends Error {
  constructor(
    public readonly code: FeedWriteErrorCode,
    message: string,
    public readonly issues: ValidationIssue[] = [],
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'FeedServiceError';
  }
}

export function resolveFeedWritesEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.FEED_WRITES_ENABLED === 'true';
}

function translateRepositoryError(error: unknown): never {
  if (error instanceof FeedRepositoryError) {
    throw new FeedServiceError(error.code, error.message, [], error.details);
  }
  throw new FeedServiceError('DATABASE_UNAVAILABLE', 'Feed database is unavailable');
}

export class FeedService {
  constructor(
    private repository: FeedRepository | undefined = undefined,
    private readonly env: NodeJS.ProcessEnv = process.env,
    private feedSource: FeedSource | undefined = undefined,
  ) {}

  private getRepository() {
    try {
      this.repository ??= new NeonFeedRepository();
    } catch {
      throw new FeedServiceError('DATABASE_UNAVAILABLE', 'Feed database is unavailable');
    }
    return this.repository;
  }

  private assertWritesEnabled() {
    if (!resolveFeedWritesEnabled(this.env)) throw new FeedServiceError('WRITES_DISABLED', 'Feed writes are disabled');
  }

  private async getAuthorizedFeedSource() {
    try {
      this.feedSource ??= await getFeedSource(this.env);
      return this.feedSource;
    } catch {
      throw new FeedServiceError('DATABASE_UNAVAILABLE', 'Feed source is unavailable');
    }
  }

  async listAuthorized(input: AuthorizedFeedSearch) {
    return (await this.getAuthorizedFeedSource()).searchAuthorized(input);
  }

  async getAuthorized(input: AuthorizedFeedLookup) {
    return (await this.getAuthorizedFeedSource()).getAuthorized(input);
  }

  async findDuplicates(query: DuplicateQuery) {
    try {
      return await this.getRepository().findDuplicates(query);
    } catch (error) {
      translateRepositoryError(error);
    }
  }

  async saveDraft(command: SaveDraftCommand): Promise<MutationResult> {
    this.assertWritesEnabled();
    const repository = this.getRepository();
    const requestHash = hashCanonicalRequest({ operation: 'save_draft', ...command, idempotencyKey: undefined });
    try {
      const replay = await repository.findIdempotentResult({
        actor: command.actor,
        operation: 'save_draft',
        idempotencyKey: command.idempotencyKey,
        requestHash,
      });
      if (replay) return replay;
      const duplicates = await repository.findDuplicates({
        feedId: command.feedId,
        slug: command.feed.slug,
        eventKey: command.feed.eventKey,
        sourceUrl: command.feed.sourceUrl,
        title: command.feed.title,
      });
      if (duplicates.some((candidate) => candidate.reasons.includes('slug') || candidate.reasons.includes('event_key'))) {
        throw new FeedServiceError('DUPLICATE_CONFLICT', 'Feed slug or event key already exists');
      }
      const contentHash = calculateRuntimeContentHash(command.feed, 'draft');
      return await repository.saveDraft(command, requestHash, contentHash);
    } catch (error) {
      if (error instanceof FeedServiceError) throw error;
      translateRepositoryError(error);
    }
  }

  async publish(command: PublishCommand): Promise<MutationResult> {
    this.assertWritesEnabled();
    const repository = this.getRepository();
    const requestHash = hashCanonicalRequest({ operation: 'publish', ...command, idempotencyKey: undefined });
    try {
      const current = await repository.getById(command.feedId);
      if (!current) throw new FeedServiceError('FEED_NOT_FOUND', 'Feed was not found');
      const contentHash = calculateRuntimeContentHash(feedToDraftInput(current), 'published');
      return await repository.publish(command, requestHash, contentHash);
    } catch (error) {
      if (error instanceof FeedServiceError) throw error;
      translateRepositoryError(error);
    }
  }

  async updatePublished(command: UpdatePublishedCommand): Promise<MutationResult> {
    this.assertWritesEnabled();
    const repository = this.getRepository();
    const requestHash = hashCanonicalRequest({ operation: 'update_published', ...command, idempotencyKey: undefined });
    try {
      const current = await repository.getById(command.feedId);
      if (!current) throw new FeedServiceError('FEED_NOT_FOUND', 'Feed was not found');
      const next = { ...feedToDraftInput(current), ...command.patch };
      if (next.category !== next.slug.split('/')[0]) {
        throw new FeedServiceError('VALIDATION_FAILED', 'Category must match the feed slug', [
          { path: 'patch.category', message: 'must match the first slug segment' },
        ]);
      }
      const contentHash = calculateRuntimeContentHash(next, 'published');
      return await repository.updatePublished(command, requestHash, contentHash);
    } catch (error) {
      if (error instanceof FeedServiceError) throw error;
      translateRepositoryError(error);
    }
  }

  async archive(command: ArchiveCommand): Promise<MutationResult> {
    this.assertWritesEnabled();
    const repository = this.getRepository();
    const requestHash = hashCanonicalRequest({ operation: 'archive', ...command, idempotencyKey: undefined });
    try {
      const current = await repository.getById(command.feedId);
      if (!current) throw new FeedServiceError('FEED_NOT_FOUND', 'Feed was not found');
      const contentHash = calculateRuntimeContentHash(feedToDraftInput(current), 'archived');
      return await repository.archive(command, requestHash, contentHash);
    } catch (error) {
      if (error instanceof FeedServiceError) throw error;
      translateRepositoryError(error);
    }
  }
}

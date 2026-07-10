import type { NeonQueryFunction } from '@neondatabase/serverless';
import type { Feed } from '@/domain/feed';
import {
  FeedRepositoryError,
  type FeedRepository,
} from '@/domain/feed-repository';
import type {
  ArchiveCommand,
  DuplicateCandidate,
  DuplicateQuery,
  FeedMutationAction,
  FeedMutationOperation,
  MutationResult,
  PublishCommand,
  SaveDraftCommand,
  UpdatePublishedCommand,
} from '@/domain/feed-write';
import { createNeonQuery } from '@/db/client';
import { getRuntimeDatabaseUrl } from '@/db/runtime-environment';

export interface FeedSqlExecutor {
  query<T extends Record<string, unknown>>(text: string, values?: unknown[]): Promise<T[]>;
}

interface FeedRecord extends Record<string, unknown> {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: Feed['category'];
  kind: Feed['kind'];
  topic: string;
  date: string | Date;
  event_at: string | Date;
  event_key: string;
  cover: string;
  cover_status: Feed['coverStatus'];
  tags: string[];
  summary: string;
  source: string;
  source_url: string;
  body: string;
  priority: number;
  status: Feed['status'];
  version: number;
  origin: Feed['origin'];
  published_at: string | Date | null;
  archived_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
}

interface MutationRecord extends FeedRecord {
  audit_event_id: string;
  result_action: FeedMutationAction;
}

function date(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function nullableDate(value: string | Date | null) {
  return value === null ? null : date(value);
}

export function toRepositoryFeed(row: FeedRecord): Feed {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    kind: row.kind,
    topic: row.topic,
    date: date(row.date),
    eventAt: date(row.event_at),
    eventKey: row.event_key,
    cover: row.cover,
    coverStatus: row.cover_status,
    tags: row.tags,
    summary: row.summary,
    source: row.source,
    sourceUrl: row.source_url,
    body: row.body,
    priority: row.priority,
    status: row.status,
    version: row.version,
    origin: row.origin,
    publishedAt: nullableDate(row.published_at),
    archivedAt: nullableDate(row.archived_at),
    createdAt: date(row.created_at),
    updatedAt: date(row.updated_at),
  };
}

export function createNeonExecutor(sql: NeonQueryFunction<false, false>): FeedSqlExecutor {
  return {
    async query<T extends Record<string, unknown>>(text: string, values: unknown[] = []) {
      return await sql.query(text, values) as T[];
    },
  };
}

function mutationResult(row: MutationRecord): MutationResult {
  return { feed: toRepositoryFeed(row), action: row.result_action, auditEventId: row.audit_event_id };
}

function isDatabaseError(error: unknown): error is { code?: string; constraint?: string } {
  return typeof error === 'object' && error !== null;
}

function duplicateError(error: unknown) {
  if (!isDatabaseError(error) || error.code !== '23505') return undefined;
  if (error.constraint === 'feed_idempotency_scope_unique') return 'idempotency';
  if (error.constraint === 'feeds_slug_unique' || error.constraint === 'feeds_event_key_unique') return 'feed';
  return undefined;
}

const SELECT_FEED = `
  select id::text, slug, title, subtitle, category::text, kind::text, topic, date,
    event_at, event_key, cover, cover_status::text, tags, summary, source, source_url,
    body, priority, status::text, version, origin::text, published_at, archived_at,
    created_at, updated_at
  from feeds
`;

const RETURN_MUTATION = `
  select changed.id::text, changed.slug, changed.title, changed.subtitle,
    changed.category::text, changed.kind::text, changed.topic, changed.date,
    changed.event_at, changed.event_key, changed.cover, changed.cover_status::text,
    changed.tags, changed.summary, changed.source, changed.source_url, changed.body,
    changed.priority, changed.status::text, changed.version, changed.origin::text,
    changed.published_at, changed.archived_at, changed.created_at, changed.updated_at,
    audit.id::text as audit_event_id, recorded.result_action::text as result_action
  from changed
  join revision on revision.feed_id = changed.id
  join audit on audit.feed_id = changed.id
  join recorded on recorded.feed_id = changed.id
`;

export class NeonFeedRepository implements FeedRepository {
  constructor(private readonly executor: FeedSqlExecutor = createNeonExecutor(createNeonQuery(getRuntimeDatabaseUrl()))) {}

  async getById(feedId: string) {
    const rows = await this.executor.query<FeedRecord>(`${SELECT_FEED} where id = $1::uuid limit 1`, [feedId]);
    return rows[0] ? toRepositoryFeed(rows[0]) : undefined;
  }

  async getCurrentState(feedId: string) {
    const rows = await this.executor.query<{ status: Feed['status']; version: number }>(
      'select status::text as status, version from feeds where id = $1::uuid limit 1',
      [feedId],
    );
    return rows[0];
  }

  async findDuplicates(input: DuplicateQuery): Promise<DuplicateCandidate[]> {
    const rows = await this.executor.query<{
      feed_id: string;
      slug: string;
      event_key: string;
      source_url: string;
      status: Feed['status'];
      event_key_match: boolean;
      slug_match: boolean;
      source_url_match: boolean;
      title_match: boolean;
    }>(`
      select id::text as feed_id, slug, event_key, source_url, status::text,
        ($2::text is not null and event_key = $2) as event_key_match,
        ($3::text is not null and slug = $3) as slug_match,
        ($4::text is not null and source_url = $4) as source_url_match,
        ($5::text is not null and similarity(lower(regexp_replace(title, '\\s+', ' ', 'g')), lower(regexp_replace($5, '\\s+', ' ', 'g'))) >= 0.65) as title_match
      from feeds
      where ($1::uuid is null or id <> $1)
        and ($6::feed_category is null or category = $6)
        and (
          ($2::text is not null and event_key = $2)
          or ($3::text is not null and slug = $3)
          or ($4::text is not null and source_url = $4)
          or ($5::text is not null
            and lower(regexp_replace(title, '\\s+', ' ', 'g')) % lower(regexp_replace($5, '\\s+', ' ', 'g'))
            and similarity(lower(regexp_replace(title, '\\s+', ' ', 'g')), lower(regexp_replace($5, '\\s+', ' ', 'g'))) >= 0.65)
        )
      order by updated_at desc, id
      limit 50
    `, [input.feedId ?? null, input.eventKey ?? null, input.slug ?? null, input.sourceUrl ?? null, input.title ?? null, input.category ?? null]);

    return rows.map((row) => ({
      feedId: row.feed_id,
      slug: row.slug,
      eventKey: row.event_key,
      sourceUrl: row.source_url,
      status: row.status,
      reasons: [
        ...(row.event_key_match ? ['event_key' as const] : []),
        ...(row.slug_match ? ['slug' as const] : []),
        ...(row.source_url_match ? ['source_url' as const] : []),
        ...(row.title_match ? ['title_similarity' as const] : []),
      ],
    }));
  }

  async findIdempotentResult(input: { actor: string; operation: FeedMutationOperation; idempotencyKey: string; requestHash: string }) {
    const rows = await this.executor.query<{
      request_hash: string;
      snapshot: FeedRecord;
      audit_event_id: string;
      result_action: FeedMutationAction;
    }>(`
      select key.request_hash, revision.snapshot, key.audit_event_id::text, key.result_action::text
      from feed_idempotency_keys as key
      join feed_revisions as revision on revision.id = key.revision_id
      where key.actor = $1 and key.operation = $2::feed_mutation_operation and key.idempotency_key = $3
      limit 1
    `, [input.actor, input.operation, input.idempotencyKey]);
    const row = rows[0];
    if (!row) return undefined;
    if (row.request_hash !== input.requestHash) {
      throw new FeedRepositoryError('IDEMPOTENCY_CONFLICT', 'Idempotency key was used for a different request');
    }
    return { feed: toRepositoryFeed(row.snapshot), action: row.result_action, auditEventId: row.audit_event_id };
  }

  private async classifyMissing(feedId: string, expectedVersion: number, requiredStatus: Feed['status']): Promise<never> {
    const current = await this.getCurrentState(feedId);
    if (!current) throw new FeedRepositoryError('FEED_NOT_FOUND', 'Feed was not found');
    if (current.version !== expectedVersion) {
      throw new FeedRepositoryError('VERSION_CONFLICT', 'Feed version changed', { currentVersion: current.version });
    }
    if (current.status !== requiredStatus) {
      throw new FeedRepositoryError('INVALID_STATE_TRANSITION', `Feed must be ${requiredStatus}`);
    }
    throw new FeedRepositoryError('DATABASE_UNAVAILABLE', 'Mutation did not produce a result');
  }

  private async afterMutationError(error: unknown, input: { actor: string; operation: FeedMutationOperation; idempotencyKey: string; requestHash: string }) {
    const kind = duplicateError(error);
    if (kind === 'idempotency' || kind === 'feed') {
      const replay = await this.findIdempotentResult(input);
      if (replay) return replay;
    }
    if (kind === 'feed') throw new FeedRepositoryError('DUPLICATE_CONFLICT', 'Feed slug or event key already exists');
    throw new FeedRepositoryError('DATABASE_UNAVAILABLE', 'Database mutation failed');
  }

  async saveDraft(command: SaveDraftCommand, requestHash: string, contentHash: string): Promise<MutationResult> {
    const replay = await this.findIdempotentResult({ actor: command.actor, operation: 'save_draft', idempotencyKey: command.idempotencyKey, requestHash });
    if (replay) return replay;
    const feed = command.feed;
    const updating = Boolean(command.feedId);
    const params = [
      command.feedId ?? null, command.expectedVersion ?? null, feed.slug, feed.title, feed.subtitle,
      feed.category, feed.kind, feed.topic, feed.date.toISOString(), feed.eventAt.toISOString(), feed.eventKey,
      feed.cover, feed.coverStatus, JSON.stringify(feed.tags), feed.summary, feed.source, feed.sourceUrl,
      feed.body, feed.priority, command.origin, contentHash, command.actor, command.reason,
      command.idempotencyKey, requestHash, updating ? 'draft_updated' : 'draft_created', updating ? 'updated' : 'created',
    ];
    try {
      const rows = await this.executor.query<MutationRecord>(`
        with changed as (
          insert into feeds (id, slug, title, subtitle, category, kind, topic, date, event_at, event_key, cover,
            cover_status, tags, summary, source, source_url, body, priority, status, version, origin,
            published_at, archived_at, content_hash)
          select gen_random_uuid(), $3, $4, $5, $6::feed_category, $7::feed_kind, $8, $9::timestamptz, $10::timestamptz,
            $11, $12, $13::feed_cover_status, $14::jsonb, $15, $16, $17, $18, $19::integer, 'draft'::feed_status, 1,
            $20::feed_origin, null::timestamptz, null::timestamptz, $21
          where $1::uuid is null
          union all
          select current.id, $3, $4, $5, $6::feed_category, $7::feed_kind, $8, $9::timestamptz, $10::timestamptz,
            $11, $12, $13::feed_cover_status, $14::jsonb, $15, $16, $17, $18, $19::integer, 'draft'::feed_status, current.version + 1,
            $20::feed_origin, null::timestamptz, null::timestamptz, $21
          from feeds as current
          where $1::uuid is not null and current.id = $1 and current.version = $2 and current.status = 'draft'
          on conflict (id) do update set
            slug = excluded.slug, title = excluded.title, subtitle = excluded.subtitle, category = excluded.category,
            kind = excluded.kind, topic = excluded.topic, date = excluded.date, event_at = excluded.event_at,
            event_key = excluded.event_key, cover = excluded.cover, cover_status = excluded.cover_status,
            tags = excluded.tags, summary = excluded.summary, source = excluded.source, source_url = excluded.source_url,
            body = excluded.body, priority = excluded.priority, version = excluded.version, origin = excluded.origin,
            content_hash = excluded.content_hash, updated_at = now()
          where feeds.version = $2 and feeds.status = 'draft'
          returning *
        ), revision as (
          insert into feed_revisions (feed_id, version, snapshot)
          select id, version, to_jsonb(changed) from changed returning *
        ), audit as (
          insert into feed_audit_events (feed_id, resulting_version, actor, action, reason, origin, idempotency_key, request_metadata)
          select id, version, $22, $26::feed_audit_action, $23, $20::feed_origin, $24,
            jsonb_build_object('operation', 'save_draft') from changed returning *
        ), recorded as (
          insert into feed_idempotency_keys (actor, operation, idempotency_key, request_hash, feed_id,
            result_version, result_action, revision_id, audit_event_id)
          select $22, 'save_draft', $24, $25, changed.id, changed.version, $27::feed_mutation_result,
            revision.id, audit.id from changed, revision, audit returning *
        ) ${RETURN_MUTATION}
      `, params);
      if (rows[0]) return mutationResult(rows[0]);
      const concurrentReplay = await this.findIdempotentResult({
        actor: command.actor,
        operation: 'save_draft',
        idempotencyKey: command.idempotencyKey,
        requestHash,
      });
      if (concurrentReplay) return concurrentReplay;
      if (command.feedId && command.expectedVersion) return await this.classifyMissing(command.feedId, command.expectedVersion, 'draft');
      throw new FeedRepositoryError('DATABASE_UNAVAILABLE', 'Draft creation did not produce a result');
    } catch (error) {
      if (error instanceof FeedRepositoryError) throw error;
      return await this.afterMutationError(error, { actor: command.actor, operation: 'save_draft', idempotencyKey: command.idempotencyKey, requestHash });
    }
  }

  async publish(command: PublishCommand, requestHash: string, contentHash: string): Promise<MutationResult> {
    return this.mutateExisting({ operation: 'publish', command, requestHash, contentHash, requiredStatus: 'draft', nextStatus: 'published', auditAction: 'published', resultAction: 'published' });
  }

  async archive(command: ArchiveCommand, requestHash: string, contentHash: string): Promise<MutationResult> {
    return this.mutateExisting({ operation: 'archive', command, requestHash, contentHash, requiredStatus: 'published', nextStatus: 'archived', auditAction: 'archived', resultAction: 'archived' });
  }

  private async mutateExisting(options: {
    operation: 'publish' | 'archive';
    command: PublishCommand | ArchiveCommand;
    requestHash: string;
    contentHash: string;
    requiredStatus: 'draft' | 'published';
    nextStatus: 'published' | 'archived';
    auditAction: 'published' | 'archived';
    resultAction: 'published' | 'archived';
  }): Promise<MutationResult> {
    const { command } = options;
    const replayInput = { actor: command.actor, operation: options.operation, idempotencyKey: command.idempotencyKey, requestHash: options.requestHash };
    const replay = await this.findIdempotentResult(replayInput);
    if (replay) return replay;
    try {
      const rows = await this.executor.query<MutationRecord>(`
        with current_feed as (
          select * from feeds where id = $1::uuid
        ), duplicate_evidence as (
          select
            count(*) filter (where duplicate.event_key = current.event_key)::integer as exact_event_key,
            count(*) filter (where duplicate.slug = current.slug)::integer as exact_slug,
            count(*) filter (where duplicate.source_url = current.source_url)::integer as advisory_source_url,
            count(*) filter (
              where lower(regexp_replace(duplicate.title, '\\s+', ' ', 'g')) % lower(regexp_replace(current.title, '\\s+', ' ', 'g'))
                and similarity(
                  lower(regexp_replace(duplicate.title, '\\s+', ' ', 'g')),
                  lower(regexp_replace(current.title, '\\s+', ' ', 'g'))
                ) >= 0.65
            )::integer as advisory_title_similarity
          from current_feed as current
          join feeds as duplicate on duplicate.id <> current.id
        ), changed as (
          update feeds set status = $8::feed_status, version = version + 1,
            published_at = case when $8 = 'published' then now() else published_at end,
            archived_at = case when $8 = 'archived' then now() else null end,
            content_hash = $7, updated_at = now()
          where id = $1::uuid and version = $2 and status = $6::feed_status
            and (
              $11::feed_mutation_operation <> 'publish'
              or (select exact_event_key + exact_slug from duplicate_evidence) = 0
            )
          returning *
        ), revision as (
          insert into feed_revisions (feed_id, version, snapshot)
          select id, version, to_jsonb(changed) from changed returning *
        ), audit as (
          insert into feed_audit_events (feed_id, resulting_version, actor, action, reason, origin, idempotency_key, request_metadata)
          select id, version, $3, $9::feed_audit_action, $4, $10::feed_origin, $5,
            case when $11::feed_mutation_operation = 'publish' then
              jsonb_build_object(
                'operation', $11::text,
                'duplicateEvidence', jsonb_build_object(
                  'exact', jsonb_build_object(
                    'eventKey', evidence.exact_event_key,
                    'slug', evidence.exact_slug
                  ),
                  'advisory', jsonb_build_object(
                    'sourceUrl', evidence.advisory_source_url,
                    'titleSimilarity', evidence.advisory_title_similarity
                  )
                )
              )
            else jsonb_build_object('operation', $11::text) end
          from changed cross join duplicate_evidence as evidence returning *
        ), recorded as (
          insert into feed_idempotency_keys (actor, operation, idempotency_key, request_hash, feed_id,
            result_version, result_action, revision_id, audit_event_id)
          select $3, $11::feed_mutation_operation, $5, $12, changed.id, changed.version,
            $13::feed_mutation_result, revision.id, audit.id from changed, revision, audit returning *
        ) ${RETURN_MUTATION}
      `, [command.feedId, command.expectedVersion, command.actor, command.reason, command.idempotencyKey,
        options.requiredStatus, options.contentHash, options.nextStatus, options.auditAction, command.origin,
        options.operation, options.requestHash, options.resultAction]);
      if (rows[0]) return mutationResult(rows[0]);
      const concurrentReplay = await this.findIdempotentResult(replayInput);
      if (concurrentReplay) return concurrentReplay;
      if (options.operation === 'publish') {
        const current = await this.getById(command.feedId);
        if (current && current.version === command.expectedVersion && current.status === options.requiredStatus) {
          const duplicates = await this.findDuplicates({
            feedId: current.id,
            slug: current.slug,
            eventKey: current.eventKey,
            sourceUrl: current.sourceUrl,
            title: current.title,
          });
          if (duplicates.some((candidate) => candidate.reasons.includes('slug') || candidate.reasons.includes('event_key'))) {
            throw new FeedRepositoryError('DUPLICATE_CONFLICT', 'Feed slug or event key already exists');
          }
        }
      }
      return await this.classifyMissing(command.feedId, command.expectedVersion, options.requiredStatus);
    } catch (error) {
      if (error instanceof FeedRepositoryError) throw error;
      return await this.afterMutationError(error, replayInput);
    }
  }

  async updatePublished(command: UpdatePublishedCommand, requestHash: string, contentHash: string): Promise<MutationResult> {
    const replayInput = { actor: command.actor, operation: 'update_published' as const, idempotencyKey: command.idempotencyKey, requestHash };
    const replay = await this.findIdempotentResult(replayInput);
    if (replay) return replay;
    const patch = command.patch;
    try {
      const rows = await this.executor.query<MutationRecord>(`
        with changed as (
          update feeds set
            title = coalesce($6, title), subtitle = coalesce($7, subtitle), category = coalesce($8::feed_category, category),
            kind = coalesce($9::feed_kind, kind), topic = coalesce($10, topic), date = coalesce($11::timestamptz, date),
            event_at = coalesce($12::timestamptz, event_at), cover = coalesce($13, cover),
            cover_status = coalesce($14::feed_cover_status, cover_status), tags = coalesce($15::jsonb, tags),
            summary = coalesce($16, summary), source = coalesce($17, source), source_url = coalesce($18, source_url),
            body = coalesce($19, body), priority = coalesce($20, priority), version = version + 1,
            content_hash = $21, updated_at = now()
          where id = $1::uuid and version = $2 and status = 'published'
          returning *
        ), revision as (
          insert into feed_revisions (feed_id, version, snapshot)
          select id, version, to_jsonb(changed) from changed returning *
        ), audit as (
          insert into feed_audit_events (feed_id, resulting_version, actor, action, reason, origin, idempotency_key, request_metadata)
          select id, version, $3, 'published_updated', $4, $22::feed_origin, $5,
            jsonb_build_object('operation', 'update_published', 'fields', $23::jsonb) from changed returning *
        ), recorded as (
          insert into feed_idempotency_keys (actor, operation, idempotency_key, request_hash, feed_id,
            result_version, result_action, revision_id, audit_event_id)
          select $3, 'update_published', $5, $24, changed.id, changed.version, 'updated',
            revision.id, audit.id from changed, revision, audit returning *
        ) ${RETURN_MUTATION}
      `, [command.feedId, command.expectedVersion, command.actor, command.reason, command.idempotencyKey,
        patch.title ?? null, patch.subtitle ?? null, patch.category ?? null, patch.kind ?? null, patch.topic ?? null,
        patch.date?.toISOString() ?? null, patch.eventAt?.toISOString() ?? null, patch.cover ?? null,
        patch.coverStatus ?? null, patch.tags ? JSON.stringify(patch.tags) : null, patch.summary ?? null,
        patch.source ?? null, patch.sourceUrl ?? null, patch.body ?? null, patch.priority ?? null, contentHash,
        command.origin, JSON.stringify(Object.keys(patch).sort()), requestHash]);
      if (rows[0]) return mutationResult(rows[0]);
      const concurrentReplay = await this.findIdempotentResult(replayInput);
      if (concurrentReplay) return concurrentReplay;
      return await this.classifyMissing(command.feedId, command.expectedVersion, 'published');
    } catch (error) {
      if (error instanceof FeedRepositoryError) throw error;
      return await this.afterMutationError(error, replayInput);
    }
  }
}

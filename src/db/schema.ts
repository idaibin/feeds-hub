import { sql } from 'drizzle-orm';
import {
  char,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  FEED_CATEGORIES,
  FEED_COVER_STATUSES,
  FEED_KINDS,
  FEED_ORIGINS,
  FEED_STATUSES,
} from '../domain/feed';
import {
  FEED_AUDIT_ACTIONS,
  FEED_MUTATION_OPERATIONS,
  FEED_MUTATION_RESULTS,
} from '../domain/feed-write';

export {
  FEED_CATEGORIES,
  FEED_COVER_STATUSES,
  FEED_KINDS,
  FEED_ORIGINS,
  FEED_STATUSES,
};
export const FEED_IMPORT_STATUSES = ['succeeded', 'failed'] as const;

export const feedCategoryEnum = pgEnum('feed_category', FEED_CATEGORIES);
export const feedKindEnum = pgEnum('feed_kind', FEED_KINDS);
export const feedStatusEnum = pgEnum('feed_status', FEED_STATUSES);
export const feedOriginEnum = pgEnum('feed_origin', FEED_ORIGINS);
export const feedCoverStatusEnum = pgEnum('feed_cover_status', FEED_COVER_STATUSES);
export const feedImportStatusEnum = pgEnum('feed_import_status', FEED_IMPORT_STATUSES);
export const feedMutationOperationEnum = pgEnum('feed_mutation_operation', FEED_MUTATION_OPERATIONS);
export const feedAuditActionEnum = pgEnum('feed_audit_action', FEED_AUDIT_ACTIONS);
export const feedMutationResultEnum = pgEnum('feed_mutation_result', FEED_MUTATION_RESULTS);

export const feeds = pgTable(
  'feeds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle').notNull(),
    category: feedCategoryEnum('category').notNull(),
    kind: feedKindEnum('kind').notNull(),
    topic: text('topic').notNull(),
    date: timestamp('date', { withTimezone: true, mode: 'date' }).notNull(),
    eventAt: timestamp('event_at', { withTimezone: true, mode: 'date' }).notNull(),
    eventKey: text('event_key').notNull(),
    cover: text('cover').notNull(),
    coverStatus: feedCoverStatusEnum('cover_status').notNull().default('pending'),
    tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    summary: text('summary').notNull(),
    source: text('source').notNull(),
    sourceUrl: text('source_url').notNull(),
    body: text('body').notNull(),
    priority: integer('priority').notNull().default(0),
    status: feedStatusEnum('status').notNull(),
    version: integer('version').notNull().default(1),
    origin: feedOriginEnum('origin').notNull().default('markdown'),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('feeds_slug_unique').on(table.slug),
    uniqueIndex('feeds_event_key_unique').on(table.eventKey),
    index('feeds_source_url_idx').on(table.sourceUrl),
    index('feeds_status_updated_idx').on(table.status, table.updatedAt.desc(), table.id),
    index('feeds_published_event_idx')
      .on(table.eventAt.desc(), table.priority.desc(), table.date.desc(), table.id)
      .where(sql`${table.status} = 'published'`),
    index('feeds_published_category_event_idx')
      .on(table.category, table.eventAt.desc(), table.priority.desc(), table.date.desc(), table.id)
      .where(sql`${table.status} = 'published'`),
    check(
      'feeds_slug_format_check',
      sql`${table.slug} ~ '^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$'`,
    ),
    check('feeds_title_length_check', sql`char_length(${table.title}) between 2 and 300`),
    check('feeds_subtitle_length_check', sql`char_length(${table.subtitle}) between 2 and 500`),
    check('feeds_topic_length_check', sql`char_length(${table.topic}) between 2 and 300`),
    check('feeds_event_key_length_check', sql`char_length(${table.eventKey}) between 2 and 700`),
    check('feeds_cover_length_check', sql`char_length(${table.cover}) between 1 and 1200`),
    check('feeds_summary_length_check', sql`char_length(${table.summary}) between 2 and 3000`),
    check('feeds_source_length_check', sql`char_length(${table.source}) between 2 and 300`),
    check('feeds_source_url_length_check', sql`char_length(${table.sourceUrl}) between 8 and 4096`),
    check('feeds_source_url_protocol_check', sql`${table.sourceUrl} ~ '^https?://[^[:space:]]+$'`),
    check('feeds_body_length_check', sql`char_length(${table.body}) between 1 and 50000`),
    check('feeds_priority_range_check', sql`${table.priority} between -1000 and 1000`),
    check('feeds_version_positive_check', sql`${table.version} >= 1`),
    check('feeds_content_hash_check', sql`${table.contentHash} ~ '^[0-9a-f]{64}$'`),
    check('feeds_tags_array_check', sql`jsonb_typeof(${table.tags}) = 'array'`),
    check(
      'feeds_lifecycle_check',
      sql`(
        (${table.status} = 'draft' and ${table.publishedAt} is null and ${table.archivedAt} is null)
        or (${table.status} = 'published' and ${table.publishedAt} is not null and ${table.archivedAt} is null)
        or (${table.status} = 'archived' and ${table.publishedAt} is not null and ${table.archivedAt} is not null)
      )`,
    ),
  ],
);

export const feedImportRuns = pgTable(
  'feed_import_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceCommit: varchar('source_commit', { length: 64 }).notNull(),
    sourceTreeHash: char('source_tree_hash', { length: 64 }).notNull(),
    hashVersion: varchar('hash_version', { length: 32 }).notNull(),
    migrationHash: char('migration_hash', { length: 64 }).notNull(),
    databaseFingerprint: char('database_fingerprint', { length: 64 }).notNull(),
    target: varchar('target', { length: 32 }).notNull(),
    status: feedImportStatusEnum('status').notNull(),
    total: integer('total').notNull(),
    inserted: integer('inserted').notNull(),
    updated: integer('updated').notNull(),
    unchanged: integer('unchanged').notNull(),
    conflict: integer('conflict').notNull(),
    invalid: integer('invalid').notNull(),
    failures: jsonb('failures').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('feed_import_runs_source_commit_unique').on(table.sourceCommit),
    index('feed_import_runs_completed_idx').on(table.completedAt.desc(), table.id),
    check('feed_import_runs_source_tree_hash_check', sql`${table.sourceTreeHash} ~ '^[0-9a-f]{64}$'`),
    check('feed_import_runs_migration_hash_check', sql`${table.migrationHash} ~ '^[0-9a-f]{64}$'`),
    check('feed_import_runs_database_fingerprint_check', sql`${table.databaseFingerprint} ~ '^[0-9a-f]{64}$'`),
    check('feed_import_runs_target_check', sql`${table.target} = 'production'`),
    check(
      'feed_import_runs_counts_nonnegative_check',
      sql`${table.total} >= 0 and ${table.inserted} >= 0 and ${table.updated} >= 0 and ${table.unchanged} >= 0 and ${table.conflict} >= 0 and ${table.invalid} >= 0`,
    ),
    check(
      'feed_import_runs_total_check',
      sql`${table.total} = ${table.inserted} + ${table.updated} + ${table.unchanged} + ${table.conflict} + ${table.invalid}`,
    ),
    check(
      'feed_import_runs_success_check',
      sql`${table.status} <> 'succeeded' or (${table.conflict} = 0 and ${table.invalid} = 0 and jsonb_array_length(${table.failures}) = 0)`,
    ),
    check('feed_import_runs_time_check', sql`${table.completedAt} >= ${table.startedAt}`),
  ],
);

export const feedRevisions = pgTable(
  'feed_revisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('feed_revisions_feed_version_unique').on(table.feedId, table.version),
    index('feed_revisions_feed_created_idx').on(table.feedId, table.createdAt.desc(), table.id),
    check('feed_revisions_version_positive_check', sql`${table.version} >= 1`),
    check('feed_revisions_snapshot_object_check', sql`jsonb_typeof(${table.snapshot}) = 'object'`),
  ],
);

export const feedAuditEvents = pgTable(
  'feed_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'restrict' }),
    resultingVersion: integer('resulting_version').notNull(),
    actor: varchar('actor', { length: 200 }).notNull(),
    action: feedAuditActionEnum('action').notNull(),
    reason: varchar('reason', { length: 500 }).notNull(),
    origin: feedOriginEnum('origin').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 200 }).notNull(),
    requestMetadata: jsonb('request_metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('feed_audit_events_feed_created_idx').on(table.feedId, table.createdAt.desc(), table.id),
    index('feed_audit_events_actor_created_idx').on(table.actor, table.createdAt.desc(), table.id),
    check('feed_audit_events_version_positive_check', sql`${table.resultingVersion} >= 1`),
    check('feed_audit_events_actor_length_check', sql`char_length(${table.actor}) between 3 and 200`),
    check('feed_audit_events_reason_length_check', sql`char_length(${table.reason}) between 1 and 500`),
    check('feed_audit_events_origin_check', sql`${table.origin} in ('api', 'mcp')`),
    check('feed_audit_events_idempotency_key_length_check', sql`char_length(${table.idempotencyKey}) between 16 and 200`),
    check('feed_audit_events_metadata_object_check', sql`jsonb_typeof(${table.requestMetadata}) = 'object'`),
  ],
);

export const feedIdempotencyKeys = pgTable(
  'feed_idempotency_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actor: varchar('actor', { length: 200 }).notNull(),
    operation: feedMutationOperationEnum('operation').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 200 }).notNull(),
    requestHash: char('request_hash', { length: 64 }).notNull(),
    feedId: uuid('feed_id').notNull().references(() => feeds.id, { onDelete: 'restrict' }),
    resultVersion: integer('result_version').notNull(),
    resultAction: feedMutationResultEnum('result_action').notNull(),
    revisionId: uuid('revision_id').notNull().references(() => feedRevisions.id, { onDelete: 'restrict' }),
    auditEventId: uuid('audit_event_id').notNull().references(() => feedAuditEvents.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('feed_idempotency_scope_unique').on(table.actor, table.operation, table.idempotencyKey),
    index('feed_idempotency_feed_created_idx').on(table.feedId, table.createdAt.desc(), table.id),
    check('feed_idempotency_actor_length_check', sql`char_length(${table.actor}) between 3 and 200`),
    check('feed_idempotency_key_length_check', sql`char_length(${table.idempotencyKey}) between 16 and 200`),
    check('feed_idempotency_request_hash_check', sql`${table.requestHash} ~ '^[0-9a-f]{64}$'`),
    check('feed_idempotency_result_version_positive_check', sql`${table.resultVersion} >= 1`),
  ],
);

export type FeedRow = typeof feeds.$inferSelect;
export type NewFeedRow = typeof feeds.$inferInsert;
export type FeedImportRunRow = typeof feedImportRuns.$inferSelect;
export type FeedRevisionRow = typeof feedRevisions.$inferSelect;
export type FeedAuditEventRow = typeof feedAuditEvents.$inferSelect;
export type FeedIdempotencyKeyRow = typeof feedIdempotencyKeys.$inferSelect;

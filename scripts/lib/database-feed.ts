import type { NeonQueryFunction } from '@neondatabase/serverless';
import type {
  ExistingFeedIdentity,
  ImportPlan,
  NormalizedFeed,
} from './feed-content';

export interface DatabaseFeedRecord extends ExistingFeedIdentity {
  title: string;
  subtitle: string;
  category: NormalizedFeed['category'];
  kind: NormalizedFeed['kind'];
  topic: string;
  date: string | Date;
  eventAt: string | Date;
  cover: string;
  coverStatus: 'pending';
  tags: string[];
  summary: string;
  source: string;
  sourceUrl: string;
  body: string;
  priority: number;
  publishedAt: string | Date | null;
  archivedAt: string | Date | null;
}

export async function fetchExistingFeedIdentities(sql: NeonQueryFunction<false, false>) {
  return await sql`
    select
      id::text as id,
      slug,
      event_key as "eventKey",
      content_hash as "contentHash",
      status::text as status,
      origin::text as origin,
      version
    from feeds
    order by slug
  ` as ExistingFeedIdentity[];
}

export async function fetchDatabaseFeeds(sql: NeonQueryFunction<false, false>) {
  return await sql`
    select
      id::text as id,
      slug,
      title,
      subtitle,
      category::text as category,
      kind::text as kind,
      topic,
      date,
      event_at as "eventAt",
      event_key as "eventKey",
      cover,
      cover_status::text as "coverStatus",
      tags,
      summary,
      source,
      source_url as "sourceUrl",
      body,
      priority,
      status::text as status,
      version,
      origin::text as origin,
      published_at as "publishedAt",
      archived_at as "archivedAt",
      content_hash as "contentHash"
    from feeds
    order by slug
  ` as DatabaseFeedRecord[];
}

export async function findImportRun(sql: NeonQueryFunction<false, false>, sourceCommit: string) {
  const rows = await sql`
    select
      id::text as id,
      source_commit as "sourceCommit",
      source_tree_hash as "sourceTreeHash",
      status::text as status,
      total,
      inserted,
      updated,
      unchanged
    from feed_import_runs
    where source_commit = ${sourceCommit}
    limit 1
  ` as Array<{
    id: string;
    sourceCommit: string;
    sourceTreeHash: string;
    status: string;
    total: number;
    inserted: number;
    updated: number;
    unchanged: number;
  }>;
  return rows[0];
}

export async function applyImport(options: {
  sql: NeonQueryFunction<false, false>;
  feeds: NormalizedFeed[];
  plan: ImportPlan;
  sourceCommit: string;
  sourceTreeHash: string;
  migrationHash: string;
  databaseFingerprint: string;
  startedAt: string;
}) {
  const entryBySlug = new Map(options.plan.entries.map((entry) => [entry.slug, entry]));
  const input = options.feeds.map((feed) => {
    const planEntry = entryBySlug.get(feed.slug);
    if (!planEntry) throw new Error(`Missing plan entry for ${feed.slug}`);
    return {
      action: planEntry.action,
      expectedVersion: planEntry.expectedVersion,
      expectedContentHash: planEntry.expectedContentHash,
      slug: feed.slug,
      title: feed.title,
      subtitle: feed.subtitle,
      category: feed.category,
      kind: feed.kind,
      topic: feed.topic,
      date: feed.date,
      eventAt: feed.eventAt,
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
      publishedAt: feed.status === 'published' ? feed.date : null,
      contentHash: feed.contentHash,
    };
  });

  const result = await options.sql`
    with input as (
      select *
      from jsonb_to_recordset(${JSON.stringify(input)}::jsonb) as item(
        action text,
        "expectedVersion" integer,
        "expectedContentHash" text,
        slug text,
        title text,
        subtitle text,
        category text,
        kind text,
        topic text,
        date timestamptz,
        "eventAt" timestamptz,
        "eventKey" text,
        cover text,
        "coverStatus" text,
        tags jsonb,
        summary text,
        source text,
        "sourceUrl" text,
        body text,
        priority integer,
        status text,
        "publishedAt" timestamptz,
        "contentHash" text
      )
    ),
    unchanged_rows as (
      select feed.slug
      from feeds as feed
      join input as item
        on feed.slug = item.slug
       and feed.event_key = item."eventKey"
      where item.action = 'unchanged'
        and feed.origin = 'markdown'
        and feed.status::text = item.status
        and feed.version = item."expectedVersion"
        and feed.content_hash = item."expectedContentHash"
    ),
    unexpected_rows as (
      select feed.slug
      from feeds as feed
      where not exists (
        select 1
        from input as item
        where item.slug = feed.slug
          and item."eventKey" = feed.event_key
      )
    ),
    updated_rows as (
      update feeds as feed
      set
        title = item.title,
        subtitle = item.subtitle,
        category = item.category::feed_category,
        kind = item.kind::feed_kind,
        topic = item.topic,
        date = item.date,
        event_at = item."eventAt",
        event_key = item."eventKey",
        cover = item.cover,
        cover_status = item."coverStatus"::feed_cover_status,
        tags = item.tags,
        summary = item.summary,
        source = item.source,
        source_url = item."sourceUrl",
        body = item.body,
        priority = item.priority,
        status = item.status::feed_status,
        version = feed.version + 1,
        published_at = item."publishedAt",
        archived_at = null,
        content_hash = item."contentHash",
        updated_at = now()
      from input as item
      where item.action = 'update'
        and feed.slug = item.slug
        and feed.event_key = item."eventKey"
        and feed.origin = 'markdown'
        and feed.status <> 'archived'
        and not (feed.status = 'published' and item.status = 'draft')
        and feed.version = item."expectedVersion"
        and feed.content_hash = item."expectedContentHash"
      returning feed.slug
    ),
    inserted_rows as (
      insert into feeds (
        slug, title, subtitle, category, kind, topic, date, event_at, event_key,
        cover, cover_status, tags, summary, source, source_url, body, priority,
        status, version, origin, published_at, archived_at, content_hash
      )
      select
        item.slug,
        item.title,
        item.subtitle,
        item.category::feed_category,
        item.kind::feed_kind,
        item.topic,
        item.date,
        item."eventAt",
        item."eventKey",
        item.cover,
        item."coverStatus"::feed_cover_status,
        item.tags,
        item.summary,
        item.source,
        item."sourceUrl",
        item.body,
        item.priority,
        item.status::feed_status,
        1,
        'markdown'::feed_origin,
        item."publishedAt",
        null,
        item."contentHash"
      from input as item
      where item.action = 'insert'
      returning slug
    ),
    actual as (
      select
        (select count(*)::integer from inserted_rows) as inserted,
        (select count(*)::integer from updated_rows) as updated,
        (select count(*)::integer from unchanged_rows) as unchanged,
        (select count(*)::integer from unexpected_rows) as unexpected
    ),
    recorded_run as (
      insert into feed_import_runs (
        source_commit,
        source_tree_hash,
        hash_version,
        migration_hash,
        database_fingerprint,
        target,
        status,
        total,
        inserted,
        updated,
        unchanged,
        conflict,
        invalid,
        failures,
        started_at,
        completed_at
      )
      select
        ${options.sourceCommit},
        ${options.sourceTreeHash},
        'feed-v1',
        ${options.migrationHash},
        ${options.databaseFingerprint},
        case when actual.unexpected = 0 then 'production' else null end,
        'succeeded'::feed_import_status,
        ${options.plan.total},
        case when actual.inserted = ${options.plan.counts.insert} then actual.inserted else null end,
        case when actual.updated = ${options.plan.counts.update} then actual.updated else null end,
        case when actual.unchanged = ${options.plan.counts.unchanged} then actual.unchanged else null end,
        0,
        0,
        '[]'::jsonb,
        ${options.startedAt}::timestamptz,
        now()
      from actual
      returning id::text as id, inserted, updated, unchanged
    )
    select id, inserted, updated, unchanged from recorded_run
  ` as Array<{ id: string; inserted: number; updated: number; unchanged: number }>;

  if (!result[0]) throw new Error('Atomic import did not record a successful run');
  return result[0];
}

export async function applyRuntimeImport(options: {
  sql: NeonQueryFunction<false, false>;
  feeds: NormalizedFeed[];
  plan: ImportPlan;
}) {
  const entryBySlug = new Map(options.plan.entries.map((entry) => [entry.slug, entry]));
  const input = options.feeds.map((feed) => {
    const planEntry = entryBySlug.get(feed.slug);
    if (!planEntry) throw new Error(`Missing plan entry for ${feed.slug}`);
    return {
      action: planEntry.action,
      expectedVersion: planEntry.expectedVersion,
      expectedContentHash: planEntry.expectedContentHash,
      slug: feed.slug,
      title: feed.title,
      subtitle: feed.subtitle,
      category: feed.category,
      kind: feed.kind,
      topic: feed.topic,
      date: feed.date,
      eventAt: feed.eventAt,
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
      publishedAt: feed.status === 'published' ? feed.date : null,
      contentHash: feed.contentHash,
    };
  });

  const result = await options.sql`
    with input as (
      select *
      from jsonb_to_recordset(${JSON.stringify(input)}::jsonb) as item(
        action text, "expectedVersion" integer, "expectedContentHash" text,
        slug text, title text, subtitle text, category text, kind text, topic text,
        date timestamptz, "eventAt" timestamptz, "eventKey" text, cover text,
        "coverStatus" text, tags jsonb, summary text, source text, "sourceUrl" text,
        body text, priority integer, status text, "publishedAt" timestamptz, "contentHash" text
      )
    ),
    unexpected_rows as (
      select feed.slug
      from feeds as feed
      where not exists (
        select 1 from input as item
        where item.slug = feed.slug and item."eventKey" = feed.event_key
      )
    ),
    unchanged_rows as (
      select feed.slug
      from feeds as feed
      join input as item on feed.slug = item.slug and feed.event_key = item."eventKey"
      where item.action = 'unchanged'
        and feed.origin = 'markdown'
        and feed.status::text = item.status
        and feed.version = item."expectedVersion"
        and feed.content_hash = item."expectedContentHash"
    ),
    inserted_rows as (
      insert into feeds (
        slug, title, subtitle, category, kind, topic, date, event_at, event_key,
        cover, cover_status, tags, summary, source, source_url, body, priority,
        status, version, origin, published_at, archived_at, content_hash
      )
      select item.slug, item.title, item.subtitle, item.category::feed_category,
        item.kind::feed_kind, item.topic, item.date, item."eventAt", item."eventKey",
        item.cover, item."coverStatus"::feed_cover_status, item.tags, item.summary,
        item.source, item."sourceUrl", item.body, item.priority, item.status::feed_status,
        1, 'markdown'::feed_origin, item."publishedAt", null, item."contentHash"
      from input as item where item.action = 'insert'
      returning slug
    ),
    actual as (
      select (select count(*)::integer from inserted_rows) as inserted,
        0::integer as updated,
        (select count(*)::integer from unchanged_rows) as unchanged,
        (select count(*)::integer from unexpected_rows) as unexpected
    ),
    guarded as (
      select *,
        (case
          when inserted = ${options.plan.counts.insert}
            and updated = 0
            and unchanged = ${options.plan.counts.unchanged}
            and unexpected = 0
          then '1'
          else unexpected::text || ' import-count-mismatch'
        end)::integer as verified
      from actual
    )
    select inserted, updated, unchanged, unexpected
    from guarded
    where verified = 1
  ` as Array<{ inserted: number; updated: number; unchanged: number; unexpected: number }>;

  if (!result[0]) throw new Error('Atomic runtime import counts did not match the reviewed plan');
  return result[0];
}

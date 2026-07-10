import { and, asc, desc, eq, getTableColumns, ilike, inArray, or, sql } from 'drizzle-orm';
import type { Feed } from '@/domain/feed';
import type {
  AuthorizedFeedLookup,
  AuthorizedFeedSearch,
  FeedSource,
  PublicFeedPageQuery,
} from '@/domain/feed-source';
import { MAX_PUBLIC_FEED_PAGE, MAX_PUBLIC_FEED_PAGE_SIZE } from '@/domain/feed-source';
import { getDatabase, type FeedDatabase } from '@/db/client';
import { feeds, type FeedRow } from '@/db/schema';
import {
  decodeAuthorizedFeedCursor,
  encodeAuthorizedFeedCursor,
  isAuthorizedFeedUuid,
  normalizeAuthorizedFeedLookup,
  normalizeAuthorizedFeedSearch,
} from '@/lib/feed-authorized-read';
import { getFeedListCategories } from '@/lib/feeds';

const { body: _body, ...publicFeedListColumns } = getTableColumns(feeds);
void _body;
export const PUBLIC_FEED_LIST_COLUMNS = publicFeedListColumns;

function assertPublicPageQuery(query: PublicFeedPageQuery) {
  if (!Number.isSafeInteger(query.page) || query.page < 1 || query.page > MAX_PUBLIC_FEED_PAGE) {
    throw new Error(`page must be an integer between 1 and ${MAX_PUBLIC_FEED_PAGE}`);
  }
  if (!Number.isSafeInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > MAX_PUBLIC_FEED_PAGE_SIZE) {
    throw new Error(`pageSize must be an integer between 1 and ${MAX_PUBLIC_FEED_PAGE_SIZE}`);
  }
  const offset = (query.page - 1) * query.pageSize;
  if (!Number.isSafeInteger(offset)) throw new Error('page offset is out of range');
  return offset;
}

export function toDatabaseFeed(row: FeedRow): Feed {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    kind: row.kind,
    topic: row.topic,
    date: row.date,
    eventAt: row.eventAt,
    eventKey: row.eventKey,
    cover: row.cover,
    coverStatus: row.coverStatus,
    tags: row.tags,
    summary: row.summary,
    source: row.source,
    sourceUrl: row.sourceUrl,
    body: row.body,
    priority: row.priority,
    status: row.status,
    version: row.version,
    origin: row.origin,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDatabaseListFeed(row: Omit<FeedRow, 'body'>): Feed {
  return toDatabaseFeed({ ...row, body: '' });
}

export class DatabaseFeedSource implements FeedSource {
  constructor(
    private readonly database: FeedDatabase = getDatabase(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async listPublished(query: PublicFeedPageQuery) {
    const offset = assertPublicPageQuery(query);
    const categories = getFeedListCategories(query.list);
    const now = this.now();
    const futureSports = sql<boolean>`(
      ${feeds.category} in ('lol'::feed_category, 'worldcup'::feed_category)
      and ${feeds.eventAt} > ${now}
    )`;
    const stockText = sql`concat_ws(' ', ${feeds.eventKey}, ${feeds.topic}, ${feeds.title}, ${feeds.subtitle})`;
    const stockMarketText = sql`concat_ws(' ', ${feeds.topic}, ${feeds.title}, ${feeds.subtitle})`;
    const stockPrimaryText = sql`concat_ws(' ', ${feeds.topic}, ${feeds.title})`;
    const stockClose = sql<boolean>`(
      ${feeds.category} <> 'stock'::feed_category
      or (
        not (${stockPrimaryText} ~* '(欧洲|韩国|日本|亚洲|全球|欧元区|STOXX|KOSPI|Nikkei)')
        and ${stockMarketText} ~ '(美股|美国|港股|香港|A 股|A股|沪深|上证|深证|创业板|科创)'
        and (
          lower(${stockText}) like '%:close:%'
          or lower(${stockText}) like '%close%'
          or ${stockText} like '%收盘%'
          or ${stockText} like '%闭市%'
        )
      )
    )`;
    const conditions = [
      eq(feeds.status, 'published'),
      stockClose,
      categories === undefined
        ? undefined
        : categories.length
          ? inArray(feeds.category, categories)
          : sql<boolean>`false`,
    ].filter((condition) => condition !== undefined);
    const rows = await this.database
      .select(PUBLIC_FEED_LIST_COLUMNS)
      .from(feeds)
      .where(and(...conditions))
      .orderBy(
        asc(sql`case when ${futureSports} then 1 else 0 end`),
        asc(sql`case when ${futureSports} then ${feeds.eventAt} end`),
        desc(sql`case when not ${futureSports} then ${feeds.eventAt} end`),
        desc(feeds.priority),
        desc(feeds.date),
        asc(feeds.slug),
      )
      .limit(query.pageSize + 1)
      .offset(offset);

    return {
      items: rows.slice(0, query.pageSize).map(toDatabaseListFeed),
      page: query.page,
      pageSize: query.pageSize,
      hasMore: rows.length > query.pageSize,
    };
  }

  async getBySlug(slug: string) {
    const rows = await this.database
      .select()
      .from(feeds)
      .where(and(eq(feeds.slug, slug), eq(feeds.status, 'published')))
      .limit(1);

    return rows[0] ? toDatabaseFeed(rows[0]) : undefined;
  }

  async searchAuthorized(rawInput: AuthorizedFeedSearch) {
    const input = normalizeAuthorizedFeedSearch(rawInput, 'database');
    const cursor = input.cursor ? decodeAuthorizedFeedCursor(input.cursor, 'database') : undefined;
    const updatedAtMicros = sql`(extract(epoch from ${feeds.updatedAt}) * 1000000)::bigint`;
    const query = input.query ? `%${input.query.replace(/[\\%_]/g, '\\$&')}%` : undefined;
    const conditions = [
      input.status ? eq(feeds.status, input.status) : undefined,
      input.category ? eq(feeds.category, input.category) : undefined,
      query ? or(
        ilike(feeds.title, query),
        ilike(feeds.subtitle, query),
        ilike(feeds.summary, query),
        ilike(feeds.topic, query),
        ilike(feeds.source, query),
      ) : undefined,
      cursor ? sql`(
        ${updatedAtMicros} < ${cursor.updatedAtMicros}::bigint
        or (${updatedAtMicros} = ${cursor.updatedAtMicros}::bigint and ${feeds.id} > ${cursor.id}::uuid)
      )` : undefined,
    ].filter((condition) => condition !== undefined);
    const rows = await this.database
      .select({
        ...getTableColumns(feeds),
        updatedAtMicros: sql<string>`${updatedAtMicros}::text`,
      })
      .from(feeds)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(feeds.updatedAt), asc(feeds.id))
      .limit(input.limit + 1);
    const items = rows.slice(0, input.limit).map(toDatabaseFeed);
    return {
      items,
      nextCursor: rows.length > input.limit && items.length
        ? encodeAuthorizedFeedCursor(items[items.length - 1], 'database', rows[items.length - 1].updatedAtMicros)
        : null,
    };
  }

  async getAuthorized(rawInput: AuthorizedFeedLookup) {
    const input = normalizeAuthorizedFeedLookup(rawInput);
    const identity = input.id ?? input.slug ?? '';
    const rows = await this.database
      .select()
      .from(feeds)
      .where(input.id && isAuthorizedFeedUuid(input.id) ? eq(feeds.id, input.id) : eq(feeds.slug, identity))
      .limit(1);
    return rows[0] ? toDatabaseFeed(rows[0]) : undefined;
  }
}

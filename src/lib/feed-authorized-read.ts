import type { Feed, FeedCategory, FeedStatus } from '@/domain/feed';
import type {
  AuthorizedFeedLookup,
  AuthorizedFeedSearch,
  AuthorizedFeedSearchPage,
} from '@/domain/feed-source';

export const DEFAULT_AUTHORIZED_FEED_LIMIT = 20;
export const MAX_AUTHORIZED_FEED_LIMIT = 100;

export type FeedCursorSource = 'content' | 'database';

interface FeedCursor {
  v: 2;
  source: FeedCursorSource;
  updatedAtMicros: string;
  id: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/;

function validIdentity(value: string) {
  return UUID_PATTERN.test(value) || SLUG_PATTERN.test(value);
}

export function isAuthorizedFeedUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export class AuthorizedFeedReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizedFeedReadError';
  }
}

function invalid(message: string): never {
  throw new AuthorizedFeedReadError(message);
}

function dateToEpochMicros(value: Date) {
  return (BigInt(value.getTime()) * 1000n).toString();
}

function validEpochMicros(value: string) {
  return /^(?:0|[1-9][0-9]{0,17})$/.test(value);
}

export function encodeAuthorizedFeedCursor(
  feed: Pick<Feed, 'updatedAt' | 'id'>,
  source: FeedCursorSource,
  exactUpdatedAtMicros = dateToEpochMicros(feed.updatedAt),
) {
  if (!validEpochMicros(exactUpdatedAtMicros)) invalid('cursor timestamp is invalid');
  const payload: FeedCursor = { v: 2, source, updatedAtMicros: exactUpdatedAtMicros, id: feed.id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeAuthorizedFeedCursor(value: string, expectedSource?: FeedCursorSource): FeedCursor {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) invalid('cursor encoding is not canonical base64url');
    const bytes = Buffer.from(value, 'base64url');
    if (bytes.toString('base64url') !== value) invalid('cursor encoding is not canonical base64url');
    const text = bytes.toString('utf8');
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) invalid('cursor must be an object');
    const cursor = parsed as Record<string, unknown>;
    if (cursor.v !== 2) invalid('cursor version is unsupported');
    if (cursor.source !== 'content' && cursor.source !== 'database') invalid('cursor source is invalid');
    if (typeof cursor.id !== 'string' || cursor.id.length > 700 || !validIdentity(cursor.id)) invalid('cursor id is invalid');
    if (cursor.source === 'database' && !UUID_PATTERN.test(cursor.id)) invalid('database cursor id is invalid');
    if (typeof cursor.updatedAtMicros !== 'string' || !validEpochMicros(cursor.updatedAtMicros)) invalid('cursor timestamp is invalid');
    const normalized: FeedCursor = { v: 2, source: cursor.source, updatedAtMicros: cursor.updatedAtMicros, id: cursor.id };
    if (JSON.stringify(normalized) !== text) invalid('cursor payload is not canonical');
    if (expectedSource !== undefined && normalized.source !== expectedSource) invalid(`cursor belongs to ${normalized.source} source`);
    return normalized;
  } catch (error) {
    if (error instanceof AuthorizedFeedReadError) throw error;
    invalid('cursor is malformed');
  }
}

export function normalizeAuthorizedFeedSearch(
  input: AuthorizedFeedSearch,
  source: FeedCursorSource,
): Required<Pick<AuthorizedFeedSearch, 'limit'>> & AuthorizedFeedSearch {
  const keys = Object.keys(input);
  if (keys.some((key) => !['status', 'category', 'query', 'limit', 'cursor'].includes(key))) invalid('unknown field');
  const statusValues: FeedStatus[] = ['draft', 'published', 'archived'];
  const categoryValues: FeedCategory[] = ['worldcup', 'lol', 'stock', 'ai', 'github', 'hot', 'compute', 'global', 'rust', 'dev', 'security', 'product'];
  if (input.status !== undefined && !statusValues.includes(input.status)) invalid('status is invalid');
  if (input.category !== undefined && !categoryValues.includes(input.category)) invalid('category is invalid');
  const query = input.query?.trim();
  if (query !== undefined && (query.length < 2 || query.length > 300)) invalid('query length must be 2-300');
  const limit = input.limit ?? DEFAULT_AUTHORIZED_FEED_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_AUTHORIZED_FEED_LIMIT) invalid('limit must be an integer between 1 and 100');
  if (input.cursor !== undefined) {
    if (input.cursor.length < 1 || input.cursor.length > 2048) invalid('cursor length is invalid');
    decodeAuthorizedFeedCursor(input.cursor, source);
  }
  return { ...input, ...(query !== undefined ? { query } : {}), limit };
}

export function normalizeAuthorizedFeedLookup(input: AuthorizedFeedLookup) {
  const keys = Object.keys(input);
  if (keys.some((key) => !['id', 'slug'].includes(key))) invalid('unknown lookup field');
  if ((input.id === undefined) === (input.slug === undefined)) invalid('exactly one of id or slug is required');
  const value = input.id ?? input.slug ?? '';
  if (value.length > 700 || !validIdentity(value)) invalid('lookup value is invalid');
  return input;
}

function compareAuthorizedFeeds(left: Feed, right: Feed) {
  const timestamp = right.updatedAt.getTime() - left.updatedAt.getTime();
  return timestamp || left.id.localeCompare(right.id);
}

function followsCursor(feed: Feed, cursor: FeedCursor) {
  const cursorTime = BigInt(cursor.updatedAtMicros);
  const feedTime = BigInt(feed.updatedAt.getTime()) * 1000n;
  return feedTime < cursorTime || (feedTime === cursorTime && feed.id.localeCompare(cursor.id) > 0);
}

export function createAuthorizedFeedSearchPage(
  feeds: Feed[],
  rawInput: AuthorizedFeedSearch,
  source: FeedCursorSource,
): AuthorizedFeedSearchPage {
  const input = normalizeAuthorizedFeedSearch(rawInput, source);
  const query = input.query?.toLowerCase();
  const cursor = input.cursor ? decodeAuthorizedFeedCursor(input.cursor, source) : undefined;
  const filtered = feeds
    .filter((feed) => input.status === undefined || feed.status === input.status)
    .filter((feed) => input.category === undefined || feed.category === input.category)
    .filter((feed) => query === undefined || [feed.title, feed.subtitle, feed.summary, feed.topic, feed.source]
      .some((value) => value.toLowerCase().includes(query)))
    .sort(compareAuthorizedFeeds)
    .filter((feed) => cursor === undefined || followsCursor(feed, cursor));
  const items = filtered.slice(0, input.limit);
  return {
    items,
    nextCursor: filtered.length > input.limit && items.length
      ? encodeAuthorizedFeedCursor(items[items.length - 1], source)
      : null,
  };
}

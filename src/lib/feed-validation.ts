import { createHash } from 'node:crypto';
import {
  FEED_CATEGORIES,
  FEED_COVER_STATUSES,
  FEED_KINDS,
  type Feed,
  type FeedStatus,
} from '@/domain/feed';
import type {
  ArchiveCommand,
  DuplicateQuery,
  FeedDraftInput,
  MutationContext,
  PublishedFeedPatch,
  PublishCommand,
  SaveDraftCommand,
  UpdatePublishedCommand,
  ValidationIssue,
} from '@/domain/feed-write';
import { calculateFeedV1ContentHash } from '@/domain/feed-content-hash';

const SLUG_PATTERN = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{16,200}$/;
const ISO_WITH_ZONE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;
export const POSTGRES_INT4_MAX = 2_147_483_647;

const DRAFT_KEYS = [
  'slug', 'title', 'subtitle', 'category', 'kind', 'topic', 'date', 'eventAt', 'eventKey',
  'cover', 'coverStatus', 'tags', 'summary', 'source', 'sourceUrl', 'body', 'priority',
] as const;
const PATCH_KEYS = DRAFT_KEYS.filter((key) => key !== 'slug' && key !== 'eventKey');

export class FeedValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super('Feed command validation failed');
    this.name = 'FeedValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new FeedValidationError([{ path, message: 'must be an object' }]);
  return value;
}

function rejectUnknown(input: Record<string, unknown>, allowed: readonly string[], issues: ValidationIssue[], path = '') {
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) issues.push({ path: path ? `${path}.${key}` : key, message: 'unknown field' });
  }
}

function stringField(input: Record<string, unknown>, key: string, min: number, max: number, issues: ValidationIssue[]) {
  const value = input[key];
  if (typeof value !== 'string') {
    issues.push({ path: key, message: 'must be a string' });
    return '';
  }
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    issues.push({ path: key, message: `length must be ${min}-${max}` });
  }
  return normalized;
}

function dateField(value: unknown, path: string, issues: ValidationIssue[]) {
  if (typeof value !== 'string' || !ISO_WITH_ZONE_PATTERN.test(value.trim())) {
    issues.push({ path, message: 'must be ISO 8601 with Z or an explicit offset' });
    return new Date(0);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) issues.push({ path, message: 'must be a valid date' });
  return date;
}

function sourceUrlField(value: unknown, path: string, issues: ValidationIssue[]) {
  if (typeof value !== 'string') {
    issues.push({ path, message: 'must be a string' });
    return '';
  }
  const normalized = value.trim();
  if (normalized.length < 8 || normalized.length > 4096) issues.push({ path, message: 'length must be 8-4096' });
  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      issues.push({ path, message: 'must be an absolute HTTP/HTTPS URL' });
    }
    if (url.username || url.password) issues.push({ path, message: 'must not include userinfo' });
  } catch {
    issues.push({ path, message: 'must be an absolute HTTP/HTTPS URL' });
  }
  return normalized;
}

function tagsField(value: unknown, path: string, issues: ValidationIssue[]) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    issues.push({ path, message: 'must be an array of strings' });
    return [];
  }
  if (value.length > 64) issues.push({ path, message: 'must contain at most 64 items' });
  const tags = value.map((item) => item.trim());
  if (tags.some((item) => item.length < 1 || item.length > 100)) {
    issues.push({ path, message: 'each tag length must be 1-100' });
  }
  return tags;
}

function enumField<T extends string>(value: unknown, path: string, values: readonly T[], issues: ValidationIssue[]) {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    issues.push({ path, message: `must be one of ${values.join(', ')}` });
    return values[0];
  }
  return value as T;
}

function integerField(value: unknown, path: string, min: number, max: number, issues: ValidationIssue[]) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    issues.push({ path, message: `must be an integer between ${min} and ${max}` });
    return min;
  }
  return value;
}

function finish<T>(value: T, issues: ValidationIssue[]): T {
  if (issues.length) throw new FeedValidationError(issues);
  return value;
}

export function parseFeedDraftInput(value: unknown): FeedDraftInput {
  const input = assertRecord(value, 'feed');
  const issues: ValidationIssue[] = [];
  rejectUnknown(input, DRAFT_KEYS, issues, 'feed');
  const slug = stringField(input, 'slug', 3, 700, issues);
  if (slug && !SLUG_PATTERN.test(slug)) issues.push({ path: 'feed.slug', message: 'must be lowercase safe path segments' });
  const priority = integerField(input.priority, 'feed.priority', -1000, 1000, issues);
  const result: FeedDraftInput = {
    slug,
    title: stringField(input, 'title', 2, 300, issues),
    subtitle: stringField(input, 'subtitle', 2, 500, issues),
    category: enumField(input.category, 'feed.category', FEED_CATEGORIES, issues),
    kind: enumField(input.kind, 'feed.kind', FEED_KINDS, issues),
    topic: stringField(input, 'topic', 2, 300, issues),
    date: dateField(input.date, 'feed.date', issues),
    eventAt: dateField(input.eventAt, 'feed.eventAt', issues),
    eventKey: stringField(input, 'eventKey', 2, 700, issues),
    cover: stringField(input, 'cover', 1, 1200, issues),
    coverStatus: enumField(input.coverStatus, 'feed.coverStatus', FEED_COVER_STATUSES, issues),
    tags: tagsField(input.tags, 'feed.tags', issues),
    summary: stringField(input, 'summary', 2, 3000, issues),
    source: stringField(input, 'source', 2, 300, issues),
    sourceUrl: sourceUrlField(input.sourceUrl, 'feed.sourceUrl', issues),
    body: stringField(input, 'body', 1, 50000, issues),
    priority,
  };
  if (slug && result.category !== slug.split('/')[0]) {
    issues.push({ path: 'feed.category', message: 'must match the first slug segment' });
  }
  return finish(result, issues);
}

export function parsePublishedFeedPatch(value: unknown): PublishedFeedPatch {
  const input = assertRecord(value, 'patch');
  const issues: ValidationIssue[] = [];
  rejectUnknown(input, PATCH_KEYS, issues, 'patch');
  if (!Object.keys(input).length) issues.push({ path: 'patch', message: 'must include at least one field' });
  const patch: PublishedFeedPatch = {};
  for (const key of Object.keys(input)) {
    switch (key) {
      case 'title': patch.title = stringField(input, key, 2, 300, issues); break;
      case 'subtitle': patch.subtitle = stringField(input, key, 2, 500, issues); break;
      case 'category': patch.category = enumField(input[key], 'patch.category', FEED_CATEGORIES, issues); break;
      case 'kind': patch.kind = enumField(input[key], 'patch.kind', FEED_KINDS, issues); break;
      case 'topic': patch.topic = stringField(input, key, 2, 300, issues); break;
      case 'date': patch.date = dateField(input[key], 'patch.date', issues); break;
      case 'eventAt': patch.eventAt = dateField(input[key], 'patch.eventAt', issues); break;
      case 'cover': patch.cover = stringField(input, key, 1, 1200, issues); break;
      case 'coverStatus': patch.coverStatus = enumField(input[key], 'patch.coverStatus', FEED_COVER_STATUSES, issues); break;
      case 'tags': patch.tags = tagsField(input[key], 'patch.tags', issues); break;
      case 'summary': patch.summary = stringField(input, key, 2, 3000, issues); break;
      case 'source': patch.source = stringField(input, key, 2, 300, issues); break;
      case 'sourceUrl': patch.sourceUrl = sourceUrlField(input[key], 'patch.sourceUrl', issues); break;
      case 'body': patch.body = stringField(input, key, 1, 50000, issues); break;
      case 'priority': patch.priority = integerField(input[key], 'patch.priority', -1000, 1000, issues); break;
    }
  }
  return finish(patch, issues);
}

function parseExpectedVersion(value: unknown, issues: ValidationIssue[]) {
  return integerField(value, 'expectedVersion', 1, POSTGRES_INT4_MAX, issues);
}

function parseReason(value: unknown, issues: ValidationIssue[]) {
  return stringField({ reason: value }, 'reason', 1, 500, issues);
}

export function validateMutationContext(context: MutationContext) {
  const issues: ValidationIssue[] = [];
  if (!IDEMPOTENCY_PATTERN.test(context.idempotencyKey)) {
    issues.push({ path: 'Idempotency-Key', message: 'must be 16-200 safe ASCII characters' });
  }
  if (context.actor !== 'api:feed-writer' && context.actor !== 'mcp:feed-writer') {
    issues.push({ path: 'actor', message: 'must be a server-derived feed writer principal' });
  }
  if (context.origin !== 'api' && context.origin !== 'mcp') issues.push({ path: 'origin', message: 'must be api or mcp' });
  return finish(context, issues);
}

export function parseSaveDraftCommand(value: unknown, context: MutationContext): SaveDraftCommand {
  validateMutationContext(context);
  const input = assertRecord(value, 'body');
  const issues: ValidationIssue[] = [];
  rejectUnknown(input, ['feedId', 'expectedVersion', 'feed', 'reason'], issues);
  const feedId = input.feedId;
  const expectedVersion = input.expectedVersion;
  if ((feedId === undefined) !== (expectedVersion === undefined)) {
    issues.push({ path: 'feedId', message: 'feedId and expectedVersion must be supplied together' });
  }
  if (feedId !== undefined && (typeof feedId !== 'string' || !UUID_PATTERN.test(feedId))) {
    issues.push({ path: 'feedId', message: 'must be a UUID' });
  }
  const command: SaveDraftCommand = {
    ...context,
    feedId: feedId as string | undefined,
    expectedVersion: expectedVersion === undefined ? undefined : parseExpectedVersion(expectedVersion, issues),
    feed: parseFeedDraftInput(input.feed),
    reason: parseReason(input.reason, issues),
  };
  return finish(command, issues);
}

function parseExistingCommand(value: unknown, context: MutationContext, feedId: string) {
  validateMutationContext(context);
  const input = assertRecord(value, 'body');
  const issues: ValidationIssue[] = [];
  if (!UUID_PATTERN.test(feedId)) issues.push({ path: 'feedId', message: 'must be a UUID' });
  return { input, issues, base: { ...context, feedId, reason: parseReason(input.reason, issues), expectedVersion: parseExpectedVersion(input.expectedVersion, issues) } };
}

export function parsePublishCommand(value: unknown, context: MutationContext, feedId: string): PublishCommand {
  const parsed = parseExistingCommand(value, context, feedId);
  rejectUnknown(parsed.input, ['expectedVersion', 'reason'], parsed.issues);
  return finish(parsed.base, parsed.issues);
}

export function parseArchiveCommand(value: unknown, context: MutationContext, feedId: string): ArchiveCommand {
  const parsed = parseExistingCommand(value, context, feedId);
  rejectUnknown(parsed.input, ['expectedVersion', 'reason'], parsed.issues);
  return finish(parsed.base, parsed.issues);
}

export function parseUpdatePublishedCommand(value: unknown, context: MutationContext, feedId: string): UpdatePublishedCommand {
  const parsed = parseExistingCommand(value, context, feedId);
  rejectUnknown(parsed.input, ['expectedVersion', 'patch', 'reason'], parsed.issues);
  const result = { ...parsed.base, patch: parsePublishedFeedPatch(parsed.input.patch) };
  return finish(result, parsed.issues);
}

export function parseDuplicateQuery(value: unknown): DuplicateQuery {
  const input = assertRecord(value, 'body');
  const issues: ValidationIssue[] = [];
  rejectUnknown(input, ['feedId', 'slug', 'eventKey', 'sourceUrl', 'title', 'category'], issues);
  const query: DuplicateQuery = {};
  if (input.feedId !== undefined) {
    if (typeof input.feedId !== 'string' || !UUID_PATTERN.test(input.feedId)) issues.push({ path: 'feedId', message: 'must be a UUID' });
    else query.feedId = input.feedId;
  }
  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string' || !SLUG_PATTERN.test(input.slug)) issues.push({ path: 'slug', message: 'must be lowercase safe path segments' });
    else query.slug = input.slug;
  }
  if (input.eventKey !== undefined) query.eventKey = stringField(input, 'eventKey', 2, 700, issues);
  if (input.sourceUrl !== undefined) query.sourceUrl = sourceUrlField(input.sourceUrl, 'sourceUrl', issues);
  if (input.title !== undefined) query.title = stringField(input, 'title', 2, 300, issues);
  if (input.category !== undefined) query.category = enumField(input.category, 'category', FEED_CATEGORIES, issues);
  if (!query.slug && !query.eventKey && !query.sourceUrl && !query.title) {
    issues.push({ path: 'body', message: 'requires slug, eventKey, sourceUrl, or title' });
  }
  return finish(query, issues);
}

function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function hashCanonicalRequest(value: unknown) {
  return createHash('sha256').update(JSON.stringify(canonical(value)), 'utf8').digest('hex');
}

export function calculateRuntimeContentHash(feed: FeedDraftInput, status: FeedStatus) {
  return calculateFeedV1ContentHash({ ...feed, status });
}

export function feedToDraftInput(feed: Feed): FeedDraftInput {
  const { slug, title, subtitle, category, kind, topic, date, eventAt, eventKey, cover, coverStatus, tags, summary, source, sourceUrl, body, priority } = feed;
  return { slug, title, subtitle, category, kind, topic, date, eventAt, eventKey, cover, coverStatus, tags: [...tags], summary, source, sourceUrl, body, priority };
}

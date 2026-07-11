import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { FEED_CATEGORIES, FEED_COVER_STATUSES, FEED_KINDS } from '../../src/db/schema';
import {
  calculateFeedV1ContentHash,
  FEED_HASH_VERSION,
} from '../../src/domain/feed-content-hash';

export { FEED_HASH_VERSION };

const REQUIRED_FIELDS = [
  'title',
  'subtitle',
  'category',
  'topic',
  'date',
  'eventAt',
  'eventKey',
  'cover',
  'summary',
  'source',
  'sourceUrl',
] as const;

const FIELD_SET = new Set<string>([
  ...REQUIRED_FIELDS,
  'kind',
  'coverStatus',
  'tags',
  'reviewed',
  'priority',
]);
const CATEGORY_SET = new Set<string>(FEED_CATEGORIES);
const KIND_SET = new Set<string>(FEED_KINDS);
const COVER_STATUS_SET = new Set<string>(FEED_COVER_STATUSES);
const SLUG_PATTERN = /^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/;
const ISO_WITH_ZONE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

export type FeedCategory = (typeof FEED_CATEGORIES)[number];
export type FeedKind = (typeof FEED_KINDS)[number];
export type FeedStatus = 'draft' | 'published' | 'archived';

export interface NormalizedFeed {
  slug: string;
  title: string;
  subtitle: string;
  category: FeedCategory;
  kind: FeedKind;
  topic: string;
  date: string;
  eventAt: string;
  eventKey: string;
  cover: string;
  coverStatus: 'pending';
  tags: string[];
  summary: string;
  source: string;
  sourceUrl: string;
  body: string;
  priority: number;
  status: Exclude<FeedStatus, 'archived'>;
  contentHash: string;
}

export interface ContentFailure {
  file: string;
  issues: string[];
}

export interface DuplicateSourceUrlGroup {
  sourceUrl: string;
  slugs: string[];
}

export interface ContentBatch {
  feeds: NormalizedFeed[];
  failures: ContentFailure[];
  duplicateSourceUrls: DuplicateSourceUrlGroup[];
  sourceTreeHash: string;
}

export interface ExistingFeedIdentity {
  id: string;
  slug: string;
  eventKey: string;
  contentHash: string;
  status: FeedStatus;
  origin: 'markdown' | 'api' | 'mcp';
  version: number;
}

export type ImportAction = 'insert' | 'update' | 'unchanged' | 'conflict' | 'invalid';

export interface ImportPlanEntry {
  action: ImportAction;
  slug: string;
  eventKey: string;
  expectedVersion: number | null;
  expectedContentHash: string | null;
  reason?: string;
}

export interface ImportPlan {
  entries: ImportPlanEntry[];
  counts: Record<ImportAction, number>;
  total: number;
}

function sha256(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  input: Record<string, unknown>,
  key: string,
  issues: string[],
  bounds: { min: number; max: number },
) {
  const value = input[key];
  if (typeof value !== 'string') {
    issues.push(`${key} must be a string`);
    return '';
  }
  const normalized = value.trim();
  if (normalized.length < bounds.min || normalized.length > bounds.max) {
    issues.push(`${key} length must be ${bounds.min}-${bounds.max}`);
  }
  return normalized;
}

function normalizeDate(value: unknown, key: string, issues: string[]) {
  if (typeof value !== 'string' || !ISO_WITH_ZONE_PATTERN.test(value.trim())) {
    issues.push(`${key} must be ISO 8601 with Z or an explicit offset`);
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    issues.push(`${key} must be a valid date`);
    return '';
  }
  return date.toISOString();
}

function normalizeTags(value: unknown, issues: string[]) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    issues.push('tags must be an array of strings');
    return [];
  }
  if (value.length > 64) issues.push('tags must contain at most 64 items');
  const tags = value.map((item) => item.trim());
  if (tags.some((item) => item.length < 1 || item.length > 100)) {
    issues.push('each tag length must be 1-100');
  }
  return tags;
}

function normalizeSourceUrl(value: unknown, issues: string[]) {
  if (typeof value !== 'string') {
    issues.push('sourceUrl must be a string');
    return '';
  }
  const sourceUrl = value.trim();
  if (sourceUrl.length < 8 || sourceUrl.length > 4096) issues.push('sourceUrl length must be 8-4096');
  try {
    const parsed = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) issues.push('sourceUrl must use http or https');
    if (!parsed.hostname) issues.push('sourceUrl must include a host');
    if (parsed.username || parsed.password) issues.push('sourceUrl must not include userinfo');
  } catch {
    issues.push('sourceUrl must be an absolute URL');
  }
  return sourceUrl;
}

export function calculateFeedContentHash(feed: Omit<NormalizedFeed, 'contentHash'>) {
  return calculateFeedV1ContentHash(feed);
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(target);
    return entry.isFile() && entry.name.endsWith('.md') ? [target] : [];
  }));
  return files.flat().sort((a, b) => a.localeCompare(b));
}

export async function parseFeedFile(filePath: string, contentRoot: string): Promise<NormalizedFeed> {
  const raw = await readFile(filePath, 'utf8');
  const relativeFile = path.relative(contentRoot, filePath).split(path.sep).join('/');
  const issues: string[] = [];
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(raw);
  if (!match) throw new Error(`${relativeFile}: missing YAML frontmatter`);

  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length) issues.push(...document.errors.map((error) => `YAML: ${error.message}`));

  let value: unknown;
  try {
    value = document.toJS({ maxAliasCount: 0 });
  } catch (error) {
    issues.push(`YAML aliases are not allowed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!isRecord(value)) {
    issues.push('frontmatter must be an object');
    value = {};
  }

  const input = value as Record<string, unknown>;
  for (const field of REQUIRED_FIELDS) {
    if (!(field in input)) issues.push(`missing field: ${field}`);
  }
  for (const field of Object.keys(input)) {
    if (!FIELD_SET.has(field)) issues.push(`unknown field: ${field}`);
  }

  const slug = relativeFile.replace(/\.md$/, '');
  if (!SLUG_PATTERN.test(slug)) issues.push('slug path is not stable lowercase kebab-case');

  const pathCategory = slug.split('/')[0];
  const categoryValue = input.category;
  if (typeof categoryValue !== 'string' || !CATEGORY_SET.has(categoryValue)) issues.push('category is not supported');
  if (categoryValue !== pathCategory) issues.push('category must match the content path');

  const kindValue = input.kind;
  const normalizedKind = kindValue ?? 'news';
  if (typeof normalizedKind !== 'string' || !KIND_SET.has(normalizedKind)) issues.push('kind is not supported');

  const coverStatusValue = input.coverStatus;
  const normalizedCoverStatus = coverStatusValue ?? 'pending';
  if (typeof normalizedCoverStatus !== 'string' || !COVER_STATUS_SET.has(normalizedCoverStatus)) {
    issues.push('coverStatus must be pending');
  }

  const reviewed = input.reviewed ?? false;
  const priority = input.priority ?? 0;
  if (typeof reviewed !== 'boolean') issues.push('reviewed must be a boolean');
  if (typeof priority !== 'number' || !Number.isInteger(priority)) issues.push('priority must be an integer');
  if (typeof priority === 'number' && (priority < -1000 || priority > 1000)) {
    issues.push('priority must be between -1000 and 1000');
  }

  const body = match[2].replace(/\r\n/g, '\n').trim();
  if (body.length < 1 || body.length > 50000) issues.push('body length must be 1-50000');

  const feedWithoutHash: Omit<NormalizedFeed, 'contentHash'> = {
    slug,
    title: requireString(input, 'title', issues, { min: 2, max: 300 }),
    subtitle: requireString(input, 'subtitle', issues, { min: 2, max: 500 }),
    category: categoryValue as FeedCategory,
    kind: normalizedKind as FeedKind,
    topic: requireString(input, 'topic', issues, { min: 2, max: 300 }),
    date: normalizeDate(input.date, 'date', issues),
    eventAt: normalizeDate(input.eventAt, 'eventAt', issues),
    eventKey: requireString(input, 'eventKey', issues, { min: 2, max: 700 }),
    cover: requireString(input, 'cover', issues, { min: 1, max: 1200 }),
    coverStatus: normalizedCoverStatus as 'pending',
    tags: normalizeTags(input.tags ?? [], issues),
    summary: requireString(input, 'summary', issues, { min: 2, max: 3000 }),
    source: requireString(input, 'source', issues, { min: 2, max: 300 }),
    sourceUrl: normalizeSourceUrl(input.sourceUrl, issues),
    body,
    priority: priority as number,
    status: reviewed === true ? 'published' : 'draft',
  };

  if (issues.length) throw new Error(`${relativeFile}: ${issues.join('; ')}`);

  return { ...feedWithoutHash, contentHash: calculateFeedContentHash(feedWithoutHash) };
}

export async function loadContentBatch(contentRoot = path.join(process.cwd(), 'src', 'content')): Promise<ContentBatch> {
  const files = (await listMarkdownFiles(contentRoot)).filter((file) => {
    const relative = path.relative(contentRoot, file).split(path.sep).join('/');
    return relative.includes('/') && CATEGORY_SET.has(relative.split('/')[0]);
  });
  const feeds: NormalizedFeed[] = [];
  const failures: ContentFailure[] = [];

  for (const file of files) {
    try {
      feeds.push(await parseFeedFile(file, contentRoot));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const relative = path.relative(contentRoot, file).split(path.sep).join('/');
      failures.push({ file: relative, issues: [message] });
    }
  }

  const slugMap = new Map<string, NormalizedFeed[]>();
  const eventKeyMap = new Map<string, NormalizedFeed[]>();
  const sourceUrlMap = new Map<string, NormalizedFeed[]>();
  for (const feed of feeds) {
    slugMap.set(feed.slug, [...(slugMap.get(feed.slug) ?? []), feed]);
    eventKeyMap.set(feed.eventKey, [...(eventKeyMap.get(feed.eventKey) ?? []), feed]);
    sourceUrlMap.set(feed.sourceUrl, [...(sourceUrlMap.get(feed.sourceUrl) ?? []), feed]);
  }

  for (const [slug, matches] of slugMap) {
    if (matches.length > 1) failures.push({ file: slug, issues: [`duplicate slug: ${slug}`] });
  }
  for (const [eventKey, matches] of eventKeyMap) {
    if (matches.length > 1) {
      failures.push({ file: matches.map((feed) => feed.slug).join(', '), issues: [`duplicate eventKey: ${eventKey}`] });
    }
  }

  feeds.sort((a, b) => a.slug.localeCompare(b.slug));
  const duplicateSourceUrls = [...sourceUrlMap.entries()]
    .filter(([, matches]) => matches.length > 1)
    .map(([sourceUrl, matches]) => ({ sourceUrl, slugs: matches.map((feed) => feed.slug).sort() }))
    .sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
  const sourceTreeHash = sha256(JSON.stringify(feeds.map((feed) => [feed.slug, feed.contentHash])));

  return { feeds, failures, duplicateSourceUrls, sourceTreeHash };
}

export function buildImportPlan(batch: ContentBatch, existing: ExistingFeedIdentity[]): ImportPlan {
  const entries: ImportPlanEntry[] = batch.failures.map((failure) => ({
    action: 'invalid',
    slug: failure.file,
    eventKey: '',
    expectedVersion: null,
    expectedContentHash: null,
    reason: failure.issues.join('; '),
  }));
  const bySlug = new Map<string, ExistingFeedIdentity>();
  const byEventKey = new Map<string, ExistingFeedIdentity>();
  const duplicateDbIdentity = new Set<string>();
  const matchedDatabaseIds = new Set<string>();

  for (const row of existing) {
    if (bySlug.has(row.slug)) duplicateDbIdentity.add(row.slug);
    if (byEventKey.has(row.eventKey)) duplicateDbIdentity.add(row.eventKey);
    bySlug.set(row.slug, row);
    byEventKey.set(row.eventKey, row);
  }

  for (const feed of batch.feeds) {
    const slugMatch = bySlug.get(feed.slug);
    const eventMatch = byEventKey.get(feed.eventKey);
    const base = {
      slug: feed.slug,
      eventKey: feed.eventKey,
      expectedVersion: slugMatch?.version ?? eventMatch?.version ?? null,
      expectedContentHash: slugMatch?.contentHash ?? eventMatch?.contentHash ?? null,
    };

    if (duplicateDbIdentity.has(feed.slug) || duplicateDbIdentity.has(feed.eventKey)) {
      entries.push({ ...base, action: 'conflict', reason: 'database contains duplicate identity' });
      continue;
    }
    if (!slugMatch && !eventMatch) {
      entries.push({ ...base, action: 'insert' });
      continue;
    }
    if (!slugMatch || !eventMatch || slugMatch.id !== eventMatch.id) {
      entries.push({ ...base, action: 'conflict', reason: 'slug and eventKey map to different identities' });
      continue;
    }
    matchedDatabaseIds.add(slugMatch.id);
    if (slugMatch.origin !== 'markdown') {
      entries.push({ ...base, action: 'conflict', reason: 'existing feed is not Markdown-owned' });
      continue;
    }
    if (slugMatch.status === 'archived') {
      entries.push({ ...base, action: 'conflict', reason: 'archived feed cannot be imported' });
      continue;
    }
    if (slugMatch.status === 'published' && feed.status === 'draft') {
      entries.push({ ...base, action: 'conflict', reason: 'published feed cannot regress to draft' });
      continue;
    }
    if (slugMatch.contentHash === feed.contentHash && slugMatch.status === feed.status) {
      entries.push({ ...base, action: 'unchanged' });
      continue;
    }
    entries.push({ ...base, action: 'update' });
  }

  for (const row of existing) {
    if (matchedDatabaseIds.has(row.id)) continue;
    entries.push({
      action: 'conflict',
      slug: row.slug,
      eventKey: row.eventKey,
      expectedVersion: row.version,
      expectedContentHash: row.contentHash,
      reason: 'database contains a feed that is not present in Markdown',
    });
  }

  entries.sort((a, b) => a.slug.localeCompare(b.slug));
  const counts: Record<ImportAction, number> = { insert: 0, update: 0, unchanged: 0, conflict: 0, invalid: 0 };
  for (const entry of entries) counts[entry.action] += 1;
  return { entries, counts, total: entries.length };
}

export function getGitSourceCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

export function assertCleanGitWorktree() {
  let status: string;
  try {
    status = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
  } catch {
    const immutableCommit = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.FEED_DB_BOOTSTRAP_SOURCE_COMMIT;
    if (process.env.VERCEL === '1' && /^[0-9a-f]{40}$/.test(immutableCommit ?? '')) return;
    throw new Error('Git worktree status is unavailable before a Production mutation');
  }
  if (status) throw new Error('Git worktree must be clean before a Production mutation');
}

export async function getMigrationHash(directory = path.join(process.cwd(), 'drizzle')) {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();
  const contents = await Promise.all(entries.map(async (name) => [name, await readFile(path.join(directory, name), 'utf8')]));
  return sha256(JSON.stringify(contents));
}

export function stableJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

import type { DatabaseFeedRecord } from './database-feed';
import {
  calculateFeedContentHash,
  type DuplicateSourceUrlGroup,
  type NormalizedFeed,
} from './feed-content';

interface VerifyIssue {
  scope: string;
  message: string;
}

const SPORTS_CATEGORIES = new Set(['lol', 'worldcup']);
const LISTS: Record<string, string[] | undefined> = {
  all: undefined,
  ai: ['ai', 'github', 'compute'],
  dev: ['dev', 'rust'],
  realtime: ['ai', 'github', 'stock', 'hot', 'compute', 'rust', 'dev', 'security', 'product'],
  sports: ['lol', 'worldcup'],
};

function iso(value: string | Date | null) {
  return value === null ? null : new Date(value).toISOString();
}

function isStockClose(feed: Pick<NormalizedFeed, 'category' | 'eventKey' | 'topic' | 'title' | 'subtitle'>) {
  if (feed.category !== 'stock') return true;
  const text = [feed.eventKey, feed.topic, feed.title, feed.subtitle].join(' ').toLowerCase();
  const marketText = [feed.topic, feed.title, feed.subtitle].join(' ');
  const primaryMarketText = [feed.topic, feed.title].join(' ');
  const unsupported = /欧洲|韩国|日本|亚洲|全球|欧元区|STOXX|KOSPI|Nikkei/i.test(primaryMarketText);
  const supported = /美股|美国|港股|香港|A 股|A股|沪深|上证|深证|创业板|科创/.test(marketText);
  return !unsupported && supported && (
    text.includes(':close:') || text.includes('close') || text.includes('收盘') || text.includes('闭市')
  );
}

function sortFeeds<T extends { slug: string; category: string; eventAt: string; date: string; priority: number }>(
  feeds: T[],
  now: number,
) {
  return [...feeds].sort((a, b) => {
    const aFuture = SPORTS_CATEGORIES.has(a.category) && new Date(a.eventAt).getTime() > now;
    const bFuture = SPORTS_CATEGORIES.has(b.category) && new Date(b.eventAt).getTime() > now;
    if (aFuture !== bFuture) return Number(aFuture) - Number(bFuture);
    const eventDelta = aFuture && bFuture
      ? new Date(a.eventAt).getTime() - new Date(b.eventAt).getTime()
      : new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime();
    if (eventDelta !== 0) return eventDelta;
    if (b.priority !== a.priority) return b.priority - a.priority;
    const dateDelta = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDelta !== 0) return dateDelta;
    return a.slug.localeCompare(b.slug);
  });
}

function firstSequenceDifference(expected: string[], actual: string[]) {
  const length = Math.max(expected.length, actual.length);
  for (let index = 0; index < length; index += 1) {
    if (expected[index] !== actual[index]) return { index, expected: expected[index], actual: actual[index] };
  }
  return undefined;
}

export function verifyFeedDatabase(options: {
  markdown: NormalizedFeed[];
  database: DatabaseFeedRecord[];
  duplicateSourceUrls: DuplicateSourceUrlGroup[];
  now?: number;
}) {
  const issues: VerifyIssue[] = [];
  const markdownBySlug = new Map(options.markdown.map((feed) => [feed.slug, feed]));
  const databaseBySlug = new Map(options.database.map((feed) => [feed.slug, feed]));
  const eventKeys = new Set<string>();

  for (const row of options.database) {
    if (eventKeys.has(row.eventKey)) issues.push({ scope: row.slug, message: `duplicate eventKey: ${row.eventKey}` });
    eventKeys.add(row.eventKey);
  }

  for (const feed of options.markdown) {
    const row = databaseBySlug.get(feed.slug);
    if (!row) {
      issues.push({ scope: feed.slug, message: 'missing database row' });
      continue;
    }
    const expectedPublishedAt = feed.status === 'published' ? feed.date : null;
    const recalculatedHash = row.status === 'draft' || row.status === 'published'
      ? calculateFeedContentHash({
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle,
        category: row.category,
        kind: row.kind,
        topic: row.topic,
        date: iso(row.date) ?? '',
        eventAt: iso(row.eventAt) ?? '',
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
      })
      : row.contentHash;
    const comparisons: Array<[string, unknown, unknown]> = [
      ['title', feed.title, row.title],
      ['subtitle', feed.subtitle, row.subtitle],
      ['eventKey', feed.eventKey, row.eventKey],
      ['contentHash', feed.contentHash, row.contentHash],
      ['recalculatedContentHash', row.contentHash, recalculatedHash],
      ['status', feed.status, row.status],
      ['origin', 'markdown', row.origin],
      ['category', feed.category, row.category],
      ['kind', feed.kind, row.kind],
      ['topic', feed.topic, row.topic],
      ['date', feed.date, iso(row.date)],
      ['eventAt', feed.eventAt, iso(row.eventAt)],
      ['cover', feed.cover, row.cover],
      ['coverStatus', feed.coverStatus, row.coverStatus],
      ['tags', JSON.stringify(feed.tags), JSON.stringify(row.tags)],
      ['summary', feed.summary, row.summary],
      ['source', feed.source, row.source],
      ['sourceUrl', feed.sourceUrl, row.sourceUrl],
      ['body', feed.body, row.body],
      ['priority', feed.priority, row.priority],
      ['publishedAt', expectedPublishedAt, iso(row.publishedAt)],
      ['archivedAt', null, iso(row.archivedAt)],
    ];
    for (const [field, expected, actual] of comparisons) {
      if (expected !== actual) issues.push({ scope: feed.slug, message: `${field} mismatch` });
    }
  }

  for (const row of options.database) {
    if (!markdownBySlug.has(row.slug)) issues.push({ scope: row.slug, message: 'unexpected database row' });
  }

  const now = options.now ?? Date.now();
  const expectedPublished = options.markdown.filter((feed) => feed.status === 'published' && isStockClose(feed));
  const actualPublished = options.database
    .filter((feed) => feed.status === 'published')
    .map((feed) => ({
      ...feed,
      eventAt: iso(feed.eventAt) ?? '',
      date: iso(feed.date) ?? '',
    }))
    .filter((feed) => isStockClose(feed as NormalizedFeed));

  const categories = [...new Set(options.markdown.map((feed) => feed.category))].sort();
  for (const list of [...Object.keys(LISTS), ...categories]) {
    const categoriesForList = LISTS[list] ?? (list === 'all' ? undefined : [list]);
    const expected = sortFeeds(
      expectedPublished.filter((feed) => !categoriesForList || categoriesForList.includes(feed.category)),
      now,
    ).map((feed) => feed.slug);
    const actual = sortFeeds(
      actualPublished.filter((feed) => !categoriesForList || categoriesForList.includes(feed.category)),
      now,
    ).map((feed) => feed.slug);
    const difference = firstSequenceDifference(expected, actual);
    if (difference) {
      issues.push({
        scope: `order:${list}`,
        message: `first difference at ${difference.index}: expected ${difference.expected ?? '<end>'}, actual ${difference.actual ?? '<end>'}`,
      });
    }
  }

  const counts = {
    markdownTotal: options.markdown.length,
    databaseTotal: options.database.length,
    draft: options.database.filter((feed) => feed.status === 'draft').length,
    published: options.database.filter((feed) => feed.status === 'published').length,
    archived: options.database.filter((feed) => feed.status === 'archived').length,
  };

  return {
    ok: issues.length === 0,
    counts,
    issues,
    duplicateSourceUrls: options.duplicateSourceUrls,
  };
}

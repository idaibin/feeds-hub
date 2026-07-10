import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildImportPlan,
  loadContentBatch,
  parseFeedFile,
  type ContentBatch,
  type ExistingFeedIdentity,
  type NormalizedFeed,
} from '../scripts/lib/feed-content';

function frontmatter(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    title: 'Example title',
    subtitle: 'Example subtitle',
    category: 'ai',
    kind: 'news',
    topic: 'Example topic',
    date: '2026-07-10T08:00:00Z',
    eventAt: '2026-07-10T09:00:00Z',
    eventKey: 'ai:example:2026-07-10',
    cover: '/covers/example.webp',
    coverStatus: 'pending',
    tags: ['example'],
    summary: 'Example summary',
    source: 'Example source',
    sourceUrl: 'https://example.com/story',
    reviewed: true,
    priority: 0,
    ...overrides,
  };
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
}

async function writeFeed(root: string, yaml: string, body = 'Example body.\n') {
  const file = path.join(root, 'ai', 'example.md');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `---\n${yaml}\n---\n${body}`, 'utf8');
  return file;
}

function batchWith(feed: NormalizedFeed): ContentBatch {
  return { feeds: [feed], failures: [], duplicateSourceUrls: [], sourceTreeHash: 'a'.repeat(64) };
}

function identity(feed: NormalizedFeed, overrides: Partial<ExistingFeedIdentity> = {}): ExistingFeedIdentity {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: feed.slug,
    eventKey: feed.eventKey,
    contentHash: feed.contentHash,
    status: feed.status,
    origin: 'markdown',
    version: 1,
    ...overrides,
  };
}

test('loads the full Markdown corpus without invalid records', async () => {
  const batch = await loadContentBatch();
  assert.equal(batch.feeds.length, 234);
  assert.equal(batch.failures.length, 0);
  assert.equal(batch.feeds.filter((feed) => feed.status === 'published').length, 233);
  assert.equal(batch.feeds.filter((feed) => feed.status === 'draft').length, 1);
  assert.equal(batch.duplicateSourceUrls.length, 29);
  assert.equal(new Set(batch.feeds.map((feed) => feed.slug)).size, 234);
  assert.equal(new Set(batch.feeds.map((feed) => feed.eventKey)).size, 234);
});

test('normalizes line endings and equivalent timezone values before hashing', async (t) => {
  const rootA = await mkdtemp(path.join(os.tmpdir(), 'feeds-hub-a-'));
  const rootB = await mkdtemp(path.join(os.tmpdir(), 'feeds-hub-b-'));
  t.after(async () => Promise.all([rm(rootA, { recursive: true, force: true }), rm(rootB, { recursive: true, force: true })]));

  const fileA = await writeFeed(rootA, frontmatter(), 'First line.\nSecond line.\n');
  const fileB = await writeFeed(
    rootB,
    frontmatter({ date: '2026-07-10T16:00:00+08:00', eventAt: '2026-07-10T17:00:00+08:00' }),
    'First line.\r\nSecond line.\r\n',
  );
  const [feedA, feedB] = await Promise.all([parseFeedFile(fileA, rootA), parseFeedFile(fileB, rootB)]);
  assert.equal(feedA.date, feedB.date);
  assert.equal(feedA.eventAt, feedB.eventAt);
  assert.equal(feedA.body, feedB.body);
  assert.equal(feedA.contentHash, feedB.contentHash);
});

test('applies the same defaulted fields as the Astro Content Collection schema', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'feeds-hub-defaults-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const yaml = frontmatter()
    .split('\n')
    .filter((line) => !/^(kind|coverStatus|tags|reviewed|priority):/.test(line))
    .join('\n');
  const file = await writeFeed(root, yaml);
  const feed = await parseFeedFile(file, root);

  assert.equal(feed.kind, 'news');
  assert.equal(feed.coverStatus, 'pending');
  assert.deepEqual(feed.tags, []);
  assert.equal(feed.status, 'draft');
  assert.equal(feed.priority, 0);
});

test('rejects duplicate keys, aliases, unknown fields, and dates without timezone', async (t) => {
  const cases = [
    `${frontmatter()}\ntitle: "Duplicate title"`,
    frontmatter()
      .replace('title: "Example title"', 'title: &shared "Example title"')
      .replace('subtitle: "Example subtitle"', 'subtitle: *shared'),
    `${frontmatter({ unknown: 'value' })}`,
    `${frontmatter({ date: '2026-07-10T08:00:00' })}`,
  ];

  for (const [index, yaml] of cases.entries()) {
    const root = await mkdtemp(path.join(os.tmpdir(), `feeds-hub-invalid-${index}-`));
    t.after(async () => rm(root, { recursive: true, force: true }));
    const file = await writeFeed(root, yaml);
    await assert.rejects(parseFeedFile(file, root));
  }
});

test('builds insert, unchanged, update, and protected conflict plans', async () => {
  const batch = await loadContentBatch();
  const feed = batch.feeds[0];

  assert.equal(buildImportPlan(batchWith(feed), []).counts.insert, 1);
  assert.equal(buildImportPlan(batchWith(feed), [identity(feed)]).counts.unchanged, 1);
  assert.equal(
    buildImportPlan(batchWith({ ...feed, title: `${feed.title} updated`, contentHash: 'b'.repeat(64) }), [identity(feed)]).counts.update,
    1,
  );
  assert.equal(buildImportPlan(batchWith(feed), [identity(feed, { origin: 'api' })]).counts.conflict, 1);
  assert.equal(buildImportPlan(batchWith(feed), [identity(feed, { status: 'archived' })]).counts.conflict, 1);
  assert.equal(
    buildImportPlan(batchWith(feed), [identity(feed, { eventKey: 'different:event:key' })]).counts.conflict,
    2,
  );
  assert.equal(
    buildImportPlan(batchWith(feed), [
      identity(feed),
      identity(feed, {
        id: '00000000-0000-4000-8000-000000000002',
        slug: 'ai/unexpected',
        eventKey: 'ai:unexpected',
      }),
    ]).counts.conflict,
    1,
  );
});

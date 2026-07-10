import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { getMigrationHash, stableJson } from './lib/feed-content';

const migrationDirectory = path.join(process.cwd(), 'drizzle');
const forbidden = [
  /\bdrop\s+(?:table|schema|type|index)\b/i,
  /\btruncate\b/i,
  /\bdelete\s+from\b/i,
  /\balter\s+table\b[\s\S]*\bdrop\b/i,
];
const requiredFragments = [
  'create table "feeds"',
  'create table "feed_import_runs"',
  'create type "public"."feed_status"',
  'create type "public"."feed_origin"',
  'feeds_slug_unique',
  'feeds_event_key_unique',
  'feeds_source_url_idx',
];

const files = (await readdir(migrationDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
  .map((entry) => entry.name)
  .sort();
if (!files.length) throw new Error('No generated Drizzle migration found');

const migrations = await Promise.all(files.map(async (name) => ({
  name,
  sql: await readFile(path.join(migrationDirectory, name), 'utf8'),
})));
const combined = migrations.map((migration) => migration.sql).join('\n').toLowerCase();

for (const migration of migrations) {
  for (const pattern of forbidden) {
    if (pattern.test(migration.sql)) throw new Error(`Forbidden destructive SQL in ${migration.name}: ${pattern}`);
  }
}
for (const fragment of requiredFragments) {
  if (!combined.includes(fragment)) throw new Error(`Generated migrations are missing required fragment: ${fragment}`);
}

console.log(stableJson({ ok: true, files, migrationHash: await getMigrationHash(migrationDirectory) }));

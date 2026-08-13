import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('Blob verification route is Preview-only and uses an idempotent public pathname', async () => {
  const route = await readFile('src/pages/api/verification/blob.ts', 'utf8');

  assert.match(route, /process\.env\.VERCEL_ENV !== 'preview'/);
  assert.match(route, /process\.env\.BLOB_READ_WRITE_TOKEN/);
  assert.match(route, /access: 'public'/);
  assert.match(route, /addRandomSuffix: false/);
  assert.match(route, /allowOverwrite: true/);
  assert.match(route, /verification\/feeds-hub\/blob-pipeline-probe\.png/);
  assert.match(route, /sourceSha256 === storedSha256/);
});

test('verification asset is a non-empty PNG', async () => {
  const asset = await readFile('src/assets/verification/blob-pipeline-probe.png');

  assert.ok(asset.byteLength > 0);
  assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

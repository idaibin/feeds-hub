import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_FEED_WRITE_BODY_BYTES, readLimitedJson } from '../src/lib/feed-api';
import { FeedValidationError } from '../src/lib/feed-validation';

test('limited JSON reader accepts JSON and rejects unsupported content types', async () => {
  const valid = new Request('https://feeds.example/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  });
  assert.deepEqual(await readLimitedJson(valid), { ok: true });

  const invalid = new Request('https://feeds.example/api', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: '{}',
  });
  await assert.rejects(() => readLimitedJson(invalid), FeedValidationError);
});

test('limited JSON reader enforces the 64 KiB limit even without Content-Length', async () => {
  const oversized = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_FEED_WRITE_BODY_BYTES));
      controller.enqueue(new Uint8Array([1]));
      controller.close();
    },
  });
  const request = new Request('https://feeds.example/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: oversized,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  await assert.rejects(() => readLimitedJson(request), FeedValidationError);
});

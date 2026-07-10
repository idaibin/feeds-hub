import assert from 'node:assert/strict';
import test from 'node:test';
import { FeedService, FeedServiceError } from '../src/lib/feed-service';

test('service write kill switch rejects mutations before database initialization', async () => {
  const service = new FeedService(undefined, { FEED_WRITES_ENABLED: 'false' });
  await assert.rejects(
    () => service.archive({
      actor: 'api:feed-writer',
      origin: 'api',
      idempotencyKey: 'service:disabled:0001',
      reason: 'test',
      feedId: '00000000-0000-4000-8000-000000000001',
      expectedVersion: 1,
    }),
    (error) => error instanceof FeedServiceError && error.code === 'WRITES_DISABLED',
  );
});

test('read-only duplicate checks are not blocked by the write kill switch', async () => {
  let called = false;
  const repository = {
    async findDuplicates() { called = true; return []; },
  };
  const service = new FeedService(repository as never, { FEED_WRITES_ENABLED: 'false' });
  assert.deepEqual(await service.findDuplicates({ slug: 'ai/read-only-check' }), []);
  assert.equal(called, true);
});

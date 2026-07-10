import assert from 'node:assert/strict';
import test from 'node:test';
import { authenticateFeedWriteRequest } from '../src/lib/feed-write-auth';
import { FeedServiceError } from '../src/lib/feed-service';

const token = 'a'.repeat(48);

function request(value?: string) {
  return new Request('https://feeds.example/api/feeds/drafts', {
    method: 'POST',
    headers: value ? { authorization: value } : {},
  });
}

test('write authentication fails closed while writes are disabled', () => {
  assert.throws(
    () => authenticateFeedWriteRequest(request(`Bearer ${token}`), { FEED_WRITES_ENABLED: 'false', FEED_WRITE_TOKEN: token }),
    (error) => error instanceof FeedServiceError && error.code === 'WRITES_DISABLED',
  );
});

test('write authentication rejects missing, weak, and incorrect bearer tokens', () => {
  for (const [candidate, env] of [
    [undefined, { FEED_WRITES_ENABLED: 'true', FEED_WRITE_TOKEN: token }],
    ['Bearer wrong', { FEED_WRITES_ENABLED: 'true', FEED_WRITE_TOKEN: token }],
    [`Bearer ${token}`, { FEED_WRITES_ENABLED: 'true', FEED_WRITE_TOKEN: 'short' }],
  ] as const) {
    assert.throws(
      () => authenticateFeedWriteRequest(request(candidate), env),
      (error) => error instanceof FeedServiceError && error.code === 'AUTH_REQUIRED',
    );
  }
});

test('write authentication returns a server-derived actor', () => {
  assert.deepEqual(
    authenticateFeedWriteRequest(request(`Bearer ${token}`), { FEED_WRITES_ENABLED: 'true', FEED_WRITE_TOKEN: token }),
    { actor: 'api:feed-writer', origin: 'api' },
  );
});

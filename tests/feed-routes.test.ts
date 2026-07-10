import assert from 'node:assert/strict';
import test from 'node:test';
import { POST as duplicatesPost } from '../src/pages/api/feeds/duplicates';
import { POST as draftsPost } from '../src/pages/api/feeds/drafts';
import { POST as publishPost } from '../src/pages/api/feeds/[id]/publish';
import { PATCH as updatePatch } from '../src/pages/api/feeds/[id]/index';
import { POST as archivePost } from '../src/pages/api/feeds/[id]/archive';
import * as updateRoute from '../src/pages/api/feeds/[id]/index';

test('every HTTP write route rejects before database access when writes are disabled', async () => {
  const previousWrites = process.env.FEED_WRITES_ENABLED;
  const previousDatabase = process.env.DATABASE_URL;
  process.env.FEED_WRITES_ENABLED = 'false';
  delete process.env.DATABASE_URL;
  try {
    for (const handler of [duplicatesPost, draftsPost, publishPost, updatePatch, archivePost]) {
      assert.equal(typeof handler, 'function');
      const request = new Request('https://feeds.example/api/feeds/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const response = await handler!({ request, params: { id: '00000000-0000-4000-8000-000000000001' } } as never);
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error.code, 'WRITES_DISABLED');
    }
  } finally {
    if (previousWrites === undefined) delete process.env.FEED_WRITES_ENABLED;
    else process.env.FEED_WRITES_ENABLED = previousWrites;
    if (previousDatabase === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabase;
  }
});

test('feed item route does not export a DELETE handler', () => {
  assert.equal('DELETE' in updateRoute, false);
});

test('enabled route without DATABASE_URL returns DATABASE_UNAVAILABLE instead of leaking an initialization error', async () => {
  const previous = {
    writes: process.env.FEED_WRITES_ENABLED,
    token: process.env.FEED_WRITE_TOKEN,
    database: process.env.DATABASE_URL,
  };
  const token = 'route-test-token'.padEnd(48, '0');
  process.env.FEED_WRITES_ENABLED = 'true';
  process.env.FEED_WRITE_TOKEN = token;
  delete process.env.DATABASE_URL;
  try {
    const response = await duplicatesPost!({
      request: new Request('https://feeds.example/api/feeds/duplicates', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'ai/database-unavailable' }),
      }),
      params: {},
    } as never);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Feed database is unavailable', issues: [] },
    });
  } finally {
    if (previous.writes === undefined) delete process.env.FEED_WRITES_ENABLED;
    else process.env.FEED_WRITES_ENABLED = previous.writes;
    if (previous.token === undefined) delete process.env.FEED_WRITE_TOKEN;
    else process.env.FEED_WRITE_TOKEN = previous.token;
    if (previous.database === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous.database;
  }
});

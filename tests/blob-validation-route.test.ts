import assert from 'node:assert/strict';
import test from 'node:test';
import { createPostHandler } from '../src/pages/api/validation/blob-image';

const fixture = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function request() {
  return new Request('https://preview.example/api/validation/blob-image', {
    method: 'POST',
    headers: { cookie: 'vercel-bypass=test' },
  });
}

function previewEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_REF: 'agent/verify-blob-sheet-pipeline',
    BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_test',
    ...overrides,
  };
}

test('validation route is unavailable outside its exact Preview branch', async () => {
  for (const env of [
    previewEnv({ VERCEL_ENV: 'production' }),
    previewEnv({ VERCEL_GIT_COMMIT_REF: 'main' }),
  ]) {
    const response = await createPostHandler({ env })({ request: request(), params: {} } as never);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'VALIDATION_ROUTE_DISABLED');
  }
});

test('validation route fails closed when Preview has no Blob token', async () => {
  const env = previewEnv();
  delete env.BLOB_READ_WRITE_TOKEN;
  const response = await createPostHandler({ env })({ request: request(), params: {} } as never);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, 'BLOB_NOT_CONFIGURED');
});

test('validation route uploads a bounded PNG to a deterministic public pathname', async () => {
  const uploads: Array<{ pathname: string; body: Buffer; options: Record<string, unknown> }> = [];
  const response = await createPostHandler({
    env: previewEnv(),
    fetch: async (_input, init) => {
      assert.equal(new Headers(init?.headers).get('cookie'), 'vercel-bypass=test');
      return new Response(fixture, { headers: { 'content-type': 'image/png' } });
    },
    put: async (pathname, body, options) => {
      assert.ok(Buffer.isBuffer(body));
      uploads.push({ pathname, body, options: options as unknown as Record<string, unknown> });
      return {
        url: `https://blob.example/${pathname}`,
        downloadUrl: `https://blob.example/${pathname}?download=1`,
        pathname,
        contentType: 'image/png',
        contentDisposition: 'inline',
        etag: 'test-etag',
      };
    },
  })({ request: request(), params: {} } as never);

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.data.sha256, '4c4b6a3be1314ab86138bef4314dde022e600960d8689a2c8f8631802d20dab6');
  assert.equal(uploads.length, 1);
  assert.equal(uploads[0]?.pathname, `validation/feeds-hub-automation-probe/${payload.data.sha256}.png`);
  assert.deepEqual(uploads[0]?.options, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'image/png',
    token: 'vercel_blob_rw_test',
  });
});

test('validation route rejects non-PNG fixtures before Blob access', async () => {
  let uploaded = false;
  const response = await createPostHandler({
    env: previewEnv(),
    fetch: async () => new Response('not an image', { headers: { 'content-type': 'text/plain' } }),
    put: async () => {
      uploaded = true;
      throw new Error('must not upload');
    },
  })({ request: request(), params: {} } as never);

  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, 'FIXTURE_INVALID');
  assert.equal(uploaded, false);
});

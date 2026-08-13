import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLOB_VALIDATION_BRANCH,
  uploadBlobValidationFixture,
  validatePngFixture,
} from '../scripts/lib/vercel-blob-validation';

const fixture = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function previewEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_REF: BLOB_VALIDATION_BRANCH,
    BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_test',
    ...overrides,
  };
}

test('Blob validation is disabled outside its exact Preview branch', async () => {
  for (const env of [
    previewEnv({ VERCEL_ENV: 'production' }),
    previewEnv({ VERCEL_GIT_COMMIT_REF: 'main' }),
  ]) {
    let read = false;
    const result = await uploadBlobValidationFixture({
      env,
      read: async () => {
        read = true;
        return fixture;
      },
    });
    assert.equal(result, null);
    assert.equal(read, false);
  }
});

test('Blob validation fails closed when Preview has no token', async () => {
  const env = previewEnv();
  delete env.BLOB_READ_WRITE_TOKEN;
  await assert.rejects(uploadBlobValidationFixture({ env }), /no connected Vercel Blob store/);
});

test('Blob validation uploads a bounded PNG to a deterministic public pathname', async () => {
  const uploads: Array<{ pathname: string; body: Buffer; options: Record<string, unknown> }> = [];
  const result = await uploadBlobValidationFixture({
    env: previewEnv(),
    read: async () => fixture,
    upload: async (pathname, body, options) => {
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
  });

  assert.equal(result?.sha256, '4c4b6a3be1314ab86138bef4314dde022e600960d8689a2c8f8631802d20dab6');
  assert.equal(uploads.length, 1);
  assert.equal(uploads[0]?.pathname, `validation/feeds-hub-automation-probe/${result?.sha256}.png`);
  assert.deepEqual(uploads[0]?.options, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'image/png',
    token: 'vercel_blob_rw_test',
  });
});

test('Blob validation rejects a non-PNG fixture before upload', async () => {
  assert.throws(() => validatePngFixture(Buffer.from('not an image')), /bounded PNG/);
});

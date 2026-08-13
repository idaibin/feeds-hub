import { createHash } from 'node:crypto';
import { put, type PutBlobResult } from '@vercel/blob';
import type { APIRoute } from 'astro';

export const prerender = false;

const VALIDATION_BRANCH = 'agent/verify-blob-sheet-pipeline';
const FIXTURE_PATH = '/images/brand/feeds-hub-logo-96.png';
const MAX_FIXTURE_BYTES = 256 * 1024;

interface BlobValidationOptions {
  env?: NodeJS.ProcessEnv;
  fetch?: typeof globalThis.fetch;
  put?: typeof put;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function error(code: string, message: string, status: number) {
  return json({ ok: false, error: { code, message } }, status);
}

function assertPreviewScope(env: NodeJS.ProcessEnv) {
  return env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === VALIDATION_BRANCH;
}

function forwardedHeaders(request: Request) {
  const headers = new Headers();
  for (const name of ['cookie', 'x-vercel-protection-bypass']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export function createPostHandler(options: BlobValidationOptions = {}): APIRoute {
  return async ({ request }) => {
    const env = options.env ?? process.env;
    if (!assertPreviewScope(env)) {
      return error('VALIDATION_ROUTE_DISABLED', 'Blob validation is available only on its reviewed Preview branch', 404);
    }
    if (!env.BLOB_READ_WRITE_TOKEN) {
      return error('BLOB_NOT_CONFIGURED', 'The Preview deployment has no connected Vercel Blob store', 503);
    }

    try {
      const fetchFixture = options.fetch ?? globalThis.fetch;
      const fixtureUrl = new URL(FIXTURE_PATH, request.url);
      const fixtureResponse = await fetchFixture(fixtureUrl, { headers: forwardedHeaders(request) });
      if (!fixtureResponse.ok) {
        return error('FIXTURE_UNAVAILABLE', `Fixture fetch failed with HTTP ${fixtureResponse.status}`, 502);
      }
      const contentType = fixtureResponse.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
      if (contentType !== 'image/png') {
        return error('FIXTURE_INVALID', 'Validation fixture must be a PNG image', 502);
      }
      const bytes = Buffer.from(await fixtureResponse.arrayBuffer());
      if (!bytes.byteLength || bytes.byteLength > MAX_FIXTURE_BYTES) {
        return error('FIXTURE_INVALID', 'Validation fixture has an invalid size', 502);
      }

      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const pathname = `validation/feeds-hub-automation-probe/${sha256}.png`;
      const upload = options.put ?? put;
      const blob: PutBlobResult = await upload(pathname, bytes, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType,
        token: env.BLOB_READ_WRITE_TOKEN,
      });

      return json({
        ok: true,
        data: {
          url: blob.url,
          pathname: blob.pathname,
          contentType,
          size: bytes.byteLength,
          sha256,
          source: FIXTURE_PATH,
        },
      });
    } catch (cause) {
      console.error('Blob validation failed', { name: cause instanceof Error ? cause.name : 'UnknownError' });
      return error('BLOB_VALIDATION_FAILED', 'Blob validation failed', 502);
    }
  };
}

export const POST = createPostHandler();

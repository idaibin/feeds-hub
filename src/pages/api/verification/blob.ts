import { createHash } from 'node:crypto';
import { put } from '@vercel/blob';
import type { APIRoute } from 'astro';
import probeDataUri from '../../../assets/verification/blob-pipeline-probe.png?inline';

export const prerender = false;

const BLOB_PATHNAME = 'verification/feeds-hub/blob-pipeline-probe.png';
const PNG_DATA_URI_PREFIX = 'data:image/png;base64,';

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8'
    }
  });
}

function sha256(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}

export const GET: APIRoute = async () => {
  if (process.env.VERCEL_ENV !== 'preview') {
    return json({ error: { code: 'not_found', message: 'Not found' } }, 404);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json(
      {
        error: {
          code: 'blob_token_missing',
          message: 'BLOB_READ_WRITE_TOKEN is not available in this Preview deployment'
        }
      },
      503
    );
  }

  if (!probeDataUri.startsWith(PNG_DATA_URI_PREFIX)) {
    return json({ error: { code: 'invalid_probe_asset', message: 'Probe asset is not an inline PNG' } }, 500);
  }

  const sourceBytes = Buffer.from(probeDataUri.slice(PNG_DATA_URI_PREFIX.length), 'base64');
  const sourceSha256 = sha256(sourceBytes);
  const blob = await put(BLOB_PATHNAME, sourceBytes, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
    contentType: 'image/png'
  });

  const storedResponse = await fetch(blob.url, { cache: 'no-store' });
  if (!storedResponse.ok) {
    return json(
      {
        error: {
          code: 'blob_read_failed',
          message: `Blob read returned HTTP ${storedResponse.status}`
        },
        blob
      },
      502
    );
  }

  const storedBytes = new Uint8Array(await storedResponse.arrayBuffer());
  const storedSha256 = sha256(storedBytes);
  const storedContentType = storedResponse.headers.get('content-type');

  return json({
    ok: sourceSha256 === storedSha256 && storedContentType === 'image/png',
    environment: process.env.VERCEL_ENV,
    source: {
      byteLength: sourceBytes.byteLength,
      contentType: 'image/png',
      sha256: sourceSha256
    },
    blob: {
      ...blob,
      fetchedByteLength: storedBytes.byteLength,
      fetchedContentType: storedContentType,
      fetchedSha256: storedSha256
    }
  });
};

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { put, type PutBlobResult } from '@vercel/blob';

export const BLOB_VALIDATION_BRANCH = 'agent/verify-blob-sheet-pipeline';
export const BLOB_VALIDATION_FIXTURE = 'public/images/brand/feeds-hub-logo-96.png';
export const BLOB_VALIDATION_MAX_BYTES = 256 * 1024;

export function isBlobValidationDeployment(env: NodeJS.ProcessEnv) {
  return env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === BLOB_VALIDATION_BRANCH;
}

export function validatePngFixture(bytes: Buffer) {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.byteLength || bytes.byteLength > BLOB_VALIDATION_MAX_BYTES || !bytes.subarray(0, 8).equals(pngSignature)) {
    throw new Error('Blob validation fixture must be a bounded PNG image');
  }
  return createHash('sha256').update(bytes).digest('hex');
}

export async function uploadBlobValidationFixture(options: {
  env: NodeJS.ProcessEnv;
  read?: (path: string) => Promise<Buffer>;
  upload?: typeof put;
}) {
  if (!isBlobValidationDeployment(options.env)) return null;
  const token = options.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Blob validation Preview has no connected Vercel Blob store');

  const read = options.read ?? ((path: string) => readFile(path));
  const bytes = await read(BLOB_VALIDATION_FIXTURE);
  const sha256 = validatePngFixture(bytes);
  const pathname = `validation/feeds-hub-automation-probe/${sha256}.png`;
  const upload = options.upload ?? put;
  const blob: PutBlobResult = await upload(pathname, bytes, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'image/png',
    token,
  });
  return {
    ok: true,
    mode: 'vercel-preview-blob-validation',
    url: blob.url,
    pathname: blob.pathname,
    contentType: 'image/png',
    size: bytes.byteLength,
    sha256,
    source: BLOB_VALIDATION_FIXTURE,
  } as const;
}

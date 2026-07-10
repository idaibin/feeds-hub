import type { FeedWriteErrorCode, MutationContext } from '@/domain/feed-write';
import { FeedService, FeedServiceError } from '@/lib/feed-service';
import { authenticateFeedWriteRequest } from '@/lib/feed-write-auth';
import { FeedValidationError } from '@/lib/feed-validation';

export const MAX_FEED_WRITE_BODY_BYTES = 64 * 1024;

export interface FeedApiHandlerOptions {
  service?: FeedService;
  env?: NodeJS.ProcessEnv;
}

const STATUS_BY_CODE: Record<FeedWriteErrorCode, number> = {
  AUTH_REQUIRED: 401,
  WRITES_DISABLED: 503,
  VALIDATION_FAILED: 400,
  DUPLICATE_CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  VERSION_CONFLICT: 409,
  FEED_NOT_FOUND: 404,
  INVALID_STATE_TRANSITION: 409,
  DATABASE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

function json(payload: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function feedApiSuccess(data: unknown) {
  return json({ ok: true, data });
}

export function feedApiError(error: unknown) {
  if (error instanceof FeedValidationError) {
    return json({ ok: false, error: { code: 'VALIDATION_FAILED', message: error.message, issues: error.issues } }, 400);
  }
  if (error instanceof FeedServiceError) {
    const headers: Record<string, string> = error.code === 'AUTH_REQUIRED' ? { 'www-authenticate': 'Bearer realm="feeds-hub"' } : {};
    return json({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        issues: error.issues,
        ...(error.details ? { details: error.details } : {}),
      },
    }, STATUS_BY_CODE[error.code], headers);
  }
  console.error('Feed write request failed', { name: error instanceof Error ? error.name : 'UnknownError' });
  return json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Feed write request failed', issues: [] } }, 500);
}

export async function readLimitedJson(request: Request, maximumBytes = MAX_FEED_WRITE_BODY_BYTES) {
  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new FeedValidationError([{ path: 'Content-Type', message: 'must be application/json' }]);
  }
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new FeedValidationError([{ path: 'body', message: `must not exceed ${maximumBytes} bytes` }]);
  }
  if (!request.body) throw new FeedValidationError([{ path: 'body', message: 'is required' }]);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBytes) {
      await reader.cancel();
      throw new FeedValidationError([{ path: 'body', message: `must not exceed ${maximumBytes} bytes` }]);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new FeedValidationError([{ path: 'body', message: 'must contain valid UTF-8 JSON' }]);
  }
}

export function requireIdempotencyKey(request: Request) {
  const value = request.headers.get('idempotency-key');
  if (!value) throw new FeedValidationError([{ path: 'Idempotency-Key', message: 'is required' }]);
  return value;
}

export function authenticateFeedApi(request: Request, env: NodeJS.ProcessEnv = process.env) {
  return authenticateFeedWriteRequest(request, env);
}

export function mutationContext(request: Request, reason: string, env: NodeJS.ProcessEnv = process.env): MutationContext {
  return { ...authenticateFeedApi(request, env), idempotencyKey: requireIdempotencyKey(request), reason };
}

export async function handleFeedApi(
  request: Request,
  handler: (options: { body: unknown; service: FeedService; actor: 'api:feed-writer'; origin: 'api' }) => Promise<unknown>,
  options: FeedApiHandlerOptions = {},
) {
  try {
    const env = options.env ?? process.env;
    const auth = authenticateFeedApi(request, env);
    const body = await readLimitedJson(request);
    const service = options.service ?? new FeedService(undefined, env);
    return feedApiSuccess(await handler({ body, service, ...auth }));
  } catch (error) {
    return feedApiError(error);
  }
}

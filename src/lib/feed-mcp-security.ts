import { createHash, timingSafeEqual } from 'node:crypto';

export const MCP_FEED_ACTOR = 'mcp:feed-writer' as const;
export const MAX_MCP_BODY_BYTES = 256 * 1024;

export class McpHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'McpHttpError';
  }
}

function digest(value: string) {
  return createHash('sha256').update(value, 'utf8').digest();
}

function mediaTypes(value: string | null) {
  return new Set((value ?? '')
    .split(',')
    .map((item) => item.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean));
}

function allowedOrigins(request: Request, env: NodeJS.ProcessEnv) {
  const values = new Set([new URL(request.url).origin]);
  for (const configured of (env.FEED_MCP_ALLOWED_ORIGINS ?? '').split(',').map((item) => item.trim()).filter(Boolean)) {
    try {
      const url = new URL(configured);
      if (url.origin !== configured.replace(/\/$/, '')) throw new Error('origin must not include a path');
      values.add(url.origin);
    } catch {
      throw new McpHttpError(503, 'MCP_UNAVAILABLE', 'MCP origin configuration is invalid');
    }
  }
  return values;
}

function assertOrigin(request: Request, env: NodeJS.ProcessEnv) {
  const origin = request.headers.get('origin');
  if (origin === null) return;
  if (!allowedOrigins(request, env).has(origin)) {
    throw new McpHttpError(403, 'ORIGIN_FORBIDDEN', 'Request origin is not allowed');
  }
}

function assertMethodAndHeaders(request: Request) {
  if (request.method !== 'POST' && request.method !== 'GET') {
    throw new McpHttpError(405, 'METHOD_NOT_ALLOWED', 'Method is not allowed');
  }
  const accept = mediaTypes(request.headers.get('accept'));
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (contentType !== 'application/json') {
      throw new McpHttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json');
    }
    if (!accept.has('application/json') || !accept.has('text/event-stream')) {
      throw new McpHttpError(406, 'NOT_ACCEPTABLE', 'Accept must include application/json and text/event-stream');
    }
    return;
  }
  if (!accept.has('text/event-stream')) {
    throw new McpHttpError(406, 'NOT_ACCEPTABLE', 'Accept must include text/event-stream');
  }
}

function assertDeclaredLength(request: Request, maximumBytes: number) {
  if (request.method !== 'POST') return;
  const header = request.headers.get('content-length');
  if (header === null) return;
  const declared = Number(header);
  if (!Number.isSafeInteger(declared) || declared < 0) {
    throw new McpHttpError(400, 'INVALID_REQUEST', 'Content-Length is invalid');
  }
  if (declared > maximumBytes) throw new McpHttpError(413, 'PAYLOAD_TOO_LARGE', 'MCP request body is too large');
}

function authenticate(request: Request, env: NodeJS.ProcessEnv) {
  const expected = env.FEED_MCP_TOKEN;
  if (!expected || expected.length < 32) {
    throw new McpHttpError(503, 'MCP_UNAVAILABLE', 'MCP authentication is not configured');
  }
  const authorization = request.headers.get('authorization');
  const provided = authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!provided || !timingSafeEqual(digest(expected), digest(provided))) {
    throw new McpHttpError(401, 'AUTH_REQUIRED', 'Bearer authentication is required');
  }
}

async function limitedPostRequest(request: Request, maximumBytes: number) {
  if (!request.body) throw new McpHttpError(400, 'INVALID_REQUEST', 'MCP request body is required');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBytes) {
      await reader.cancel();
      throw new McpHttpError(413, 'PAYLOAD_TOO_LARGE', 'MCP request body is too large');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body,
    signal: request.signal,
  });
}

export async function prepareMcpRequest(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
  maximumBytes = MAX_MCP_BODY_BYTES,
) {
  if (env.FEED_MCP_ENABLED !== 'true') {
    throw new McpHttpError(404, 'MCP_DISABLED', 'MCP endpoint is disabled');
  }
  assertOrigin(request, env);
  assertMethodAndHeaders(request);
  assertDeclaredLength(request, maximumBytes);
  authenticate(request, env);
  const prepared = request.method === 'POST' ? await limitedPostRequest(request, maximumBytes) : request;
  return { request: prepared, actor: MCP_FEED_ACTOR };
}

export function mcpHttpErrorResponse(error: unknown) {
  const status = error instanceof McpHttpError ? error.status : 500;
  const code = error instanceof McpHttpError ? error.code : 'INTERNAL_ERROR';
  const message = error instanceof McpHttpError ? error.message : 'MCP request failed';
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(status === 401 ? { 'www-authenticate': 'Bearer realm="feeds-hub-mcp"' } : {}),
      ...(status === 405 ? { allow: 'GET, POST' } : {}),
    },
  });
}

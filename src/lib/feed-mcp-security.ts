import { createHash, timingSafeEqual } from 'node:crypto';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';

export const MCP_FEED_ACTOR = 'mcp:feed-writer' as const;
export const MAX_MCP_BODY_BYTES = 256 * 1024;
export const MCP_SCOPES = [
  'feeds:read',
  'feeds:write',
  'feeds:publish',
  'feeds:archive',
] as const;
export type McpScope = typeof MCP_SCOPES[number];

const OAUTH_ALGORITHMS = ['RS256', 'PS256', 'ES256', 'EdDSA'] as const;
const remoteJwks = new Map<string, JWTVerifyGetKey>();

export interface McpOAuthConfig {
  issuer: string;
  audience: string;
  resourceUrl: string;
  jwksUrl: string;
  algorithms: string[];
  requiredScopes: McpScope[];
}

export interface PrepareMcpRequestOptions {
  maximumBytes?: number;
  oauthKeyResolver?: JWTVerifyGetKey;
}

export class McpHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly headers: HeadersInit = {},
  ) {
    super(message);
    this.name = 'McpHttpError';
  }
}

export class McpScopeError extends Error {
  constructor(public readonly requiredScope: McpScope) {
    super(`OAuth scope ${requiredScope} is required`);
    this.name = 'McpScopeError';
  }
}

export function requireMcpScope(authInfo: AuthInfo | undefined, requiredScope: McpScope) {
  if (!authInfo?.scopes.includes(requiredScope)) throw new McpScopeError(requiredScope);
  return authInfo;
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

function isLocalhost(url: URL) {
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
}

function configuredUrl(name: string, value: string | undefined, allowQuery = false) {
  if (!value) throw new McpHttpError(503, 'MCP_UNAVAILABLE', `${name} is not configured`);
  try {
    const url = new URL(value);
    if (
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost(url)))
      || url.hash
      || url.username
      || url.password
      || (!allowQuery && url.search)
    ) throw new Error('invalid URL');
    return url;
  } catch {
    throw new McpHttpError(503, 'MCP_UNAVAILABLE', `${name} is invalid`);
  }
}

export function getMcpOAuthConfig(env: NodeJS.ProcessEnv = process.env): McpOAuthConfig {
  const issuerValue = env.FEED_MCP_OAUTH_ISSUER?.trim();
  const resourceValue = env.FEED_MCP_OAUTH_RESOURCE?.trim();
  const jwksValue = env.FEED_MCP_OAUTH_JWKS_URL?.trim();
  configuredUrl('MCP OAuth issuer', issuerValue);
  configuredUrl('MCP OAuth resource', resourceValue);
  configuredUrl('MCP OAuth JWKS URL', jwksValue, true);
  const audience = env.FEED_MCP_OAUTH_AUDIENCE?.trim() || resourceValue!;
  const configuredAlgorithms = (env.FEED_MCP_OAUTH_ALGORITHMS ?? 'RS256')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    configuredAlgorithms.length === 0
    || configuredAlgorithms.some((algorithm) => !OAUTH_ALGORITHMS.includes(algorithm as typeof OAUTH_ALGORITHMS[number]))
  ) {
    throw new McpHttpError(503, 'MCP_UNAVAILABLE', 'MCP OAuth signing algorithms are invalid');
  }
  const requiredScopes = (env.FEED_MCP_OAUTH_REQUIRED_SCOPES ?? 'feeds:read')
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    requiredScopes.length === 0
    || requiredScopes.some((scope) => !MCP_SCOPES.includes(scope as McpScope))
  ) {
    throw new McpHttpError(503, 'MCP_UNAVAILABLE', 'MCP OAuth required scopes are invalid');
  }
  return {
    issuer: issuerValue!,
    audience,
    resourceUrl: resourceValue!,
    jwksUrl: jwksValue!,
    algorithms: configuredAlgorithms,
    requiredScopes: [...new Set(requiredScopes)] as McpScope[],
  };
}

export function getMcpProtectedResourceMetadata(env: NodeJS.ProcessEnv = process.env) {
  const config = getMcpOAuthConfig(env);
  return {
    resource: config.resourceUrl,
    authorization_servers: [config.issuer],
    scopes_supported: env.FEED_WRITES_ENABLED === 'true' ? [...MCP_SCOPES] : ['feeds:read'],
    bearer_methods_supported: ['header'],
    resource_name: 'Feeds Hub MCP',
  };
}

function protectedResourceMetadataUrl(config: McpOAuthConfig) {
  return new URL('/.well-known/oauth-protected-resource', config.resourceUrl).toString();
}

function oauthChallenge(config: McpOAuthConfig, error?: 'insufficient_scope') {
  const parameters = [
    `resource_metadata="${protectedResourceMetadataUrl(config)}"`,
    `scope="${config.requiredScopes.join(' ')}"`,
    ...(error ? [`error="${error}"`] : []),
  ];
  return `Bearer ${parameters.join(', ')}`;
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

function bearerToken(request: Request) {
  return request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
}

function legacyAuth(request: Request, env: NodeJS.ProcessEnv): AuthInfo {
  const expected = env.FEED_MCP_TOKEN;
  if (!expected || expected.length < 32) {
    throw new McpHttpError(503, 'MCP_UNAVAILABLE', 'MCP authentication is not configured');
  }
  const provided = bearerToken(request);
  if (!provided || !timingSafeEqual(digest(expected), digest(provided))) {
    throw new McpHttpError(401, 'AUTH_REQUIRED', 'Bearer authentication is required', {
      'www-authenticate': 'Bearer realm="feeds-hub-mcp"',
    });
  }
  return {
    token: provided,
    clientId: 'legacy-token',
    scopes: [...MCP_SCOPES],
    resource: new URL(request.url),
    extra: { actor: MCP_FEED_ACTOR },
  };
}

function scopesFromClaim(scope: unknown) {
  const values = new Set<string>();
  if (typeof scope === 'string') {
    for (const value of scope.split(/\s+/).filter(Boolean)) values.add(value);
  }
  return [...values];
}

function cachedRemoteJwks(url: string) {
  const cached = remoteJwks.get(url);
  if (cached) return cached;
  const resolver = createRemoteJWKSet(new URL(url));
  remoteJwks.set(url, resolver);
  return resolver;
}

async function oauthAuth(
  request: Request,
  env: NodeJS.ProcessEnv,
  keyResolver?: JWTVerifyGetKey,
): Promise<AuthInfo> {
  const config = getMcpOAuthConfig(env);
  const token = bearerToken(request);
  if (!token) {
    throw new McpHttpError(401, 'AUTH_REQUIRED', 'OAuth bearer authentication is required', {
      'www-authenticate': oauthChallenge(config),
    });
  }
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, keyResolver ?? cachedRemoteJwks(config.jwksUrl), {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: config.algorithms,
      requiredClaims: ['exp'],
    }));
  } catch {
    throw new McpHttpError(401, 'AUTH_REQUIRED', 'OAuth access token is invalid', {
      'www-authenticate': oauthChallenge(config),
    });
  }
  const clientId = typeof payload.client_id === 'string'
    ? payload.client_id
    : typeof payload.azp === 'string'
      ? payload.azp
      : typeof payload.sub === 'string'
        ? payload.sub
        : undefined;
  if (!clientId) {
    throw new McpHttpError(401, 'AUTH_REQUIRED', 'OAuth access token has no client identity', {
      'www-authenticate': oauthChallenge(config),
    });
  }
  if (typeof payload.exp !== 'number') {
    throw new McpHttpError(401, 'AUTH_REQUIRED', 'OAuth access token has no expiration', {
      'www-authenticate': oauthChallenge(config),
    });
  }
  const scopes = scopesFromClaim(payload.scope);
  if (config.requiredScopes.some((scope) => !scopes.includes(scope))) {
    throw new McpHttpError(403, 'INSUFFICIENT_SCOPE', 'OAuth access token is missing required scopes', {
      'www-authenticate': oauthChallenge(config, 'insufficient_scope'),
    });
  }
  return {
    token,
    clientId,
    scopes,
    expiresAt: payload.exp,
    resource: new URL(config.resourceUrl),
    extra: {
      ...(typeof payload.sub === 'string' ? { subject: payload.sub } : {}),
      issuer: payload.iss,
    },
  };
}

function authMode(env: NodeJS.ProcessEnv) {
  const configured = env.FEED_MCP_AUTH_MODE?.trim().toLowerCase();
  if (configured === 'oauth') return configured;
  if (configured === 'token') {
    if (env.VERCEL_ENV === 'production') {
      throw new McpHttpError(503, 'MCP_UNAVAILABLE', 'Legacy MCP token authentication is not allowed in Production');
    }
    return configured;
  }
  if (configured) throw new McpHttpError(503, 'MCP_UNAVAILABLE', 'MCP authentication mode is invalid');
  return 'oauth';
}

async function authenticate(
  request: Request,
  env: NodeJS.ProcessEnv,
  oauthKeyResolver?: JWTVerifyGetKey,
) {
  return authMode(env) === 'token'
    ? legacyAuth(request, env)
    : oauthAuth(request, env, oauthKeyResolver);
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

export function mcpActor(authInfo: AuthInfo | undefined) {
  if (!authInfo) return 'mcp:unknown';
  const configured = authInfo.extra?.actor;
  const identity = typeof configured === 'string'
    ? configured
    : typeof authInfo.extra?.subject === 'string'
      ? authInfo.extra.subject
      : authInfo.clientId;
  if (identity === MCP_FEED_ACTOR) return identity;
  const safe = identity.replace(/[^A-Za-z0-9._:@|/-]/g, '_').slice(0, 180);
  return `mcp:${safe || 'unknown'}`;
}

export async function prepareMcpRequest(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
  options: PrepareMcpRequestOptions = {},
) {
  if (env.FEED_MCP_ENABLED !== 'true') {
    throw new McpHttpError(404, 'MCP_DISABLED', 'MCP endpoint is disabled');
  }
  const maximumBytes = options.maximumBytes ?? MAX_MCP_BODY_BYTES;
  assertOrigin(request, env);
  assertMethodAndHeaders(request);
  assertDeclaredLength(request, maximumBytes);
  const authInfo = await authenticate(request, env, options.oauthKeyResolver);
  const prepared = request.method === 'POST' ? await limitedPostRequest(request, maximumBytes) : request;
  prepared.auth = authInfo;
  return { request: prepared, actor: mcpActor(authInfo), authInfo };
}

export function mcpHttpErrorResponse(error: unknown) {
  const status = error instanceof McpHttpError ? error.status : 500;
  const code = error instanceof McpHttpError ? error.code : 'INTERNAL_ERROR';
  const message = error instanceof McpHttpError ? error.message : 'MCP request failed';
  const headers = new Headers(error instanceof McpHttpError ? error.headers : undefined);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  if (status === 405) headers.set('allow', 'GET, POST');
  return new Response(JSON.stringify({ error: { code, message } }), { status, headers });
}

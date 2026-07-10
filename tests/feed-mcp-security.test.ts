import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SignJWT,
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
} from 'jose';
import {
  MAX_MCP_BODY_BYTES,
  McpHttpError,
  McpScopeError,
  getMcpProtectedResourceMetadata,
  mcpActor,
  mcpHttpErrorResponse,
  prepareMcpRequest,
  requireMcpScope,
} from '../src/lib/feed-mcp-security';

const token = 'mcp-security-token-00000000000000000000';
const enabled = { FEED_MCP_ENABLED: 'true', FEED_MCP_AUTH_MODE: 'token', FEED_MCP_TOKEN: token };

function post(options: { authorization?: string; origin?: string; accept?: string; contentType?: string; body?: string } = {}) {
  return new Request('https://feeds.example/api/mcp', {
    method: 'POST',
    headers: {
      ...(options.authorization === undefined ? {} : { authorization: options.authorization }),
      ...(options.origin === undefined ? {} : { origin: options.origin }),
      accept: options.accept ?? 'application/json, text/event-stream',
      'content-type': options.contentType ?? 'application/json',
    },
    body: options.body ?? '{"jsonrpc":"2.0","id":1,"method":"tools/list"}',
  });
}

async function rejects(
  request: Request,
  env: NodeJS.ProcessEnv,
  status: number,
  code: string,
  options: Parameters<typeof prepareMcpRequest>[2] = {},
) {
  await assert.rejects(
    () => prepareMcpRequest(request, env, options),
    (error) => error instanceof McpHttpError && error.status === status && error.code === code,
  );
}

test('MCP gate fails closed before authentication while disabled', async () => {
  await rejects(post(), { FEED_MCP_ENABLED: 'false', FEED_MCP_AUTH_MODE: 'token', FEED_MCP_TOKEN: token }, 404, 'MCP_DISABLED');
});

test('MCP gate accepts only valid independent bearer tokens of at least 32 characters', async () => {
  await rejects(post(), enabled, 401, 'AUTH_REQUIRED');
  await rejects(post({ authorization: 'Bearer wrong' }), enabled, 401, 'AUTH_REQUIRED');
  await rejects(post({ authorization: `Bearer ${token}` }), { FEED_MCP_ENABLED: 'true', FEED_MCP_AUTH_MODE: 'token', FEED_MCP_TOKEN: 'short' }, 503, 'MCP_UNAVAILABLE');
  const prepared = await prepareMcpRequest(post({ authorization: `Bearer ${token}` }), enabled);
  assert.equal(prepared.actor, 'mcp:feed-writer');
  assert.equal((await prepared.request.json()).method, 'tools/list');
});

test('MCP authentication defaults to OAuth and never downgrades because a legacy token exists', async () => {
  await rejects(
    post({ authorization: `Bearer ${token}` }),
    { FEED_MCP_ENABLED: 'true', FEED_MCP_TOKEN: token },
    503,
    'MCP_UNAVAILABLE',
  );
});

test('Vercel Production rejects explicit legacy token mode', async () => {
  await rejects(
    post({ authorization: `Bearer ${token}` }),
    { ...enabled, VERCEL_ENV: 'production' },
    503,
    'MCP_UNAVAILABLE',
  );
});

test('OAuth mode validates issuer, audience, expiry, signature, and scopes', async () => {
  const issuer = 'https://issuer.example';
  const audience = 'https://feeds.example/api/mcp';
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'oauth-test-key';
  publicJwk.alg = 'RS256';
  const keyResolver = createLocalJWKSet({ keys: [publicJwk] });
  const env = {
    FEED_MCP_ENABLED: 'true',
    FEED_MCP_AUTH_MODE: 'oauth',
    FEED_MCP_OAUTH_ISSUER: issuer,
    FEED_MCP_OAUTH_RESOURCE: audience,
    FEED_MCP_OAUTH_AUDIENCE: audience,
    FEED_MCP_OAUTH_JWKS_URL: `${issuer}/.well-known/jwks.json`,
  };
  const token = await new SignJWT({
    scope: 'feeds:read',
    permissions: ['feeds:read', 'feeds:write', 'feeds:publish', 'feeds:archive'],
    client_id: 'chatgpt-test',
  })
    .setProtectedHeader({ alg: 'RS256', kid: publicJwk.kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject('user-123')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
  const prepared = await prepareMcpRequest(post({ authorization: `Bearer ${token}` }), env, { oauthKeyResolver: keyResolver });
  assert.equal(prepared.authInfo.clientId, 'chatgpt-test');
  assert.deepEqual(prepared.authInfo.scopes, ['feeds:read']);
  assert.throws(
    () => requireMcpScope(prepared.authInfo, 'feeds:write'),
    (error) => error instanceof McpScopeError && error.requiredScope === 'feeds:write',
  );
  assert.equal(prepared.actor, 'mcp:user-123');
  assert.equal(prepared.request.auth?.clientId, 'chatgpt-test');

  const wrongAudience = await new SignJWT({ scope: 'feeds:read', client_id: 'chatgpt-test' })
    .setProtectedHeader({ alg: 'RS256', kid: publicJwk.kid })
    .setIssuer(issuer)
    .setAudience('https://wrong.example/api/mcp')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
  await rejects(
    post({ authorization: `Bearer ${wrongAudience}` }),
    env,
    401,
    'AUTH_REQUIRED',
    { oauthKeyResolver: keyResolver },
  );

  const missingScope = await new SignJWT({ client_id: 'chatgpt-test' })
    .setProtectedHeader({ alg: 'RS256', kid: publicJwk.kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
  await rejects(
    post({ authorization: `Bearer ${missingScope}` }),
    env,
    403,
    'INSUFFICIENT_SCOPE',
    { oauthKeyResolver: keyResolver },
  );

  const missingExpiration = await new SignJWT({ scope: 'feeds:read', client_id: 'chatgpt-test' })
    .setProtectedHeader({ alg: 'RS256', kid: publicJwk.kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .sign(privateKey);
  await rejects(
    post({ authorization: `Bearer ${missingExpiration}` }),
    env,
    401,
    'AUTH_REQUIRED',
    { oauthKeyResolver: keyResolver },
  );

  const expired = await new SignJWT({ scope: 'feeds:read', client_id: 'chatgpt-test' })
    .setProtectedHeader({ alg: 'RS256', kid: publicJwk.kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('0s')
    .sign(privateKey);
  await rejects(
    post({ authorization: `Bearer ${expired}` }),
    env,
    401,
    'AUTH_REQUIRED',
    { oauthKeyResolver: keyResolver },
  );

  let authError: unknown;
  try {
    await prepareMcpRequest(post(), env, { oauthKeyResolver: keyResolver });
  } catch (error) {
    authError = error;
  }
  const response = mcpHttpErrorResponse(authError);
  assert.equal(response.status, 401);
  assert.equal(
    response.headers.get('www-authenticate'),
    'Bearer resource_metadata="https://feeds.example/.well-known/oauth-protected-resource", scope="feeds:read"',
  );
});

test('OAuth protected resource metadata advertises the issuer, resource, and feed scopes', () => {
  const metadata = getMcpProtectedResourceMetadata({
    FEED_MCP_OAUTH_ISSUER: 'https://issuer.example',
    FEED_MCP_OAUTH_RESOURCE: 'https://feeds.example/api/mcp',
    FEED_MCP_OAUTH_JWKS_URL: 'https://issuer.example/.well-known/jwks.json',
  });
  assert.equal(metadata.resource, 'https://feeds.example/api/mcp');
  assert.deepEqual(metadata.authorization_servers, ['https://issuer.example']);
  assert.deepEqual(metadata.scopes_supported, ['feeds:read', 'feeds:write', 'feeds:publish', 'feeds:archive']);
});

test('MCP tool scopes and audit actors derive from validated OAuth auth info', () => {
  const authInfo = {
    token: 'redacted',
    clientId: 'chatgpt-client',
    scopes: ['feeds:read'],
    extra: { subject: 'auth0|user-123' },
  };
  assert.equal(requireMcpScope(authInfo, 'feeds:read'), authInfo);
  assert.throws(
    () => requireMcpScope(authInfo, 'feeds:write'),
    (error) => error instanceof McpScopeError && error.requiredScope === 'feeds:write',
  );
  assert.equal(mcpActor(authInfo), 'mcp:auth0|user-123');
});

test('invalid MCP authentication does not consume the request body stream', async () => {
  let pulls = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      controller.enqueue(new TextEncoder().encode('{"jsonrpc":"2.0","id":1,"method":"tools/list"}'));
      controller.close();
    },
  });
  const request = new Request('https://feeds.example/api/mcp', {
    method: 'POST',
    headers: {
      authorization: 'Bearer wrong',
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
    },
    body,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
  await Promise.resolve();
  const pullsBeforeAuthentication = pulls;
  await rejects(request, enabled, 401, 'AUTH_REQUIRED');
  assert.equal(request.bodyUsed, false);
  assert.equal(pulls, pullsBeforeAuthentication);
});

test('MCP gate permits missing/same-site/configured Origin and rejects other browser origins', async () => {
  await assert.doesNotReject(() => prepareMcpRequest(post({ authorization: `Bearer ${token}` }), enabled));
  await assert.doesNotReject(() => prepareMcpRequest(post({ authorization: `Bearer ${token}`, origin: 'https://feeds.example' }), enabled));
  await assert.doesNotReject(() => prepareMcpRequest(
    post({ authorization: `Bearer ${token}`, origin: 'https://client.example' }),
    { ...enabled, FEED_MCP_ALLOWED_ORIGINS: 'https://client.example' },
  ));
  await rejects(post({ authorization: `Bearer ${token}`, origin: 'https://evil.example' }), enabled, 403, 'ORIGIN_FORBIDDEN');
});

test('MCP gate enforces POST media negotiation and the 256 KiB body boundary', async () => {
  await rejects(post({ authorization: `Bearer ${token}`, contentType: 'text/plain' }), enabled, 415, 'UNSUPPORTED_MEDIA_TYPE');
  await rejects(post({ authorization: `Bearer ${token}`, accept: 'application/json' }), enabled, 406, 'NOT_ACCEPTABLE');
  await rejects(post({ authorization: `Bearer ${token}`, body: 'x'.repeat(MAX_MCP_BODY_BYTES + 1) }), enabled, 413, 'PAYLOAD_TOO_LARGE');
  const declared = post();
  declared.headers.set('content-length', String(MAX_MCP_BODY_BYTES + 1));
  await rejects(declared, enabled, 413, 'PAYLOAD_TOO_LARGE');
  await rejects(new Request('https://feeds.example/api/mcp', {
    method: 'OPTIONS',
    headers: { authorization: `Bearer ${token}` },
  }), enabled, 405, 'METHOD_NOT_ALLOWED');
});

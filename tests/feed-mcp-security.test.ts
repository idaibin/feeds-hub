import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_MCP_BODY_BYTES,
  McpHttpError,
  prepareMcpRequest,
} from '../src/lib/feed-mcp-security';

const token = 'mcp-security-token-00000000000000000000';
const enabled = { FEED_MCP_ENABLED: 'true', FEED_MCP_TOKEN: token };

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

async function rejects(request: Request, env: NodeJS.ProcessEnv, status: number, code: string) {
  await assert.rejects(
    () => prepareMcpRequest(request, env),
    (error) => error instanceof McpHttpError && error.status === status && error.code === code,
  );
}

test('MCP gate fails closed before authentication while disabled', async () => {
  await rejects(post(), { FEED_MCP_ENABLED: 'false', FEED_MCP_TOKEN: token }, 404, 'MCP_DISABLED');
});

test('MCP gate accepts only valid independent bearer tokens of at least 32 characters', async () => {
  await rejects(post(), enabled, 401, 'AUTH_REQUIRED');
  await rejects(post({ authorization: 'Bearer wrong' }), enabled, 401, 'AUTH_REQUIRED');
  await rejects(post({ authorization: `Bearer ${token}` }), { FEED_MCP_ENABLED: 'true', FEED_MCP_TOKEN: 'short' }, 503, 'MCP_UNAVAILABLE');
  const prepared = await prepareMcpRequest(post({ authorization: `Bearer ${token}` }), enabled);
  assert.equal(prepared.actor, 'mcp:feed-writer');
  assert.equal((await prepared.request.json()).method, 'tools/list');
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

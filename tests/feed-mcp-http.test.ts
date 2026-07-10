import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import test from 'node:test';

const token = 'real-http-mcp-test-token-0000000000000000';

async function freePort() {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

function canConnect(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.setTimeout(300);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => resolve(false));
  });
}

async function waitForPort(port: number, open: boolean, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await canConnect(port) === open) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Astro port ${port} did not become ${open ? 'ready' : 'closed'}`);
}

function waitForExit(child: ChildProcess, timeoutMs = 5_000) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (child.pid) {
        try { process.kill(-child.pid, 'SIGKILL'); } catch {}
      }
      reject(new Error('Astro MCP test server did not stop'));
    }, timeoutMs);
    child.once('exit', () => { clearTimeout(timeout); resolve(); });
    child.once('error', (error) => { clearTimeout(timeout); reject(error); });
  });
}

function ssePayload(text: string) {
  const data = text.split('\n').find((line) => line.startsWith('data: '));
  assert.ok(data, 'MCP response must contain a complete SSE data event');
  return JSON.parse(data.slice(6));
}

async function invoke(baseUrl: string, body: unknown) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}/api/mcp`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-06-18',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5_000),
  });
  const text = await response.text();
  const elapsedMs = performance.now() - startedAt;
  assert.ok(elapsedMs < 5_000, `MCP response exceeded timeout: ${elapsedMs}ms`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^text\/event-stream/);
  return ssePayload(text);
}

test('independent Astro server completes real HTTP initialize, tools/list, list, and get calls', async () => {
  const port = await freePort();
  const astro = path.join(process.cwd(), 'node_modules/astro/bin/astro.mjs');
  const child = spawn(process.execPath, [astro, 'dev', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: '1',
      ASTRO_DEV_BACKGROUND: '1',
      FEED_MCP_ENABLED: 'true',
      FEED_MCP_AUTH_MODE: 'token',
      FEED_MCP_TOKEN: token,
      FEED_MCP_OAUTH_ISSUER: 'https://issuer.example',
      FEED_MCP_OAUTH_RESOURCE: 'https://feeds.example/api/mcp',
      FEED_MCP_OAUTH_JWKS_URL: 'https://issuer.example/.well-known/jwks.json',
      FEED_READ_SOURCE: 'content',
      FEED_WRITES_ENABLED: 'false',
    },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
  try {
    await waitForPort(port, true);
    const baseUrl = `http://127.0.0.1:${port}`;
    const metadataResponse = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`, {
      signal: AbortSignal.timeout(5_000),
    });
    assert.equal(metadataResponse.status, 200);
    assert.deepEqual((await metadataResponse.json()).authorization_servers, ['https://issuer.example']);
    assert.equal(metadataResponse.headers.get('access-control-allow-origin'), '*');
    const getResponse = await fetch(`${baseUrl}/api/mcp`, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'text/event-stream',
        'mcp-protocol-version': '2025-06-18',
      },
      signal: AbortSignal.timeout(5_000),
    });
    await getResponse.text();
    assert.equal(getResponse.status, 405);
    const initialized = await invoke(baseUrl, {
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'real-http-test', version: '1.0.0' } },
    });
    assert.equal(initialized.result?.protocolVersion, '2025-06-18');
    const tools = await invoke(baseUrl, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    assert.equal(tools.result?.tools?.length, 7);
    const listed = await invoke(baseUrl, {
      jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'list_feeds', arguments: { status: 'published', limit: 1 } },
    });
    const listedPayload = JSON.parse(listed.result?.content?.[0]?.text ?? '{}');
    assert.equal(listedPayload.items?.length, 1);
    const selected = await invoke(baseUrl, {
      jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_feed', arguments: { id: listedPayload.items[0].id } },
    });
    const selectedPayload = JSON.parse(selected.result?.content?.[0]?.text ?? '{}');
    assert.equal(selectedPayload.feed?.id, listedPayload.items[0].id);
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nAstro stdout:\n${stdout}\nAstro stderr:\n${stderr}`);
  } finally {
    if (child.pid) {
      try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    }
    await waitForExit(child);
    await waitForPort(port, false);
  }
});

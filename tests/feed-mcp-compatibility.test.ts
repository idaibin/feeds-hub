import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { runMcpChild } from './helpers/run-mcp-child';

test('disabled MCP route import exits without starting the upstream cleanup timer', async () => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', '--eval', "import('./src/pages/api/mcp.ts').then(() => console.log('imported'))"], {
      cwd: process.cwd(),
      env: { ...process.env, FEED_MCP_ENABLED: 'false' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Disabled MCP route import did not exit'));
    }, 4_000);
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => { clearTimeout(timeout); reject(error); });
    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (code === 0 && stdout.includes('imported')) resolve();
      else reject(new Error(`Disabled MCP import failed with ${code}: ${stderr || stdout}`));
    });
  });
});

test('Astro MCP route completes Streamable HTTP reads and omits write tools while writes are disabled', async () => {
  const result = await runMcpChild('compat');
  assert.deepEqual(result.clientNegotiations, [
    {
      name: 'Gemini Spark',
      status: 200,
      contentType: 'text/event-stream',
      protocolVersion: '2025-06-18',
    },
    {
      name: 'Grok',
      status: 200,
      contentType: 'text/event-stream',
      protocolVersion: '2025-06-18',
    },
  ]);
  assert.equal(result.invalidProtocolStatus, 400);
  assert.equal(result.invalidProtocolCode, -32000);
  assert.deepEqual(result.tools, [
    'list_feeds',
    'get_feed',
    'find_feed_duplicates',
  ]);
  assert.deepEqual(result.strictSchemas, [false, false, false]);
  assert.equal(result.listSlug, 'ai/example-feed');
  assert.equal(result.getSlug, 'ai/example-feed');
  assert.equal(result.unknownFieldIsError, true);
});

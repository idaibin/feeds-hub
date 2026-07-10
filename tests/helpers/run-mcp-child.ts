import { spawn } from 'node:child_process';
import path from 'node:path';

export function runMcpChild(mode: 'compat' | 'integration', env: NodeJS.ProcessEnv = process.env) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', path.join(process.cwd(), 'tests/helpers/mcp-protocol-child.ts'), mode], {
      cwd: process.cwd(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let result: Record<string, unknown> | undefined;
    const timeout = setTimeout(() => finish(new Error(`MCP ${mode} child timed out: ${stderr}`)), 15_000);
    const finish = (error?: Error, value?: Record<string, unknown>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) child.kill('SIGTERM');
      if (error) reject(error);
      else resolve(value ?? {});
    };
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      const line = stdout.split('\n').find((item) => item.startsWith('MCP_CHILD_RESULT='));
      if (line && result === undefined) {
        try {
          result = JSON.parse(line.slice('MCP_CHILD_RESULT='.length));
        } catch {
          finish(new Error(`Invalid MCP child result: ${line}`));
        }
      }
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('exit', (code) => {
      if (settled) return;
      if (code === 0 && result) finish(undefined, result);
      else finish(new Error(`MCP ${mode} child exited with ${code}: ${stderr || stdout}`));
    });
    child.on('error', (error) => finish(error));
  });
}

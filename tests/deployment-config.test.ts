import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Vercel Git automation deploys main and disables every other branch pattern', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8')) as {
    buildCommand?: string;
    installCommand?: string;
    outputDirectory?: string;
    ignoreCommand?: string;
    git?: { deploymentEnabled?: Record<string, boolean> | boolean };
  };
  assert.deepEqual(config.git?.deploymentEnabled, { '**': false, main: true });
  assert.equal(config.installCommand, 'npm ci');
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(config.outputDirectory, undefined);
  assert.equal(config.ignoreCommand, undefined);
});

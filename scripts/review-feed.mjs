import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewCandidate } from './lib/review-rules.mjs';

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node scripts/review-feed.mjs <candidate.json>');
    process.exit(1);
  }

  const raw = await fs.readFile(inputPath, 'utf-8');
  const candidate = JSON.parse(raw);
  const result = reviewCandidate(candidate, new Set());
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

const currentFile = fileURLToPath(import.meta.url);
if (currentFile === path.resolve(process.argv[1] ?? '')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

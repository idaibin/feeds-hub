import { defineConfig } from '@playwright/test';

const hasDatabase = Boolean(process.env.DATABASE_URL);
const sharedEnv = {
  ...process.env,
  ASTRO_DEV_BACKGROUND: '1',
  FEED_WRITES_ENABLED: 'false',
  FEED_MCP_ENABLED: 'false',
};
const databaseRoot = `/private/tmp/feeds-hub-e2e-database-${process.pid}`;
const databaseDevCommand = [
  `rm -rf '${databaseRoot}'`,
  `mkdir -p '${databaseRoot}'`,
  `rsync -a --exclude='.git' --exclude='.astro' --exclude='.env*' --exclude='.vercel' --exclude='dist' --exclude='node_modules' ./ '${databaseRoot}/'`,
  `ln -s '${process.cwd()}/node_modules' '${databaseRoot}/node_modules'`,
  `cd '${databaseRoot}'`,
  'pnpm exec astro dev --host 127.0.0.1 --port 4402',
].join(' && ');

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:4401',
    headless: true,
  },
  webServer: [
    {
      command: 'pnpm exec astro dev --host 127.0.0.1 --port 4401',
      url: 'http://127.0.0.1:4401/',
      reuseExistingServer: false,
      env: { ...sharedEnv, FEED_READ_SOURCE: 'content' },
    },
    ...(hasDatabase ? [{
      command: `sh -c "${databaseDevCommand}"`,
      url: 'http://127.0.0.1:4402/',
      reuseExistingServer: false,
      env: { ...sharedEnv, FEED_READ_SOURCE: 'database' },
    }] : []),
  ],
});

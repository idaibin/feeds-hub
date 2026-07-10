import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { assertRuntimeDatabaseEnvironment } from './src/db/runtime-environment.ts';

assertRuntimeDatabaseEnvironment(process.env);

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://feeds-hub.vercel.app',
  vite: {
    plugins: [tailwindcss()]
  }
});

// Standalone build of the Workshop UI page → dist-workshop/, shipped in the npm
// package. In a consumer project the hayaoWorkshop() plugin serves these files at
// /workshop/ (this repo serves the page live as an MPA input instead, so the UI
// always tracks source here). The page's only '@hayao' import is type-only, so
// the bundle is just React + leva + the app. Run: npm run build:workshop
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(root, 'workshop'),
  base: './',
  resolve: {
    alias: {
      '@hayao': resolve(root, 'src/index.ts'),
    },
  },
  build: {
    outDir: resolve(root, 'dist-workshop'),
    emptyOutDir: true,
  },
});

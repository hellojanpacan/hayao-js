// Standalone build of the Studio UI page → dist-studio/, shipped in the npm
// package. In a consumer project the hayaoStudio() plugin serves these files at
// /studio/ (this repo serves the page live as an MPA input instead, so the UI
// always tracks source here). The page's only '@hayao' import is type-only, so
// the bundle is just React + leva + the app. Run: npm run build:studio
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(root, 'studio'),
  base: './',
  resolve: {
    alias: {
      '@hayao': resolve(root, 'src/index.ts'),
    },
  },
  build: {
    outDir: resolve(root, 'dist-studio'),
    emptyOutDir: true,
  },
});

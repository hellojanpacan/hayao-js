/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import { hayaoWorkshop } from './src/workshop/vitePlugin';

const root = dirname(fileURLToPath(import.meta.url));

// Auto-discover example pages: examples/<slug>/index.html → its own build input.
// A new example folder needs zero config (narrow-js lesson: MPA + auto-discovery).
function exampleInputs(): Record<string, string> {
  const dir = resolve(root, 'examples');
  const inputs: Record<string, string> = { hub: resolve(root, 'index.html') };
  // The site doors: marketing landing (hub, above), the store, the roadmap, the Sound Workshop, the Workshop.
  for (const page of ['play', 'roadmap', 'sound', 'workshop']) {
    const html = resolve(root, page, 'index.html');
    if (existsSync(html)) inputs[page] = html;
  }
  if (existsSync(dir)) {
    for (const slug of readdirSync(dir)) {
      const html = resolve(dir, slug, 'index.html');
      if (existsSync(html)) inputs[slug] = html;
    }
  }
  // Sandboxes: single-mechanic labs. Same zero-config auto-discovery as examples,
  // but a separate folder so the example *file contract* (logic/verify/golden)
  // never applies to them — a sandbox is a scene + knobs, not a full game.
  const sbDir = resolve(root, 'sandboxes');
  if (existsSync(sbDir)) {
    for (const slug of readdirSync(sbDir)) {
      const html = resolve(sbDir, slug, 'index.html');
      if (existsSync(html)) inputs[`sb-${slug}`] = html;
    }
  }
  return inputs;
}

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/ — the deploy workflow sets BASE_PATH=/hayao-js/.
  base: process.env.BASE_PATH || '/',
  // MPA mode → missing pages 404 honestly instead of silently re-serving the hub
  // (narrow-js lesson: the SPA fallback eats navigation and reads as "nothing happens").
  appType: 'mpa',
  // Cast: vitest/config bundles its own vite, so the two Plugin types are
  // nominally (not structurally) different. Runtime shape is identical.
  plugins: [hayaoWorkshop() as unknown as import('vitest/config').Plugin],
  resolve: {
    alias: {
      '@hayao': resolve(root, 'src/index.ts'),
      '@hayao/': `${resolve(root, 'src')}/`,
    },
  },
  server: {
    host: true,
    port: Number(process.env.PORT) || 5180,
  },
  build: {
    // The examples site builds here; the npm library artifact owns dist/ (see build:lib).
    outDir: 'dist-site',
    rollupOptions: { input: exampleInputs() },
  },
  test: {
    // Sim is headless-native, so most tests need no DOM at all → fast Node runner.
    environment: 'node',
    include: ['src/**/*.test.ts', 'examples/**/*.test.ts', 'scripts/**/*.test.mjs'],
    globals: true,
  },
});

// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// The live demo imports the engine straight from the monorepo source, so the
// site can never drift from the engine it demos (no npm publish in between).
const hayaoSrc = fileURLToPath(new URL('../src/index.ts', import.meta.url));

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@hayao': hayaoSrc },
    },
    server: {
      fs: { allow: ['..'] },
    },
  },
});

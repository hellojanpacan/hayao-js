// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// The live demo imports the engine straight from the monorepo source, so the
// site can never drift from the engine it demos (no npm publish in between).
const hayaoSrc = fileURLToPath(new URL('../src/index.ts', import.meta.url));

const GH = 'https://github.com/hellojanpacan/hayao-js/blob/main';

/** Dependency-free tree walker (unified plugins get plain JSON trees). */
function walk(node, fn, parent = null, index = null) {
  const next = fn(node, parent, index);
  if (next === false) return;
  const kids = node.children;
  if (Array.isArray(kids)) {
    // iterate snapshot-safe: fn may splice siblings
    for (let i = 0; i < kids.length; i++) walk(kids[i], fn, node, i);
  }
}

/**
 * Repo docs are written for GitHub: links are repo-relative (`ENGINE.md`,
 * `../examples/sokoban/`). On the site, sibling docs become /docs/<slug> and
 * everything else falls through to GitHub so no link ever 404s.
 * Resolution is per source file: docs/*.md and design/** each resolve
 * against their own directory.
 */
function rehypeRepoLinks() {
  return (tree, file) => {
    const src = String(file.path ?? '').replaceAll('\\', '/');
    const inDocs = /\/docs\/[^/]+\.md$/.test(src);
    const designMatch = src.match(/\/design\/(.*)\/?[^/]*\.md$/);
    const baseDir = inDocs
      ? 'docs'
      : designMatch
        ? ('design/' + designMatch[1]).replace(/\/[^/]*\.md$/, '').replace(/\/$/, '')
        : '';
    walk(tree, (node) => {
      if (node.type !== 'element') return;
      if (node.tagName === 'a' && typeof node.properties?.href === 'string') {
        const href = node.properties.href;
        if (/^(https?:|mailto:|#|\/)/.test(href)) return;
        const [path, hash = ''] = href.split(/(?=#)/);
        // sibling doc → internal route
        if (inDocs && /^[A-Za-z0-9._-]+\.md$/.test(path)) {
          node.properties.href = `/docs/${path.replace(/\.md$/, '').toLowerCase()}${hash}`;
          return;
        }
        // anything else repo-relative → GitHub, resolved against the source dir
        const parts = `${baseDir}/${path}`.split('/').filter((p) => p && p !== '.');
        const out = [];
        for (const p of parts) (p === '..' ? out.pop() : out.push(p));
        node.properties.href = `${GH}/${out.join('/')}${hash}`;
      }
      if (node.tagName === 'img' && typeof node.properties?.src === 'string') {
        const s = node.properties.src;
        if (!/^(https?:|data:|\/)/.test(s)) {
          const parts = `${baseDir}/${s}`.split('/').filter((p) => p && p !== '.');
          const out = [];
          for (const p of parts) (p === '..' ? out.pop() : out.push(p));
          node.properties.src = `https://raw.githubusercontent.com/hellojanpacan/hayao-js/main/${out.join('/')}`;
        }
      }
    });
  };
}

/** The Codex cross-references modules as [[module-id]] — link them to /docs/codex/<id>. */
function remarkWikiLinks() {
  return (tree) => {
    walk(tree, (node, parent, index) => {
      if (node.type !== 'text' || !parent || index == null) return;
      if (!node.value.includes('[[')) return;
      // don't rewrite inside code
      if (parent.type === 'code' || parent.type === 'inlineCode') return;
      const pieces = [];
      let last = 0;
      const re = /\[\[([a-z0-9-]+)\]\]/g;
      let m;
      while ((m = re.exec(node.value))) {
        if (m.index > last) pieces.push({ type: 'text', value: node.value.slice(last, m.index) });
        pieces.push({
          type: 'link',
          url: `/docs/codex/${m[1]}`,
          children: [{ type: 'inlineCode', value: m[1] }],
        });
        last = m.index + m[0].length;
      }
      if (!pieces.length) return;
      if (last < node.value.length) pieces.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...pieces);
    });
  };
}

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },

  integrations: [react()],

  redirects: {
    // the brand sheet moved under Docs → Themes
    '/style': '/docs/themes/regalia',
    // the "concept" door became the Design Codex showcase
    '/create/concept': '/create/design',
  },

  markdown: {
    remarkPlugins: [remarkWikiLinks],
    rehypePlugins: [rehypeRepoLinks],
  },

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

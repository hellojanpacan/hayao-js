# Embedding hayao (offline / single-file)

hayao's thesis is that an LLM can author a whole game as text. The natural
distribution for that is a **single self-contained HTML file** — no install, no
bundler, no CDN. That shape is what Claude Artifacts, js13k entries, itch.io HTML
uploads, and CodePen all want. This page has the two recipes.

`npm run build:lib` emits three library targets:

| File | Format | Use |
| --- | --- | --- |
| `dist/index.js` | ESM (readable, sourcemapped) | bundlers, `import` in apps |
| `dist/index.min.js` | ESM, minified | modern `<script type="module">` / inline import |
| `dist/hayao.global.js` | IIFE, minified, `window.hayao` | plain `<script src>` / paste-inline |

The minified builds are ~190 KB (~45 KB gzipped) and carry **no**
`sourceMappingURL` comment, so an inlined copy stays console-clean.

## Recipe A — `<script src>` global (simplest)

The IIFE build exposes everything on `window.hayao`. No modules, no plumbing:

```html
<div id="app"></div>
<script src="hayao.global.js"></script>
<script>
  const { defineGame, runBrowser, Sprite, Text, Node, vec2 } = hayao;
  const game = defineGame({
    title: 'My Game',
    build(world) {
      const root = new Node({ name: 'root' });
      root.addChild(new Text({ text: 'hello', pos: vec2(640, 360), align: 'center' }));
      return root;
    },
  });
  runBrowser(game, document.getElementById('app'));
</script>
```

See [`examples/embed.html`](../examples/embed.html) for a runnable version
(pointer-follow demo). Serve the folder or open the file after `npm run build:lib`.

## Recipe B — fully inline, single `.html` (truly offline)

For one file with **zero** external requests, paste the engine source directly
into a `<script>` tag instead of referencing it:

```html
<div id="app"></div>
<script>
  /* ⇩ paste the entire contents of dist/hayao.global.js here ⇩ */
  "use strict";var hayao=(()=> …;
  /* ⇧ end of pasted engine ⇧ */
</script>
<script>
  const { defineGame, runBrowser } = hayao;
  // …your game…
</script>
```

That's the shape an LLM tool call can emit whole: one file, opens anywhere,
works on a plane. Because the minified builds drop the sourcemap comment, there
are no 404s or console warnings from the inlined copy.

### ESM-inline variant

If you prefer modules, inline `dist/index.min.js` as a blob and dynamic-import it:

```html
<script type="module">
  const src = `/* paste dist/index.min.js here */`;
  const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  const hayao = await import(url);
  // …use hayao.defineGame / hayao.runBrowser…
</script>
```

## Notes

- **Assets.** If your game loads a webfont or atlas, use the `preload` +
  `splash` lifecycle (see [API.md](API.md)) so there's no pop-in — the engine
  holds a palette-guaranteed splash until preload resolves.
- **The one gap the engine can't close.** The window between the browser
  *fetching* the file and the script *executing* is pre-engine by physics —
  nothing hayao can draw yet. Recipe B shrinks it to a single local file.

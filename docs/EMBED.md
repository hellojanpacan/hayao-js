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
- **Touch.** These targets (Artifacts, itch, js13k) are largely played on phones.
  A keyboard game is unplayable there until you add `TouchControls` — a virtual
  gamepad in one declaration that drives the same action set as keys:
  `new TouchControls(handle, { left: ['up','down','left','right'], buttons: [{ action: 'fire' }] })`.
  It only mounts on coarse-pointer devices by default. See CONVENTIONS §Pointer.
- **The one gap the engine can't close.** The window between the browser
  *fetching* the file and the script *executing* is pre-engine by physics —
  nothing hayao can draw yet. Recipe B shrinks it to a single local file.

## Responsive fit (off-ratio screens)

`defineGame({ width, height })` fixes a **design box**. Its aspect never matches
every phone, so the question is what happens in the gap. The engine keeps one
principle: **every player sees the same play-field, and you author it once** —
no design warps to fit a window, so nobody gains visibility by picking a wide
monitor, and you don't test ten ratios. Three tools, from cheapest to most
deliberate:

1. **`fit: 'contain'` (default).** Letterbox the design box intact, scaled
   smoothly (non-integer) to the container. `runBrowser(game, mount)` — nothing
   to do. Bars are inevitable off-ratio; make them yours by extending background
   scenery, or move to `bleed`.

2. **`fit: 'bleed'`.** Keep that same box centered as a guaranteed **safe box**,
   but grow the *view* in the short axis until its aspect matches the container —
   the bars fill with the game's own margins instead of dead color. The catch
   that keeps it fair: **only cosmetic (`cosmetic = true`) scenery may live in
   the margin** — the extra a wide player sees is ambient art, never gameplay.
   Past a sane cap (`BLEED_MAX`) it letterboxes the remainder rather than stretch
   to a scenery desert. `runBrowser(game, mount, { fit: 'bleed' })`.

   ```
    portrait phone         matched ratio          ultrawide
   ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐
   │∴∴ scenery ∴∴∴∴│   │███████████████│   │∴∴│███████████████│∴∴∴∴│
   │∴┌───────────┐∴│   │██ SAFE  BOX ██│   │sc│   SAFE  BOX   │ enery│
   │∴│ SAFE  BOX │∴│   │██ (identical) │   │en│  (identical)  │∴∴∴∴∴│
   │∴└───────────┘∴│   │███████████████│   │∴∴│███████████████│∴∴∴∴│
   │∴∴ scenery ∴∴∴∴│   └───────────────┘   └───────────────────────┘
   └───────────────┘      no bleed            cosmetic bleed only
   ```

3. **`forms` (native per-device design).** When a phone in portrait would
   letterbox a landscape game to a sliver, the design itself is the wrong shape —
   declare a second one. `runBrowser` picks the form whose ratio is closest to
   the container **at boot** (a phone loads portrait, a laptop landscape). The
   pure sim/`Puzzle` is shared, so determinism and solver proofs are untouched;
   only the framing (and optionally a form-specific `build`) differs.

   ```js
   defineGame({
     title: 'My Game', width: 900, height: 520,        // the landscape default
     forms: [{ width: 540, height: 960, label: 'portrait', build: buildPortrait }],
     build: buildLandscape,
   });
   ```

   Form choice is fixed at load (swapping the whole design mid-session would
   reset play); live resizes and rotations within a form are absorbed by `fit`,
   so the game never resets under a window drag.

- **Verify it.** `safeAreaIssues(world.render(), { width, height })` flags any
  text/control that strays outside the safe box — the off-ratio-clipping class of
  bug the determinism and scoring proofs can't see. Run it in your suite like
  `layoutIssues`.
- **Overlays track the play-field.** `TouchControls` and DOM HUD anchor to
  `handle.viewport()` (the safe-box rect), so sticks and buttons sit over the
  game on any ratio — never floating on the bars or drifting into bleed scenery.

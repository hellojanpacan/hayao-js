# ERRORS.md — common mistakes, and what the message means

Hayao tries to fail *loudly and early*: when you make one of the mistakes below,
the first thing printed is a `[hayao] …` message that names the field, the
expected value, and what you actually passed — not a stack trace buried in the
render loop. This page is the long form of each of those messages.

The house format:

```
[hayao] <one-line problem>
  field:     <the offending field or argument>
  expected:  <what a correct value looks like>
  received:  <what you actually passed>
  fix:       <the concrete next step>
  docs:      https://github.com/hellojanpacan/hayao-js/blob/main/docs/ERRORS.md#<anchor>
```

If you hit a cryptic failure that *isn't* one of these, that's a bug in the guard
coverage — please [open an issue](https://github.com/hellojanpacan/hayao-js/issues).

---

<a id="sprite-shape"></a>
## `Sprite` — missing or invalid `shape`

Every `Sprite` is a vector shape, and the shape is required:

```ts
// ✗ no shape — or the wrong top-level keys
new Sprite({ size: 20, color: 'red' });
// ✓ wrap the geometry in `shape`, use paint keys for colour
new Sprite({ shape: { kind: 'rect', w: 20, h: 20 }, fill: '#b5442d' });
```

Valid `shape.kind` values: `rect`, `circle`, `ellipse`, `arc`, `poly`, `path`,
`glyph`, `diamond`, `regularPoly`. Each takes its own geometry fields — see the
`Shape` type in [API.md](API.md) (grep `Shape =`) or the doc comment on `Sprite`.

`rect` also accepts an `anchor`, and it must be exactly `'center'` (the default,
so `pos` is the middle) or `'topLeft'` (so `pos` is the top-left corner). Any
other string — `'top-left'`, `'left'`, `'tl'` — is rejected rather than silently
ignored.

---

<a id="coordinates"></a>
## A node was given a non-finite coordinate

`pos`, `scale`, `rotation`, and `z` must be finite numbers. A `NaN` or `Infinity`
coordinate would otherwise flow through the transform and the node would just
*vanish* from the view with no error — the most opaque failure there is.

The usual cause is arithmetic on an `undefined`:

```ts
// world.state.speed was never set → undefined
const x = start + world.state.speed * dt;  // NaN
node.pos = { x, y: 0 };                     // [hayao] … non-finite pos.x
```

Fixes: initialise the field (see [below](#world-state)), guard the division, or
clamp the result. Trace back from the named field to the maths that produced it.

---

<a id="build-return"></a>
## `build(world)` did not return a Node

`build` constructs the initial scene tree and must **return its root node**. A
missing `return` is the usual cause:

```ts
// ✗ builds a tree but returns undefined
build(world) {
  const root = new Node2D();
  root.addChild(new Sprite({ shape: { kind: 'circle', radius: 8 } }));
}
// ✓ return the root
build(world) {
  const root = new Node2D();
  root.addChild(new Sprite({ shape: { kind: 'circle', radius: 8 } }));
  return root;
}
```

`Node2D` is the base container (an alias for `Node`). Returning `world.state`, an
array, or a plain object is the same mistake — the world needs a real scene node
to render and update.

---

<a id="world-state"></a>
## Reading a `world.state` field that was never set

Canonical, hashed game state lives in `world.state`. If you read a field you
never initialised you get `undefined`, and the failure shows up wherever you
*use* it — often as a `[hayao]` non-finite-coordinate error one tick later, or a
`Cannot read properties of undefined` inside your own `probe`/update.

Initialise every field once, in `build` (or `preload`), before anything reads it:

```ts
build(world) {
  world.state.score = 0;
  world.state.lives = 3;
  // …
  return root;
}
```

Keep *all* canonical sim state in `world.state` (plain JSON — it is hashed and
snapshotted). Never stash it in module-level variables or closures: it escapes
determinism checks. See [CONVENTIONS.md](CONVENTIONS.md) and
[ARCHITECTURE.md](ARCHITECTURE.md).

---

<a id="esm-only"></a>
## `ERR_PACKAGE_PATH_NOT_EXPORTED` / `require() of ES Module`

`hayao` is **ESM-only**. This error means the project is trying to load it as
CommonJS. Node throws it during module resolution — *before* any hayao code runs,
so there is no `[hayao]` guard for it; the fix is project configuration:

- Add `"type": "module"` to your `package.json`, **or** name the file `.mjs`.
- Import, don't require: `import { defineGame } from 'hayao'` — not
  `const { defineGame } = require('hayao')`.
- If you use TypeScript, target ESM (`"module": "ESNext"`,
  `"moduleResolution": "Bundler"` or `"NodeNext"`).

The scaffold from `npx hayao@latest create` is already configured this way — see
[QUICKSTART.md](QUICKSTART.md).

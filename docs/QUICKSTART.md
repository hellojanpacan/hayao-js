# Quickstart — build a game from the `hayao` npm package

This is the consumer-facing guide: what to do after `npm i hayao`, with a
complete, runnable, headless-verifiable game in ~40 lines. For the full API
surface see [API.md](API.md); to browse finished games see
[hayao.dev/play](https://hayao.dev/play/).

## Install

```sh
npm i hayao
```

**hayao is ESM-only.** Make sure your project is ES modules — set
`"type": "module"` in your `package.json` (or use an `.mjs` file). Importing
from a default CommonJS project fails with a cryptic
`ERR_PACKAGE_PATH_NOT_EXPORTED`; that error means "switch to ESM," nothing more.

**Using Claude Code?** Install the hayao plugin — it packages this guide's
workflow as skills and commands (`/hayao:new-game`, `/hayao:verify`,
`/hayao:inspect-api`) and adds a hook-enforced determinism gate that blocks
the agent from finishing until the proof harness passes:

```
/plugin marketplace add hellojanpacan/hayao-js
/plugin install hayao@hayao
```

## The one idea

A hayao game is a **pure, deterministic function of its inputs**. Rendering,
audio, and the browser are *observer plugins* that paint what the function
produces — they can never change its result. So you can run the whole game in
Node, assert on its state, and prove a level winnable, with no browser and no
pixels.

## A complete game (`coins.ts`)

A 5×5 grid; walk onto coins to collect them. Canonical state lives in
`world.state` (plain JSON — it's what gets hashed). The scene tree is a
`cosmetic` *view* of that state and never pollutes the hash.

```ts
import { defineGame, createWorld, drive, Node, Sprite, type World, type InputScript } from 'hayao';

const COLS = 5, ROWS = 5;
const COINS: [number, number][] = [[4, 0], [4, 4], [0, 4]];
interface State { x: number; y: number; coins: [number, number][]; collected: number; }

function tick(world: World) {
  const s = world.state as unknown as State;
  const i = world.input;
  if (i.justPressed('right')) s.x = Math.min(COLS - 1, s.x + 1);
  else if (i.justPressed('left')) s.x = Math.max(0, s.x - 1);
  else if (i.justPressed('up')) s.y = Math.max(0, s.y - 1);
  else if (i.justPressed('down')) s.y = Math.min(ROWS - 1, s.y + 1);
  const before = s.coins.length;
  s.coins = s.coins.filter(([cx, cy]) => !(cx === s.x && cy === s.y));
  s.collected += before - s.coins.length;
}

export const game = defineGame({
  title: 'Coin Grab', width: COLS * 32, height: ROWS * 32, seed: 1,
  build(world: World): Node {                       // build MUST return the root Node
    world.state = { x: 0, y: 0, coins: COINS.map(([x, y]) => [x, y]), collected: 0 } as unknown as Record<string, unknown>;
    const root = new Node({ name: 'root' });
    // A view sprite: shape is required (not `size`); mark it cosmetic so it stays out of hash().
    const player = new Sprite({ name: 'player', shape: { kind: 'rect', w: 28, h: 28 }, fill: '#e8c34a' });
    player.cosmetic = true;
    player.onUpdate = (n) => { const s = world.state as unknown as State; n.pos = { x: s.x * 32 + 2, y: s.y * 32 + 2 }; };
    root.addChild(player);
    const brain = new Node({ name: 'brain' });        // a node that advances the sim each frame
    brain.onUpdate = () => tick(world);
    root.addChild(brain);
    return root;
  },
  probe(world: World) {                               // expose exactly the state you'll assert on
    const s = world.state as unknown as State;
    return { x: s.x, y: s.y, collected: s.collected, remaining: s.coins.length, hash: world.hash() };
  },
});
```

## Prove it works — headlessly

`createWorld(game)` runs the sim in Node. `drive(world, script, until?)` steps a
scripted input log, optionally stopping early when a predicate on `probe()` is
true. Then assert on `probe()` and `hash()`.

```ts
// Input scripts are segments of { press, frames }. justPressed is a TRUE rising
// edge: holding the same action across adjacent frames fires ONCE, so separate
// repeated taps of the same action with a neutral (release) frame.
const tap = (dir: string): InputScript => [{ press: [dir], frames: 1 }, { frames: 1 }];
const script: InputScript = [
  ...tap('right'), ...tap('right'), ...tap('right'), ...tap('right'),
  ...tap('down'),  ...tap('down'),  ...tap('down'),  ...tap('down'),
  ...tap('left'),  ...tap('left'),  ...tap('left'),  ...tap('left'),
];

const world = createWorld(game);
const res = drive(world, script, (p) => p.remaining === 0);
const p = game.probe!(world);
console.assert(p.collected === 3 && p.remaining === 0, 'all coins collected');
console.assert(res.matched, 'stopped early on the win predicate');

// Determinism: the same script always produces the same hash.
const a = createWorld(game); drive(a, script);
const b = createWorld(game); drive(b, script);
console.assert(a.hash() === b.hash(), 'two runs hash identically');
```

Run it:

```sh
npx tsx coins.ts          # or: node coins.mjs
```

That's the whole loop an AI author uses: **define → step → assert on
state/hash**. A refactor that keeps the hash keeps behavior; a level a search
can reach is provably winnable — all without opening a browser.

## Gotchas the type surface won't shout at you

- **ESM only** — `"type": "module"` (see Install).
- **`build(world)` must return the root `Node`.** Put canonical, hashed state in
  `world.state` (plain JSON); never in module-level variables.
- **`Sprite` takes `{ shape: { kind: 'rect', w, h } }`**, not `{ size }`.
- **Mark pure-view nodes `cosmetic = true`** so transient display never enters
  `world.hash()` — otherwise determinism checks will (correctly) fail.
- **`justPressed` is a one-frame rising edge** — insert a neutral frame between
  repeated taps of the same action. `justReleased` mirrors it.
- **Query ACTION names, not key codes** — `isDown('jump')`, never
  `isDown('Space')`. In the browser, an undeclared name warns once in the
  console instead of silently never firing.
- **Pointer coordinates are design-space** — `input.axis('pointer.x'/'pointer.y')`
  already un-letterboxed; mouse buttons are bindable actions
  (`mouse.left/right/middle`). See CONVENTIONS §Pointer & continuous input.
- **`splash: false`** in `defineGame` skips the built-in loading splash (e.g.
  for embeds that paint their own cover).
- **The browser build is scriptable** — `?capture=1` exposes `window.__hayao`
  (pump/probe/hash/shot), and `handle.tick()` single-steps the real loop; the
  loop keeps running in hidden tabs (never patch rAF yourself). See
  VERIFICATION §Channel 2.

## Where to go next

- [API.md](API.md) — the full, greppable public surface (every export + signature).
- [VERIFICATION.md](VERIFICATION.md) — the two verification channels; how to prove a game correct.
- [CONVENTIONS.md](CONVENTIONS.md) — how larger games are structured (pure logic modules, solver proofs, house style).
- [hayao.dev/play](https://hayao.dev/play/) — finished example games, each with source.

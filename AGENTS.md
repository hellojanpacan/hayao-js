# AGENTS.md — operating manual for AI sessions in hayao.js

You are the primary game developer here. The engine pre-solves the traps
(headless verification, determinism, crisp rendering, DOM menus). Trust it and
hold the invariants.

## Commands
- `npm run dev` — dev server (hub + all examples; MPA, honest 404s)
- `npm run check` — typecheck (must pass before any handoff)
- `npm test` — Vitest (engine + example suites)
- `npm run invariants` — static check of the hard invariants below (banned
  calls, example imports, example file contract)
- `npm run verify` — CI gate: invariants + proves examples winnable + deterministic
- `npm run api` — regenerate `docs/API.md` (the greppable public surface)
- `npm run build` — production build

## Skills (Claude Code)
- `/new-game` — scaffold + build a new example via the BUILDLOG loop
  (`.claude/skills/new-game/`). Use it instead of improvising the steps.
- `/retro` — end-of-session: log process friction to `docs/FRICTION.md` and
  land the doc/check fix that prevents a recurrence.

## Before writing game code
1. Read `docs/FUN.md` (the design playbook: universal laws, your genre's
   cheat sheet, and the before-you-author-content checklist).
2. Read `docs/CONVENTIONS.md` (structure, house style, definition of done).
3. Read `docs/VERIFICATION.md` (how you will test what you build).
4. Grep `docs/API.md` (or `src/index.ts`) for the REAL API. Never guess a name.
5. Copy `examples/sokoban/` — it is the living reference for every convention.

## Hard invariants
The statically checkable ones are enforced by `npm run invariants` (first
stage of `npm run verify`); the rest are caught by determinism/hash checks in
the verify suites. When a session trips one anyway, log it in
`docs/FRICTION.md` and tighten the check.
- **Import only from `@hayao`.** The internals are swappable behind that seam.
- **All randomness flows through `world.rng`** (a seeded `Rng`). `Math.random()`
  is banned in `src/` and games.
- **No wall-clock in the sim.** No `Date.now()`, `performance.now()`, or argless
  `new Date()` in game logic — time comes from the fixed `Clock` (`world.time`,
  `dt` in `onProcess`). Wall-clock is only allowed in the browser driver to feed
  the accumulator.
- **Turn-based/puzzle logic goes in a PURE module** (no engine imports) that
  implements `Puzzle<State, Move>`, with a solver proof of winnability for every
  level. The scene tree is a *view* of that state.
- **Menus/title/game-over are DOM overlays** via `showScreen()`/`hideScreen()` —
  never canvas/`Text`-in-world for chrome. `Text` nodes are for in-world labels.
- **Mark pure-view nodes `cosmetic = true`** so transient display never enters
  `world.hash()` — otherwise determinism/snapshot checks will (correctly) fail.
- **Canonical state that lives outside the scene tree goes in `world.state`**
  (plain JSON data — it IS hashed and snapshotted). Never keep sim state in
  module-level variables or closures: it silently escapes determinism checks.
  The scene tree renders it; `world.state` owns it.
- **Expose a `probe(world)`** in `defineGame` returning a compact state snapshot;
  you cannot verify without it. Add `goto`/level-jump affordances for testing.
- **Ordered iteration for logic.** Arrays or insertion-ordered maps — never rely
  on `Set`/object-key order in the sim.
- **Write small modules, one file per Write**, as soon as each is drafted (large
  single-shot files stall agent streams).

## The verification recipe (short)
```ts
import { createWorld, solve, assertSolvable, assertDeterministic } from '@hayao';
assertSolvable(myPuzzle, { level: 0 });                 // every level winnable
const world = createWorld(myGame);
world.step(['right']); world.step([]);                  // scripted play (release between edges)
expect(world.probe().solved).toBe(true);                // assert on state, not pixels
assertDeterministic(() => createWorld(myGame), inputLog); // no hidden nondeterminism
```
Then a headless SVG screenshot (`new HeadlessRenderer(...).toSVGString()`) for
looks only — never for correctness.

## Adding a game
Copy `examples/sokoban/` → `examples/<slug>/`, adapt, add a card to the store at
`play/index.html` (group it under the matching engine-slice section), `npm run
check`, then verify per `docs/VERIFICATION.md` before presenting a play link.
Vite auto-discovers the new folder — zero config.

## The site (three doors)
The website is split by audience: `index.html` is the marketing landing
(hayao.dev), `play/index.html` is the example store, `roadmap/index.html` is the
public roadmap + js13k benchmark ladder, and developer docs live at hayao.js.org.
Art-finished flagships (currently `lanternway`, `rootward`, `tarnholm`) get a
still-frame thumbnail under `public/shots/<slug>.svg`; regenerate them with
`npm run thumbs` after changing their art.

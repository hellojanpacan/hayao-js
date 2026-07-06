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
- `npm run eval` — score every example on proof coverage (winnable · determinism ·
  ramp · feel · generated · code-as-art) + the overall verified rate
- `npm run build` — production build

To start a NEW project outside this repo: `npm create hayao@latest my-game`
scaffolds a runnable game whose starter already generates a solver-proven campaign.

## Skills (Claude Code)
- `/new-game` — scaffold + build a new example via the BUILDLOG loop
  (`.claude/skills/new-game/`). Use it instead of improvising the steps.
- `/studio` — act on human playtests: the `hayao-studio` MCP server (.mcp.json)
  reads `.studio/` sessions, replays any tick headlessly (`inspect_moment`),
  and reports hesitations/deaths/futile verbs (`get_playtest_report`). Humans
  play + tune declared knobs at `/studio/` on the dev server. `docs/STUDIO.md`.
- `/retro` — end-of-session: log process friction to `docs/FRICTION.md` and
  land the doc/check fix that prevents a recurrence.

## Design from the mechanic, not from the corpus
The examples exist to **prove the engine** and to **show conventions** — they are
proof fixtures, not a catalogue of what a hayao game may be. They were built fast
to stress one capability each, so their *ambition* is a floor, not a ceiling.
Treat them accordingly:
- Decide what the game is **from its core mechanic and player fantasy**, as if the
  corpus didn't exist. Do NOT open `examples/` asking "what should I make?" — that
  is how thirty simple prototypes quietly become the design spec for the next one.
- Reach for an example only to answer **"how is this wired?"** (state/view split,
  `defineGame`, probes) — never **"what should this be?"**.
- To learn ONE primitive in isolation (physics, particles, camera, pathfinding,
  tweens, procgen, audio), read the matching `sandboxes/<x>-lab` — a single
  mechanic with tunable knobs, no genre attached. Sandboxes teach you to *compose
  parts*; games would teach you to *imitate a genre*.
- Aim above the corpus. If the idea resembles an existing example, push it until
  it does something no example does. The engine's ceiling is Godot/GameMaker, not
  the last prototype in `examples/`.

## Before writing game code
0. **If the game isn't designed yet** — the intent is high-level ("a polished
   platformer with responsive controls", "an RTS with faction asymmetry and
   impressive battles") — run the **[Design Codex](design/)** first:
   intent→anchor→compose→twist→pillars→loop, then hand off here. It's the
   *generative* front half (concept, reference DNA, composable systems, the
   creative twist); the steps below are the *proof* half.
1. Read `docs/FUN.md` (the design playbook: universal laws, your genre's
   cheat sheet, and the before-you-author-content checklist).
2. Read `docs/CONVENTIONS.md` (structure, house style, definition of done).
3. Read `docs/VERIFICATION.md` (how you will test what you build).
4. Grep `docs/API.md` (or `src/index.ts`) for the REAL API. Never guess a name.
5. Copy `examples/sokoban/` for its **structure** (the logic/view split, the file
   contract) — not its scope. Consult `sandboxes/` for how each primitive is used.

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
- **Generate content; don't hand-author volume.** For anything past a handful of
  levels, express the level as a `Puzzle` factory and let `generateLevels` /
  `composeCampaign` (content/) emit solver-verified levels inside a difficulty
  band, then prove the curve with `rampIssues` / `assertRamp`. An hour of content
  is a list of seeds, every one proven — not forty hand-drawn maps. The reference
  is `examples/lanternfold` (a 42-level campaign composed entirely this way).

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
Vite auto-discovers the new folder — zero config. Adding a game needs **no**
count bookkeeping: never hardcode a portfolio total ("28 games", "the core
twenty-one") in copy — it goes stale the moment the next game lands. The store
header derives its count live from the cards; elsewhere phrase it count-free
("browse the full store", "a growing portfolio"). Per-game facts (Kintsugi's
30 rooms, lanternfold's 42 levels) are fixed and fine.

## The site (three doors)
The website is split by audience: `index.html` is the marketing landing
(hayao.dev), `play/index.html` is the example store, `roadmap/index.html` is the
public roadmap + js13k benchmark ladder, and developer docs live at hayao.js.org.
Art-finished flagships (currently `lanternway`, `rootward`, `tarnholm`) get a
still-frame thumbnail under `public/shots/<slug>.svg`; regenerate them with
`npm run thumbs` after changing their art.

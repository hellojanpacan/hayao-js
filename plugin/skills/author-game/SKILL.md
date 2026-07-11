---
name: author-game
description: Author a hayao game the verified way — inspect the installed API surface (never guess), design from the mechanic, keep logic pure and deterministic, and prove it winnable before presenting. Use when building or extending any game on the hayao engine.
---

# Author a hayao game

You are working on the hayao engine: deterministic, headless-verifiable, built
so an AI agent can *prove* a game correct instead of hoping. This skill teaches
the workflow, not the API — the API lives in the installed package and is the
only source of truth for names and shapes.

## Rule zero: inspect, never assume

Nothing in this skill (or your memory) is an API reference. Before touching any
hayao symbol, read the real surface:

- **In the engine repo (`hayao-js`)**: grep `docs/API.md` — the committed digest
  of everything importable from `@hayao`. Regenerate with `npm run api` if you
  changed exports.
- **In a consumer project**: read `node_modules/hayao/dist/index.d.ts` (the
  installed `.d.ts` IS the reference for the version you actually have), or the
  project's own `AGENTS.md` if `npm create hayao` emitted one.

If a name you expected is missing, the API changed — adapt to what is
installed; do not write the remembered shape and hope.

## The invariants (what the verifier will hold you to)

1. **Import only from `@hayao`** (engine repo) / `hayao` (consumer). Internals
   are swappable behind that seam.
2. **All randomness through `world.rng`.** `Math.random()`, `Date.now()`,
   `performance.now()`, and argless `new Date()` are banned in sim code. Time
   comes from the fixed clock (`world.time`, `dt`).
3. **Turn-based/puzzle rules live in a PURE module** (no engine imports)
   implementing the engine's `Puzzle<State, Move>` shape, and every level is
   machine-proven winnable with the solver before you present it.
4. **Menus and chrome are DOM overlays** (`showScreen()`/`hideScreen()`);
   pure-view nodes set `cosmetic = true` so display never enters
   `world.hash()`.
5. **Canonical state outside the tree goes in `world.state`** (plain JSON — it
   is hashed and snapshotted). Never module-level variables or closures.
6. **Ordered iteration for logic** — arrays or insertion-ordered maps, never
   `Set`/object-key order.
7. **Expose `probe(world)`** returning a compact state snapshot; verification
   asserts on probes and hashes, never pixels.

## The loop

1. **Design from the mechanic.** Decide what the game is from its core
   mechanic and player fantasy first — one sentence each — before any genre
   label or code. In the engine repo, the generative method lives in `design/`
   (start at `design/00-process/the-spine.md`).
2. **Inspect the surface** (rule zero) for every primitive you plan to touch.
3. **Author** pure logic first, then the scene view of it, then browser wiring
   last. Small modules, written one file at a time.
4. **Prove** — use the verify-determinism skill (or `/hayao:verify`): typecheck,
   tests, solver proof of winnability, `assertDeterministic` on a scripted
   input log. Assert on `probe()`/`hash()`.
5. **Look** — only after correctness is proven, render a headless SVG frame and
   judge the art. Looks never substitute for proofs.

## The house style (a default, not a wall)

Art and audio land in-house by default; a project may leave the style entirely
and lose nothing structural.

- **Regalia palette**: one hue at two opacities per shape — mass at 32%, focal
  detail at 100%. Core four: Regalia Gold `#e59500`, Ink Navy `#29335c`,
  Meadow `#337357`, Dusk Blue `#669bbc`.
- **Bold rounded masses, solid fills, no gradients, no outlines, no
  photographic texture.** Author on a 24-grid, keep it vector — everything is
  procedural draw ops / SVG paths, i.e. code-expressible and diffable.
- **Audio is soft synthesis**: sine/triangle/noise voices, pentatonic,
  deterministic — no sample files.

Full recipes: `docs/STYLE.md`, `docs/ASSETS.md`, `docs/AUDIO.md` in the engine
repo (readable on GitHub from a consumer project). The engine ships the palette
and duotone helpers on its public surface — inspect for the exact names.

## Definition of done

Typecheck clean · tests green · every level solver-proven · determinism check
passes · complete loop playable start → win/lose → restart, keyboard-only ·
art judged from a headless render. Only then present a play link.

slug: beatgate

# Beatgate — a two-button timing game

**Difficulty: 1/6 (easiest).** Real-time, no grid, no solver, tiny state.

## Brief

A cursor sweeps back and forth along a horizontal track. Somewhere on the
track sits a highlighted **gate**. Press **confirm** while the cursor is
inside the gate to score a hit; press it outside and you take a miss. The
second button, **cancel**, instantly reverses the cursor's direction (a free
action — the skill move for lining up a hit).

- 10 hits wins. 3 misses loses.
- Each hit shrinks the gate and moves it to a new position drawn from
  `world.rng`, so the game gets harder as you go.
- Cursor speed is constant per run; pick a speed where a human can
  comfortably hit the first gates and must use reversal for the last ones.

## Content

One endless-track mode is enough. No levels, no menus beyond the standard
title / game-over overlays with restart.

## Definition of done

Everything in docs/CONVENTIONS.md "Definition of done", which for this game
concretely means at least:

1. `npm run check`, `npm test`, `npm run verify` all green.
2. Gate/cursor rules live in a pure logic module; the scene tree only
   renders it.
3. verify.ts proves by **scripted playthrough** (not solver): a full winning
   run (10 hits) and a losing run (3 misses), asserting on probes.
4. A frame-exactness check: pressing confirm on the first frame inside the
   gate and on the last frame inside the gate both score; one frame outside
   either edge is a miss.
5. Determinism + snapshot checks pass; full-run golden hash pinned.
6. Two feel probes with tuned windows (e.g. time-to-first-hit, input
   density of the winning run) + a filmstrip artifact.
7. Complete loop: title → play → win/lose → restart, keyboard only.

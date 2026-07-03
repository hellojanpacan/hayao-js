slug: glidegrove

# Glidegrove — an ice-slide puzzle

**Difficulty: 3/6.** Turn-based, solver-mandatory, hand-authored levels.

## Brief

Sokoban's colder cousin: the player is a fox on a frozen pond. A move
(up/down/left/right) **slides** the fox in that direction until it hits a
tree, a rock, or the pond edge — no stopping mid-slide. Scattered on the ice
are **berries**; the fox collects every berry it slides over. Collect all
berries, then slide onto the **den** tile to finish the level.

- Sliding over the den with berries still uncollected does nothing (you
  pass straight over it).
- 5 hand-authored levels with a difficulty ramp: level 1 teaches sliding,
  level 5 requires ≥10 moves in the optimal solution.

## Content

5 levels, level-select via completing them in order, standard overlays,
restart-level key.

## Definition of done

Everything in docs/CONVENTIONS.md "Definition of done", concretely at least:

1. `npm run check`, `npm test`, `npm run verify` all green.
2. Rules implemented as a pure `Puzzle<State, Move>` module (no engine
   imports); the scene tree is a projection of that state.
3. verify.ts proves **every level solvable** via `assertSolvable`/`solve`,
   AND replays level 1's solved path through the real game, asserting the
   win on probes (logic and view agree).
4. Difficulty ramp asserted: solve depths are monotonically non-decreasing
   (reasonable slack allowed) and level 5's optimal depth ≥ 10.
5. Determinism + snapshot checks pass; the level-1 solve replay golden hash
   pinned.
6. Two feel probes with tuned windows + a filmstrip artifact of a solve.
7. Complete loop: title → levels 1..5 in order → win screen → restart,
   keyboard only; per-level restart works and leaks no state.

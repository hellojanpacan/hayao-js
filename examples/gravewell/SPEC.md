# SPEC — Gravewell (benchmark B2)

Reproduction target: **Black Hole Square** — js13kGames 2021, **#9 Overall**
(author Quinten Clause; `play_url` js13kgames.com/2021/games/black-hole-square).
Corpus source: `~/Documents/js13k/games/2021/black-hole-square/` (design
extraction only — no code, art, or level layouts ported; all Gravewell levels
are original).

## Core loop

A 6×6 board of space debris. Tap pieces to clean the board: X squares vanish,
neutron stars collapse into black holes, arrows slide whole runs of pieces —
and anything sliding into a black hole is swallowed. Every level has a hard
tap budget (par). Clean the board exactly within budget or fail.

## Extracted rules (from original `systems/updates/puzzle.js`)

Piece taxonomy: empty · black hole · blank · X · arrow(4 dirs) · neutron star.
**Pushable:** blank, X, arrows, neutron. **Clickable:** X, arrows, neutron.
Black holes are static, neither pushable nor clickable.

- **Tap X** → removed.
- **Tap neutron star** → becomes a black hole, in place.
- **Tap arrow** → collect the contiguous run of pushables starting at the
  arrow, extending in its direction. At the first non-pushable stop cell:
  empty → the run slides one step (vacated cell at run start); black hole →
  the run slides one step and the piece entering the hole is swallowed.
  If the walk leaves the board (row-bounded horizontally, grid-bounded
  vertically) before finding a stop cell → **no-op that does NOT consume a
  tap** (original: `solution.push` only when `nChanges > 0`).
- **Budget:** each level ships `taps`; an effective tap decrements it.
- **Win:** zero pushables remain (leftover holes are fine).
- **Fail:** out of taps with pushables left · no clickables with pushables
  left ("Not clean…") · no clickable has any effect ("Stuck").

## Mechanics checklist (each M has a verify.ts check)

- **M1 X tap** — removes the piece, consumes a tap.
- **M2 neutron collapse** — becomes a hole in place; the hole then swallows.
- **M3 arrow run-slide** — contiguous run (arrow included) slides one step
  into an empty stop cell; vacated cell appears at run start.
- **M4 hole swallow** — sliding into a hole removes the entering piece; the
  hole never moves.
- **M5 blocked push** — walk off the board edge = no-op, tap NOT consumed.
- **M6 par proof** — every level solver-proven solvable within its budget.
- **M7 tight par** — every level proven UNsolvable in par−1 taps (the budget
  is load-bearing — B1's negative-proof lesson applied to move budgets).
- **M8 lose states** — out-of-taps and not-clean/stuck are detected and
  surfaced (probe + screen).
- **M9 keyboard tap model** — cursor + confirm drives the same deterministic
  input log as any key; cursor position is canonical state.
- **M10 full loop** — win advances level; fail offers retry; final win loops.

## Feel targets

- One arrow tap moving many pieces at once must read instantly (the run
  slides as a block).
- The neutron-star combo level (collapse first, sweep second) is the "aha".
- Taps-left readout always visible; the last tap that cleans the board should
  land at exactly 0 left on at least one level (tension by design).

## Determinism hazards in the original

None in the rules (pure grid rearrangement, no RNG, no clock in logic);
animation easing (`delta / 17`) is view-only → maps to hayao's cosmetic layer.

## Out of scope (B2)

Wormhole piece (type 9 — reserved/unused in shipped levels), web-monetization
bonus puzzles, swipe/wheel level navigation, the sound design, level editor.

## Scoring notes

Content parity target: ≥5 original levels teaching X → neutron → arrow-slide
→ hole-sweep → the collapse-then-sweep combo finale. Fidelity = M1–M10 green.

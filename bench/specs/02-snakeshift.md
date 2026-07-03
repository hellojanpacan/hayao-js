slug: snakeshift

# Snakeshift — a Snake variant

**Difficulty: 2/6.** Grid real-time, seeded procgen placement, one twist.

## Brief

Classic Snake on a 16×12 grid with two twists:

1. **Wrapping walls** — the snake exits one edge and re-enters the opposite
   edge; there is no boundary death.
2. **Molting** — every 4th fruit eaten, the snake sheds: its tail segment
   turns into a permanent **rock** on the tile where it was, and the snake
   shrinks by that segment. Rocks kill on contact, so the arena fills with
   your own history.

- The snake advances one tile every fixed interval (pick a beat that feels
  right; it may speed up slightly with score).
- Fruit and initial layout placement flow through `world.rng`; fruit never
  spawns on the snake or a rock.
- Win at length 14. Lose by biting yourself or hitting a rock.

## Content

One arena. Standard title / game-over overlays with restart.

## Definition of done

Everything in docs/CONVENTIONS.md "Definition of done", concretely at least:

1. `npm run check`, `npm test`, `npm run verify` all green.
2. Grid rules (movement, wrap, growth, molting, spawn) in a pure logic
   module; unit tests cover wrap-around and the molt leaving a rock behind.
3. verify.ts proves a **scripted or bot-driven winning run** to length 14
   (a simple greedy bot over the pure logic is fine — replay its moves
   through the real game) and a losing run (self-bite).
4. Fruit-spawn fairness: a test that over the winning run no fruit ever
   spawned on an occupied tile.
5. Determinism + snapshot checks pass; full-run golden hash pinned.
6. Two feel probes with tuned windows (e.g. fruit cadence — longest lull
   between score changes; input density) + a filmstrip artifact.
7. Complete loop: title → play → win/lose → restart, keyboard only.

slug: driftcatch

# Driftcatch — a falling-things arcade

**Difficulty: 4/6.** Real-time, seeded spawning, continuous movement,
lose-condition pressure, feel-tuning matters.

## Brief

You steer a basket along the bottom of the screen (left/right, continuous
movement with a little acceleration/friction so it has feel). Things fall
from the top, positions and types drawn from `world.rng`:

- **Seeds** (common) — catch for +1.
- **Golden pears** (rare) — catch for +5.
- **Thorns** — catching one costs a life. 3 lives.

Fall speed and spawn rate ramp with score. Missing a seed/pear is not
punished. Win at 40 points; lose at 0 lives.

## Content

One endless arena with the ramp. Standard overlays with restart. HUD shows
score and lives (DOM overlay, per conventions).

## Definition of done

Everything in docs/CONVENTIONS.md "Definition of done", concretely at least:

1. `npm run check`, `npm test`, `npm run verify` all green.
2. Spawn/fall/catch/scoring rules in a pure logic module; basket physics
   may live in node update code but its constants must be shared with the
   tests.
3. verify.ts proves a **bot-driven winning run** to 40 points (a bot that
   steers toward the best catchable object and away from thorns, driving
   the pure sim or the real world) and a losing run (a stationary or
   thorn-seeking null strategy reaches 0 lives).
4. **Skill-delta proof:** the steering bot's score after a fixed frame
   budget beats a null (stationary) bot's score by a margin you assert.
   If doing nothing competes with playing, the game is broken.
5. Determinism + snapshot checks pass; full-run golden hash pinned.
6. Two feel probes with tuned windows (e.g. time-to-first-catch, longest
   scoring lull under the ramp) + a filmstrip artifact reviewed for
   readability as density rises.
7. Complete loop: title → play → win/lose → restart, keyboard only.

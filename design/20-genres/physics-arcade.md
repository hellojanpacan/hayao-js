---
id: genre-physics-arcade
title: Physics Arcade
kind: genre
tags: [physics, arcade, breakout, peggle, pinball, bounce, aim, swept-collision]
summary: Trustworthy flight — aim, launch, watch a ball obey clean physics; maximal juice on one trivial input.
use-when: The design is a launch-and-watch bouncer (Breakout/Peggle/pinball): one aim, deterministic flight, spectacle on impact.
composes-with: [genre-tower-defense, system-reward-schedules, system-build-diversity, pattern-juice-choreography, pattern-risk-reward, pattern-pacing-and-tension]
anchors: [anchor-peggle, anchor-tetris, anchor-katamari]
verify-with: docs/FUN.md#19-·-physics-arcade-breakoutpeggle
---

# Physics Arcade

**What it is.** You aim one launcher, release, and a ball obeys clean, predictable
physics — bouncing off pegs, bricks, bumpers, walls — while you watch it pay off.
Input is trivial (an angle, a power); the depth is in *reading the table* and the
delight is in the cascade you set in motion.

**Player fantasy.** *"I called that shot."* The satisfaction of a bank-shot you
planned plus the slot-machine thrill of a ricochet you didn't — cause you own,
consequence the physics authors.

## Pillars

1. **Trustworthy flight.** The ball never tunnels, never teleports, never cheats.
   Swept collision (closed-form time-of-impact) makes the table *readable* — you
   can plan a bank shot because the sim will honour it.
2. **Big reward on tiny input.** One angle, maximal spectacle. The juice budget is
   the game; a plain input earns a disproportionate light-and-sound payoff.
3. **Legible table.** Every peg, bumper, and multiplier tells you what it does
   *before* you fire. The board is a puzzle you solve with an aim.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Nudge the aim; the trajectory preview updates; commit. |
| **Encounter** | One launch → a chain of bounces → clears + score, resolved and choreographed. |
| **Session** | A board (all targets) or a run of boards; ball budget as the fail clock. |
| **Meta** | Unlocked launchers/balls/perks; high-score chase; new table layouts. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-reward-schedules]] | The variable-ratio ricochet is the genre's dopamine engine; tune the payoff curve. |
| [[pattern-juice-choreography]] | Impact feedback (hitstop, particles, pitch-rising combo) *is* the product. |
| [[pattern-risk-reward]] | The greedy multiplier peg guarded behind a hard bank; last-ball pressure. |
| [[system-build-diversity]] | Optional: launchers/balls/perks that change how the table plays. |
| [[system-progression]] | Board-to-board unlocks; score thresholds that gate the next table. |

## Content & difficulty model

- **Layout is the level.** Difficulty is peg geometry, not ball speed — a tight
  cluster behind a wall, a lone multiplier in a corner. Author boards, not stats.
- **Ball budget is the fail clock.** Fewer balls, tighter clears. Grace = an extra
  ball earned by a bucket catch or a full-clear bonus.
- **Prove winnability with the aim-search bot.** Clone the world, fire candidate
  aims, count clears. This is both your "is the board beatable?" gate and a
  difficulty meter — a board only one aim clears is a spike.
- **Energy honesty is a fairness rail.** A bounce never leaves the ball faster than
  it arrived; a conservation check catches physics bugs that masquerade as
  liveliness (see FUN.md §19).
- **Ramp by geometry, then by budget.** Early boards teach one bank; later boards
  chain them and starve the ball count. The aim-search bot's clear-count per board
  is your ramp read-out — plot it, look for cliffs, smooth them.
- **Skill delta is measurable.** The planned-aim bot must clear boards a
  random-aim bot can't (FUN.md law 2). If firing blind competes with aiming, the
  table has no puzzle — the depth is fake and the juice is doing all the work.

## Signature-mechanic seeds

- **Peggle *but* every peg you leave alive fires back next turn** — the table is an
  enemy that reloads (constraint + mechanic-swap; composes [[genre-tower-defense]]).
- **Breakout *but* the paddle is gravity** — you tilt the whole table instead of
  moving a bar (perspective; the input becomes a field, not a position).
- **Pinball *but* the flippers cost mana you bank from clears** — economy on the
  twitchiest genre (mechanic-swap; composes [[system-economy]]).
- **Peggle *but* co-op, one aims and one nudges the table mid-flight** (structure;
  composes [[system-coop-and-competition]], [[genre-coop-chaos]]).
- **Breakout *but* the bricks are a deck you drafted** — layout as loadout (structure;
  composes [[genre-deckbuilder]]).

## Common pitfalls

- **Substep-and-pray collision.** Discrete steps tunnel the ball through thin walls
  at speed; the shot the player trusted fails invisibly. Use swept TOI — the table
  stops being trustworthy the first time a bank shot lies.
- **Difficulty via ball speed.** Faster balls read as *unfair*, not *harder*. Make
  it harder with geometry and budget.
- **Juice with no sim consequence.** Screen-shake on every peg dilutes the payoff;
  reserve the big choreography for multipliers and clears (the 2-senses contract).
- **RNG that isn't yours.** Deflection randomness must run through `world.rng` or
  goldens and shot-planning bots break (FUN.md law 7).
- **No breather.** A wall of trick-shot boards with no easy clear exhausts; pace a
  gimme board after a spike so the reward loop can reset (see [[pattern-pacing-and-tension]]).

## Anchors

- [[anchor-peggle]] — variable-ratio reward + maximal juice on a trivial input; the
  canonical "big payoff, tiny action" loop.
- [[anchor-tetris]] — the discipline of one perfectly-tuned verb; borrow its
  restraint, not its board.
- [[anchor-katamari]] — trustworthy contact physics escalating a single verb into
  spectacle; steal its exponential payoff curve for multiplier chains.

## Verify

Prove it against [FUN.md §19 — Physics arcade](../../docs/FUN.md#19-·-physics-arcade-breakoutpeggle):
swept-collision no-tunnel proof (24k px/s + 1px-graze-misses), energy invariant,
aim-search bot clears within the ball budget, golden run. See
[`sandboxes/physics-lab`](../../sandboxes/physics-lab) for the collision primitive
in isolation.

## Composes with

- [[genre-tower-defense]] — coverage geometry and "counter by placement" transfer
  when pegs fight back.
- [[pattern-juice-choreography]] — this genre lives or dies on impact feel.
- [[system-reward-schedules]] — the ricochet is a variable-ratio drop; tune it ethically.

## See also

- [`docs/JUICE.md`](../../docs/JUICE.md) — the feel gates for impact choreography.
- [`sandboxes/physics-lab`](../../sandboxes/physics-lab) · [`sandboxes/juice-lab`](../../sandboxes/juice-lab) — the parts, wired.

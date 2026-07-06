---
id: genre-fighting-game
title: Fighting Game
kind: genre
tags: [duel, footsies, frame-data, reads, mastery]
summary: A one-on-one duel of spacing, timing, and reads — a deep, legible frame system under a mind-game surface.
use-when: You want a high-ceiling competitive duel decided by reads and spacing.
composes-with: [anchor-street-fighter, mechanic-combo-string, system-mastery-curve, system-counter-systems]
anchors: [anchor-street-fighter]
verify-with: docs/FUN.md#4-·-action-adventure
---

# Fighting Game

**What it is.** A one-on-one **duel** at a distance, decided by who controls the
space between two characters and who reads the other first. Under the mind-game
sits a fully legible **frame system**: every move has a startup, an active
window, and a recovery you can be punished during.

**Player fantasy / why it's fun.** *"I read you."* The pull is the mental duel —
whiff-punishing a button they threw too early, calling the throw and teching it,
walking them into the corner one step at a time. Depth without hidden rolls: you
lost because you were *read*, not out-rolled.

## Pillars

1. **Neutral is the game.** The **footsies** phase — spacing, dashing in and out
   of range, baiting a button to whiff-punish it — is where matches are won.
   Combos are the reward for winning neutral, not the point of it. If your
   neutral is shallow, the whole duel is.
2. **Commitment & punish.** Every action **commits** you to recovery frames.
   Frame advantage is the currency: act and you're vulnerable until you recover;
   read the opponent's commitment and you punish it. The tension is *when do I
   press?*
3. **The strike-throw-block RPS.** Up close it collapses to a legible triangle —
   strike beats throw, throw beats block, block beats strike. That readable
   rock-paper-scissors under pressure is the mind-game surface; see
   [[system-counter-systems]].

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Read range → throw a button or bait one → win or lose the frame exchange. |
| **Encounter** | A round: win neutral, land a hit, convert to a combo, reset to neutral. |
| **Session** | A set (best-of-N): adapt to *this* opponent's habits, punish their patterns. |
| **Meta** | Learn the cast's frame data, matchup knowledge, your own execution ceiling. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-counter-systems]] | The strike-throw-block RPS and every soft/hard counter — the readable triangle that IS the mind-game. |
| [[system-mastery-curve]] | The skill ceiling: neutral reads, spacing, adaptation. A high floor is fine; a high *ceiling* is the genre. |
| [[system-combat-model]] | The frame system itself — startup/active/recovery, hitboxes, advantage on block. Deterministic, legible. |
| [[system-telegraphs]] | Startup frames and animation tells ARE the telegraph; a move you can't see coming is unfair. |
| [[system-onboarding]] | Bridging the execution gap so the mind-game isn't gated behind fingers (the trap — see pitfalls). |

## Content & difficulty model

- **Content is the roster + the matchup lattice.** Each character is a moveset
  with distinct ranges, speeds, and win conditions; depth comes from the *cross
  product* of matchups, not the count of characters. See [[system-unit-rosters]].
- **Difficulty is the opponent, not a knob.** The AI ladder ramps by playing
  smarter neutral and tighter punishes — not by gaining hidden frames or damage.
  A "difficult" CPU that cheats frame data violates the genre's honesty.
- **Every move proven in isolation.** Startup, active, and recovery are data;
  each interaction (does X beat Y on wakeup?) is a test before the cast combines.
  Derive frame outcomes, don't vibe them.
- **Determinism is the referee.** Same inputs, same frame → same result, always.
  Route randomness through a deterministic RNG only for cosmetic flourish, never
  for a hit that connects. A "miss" the player couldn't foresee is a betrayal.
- **Combos gate on execution; wins gate on reads.** Keep the required execution
  to convert a hit *low* so the mind-game — not the muscle memory — decides the
  match. This is the genre's central design lever.

## Signature-mechanic seeds

- **Fighter but no stick** *(constraint)* — Divekick-style: two buttons and no
  directional stick — one jumps and dives, one kicks; 100% of the depth is
  spacing and reads. Strips the execution barrier to zero and leaves pure
  neutral. The cleanest way to prove the mind-game is the game.
- **Fighting game but simultaneous-turn, resolved after commit**
  *(mechanic-swap)* — both players lock a move blind, then the frame exchange
  resolves; a duel of pure prediction with no execution at all. Bridges the
  read-heavy honesty of [[genre-tactics]] onto the strike-throw-block triangle.
- **Fighter but the stage is the third character** *(theme + mechanic-swap)* —
  a Kentō courtyard whose hazards, wind, and shifting floor edit both fighters'
  ranges each round; positioning gains a second axis. Pairs
  [[system-hazards-and-environment]].
- **Fighter but health is shared and shrinking** *(structure)* — one bar between
  you; every hit is a tug-of-war over the same pool, and time pressure forces
  commitment. Reframes turtling as a losing strategy structurally.
- **Fighter but you draft your normals between rounds** *(structure)* — a
  deckbuilt moveset assembled from a shared pool mid-set; matchup knowledge
  becomes live adaptation. Bridges [[genre-deckbuilder]].

## Common pitfalls

- **Execution gates the mind-game.** The genre's signature trap: a one-frame
  link or a quarter-circle motion stands between the player and the *actual*
  game (neutral and reads). If the fingers fail, the mind never gets to play.
  Lower the execution floor — see [[antipattern-input-lie]] and
  [[system-onboarding]].
- **Input lie.** A dropped combo the player *did* input right, or a move that
  came out on a lenient buffer they didn't mean — the display and the sim
  disagree. Fatal in a game about precise commitment. [[antipattern-input-lie]].
- **A solved metagame.** One character or one setup dominates and the RPS
  collapses to a single winning option. Once neutral has a right answer, the
  mind-game is dead. [[antipattern-solved-metagame]].
- **Unreadable startup.** A move with no telegraph, or a "mixup" the defender
  cannot react to *and* cannot guess, is a coin flip, not a read.
  [[antipattern-guess-the-designer]] / [[pattern-readability]].
- **Ceiling without a floor.** All ceiling and no on-ramp is a wall, not a curve.
  A new player must land *a* punish in their first session. [[antipattern-difficulty-cliff]].

## Anchors

- [[anchor-street-fighter]] — the definitive reference: footsies, frame
  advantage, and the strike-throw-block triangle. Steal the neutral vocabulary
  and the legibility of its frame data; leave the six-button execution barrier
  where it doesn't serve the read.

## Verify

Prove it in **[FUN.md §4 · Action-adventure](../../docs/FUN.md#4-·-action-adventure)**:
same-input/same-frame determinism, each move's startup/active/recovery asserted
as data, the strike-throw-block interactions proven in isolation, and a
golden round replaying from an input log to an identical end-state.

## Composes with

- [[anchor-street-fighter]] — the footsies-and-frame-data model to steal wholesale.
- [[mechanic-combo-string]] — the reward for winning neutral; keep its execution
  floor low so reads, not fingers, decide.
- [[system-mastery-curve]] — the high ceiling that is the point of the genre.
- [[system-counter-systems]] — the readable RPS triangle under the mind-game.

## See also

- [`examples/sokoban`](../../examples/sokoban) — the pure `Puzzle<State,Move>`
  logic/view split and clone-and-score bot; a frame exchange resolved from data
  is the same deterministic shape.
- [`sandboxes/physics-lab`](../../sandboxes/physics-lab) — hitbox/hurtbox overlap
  and knockback in isolation before the cast combines.

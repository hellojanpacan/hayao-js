---
id: system-counter-systems
title: Counter Systems — the duel matrix
kind: system
tags: [counters, rock-paper-scissors, matchup, duel, near-hard, balance]
summary: Rock-paper-scissors with teeth — NEAR-HARD counters that stay decisive under scaling, so the answer to a threat is a choice, not a bigger number.
use-when: You have unit types, weapons, or tools that should beat each other, and you need the matchups to actually matter.
composes-with: [system-unit-rosters, system-faction-asymmetry, system-build-diversity, system-combat-model, system-status-effects]
anchors: [anchor-starcraft, anchor-age-of-empires]
verify-with: design/FUN.md#8-tower-defense
---

# Counter Systems — the duel matrix

**What it is.** The **matchup table**: the rule that pikes beat cavalry, air beats
ground, fire beats ice. A counter system makes the *right tool* a decision instead
of the *bigger stack* — it's what turns [[system-unit-rosters]] and
[[system-faction-asymmetry]] into a game of composition rather than accumulation.

**Player fantasy / why it's fun.** "I read your army and I built the answer." A
counter is a puzzle you solve with production, not reflexes — scouting, reacting,
and the small triumph of the hard counter arriving just in time.

## When to use / when NOT

| Use counters when… | Skip when… |
|---|---|
| Multiple unit/weapon types coexist | There's one avatar and one attack |
| Composition should beat brute force | The fun is execution, not selection |
| Factions/rosters need internal tension | You have < 3 types (no matrix to speak of) |

## Variants

| Shape | Counter strength | Anchor | Note |
|---|---|---|---|
| **Hard RPS** | A auto-beats B | fighting games, some RTS | decisive, can feel arbitrary |
| **Near-hard** | A *strongly* favored vs B | [[anchor-starcraft]], [[anchor-age-of-empires]] | the sweet spot — see below |
| **Soft resist** | A takes ~15% less from B | many RPGs | **erased by scaling** — avoid as the whole system |
| **Tag / type** | fire > ice > … cyclic | Pokémon | legible, teachable |
| **Positional** | flank/backstab/height | tactics | counter is *where*, not *what* |

## The near-hard doctrine

FUN.md §8/§9 is blunt: **soft resists get erased by count-scaling.** A 15% resist
vanishes the moment the player fields ten of the resisting unit — the matchup stops
mattering, and the "counter" is decorative. Counters must be **near-hard**: strong
enough that the *right* unit meaningfully wins the duel even before you out-mass.

The design target is a duel you can prove:

> The counter unit wins its NvN duel at equal or lower cost; the countered unit,
> even with a *bigger budget*, loses it. (FUN.md §8: "mono build with a bigger
> budget fails; mixed build survives.")

Near-hard, not *hard*, because a pure auto-win removes the micro/positioning layer —
you want "strongly favored, still winnable with skill," not "the fight is decided
by the build screen."

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Counter multiplier** | how much the favored unit wins by | near-hard: the duel flips outcome, not just shaves HP |
| **Matrix density** | how many pairs have a counter | every unit both counters and is countered — no pure winner |
| **Reveal cost** | how hard to scout the enemy comp | information *is* the counter game; make scouting real |
| **Reaction lead time** | build-time to answer a threat | long enough to punish greed, short enough to recover |
| **Cyclicity** | RPS loop closes (no dominant) | assert no unit sits outside all counters |

## How it wires to Hayao

- **The duel is the test.** Pure state + `world.rng` means you clone the world, run
  an NvN fight, and read the result (FUN.md law 7). Assert each counter edge wins its
  duel from *both sides* (FUN.md §8/§9). RTS-lite exports arrival/tolerance constants
  as API so the test shares the sim's constants (FUN.md §9).
- **Coverage is geometry** for ranged counters — range × distance-to-lane = the
  fire-window chord (FUN.md §8). Draw the ring; it's the genre's key UI.
- **Mass pathing** for RTS counters uses cached flow fields (one BFS per goal,
  *outside* state) — see [[system-unit-rosters]] and FUN.md §9. Grep [`docs/API.md`](../../docs/API.md)
  for `astarGrid`/`floodFill` before citing a pathing call.
- Reference: FUN.md §9 RTS-lite (counter-edge NvN duels) and §8 tower-defense
  (mixed beats mono).

## Fails when…

- **Soft resists only.** Scaling erases them; the "counter system" evaporates by
  midgame (the canonical §8/§9 failure).
- **A dominant unit.** One type outside the RPS loop becomes the answer to
  everything — [[system-build-diversity]] and the whole matrix collapse.
- **Invisible matchups.** Counters the player can't scout or read are just
  memorization tax. Surface the matrix (a range ring, a type icon).
- **Hard auto-wins everywhere.** Removes micro — the fight is settled off-screen.
  Aim near-hard, keep a skill margin.

## Verify

- **[FUN.md §8](../FUN.md)** — mixed build survives 10/10; mono build (bigger
  budget) fails; bare lane falls early; counter duels from both sides.
- **[FUN.md §9](../FUN.md)** — every counter edge wins its NvN duel; the
  intended composition beats attack-move.
- **[FUN.md law 2](../FUN.md)** — the countering strategy beats the null (mono)
  strategy by a margin.
- Determinism: golden hash of a scripted duel set.

## Composes with

- [[system-unit-rosters]] — the roster is the set of pieces the matrix connects.
- [[system-faction-asymmetry]] — factions counter *across* the mirror, not just within.
- [[system-build-diversity]] — near-hard counters are what keep multiple builds alive.
- [[system-status-effects]] — cleanse/resist/immunity are the status-layer counters.

## See also

- [`design/FUN.md`](../FUN.md) §8, §9 — the duel-from-both-sides proofs.
- [[anchor-starcraft]] — three rosters, near-hard counters, one balance.
- [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo) — `astarGrid`/`floodFill` for mass counters.

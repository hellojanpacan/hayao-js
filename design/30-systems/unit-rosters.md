---
id: system-unit-rosters
title: Unit Rosters — a legible roster
kind: system
tags: [units, roster, roles, tiers, diversity, rts, redundancy]
summary: A roster of units whose roles are legible and distinct — every unit earns its slot, overlap is intentional, and redundancy is culled.
use-when: You have a set of units/troops/pieces the player commands and need each to have a clear, non-redundant job.
composes-with: [system-counter-systems, system-faction-asymmetry, system-enemy-archetypes, system-combat-model, system-tech-tree]
anchors: [anchor-starcraft, anchor-age-of-empires]
verify-with: docs/FUN.md#9-rts-lite
---

# Unit Rosters — a legible roster

**What it is.** The **cast of pieces** the player fields — the units of an RTS, the
troops of an auto-battler, the summons of a tactics game — organized so every one has
a *readable job* and *earns its slot*. A roster is the vocabulary that
[[system-counter-systems]] connects and [[system-faction-asymmetry]] differentiates.

**Player fantasy / why it's fun.** "I know exactly what each of these does, and I'm
choosing the right mix." A legible roster makes composition a pleasure — you read
the enemy, pick your answer, and the units do what their silhouette promised.

## When to use / when NOT

| Use a designed roster when… | Skip when… |
|---|---|
| Player fields multiple unit types | One avatar / one active unit |
| Composition is a decision | Units are just reskinned HP bars |
| Counters/tech/factions need pieces | The "roster" is enemies only ([[system-enemy-archetypes]]) |

## The role alphabet

Most rosters are built from a small set of **functional roles**. Legibility comes
from each unit reading as *one* role, not a blur of three.

| Role | Job | Reads as |
|---|---|---|
| **Frontline / tank** | absorb, hold the line | big, slow, tough |
| **DPS / line** | deal the damage | mid, fragile-ish |
| **Skirmisher** | fast, harass, flank | small, quick, hits-and-runs |
| **Artillery / siege** | range, area, anti-clump | long range, slow, glass |
| **Support** | heal/buff/detect | non-combat, force-multiplier |
| **Specialist** | one job (anti-air, cloak, transport) | the answer to a specific threat |

A roster is *legible* when a new player can name each unit's role from its
silhouette and speed alone — the [[pattern-readability]] test applied to the army.

## Tiers vs. sidegrades

| Structure | What it is | Watch for |
|---|---|---|
| **Tiers** | later units strictly stronger (T1→T3) | early units become dead weight — give them a lasting niche (cost, speed) |
| **Sidegrades** | same tier, different role, no strict winner | the healthiest for diversity |
| **Tech gates** | roster unlocks via [[system-tech-tree]] | pace the reveal; no unlock deserts (FUN.md §14 logic) |

Prefer sidegrades within a tier and *role* differences across tiers. A pure linear
tier ladder quietly kills half the roster.

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Roster size** | how many units | enough for a matrix, few enough to hold in the head (~6–12 per side) |
| **Role coverage** | each role represented | no gap the counter-matrix needs filled |
| **Overlap** | two units, similar job | intentional (a cheap and a premium tank) — not accidental |
| **Cost curve** | resource/time per unit | maps to power; no unit both cheapest and best |
| **Skill expression** | micro reward per unit | some reward control (skirmishers), some don't (tanks) |

## Overlap vs. redundancy — the culling rule

- **Overlap** is two units doing a similar job *for a reason*: a cheap disposable
  tank and an expensive durable one give the player a real cost/quality choice.
- **Redundancy** is two units doing the same job with no distinguishing decision —
  one strictly dominates or they're interchangeable. **Cull it.** Every unit must
  answer "when would I build *this* over its neighbor?" If it can't, merge or cut.

The test: remove a unit. If no strategy got weaker, it was redundant.

## How it wires to Hayao

- **Roles are proven by duels.** Pure state + `world.rng` → clone the world, run the
  unit in its intended matchup, read the result (FUN.md law 7). Assert the tank
  *tanks* and the counter unit *counters* (FUN.md §9 NvN edges).
- **Mass command needs flow fields** — one BFS per goal tile, cached outside
  `world.state`, gives the whole roster wall-aware pathing (FUN.md §9). Grep
  [`docs/API.md`](../../docs/API.md) for `astarGrid`/`floodFill` before citing.
- **Export behavioural tolerances** (arrival radius, aggro range) as API so tests
  share the sim's constants (FUN.md §9) — the roster's numbers live in one place.
- **Redundancy is a lint.** The "remove-a-unit, did any strategy weaken?" check is a
  skill-delta test (FUN.md law 2) you can script.

## Fails when…

- **Silhouette lies.** A "tank" that dies fast, a "skirmisher" that's slow — the read
  breaks and composition becomes memorization ([[pattern-readability]]).
- **Redundant units.** Dead slots the player never builds; the roster looks bigger
  than it plays.
- **A dominant unit.** One piece answers everything — the roster collapses to a spam
  ([[system-build-diversity]] and [[system-counter-systems]] both die).
- **Tier rot.** Early units strictly obsolete by mid-game, so half the cast is a
  museum. Give each a lasting niche.

## Verify

- **[FUN.md §9](../../docs/FUN.md)** — every counter edge wins its NvN duel; commander
  bot wins; walled units route around; ms/step at peak.
- **[FUN.md law 2](../../docs/FUN.md)** — the redundancy lint: removing a unit weakens
  some strategy; a mixed roster beats a mono spam.
- Determinism: golden hash of a scripted battle across the roster.

## Composes with

- [[system-counter-systems]] — the matrix that connects the pieces into decisions.
- [[system-faction-asymmetry]] — each faction is a distinct roster over shared roles.
- [[system-enemy-archetypes]] — the enemy-side vocabulary; rosters and archetypes rhyme.
- [[system-tech-tree]] — how the roster reveals over a match.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §9 — mass under command; duels as the balance test.
- [[anchor-starcraft]], [[anchor-age-of-empires]] — legible rosters with role clarity.
- [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo) — the pathing the roster shares.

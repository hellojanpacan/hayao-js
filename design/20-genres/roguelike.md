---
id: genre-roguelike
title: Roguelike
kind: genre
tags: [roguelike, procgen, permadeath, runs, connectivity, discovery, turn-based]
summary: Fair discovery through procedural dungeons that always connect and turns that always replay — variance as content, not chaos.
use-when: You want run-based exploration where each seed is a fresh, fair puzzle and death is the loop.
composes-with: [system-procgen-design, system-meta-progression, system-session-structure, system-enemy-archetypes, system-save-and-checkpoint]
anchors: [anchor-nuclear-throne, anchor-dead-cells]
verify-with: docs/FUN.md#10--traditional-roguelike
---

# Roguelike

**What it is.** A run-based game of **procedural dungeons** and **permadeath**.
Each seed generates a fresh, connected world; you descend, adapt to what you're
dealt, and die — then run again, wiser. Variance is the content: no two runs are
the same, and every one is fair.

**Player fantasy / why it's fun.** *"I read this seed's hand and played it
well."* The pull is fair discovery — surprise that never feels cheated, mastery
of a system rather than a memorised map, and the "one more run" that a fresh
seed always promises.

## Pillars

1. **Fairness ≈ connectivity.** Procgen that *always connects* — stairs and all
   loot reachable — is the floor. Prove it across ~50 seeds *before* tuning any
   number. An unreachable objective is the genre's cardinal sin.
2. **Turns that always replay.** Deterministic, seeded, turn-based: input edge =
   one world step. Pure-data state makes runs reproducible and bots possible —
   the sim is its own proof engine.
3. **Discovery, not memorisation.** The challenge is reading *this* seed's
   items, enemies, and layout — a systemic mastery that transfers across seeds,
   not a memorised route.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | One turn: read the tactical situation → the move that reads it best → the world steps. |
| **Encounter** | A room/fight: positioning, resources, and item synergies vs an archetype mix. |
| **Session** | A run: descend floors, build from what drops, push your luck deeper, die or win. |
| **Meta** | Between runs — unlocks, new items in the pool, knowledge of the systems. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-procgen-design]] | The engine of the genre — seeds, connectivity, variance-as-content, controlled randomness. |
| [[system-meta-progression]] | The between-run pull; unlocks that add *options*, ideally, over raw power. |
| [[system-session-structure]] | Run length and shape; floor count, descent pacing, the win condition. |
| [[system-enemy-archetypes]] | The threat alphabet each room composes from — readable, beatable minds. |
| [[system-save-and-checkpoint]] | Respecting time under permadeath: save-and-quit, run history, retry friction. |

## Content & difficulty model

- **Content is the pool + the generator.** Author items, enemies, and room
  templates; the generator combines them. Depth comes from *interactions* in the
  pool, not from more rooms.
- **Difficulty ramps by depth.** Deeper floors mix nastier archetypes and
  tighter resources. The generator scales the mix, not a global HP multiplier.
- **Variance with guardrails.** Seed the RNG; clamp the range so a run is never
  DOA (no floor with zero healing available). Prove winnability with
  full-knowledge bots — they show a *line exists*, which is the honest claim for
  procgen (not that a human will find it).
- **Meta adds options, not a floor of power.** Guard against the run being
  decided at the menu; unlocks should widen the pool, not trivialise it. See
  [[system-meta-progression]].

## Signature-mechanic seeds

- **Roguelike but the dungeon is a language you edit** *(mechanic-swap)* — Baba-
  style rule tiles you rearrange between floors; the systemic mastery becomes
  literal. Pairs [[anchor-baba-is-you]].
- **Roguelike but every death leaves a corpse that persists** *(structure)* —
  Nemesis-lite memory across runs; past selves become this run's threats. Pairs
  [[system-emergent-systems]].
- **Roguelike but you see the whole seed once, then it's dark** *(constraint)* —
  a memory/planning roguelike; the discovery is front-loaded.
- **Roguelike but turns cost light** *(theme + constraint)* — a Kentō lantern
  descent; every step spends a finite glow, making exploration a resource.
- **Roguelike but two heroes on one seed, alternating turns** *(perspective)* —
  co-op descent; connectivity must serve two paths.

## Common pitfalls

- **Unreachable objectives.** A seed where stairs or required loot are walled off
  is unshippable. Connectivity sweep, always, first.
- **Memorisation over mastery.** If the "best" play is learning fixed seeds, the
  procgen is decorative. Variance must matter.
- **Meta decides the run.** If a menu unlock makes runs trivial, discovery dies.
  Options over power.
- **Variance that punishes randomly.** A seed with no healing or an unwinnable
  drop feels cheated. Clamp the generator's worst case.

## Anchors

- [[anchor-nuclear-throne]] — the tight run-based mastery loop; steal its
  legible enemies and instant-restart momentum.
- [[anchor-dead-cells]] — the roguelite structure of permanent unlocks over
  impermanent runs; steal its meta-progression shape.

## Verify

Prove it in **[FUN.md §10 · Traditional
roguelike](../../docs/FUN.md#10--traditional-roguelike)**: seeded
reproducibility, a connectivity sweep, a full-knowledge bot wins 10/10 random
seeds, and turn-log replay determinism.

## Composes with

- [[system-procgen-design]] — the connectivity-proven generator at the core.
- [[system-meta-progression]] — the between-run hook that keeps runs coming.
- [[system-enemy-archetypes]] — the threat alphabet each seed spells with.

## See also

- [`sandboxes/procgen-lab`](../../sandboxes/procgen-lab) — seeded generation and
  connectivity wiring in isolation.
- [`examples/sokoban`](../../examples/sokoban) — the pure `Puzzle<State,Move>`
  logic/view split; a roguelike turn is the same shape at scale.

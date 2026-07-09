---
id: system-procgen-design
title: Procedural Generation Design
kind: system
tags: [procgen, seeds, runs, variance, connectivity, controlled-randomness, generation, replayability]
summary: Runs, seeds, and variance as content — controlled randomness that always connects, proven before you tune a single number.
use-when: A design needs replayable, generated content (levels, dungeons, decks) instead of hand-authored maps.
composes-with: [system-session-structure, system-encounter-design, system-save-and-checkpoint, genre-roguelike]
anchors: [anchor-dead-cells, anchor-slay-the-spire]
verify-with: design/FUN.md#10-traditional-roguelike
---

# Procedural Generation Design

**What it is.** Generating content from a **seed** instead of authoring it by
hand — so a run is a *fresh, reproducible* configuration of known parts. Procgen
turns "an agent hand-authors forty balanced rooms" (unreliable) into "an agent
calls a generator and gets forty *proven* rooms" (reliable). The design work is
choosing the **parts, the constraints, and the acceptance test** — not rolling
dice and hoping.

**Player fantasy / why it's fun.** *This run is mine.* Variance means the next run
surprises you; a seed means it's fair, not arbitrary. The pull is **discovery
under fairness** — every layout is new, but every layout is winnable (FUN.md §10).

## When to use / when NOT

| Use it when | Author by hand when |
|---|---|
| Replayability is the point (roguelike, survivors) | A crafted narrative sequence — procgen dilutes intent |
| Content *volume* exceeds what you can hand-build | A handful of set-piece bosses ([[system-boss-design]]) |
| You want a difficulty *band*, not fixed levels | Tutorial rooms — those teach a *specific* verb ([[system-onboarding]]) |

> **Connectivity first, numbers later.** The single most common procgen failure is
> an unreachable stair, item, or exit. Prove reachability across ~50 seeds *before*
> you tune a single difficulty value (FUN.md §10). A generator that can produce an
> unwinnable layout is a generator that *will*.

## Variants

| Variant | Generates | Grounded in Hayao |
|---|---|---|
| **Cellular cave** | organic open spaces | `generateCave(rng, opts)` (grep `docs/API.md`) |
| **Room-and-corridor dungeon** | connected rooms | `generateDungeon(rng, opts)` |
| **Solver-verified puzzle set** | in-band winnable levels | `generateLevels(factory, opts)` |
| **Grammar / template assembly** | rooms from hand-made chunks | your factory over `world.rng` |
| **Deck / drop draft** | reward pools | `pickEntry` / `weightedPick(rng, …)` |
| **Noise / distribution** | terrain, placement fields | `valueNoise` / `hashNoise` (stateless) |

## Tuning levers

| Lever | Turns up… | Watch for |
|---|---|---|
| **Fill % / smoothing** (caves) | openness vs. maze-ness | over-smoothing erases variety ([`sandboxes/procgen-lab`](../../sandboxes/procgen-lab/)) |
| **Difficulty band** | which candidates are kept | a band too narrow starves the generator (accept-rate) |
| **Variance budget** | how different runs are | too much = incoherent; too little = same run twice |
| **Reject hook** | genre rules a candidate must pass | the place to enforce "no start-adjacent goal" |
| **Dedupe key** | how near-identical layouts collapse | without it, two seeds ship the same map |

## How it wires to Hayao

- **The generator is solver-backed.** `generateLevels(factory, {count, minDepth,
  maxDepth, minNodes, maxNodes, reject, dedupeKey})` builds a candidate from a
  seeded `factory(rng) → Puzzle`, *solves* it, and keeps only the winnable ones
  in-band. Every kept level carries the sub-seed that reproduces it exactly — so
  the campaign that ships is **data (a list of seeds), not forty hand-written
  maps** ([`src/content/generate.ts`](../../src/content/generate.ts)).
  `generateLevelsReport` surfaces the accept-rate and difficulty spread.
  `levelFromSeed(factory, seed)` rebuilds any one level from its seed.
- **Determinism is structural.** All randomness flows through `world.rng`;
  sub-seeds derive from `hashString`, never wall-clock or `Math.random` — the same
  `(seed, count, band, factory)` yields the same set on every machine (CLAUDE.md
  invariant 2; FUN.md law 7).
- **Connectivity is a lint.** `connectedComponents` / `reachableRegions` /
  `astarGrid` (grep `docs/API.md`) prove stairs + all loot + exits reachable across
  a seed sweep before any tuning.
- **Learn the primitive alone:** [`sandboxes/procgen-lab`](../../sandboxes/procgen-lab/)
  — `generateCave`, `valueNoise`, `autotileToCommands` with re-rollable seed, fill
  %, smoothing passes. One mechanic, no genre.

## Fails when…

- **Unreachable content.** A stair, key, or exit behind an unbroken wall = an
  unwinnable seed. The connectivity sweep catches it; skip the sweep and players
  find it for you (FUN.md §10).
- **Tuning before connectivity.** Balancing numbers on a generator that still
  produces dead layouts wastes both passes.
- **Wall-clock / Math.random inside generation.** Breaks reproducibility — a seed
  no longer names a run, and goldens rot.
- **Variance for its own sake.** Randomness with no floor of *quality* produces
  slop; the acceptance test is what makes variance content.
- **Same-map collapse.** No dedupe key and distinct seeds ship identical layouts.

## Verify

- **Connectivity sweep first:** stairs + all loot reachable across ~50 seeds
  ([FUN.md §10](../FUN.md#10-traditional-roguelike)).
- **Winnability, not experience:** a full-knowledge bot wins 10/10 random seeds —
  that proves *a line exists*, the right claim for procgen (FUN.md §10).
- **Seeded reproducibility:** the same seed yields the same layout + a hash-identical
  turn-log replay (FUN.md law 7).
- **In-band difficulty:** `generateLevelsReport` shows kept levels land inside the
  target band; assert the ramp with `rampIssues`.

## Composes with

- [[system-session-structure]] — a seed defines one run; the run is the session container.
- [[system-encounter-design]] — generated rooms still need pockets and clear exits.
- [[system-save-and-checkpoint]] — a run resumes from `(seed, tuning, snapshot)`.
- [[genre-roguelike]] — the genre whose fairness *is* procgen connectivity.
- [[pattern-emergence]] — variance across systems is where generated stories come from.

## See also

- [`src/content/generate.ts`](../../src/content/generate.ts) — solver-backed level generation.
- [`sandboxes/procgen-lab`](../../sandboxes/procgen-lab/) — the generation primitives alone.
- [`design/FUN.md` §10](../FUN.md#10-traditional-roguelike) — connectivity-first fairness.
- [[anchor-dead-cells]] · [[anchor-slay-the-spire]] — procgen as the shape of a run.

---
id: anchor-factorio
title: Factorio
kind: anchor
tags: [automation, logistics, factory, throughput, optimization, scaling, engineering]
summary: Automation/logistics sim where the factory itself is the toy — you build the machine that builds, and the fun is untangling throughput bottlenecks that scale forever.
use-when: The intent is a systems/optimization game about building processes rather than acting them out; the player designs, the machine executes.
composes-with: [genre-incremental, system-resource-loops, system-crafting, system-tech-tree, system-emergent-systems]
anchors: []
verify-with: docs/FUN.md#14-incrementalidle
---

# Factorio

**What it is.** A game about building the machine that plays the game. You
hand-craft the first few items, then **automate** their production, then automate
the automation — until you're not moving resources, you're *designing the system
that moves them*. The factory is the toy; the fun is diagnosing and fixing
**bottlenecks** in a process you built.

**Player fantasy.** The engineer's high: a mess of belts becomes a legible,
humming machine because *you* untangled it. Every problem is one you created by
succeeding — demand outgrew supply — and every fix is a small act of design you
get to admire running on its own.

## Design DNA

The core verb isn't *do*, it's **automate** — replace your own labour with a
standing process, then find the constraint the new scale exposed. Factorio is an
**incremental** at heart ([[genre-incremental]]) but you build the production
curve by hand instead of buying it. The loop is self-fueling: solving one
bottleneck raises throughput until a *downstream* stage becomes the new
bottleneck. The factory is a second-order machine — you don't place outcomes, you
place rules, and the outcomes **emerge** ([[pattern-emergence]]).

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Automate-your-own-labour** | The verb is building a process, not performing it; mastery is designing systems, not reflexes. |
| **Throughput bottlenecks** | Every solved constraint reveals the next one downstream — an endless, self-generated problem queue. → [[system-resource-loops]]. |
| **Deep crafting chains** | Ore→plate→gear→belt→machine; each tier consumes the last, so scaling one forces scaling all. → [[system-crafting]]. |
| **Ratios & balancing** | The optimisation meat: N miners feed M smelters feed K assemblers. Legible math with infinite depth. |
| **Tech tree funded by production** | Research consumes your output, so teching *is* a sink that pressures throughput. → [[system-tech-tree]]. |
| **Spatial logistics** | Belts/pipes make routing a physical, visible puzzle — the factory's shape *is* its performance. |
| **Emergent complexity from few parts** | A handful of primitives (belt, inserter, assembler) compose into unbounded designs. → [[pattern-emergence]]. |

## What to steal

- The **automate-then-optimise loop**: give the player a verb, then let them
  *replace themselves* at it. The game becomes about designing, not grinding.
- **Self-generated bottlenecks**: never hand the player a task list; let success
  create the next problem. The best difficulty curve is one the player builds.
- **Legible ratios**: expose the math (this feeds that at rate R) so optimisation
  is *knowable*, not guesswork. Mastery = reading the machine.
- **Deep chains as pacing**: each crafting tier is a natural session/era boundary,
  the way [[genre-incremental]] uses eras — no unlock deserts (FUN.md §14).

## What's just theme (drop it)

- The **alien-planet/pollution fiction** — flavour. The loop is medium-agnostic:
  a kitchen, a bank, a bloodstream, a bureaucracy all work.
- **Combat / biters** — a pressure valve bolted on; many great automation games
  ship without it. Cut it until the factory is fun alone.
- **3D/real-time-continuous** — belts can tick discretely. The sim is pure state
  over throughput; the presentation is [[pattern-juice-choreography]] on top.
- **Literal belts** — spatial routing is one expression of "connect producers to
  consumers." Graph/abstract layouts carry the same puzzle.

## Composes into

- [[genre-incremental]] — the parent loop (production curve, no deserts), except
  the player *builds* the curve.
- [[system-resource-loops]] — the gather→convert→spend chains and their
  bottlenecks are the whole game.
- [[system-crafting]] — recipe chains with combinatorial depth.
- [[system-tech-tree]] — research as the throughput sink that keeps you scaling.
- [[pattern-emergence]] — few primitives, unbounded designs; the second-order toy.

## Twist seams

- **Factorio but on a run timer** *(structure)* — roguelite: each run is a fresh
  map and a scoring throughput target; blueprints are your meta-progression.
  Pairs with [[system-meta-progression]].
- **Factorio but you route grief, not iron** *(theme + tonal)* — an emotional or
  bureaucratic "factory" where the resource is something human; the bend
  recolours every belt. See [[process-the-twist]].
- **Factorio but one screen, one machine** *(constraint)* — no sprawl; optimise a
  single fixed footprint, puzzle-tight. Pairs with [[genre-grid-puzzle]].
- **Factorio but two players share one factory** *(perspective)* — coop where the
  bottleneck is *communication* about who owns which subsystem. Pairs with
  [[genre-coop-chaos]].

## See also

- [`docs/FUN.md#14-incrementalidle`](../../docs/FUN.md) — payback ratios flat
  across tiers; UI intent is an action; no unlock deserts; balance-sim the arc.
- [`sandboxes/procgen-lab`](../../sandboxes/procgen-lab) — resource-field
  generation for map variety.
- [[genre-incremental]] · [[system-resource-loops]] · [[system-crafting]].

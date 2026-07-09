---
id: system-resource-loops
title: Resource Loops — Gather → Convert → Spend
kind: system
tags: [resource-loops, gather, convert, spend, bottleneck, production, pacing, chains]
summary: The gather→convert→spend cycle that structures effort; bottlenecks placed on purpose are the pacing, not a bug.
use-when: The game asks the player to turn raw inputs into refined outputs into results, and you need the chain to breathe rather than stall or trivialize.
composes-with: [system-economy, system-crafting, system-tech-tree, system-progression]
anchors: [anchor-factorio, anchor-stardew-valley]
verify-with: design/FUN.md#14-incrementalidle
---

# Resource Loops — Gather → Convert → Spend

**What it is.** The **cycle** at the heart of production games: *gather* a raw
resource, *convert* it into something more useful, *spend* the result on progress —
which unlocks better gathering, and the loop turns again, wider. The design work
is deciding where the loop **narrows** — the bottleneck the player must solve.

**Player fantasy / why it's fun.** "I built the pipeline that makes the thing that
makes me stronger." Each loop closed is a small system mastered. The pull is the
*next* bottleneck — the one resource you don't have enough of yet.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Progress runs through *making*, not just buying | The game has no crafting/production layer |
| You want pacing to emerge from bottlenecks, not timers | A flat currency ([[system-economy]]) already carries it |
| Chains of resources create planning/optimization depth | Extra steps would be busywork with no decision |

A resource loop is **[[system-economy]]** with *structure*: instead of one bucket,
a directed chain where each node's output feeds the next. Use it when the *shape*
of the chain — what feeds what — is itself a puzzle.

## Variants

| Variant | Shape | Depth from | Example |
|---|---|---|---|
| **Linear chain** | A → B → C → goal | Clear ramp; one bottleneck at a time | Stardew crops → artisan goods → cash |
| **Branching tree** | One input, many outputs | Prioritisation | Factorio iron → plates/gears/etc |
| **Converging web** | Many inputs, one output | Logistics puzzle | Factorio science packs |
| **Cyclic (renewable)** | Output feeds back to input | Sustainable scaling | Seeds from crops; power → mining → power |
| **Sink loop** | Convert → spend → gone | Pacing pressure | Fuel: gather → burn → gather (survival) |

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Bottleneck placement** | *Where* the player feels scarcity | One clear binding constraint at a time — that's the current puzzle |
| **Conversion ratio** | Inputs per output | Legible (2:1, 5:1), not 7.3:1 mystery math |
| **Chain length** | Steps from raw to result | Long enough to plan, short enough to hold in head; add steps as content, not on day one |
| **Throughput vs storage** | Flow rate vs stockpile | Flow-limited = active play; storage-limited = idle waiting |
| **Renewability** | Whether a resource runs out | Renewable = sustainable; finite = a clock ([[system-economy]] inflation) |
| **Parallel loops** | How many run at once | More loops = more to juggle; ramp the count |

The bottleneck **is** the pacing. A loop with no binding constraint is a firehose —
nothing to optimise. A loop with a *permanent* bottleneck is a wall. Good design
*moves* the bottleneck: solve iron, now you're copper-limited, now power-limited.
Each move is a fresh puzzle — the same "no deserts, no walls" discipline as an
economy's pacing window (**[[FUN.md §14]]**).

## How it wires to Hayao

- **The chain is data.** Resource counts and converter states live in
  `world.state`; each gather/convert/spend is an **input action**, so the whole
  production run replays and hashes (**[[FUN.md §14]]**, law 7).
- **Pacing is provable.** Balance-sim the loop with a bot that plays it out, then
  assert *monotone production* and *no bottleneck desert* — the exact incremental
  verify. The farming truth applies too: surface the player-critical number ("N
  iron short") the way farming surfaces "nights left" (**[[FUN.md §15]]**).
- **Ratios are law-3 inequalities.** "Converter throughput ≥ demand at tier T" is a
  constraint you state in a comment and assert against the actual config, not a
  vibe (**[[FUN.md law 3]]**).
- **The reinvest-vs-hoard delta** is your skill proof: a bot that reinvests output
  into more capacity beats one that hoards — farming measured 740 vs 236
  (**[[FUN.md §15]]**, law 2).

## Fails when…

- **No bottleneck.** Everything abundant → no decisions → the loop is a chore of
  clicking through steps. Always bind *one* constraint.
- **A permanent wall.** A bottleneck that never resolves halts progress. Move it.
- **Mystery ratios.** Illegible conversion math the player can't plan around.
- **Idle throughput.** If output accrues while away with no active choice, it's a
  timer, not a loop.
- **Chain too long day one.** Ten steps before the first payoff buries the fun.
  Introduce depth as the player scales, the way `src/content/` gates mechanics per
  act.

## Verify

- Monotone production, no desert, pacing windows — the balance-sim:
  **[[FUN.md §14]]**.
- Reinvest-vs-hoard skill delta: **[[FUN.md §15]]**, law 2.
- Conversion/throughput ratios as asserted inequalities: **[[FUN.md law 3]]**.
- Surface the binding number to the player (the farming truth): **[[FUN.md §15]]**.

## Composes with

- [[system-economy]] — a resource loop is an economy with an explicit chain.
- [[system-crafting]] — recipes are the *convert* step made combinatorial.
- [[system-tech-tree]] — research gates unlock new links in the chain.
- [[system-progression]] — spending the loop's output is how you grow.
- [[pattern-emergence]] — interacting loops (power↔mining) generate depth.

## See also

- [`design/FUN.md`](../FUN.md) §14 (pacing) · §15 (farming solvency + reinvest
  delta) — the loop proofs.
- **[[anchor-factorio]]** (the loop as the toy) · **[[anchor-stardew-valley]]**
  (gentle linear chains).

---
id: genre-management-tycoon
title: Management / Tycoon
kind: genre
tags: [systems, optimization, economy, builder, balance]
summary: Build and balance a living system toward efficiency — the joy is watching a machine you tuned run itself.
use-when: You want optimization play over a self-running economy or institution.
composes-with: [anchor-frostpunk, system-economy, system-resource-loops, pattern-feedback-loops]
anchors: [anchor-frostpunk]
verify-with: docs/FUN.md#17-·-city-builder
---

**What it is.** You author a system — a factory, a park, a colony, a household — then tune its **inputs, throughput, and demand** until it runs without you. The verbs are *place, connect, price, staff, cut*. Play is diagnosis and adjustment, not reflexes.

**Player fantasy / why it's fun.** The dopamine is **legibility earned**: a mess of red numbers you slowly turn green, then watch tick over on its own. You are the invisible hand that finally understands its own machine.

## Pillars (exactly 3)
1. **Legible systems.** Every number traces to a cause the player can see and touch. If a queue backs up, the bottleneck is *findable*. Opacity is the enemy — see [[pattern-readability]].
2. **Meaningful optimization.** There is always a *better* configuration, and the delta is felt. Choices trade off, not dominate — dodge [[antipattern-boring-optimal]] where one build wins forever.
3. **Escalating load.** Demand, complexity, or scale ratchets up so a solved layout becomes tomorrow's bottleneck. Pressure, not a plateau.

## The loop stack
| Layer | Beat |
|---|---|
| **Moment** | Read a gauge, place/reprice one node, see the number move. |
| **Encounter** | Diagnose one bottleneck or shortfall and rebalance around it. |
| **Session** | Absorb a demand spike or unlock; re-plan the whole flow to hold margin. |
| **Meta** | Master the system's *shape* — the intuitions that make the next map trivial. |

The loop is **observe → hypothesize → adjust → watch it settle**. Keep the settle-time short enough to close the feedback fast; see [[pattern-feedback-loops]] and [[pattern-mastery-and-flow]].

## Essential systems
- [[system-economy]] — the spine. Money or a proxy currency that flows in from output and out through upkeep; the ledger must balance to survive.
- [[system-resource-loops]] — raw → refined → sold, with buffers and spoilage. This is where bottlenecks *live*.
- [[pattern-feedback-loops]] — the demand curve. Success raises expectation, cost, or scrutiny so the target keeps moving.
- [[system-progression]] — an unlock spine (new buildings, tiers, districts) that gates complexity so [[system-onboarding]] can land one concept at a time.
- [[system-difficulty-and-dda]] — scenario pressure: quotas, deadlines, disasters that force replanning.
- [[system-inventory-and-ui]] — the interface *is* the game. Graphs, heatmaps, and overlays are your primary telegraph; a hidden number is a dead mechanic.

## Content & difficulty model
- **Scenario, not level.** Ship hand-authored maps with a starting condition, a win/loss ledger, and a twist constraint (scarce water, hostile winter, a fixed footprint). Reference [[anchor-frostpunk]]'s scenario framing.
- **Difficulty is demand, not damage.** Raise quotas, shrink margins, add a competing sink. The curve is economic tension — pace it per [[pattern-pacing-and-tension]].
- **Sandbox unlock late.** A free-build mode is the reward for beating the authored pressure, not the default first experience.
- **Determinism buys trust.** A fixed-seed economy means a spike is diagnosable, not luck. Route every random event through a deterministic RNG; see [[system-procgen-design]] for how to seed varied-but-fair scenarios.

## Signature-mechanic seeds
- **Tycoon but you can never expand, only rebalance** (constraint). The footprint is fixed at frame one — no new land, no new buildings. Every gain comes from *reconfiguring* what exists: repurpose, re-route, re-price. Optimization goes deep instead of wide, and the puzzle is legibly bounded.
- **Management but the thing you run is a single family** (perspective). Zoom the tycoon lens onto one household — budget, chores, moods, aging. Currencies are money *and* trust *and* time; a bad quarter isn't bankruptcy, it's a strained relationship. Human weight replaces the spreadsheet.
- **The demand curve talks back** (agency). Your customers/citizens are named agents with memory — see [[anchor-rimworld]]. Cut a corner and a specific person suffers, and remembers; optimization acquires a conscience.
- **Optimize toward shutdown** (goal-inversion). Victory is winding the machine *down* cleanly — a factory you must decommission, a fund you must spend to zero on the right things by a deadline. The tycoon loop, run in reverse.
- **You inherit a broken machine** (starting-state). Open on someone else's mess — miswired, over-leveraged, badly zoned. The first session is pure archaeology: understand it before you touch it.

## Common pitfalls
- **Spreadsheet without stakes.** Numbers move but nothing is *at risk* that the player cares about — the core trap. Attach human or moral weight: a person, a place, a promise. Without it you get [[antipattern-fake-choice]] dressed as depth.
- [[antipattern-boring-optimal]] — one layout dominates and every map collapses to it. Make trade-offs genuine and contexts differ.
- [[antipattern-currency-spaghetti]] — six currencies that all convert to money. Keep sinks and sources few and meaningful.
- [[antipattern-false-depth]] — knobs that look like choices but never change outcome. Cut them.
- [[antipattern-endless-tutorial]] — over-gated onboarding that explains the machine you'd rather discover. Teach one system, then step back.
- [[antipattern-solved-metagame]] — once players find *the* build order, escalation must outrun it or the game is over.

## Anchors
- [[anchor-frostpunk]] — the moral-weight exemplar: every efficiency choice is also an ethical one; the primary reference for this genre.
- [[anchor-rimworld]] — named-agent management where the story emerges from the system; see also [[pattern-emergence]].
- [[anchor-factorio]] — the throughput-optimization purest form; bottleneck-hunting as the whole game.
- [[anchor-mini-metro]] — legibility and constraint distilled: minimal inputs, a rising demand curve, no fat.
- [[anchor-stardew-valley]] — the cozy end, where management wears the skin of a [[genre-farming-sim]].

Neighbors worth studying: [[genre-city-builder]], [[genre-incremental]] (the demand curve without the map), [[genre-4x]] (management at civilizational scale).

## Verify
Prove the loop against `docs/FUN.md#17-·-city-builder` — is the bottleneck findable, does the demand curve keep the target moving, does a tuned system visibly run itself? Judge looks via [[process-refine-and-handoff]].

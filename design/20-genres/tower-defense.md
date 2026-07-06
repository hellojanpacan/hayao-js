---
id: genre-tower-defense
title: Tower Defense
kind: genre
tags: [tower-defense, td, waves, towers, counters, lanes, build-order]
summary: Build decisions that matter — near-hard counters, range-ring geometry, and wave curves that breathe.
use-when: You want a spatial build-and-defend loop where placement and counter-picks decide the run, not tower count.
composes-with: [system-counter-systems, system-enemy-archetypes, system-difficulty-and-dda, system-economy, system-encounter-design]
anchors: [anchor-into-the-breach]
verify-with: docs/FUN.md#8--tower-defense
---

# Tower Defense

**What it is.** Enemies walk a path; you spend a shared economy building
**towers** that fire on them. The whole game is *where you place what* — a
spatial optimisation puzzle that plays out in real time across escalating waves.

**Player fantasy / why it's fun.** *"I read the wave, I built the counter, I
watched my machine hold the line."* The satisfaction is a plan surviving contact
— then the finale wave that almost breaks it and doesn't.

## Pillars

1. **Counters must bite.** A counter is near-*hard*, not a soft resist. Soft
   resists get erased by tower-count scaling — if stacking one tower beats
   everything, there are no build decisions.
2. **Coverage is geometry.** range × distance-to-lane = the fire-window chord. A
   tower's worth is *how long it can shoot each enemy*. The **range ring is the
   genre's most important UI**.
3. **Waves breathe.** Pressure then relief. Runner waves are breaks; the curve
   ramps in envelope, not monotone HP. A wall of ever-bigger numbers is a
   spreadsheet, not tension.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Place/upgrade a tower; watch its ring cover the lane; a leaker slips and you patch the gap. |
| **Encounter** | A wave: read its archetype mix → the economy you saved buys the counter → it holds or leaks. |
| **Session** | A map, ~10 waves: opening eco vs defence tension, a midwave spike, a finale that peaks. |
| **Meta** | Unlock towers, maps, difficulty tiers; carry a build-order intuition between runs. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-counter-systems]] | The duel matrix. Each enemy archetype has a near-hard answer; picking it is the decision. |
| [[system-enemy-archetypes]] | The alphabet a wave is spelled from — fast/armored/flying/swarm/shielded. |
| [[system-difficulty-and-dda]] | The wave curve: ramp, breathers, finale peak — gate on shape, not raw HP. |
| [[system-economy]] | The spend that makes placement a *choice* — build now vs save for the counter. |
| [[system-encounter-design]] | Composing archetypes into a wave that demands a mixed build. |

## Content & difficulty model

- **Wave = an archetype recipe.** Author waves as mixes (8 fast + 2 armored),
  not HP totals. Difficulty is the *mix* forcing a broader build, plus tighter
  timing.
- **Gate the curve on shape.** Assert "each wave ≥ 55% of the previous, finale
  peaks" — not monotone HP. Runner waves are intentional dips.
- **The bare-lane baseline.** A lane with no towers must fall early (null-strategy
  proof, FUN.md law 4). A "threat" a do-nothing survives isn't a threat.
- **Mixed beats mono.** The intended mixed build survives 10/10; a mono build on
  a *bigger* budget fails. That gap is the proof the counters matter.

## Signature-mechanic seeds

- **TD but you also walk the path** *(perspective)* — a hero unit you steer
  between builds; placement and positioning share your attention.
- **TD but the towers are the enemies' path** *(mechanic-swap)* — every tower
  you place reshapes the maze; maze-building becomes the core decision.
- **TD but the wave is a deck you drafted** *(structure)* — you *build the
  attack* for a rival lane and defend theirs. Pairs [[system-build-diversity]].
- **TD but ammo is a shared resource that runs dry** *(constraint)* — towers
  compete for a finite magazine; over-building starves the finale.
- **TD but towers age and crack** *(theme + tonal)* — Kentō stonework that
  weathers each wave; repair vs expand becomes the economy tension.

The strongest TD twist bends the *decision*, not the theme: change what the
player builds against (a rival's drafted wave), what the towers cost (a shared
magazine), or where the path goes (maze-building). See [[process-the-twist]].

## Common pitfalls

- **Soft counters.** A 20% resist vanishes under stacking. Make the counter
  near-hard or the build collapses to "spam the best tower."
- **Monotone HP ramp.** Waves that only grow read as a slog. Breathers and a
  peaked finale are the pacing.
- **Invisible range.** Without a visible ring, placement is guesswork and
  coverage-as-geometry is illegible.
- **Economy with no tension.** If you can always afford everything, placement
  isn't a decision — starve the player enough to force priorities.
- **Global upgrades over placement.** If flat "+damage" buttons beat clever
  positioning, coverage-as-geometry is dead. Keep the map the puzzle.

## Anchors

- [[anchor-into-the-breach]] — perfect-information spatial threat-reading; TD is
  the real-time cousin. Steal its "read the telegraph, answer with placement."
- [[system-counter-systems]]'s duel matrix is the balance skeleton — treat each
  tower↔archetype pair as a proven duel.

## Verify

Prove it in **[FUN.md §8 · Tower defense](../../docs/FUN.md#8--tower-defense)**:
mixed build survives 10/10, a bigger-budget mono build fails, the bare lane
falls early, and counter duels resolve from both sides.

## Composes with

- [[system-counter-systems]] — the near-hard duel matrix the whole game rests on.
- [[system-enemy-archetypes]] — the archetype alphabet waves are written in.
- [[system-difficulty-and-dda]] — the breathing wave curve.

## See also

- [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo) — lane/path and
  flow-field wiring for enemy movement.
- [`examples/sokoban`](../../examples/sokoban) — the logic/view split reference:
  keep wave resolution pure, the range rings and hit sparks cosmetic (law 6).

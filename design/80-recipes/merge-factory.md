---
id: recipe-merge-factory
title: Merge Factory
kind: recipe
tags: [merge, automation, factory, recipe, factorio]
summary: Threes-style merging scaled into a Factorio automation loop — combine to ascend, then automate the combining.
use-when: You want a merge toy that grows into a systemic automation game.
composes-with: [mechanic-merge, anchor-factorio, system-resource-loops, genre-incremental, process-the-spine]
anchors: [anchor-factorio, anchor-katamari]
spine: "Finite board space is the one scarcity, and the automation that clears cells by merging is the same automation that keeps flooding them — you must out-design your own throughput before the board jams."
verify-with: design/FUN.md#14-·-incremental
---

# Merge Factory

**What it is.** A merge toy that eats itself. You combine two low-tier tiles into
one higher tier by hand — then you build a **machine** that does the combining,
and the game becomes about designing the machine, not swiping the tiles.

**Player fantasy / why it's fun.** *"I loved the merge — now I never have to do it
again, and I love that more."* The pull is watching a chore you enjoyed become a
humming line you *designed*. The first auto-merger is the dopamine spike; the first
bottleneck is the hook.

## The brief

**2048 but you automate the merging** — a *structure* twist ([[process-the-twist]]).
Take the merge verb, keep it, then move it up a level of abstraction: the player
stops merging and starts building **the thing that merges**. Factorio did this to
crafting; do it to Threes.

## The spine

*Finite board space is the one scarcity, and the automation that clears cells by
merging is the same automation that keeps flooding them — you must out-design your
own throughput before the board jams.*

| Part | This game |
|---|---|
| **Objective** | Keep the line running and climb the tiers — reach tier-8 without the board jamming |
| **Superpower** | **Automate the merge** — place droppers, mergers, belts, sorters so the combining runs itself |
| **Scarcity** | **Board space** — a finite grid of cells. Every merge frees a cell, but every dropper and every belt-tick *fills* one; throughput is spent against area you don't have |
| **Obstacle** | Your own faster half: tier-N output outruns the tier-N+1 merger downstream, tiles pile, and unmerged stock crowds the cells the line needs to keep flowing |
| **Renewal** | The bottleneck **moves** as you solve it (tier-3-limited → tier-4-limited, iron→copper→power); each new tier re-poses "throughput vs. space" one abstraction higher |

## Resonance

Every element traces to the spine — the coherence proof (see [[process-the-spine]]).

| Element | Arrow back to the spine |
|---|---|
| Verb: [[mechanic-merge]] (two-of-a-kind → one-of-next-tier) | The unit of throughput and the only thing that *frees* a cell — the agency the whole board fights over |
| **Power creates the problem** | Automating the merge is exactly what floods the board: the droppers and belts you place to clear cells are the same machines feeding new tiles in faster than the next tier can consume them *(passes the gate)* |
| Scarcity: finite board space | Turns "more throughput" into a *trade* — you can't buy speed without spending the area the line runs on |
| Renewal: the moving bottleneck ([[system-resource-loops]]) | Re-poses "out-run your own fill-rate" against a fresh binding constraint each tier; the loop narrows somewhere new every beat |
| Manual first, then automate ([[mechanic-merge]] by hand) | Teaches the merge that costs a cell *before* the machine hides it — you feel the space you're spending before you scale it |
| Ascension feel ([[anchor-katamari]]) | Climbing tiers is the objective made visceral; each tier is bigger stock competing for the same finite cells |
| Tech tree spends ([[system-tech-tree]]) | Faster belts and higher tiers are *more throughput* — buying deeper into the very pressure the scarcity punishes |
| Economy sink ([[system-economy]]) | Cashing out finished tiles is how you *reclaim* board space — the pressure-release valve priced on the spine, not free ([[antipattern-dissonance]] avoided) |
| No-desert pacing ([[genre-incremental]]) | Every minute a *close* next unlock keeps the throughput-vs-space decision live; a wait with nothing to optimize would let the tension go slack |
| Feel: juiced fuse — squash, pop, tier-color bump ([[pattern-juice-choreography]]) | Makes the one act that frees a cell *feel* like the relief it is, so the flood reads as pressure and the clear reads as reward ([[design/JUICE.md]]) |

No row is decoration; no row fights the spine. The gate holds: **the automation that
clears the board is the automation that floods it — you can only survive by
out-designing your own throughput.**

## Anchors

- **[[anchor-factorio]]** — the load-bearing anchor. Steal *automate-your-own-labour*
  and *the bottleneck is the content*. The merge is the raw craft you replace with a
  standing process; the fun is diagnosing where the line stalls.
- **[[anchor-katamari]]** — steal the *ascension feel*: small things fuse into
  bigger things and the scale of what you touch keeps climbing. Tier-8 should feel
  absurd next to the tile you started swiping.

## Genre + systems pulled

- **[[mechanic-merge]]** — the verb. Two-of-a-kind → one-of-next-tier. This is the
  toy in the player's hands for the first minutes and the unit of throughput forever
  after.
- **[[genre-incremental]]** — the pacing spine. The curve *is* the game: first-buy
  times, era gaps, every tier paying back on schedule, **no deserts**.
- **[[system-resource-loops]]** — the shape. Each tier is a node; a merger converts
  N of tier-T into one tier-T+1. The design work is *where the loop narrows* — which
  tile you're always short of.
- **[[system-tech-tree]]** — gates new mergers, faster belts, higher tiers as spends.
- **[[system-economy]]** — the sink: cash out finished high-tier tiles to buy more
  machine.

Link them; don't restate them. The recipe is the wiring — open those modules for
the levers.

## The twist applied

Vector: **structure** (the "operate on the structure that produces the play, not
the play" move from [[process-the-twist]]). One verb, lifted one level:

| X but Y | Twist vector |
|---|---|
| 2048 but you automate the merging | structure — play the machine, not the board |
| Merge game but merges have **throughput** (a belt clogs) | mechanic-swap — swipes become flow |
| Idle merger but the **layout** is the puzzle, not the wait | constraint — spatial logistics, not a timer |

The trap it dodges: most merge games are pure [[genre-match3]] dressing with a
prestige bolt-on ([[antipattern-second-system]]). Here automation *is* the game the
merge was training you for — the two halves share one loop.

## The 3 pillars

1. **Satisfying merge.** The base verb has to feel great *by hand* before you
   automate it — juice the fuse (squash, pop, tier-color bump; see
   [[pattern-juice-choreography]]). If the manual merge is flat, automating it just
   hides a dead toy.
2. **Build the machine.** The mid-game verb is *placement*: droppers, mergers, belts,
   sorters. The player designs a line and watches it run ([[pattern-emergence]] — you
   place rules, outcomes emerge). Admiring your own working factory is the reward.
3. **No-desert ramp.** The tier curve pays back on schedule the whole way up. Every
   minute there's a *close* next unlock; the moment the player is waiting with nothing
   to optimize, the game has failed ([[genre-incremental]] pacing law).

## Scope & first playable

Cut to the smallest thing that proves the loop bends from hand to machine:

1. **Manual merge.** A small grid; drag two tier-1 tiles together → one tier-2. Pure
   toy, fully juiced. This alone must be fun for ~60 seconds.
2. **First auto-merger.** Earn/buy one machine that consumes a queue of tier-1s and
   emits tier-2s on a belt. The player's hands come *off* the merge — the aha moment.
   Keep everything [[system-resource-loops]]: tiles are counts in `world.state`, each
   drop/place/merge is an input action so the whole run replays and hashes.
3. **A bottleneck.** Tier-2 output outruns the single tier-3 merger downstream; tiles
   pile up. Now the player must add capacity or re-route — the first *design* problem,
   and the seam every later tier reuses. **Move** the bottleneck as they solve it
   (iron→copper→power, merge-style): solved tier-3, now tier-4-limited.

Everything past step 3 — more tiers, sorters, prestige, sinks — is content on a
proven skeleton, not new skeleton. Resist [[antipattern-feature-soup]]: ship the
three-beat loop first.

## Handoff

A design isn't done until it names its proofs ([[process-refine-and-handoff]]).

- **Pacing / no-desert ramp** → `design/FUN.md#14-·-incremental`. Balance-sim a bot
  that plays the factory out; assert monotone production and no bottleneck desert —
  the exact incremental verify the tier curve lives or dies by.
- **Resource-loop bottlenecks** → [[system-resource-loops]]. The bottleneck *is* the
  pacing; prove one binding constraint at a time, ratios as stated inequalities, and
  surface the player-critical number ("N tier-3 short") the way farming surfaces
  "nights left".
- **Skill delta** → the reinvest-vs-hoard proof: a bot that plows output into more
  capacity must beat one that hoards. That gap is your evidence the machine-building
  is a real decision, not a click-through.

## Composes with

- [[mechanic-merge]] — the verb this whole recipe is built to outgrow.
- [[anchor-factorio]] — the automation loop and the bottleneck-as-content doctrine.
- [[system-resource-loops]] — each tier a node; the merger is the *convert* step.
- [[genre-incremental]] — the no-desert pacing curve that keeps the ramp alive.
- [[system-tech-tree]] — spends that unlock faster belts, higher tiers, new mergers.

## See also

- [`design/FUN.md`](../FUN.md) §14 (incremental pacing) — the loop proofs.
- **[[recipe-tower-defense-roguelite]]** — a sibling *structure* twist (draft the
  towers) on the recipe shelf; **[[process-composition]]** for the pipeline this
  recipe is a worked instance of.

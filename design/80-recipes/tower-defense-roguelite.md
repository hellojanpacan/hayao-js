---
id: recipe-tower-defense-roguelite
title: Tower-Defense Roguelite
kind: recipe
tags: [tower-defense, roguelite, draft, meta, recipe]
summary: Tower defense where towers are drafted each run and meta-progression persists — build decisions under roguelike variance.
use-when: You want TD replayability via drafted builds and between-run unlocks.
composes-with: [genre-tower-defense, system-meta-progression, system-build-diversity, process-the-twist]
anchors: [anchor-slay-the-spire, anchor-into-the-breach]
verify-with: design/FUN.md#8-·-tower-defense
---

# Tower-Defense Roguelite

**What it is.** A tower-defense map you play as a **run**: you don't own every
tower, you *draft* a handful this run, and what carries over between runs is a
persistent unlock tree — not this run's board.

**Player fantasy / why it's fun.** *"This run I got dealt slow-field + splash and
built a completely different machine than last time — and I'm two unlocks from the
build I've been chasing."* The pull is a fresh hand every run over a defence loop
whose fundamentals you already trust.

## The brief

**Tower defense** but **the roster is a per-run draft** *(structure vector)*. You
keep [[genre-tower-defense]]'s spatial fun intact and swap the container: instead
of a fixed shop of all towers, each run hands you a small, semi-random toolkit,
and a persistent tree decides what *can* be dealt.

## Anchors

| Anchor | What this recipe steals |
|---|---|
| [[anchor-slay-the-spire]] | **Draft-of-N-or-skip.** Your tower roster is a curated hand, not a full catalogue; the *skip* is a live decision and a lean set can be stronger than a wide one. |
| [[anchor-into-the-breach]] | **Legible pre-visible threat.** Wave intent is shown, so a leak is a build failure you can read, never a coin flip — the honesty that makes variance fair. |
| [[anchor-hades]] | **Meta as narrative pull.** Between-run unlocks that always advance *something*, so a lost run still moves you forward. |

## Genre + systems pulled

- [[genre-tower-defense]] — the spatial core: range-ring geometry, biting counters, waves that breathe. **Don't restate it — build on it.**
- [[system-meta-progression]] — the persistent tree: what unlocks, what's run-scoped, what stays sacred.
- [[system-build-diversity]] — the guarantee that *many* drafted rosters are viable, so the draft is a real fork, not a rename.
- [[system-procgen-design]] — seeded wave mixes and draft offers, both provable from one deterministic RNG.
- [[system-counter-systems]] — the duel matrix the draft rides on; a run is *do my drafted answers cover this map's archetypes?*
- [[process-the-twist]] — the structure-vector move that produced this brief.

## The twist applied

**Vector: structure.** The mechanical fun (placement, coverage, counters) is
untouched — that would be the wrong axis to bend ([[genre-tower-defense]]'s fun is
spatial, not fictional). What changes is the *container*: a one-shot campaign
becomes a **run**, the shop becomes a **draft**, and progression moves off the
board into a **persistent tree**. Same as Dead Cells bending Metroidvania into a
roguelite — keep the verbs, change the shell.

**Extra twist seams** (each an "X but Y" you can layer, one at most):

- **TD but you draft the map's lanes too** *(structure)* — the path is a run-seed choice, not fixed, so geometry is part of the variance.
- **TD but leaked enemies join the next wave** *(constraint)* — a soft-permadeath pressure that punishes leaks without ending the run, à la [[anchor-into-the-breach]]'s consequence-forward design.
- **TD but towers are drafted mid-wave, not between** *(structure)* — draft under fire; the offer arrives when you can least afford to read it.

## The 3 pillars

1. **Build decisions that matter.** The drafted roster must fork the run. If any
   hand beats the map, the draft is [[antipattern-fake-choice]]. Lean on
   [[system-build-diversity]] and near-*hard* [[system-counter-systems]] so the
   *offered* towers, not the *count*, decide the plan.
2. **Run variance you can read.** Every run differs — draft offers, wave mix,
   maybe lanes — but never blind. Wave intent is telegraphed
   ([[anchor-into-the-breach]]); the draft is seeded and shown. Variance that
   isn't legible is [[antipattern-rng-frustration]].
3. **Persistent pull.** A lost run still advances the tree ([[anchor-hades]]).
   Guard the two failure edges: unlocks that gate raw power become an
   [[antipattern-grind-wall]]; unlocks that only add width become
   [[antipattern-power-creep]]. Unlock *options*, not stats — see
   [[system-meta-progression]].

## Scope & first playable

Cut to the smallest thing that proves *drafted build → run outcome → persistent pull*.

| In the first playable | Cut for later |
|---|---|
| **One map**, one seeded path | Multiple maps, branching routes |
| **6–8 towers**, drafted 3-of-a-larger-pool per run | A full catalogue |
| **~8 waves** authored as archetype mixes, telegraphed | Deep enemy roster |
| **One meta unlock** (e.g. "adds a tower to the draft pool") that visibly changes the *next* run | A full unlock tree |
| Deterministic draft + waves from a single run seed | Cosmetics, boss waves, live-ops |

**The proof-of-fun test:** two runs on the same map, different seeds, should feel
like *different builds solved the same problem* — not the same build with reshuffled
numbers. If they feel identical, the draft isn't forking the run — return to
[[system-build-diversity]] before adding content.

Author each run seed to a fixed pipeline: `seed → draft offers + wave mix + (path)`.
Keep it in a pure module so a run is replayable and a level is machine-checkable,
the way [[system-procgen-design]] frames it and `examples/sokoban/` frames the
logic/view split.

## Handoff

- **Fun proof:** the tower-defense mechanical-truth gates — biting counters,
  range-ring readability, a wave curve that ramps-then-breathes-then-peaks — at
  **design/FUN.md §8 · Tower Defense** (`verify-with` above). The draft doesn't
  change what "fun TD" means; it changes how the roster is chosen.
- **Winnability + connectivity:** every seed must be *provably clearable with the
  hand it deals* — no dead draft, no impossible wave. If lanes are seeded, prove
  the path connects entry to exit. Frame both as a solver proof over the pure run
  module, per [[system-procgen-design]].
- **Feel:** juice and look go through the JUICE/JUDGE half once mechanics are
  green — telegraphs, placement feedback, the finale-wave crescendo.

## Composes with

- [[genre-tower-defense]] — the untouched mechanical core this recipe re-shells.
- [[system-meta-progression]] — the persistent tree that turns a loss into progress.
- [[system-build-diversity]] — the guarantee the draft is a real fork.
- [[system-procgen-design]] — seeded, provable runs.
- [[anchor-slay-the-spire]] — the draft-or-skip discipline.

## See also

- **design/FUN.md#8-·-tower-defense** — the mechanical-truth gates to build against.
- **`examples/sokoban/`** — the pure-logic / cosmetic-view split to model the run module on.
- [[process-the-twist]] · [[process-composition]] — how this brief was assembled.

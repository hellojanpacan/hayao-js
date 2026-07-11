---
id: recipe-tower-defense-roguelite
title: Tower-Defense Roguelite
kind: recipe
tags: [tower-defense, roguelite, draft, meta, recipe]
summary: Tower defense where towers are drafted each run and meta-progression persists — build decisions under roguelike variance.
use-when: You want TD replayability via drafted builds and between-run unlocks.
composes-with: [genre-tower-defense, system-meta-progression, system-build-diversity, process-the-twist, process-the-spine]
anchors: [anchor-slay-the-spire, anchor-into-the-breach]
spine: "You don't choose your towers — the run drafts them, and every tower you commit to seal one lane is the board, gold, and build identity you no longer have for the threat the next wave brings."
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

## The spine

*You don't choose your towers — the run drafts them, and every tower you commit to
seal one lane is the board, gold, and build identity you no longer have for the
threat the next wave brings.*

| Part | This game |
|---|---|
| **Objective** | Hold the map — keep every wave from leaking, run after run, and chase the build the meta tree keeps promising |
| **Superpower** | **Place a drafted tower** — commit fixed map geometry to the hand this run dealt you, not the roster you'd have picked |
| **Scarcity** | The **draft** (N-or-skip; you get *given* towers, not chosen ones) **+ the board** (each placement spends a cell and a firing arc you can't reuse) **+ the run economy** (gold buys this tower *or* the next) |
| **Obstacle** | Waves whose archetype mix demands specific counters, arriving against fixed lanes — the enemies your drafted hand answers, or doesn't |
| **Renewal** | Every run re-deals a seeded draft + wave mix (+ maybe lanes); within a run each wave re-asks whether your committed board covers what's coming; the meta tree re-authors what the *next* run can draw |

## Resonance

Every element traces to the spine — the coherence proof (see [[process-the-spine]]).
Note the death-handling row: a roguelite ends the *run* yet advances the *tree*, and
that split is **derived** from the spine, not defaulted.

| Element | Arrow back to the spine |
|---|---|
| Verb: place a drafted tower | The single agency — you commit dealt tools to fixed geometry; every build is *this hand* reshaped onto *this map* |
| Scarcity: a drafted hand, not a catalogue | You don't pick — the run deals N-or-skip ([[anchor-slay-the-spire]]); *which* towers you were given is the whole plan, so the fork is real, not a rename |
| Scarcity: finite board & firing arcs | Each placement eats a cell and a coverage angle you can't reuse — sealing one lane is space *spent*, never free |
| Scarcity: the run economy | Gold buys this tower *or* the next; covering now is income you won't have when the mix shifts under you |
| **Power creates the problem** | The tower you place to seal one lane is the board, gold, and build identity you can't spend on the next — and how you spend this round's draft authors what next round deals *and* what it demands *(passes the gate)* |
| Renewal: seeded per-run draft + wave mix (+ lanes) | Every run re-poses "cover *this* map with *this* hand" against a fresh draw ([[system-procgen-design]]) — one tension, endless faces |
| Renewal: waves ramp → breathe → peak | Within a run, each wave re-asks whether your committed board answers what's actually coming — the spine re-posed at encounter scale |
| The counter matrix the draft rides on | Near-*hard* [[system-counter-systems]] make *which* answers you drafted decide the run; without teeth the coverage puzzle would be [[antipattern-fake-choice]] |
| Telegraphed wave intent | Variance is *shown*, never blind ([[anchor-into-the-breach]]); a leak is a legible build failure, which is exactly what makes a drafted hand *fair* |
| Meta: persistent unlock tree | A lost run still advances *something* ([[anchor-hades]]) — and it unlocks *options* that re-author the next draft, not raw stats, keeping the spend-vs-cover decision alive ([[system-meta-progression]]) |
| Death-handling: run ends, tree advances | Spine is *variance-run over a trusted loop*; the loss must sting *and* pull forward — a run that ended for nothing, or a loss with no pull, would be **dissonant** ([[antipattern-dissonance]]) |
| Feel: range rings, placement feedback, finale crescendo | Makes coverage *legible* — you have to read what your committed board does and doesn't cover to spend the next draft well ([[pattern-readability]]) |

No row is decoration; no row fights the spine. The gate holds: **the tower that
seals this lane is the tower you can't place against the next — and this round's
draft is authored by how the last one went.**

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

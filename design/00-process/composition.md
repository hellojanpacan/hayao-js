---
id: process-composition
title: Composition — Assembling the Design
kind: process
tags: [composition, genre-blend, systems, assembly, coherence, parent-genres, checklist]
summary: Assemble a design from anchor + genre template + the systems it implies; blend genres by satisfying every parent's verify pattern.
use-when: You have a brief and pillars and need to assemble the actual design — which genre template, which systems, and how a genre blend holds together.
composes-with: [process-intent-to-brief, process-pillars, process-the-twist, process-refine-and-handoff]
verify-with: docs/FUN.md#part-2--per-genre-cheat-sheet
---

# Composition — Assembling the Design

**What it is.** The assembly step. Take the **anchor** (the X), lay down its
**genre template**, and bolt on the **systems** that genre implies — progression,
economy, combat, factions. Composition is *sourcing the parts*; [[process-the-twist]]
is the bend you apply while you assemble.

**Why it's fun.** You don't re-derive what a roguelite knows about meta-progression;
you *compose* it, pre-solved, and spend your invention on the twist. The craft here
is picking the right parts and making a blend **cohere** rather than collide.

## The step

Anchor + pillars → a composed design: one genre template, N systems, a coherent
whole. Every included part must pass the [[process-pillars]] filter and serve the
loop stack ([[process-core-loop]]).

## Inputs → outputs

| In | Out |
|---|---|
| Anchor(s) + brief + 3 pillars | A named genre template (a [genre](../20-genres/)) as the spine |
| The twist vector ([[process-the-twist]]) | A **system list** — each `[[system-*]]` justified by a pillar |
| Session length + scope | A blend map: parent genres and their verify patterns |

## The assembly

1. **Anchor → genre spine.** The anchor names the genre. Pull the deep template
   from [`20-genres/`](../20-genres/) — its pillars, loop stack, and *essential
   systems*. This is your skeleton; you're not starting from zero.
2. **Genre → implied systems.** Every genre *implies* systems. A roguelite implies
   meta-progression and procgen; an RTS implies rosters, economy, and asymmetry.
   Use the checklist below.
3. **Twist → added/swapped system.** The twist usually *is* a system swap or add
   (Loop Hero adds placement + a deck to auto-combat). Slot it in.
4. **Filter every system.** Score each against the pillars. Include only what
   serves one. When in doubt, cut — an unverified system is presumed broken.

## Which systems does this genre imply?

A starting checklist. Presence isn't mandatory — but *decide* on each, don't
forget it.

| If the design has… | It almost certainly implies… |
|---|---|
| Runs / permadeath | [[system-meta-progression]] · [[system-procgen-design]] · [[system-session-structure]] |
| A power curve | [[system-progression]] · [[system-mastery-curve]] · [[pattern-pacing-and-tension]] |
| Currency / shops | [[system-economy]] · [[system-resource-loops]] · [[system-reward-schedules]] |
| Combat | [[system-combat-model]] · [[system-telegraphs]] · [[system-enemy-archetypes]] · [[system-encounter-design]] |
| Multiple factions/classes | [[system-faction-asymmetry]] · [[system-unit-rosters]] · [[system-counter-systems]] |
| Builds / loadouts | [[system-build-diversity]] · [[system-skill-trees]] · [[system-status-effects]] |
| Precision movement | [[system-grace]] · [[pattern-anti-frustration]] |
| Bosses / set-pieces | [[system-boss-design]] |
| A new player | [[system-onboarding]] · [[system-accessibility]] · [[system-difficulty-and-dda]] |
| Emergent story | [[system-emergent-systems]] |
| Coop / PvP | [[system-coop-and-competition]] |
| Any game at all | [[system-save-and-checkpoint]] · [[pattern-readability]] · [[pattern-juice-choreography]] |

Two systems on that last row are *always on*: readability (JUDGE hook) and juice
choreography (JUICE hook). Skip nothing there.

## Genre-blend rules

Most interesting games are **blends** — two or more genres under one loop
(Loop Hero = auto-battler + deckbuilder + placement; rhythm = roguelike + input
legality). The rule that keeps a blend from collapsing:

> **Satisfy every parent genre's verify pattern.** FUN.md's closing note is law:
> *"If the genre is a blend, satisfy every parent genre's verify pattern — genres
> compose (rhythm = roguelike + input legality; Peggle = physics + aim search)."*
> A blend is not an average of two verify suites; it is the **union** of them.

Practically:

1. **List the parents.** Name each genre in the blend and its FUN.md section.
2. **Union the verify patterns.** A physics-arcade + deckbuilder owes *both* the
   swept-collision/energy invariant (FUN.md §19) *and* the draft-delta + win-rate
   window (FUN.md §11). Neither is optional.
3. **Find the seam.** Where two systems meet is where blends break — the moment a
   card *modifies* a physics shot, both models must stay honest. Name that seam and
   plan a proof for it specifically.
4. **Pick the dominant parent.** One genre owns the moment verb; the others modify.
   The dominant one's loop stack is the spine; the others graft on.

## Worked example

**Intent:** *"a tower defense where the towers are a deck you draft each wave."*
Pillars: (1) *build decisions that matter*, (2) *drafts with teeth*, (3) *the range
ring is the UI*. X = tower defense × deckbuilder blend.

**Composition:**

- **Spine:** [[genre-tower-defense]] owns the moment verb (place a tower). FUN.md
  §8 is the primary verify pattern.
- **Grafted parent:** [[genre-deckbuilder]] supplies the *draft-of-3 per wave*.
  FUN.md §11's draft-delta + win-rate window applies to the tower draft.
- **Implied systems:** [[system-economy]] (gold faucet from kills), [[system-counter-systems]]
  (near-hard tower↔enemy counters — §8 demands it), [[system-encounter-design]]
  (wave composition), [[system-reward-schedules]] (the draft is the reward).
- **The seam:** a drafted tower must respect coverage geometry (§8's range × lane
  chord) *and* the draft must have teeth (§11's delta). The seam-proof: a mixed
  drafted build survives 10/10 while a mono-draft (bigger budget) fails **and**
  never-drafting loses by a margin. Both parents, one scenario.
- **Cut:** a proposed crafting system — serves no pillar, adds a third verify
  suite for no fantasy gain. Out.

## Traps

- **Averaging verify suites.** A blend owes the *union*, not the intersection. Two
  parents = both proofs, in full.
- **Two dominant parents.** If two genres fight for the moment verb, the game has
  no center. Pick one spine; the rest modify it.
- **Ignoring the seam.** Blends break where systems touch. The seam needs its own
  named proof, not a hope that both halves compose cleanly.
- **System sprawl.** Every system you add is a verify suite you owe. Compose the
  fewest systems that serve the pillars; each extra one is scope you must prove.
- **Composing from the corpus.** Don't survey `examples/` for which systems to
  bolt on (see [CLAUDE.md](../../CLAUDE.md)). Decide from the mechanic and the
  pillars; borrow *structure*, not a menu.

## Composes with

- [[process-the-twist]] — the twist is chosen *during* composition; it's the
  creative bend on the parts you're assembling.
- [[process-pillars]] — the filter that decides which systems are in.
- [[process-core-loop]] — the systems fill the loop stack's layers.
- [[process-refine-and-handoff]] — the composed system list becomes the list of
  verify suites you owe.

## See also

- [docs/FUN.md](../../docs/FUN.md) Part 2 + closing note — the per-genre verify
  patterns and the blend law you must satisfy for every parent.
- [`20-genres/`](../20-genres/) · [`30-systems/`](../30-systems/) — the parts bin
  you assemble from.
- [`examples/`](../../examples/) — *convention* references for how a composed
  design wires state/view, **not** an idea menu (per AGENTS.md).

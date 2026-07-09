---
id: anchor-return-of-the-obra-dinn
title: Return of the Obra Dinn
kind: anchor
tags: [deduction, mystery, logic, reasoning, verification, non-linear, knowledge]
summary: Deduction as the core loop — the game gives you evidence and *trusts your reasoning*, confirming answers only when you've triangulated a solvable set.
use-when: The intent is a logic/mystery game where the played verb is *inferring* facts from evidence, and the design must be provably solvable without guessing.
composes-with: [genre-exploration, system-onboarding, system-progression, pattern-readability, pattern-mastery-and-flow]
anchors: []
verify-with: design/FUN.md#1-grid-puzzle-sokoban
---

# Return of the Obra Dinn

**What it is.** A mystery where the core verb is **deduction**. You walk frozen
death-scenes aboard a lost ship and must name every fate: *who* this is, *how* they
died, *by whose hand*. The game hands you evidence — faces, voices, clothing,
positions — and **trusts you to reason**. It never tells you an answer; it only
*confirms* a set of three correct fates at once, so you must **triangulate** until
your logic is certain.

**Player fantasy.** You are a detective the game *respects*. It refuses to
hand-hold — no hint arrows, no "you're close." The high is the deduction click:
cross-referencing a dozen scattered facts until a name that was a guess becomes a
*certainty you proved*. You didn't find the answer; you **reasoned** it.

## Design DNA

The engine is **deduction as the played move, over a provably solvable evidence
set**. Three parts. First, the verb is *inference*, not action: the player
assembles facts into conclusions ([[genre-exploration]]'s cousin — exploration of
an *idea-space*). Second, **the game trusts your reasoning**: it withholds
confirmation, so the reward is *your own certainty*, not a checkmark
([[pattern-mastery-and-flow]]). Third — critically — **the mystery must be
solvable by logic alone**: every fact is derivable from evidence without guessing,
which is a *solver proof* exactly like a puzzle's (FUN.md §1, [[genre-grid-puzzle]]).
The "confirm in batches of 3" mechanic is anti-brute-force: it rewards *deduction*
over *permutation*.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Deduction as the verb** | The player *reasons*, doesn't act; the whole loop is turning evidence into conclusions. → [[genre-exploration]]. |
| **Provably-solvable evidence** | Every fact is derivable by logic — no guess required. This is a solver proof and is *non-negotiable*. → [[genre-grid-puzzle]], FUN.md §1. |
| **Withheld confirmation** | The game won't say "right" until you've earned certainty; the reward is your *own* conviction. → [[pattern-mastery-and-flow]]. |
| **Batch-of-3 gating** | Confirming fates in threes defeats brute-force permutation and forces genuine triangulation. → [[pattern-risk-reward]]. |
| **Non-linear evidence** | Facts can be gathered and cross-referenced in any order; the player builds their own inference chain. → [[pattern-emergence]]. |
| **Difficulty by inference depth** | Early fates need one clue, late ones need many chained deductions — a curve of *reasoning*, not reflex. → [[system-progression]]. |
| **The notebook as UI** | A ledger of hypotheses the player fills in — the deduction made *manipulable*. → [[pattern-readability]]. |

## What to steal

- **Make deduction the verb**: give the player evidence and let them *conclude*.
  The played move is reasoning, and it's a genre almost nobody occupies. →
  [[genre-exploration]].
- **Prove it's solvable by logic** before you ship a single mystery: every answer
  must be derivable from evidence, no guessing. This is a solver proof — treat it
  exactly like [[genre-grid-puzzle]] winnability (FUN.md §1).
- **Withhold confirmation** so the reward is the player's *own certainty*. Then
  gate confirmation (batches, cost) to defeat brute force. → [[pattern-risk-reward]].
- **A notebook/ledger UI** that makes the player's reasoning *manipulable* — the
  interface for the invisible verb. → [[pattern-readability]].

## What's just theme (drop it)

- The **1800s-shipwreck fiction** — deduction-over-evidence fits a crime scene, a
  code audit, a genealogy, a haunted house, a spreadsheet of lies. →
  [[world-theme-vectors]].
- The **1-bit dithered art** — a striking aesthetic pick ([[world-aesthetic-direction]]),
  not part of the loop. Any legible style works.
- **The frozen-time death scenes** — one delivery mechanism for evidence;
  documents, interviews, or logs deliver the same facts.
- **The specific 60 fates** — content. The transferable part is the *solvable
  evidence graph* and the batch-confirm anti-guess mechanic.

## Composes into

- [[genre-exploration]] — the parent, but exploring an *idea-space* (evidence →
  conclusions) rather than a physical world.
- [[genre-grid-puzzle]] — shares the *solvable-by-logic* proof obligation; a
  deduction game is a puzzle whose state is the player's knowledge.
- [[system-onboarding]] — early easy fates teach the deduction loop by doing.
- [[system-progression]] — difficulty rises with required inference depth.
- [[pattern-mastery-and-flow]] — the deduction-click is the flow reward.

## Twist seams

- **Obra Dinn but knowledge-gated exploration** *(structure)* — evidence unlocks by
  *understanding*, not by walking; deduction + Outer Wilds. Pairs with
  [[anchor-outer-wilds]].
- **Obra Dinn but coop deduction** *(perspective)* — two detectives hold different
  evidence and must *argue* to a shared conclusion; communication becomes the
  mechanic. Pairs with [[genre-coop-chaos]].
- **Obra Dinn but procedurally generated cases** *(mechanic-swap)* — a solver
  guarantees each generated mystery is logic-solvable, giving endless deduction.
  Pairs with [[system-procgen-design]] and the winnability proof of [[genre-grid-puzzle]].
- **Obra Dinn but you can be *wrong* and it costs you** *(constraint / tonal)* —
  confirmations are risky bets with consequences; deduction under stakes, not
  free retries.

## See also

- [`design/FUN.md#1-grid-puzzle-sokoban`](../FUN.md) — solver-provable
  solutions; unwinnable = unshippable. A deduction game inherits this obligation:
  prove every fate is derivable by logic.
- [[genre-exploration]] · [[anchor-outer-wilds]] (the knowledge-progression
  sibling) · [[genre-grid-puzzle]].

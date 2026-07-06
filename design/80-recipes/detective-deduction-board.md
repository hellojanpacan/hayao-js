---
id: recipe-detective-deduction-board
title: Detective Deduction Board
kind: recipe
tags: [deduction, puzzle, notebook, recipe, obra-dinn]
summary: Obra Dinn's reasoning loop on a grid puzzle — gather clues, fill a deduction board, and the game trusts your logic.
use-when: You want a deduction game where the player reasons, not brute-forces.
composes-with: [anchor-return-of-the-obra-dinn, genre-grid-puzzle, system-quests-and-objectives, pattern-fairness-and-trust]
anchors: [anchor-return-of-the-obra-dinn]
verify-with: docs/FUN.md#1-·-grid-puzzle
---

# Detective Deduction Board

**What it is.** A single mystery encoded as a **grid** — rows are unknowns (who/how/where), columns are the values they can take — that the player fills by cross-referencing scattered clues. Every cell is a claim; the solved board is the answer.

**Player fantasy / why it's fun.** You are the one who *figured it out*. Not the game feeding you the next step — you, holding three half-facts, snapping the fourth into place. The pull is the click of a chain closing: "the boatswain wore the red cap, the red cap was seen at the mast, therefore…" The board is the trophy of your own reasoning.

## The brief

**Obra Dinn but on a solvable grid** — the whodunit reasoning loop, but the state is a checkable matrix instead of a portrait gallery, so the game can *machine-prove* the mystery is deducible before you ship it. Twist vector: **structure** (see [[process-the-twist]]).

Three concrete "X but Y" seams to pick from:

- **Obra Dinn but you never brute-force** *(constraint)* — the board only accepts a full, self-consistent assignment; no partial-credit guessing, so the win is the deduction, not the poke.
- **A logic-grid puzzle but the clues are diegetic** *(tonal)* — instead of "Alice is not next to the plumber," clues are testimony, ledger entries, a bloodstain's angle. Same constraint engine, mystery-novel skin.
- **Papers, Please but the ruleset is the clue set** *(mechanic-swap)* — you cross-check documents against each other rather than a fixed manual; contradictions *are* the deductions.

## Anchors

- **[[anchor-return-of-the-obra-dinn]]** — steal the **loop** (observe a frozen scene → note details → deduce identity+fate → the game confirms a *set* at a time, never one guess). Steal the deferred-confirmation cadence. Drop the manor's period skin; keep the reasoning grip.
- **[[anchor-papers-please]]** — steal the **contradiction hunt**: the fun is spotting two facts that can't both be true. Its verdict-under-a-ruleset loop is the same muscle your board exercises.
- **[[anchor-disco-elysium]]** — reference only for how clue *voice* carries tone; you are not building its branching. Borrow diegetic-clue flavor, not dialogue trees.

## Genre + systems pulled

Link, don't restate — open each module for the real mechanics.

| Module | What it contributes |
|---|---|
| [[genre-grid-puzzle]] | The **solvability spine** — pure state, one authored solution, a solver that proves reachability. This is why the mystery is provable, not vibes. |
| [[system-quests-and-objectives]] | Frames the case as **objectives** ("identify all 8 crew") so the board has a spine and a done-state. |
| [[system-inventory-and-ui]] | The **notebook** — clue log, the fillable grid, contradiction highlights. The board *is* the UI; treat it as first-class. |
| [[system-map-and-navigation]] | Optional: if clues live in space, a scene to walk/scrub. Skip for a pure-armchair case. |
| [[system-onboarding]] | Teach the *grammar* of a clue before the hard case — one gimme deduction that can only resolve one way. |

## The twist applied

The **structure** vector: keep Obra Dinn's reasoning verbs, swap its representation from a hand-authored fate list to a **constraint grid**. That single swap buys you the thing Obra Dinn achieves by hand — a mystery that is *actually solvable by logic alone* — as a machine-checkable property. See [[process-composition]] for how anchor-loop + genre-spine compose.

## The 3 pillars

1. **Reason, not guess.** Every correct cell must be *forced* by clues the player has. If a value can only be found by trying it, that's a bug, not a puzzle. Guard against [[antipattern-guess-the-designer]] and [[antipattern-false-depth]].
2. **Verified-solvable.** Before ship, a solver proves the case reaches its unique solution from the given clues — and (harder) that no *other* assignment satisfies them. Uniqueness is the whole game. This is [[genre-grid-puzzle]]'s hard gate.
3. **Trust the player.** No hint arrows, no "you're getting warmer." Confirm in *sets* (Obra Dinn's rule of three), let wrong reasoning sit until the player catches it. This is [[pattern-fairness-and-trust]] made literal: the game is honest, so it can afford to be silent.

## Scope & first playable

Cut to the smallest thing that proves the loop. **One case. One board. One solver.**

- **State (pure):** a grid — N unknowns × their candidate values — plus a set of clue-constraints. Keep it a plain data structure so it hashes and replays deterministically.
- **Clues (5–8):** each a machine-readable constraint (`X ≠ red`, `if A then B`, `exactly one of {…}`). Author the *prose* separately; the logic is what the solver reads.
- **Board UI:** the notebook grid, click-to-assign, contradiction flagged, a **Submit** that checks the full assignment. No per-cell "correct?" — that leaks the answer.
- **The proof (do this first, not last):** run a solver over the clue set. It must (a) reach the intended solution and (b) confirm it's the *only* one. If it finds a second solution, add a clue; if it can't reach yours, a clue is too weak. Ship nothing until green.

**First-playable smell test:** hand the case to someone cold. If they solve it by reasoning aloud, you have a game. If they solve it by clicking every combo, you have a lookup table — tighten the clue set.

Stretch, only after the core is green: a second case that reuses the engine, a scene to scrub for clues ([[anchor-return-of-the-obra-dinn]]'s frozen tableau), timed testimony. Resist [[antipattern-second-system]] — the board is the game.

## Handoff

A design isn't done until it names its proofs. See [[process-refine-and-handoff]].

- **Solver proof** → **docs/FUN.md#1-·-grid-puzzle**. The case must be provably solvable *and* uniquely so; the grid-puzzle gate is exactly this check. This is pillar 2, mechanized.
- **Fairness / trust** → verify no cell is guess-only; every deduction is forced. The failure mode to assert *against* is [[antipattern-guess-the-designer]] — if a tester's correct answer came from luck, the case fails.
- **Onboarding** → confirm the first deduction can only resolve one way, so the player learns the clue grammar before the hard case ([[system-onboarding]]).

## Composes with

- [[genre-grid-puzzle]] — the solvable-state spine; without it, "deduction" is just guessing with extra steps.
- [[anchor-return-of-the-obra-dinn]] — the reasoning loop and set-confirmation cadence to steal wholesale.
- [[system-inventory-and-ui]] — the notebook/board is the primary surface; design it first, not last.
- [[pattern-fairness-and-trust]] — the license to withhold hints depends on the game being provably honest.
- [[system-quests-and-objectives]] — turns "solve the mystery" into a spine of checkable objectives.

## See also

- **docs/FUN.md §1 · Grid Puzzle** — the solver-proof gate this recipe hands off to.
- [[antipattern-guess-the-designer]] · [[antipattern-false-depth]] — the two failure modes a deduction board most often collapses into.
- `examples/sokoban/` — the reference for the pure-logic / view split you'll mirror: rules in a pure module, the board rendered from it.
- [[process-composition]] · [[process-the-twist]] — how this recipe was assembled, so you can assemble your own.

---
id: genre-grid-puzzle
title: Grid Puzzle (Sokoban-like)
kind: genre
tags: [puzzle, sokoban, grid, solver, deterministic, turn-based, knot]
summary: The solvable knot — a grid of pieces where the obvious move is a trap and the real line is a small proof you feel yourself find.
use-when: Designing a turn-based, perfect-information puzzle whose fun is out-thinking a hand-authored or generated board.
composes-with: [system-onboarding, system-difficulty-and-dda, system-procgen-design, system-save-and-checkpoint, system-mastery-curve]
anchors: [anchor-baba-is-you, anchor-into-the-breach]
verify-with: docs/FUN.md#1--grid-puzzle-sokoban
---

# Grid Puzzle (Sokoban-like)

**What it is.** A finite grid, a handful of pieces, and one legal-move rulebook.
Every board is a **knot**: a state you must untie in a fixed number of reversible
moves. No timer, no dexterity, no hidden information — only the gap between the
move that looks right and the move that is.

**Player fantasy / why it's fun.** *"I saw it."* The click of a solution
resolving in your head one beat before your hands move. The puzzle never lies to
you; when you lose you were wrong, and being wrong is the whole pleasure.

## Pillars

1. **Perfect information, imperfect intuition.** Everything is on the board. The
   difficulty is entirely in the player's head — the trap is a *plausible* wrong
   line, not a hidden fact.
2. **Reversibility.** Undo and restart are free and instant. The player
   experiments *toward* the answer; punishment is boredom, never lost progress.
3. **The mechanic is the content.** One clean rule, milked for every
   consequence. New pieces teach; they don't clutter. (Baba Is You is the
   extreme: the *rules themselves* are pushable blocks.)

## The loop stack

| Scale | The loop |
|---|---|
| **Moment** | Push a block one tile. Read the new board. Feel the knot loosen or tighten. |
| **Encounter** | One level: form a hypothesis → test a line → hit a dead end → *see* the real line → execute. The "aha" is the encounter payload. |
| **Session** | A ramp of 8–15 levels that each introduce or recombine one idea; the last is the boss knot. |
| **Meta** | Level packs, star ratings for move-optimality, optional "hard mode" variants of solved boards. |

## Essential systems

| System | Why it's needed |
|---|---|
| [[system-onboarding]] | Teach each mechanic by *forcing* its use in a trivially-solvable board before it appears in a hard one. No text tutorials. |
| [[system-difficulty-and-dda]] | The pack is a difficulty curve; sequence levels so each isolates one new idea, then combines. |
| [[system-save-and-checkpoint]] | Undo + restart are the genre's grace (FUN.md law 5); per-level completion + best-move-count persist. |
| [[system-procgen-design]] | Optional: generate-and-solve to mass-produce boards; every generated board must be solver-proven winnable. |
| [[system-mastery-curve]] | Move-optimal solutions and hidden variant boards give experts a ceiling above "just solved it." |

## Content & difficulty model

- **One idea per level, then combine.** Introduce piece X in a board where *only*
  X matters. Two levels later, cross X with Y. The boss is X × Y × Z.
- **Difficulty = branching factor × depth of the trap.** A hard board isn't a
  bigger board; it's a board where the greedy first move is *wrong* and the real
  line is 3 moves deeper than it looks.
- **Machine-proven winnable, always.** Every level ships with a solver
  (BFS/A* over `Puzzle<State, Move>`) proof. An unwinnable board is unshippable —
  see FUN.md §1. Generated boards are filtered by the same solver; tune the
  generator's *difficulty* on solver depth, not by eye.
- **Author dead-ends on purpose.** The best boards let the player reach a
  *stuck-but-not-lost* state — reachable, un-winnable, obvious in hindsight. That
  near-miss is where the lesson lands.

Reference wiring: [`examples/sokoban`](../../examples/sokoban) — the canonical
logic/view split, a pure `logic.ts` `Puzzle` module driving a scene-tree view;
[`examples/gravewell`](../../examples/gravewell) and
[`examples/seamfold`](../../examples/seamfold) for two more grid-logic variants.

## Signature-mechanic seeds

Each is an "X but Y" ([[process-the-twist]]) — bend the *rule*, since the rule is
the content.

- **Sokoban but the boxes are you** — push a block and *your* avatar is what
  moves; you shove yourself around the knot. (mechanic-swap)
- **Sokoban but gravity picks a direction each turn** — every move re-drops the
  board; you plan the settle, not just the push. (mechanic-swap)
- **Sokoban but two avatars share one input** — every arrow moves both; the level
  is solved only when their mirrored paths both land. (constraint)
- **Sokoban but the goal tiles move when you do** — the target is a second puzzle
  chasing the first. (structure)
- **Sokoban but undo is a piece you place** — a finite pool of rewinds becomes a
  resource you spend inside the puzzle, not a free safety net. (constraint)

## Common pitfalls

- **Trial-and-error instead of insight.** If brute-forcing every push beats
  thinking, the board is a search, not a puzzle. Keep boards small enough that the
  *thinking* is faster than the flailing.
- **Read-the-designer's-mind moves.** A required move with no on-board reason is
  unfair. Every step of the real line must be *justifiable from the board alone*.
- **Undo that costs.** Punishing experimentation kills the loop. Undo/restart are
  free, instant, and unlimited — pillar 2.
- **Difficulty by fiddliness.** A 40×40 board isn't hard, it's tedious. Depth
  comes from the trap, not the tile count.
- **Skipping the solver.** Hand-authoring "I'm pretty sure this is solvable" ships
  dead levels. Prove every one — FUN.md §1.

## Anchors

- [[anchor-baba-is-you]] — the mechanic *is* the content, pushed to its limit.
- [[anchor-into-the-breach]] — perfect-information reasoning; a telegraphed board
  you solve, not react to.

## Verify

Prove it with **[FUN.md §1 · Grid puzzle](../../docs/FUN.md#1--grid-puzzle-sokoban)** —
solver over `Puzzle<State,Move>` for every level; replay determinism; undo/restart
as grace. Design the knot here; prove it solvable there.

## Composes with

- [[system-onboarding]] — the pack *is* the tutorial; teach by forced use.
- [[system-procgen-design]] — generate-and-solve for volume; solver-gated.
- [[pattern-mastery-and-flow]] — the ramp must keep challenge just above intuition.

## See also

- [`examples/sokoban`](../../examples/sokoban) — the reference logic/view split.
- [`docs/FUN.md §1`](../../docs/FUN.md#1--grid-puzzle-sokoban) — the proof playbook.
- [[process-the-twist]] — bend the rule; the rule is the game.

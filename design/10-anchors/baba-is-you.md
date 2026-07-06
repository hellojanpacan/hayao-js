---
id: anchor-baba-is-you
title: Baba Is You
kind: anchor
tags: [puzzle, rule-manipulation, self-reference, sokoban, systemic, emergence, grid]
summary: A puzzle where the rules are physical objects on the board — push the word blocks and you rewrite what "you," "win," and "wall" even mean.
use-when: Designing a puzzle whose depth comes from the player editing the ruleset itself, so the mechanic and the content are the same thing.
composes-with: [genre-grid-puzzle, pattern-emergence, system-onboarding, system-mastery-curve]
anchors: [anchor-baba-is-you]
verify-with: docs/FUN.md#1-·-grid-puzzle-sokoban
---

# Baba Is You

**What it is.** A Sokoban-like grid puzzle where the *rules are blocks you can
push*. `BABA IS YOU`, `FLAG IS WIN`, `WALL IS STOP` — break a sentence apart
and the law it stated stops applying; form a new one and reality reorganises
around it.

**Player fantasy / why it's fun.** *I am not solving the puzzle — I am
rewriting it.* The pull is **the mechanic IS the content**: there's no new
mechanic per level, just deeper implications of one idea. Every "aha" is the
moment you realise you can make *lava is win*, or *you* the wall, and the
whole board's meaning inverts.

## Design DNA

Make **the rules first-class objects** in the simulation. Instead of
hard-coding "walls stop you," the game reads sentences of word-blocks each
tick and *derives* its rules from the current board. Because the player can
push those word-blocks, **the ruleset is mutable at runtime** — and the entire
game is the emergent space of what you can make true. One system, endlessly
recombined, generates hundreds of puzzles without ever adding a new verb.

The architectural move is the whole trick: **data-drive the laws instead of
coding them.** A conventional game hard-codes `if (tile.isWall) block()`. Baba
stores `WALL IS STOP` as three movable objects and, each step, re-parses the
board into an active ruleset that the sim obeys. The instant the *rule itself*
is a thing you can push, the design surface explodes — every law becomes
editable, including the ones a designer would normally hold sacred (what "you"
are, what "winning" means). The content isn't levels bolted onto a mechanic;
the content *is* situations that reveal what the one mechanic permits.

This is **emergence as the whole game**: depth comes not from breadth of
mechanics but from the second-order interactions of a tiny, self-referential
rule engine. A handful of nouns and properties yields a puzzle space no
designer could enumerate — which is the efficiency: near-infinite content from
almost no content.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Rules are data on the board, re-read each tick** | The sim *derives* its laws from `NOUN IS PROPERTY` sentences rather than hard-coding them — so pushing a word changes physics. This is the entire trick. |
| **Self-reference (`IS YOU`, `IS WIN`)** | The player can move *win itself*, or become a new object. The win condition and the avatar are editable — nothing is sacred. [[pattern-emergence]]. |
| **One mechanic, deepening implications** | No new verbs per level; difficulty is *realising what the one system permits*. Content = mastery of the rule engine. [[system-mastery-curve]]. |
| **Sokoban substrate + undo/restart** | Turn-based grid pushing with full undo — puzzle grace, so wild experimentation is free. FUN.md law 5. [[genre-grid-puzzle]]. |
| **Every level is solver-provable** | A pure `Puzzle<State, Move>` state (board + active rules) means every level is machine-proven winnable — unwinnable = unshippable. FUN.md truth. |
| **Teach-by-discovery onboarding** | Early levels *are* the tutorial — you learn the rule engine by breaking one sentence at a time. [[system-onboarding]]. |
| **Combinatorial state, tiny alphabet** | A handful of nouns × properties yields a vast puzzle space from almost no content. [[system-procgen-design]] (design-space, not runtime). |

## What to steal

- **Promote the rules to editable game objects.** Store laws as data the sim
  reads each step, not as code. The moment the player can *move a rule*, you
  have a whole genre. This is the master idea.
- **Allow self-reference:** let the player edit "you," "win," "the goal." The
  most memorable puzzles come from nothing being fixed.
- **Get infinite content from one deep system.** Don't add mechanics; add
  *situations that reveal implications*. The mechanic is the content — that's
  the efficiency.
- **Keep the Sokoban substrate + undo/restart** so experimentation is
  consequence-free (FUN.md law 5).
- **Prove every level with a solver** over the pure state (board + active
  rules) — winnability is CI, not a playtest. Because a self-referential rule
  engine can trivially author *unwinnable* configurations, a machine proof
  isn't optional here; unwinnable = unshippable (FUN.md truth).
- **Front-load the teaching into the levels themselves.** No separate
  tutorial: the first rooms *are* the onboarding, each isolating one
  implication of the rule engine (break a sentence, form a new one). Discovery
  replaces instruction. See [[system-onboarding]].

## What's just theme (drop it)

- **Baba the sheep and the crayon art.** Fully cosmetic.
- **The specific nouns/properties.** *A small vocabulary of subjects ×
  predicates* is structural; "ROCK / KEKE / FLAG" is flavour.
- **The overworld map.** A level-selection wrapper, not the loop —
  [[system-session-structure]].
- **English-word framing.** The *sentence-as-rule* structure could be icons,
  runes, or colours; the readability is what matters —
  [[pattern-readability]].

## Composes into

- [[genre-grid-puzzle]] — its substrate; Baba is the rule-manipulation
  variant.
- [[pattern-emergence]] — the definitive example of second-order, few-pieces
  depth.
- [[system-onboarding]] — teach-by-discovery of a single deep system.
- [[system-mastery-curve]] — difficulty as *understanding*, not execution.

## Twist seams

- **Baba Is You but real-time** *(structure)* — rules re-read every frame
  while things move; you rewrite physics *during* an action sequence. Bends
  the turn-based substrate toward reflex.
- **Baba Is You but two players edit a shared ruleset** *(perspective)* — one
  can make `WALL IS PUSH` while the other needs it `STOP`; cooperation *and*
  sabotage live in the sentences. Feeds [[system-coop-and-competition]].
- **Baba Is You but the theme is bureaucracy — rules are laws you amend**
  *(theme)* — same self-referential engine, recolored as legislation; every
  puzzle is "find the loophole." Theme that *reinforces* the mechanic instead
  of decorating it.
- **Baba Is You but you write the rules from a limited word-bank you draft**
  *(mechanic-swap)* — instead of pushing pre-placed words, you *earn and
  spend* rule-tokens; the puzzle becomes "what's the cheapest sentence that
  wins." Pulls in [[genre-deckbuilder]] economy over the free-form parser.

## See also

- [[genre-grid-puzzle]] · [[pattern-emergence]] · [[system-onboarding]] ·
  [[system-mastery-curve]]
- `docs/FUN.md#1-·-grid-puzzle-sokoban` — `Puzzle<State,Move>` solver + replay
  determinism.
- `examples/sokoban/` — the logic/view-split reference this substrate builds
  on.

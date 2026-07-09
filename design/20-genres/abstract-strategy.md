---
id: genre-abstract-strategy
title: Abstract Strategy / Board Game
kind: genre
tags: [minimalist, perfect-information, elegance, tactics, depth]
summary: Deep play from few, rigid rules — often perfect-information; the whole game is the interaction of a handful of pieces.
use-when: You want maximum depth from minimum parts, board-game clean.
composes-with: [anchor-mini-metro, anchor-into-the-breach, pattern-restraint-and-negative-space, genre-tactics]
anchors: [anchor-into-the-breach, anchor-mini-metro]
verify-with: design/FUN.md#12-·-tactics
---

**What it is.** A game whose entire depth lives in the interaction of a few rigid rules over a small readable state — Go, Chess, Hex, Onitama. No content treadmill, no hidden numbers: **the rules are the game**, and mastery is finding the tree they hide.

**Player fantasy / why it's fun.** You saw three moves further than your opponent. The pull is *legible mastery* — every loss is your fault, every win is earned, and the ceiling is bottomless because the branching, not the art, is the content.

## Pillars (exactly 3)

1. **Few rules.** The whole ruleset fits on a card. Every rule you add is a lifetime tax on every future player — spend them like they cost blood.
2. **Deep interaction.** Depth comes from pieces *combining*, not from piece count. Two rules that multiply beat ten that add. See [[pattern-emergence]].
3. **Legibility.** The board is fully readable at a glance; a consequence is traceable to its cause. Perfect information means the player owns every outcome. See [[pattern-readability]].

## The loop stack

| Layer | Beat |
|---|---|
| **Moment** | Read the board, weigh two candidate moves, commit. |
| **Encounter** | A single match: opening → midgame tension → endgame convergence to a won/lost position. |
| **Session** | Best-of-N, or a ladder of AI/human opponents; a puzzle set of authored positions. |
| **Meta** | Opening theory, learned heuristics, personal rating climbing — mastery *outside* the code. See [[system-mastery-curve]]. |

## Essential systems

- [[system-combat-model]] — the piece interaction *is* the combat model; define capture/block/convert once, precisely.
- [[system-counter-systems]] — every strong line must have a reply, or it collapses into a solved dominant strategy.
- [[system-difficulty-and-dda]] — AI ply depth or opponent ladder scales pressure; puzzle mode authors it.
- [[system-onboarding]] — the first match must teach the rule by making you *use* it, not by reading it. See [[system-telegraphs]].
- [[system-encounter-design]] — for a puzzle/campaign variant, each position is a hand-set encounter with one intended solution.

Rules live in pure, deterministic logic — a single move-application + legal-move function, seedable for any AI rollout — the way `examples/sokoban/` splits pure rules from view. Study `sandboxes/` for a single mechanic in isolation before you wire the board.

## Content & difficulty model

- **No content, only depth.** A shipped abstract has one board and a rulebook; longevity is the game tree, not new levels.
- **Difficulty is the opponent, not the rules.** Scale search depth, add an opponent ladder, or gate authored puzzles by required look-ahead — never buff the enemy's stats. See [[system-difficulty-and-dda]] and [[pattern-mastery-and-flow]].
- **Authored puzzle mode** is the low-cost content lever: hand-set positions with a proven solution turn one ruleset into a campaign. Machine-prove each is winnable, the way the project proves every puzzle level.
- **Symmetry vs asymmetry.** Mirror sides (Chess, Go) are the purest test of skill; small [[system-faction-asymmetry]] (different piece sets per side, à la Onitama's card hands) adds replay at the cost of balance work.

## Signature-mechanic seeds

- **Abstract strategy but the board grows as you play** (structure) — you place the tile you'll later stand on; the arena is authored by both players' history. See [[mechanic-stack]], [[pattern-emergence]]. Reference: Tsuro / Kingdomino spatial growth.
- **Perfect-info but one hidden piece per side** (constraint) — 90% of the state is open; each player conceals exactly one piece's identity, so deduction rides on top of pure tactics. Reference: Stratego, but inverted — hide one piece instead of the whole army.
- **Shared clock, simultaneous commit** (input) — both players pick moves blind, then reveal and resolve at once, [[anchor-into-the-breach]]-style previewed consequence turning perfect info into a mind-game.
- **One rule flips mid-game** (state) — a threshold (turn count, pieces captured) rewrites one rule, so opening theory can't carry into the endgame. See [[mechanic-gravity-flip]].
- **Wordless deduction board** (constraint) — no combat at all; the win is inferring hidden placement from legible tells, [[anchor-return-of-the-obra-dinn]] logic on a grid. See [[recipe-detective-deduction-board]].

## Common pitfalls

- [[antipattern-solved-metagame]] — one line dominates and the tree collapses; the whole genre lives or dies here. Playtest for a single best opening and break it.
- [[antipattern-boring-optimal]] — the correct move is obvious and joyless; if the optimal play is never interesting, add tension, don't add rules.
- [[antipattern-false-depth]] — many pieces, no interaction; complexity mistaken for depth. Cut pieces until each one earns its rule. See [[pattern-restraint-and-negative-space]].
- [[antipattern-fake-choice]] — branches that all lead to the same place. If two moves never diverge in outcome, delete one.
- [[antipattern-rng-frustration]] — randomness that decides the game instead of seeding it; keep chance in setup, not in resolution. See [[pattern-fairness-and-trust]].
- [[antipattern-decision-paralysis]] — a legal-move space so wide the player can't read it; legibility is a pillar, guard it.

## Anchors

- [[anchor-into-the-breach]] — perfect information as a design *feature*: every enemy telegraphs its move, so the puzzle is the board state, not hidden dice. The gold standard for legible, solvable tactics.
- [[anchor-mini-metro]] — minimalist abstract clarity: a whole system read from clean geometry, escalating pressure from a tiny ruleset. The look and restraint an abstract wants. See [[world-aesthetic-direction]].
- Also study: Chess, Go, Hex, Onitama, Hive, Santorini — each proves depth from a card of rules.

Neighbors: [[genre-tactics]] (same tactical core, more content and theme), [[genre-grid-puzzle]] (single-player authored positions), [[genre-deckbuilder]] (abstract interaction with a content axis bolted on).

## Verify

Prove the tactics land against `design/FUN.md#12-·-tactics` — depth that resists optimization, a readable consequence for every move, escalating pressure. The rules module is pure and deterministic, so an AI rollout is your first anti-solve check: if a shallow search finds a dominant line, the design is broken before the art. See [[pattern-fairness-and-trust]].

---
id: genre-match3
title: Match-3
kind: genre
tags: [match3, cascade, tile-swap, puzzle, board, combo, casual, choreography]
summary: Swap-adjacent tile matcher where the fun is the cascade you triggered — one swap, a chain reaction the board runs for you.
use-when: Designing a tile-swap/board-clear game where a single legal move should bloom into a satisfying, deterministic chain.
composes-with: [system-reward-schedules, system-difficulty-and-dda, pattern-juice-choreography, pattern-feedback-loops]
anchors: [anchor-peggle, anchor-balatro]
verify-with: docs/FUN.md#13--match-3
---

# Match-3

**What it is.** A grid of coloured tiles. You **swap two adjacent tiles**; any line
of 3+ clears, tiles above fall, and new clears may form — a **cascade** the board
resolves on its own. One input, a bloom of consequence.

**Player fantasy / why it's fun.** *"I found the one move that made the whole board
go off."* The pull is authored luck: you set up the domino, the game topples it in a
shower of pops. Fun is the **cascade you triggered**, not the cascade you watched.

## Pillars

1. **The swap is the whole decision.** Everything downstream — cascade, combo,
   special tiles — is *consequence*, not input. Depth lives in reading the board,
   not in dexterity.
2. **The board is always fair and always alive.** No pre-made matches at deal, a
   legal move always exists, and a dead board reshuffles. The player never loses to
   the deal.
3. **Consequence is choreographed.** The sim resolves instantly and deterministically
   to a *script*; the view animates that script (the purest form of the cosmetic
   rule). The juice is earned by the move, timed to the chain.

## The loop stack

| Layer | The beat |
|---|---|
| **Moment** | Pick a swap → watch the cascade the board runs. |
| **Encounter** | A board/level: hit a goal (score, clear jelly, drop an anchor) within a move or time budget. |
| **Session** | A run of boards; difficulty ramps via goal, not rule change. |
| **Meta** | Level map, stars, boosters/unlocks, daily board. |

## Essential systems

| System | Why this genre needs it |
|---|---|
| [[system-reward-schedules]] | Cascades and special-tile creation are variable-ratio payoffs; the "number goes up" surge is the retention engine. |
| [[system-difficulty-and-dda]] | Difficulty is the *goal* tuned to measured bot win-rate — a distribution, not a rule tweak (see Content model). |
| [[pattern-juice-choreography]] | The pop/fall/combo chain is the product; feel is timed to the deterministic script. |
| [[pattern-feedback-loops]] | Cascades that spawn special tiles that trigger cascades — bounded so a lucky board doesn't auto-win. |
| [[system-onboarding]] | Teach swap → match → cascade → special tile by doing, one mechanic per early board. |
| [[system-collectibles]] | Stars, level completion, cosmetic boards — the optional pull past "cleared". |

## Content & difficulty model

- **Winnability is a distribution, not a switch.** Run a greedy matcher bot over N
  seeds; read its win-rate; **tune the GOAL to the bot**, never the mechanics to a
  fixed goal. A level is "hard" because the target sits high on the bot's curve.
- **Board fairness is a connectivity proof.** Deal with no existing matches; assert a
  legal move exists every turn; reshuffle when none does. This is the genre's
  mechanical truth — prove it, don't eyeball it.
- **Score accounting is an invariant.** `score === Σ (cleared × base × combo)`. One
  pure scorer feeds sim, bot, tests, and the on-screen counter — same seam as the
  city-builder's exposed score ([[genre-city-builder]]).
- **Ramp by objective family:** score → clear-the-jelly → drop-the-anchor → limited
  moves → blockers. New *constraint*, same swap.

## Signature-mechanic seeds

- **Match-3 but the board is a poker hand** — clears score as hands, jokers modify
  multipliers (mechanic-swap toward [[anchor-balatro]]; the cascade *builds* the hand).
- **Match-3 but gravity rotates** — swap the fall direction as a move; setups you
  hold across a turn (mechanic-swap; the board becomes 4-directional).
- **Match-3 but every clear is a step in a duel** — cascades power attacks against a
  telegraphing foe; it's a rhythm-of-turns fight over a board (structure; pairs with
  [[genre-rhythm]]'s "input-legality filter over a turn-based game").
- **Match-3 but you place, not swap** — deal tiles onto the grid Tetris-style; the
  bend moves the decision from finding a match to *engineering* one (mechanic-swap).
- **Match-3 but tiles are a garden** — matched crops mature instead of vanishing; a
  tonal + theme bend toward [[genre-farming-sim]]'s gentle solvency.

## Common pitfalls

- **Dealing pre-matches.** Free clears at deal cheapen the swap and desync score;
  the fairness proof exists to forbid this.
- **Tuning mechanics to a fixed goal.** Leads to unwinnable or trivial boards. Tune
  the goal to the bot's measured curve instead.
- **View drives sim.** Animating the cascade as it "decides" makes replay lie and
  breaks `world.hash()`. Sim resolves to a script; view is a `cosmetic` observer.
- **Runaway cascades.** Unbounded chain-of-specials means a lucky board auto-wins.
  Cap combo scaling so skill still separates from luck.
- **Special-tile soup.** Too many special types muddies the read. Introduce one per
  objective family via [[system-onboarding]].

## Anchors

- [[anchor-peggle]] — maximal juice on a single trivial input; variable-ratio reward;
  the "one shot, watch it pay off" fantasy the cascade shares.
- [[anchor-balatro]] — the score-multiplier "number goes up" surge; the direct
  reference for the poker-hand and joker seeds above.

## Verify

Board fairness sweep, score-accounting invariant, greedy-matcher hit-rate, golden
session → **[docs/FUN.md §13 · Match-3](../../docs/FUN.md#13--match-3)**. Design the
cascade here; prove fairness and the score invariant there.

## Composes with

- [[system-reward-schedules]] — the cascade payoff schedule that keeps a session pulling.
- [[pattern-juice-choreography]] — the pop/fall/combo choreography timed to the script.
- [[genre-rhythm]] · [[genre-farming-sim]] — natural blend targets for the seeds above.

## See also

- [docs/FUN.md §13](../../docs/FUN.md#13--match-3) — mechanical truth + verify recipe.
- [docs/JUICE.md](../../docs/JUICE.md) — feel gates for the cascade choreography.
- [`sandboxes/`](../../sandboxes/) — reach for the particles/tweens lab to wire the
  pop-and-fall feel in isolation before building a whole board.

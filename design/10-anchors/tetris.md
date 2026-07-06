---
id: anchor-tetris
title: Tetris
kind: anchor
tags: [endless, mastery, single-verb, falling-block, tuning, flow, difficulty-ramp]
summary: The perfectly-tuned single verb — place falling tetrominoes to clear lines, forever, with a difficulty that rises with your own success.
use-when: Designing for pure, endless mastery on one tight mechanic where the score curve and the skill ceiling ARE the game.
composes-with: [genre-grid-puzzle, system-mastery-curve, system-difficulty-and-dda, pattern-mastery-and-flow]
anchors: [anchor-tetris]
verify-with: docs/FUN.md#1-·-grid-puzzle-sokoban
---

# Tetris

**What it is.** Seven shapes fall one at a time; rotate and slot them so rows
fill and clear. There is no end, no story, no unlock — just a board, a next
piece, and a speed that climbs the longer you last.

**Player fantasy / why it's fun.** *One more line.* The pull is **flow through
mastery of a single verb**: the rules fit on a napkin, but the skill ceiling
is bottomless, and the game tightens exactly as fast as you improve. It is the
cleanest proof that depth doesn't need breadth.

## Design DNA

Take **one verb** — orient-and-drop — and tune it until it's perfect, then let
*difficulty rise with the player's own success*. Every cleared line speeds the
fall; skill buys you time that the game immediately taxes back. There's no
meta, no content treadmill: the loop is so tight and so well-tuned that
repetition *is* the reward. The randomiser (a bag of 7) keeps it fair; the
failure state (stack to the top) is always your doing.

The discipline here is *subtraction*. Tetris is the proof that **depth doesn't
require breadth** — that a single verb, tuned to perfection, out-lasts games
with a hundred mechanics. Everything that isn't the drop was cut: no story to
gate the loop, no unlocks to pace it, no second verb to dilute the tuning
budget. All of that budget goes into *feel* — the exact frames of lock delay,
the DAS charge, the gravity curve, the rotation kicks — because when there's
one verb, the game *is* its feel.

This is the ur-example of **easy to learn, impossible to master** — the entire
game is a mastery curve with the fat trimmed off. And the ramp is self-tuning:
because speed scales with *your* clears, the game meets every player at their
edge without a difficulty menu. The flow channel holds for a beginner and a
world-record holder using the identical rule.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **One verb, perfectly tuned** | Orient + drop is the whole moveset. All design budget goes into *feel* — DAS, lock delay, gravity — not breadth. [[system-mastery-curve]]. |
| **Success raises difficulty** | Clearing lines speeds the fall; the game auto-escalates to match you, so flow holds across skill levels. FUN.md law: the ramp is the design. [[system-difficulty-and-dda]]. |
| **Self-inflicted failure** | You lose by stacking to the top — always legibly your mistake. No cheap deaths, so retry is instant appetite. |
| **Bag randomiser** | The 7-bag guarantees fairness (no piece drought) while staying unpredictable — controlled randomness. All rng via `world.rng` (FUN.md law). [[system-procgen-design]]. |
| **The next-piece queue** | Showing what's coming turns reflex into *planning* — a one-cell telegraph that opens the skill ceiling. [[system-telegraphs]]. |
| **Lock delay + soft/hard drop as grace** | A frame window to slide/rotate before a piece sets — the grace canon that makes fast play fair. FUN.md law 5. [[system-grace]]. |
| **The score as the whole meta** | No progression system; the leaderboard number is the entire long-term goal. [[system-collectibles]] (score-as-goal). |

## What to steal

- **Pick one verb and spend everything on its feel.** Lock delay, buffer,
  gravity curve, rotation system — the tuning *is* the game. Depth without
  breadth.
- **Let difficulty rise with success.** Tie the ramp to the player's own
  score/clears so flow self-corrects across all skill levels — no difficulty
  menu needed.
- **A fair randomiser (bag, not pure-random).** Guarantee no droughts so
  failure is always skill, never luck. Route it through `world.rng`.
- **A lookahead queue** to convert reflex into planning and lift the ceiling.
  Showing the next piece (or several) is a one-cell telegraph that lets skilled
  players *pre-solve* placements — depth added with zero extra rules. See
  [[system-telegraphs]].
- **Make the failure state self-inflicted and instantly re-enterable.** Cheap,
  legible death is the engine of "one more go" — you always know *why* you
  lost, and you're one keypress from trying again.
- **Cut everything that isn't the verb.** Resist the urge to bolt on story,
  meta, or a second mechanic; every addition steals tuning budget from the one
  thing players actually feel. Scope discipline is the design.

## What's just theme (drop it)

- **The Soviet / cosmonaut branding.** Pure decoration.
- **The specific 7 tetrominoes.** *A small alphabet of shapes with a fair bag*
  is structural; the exact set is tuning — a hexagonal or pentomino variant
  obeys the same DNA.
- **The music (Korobeiniki).** Iconic, but the loop is silent-viable — it's a
  [[pattern-juice-choreography]] layer, not a mechanic.
- **The board being 10×20.** Dimensions are tuning, not law.

## Composes into

- [[genre-grid-puzzle]] — shares the grid-and-piece substrate (though endless,
  not solved-level).
- [[system-mastery-curve]] — the purest "easy to learn, hard to master"
  exemplar.
- [[system-difficulty-and-dda]] — success-driven auto-escalation.
- [[pattern-mastery-and-flow]] — the flow channel held by a self-tuning ramp.
- [[system-grace]] — lock delay / drop buffering.

## Twist seams

- **Tetris but the pieces are your deck** *(mechanic-swap)* — you
  draft/upgrade which tetrominoes can appear; the bag becomes a build. Pulls
  in [[genre-deckbuilder]] depth over the pure verb.
- **Tetris but two boards share a rising garbage line** *(perspective)* —
  clears send junk to a rival; the single-verb duel becomes competitive. Feeds
  [[system-coop-and-competition]].
- **Tetris but gravity is a resource you spend** *(constraint)* — you *choose*
  when the piece falls, and hesitation costs a meter; converts reflex into
  economy. Bends the auto-fall that defines the genre.
- **Tetris but tonal — you're stacking to *build*, not to clear** *(tonal)* —
  filling rows raises a tower/city that persists instead of vanishing; the
  same orient-and-drop verb, recolored from anxiety-management into gentle
  construction. Pairs with [[genre-city-builder]].

## See also

- [[genre-grid-puzzle]] · [[system-mastery-curve]] ·
  [[pattern-mastery-and-flow]] · [[system-grace]]
- `docs/FUN.md#1-·-grid-puzzle-sokoban` — determinism + replay for grid
  pieces.
- `docs/JUICE.md` — line-clear feedback (the pop that sells a good drop).

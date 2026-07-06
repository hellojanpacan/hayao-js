---
id: pattern-feedback-loops
title: Feedback Loops
kind: pattern
tags: [feedback, snowball, comeback, runaway, balance, positive-loop, negative-loop, catch-up]
summary: Positive loops snowball, negative loops correct — design which one dominates so leads stay tense, not decided.
use-when: A lead is being built (economy, kills, board control) and you must decide whether it should compound or self-limit.
composes-with: [pattern-risk-reward, pattern-pacing-and-tension, system-economy, system-difficulty-and-dda]
verify-with: docs/FUN.md#part-1-—-universal-laws
---

# Feedback Loops

**What it is.** A **feedback loop** feeds a system's output back into its own
input. *Positive* loops amplify (a lead makes the next lead easier — a snowball);
*negative* loops dampen (falling behind makes catching up easier — a rubber band).
Every game with state has both; the design question is *which one dominates, and
when*.

**Why it's fun.** A pure snowball decides the match at minute two and the rest is
a formality. A pure rubber band erases skill — why play well if the game hands it
back? The fun lives in the **tension between them**: a lead that *matters* (so
building it is exciting) but is *never safe* (so defending it stays tense). The
[[system-mastery-curve]] skill-delta only reads as fun when a good lead is real
and a comeback is possible.

## Why it works

- **A lead you can lose is a lead worth chasing.** If the snowball is uncatchable,
  the loser stops trying and the winner stops sweating — both channels of tension
  die at once.
- **Loops are the engine of [[pattern-pacing-and-tension]].** Positive loops build
  the peak; negative loops manufacture the valley (the comeback beat) without the
  designer hand-scripting it.
- **Runaway is a *bug you can prove*.** FUN.md law 2 (skill-delta) has a dark twin:
  if the *winning* strategy's margin grows without bound across a session, a
  bot-vs-bot sim shows the game deciding itself. Assert the lead is bounded, or
  that a trailing bot's win-rate stays > 0.

## Levers

| Lever | Turns the loop… | Example |
|---|---|---|
| **Loop gain** (how much output re-feeds input) | Steeper positive → faster snowball | Kill → gold → item → more kills (MOBA) |
| **Diminishing returns** | Caps a positive loop | Each territory worth less; XP curve inflates |
| **Catch-up faucet** | Adds a negative loop | Last place gets the blue shell; comeback mechanic in fighting games |
| **Loss forgiveness** | Softens the *negative* of falling behind | Bankruptcy protection; mercy income floor |
| **Tempo of payout** | *When* the lead converts | Bank-it-now vs compound-later ([[pattern-risk-reward]]) |
| **Information** | Whether players *see* the loop | An exposed "+N" lets players fight the snowball ([[pattern-readability]]) |

## Applied across genres

| Genre | Positive loop (snowball) | Negative loop (comeback) |
|---|---|---|
| **RTS** ([[genre-rts]]) | Eco lead → more army → more map → more eco | Defender's advantage; cheaper tech when behind |
| **4X / city** ([[anchor-civilization]], [[genre-city-builder]]) | Cities fund cities; the classic runaway leader | War-weariness, unhappiness, upkeep scaling |
| **Roguelite** ([[system-meta-progression]]) | Build synergy compounds mid-run | Death resets the run; meta-unlocks aid the *next* attempt, not this lead |
| **Deckbuilder** ([[genre-deckbuilder]]) | An engine deck draws into itself | Deck bloat; scaling enemy damage punishes stalling |
| **Horde survival** ([[genre-horde-survival]]) | Build growth is multiplicative | Spawn pressure is *superlinear* (FUN.md §6) — the tide is the negative loop |
| **Racing** ([[genre-racing]]) | Clean line → speed → gap | Rubber-band AI; slipstream helps the trailer |
| **Incremental** ([[genre-incremental]]) | Production buys production | Flat payback ratio (~15–25s) caps runaway (FUN.md §14) |

## Overdone when…

- **The snowball is uncatchable** — the leader wins on turn 3, the game plays out
  a decided result. Add diminishing returns or a comeback faucet.
- **The rubber band is visible and cheap** — players *see* the game handing back
  their lead and stop caring. Comeback should widen the *chance*, not erase the
  *gap* (the trailer gets a shot, not a gift).
- **Catch-up punishes winning** — if leading is strictly bad (everyone sandbags to
  avoid the target), the loop inverted. The lead must stay *desirable*.
- **Two positive loops with no damper** — economy AND military both compound with
  nothing pulling back; the match resolves before skill can express.
- **A hidden loop** — the snowball is real but the player can't *see* it building, so
  they can't fight it ([[pattern-readability]]). An exposed lead (the live "+N", the
  score bar) turns a runaway from a fait accompli into a target.

## Verify / feel-gate link

Feedback runaway is a **skill-delta pathology** (FUN.md law 2): run the intended
line *and* a trailing/null line and assert the trailing side keeps a non-zero
win-rate across a session — a lead that grows unboundedly is the bot proving the
game decides itself.

- **Bounded-lead assert.** Sim two bots; assert the leader's margin stops growing
  (or the trailer's win-rate stays > 0) — the negative loop is doing its job.
- **Economy pacing.** For incremental/economy loops, the flat payback-ratio window
  (FUN.md §14, [[system-economy]]) *is* the runaway gate — rising paybacks are an
  unchecked positive loop strangling the late game.
- **Determinism rail.** All loop randomness (catch-up rolls, blue-shell draws)
  through `world.rng` (FUN.md law 7) or the balance sim can't reproduce the runaway.

## Worked micro-example

*"An RTS that never feels decided at minute two."* The core positive loop is eco →
army → map → eco. Left ungated it's a hard snowball. Add three dampers: (1)
**diminishing returns** — each expansion costs more to defend than the last; (2) a
**defender's-advantage** negative loop — losing ground makes your remaining ground
cheaper to hold; (3) an **information** lever — expose the score so the trailer can
*aim* a comeback ([[pattern-readability]]). Now the lead is real (building it is the
game) but never safe (defending it is the *other* game). Prove it: two bots, assert
the leader's margin stops compounding and the trailer keeps a non-zero win-rate.

## Composes with

- [[pattern-risk-reward]] — *when* to bank a lead vs compound it is a risk decision
  that rides on the loop's gain.
- [[pattern-pacing-and-tension]] — loops *are* the mechanism that makes peaks and
  valleys emerge instead of being scripted.
- [[system-economy]] — faucets/sinks are the most common positive/negative loop pair.
- [[system-difficulty-and-dda]] — dynamic difficulty is a deliberately-added
  negative loop; tune it so it corrects without erasing skill.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) laws 2 & 7 — skill-delta and pure-state bots,
  the tools that turn "does it snowball?" into an assertion.
- [[anchor-civilization]] — the "one more turn" snowball-vs-comeback layering, done
  as a whole game.
- [[genre-incremental]] — the whole genre *is* a positive loop; its flat payback
  window is the cleanest example of a damper holding runaway in check.

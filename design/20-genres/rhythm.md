---
id: genre-rhythm
title: Rhythm
kind: genre
tags: [rhythm, beat, timing, window, bpm, frame-exact, music, tempo]
summary: Beat-locked timing game where the beat IS sim time and fairness is three frame-exact assertions — tight but fair.
use-when: Designing a rhythm/beat game where inputs must land in frame-honest windows and the music is an observer of the beat clock.
composes-with: [pattern-juice-choreography, system-grace, system-difficulty-and-dda, system-onboarding]
anchors: [anchor-tetris, anchor-peggle]
verify-with: docs/FUN.md#18--rhythm
---

# Rhythm

**What it is.** Actions that only count on the beat. A clock ticks in musical time; you
press inside a window around each beat, and the world answers in tempo. Whether it's
tap-the-note, move-on-beat, or fight-on-beat, the game is a legality filter over time:
right thing, right frame.

**Player fantasy / why it's fun.** *"I'm locked into the groove and the game is moving
with me."* The pull is embodied precision — the satisfaction of a press that lands
exactly, the whole system pulsing in time. Fun is **tight but fair**: a window narrow
enough to demand mastery, honest enough that a miss is always yours.

## Pillars

1. **The beat is sim time.** Pick a BPM so **one beat is an integer frame count**. The
   sim advances on the beat counter; audio is an *observer* that schedules sound off
   that counter. Never the reverse — audio-driven timing is unprovable and drifts.
2. **Fairness is frame-exact.** Three assertions define the whole feel: the input is
   accepted at the **window edge**, refused at **edge+1**, and **hammering acts once**.
   If those three hold, the game is fair; if any fails, it's a lie you can feel.
3. **Rhythm is a filter over a turn-based game.** Underneath the beat is a discrete
   turn system; the rhythm layer is a thin input-legality gate (~30 lines over a
   roguelike). Design the turn game first, then constrain *when* moves are legal.

## The loop stack

| Layer | The beat |
|---|---|
| **Moment** | Hit the window on the beat → the action fires in tempo. |
| **Encounter** | A phrase/pattern: a run of beats to nail without breaking the chain. |
| **Session** | A track/level: sustain accuracy from start to finish. |
| **Meta** | Song select, difficulty tiers, combo/score mastery, new charts. |

## Essential systems

| System | Why this genre needs it |
|---|---|
| [[pattern-juice-choreography]] | Feel IS choreography timed to the beat; every hit's flash/pop must land on the frame the sim fired. |
| [[system-grace]] | The hit window and input buffer are a grace system — accepted-inside / refused-outside, proven to the frame. |
| [[system-difficulty-and-dda]] | Difficulty = window width, note density, and tempo; the tuning dials of "tight but fair". |
| [[system-onboarding]] | Teach the window by doing on a slow, forgiving track before narrowing it. |
| [[system-mastery-curve]] | The skill ceiling is timing precision; charts must reward tighter play with higher scores. |
| [[system-procgen-design]] | Charts as content; generate/validate patterns that stay hittable at tempo. |

## Content & difficulty model

- **BPM is chosen, not found.** Solve for a BPM where a beat is an integer number of
  frames; every chart is authored on that grid. A non-integer beat makes the window
  jitter and the three frame assertions impossible to state cleanly.
- **Window honesty is the whole verify.** Assert the edge-in, edge+1-out, and
  hammer-acts-once cases frame-exactly. These three are the genre's mechanical truth —
  state them before charting a single note.
- **Foes are frozen between beats.** If the underlying turn game has enemies, prove they
  act *only* on their beats — no between-beat movement — or the rhythm read breaks.
- **Difficulty ramps three dials.** Narrow the window, raise the density, lift the tempo
  — independently, so a chart can be fast-but-forgiving or slow-but-strict. Never make a
  chart "hard" by making the window dishonest.
- **Hash-identical replay.** A beat-perfect bot must clear, and the same inputs must
  replay to an identical `world.hash()` — the beat clock makes the whole sim reproducible.

## Signature-mechanic seeds

- **Rhythm but it's a roguelike — every step is a beat** — move, attack, and dodge only
  on the pulse; the dungeon is a turn game with a metronome (structure; the literal
  "filter over a turn-based game").
- **Rhythm but you're clearing a match-3 board on tempo** — swaps only register on the
  beat, cascades resolve in time (mechanic-swap; fuses [[genre-match3]]'s cascade with
  the beat clock).
- **Rhythm but the beat is a duel** — attacks land only on-beat against a telegraphing
  foe; parries are windows (mechanic-swap; a fighting game gated by tempo).
- **Rhythm but one button, one lane, escalating tempo** — a hard constraint that makes
  pure timing the entire skill (constraint; the [[anchor-tetris]] "one perfect verb" read).
- **Rhythm but missing isn't failing, it's souring** — off-beat presses detune the music
  instead of ending the run (tonal; forgiveness as feel, pairs with [[system-grace]]).

## Common pitfalls

- **Audio-driven timing.** Scheduling the sim off sound makes it drift and unprovable;
  the beat counter drives, audio observes. This inversion is the genre's cardinal sin.
- **Non-integer beats.** A beat that isn't a whole frame count makes windows jitter and
  the fairness assertions unstateable. Choose the BPM to fix this.
- **Dishonest windows.** A window that's secretly wider/narrower than shown, or that
  accepts a hammered double-press, feels like a cheat even when the player can't name it.
- **Between-beat enemy motion.** Foes that drift off the pulse destroy the read; freeze
  them between beats and prove it.
- **Charts before the clock.** Authoring notes before the frame-exact window is proven
  bakes unfairness into every level. Prove the three assertions first.

## Anchors

- [[anchor-tetris]] — the perfectly-tuned single verb and pure endless mastery; the
  reference for the one-button, escalating-tempo bend.
- [[anchor-peggle]] — maximal juice on a precisely-timed input; the choreography-on-hit
  feel the rhythm genre lives or dies on.

## Verify

Beat-perfect bot clears; window honest to the frame; foes provably frozen between
beats; hash-identical replay → **[docs/FUN.md §18 · Rhythm](../../docs/FUN.md#18--rhythm)**.
Design the beat grid and turn game here; prove the three frame assertions there.

## Composes with

- [[pattern-juice-choreography]] — the on-beat feel; every hit choreographed to sim time.
- [[system-grace]] — the hit window as a frame-exact grace system.
- [[system-difficulty-and-dda]] — window/density/tempo as the difficulty dials.

## See also

- [docs/FUN.md §18](../../docs/FUN.md#18--rhythm) — mechanical truth + verify recipe.
- [docs/JUICE.md](../../docs/JUICE.md) — feel gates for the on-beat choreography.
- [`sandboxes/`](../../sandboxes/) — reach for the tweens/timing lab to prove a
  window frame-exactly before charting.

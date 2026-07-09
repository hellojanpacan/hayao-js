---
id: pattern-anti-frustration
title: Anti-Frustration
kind: pattern
tags: [forgiveness, grace, anti-frustration, respect, retry, mercy, difficulty, humane]
summary: Punish mistakes without punishing the player — grace, instant retry, undo, and respecting time keep hard fair.
use-when: A game is hard or long and you must separate "difficult" from "tedious/unfair"; anywhere a failure costs the player time.
composes-with: [pattern-mastery-and-flow, pattern-juice-choreography, system-grace, system-save-and-checkpoint]
verify-with: design/FUN.md#part-1-—-universal-laws
---

# Anti-Frustration

**What it is.** A game can be brutally hard and still respect you, or trivially easy
and still waste your life. **Anti-frustration** is the discipline of punishing the
*mistake* without punishing the *player* — grace windows, instant retry, undo,
generous checkpoints, no re-doing solved work. FUN.md law 5 states the core: **grace
is a system, not polish.**

**Player fantasy.** *"That death was fair, and I'm already trying again."* The
absence of dread about *losing progress*, so all the tension goes where it belongs —
the challenge itself. The game is on your side even as it kicks you.

## Why it works

- **Frustration and difficulty are different axes.** Difficulty is the challenge you
  signed up for; frustration is friction you didn't — reloads, re-treading, input
  windows so tight the game feels like it's lying. Killing the second lets you crank
  the first.
- **The grace mindset keeps players in [[pattern-mastery-and-flow]].** A death that
  costs three seconds keeps you on the ridge; a death that costs three minutes drops
  you into anxiety and quitting.
- **Respecting time is respecting the player.** Re-doing solved work, unskippable
  intros, punitive save-scumming — these read as contempt. Grace reads as craft.

## Levers

| Lever | Softens | Example |
|---|---|---|
| **Coyote time / jump buffer** | Input timing strictness | ~6-frame window past the ledge ([[system-grace]]) |
| **I-frames / hit-stop buffering** | Cascading damage | Invuln after a hit; buffer intent through the freeze (FUN.md §4) |
| **Instant retry** | The cost of failure | Respawn in < 1s, momentum preserved (CLAWSTRIKE) |
| **Undo / restart** | The cost of a wrong move | First-class undo key (Dying Dreams; FUN.md §1) |
| **Wound-before-death** | One-shot deaths | One grab is a story, two is a death (FUN.md §16) |
| **Checkpoint density** | Re-tread distance | Save at every room; never re-solve ([[system-save-and-checkpoint]]) |
| **Mercy clears** | Death spirals | Clear the screen on death/phase change (FUN.md §7) |
| **Assist modes** | The floor itself | Slow-mo, invuln, skip (Celeste; [[system-accessibility]]) |

## Applied across genres

| Genre | The grace |
|---|---|
| **Precision platformer** ([[anchor-celeste]]) | Coyote, buffer, corner-correct, instant retry, assist mode |
| **Grid puzzle** ([[genre-grid-puzzle]]) | Undo + restart; a wrong push is never a lost level (FUN.md §1) |
| **Bullet hell** ([[genre-bullet-hell]]) | Mercy clears on death and phase transitions — structural, not optional (FUN.md §7) |
| **Survival horror** ([[genre-survival-horror]]) | Wound + grace beats instadeath; the fuel budget is winnable *with discipline* (FUN.md §16) |
| **Roguelike** ([[genre-roguelike]]) | Meta-progression turns a lost run into progress ([[system-meta-progression]]) |
| **Tactics** ([[genre-tactics]]) | Undo a move within a turn before commit; perfect info means no gotchas |
| **Racing** ([[genre-racing]]) | Rewind/retry a corner; no re-driving three clean laps for one mistake |

## Overdone when…

- **Grace erases the challenge.** Infinite retries with no stakes flatten the
  [[pattern-mastery-and-flow]] channel — tension needs *some* cost. Make retry cheap,
  not free-of-meaning.
- **Save-scumming replaces skill.** If reloading is the optimal strategy, the design
  leaks; either commit choices or make grace explicit (undo), not exploitable.
- **Hand-holding as forgiveness.** Removing failure entirely isn't grace, it's a
  toy. Anti-frustration removes *tedium*, not *challenge*.
- **Inconsistent grace.** A coyote window that works on some ledges and not others
  is worse than none — the player learns not to trust it ([[pattern-readability]]).

## Verify / feel-gate link

Grace is the most *directly testable* fun law — it's law 5 precisely because every
piece of it is a frame window:

- **Frame-pump the grace window (FUN.md law 5).** Assert accepted-inside /
  refused-outside to the exact frame: coyote, jump buffer, i-frames, hit-stop input
  buffering. `forgivenessIssues(CONFIG)` (JUICE.md Part 3, `npm run feel`) gates that
  coyote/buffer/corner are specced at all.
- **Buffer through injected pauses (law 5).** Any pause the sim injects (hit-stop,
  level-up pick) must buffer intent across it — assert a press during the freeze
  still fires.
- **Instant retry preserves state (law 7).** Snapshot→restore→hash round-trip proves
  retry doesn't corrupt or drift the sim.
- **Respect-time proofs are the checkpoint/save gates** ([[system-save-and-checkpoint]])
  — no lost solved work across a save/load cycle.

## Worked micro-example

*"A brutally hard platformer players still call fair."* Keep difficulty maxed; strip
the *frustration* around it. (1) **Instant retry** — respawn in < 1s at the room
start, momentum intact, so a death costs seconds not minutes (CLAWSTRIKE). (2)
**Consistent grace** — coyote and jump-buffer windows that work on *every* ledge, so
the player learns to trust them ([[system-grace]], [[pattern-readability]]). (3)
**No re-tread** — checkpoint at each screen; never re-solve solved ground
([[system-save-and-checkpoint]]). The challenge is untouched; the tedium is gone.
Prove it: frame-pump the grace window (accepted-inside / refused-outside to the exact
frame, FUN.md law 5) and round-trip snapshot→restore→hash so retry never drifts state.

## Composes with

- [[system-grace]] — this pattern is the *mindset*; that system is the concrete
  coyote/buffer/i-frame/mercy machinery with the frame values. Read them together.
- [[pattern-mastery-and-flow]] — grace bounds the anxious side of the flow channel so
  hard stays humane.
- [[system-save-and-checkpoint]] — respecting time is mostly a checkpoint-density and
  no-re-tread problem.
- [[system-accessibility]] — assist modes are anti-frustration extended to *who* can
  reach flow at all.
- [[pattern-juice-choreography]] — a death that *feels* clean (readable cause,
  quick reset) is half feel, half forgiveness.

## See also

- [`design/FUN.md`](../FUN.md) law 5 — grace is a system, not polish; the same
  shape at every timescale, each unit-testable.
- [`design/JUICE.md`](../JUICE.md) Part 3 — `forgivenessIssues`, the feel gate
  that fails a build with unspecced grace.
- [[anchor-celeste]] — assist-mode humaneness as a whole-game thesis.

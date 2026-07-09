---
id: system-onboarding
title: Onboarding
kind: system
tags: [onboarding, tutorial, teach-by-doing, first-ten-minutes, hesitation, teaching, ramp]
summary: Tutorialization by doing — teach one verb at a time in a safe space, and read hesitation data to find where players actually stall.
use-when: A new player must learn the game's verbs and goals without a wall of text or a boring tutorial.
composes-with: [system-difficulty-and-dda, system-accessibility, pattern-readability, process-core-loop]
anchors: [anchor-celeste, anchor-into-the-breach]
verify-with: design/FUN.md#2-precision-platformer-celeste-like
---

# Onboarding

**What it is.** How a game teaches itself in its **first ten minutes**. The best
onboarding is invisible: it introduces one **verb** at a time, in a space where
failure is cheap, and lets the player *discover* the rule by doing rather than
reading it. Celeste's first screens teach jump, then dash, then their combination —
no text box required.

**Player fantasy / why it's fun.** Competence, fast. A player who feels smart in
the first five minutes stays; one who feels lost quits. The pull is the *"oh, I get
it"* — a rule you deduced from play sticks harder than one you were told.

## When to use / when NOT

| Use it when | Go lighter when |
|---|---|
| The game has non-obvious verbs or goals | The verb is universal (WASD move, click) — don't explain what's known |
| You want retention past minute one | A pure toy/sandbox with no goal to reach |
| A twist mechanic needs teaching ([[process-the-twist]]) | A puzzle where *figuring the rules out* IS the game ([[anchor-baba-is-you]]) |

> **Teach by doing, not by telling.** A modal that says "press X to dash" is a
> failure of design offloaded onto the reader. Build a room the player can *only*
> pass by dashing, and the room teaches dash. Text is the fallback, not the plan.

## Variants

| Variant | How it teaches | Best for |
|---|---|---|
| **Designed first level** | geometry forces the verb | platformers, action ([[anchor-celeste]]) |
| **Safe sandbox** | consequence-free space to try | complex sims, RTS |
| **Guided first run** | scripted low-stakes encounter | roguelites (first run is a tutorial) |
| **Just-in-time prompt** | one hint at the moment of need | when a verb unlocks mid-game |
| **Discovery / trust** | show nothing, let deduction do it | [[anchor-into-the-breach]], [[anchor-outer-wilds]] |

## The first-ten-minutes structure

| Beat | Goal | Trap |
|---|---|---|
| **0–1 min** | one verb works, feels good | dumping the full control list |
| **1–3 min** | that verb solves a trivial obstacle | difficulty before competence |
| **3–6 min** | a second verb; then combine the two | teaching in parallel — one at a time |
| **6–10 min** | the goal is legible; the loop closes once | no visible objective → aimless |

## Tuning levers

| Lever | Effect | Watch for |
|---|---|---|
| **Verbs-per-minute** | teaching pace | >1 new verb at a time overloads |
| **Failure cost early** | safety of the sandbox | early permadeath scares off learners |
| **Prompt timing** | just-in-time vs. up-front | a hint shown too early is noise |
| **First-goal distance** | when the loop first closes | too far = no payoff; too near = no arc |

## How it wires to Hayao

- **Onboarding is a level, built like any level** — geometry that forces a verb is
  authored (or generated in-band) with the same solver/reachability proofs as the
  rest ([[system-encounter-design]], [[system-procgen-design]]).
- **Menus/prompts are DOM chrome**, not sim: `showScreen({...})` (grep
  `docs/API.md`) for the "press start" and hint overlays — cosmetic, out of
  `world.hash()` (CONVENTIONS: DOM for menus).
- **Hesitation data is your ground truth.** Studio records per-frame action logs,
  wall-clock marks (tab-hidden ≠ hesitation), and the "longest pause @ frame N"
  report ([`docs/STUDIO.md`](../../docs/STUDIO.md), `inspect_moment`). Where a real
  human *stalled* is where onboarding failed — read it, don't guess. A pause that
  isn't menu time and isn't a background tab is a confusion signal.
- **The teaching ramp** is the gentlest slope of [[system-difficulty-and-dda]] —
  assert it with the same `rampIssues` shape check.

## Fails when…

- **Wall of text.** A tutorial the player skips taught nothing; design the lesson
  into the space instead.
- **Everything at once.** Full control scheme on screen one → nothing sticks.
- **No safe space.** Learning under real threat means learning by punishment.
- **No visible goal by minute ten.** Competence without direction is aimless — the
  loop must *close once* early so the player sees the point ([[process-core-loop]]).
- **Guessing the stall points.** Designing onboarding from intuition when Studio
  hesitation data would show the real wall.

## Verify

- **A bot completes the tutorial cleanly:** waypoint/first-level bot beats it
  0-deaths, and per-level times expose the intended gentle ramp
  ([FUN.md §2](../FUN.md#2-precision-platformer-celeste-like)).
- **The taught verb is *required*:** a negative proof — the best maneuver *without*
  the verb fails the room (FUN.md §3 gate pattern).
- **Readability floor:** the avatar and the goal out-contrast the surroundings
  ([`src/verify/gates.ts`](../../src/verify/gates.ts) readability gate).
- **Human stall check:** review the Studio report's longest-pause moments after a
  real playtest ([`docs/STUDIO.md`](../../docs/STUDIO.md)).

## Composes with

- [[system-difficulty-and-dda]] — onboarding is the front of the curve.
- [[system-accessibility]] — the first minutes must clear the readability/assist floor for everyone.
- [[pattern-readability]] — a verb you can *see* to use teaches itself.
- [[process-core-loop]] — onboarding's job is to close the loop once.

## See also

- [`docs/STUDIO.md`](../../docs/STUDIO.md) — hesitation/longest-pause data; the real onboarding oracle.
- [`design/FUN.md` §2/§3](../FUN.md) — teach-by-geometry; negative gate proofs.
- [[anchor-celeste]] · [[anchor-into-the-breach]] — teach-by-doing and teach-by-trust.

---
id: system-boss-design
title: Boss Design — the set-piece fight
kind: system
tags: [boss, phases, telegraph, spectacle, set-piece, mercy, encounter]
summary: The multi-phase set-piece — a fight that teaches, escalates, and telegraphs, with mercy on every phase transition so a death is fair, not cheap.
use-when: You need a climactic fight — a boss, an elite, a chapter finale — that's a spectacle and a skill test, not just a big HP bar.
composes-with: [system-telegraphs, system-combat-model, system-encounter-design, system-grace, system-enemy-ai]
anchors: [anchor-hades, anchor-into-the-breach]
verify-with: design/FUN.md#7-bullet-hell
---

# Boss Design — the set-piece fight

**What it is.** The **climax**: a single opponent (or arena) built as a multi-phase
performance — it teaches a pattern, escalates it, and pays off mastery. A boss is
[[system-combat-model]] turned up to spectacle, held fair by heavy
[[system-telegraphs]] and structural [[system-grace]].

**Player fantasy / why it's fun.** The mountain. A boss is a wall you learn to
climb — first attempt you're overwhelmed, tenth attempt you dance through it. The
fun is the *arc of competence*, from panic to mastery, capped by a moment of
spectacle you earned.

## When to use / when NOT

| Use a boss when… | Skip when… |
|---|---|
| You want a skill/knowledge checkpoint | Pacing needs a valley, not a peak |
| A pillar deserves a climactic test | The genre is flat by design (idle, cozy) |
| The player has the full toolkit to show off | Mechanics aren't taught yet (too early) |

A boss is a *test* — it should demand the mechanics the game has already taught,
not introduce them. Front-load teaching in encounters ([[system-encounter-design]]);
let the boss examine.

## Phase structure — the arc

| Phase | Job | Design note |
|---|---|---|
| **Read** | teach the boss's vocabulary | slow, legible telegraphs; low punish |
| **Pressure** | escalate — faster, layered patterns | now the taught reads matter |
| **Desperation** | the spike; new wrinkle or tempo | the memorable peak; keep it *fair* |
| **(optional) Puzzle** | a gimmick that gates damage | reflect-the-shot, break-the-armor |

Each phase should re-use the previous phase's vocabulary plus one new element —
escalation by *addition*, so the player is never asked to relearn from scratch.

## The mercy law — FUN.md law 5

> **Phase transitions are a grace point, not a gotcha.** FUN.md §7: mercy clears on
> death and phase transitions are *structural*, not polish — without them deaths
> cascade (you die to a bullet that spawned during the cutscene).

Concretely, on every transition:

- **Clear active threats** — no leftover bullet/hitbox from the last phase kills you
  during the transition.
- **Buffer input across the pause.** Any freeze the transition injects must re-emit
  the player's intent (FUN.md law 5; §4 hit-stop rule). A dropped dash on a phase
  change is the cheapest, worst death in the game.
- **Checkpoint the phase** if the fight is long — respect the player's time
  ([[pattern-anti-frustration]]); losing phase 3 shouldn't replay phase 1 for the
  twentieth time.

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Phase HP split** | pacing across the fight | roughly even; a short desperation phase reads as a sprint |
| **Telegraph window** | reactability per attack | ≥ the §4 floor; longer for the big committal moves |
| **Punish window** | your damage opening after a whiff | real but bounded — the fight has rhythm |
| **Pattern density** | simultaneous threats | coherent, not a wall (§7 — density that *reads*) |
| **Mercy window** | i-frames / clears on transition | specced in frames, proven edge-in/edge-out |
| **Attempt cost** | retry friction | low — instant retry keeps momentum (FUN.md law 5) |

## How it wires to Hayao

- **Every attack telegraphs.** Feed each threat's timeline to
  `telegraphIssues(timeline, minFrames)` (in `@hayao`) — a boss move that goes live
  cold is an unfair death (FUN.md §4/§7). See [[system-telegraphs]].
- **The desperation phase is a dodge-bot proof.** FUN.md §7: a greedy lookahead
  dodger must clear the pattern deathless — if the bot dies, humans die unfairly.
  Pure state + `world.rng` makes that bot free (law 7).
- **Mercy windows are gate-proven.** `graceWindowIssues(label, windowFrames, accepts)`
  frame-pumps the transition i-frames and asserts accepted-inside / refused-outside
  to the exact frame (FUN.md law 5).
- **Spectacle is cosmetic.** Shake, particles, hit-stop are view (`Shaker`,
  `Particles`, JUICE Part 1) — bounded by `feedbackIssues` (death shake ≈ 0.5,
  hit-stop ≤ 12 frames), out of `world.hash()`.

## Fails when…

- **HP sponge.** No phases, no new vocabulary — just a long health bar. Tedium, not
  a climax.
- **Untelegraphed spike.** The desperation phase adds an attack with no tell —
  `telegraphIssues` fails; it should.
- **Transition death.** A leftover bullet or a dropped input during the phase change
  kills you (the exact §7 cascade the mercy law prevents).
- **Teaches in the exam.** Introduces a mechanic the game never taught — the boss is
  a filter, not a lesson.
- **Retry friction.** Long walk-back or slow retry breaks the learn-by-dying loop
  (FUN.md law 5).

## Verify

- **[FUN.md §7](../FUN.md)** — dodge bot clears each phase deathless; peak-bullet
  count asserted; mercy clears on death and transition.
- **[FUN.md §4](../FUN.md)** — every attack telegraphed (`telegraphIssues`).
- **[FUN.md law 5](../FUN.md)** — transition i-frames proven edge-in/edge-out
  (`graceWindowIssues`).
- Feel: death/boss-hit shake and hit-stop inside envelope (`feedbackIssues`) →
  **[JUICE.md Part 3](../JUICE.md)**, **[VERIFICATION Channel 4](../../docs/VERIFICATION.md)**.

## Composes with

- [[system-telegraphs]] — a boss is a telegraph showcase; readability is the whole test.
- [[system-grace]] — mercy on transitions, i-frames, instant retry are structural here.
- [[system-encounter-design]] — the boss examines what the encounters taught.
- [[system-combat-model]] — the boss is your combat model at maximum expression.

## See also

- [`design/FUN.md`](../FUN.md) §7 (mercy + dodge bot), §4 (telegraphs), law 5 (grace).
- [`design/JUICE.md`](../JUICE.md) — spectacle within the feedback envelope.
- [[anchor-hades]] — bosses as repeatable, learnable set-pieces across runs.

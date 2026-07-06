---
id: antipattern-endless-tutorial
title: The Endless Tutorial
kind: antipattern
tags: [onboarding, pacing, control, friction]
summary: Teaching that never yields control — the game explains for an hour before it trusts the player to play.
use-when: Your opening front-loads instruction instead of letting play teach.
composes-with: [system-onboarding, pattern-opening-hook, pattern-mastery-and-flow]
verify-with: docs/VERIFICATION.md
---

**What it is.** The **opening** narrates instead of hands over — dialog boxes, forced walks, and "press X to continue" gate the player behind minutes of exposition before a single free decision.

**Why it hurts.** The first minute is where you win trust or lose it. A tutorial that lectures spends that minute proving the game doesn't trust the player — and a player who isn't trusted stops trusting the game back. Interest is a decaying resource; instruction with no agency burns it.

## The smell

**Passivity.** The player is a passenger. Text advances, cameras pan, an NPC talks — and nothing the player does changes the next second. The game is *showing* when it should be *asking*.

## How it happens

- **Fear of confusion.** You imagine a lost player and pre-empt every question with a popup. The cure kills the patient.
- **Feature pride.** Every system got a screen because every system was hard to build. Effort spent ≠ attention owed.
- **Story-first openings.** The narrative team wants the setup landed before mechanics start. Two teams, one throat-clear.
- **Modal locks.** The easiest way to "make sure they read it" is to freeze input. Freezing input is the whole disease.
- **One verb, ten sentences.** A move that a single jump would teach gets a paragraph instead.

## The tell

Spot it in your OWN opening before handoff:

| Tell | What it looks like |
|---|---|
| **Time-to-first-choice** | Stopwatch from boot to the first decision the player *authors*. Over ~60s is a warning; over 3 min is a fire. |
| **Modal minutes** | Sum of seconds where input is locked to a popup/cutscene. Any unskippable stretch is suspect. |
| **Read-to-act ratio** | Words shown before the verb is used. If they read more than they do, invert it. |
| **The "got it" reflex** | Are testers mashing to dismiss text? They're not learning — they're waiting. |
| **Verb backlog** | Count mechanics introduced before the player used the *first* one. Should be one. |

If you can't name the first thing the player *does* — not reads, not watches — you have this bug.

## The fix

**Teach by doing, one verb at a time.** The level is the tutorial; the popup is the failure of the level.

- **Hand over in seconds, not minutes.** Give a controllable body immediately. See [[pattern-opening-hook]] — the first interaction is the pitch.
- **One verb, then use it.** Introduce jump → the next gap demands a jump. Introduce dash → a wall you can only clear by dashing. Design the space so the mechanic is the *only* way forward; the level asks the question the button answers. This is the core of [[system-onboarding]].
- **Sequence, don't dump.** Layer verbs across minutes of play, each isolated before it's combined. Let [[pattern-mastery-and-flow]] pace the ramp so competence compounds instead of piling up unused.
- **Make text optional and terse.** A prompt that *offers* help beats a modal that *demands* attention. Skippable, dismissible, never blocking.
- **Trust the safe failure.** A player who dies to an obvious hazard learns faster than one who read about it. Cheap retries buy you the right to explain nothing — see [[pattern-anti-frustration]] and [[system-grace]].
- **Design confidence, not comprehension.** The goal isn't that they understand the system; it's that they *want the next room*.

## "X but Y" twist seams

- **A tutorial but there is no tutorial** (diegesis): the first real level is teachable-by-shape — every hazard telegraphs its own rule, so the "lesson" is just the geometry. See [[system-telegraphs]], [[pattern-readability]].
- **Instruction but the player writes it** (agency-inversion): withhold the verb and let the player *discover* it, then reward the discovery instead of announcing it up front. Composes with [[pattern-surprise-and-delight]].
- **Onboarding but it never stops** (drip-teach): no tutorial phase at all — introduce a new verb every few minutes across the whole first act, so learning is the game, not a gate before it. See [[system-mastery-curve]], [[pattern-pacing-and-tension]].

## Seen in…

- **Super Mario Bros. 1-1** — the antidote, and the reason this pattern is famous. A Goomba walks at you the instant you spawn; the level *teaches jumping by threatening you with a jumpable thing*. Zero text.
- **Half-Life** — the tram ride and Black Mesa opening land story and controls without a single locked modal; you're always the one moving.
- **[[anchor-into-the-breach]]** — hands you a legible board and a fully readable turn almost immediately; the systems reveal themselves through play, not a preamble.
- **[[anchor-portal]]** — the test chambers *are* the tutorial; each room isolates one new idea and demands you use it to leave. Instruction is level design.
- **Many AAA openings and F2P onboardings** — the failure case: 10-20 minutes of on-rails cutscene, forced-walk exposition, and popup gauntlets before the player authors anything. The genre-crossing offender is the **[[genre-narrative-decisions]]** / RPG prologue that mistakes lore-dump for onboarding.

## Adjacent traps

Don't over-correct into the mirror failure. Stripping *all* teaching yields [[antipattern-guess-the-designer]] — the player flails because nothing was ever asked clearly. And a tutorial that front-loads ten systems is usually also carrying [[antipattern-feature-soup]] and headed for [[antipattern-decision-paralysis]]. The fix is sequence and restraint, not silence — see [[pattern-restraint-and-negative-space]].

## Verify / guard

This is a **failure mode**, so guard it at the design gate, not just in code. Before handoff: stopwatch the boot-to-first-authored-choice, and confirm one verb precedes any second verb. Prove the ramp with [[process-core-loop]] and check pacing against [[pattern-pacing-and-tension]]. Route the measurable checks through `docs/VERIFICATION.md`.

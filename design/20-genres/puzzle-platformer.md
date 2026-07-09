---
id: genre-puzzle-platformer
title: Puzzle-Platformer
kind: genre
tags: [single-verb, spatial, teaching, platformer, elegance]
summary: Platforming where the challenge is thought, not reflex — one deep verb, taught wordlessly, mined exhaustively.
use-when: You want spatial puzzles built on a single expressive movement/manipulation verb.
composes-with: [anchor-braid, anchor-portal, mechanic-gravity-flip, system-onboarding]
anchors: [anchor-braid, anchor-portal]
verify-with: design/FUN.md#1-·-grid-puzzle
---

**What it is.** A platformer where the walls are ideas, not gaps. You give the player **one verb** with a deep rule, then spend the whole game asking questions that verb can answer. Movement is a means; the answer is the win.

**Player fantasy / why it's fun.** The click of *"oh — I could do THAT."* The room looked impossible; you were missing one implication of a rule you already knew. Mastery here is comprehension, not dexterity — you feel smart, not fast.

## Pillars

1. **One deep verb.** Not a moveset — a single rule with more consequences than it first shows. [[anchor-braid]]'s rewind, [[anchor-portal]]'s two linked holes. The verb must be *generative*: every room is a new sentence in the same grammar.
2. **Wordless teaching.** The level *is* the tutorial. No text box explains the mechanic; a safe room forces the player to discover it, then the game builds. See [[system-onboarding]] and [[pattern-readability]].
3. **The idea fully explored.** Each mechanic gets introduced, practiced, combined, and finally *subverted* before you retire it. Leave nothing on the table; a shallow verb outstays its welcome in three rooms.

## The loop stack

| Layer | What happens |
| --- | --- |
| **Moment** | Read the room → form a hypothesis → execute the verb → confirm or revise. |
| **Encounter** | One room = one idea (or one *collision* of ideas). Solvable in a single insight, not a checklist. |
| **Session** | A world = one mechanic's full arc: teach → practice → combine → subvert → retire. |
| **Meta** | New world = new verb (or new twist on the old one). Optional harder rooms reward the comprehension-hungry. |

The moment is cerebral, not twitchy. If the player *knows* the answer but keeps dying to the jump, you have leaked a reflex game into a thinking game — the core failure mode (see Pitfalls).

## Essential systems

- [[system-onboarding]] — the introduce→practice→combine→subvert cadence lives here. Teach one implication per room; never two new things at once.
- [[system-encounter-design]] — a room is a *question*. Author the insight, then build the walls that hide it. No filler rooms.
- [[system-mastery-curve]] — difficulty is conceptual depth, not tighter timing. Ramp the *idea*, keep the execution generous.
- [[system-save-and-checkpoint]] — a wrong idea should cost seconds, not minutes. Instant reset; the puzzle is the enemy, not the retry.
- [[system-difficulty-and-dda]] — optional side-rooms for the hungry; the main path stays a clean line so nobody gets walled.
- [[system-collectibles]] — the classic "hard optional star per world" reward for exploring the verb's edges (Braid, N++, Fez).

## Content & difficulty model

- **Unit of content is the idea, not the room.** Budget mechanics, not levels. A world is *one* mechanic × its four beats. Ten shallow rooms lose to four that each teach a distinct implication.
- **Ramp the concept; hold the execution.** Every room should be a fresh *thought*. If two rooms teach the same insight, cut one.
- **Generous inputs, strict logic.** Coyote time, buffered jumps, forgiving hitboxes — none of that cheapens a thinking game, and their absence turns insight into a stopwatch. See [[pattern-anti-frustration]] and [[pattern-fairness-and-trust]].
- **Solvability is provable.** Puzzle content wants a machine-checked winnable path per room — see the grid-puzzle proof discipline the verify target enforces. Design so a solver *can* exist: keep state discrete where you can.
- **Pace the reveal.** Alternate a hard room with a breather that lets the new idea settle. [[pattern-pacing-and-tension]].

## Signature-mechanic seeds

Twist the verb, not the platforming. Each is *X but Y* with a vector in parens:

1. **Puzzle-platformer but the verb is chosen fresh each world** *(structure)* — every biome hands you a different single verb ([[mechanic-clone]], [[mechanic-teleport]], [[mechanic-grow-shrink]]) and never reuses it; the game is an anthology of one-idea games. Risk: no compounding mastery — buy it back with a finale that stacks all verbs.
2. **One-verb but the verb is controlled by rhythm** *(mechanic-swap)* — the manipulation only fires on the beat, so timing re-enters as *structure*, not twitch. Solving becomes choreography. Pairs with [[recipe-rhythm-platformer]] and [[genre-rhythm]].
3. **Time as the verb** *(mechanic)* — [[mechanic-rewind]] or [[mechanic-time-stop]] as the single rule; the room is a chronology puzzle. Braid's whole thesis.
4. **Space as the verb** *(mechanic)* — [[mechanic-portal]] or [[mechanic-gravity-flip]]: the puzzle is where "up" and "adjacent" secretly point.
5. **The avatar splits** *(mechanic)* — [[mechanic-clone]] / [[mechanic-possess]]: you author a past self, then cooperate with the recording. One player, two bodies.

## Common pitfalls

- **Execution muddying the idea** — the signature trap. When the answer is known but the hands can't deliver, you've built [[genre-precision-platformer]] by accident. Diagnose via [[antipattern-input-lie]]: if inputs feel dropped or death feels unfair, the puzzle is no longer the challenge.
- **Guess-the-designer** — [[antipattern-guess-the-designer]]: the solution hinges on an unstated rule or an unfair leap. Every insight must be *derivable* from what the verb visibly does.
- **The verb runs dry** — [[antipattern-false-depth]]: a shallow rule dressed in twenty rooms. If you can't find four distinct implications, the verb isn't a genre, it's a gimmick — cut the world short.
- **Endless teaching** — [[antipattern-endless-tutorial]]: hand-holding past the "combine" beat. Once the player owns the idea, stop explaining and start *asking*.
- **Content desert** — [[antipattern-content-desert]]: padding a thin verb to hit a level count. Ship four brilliant worlds, not ten tired ones.

## Anchors

- [[anchor-braid]] — one verb (rewind), each world a *new* rewind rule, wordless teaching, and a finale that recontextualizes everything. The reference.
- [[anchor-portal]] — the purest introduce→practice→combine→subvert cadence in games; two holes, infinite consequences.
- Adjacent: [[genre-grid-puzzle]] (discrete cousin), [[genre-precision-platformer]] (the reflex sibling to *avoid* collapsing into), [[genre-metroidvania]] (verbs-as-keys at world scale).

## Verify

Prove it against `design/FUN.md#1-·-grid-puzzle` — machine-checked winnability, an authored insight per room, and reset cheap enough that thinking, not retrying, is the loop. Design here; prove there.

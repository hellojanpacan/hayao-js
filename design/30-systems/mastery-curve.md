---
id: system-mastery-curve
title: Mastery Curve — Easy to Learn, Hard to Master
kind: system
tags: [mastery, skill-ceiling, depth, learnability, flow, execution, expression]
summary: Learnable depth as a mechanism — a low skill floor and a high skill ceiling, with the gap between them full of discoverable technique.
use-when: The lasting appeal is the player getting BETTER, not the character; you need to engineer a shallow entry and a tall ceiling.
composes-with: [system-progression, system-difficulty-and-dda, system-onboarding, system-build-diversity, system-grace]
anchors: [anchor-tetris, anchor-celeste, anchor-balatro]
verify-with: design/FUN.md#2-skill-delta-proofs
---

# Mastery Curve — Easy to Learn, Hard to Master

**What it is.** The distance between the **floor** (the skill to play at all) and
the **ceiling** (the skill to play *well*), and how densely that distance is
packed with learnable technique. "Easy to learn, hard to master" is not a slogan —
it's a measurable shape you build on purpose.

**Player fantasy / why it's fun.** "I keep getting better and the game keeps
having more to give." Where **[[system-progression]]** grows the *character*,
mastery grows the *player*. The pull is competence itself — the moment a maneuver
that was impossible becomes automatic.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| The game will be replayed for skill, not content | It's a one-shot narrative or a solved puzzle set |
| Execution or decision depth is the core toy | The verbs are trivial and meant to stay so (some idlers) |
| You want longevity without infinite content | You'd rather grow the character than the player |

Mastery and character-progression are **not** opposites — layer them. But name
which one carries longevity. Tetris has *zero* character progression and infinite
mastery; a looter has huge progression and a modest ceiling.

## Variants

| Variant | The depth is in | Ceiling raised by | Example |
|---|---|---|---|
| **Execution** | Motor skill, timing, precision | Frame-tight tech, chaining | Celeste dashes; fighting-game links |
| **Decision** | Reading state, planning | Deeper lookahead, risk math | Into the Breach; chess |
| **Optimization** | Squeezing the system | Route/build/econ mastery | Factorio; speedruns; Balatro synergy |
| **Expression** | Style within freedom | Personal flair, combos | Character-action; Peggle bank shots |
| **Knowledge** | What you know | Learned facts, not reflexes | Outer Wilds; deduction games |

The best games stack two — Balatro is **decision + optimization**; Celeste is
**execution** with a knowledge layer of hidden routes.

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Floor height** | How hard it is to *start* | Low — first success in the first minute. Grace ([[system-grace]]) lowers the floor without lowering the ceiling |
| **Ceiling height** | How much room to grow | Tall enough that experts still find gains after hours |
| **Depth density** | Technique per hour of play | Steady discovery — a new "oh, I can *do* that" every session |
| **Floor↔ceiling coupling** | Do assists lower the ceiling? | Decouple. Assist mode must not cap top-end play (**[[anchor-celeste]]**) |
| **Legibility of depth** | Can players *see* the next tier? | Show it exists (a leaderboard, a rank, a visible-but-hard route) |
| **Punish vs reward gap** | How the game rewards skill | Skill should *earn*, not just *avoid loss* — style meters, score multipliers |

The **flow channel** is the design target: challenge tracks rising skill so the
player sits between boredom and panic. That's a whole pattern —
**[[pattern-mastery-and-flow]]** — this system is its concrete mechanisms.

## How it wires to Hayao

- **Mastery is provable as a skill delta.** The core proof of a real ceiling is
  **[[FUN.md law 2]]**: run the intended (skilled) strategy AND a null (unskilled)
  one and assert the gap — drafting 17/20 vs 9/20, braking 26.2s vs flooring
  27.7s. A game with a real ceiling shows a *large, reliable* delta. No delta =
  no ceiling; skill doesn't matter.
- **Pure state makes skilled bots cheap.** Because `world.state` is plain JSON and
  rng flows through `world.rng`, you can write a *skilled* pilot (lookahead, aim
  search) and a *dumb* one and score both — the ceiling becomes a number
  (**[[FUN.md law 7]]**).
- **Grace lowers the floor for free.** Coyote time, input buffering, mercy — the
  [[system-grace]] mechanisms — widen the entry without touching the top end. Wire
  them per **[[FUN.md law 5]]** (grace is a system, unit-tested edge-in/edge-out).
- **The ceiling is content you generate, not gate.** Depth comes from the *rules
  interacting* ([[pattern-emergence]]), not from more levels — but a well-ramped
  campaign (`src/content/`, `assertRamp`) gives the floor→ceiling slope room.

## Fails when…

- **Floor too high.** Players bounce before they find the fun. Lower it with grace
  and onboarding, not by removing depth.
- **Ceiling too low.** Mastered in an hour; nothing left to chase. The skill-delta
  goes flat — expert and novice score alike.
- **Fake depth.** Complexity that isn't *mastery* — randomness, unreadable state,
  input lag. Depth must be *learnable*, i.e. the delta must be earnable.
- **Assists cap the ceiling.** If easy mode also caps top play, experts feel
  robbed. Decouple (Celeste's assist mode changes the floor, not the ceiling).
- **Invisible depth.** Technique nobody knows exists. Signpost that there's more.

## Verify

- The skill-delta proof — intended vs null, asserted gap: **[[FUN.md law 2]]**.
- Skilled vs dumb pilots via clone-and-score: **[[FUN.md law 7]]**.
- Grace windows edge-tested (the floor's mechanisms): **[[FUN.md law 5]]**.
- Flow-channel framing: **[[pattern-mastery-and-flow]]**.

## Composes with

- [[pattern-mastery-and-flow]] — the flow-channel pattern this system implements.
- [[system-progression]] — character growth *under* player growth; name which leads.
- [[system-grace]] — lowers the floor without lowering the ceiling.
- [[system-onboarding]] — teaches the floor; hints at the ceiling.
- [[system-difficulty-and-dda]] — keeps challenge inside the flow channel over time.
- [[system-build-diversity]] — optimization/expression depth as many viable paths.

## See also

- [`design/FUN.md`](../FUN.md) law 2 — the skill-delta proof, the closest
  thing to a fun proof, and the direct measure of a mastery ceiling.
- **[[anchor-tetris]]** (pure ceiling) · **[[anchor-celeste]]** (decoupled floor/
  ceiling via assist) · **[[anchor-balatro]]** (optimization depth).

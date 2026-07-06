---
id: genre-coop-chaos
title: Coop Chaos
kind: genre
tags: [coop, couch-coop, party, overcooked, communication, chaos, shared-task, local-multiplayer]
summary: Couch-coop chaos — escalating shared tasks that force communication under time pressure; the friction between players IS the fun.
use-when: The design is a local/party coop game where players juggle interdependent tasks against a clock and must talk to survive.
composes-with: [system-coop-and-competition, system-difficulty-and-dda, system-encounter-design, pattern-pacing-and-tension, genre-narrative-decisions]
anchors: [anchor-overcooked, anchor-it-takes-two]
verify-with: docs/FUN.md#8-·-tower-defense
---

# Coop Chaos

**What it is.** Two-to-four players share one escalating task — a kitchen, a ship, a
factory — where the work outpaces any single pair of hands. Success needs division
of labour, hand-offs, and constant talk; the *joyful friction* between players is
the product. **Extension** beyond FUN.md's 21 genres.

**Player fantasy.** *"We did that — barely."* The shared adrenaline of a near-miss
pulled off by shouting the right thing at the right second; a story you tell
afterward, together.

## Pillars

1. **Communication forced by design.** The layout, not the rules, makes players
   talk — split resources, blind hand-offs, a task no one can finish alone. If
   silence works, it isn't coop chaos.
2. **Escalating shared load.** Difficulty is *throughput* the table demands vs the
   throughput the players can coordinate. The clock and the order queue ramp; the
   kitchen literally shifts under them.
3. **Legible chaos.** However frantic, every station, order, and hazard reads at a
   glance. Chaos you can't parse is noise; chaos you can *just barely* parse is fun.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Grab → carry → hand off → place; one micro-task, contested by space and time. |
| **Encounter** | A level/round: fulfil an order queue before the timer, as a layout fights you. |
| **Session** | A run of levels; escalating kitchens; star thresholds gating the next. |
| **Meta** | Unlocked levels/tools/modifiers; co-op star totals; the campaign map. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-coop-and-competition]] | Interdependence is the core — design tasks no one player can solo. |
| [[system-difficulty-and-dda]] | The order-rate ramp and the layout-shift are the difficulty; scale to player count. |
| [[system-encounter-design]] | A level is composed pressure + pockets; the moving hazard IS the encounter. |
| [[pattern-pacing-and-tension]] | Deliberate breather beats between order surges; the finale is the peak. |
| [[system-session-structure]] | Short, replayable rounds; the run shape that suits couch play. |

## Content & difficulty model

- **Difficulty = required throughput vs coordinatable throughput.** State it as an
  inequality (orders/min the queue demands ≤ what N coordinated players can serve)
  and tune the queue against it (FUN.md law 3).
- **The layout is the level.** Author kitchens/ships/rooms, not enemy stats. A
  moving hazard (a splitting kitchen, a rising tide) is a *pacing* device — treat
  its rhythm like a tower-defense wave curve: surges with breathers, finale peaks.
- **Scale to player count deterministically.** Task volume and station count key
  off N; the same seed with 2 vs 4 players must both be winnable and both replay.
- **Null-coordination loses.** The scripted "everyone works solo, no hand-offs" run
  must fail the level — that's the proof the design actually forces coop.

## Signature-mechanic seeds

- **Overcooked *but* the recipe is hidden and only one player can read it** — the
  forced channel is *information*, not just hands (constraint; composes
  [[genre-narrative-decisions]] for the reader's dilemma).
- **Overcooked *but* on a train you build ahead of yourselves** — the workspace is
  also a shared build task (mechanic-swap; the Unrailed bend).
- **It Takes Two *but* the two mechanics can jam each other** — interdependence
  sharpened to interference (mechanic-swap; composes [[system-counter-systems]]).
- **Overcooked *but* asymmetric roles: one cooks, one defends the kitchen** —
  a coop-chaos/tower-defense blend (structure; composes [[genre-tower-defense]]).
- **Coop chaos *but* the tasks are secretly competitive — shared kitchen, private
  scores** (tonal; composes [[system-coop-and-competition]]'s rivalry hooks).

## Common pitfalls

- **Silence wins.** If a good solo player can carry, the coop is decorative. Force
  hand-offs and split resources so talking is mandatory.
- **Illegible frenzy.** Too many simultaneous hazards and the chaos stops reading;
  players fail without understanding why. Cap concurrent threats; keep salience.
- **Punishing the weaker player.** Chaos that scapegoats one player kills the couch.
  Design shared blame — failure should feel like *our* miss.
- **Wall-clock timing.** Order timers and layout shifts must run on sim time, not
  `Date.now`, or replays and goldens lie (FUN.md law 6).

## Anchors

- [[anchor-overcooked]] — communication-forced-by-design; escalating kitchens; the
  canonical coop-chaos loop.
- [[anchor-it-takes-two]] — asymmetric coop set-pieces; a new interdependent
  mechanic per chapter.

## Verify — extension note

Coop chaos is an **extension**; it has no dedicated FUN.md section, so it *composes
the verify patterns of its parents*:

- **Wave/pressure pacing** → [FUN.md §8 — Tower defense](../../docs/FUN.md#8-·-tower-defense):
  gate the order-queue/hazard curve on "each surge breathes, finale peaks," not
  monotonicity. **This is the primary proof.**
- **Encounter containment** → [FUN.md §4 — Action-adventure](../../docs/FUN.md#4-·-top-down-action-adventure-zelda-like):
  keep hand-off lanes / exit rows clear; assert no station softlocks.
- **Skill-delta** → [FUN.md law 2](../../docs/FUN.md#part-1--universal-laws):
  a coordinated bot script clears; the null-coordination script fails. Determinism
  and cosmetic-view rules apply unchanged (laws 6–7).

## Composes with

- [[system-coop-and-competition]] — the interdependence toolkit; this genre is its
  loudest expression.
- [[system-difficulty-and-dda]] — scale pressure to player count and skill.
- [[pattern-pacing-and-tension]] — the surge/breather rhythm that keeps chaos joyful.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §8 — the wave-curve pattern to borrow for order
  surges.
- [[genre-tower-defense]] — the parent whose pressure-curve verify this genre reuses.

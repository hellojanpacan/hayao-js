---
id: pattern-pacing-and-tension
title: Pacing & Tension
kind: pattern
tags: [pacing, tension, rhythm, peaks, valleys, breather, session, curve, escalation]
summary: Tension is a curve, not a constant — alternate peaks and breathers so the finale reads as a peak, not another wave.
use-when: Shaping a session/level/wave/run; deciding difficulty and intensity over time, not just at one moment.
composes-with: [pattern-feedback-loops, pattern-mastery-and-flow, pattern-risk-reward, system-session-structure]
verify-with: docs/FUN.md#8-·-tower-defense
---

# Pacing & Tension

**What it is.** Intensity over time is a **curve**, not a level you set once. A game
that's flat-out from minute one exhausts; one that's flat-calm bores. The craft is
**peaks and valleys** — escalating pressure punctuated by **breather beats** — so the
session breathes, tension recovers, and the finale lands as the *peak* because you
built up to it.

**Player fantasy.** *"I can't stop — but I can catch my breath."* The pull of rising
stakes, the relief of a lull, the dread of the next climb. A shape you feel even
when you can't name it.

## Why it works

- **Tension needs contrast to exist.** A peak only reads as a peak against a valley;
  constant maximum is just noise the player tunes out. The breather *makes* the spike.
- **Breathers refill the flow tank.** Sustained challenge without recovery slides the
  player from flow into anxiety and quitting ([[pattern-mastery-and-flow]]); the lull
  resets attention so the next peak lands.
- **The curve can emerge from loops.** [[pattern-feedback-loops]] and
  [[pattern-risk-reward]] build peaks *without hand-scripting* — a snowball is a rising
  slope, a push-your-luck run is a self-authored spike. Design the loop, get the curve.
- **The valley is where the other systems breathe.** Downtime isn't dead time — it's
  where the shop, the draft, the plan, and the story live. A game with no valleys has
  nowhere to put its [[pattern-risk-reward]] decisions; the breather *is* the choice beat.

## Levers

| Lever | Shapes the curve | Example |
|---|---|---|
| **Escalation slope** | How fast pressure rises | Wave HP/spawn ramp; enemy density over a level |
| **Breather placement** | Where the valleys sit | A runner wave; a safe room; a shop between fights |
| **Peak spacing** | Rhythm of spikes | Mini-boss every N rooms; a crescendo mid-level |
| **Finale weight** | The last peak is *the* peak | Gate on "finale is the max", not monotonicity |
| **Session length** | The whole arc's footprint | Run vs level vs campaign ([[system-session-structure]]) |
| **Downtime texture** | What a valley *does* | Loot, dialogue, planning, catching your breath ([[pattern-risk-reward]]) |

## Applied across genres

| Genre | The curve | The breather |
|---|---|---|
| **Tower defense** ([[genre-tower-defense]]) | Wave intensity climbs to a finale peak | Runner waves are the pressure break (FUN.md §8) |
| **Horde survival** ([[genre-horde-survival]]) | Superlinear spawn ramp | The level-up pick pauses the tide (FUN.md §6) |
| **Roguelite** ([[system-session-structure]], [[anchor-hades]]) | Room → room → elite → boss | The shop/reward room between fights |
| **Bullet hell** ([[genre-bullet-hell]]) | Pattern density escalates per phase | Phase transitions (with mercy clears) reset (FUN.md §7) |
| **Deckbuilder** ([[genre-deckbuilder]]) | Act → elite → boss | Rest sites; the map-choice planning beat |
| **Survival horror** ([[genre-survival-horror]]) | Dread accrues on a fuel budget | The lit safe pocket at a traversal's midpoint (FUN.md §16) |
| **Narrative** ([[genre-narrative-decisions]]) | Stakes rise across the reign | A quiet, low-Δ choice between crises |

## Overdone when…

- **Monotone escalation.** Every wave strictly harder than the last with no dip —
  the player never recovers and the finale reads as "just another wave, but slower to
  die". Gate on *shape* (each wave ≥ ~55% of the previous, finale peaks), not
  monotonicity (FUN.md §8).
- **All-breather / no spine.** Endless low-stakes downtime — the game never grips.
  Valleys serve peaks; they aren't the point.
- **Whiplash pacing.** Peaks and valleys with no ramp between — jarring, not
  rhythmic. Ease into and out of spikes.
- **The false finale.** The biggest fight sits mid-session and the ending fizzles —
  the curve should *build* to its last peak.

## Verify / feel-gate link

Pacing is one of the few *aesthetic* concerns FUN.md makes into a hard assertion,
via the wave-curve gate:

- **Assert the shape, not monotonicity (FUN.md §8).** Gate on "each wave ≥ 55% of
  the previous, finale peaks" — a *breathing* curve, with deliberate breather beats,
  not a straight climb. Both CLAWSTRIKE and Norman the Necromancer pace waves with
  explicit breathers (FUN.md §8).
- **Pressure curve checklist (FUN.md Part 3).** "Wave/pressure curve breathes —
  deliberate breather beats; finale is the peak; assert the shape" is a
  before-you-author-content gate.
- **No unlock deserts (FUN.md §14).** For incremental/economy arcs, the pacing
  failure is a *desert* — a stretch with no new thing; balance-sim the whole arc and
  assert no gap ([[genre-incremental]]).
- **Session-length fit** ([[system-session-structure]]) — the curve must fit the
  intended session footprint; a 40-minute arc in a 5-minute run has no room to breathe.

## Worked micro-example

*"A tower-defense run that builds to a finale instead of grinding flat."* The naive
curve is monotone — every wave a little harder — and the "finale" reads as just a
slower-to-die version of wave 12. Shape it instead: (1) **escalate** the combat waves
in a rising slope; (2) drop a **runner wave** every third slot as a pressure break —
a valley that lets the player retool and breathe; (3) weight the **finale** as the
true peak, well above the prior maximum. Now the run has a shape you can feel. Prove
it with the wave-curve gate (FUN.md §8): assert each wave ≥ ~55% of the previous and
the finale peaks — a *breathing* curve, not a straight climb, and not monotonicity.

## Composes with

- [[pattern-feedback-loops]] — loops build the peaks and the comebacks *emergently*;
  the curve falls out of the loop's gain.
- [[pattern-mastery-and-flow]] — pacing is flow *over time*; breathers keep the
  player on the ridge across a whole session.
- [[pattern-risk-reward]] — push-your-luck is a self-authored tension spike; the
  player draws their own curve.
- [[system-session-structure]] — the container (run/level/campaign) sets the arc's
  length and where its peaks can sit.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §8 (wave curves breathe) & §14 (no deserts) —
  the two places pacing becomes an assertion.
- [[anchor-hades]] — room-shop-room-boss rhythm as a whole-game pacing spine.
- [[system-encounter-design]] — a single encounter has its own micro-curve (pressure
  then pocket); pacing is that shape nested up to the session.

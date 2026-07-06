---
id: genre-racing
title: Racing
kind: genre
tags: [racing, driving, top-down, understeer, braking, line, checkpoint, laps]
summary: The speed/line tradeoff made physical — brake to hold the line or floor it and drift wide; the racing line is the skill.
use-when: The design is a top-down/arcade racer where cornering is a real physics tradeoff and lap time is the score.
composes-with: [system-enemy-ai, system-difficulty-and-dda, system-progression, pattern-mastery-and-flow, pattern-risk-reward, pattern-pacing-and-tension]
anchors: [anchor-trackmania, anchor-mario-kart]
verify-with: docs/FUN.md#20-·-top-down-racing
---

# Racing

**What it is.** You drive a line through corners where speed and control genuinely
trade off — flooring it understeers you wide, braking tucks you tight. The whole
game is finding and holding the fast line lap after lap, usually against rivals.

**Player fantasy.** *"I found the perfect line."* Mastery you can feel in your
thumbs: the corner you used to blow now flows, and the clock proves it.

## Pillars

1. **The speed/line tradeoff is physical.** Turn authority *falls* with speed
   (understeer), not grip that magically holds — so flat-out must NOT make every
   bend. Braking is the skill the genre sells; make it a dedicated control.
2. **The clock never lies.** Lap time is the honest, legible score. Every tenth is
   a decision you made three corners ago. Ghosts and rivals externalise it.
3. **The track is the level.** Corner radius, track width, and sequence author the
   difficulty. Design the geometry against the car's turn radius, not by vibes.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Brake point → apex → throttle out; one corner, committed. |
| **Encounter** | A lap: chain corners into a rhythm, defend/overtake a rival. |
| **Session** | A race or time-trial; the grand prix; podium or PB. |
| **Meta** | Unlocked tracks/cars/tuning; championship standings; leaderboard chase. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-enemy-ai]] | The rival `driveLine()` is difficulty dial, completability proof, and skill-delta meter in one. |
| [[system-difficulty-and-dda]] | Rubber-banding, assist braking, racing-line guides — the ramp for a wide skill range. |
| [[pattern-mastery-and-flow]] | The corner you now flow through *is* the flow channel; the genre is a mastery curve. |
| [[system-progression]] | Track/car unlocks; tuning as a shallow build layer. |
| [[pattern-risk-reward]] | Late braking, cutting the kerb, the overtake into a blind corner. |

## Content & difficulty model

- **Derive geometry from the car, not the other way.** The inequality chain: turn
  radius (speed ÷ steer-authority) < corner radius < track width. State it as a
  comment and assert it against the actual track and config (FUN.md law 3, §20).
- **Ordered checkpoints are the entire anti-cheat.** Only the NEXT checkpoint
  counts; cutting the track advances nothing. This single rule replaces a
  collision-fence forest.
- **Off-track has a speed cap**, not a wall — punish the sloppy line without a
  hard stop that reads as unfair.
- **The rival is your difficulty dial.** One good `driveLine()` at scalable pace
  gives you completability proof (it finishes) and a skill-delta meter (a braking
  line beats a flooring line: 26.2s vs 27.7s in the campaign).
- **Track sequence is a tension curve.** Alternate a technical corner-cluster with a
  flat-out straight so the player exhales; a circuit of nothing but hairpins reads
  as punishment, not mastery (see [[pattern-pacing-and-tension]]).
- **A ghost is the gentlest teacher.** Racing your own PB (or the rival's line)
  externalises the ideal line without a tutorial pop-up — onboarding by contrast.

## Signature-mechanic seeds

- **Top-down racer *but* the track is drawn behind you and erased ahead** — commit
  to a line you can't preview (constraint; composes [[system-procgen-design]]).
- **Racing *but* braking recharges a boost you spend on straights** — the tradeoff
  becomes an economy, not just a physics fact (mechanic-swap; [[system-economy]]).
- **Racing *but* every rival remembers how you overtook them and blocks it next
  lap** (mechanic-swap + emergence; composes [[system-emergent-systems]]).
- **Racing *but* one screen, no scroll — the whole circuit visible, you optimise
  the global line** (perspective/constraint).
- **Racing *but* cargo shifts your mass and turn radius as you deliver it** — the
  car changes under you mid-race (mechanic-swap).

## Common pitfalls

- **Grip instead of understeer.** If more speed just means "more traction needed,"
  flat-out beats braking and the whole genre collapses. Authority must fall with
  speed; assert flat-out fails a real corner.
- **No dedicated brake.** Braking-as-absence-of-throttle robs the player of the
  skill expression the genre is built on. Bind brake to its own key (corpus:
  WitchCup1276, DR1V3N WILD both do).
- **Rubber-band that erases skill.** DDA that pulls rivals to your bumper regardless
  of your line makes lap time meaningless. Band the *field*, not the outcome.
- **Wall-collision anti-cheat.** Fencing every shortcut is brittle; ordered
  checkpoints make cutting simply not count.
- **Wall-clock timing.** Lap timing and physics must step on sim time, not
  `Date.now`, or the golden grand prix and PB ghosts drift (FUN.md law 6).

## Anchors

- [[anchor-trackmania]]: the definitive DNA for this genre's soul. The clock as
  the only opponent, instant free restart as the practice loop, and a medal ladder
  that fits one track to every skill. Steal it when the fun is a solo line against
  the clock.
- [[anchor-mario-kart]]: the competitive/arcade pole. The drift-boost skill ceiling
  on a trivial floor, and position-weighted catch-up that bands the field without
  erasing an earned lead. Steal it when rivals and spectacle matter more than the
  clock.

Still worth borrowing across both: [[anchor-tetris]] for the "one tuned verb,
endless mastery" discipline, and [[anchor-into-the-breach]] for perfect-information
honesty if you telegraph rival intent. Corpus references: WitchCup1276 (2023
gameplay #10), DR1V3N WILD (2024 gameplay #3).

## Verify

Prove it against [FUN.md §20 — Top-down racing](../../docs/FUN.md#20-·-top-down-racing):
the `driveLine()` bot finishes laps; braking beats flooring (skill delta); cutting
advances nothing; off-track speed cap holds; golden grand prix. See
[`sandboxes/physics-lab`](../../sandboxes/physics-lab) for the vehicle-physics
primitives and [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo) for
the racing-line follower.

## Composes with

- [[system-enemy-ai]] — the rival driver is the beating heart of both difficulty
  and proof.
- [[pattern-mastery-and-flow]] — cornering mastery is the flow channel; pace the
  track to keep the player in it.
- [[system-difficulty-and-dda]] — assist braking and line guides widen the audience.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) law 3 — derive the turn-radius inequality
  before you lay a single corner.
- [`sandboxes/physics-lab`](../../sandboxes/physics-lab) — the car, in isolation.

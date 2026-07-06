---
id: pattern-juice-choreography
title: Juice as Choreography
kind: pattern
tags: [juice, feel, feedback, choreography, particles, shake, cosmetic, two-senses, game-feel]
summary: The sim resolves instantly and returns a choreography script; the view replays it — every event answers on ≥2 senses.
use-when: Wiring feedback (impact, pickup, death) or deciding what belongs in the sim vs the view.
composes-with: [pattern-readability, pattern-anti-frustration, pattern-pacing-and-tension, system-combat-model]
verify-with: docs/JUICE.md#part-3-—-make-the-feel-checkable-channel-4-gates
---

# Juice as Choreography

**What it is.** Feel is not decoration sprinkled on a sim — it's a **choreography**
the sim *authors* and the view *performs*. The sim resolves an event instantly and
returns a script (what happened, when); the view replays it as particles, shake,
pops, and sound. FUN.md law 6, the **cosmetic-view rule**: views must be deletable
without changing a single sim bit. Juice is loud *and* free of gameplay risk because
it never touches the hash.

**Player fantasy.** *"That hit felt like it mattered."* Weight, punch, satisfaction —
the difference between clicking a spreadsheet and landing a blow. The game answering
your input like it *heard* you.

## Why it works

- **The 2-senses feedback contract.** Every meaningful event answers on **≥ 2
  senses** within the frame — sfx + particles, or sfx + flash + shake. One channel
  reads as cheap; two reads as *professional* (JUICE.md Part 2). This is the single
  highest-leverage feel rule.
- **Choreography-not-state keeps determinism sacred.** Because the view reads sim
  *events*, not state it feeds back, a replay reproduces the exact same show and
  deleting the whole view changes not one game bit (FUN.md law 6). You can lean all
  the way into juice at zero risk to the proofs.
- **Timing is sim time.** Impact, beat, cascade timing is `world.time` / the fixed
  `dt`, never wall-clock — so the choreography is reproducible and the hash holds
  (JUICE.md Part 1).

## Levers

| Lever | The Hayao primitive | Envelope (JUICE.md Part 2) |
|---|---|---|
| **Screen shake** | `Shaker` (camera's parent) | land ≈ 0.12, death ≈ 0.5; quadratic falloff, decay ≈ 3/s |
| **Hit-stop** | freeze frames on impact | sells weight; > ~12 frames reads as a hitch |
| **Impact particles** | `Particles` + `PARTICLE_PRESETS` | answer an event, life 0.2–0.6s, then vanish |
| **Pop numbers / pickups** | `FloatingText` + `FLOAT_PRESETS` | one pop per event; don't stack to soup |
| **Atmosphere** | `AmbientField` + `AMBIENT_PRESETS` | *persistent* field (snow/ash), not a burst stream |
| **Depth** | `ParallaxLayer` | 0 = far/pinned, 1 = foreground |
| **Procedural SFX** | `audio.tone/blip/play/success` | pitch-rising combo; the second sense, cheaply |

*(Grep [`docs/API.md`](../../docs/API.md) before citing — all of the above are real;
[`examples/updrift`](../../examples/updrift) wires every one and passes all four feel
gates.)*

## Applied across genres

| Genre | The signature choreography |
|---|---|
| **Physics arcade** ([[genre-physics-arcade]], [[anchor-peggle]]) | Pitch-rising ricochet chain, big burst on multipliers — the juice *is* the product |
| **Action-adventure** ([[genre-action-adventure]]) | Hit-stop + flash + i-frame shimmer sell the blow (FUN.md §4) |
| **Horde survival** ([[genre-horde-survival]]) | Screen full of pops on a level-up; the "number goes up" feast |
| **Match-3** ([[genre-match3]]) | The purest law 6 — the deterministic sim returns the cascade *script*, the view animates it (FUN.md §13) |
| **Deckbuilder** ([[anchor-balatro]]) | The score-multiplier crescendo; each joker its own beat |
| **Precision platformer** ([[genre-precision-platformer]]) | Dust on land, shake on death, snappy landing — feel that rewards clean movement |
| **Rhythm** ([[genre-rhythm]]) | Feedback *on the beat* — sim time drives both the hit and its flourish (FUN.md §18) |

## Overdone when…

- **Juice smothers the read.** Constant shake and particle spam bury the avatar and
  the threat — feel that fights [[pattern-readability]]. Reserve the big
  choreography for the big events (the 2-senses contract, not the 5-senses assault).
- **Nausea shake.** Trauma that doesn't decay fast reads as motion sickness; the
  feedback gate caps it (JUICE.md Part 2).
- **Hitch hit-stop.** Freezes > ~12 frames read as a bug, not weight.
- **Juice bound to state, not events.** If the view reads back state it influences,
  determinism breaks and the replay diverges — law 6 violated. Wire to events.
- **Seizure-bright / frantic.** The judge flags it as a *high*-severity juice-restraint
  failure (JUDGE.md rubric 4).

## Verify / feel-gate link

Feel is made **checkable** — this is the whole point of Channel 4:

- **Declare a `FeedbackContract`, then gate it** (JUICE.md Part 3):
  `feedbackIssues(FEEDBACK, [...]).length === 0` asserts every listed event answers
  on ≥ 2 senses with bounded juice. A silent one-channel event is now a failing test.
- **Camera smoothness.** `cameraIssues(camSamples).length === 0` — no snaps or jerk
  (the pattern's timing rail; JUICE.md Part 4 lists the frame-1 snap gotchas).
- **Determinism (FUN.md law 6).** Run headless, hash; run with view, hash; assert
  equal. Proves the choreography is cosmetic — the view is deletable.
- **The vision judge (JUDGE.md rubric 4 & 5).** Juice restraint and motion clarity
  are scored from the actual pixels — feel gates can pass while the *image* still
  reads as noise; the judge closes that mile.

## Worked micro-example

*"A sword swing that feels like it lands."* The sim resolves the hit instantly and
returns a script: `{ hit: true, at: pos, hitstop: 5, knockback: dir }`. The view
performs it — `Shaker.addTrauma(0.12)`, a `PARTICLE_PRESETS.hit()` burst at `pos`, a
5-frame freeze that *buffers* the next input through it, an `audio.tone` that pitches
up on a combo, and a `FloatingText` damage pop. That's the **2-senses contract** met
several times over (sfx + particles + flash + shake), all cosmetic, all driven off
the *event* not read-back state. Delete the whole view and the sim hash is identical
(FUN.md law 6). Prove it: run headless, hash; run with view, hash; assert equal — and
`feedbackIssues(FEEDBACK, ['hit']).length === 0` guards the ≥2-senses rule.

## Composes with

- [[pattern-readability]] — juice must *serve* the read, never bury it; the two are
  in constant tension and readability wins ties.
- [[pattern-pacing-and-tension]] — reserve the loudest choreography for the peaks so
  it stays meaningful.
- [[pattern-anti-frustration]] — a death that *feels* clean (readable cause, quick
  reset) is half feel, half forgiveness.
- [[system-combat-model]] — hit-stop and i-frames are where the *shape of a hit* and
  its choreography meet.

## See also

- [`docs/JUICE.md`](../../docs/JUICE.md) — the full cookbook; **the** reference for
  this pattern. Copy from [`examples/updrift`](../../examples/updrift).
- [`docs/FUN.md`](../../docs/FUN.md) law 6 — the cosmetic-view rule that makes juice
  free.
- [`sandboxes/juice-lab`](../../sandboxes/juice-lab) — the juice primitives in isolation.

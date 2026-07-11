---
id: recipe-rhythm-platformer
title: Rhythm Platformer
kind: recipe
tags: [rhythm, platformer, beat-as-time, recipe, music]
summary: Precision platforming where the beat IS the simulation clock — jumps land on rhythm, the level plays like a song.
use-when: You want movement and music fused so the soundtrack drives the platforming.
composes-with: [genre-rhythm, genre-precision-platformer, mechanic-double-jump, world-soundscape, process-the-spine]
anchors: [anchor-celeste]
spine: "Ride a hand-built room where nothing moves between beats, so your only agency is a move committed on the window — and every commitment locks you to the beat grid the next hazard is timed against."
verify-with: design/FUN.md#18-·-rhythm
---

**What it is.** A precision platformer where the **beat** is the tick. You still run, jump, and dash a hand-built room — but every action only resolves on-beat, so a clean clear reads as a performance of the track.

**Player fantasy / why it's fun.** You stop *fighting* the music and start *riding* it. The pull is the flow-state click of [[pattern-mastery-and-flow]]: input, hazard, and drum hit fuse into one pulse, and a perfect run feels like you played the song, not the level.

## The brief

**Celeste but the beat is sim time** *(mechanic-swap — replace the free-running clock with a quantized beat clock)*.

Take Celeste's tight moveset and its trust in the player, then swap the substrate: nothing advances between beats. See [[process-the-twist]] for the vector, [[process-intent-to-brief]] for the shape.

## The spine

*Ride a hand-built room where nothing moves between beats, so your only agency is a
move committed on the window — and every commitment locks you to the beat grid the
next hazard is timed against.*

| Part | This game |
|---|---|
| **Objective** | Clear the room — reach the end of the track, the level *played* like a song |
| **Superpower** | A **quantized move** (run / jump / dash) — precise Celeste-grade traversal, but it only *resolves* on the beat |
| **Scarcity** | The **beat-window**: the narrow legal tolerance band around each beat is all you get to act. Spend it — hesitate, and momentum dies waiting for the next one; commit, and you can't recall the move mid-air |
| **Obstacle** | Hazards *derived from the track* — spikes that extend on the downbeat, gaps spaced a beat of travel apart, a syncopated bassline authoring a syncopated jump pattern |
| **Renewal** | The track is the level: each new phrase re-poses "read the pulse, commit on the window" against a fresh hazard timed to a fresh beat pattern |

## Resonance

Every element traces to the spine. This table **is** the coherence proof — see
[[process-the-spine]].

| Element | Arrow back to the spine |
|---|---|
| Verb: quantized move (run/jump/dash) | The single agency; traversal and timing fused — every input is a bet placed *on* a beat |
| **Power creates the problem** | Committing a move locks you to the grid of beats, and its arc lands you one beat later where the *next* track-timed hazard is already waiting → moving well is what strands you on-rhythm into the next window *(passes the gate)* |
| Scarcity: the beat-window | Turns the move into a *choice of when*, not a spam — the tolerance band is the whole decision, and it's the whole difficulty dial ([[system-grace]]) |
| Renewal: the track authors the room | Re-poses "read-and-commit in one beat" against a fresh hazard each phrase — a syncopated line writes a syncopated challenge ([[process-composition]]) |
| Hazards derived from the track (spike retracts on the downbeat) | The obstacle is *the beat made lethal*; a hazard bolted on off-grid would be **dissonant** ([[antipattern-dissonance]]) |
| Grace budget: visible tolerance + coyote frames + input buffer | Makes the window *honest* — a near-miss reads as near, never cheated; without it the tight scarcity becomes an [[antipattern-input-lie]] |
| Death-handling: off-beat presses buffer, respawn is instant and cheap | Spine is *ride-the-song mastery*; punishing a mistimed press would be **dissonant** — the loop says "fall back into the groove," not "fear the beat" |
| Setting / structure: the level *is* the song | Objective made physical — clearing the room *is* performing the track, so the soundscape is the spine, not scenery ([[world-soundscape]]) |
| Theme: stop fighting the music, start riding it | The mechanic (act only on the pulse) is the metaphor (flow-state surrender to the beat) — [[pattern-mastery-and-flow]] |
| Feel: a visible pulse + every effect landing *on* the beat | Makes the window legible *before* you need it and the timing a *look*, not a count ([[pattern-readability]], [[pattern-juice-choreography]]) |

No row is decoration; no row fights the spine. The gate holds: **committing your move
is what locks you to the grid and drops you into the next track-timed hazard — you
cannot traverse without betting your momentum on the beat.**

## Anchors

- [[anchor-celeste]] — the movement feel and fairness bar: variable-height jump, dash, wall-jump, generous checkpoints. Steal the *trust*, not the free clock.

Reference beyond the anchor: Crypt of the NecroDancer (beat = turn, the canonical proof), Rhythm Doctor (one-button window discipline), Sound Shapes / BIT.TRIP RUNNER (level-as-song, obstacles on downbeats).

## Genre + systems pulled

- [[genre-precision-platformer]] — the movement grammar: run, jump arc, dash, wall-cling. Every verb it teaches, you keep.
- [[genre-rhythm]] — the input-legality filter. Rhythm is a legality layer over a turn-based sim: the world is frozen between beats, and input is only *legal* on the window. Don't restate the frame-window truths — that's the handoff below.
- [[world-soundscape]] — the track is not decoration, it's the level's spine. The soundscape authors the beat grid the room is built on.
- [[mechanic-double-jump]] — the readable second beat. One jump = one beat; the air-jump spends the *next* beat, teaching the grid through the body.
- [[system-grace]] — the honest window. Coyote frames, input buffer, and the on-beat tolerance are all one grace budget; make it generous and *visible*.

## The twist applied

Vector: **mechanic-swap** — the sim clock changes substrate, everything else inherits.

Three seams, each a small swap that keeps the same skeleton:

| Seam | "X but Y" | Twist vector |
| --- | --- | --- |
| Jump | Celeste's jump *but* it only fires on the beat | mechanic-swap (clock) |
| Hazard | A spike trap *but* it retracts and extends on the downbeat | rule-swap (motion → tempo) |
| Dash | A free-aim dash *but* its distance is one beat of travel, fixed | constraint-add (quantize the verb) |

The discipline: derive hazards *from* the track. A syncopated bassline authors a syncopated jump pattern. Don't score a level and then bolt music on — [[process-composition]].

## The 3 pillars

Cut anything that doesn't serve one of these. See [[process-pillars]].

1. **Tight but fair** — frame-exact input windows, but a *visible* grace budget so a near-miss reads as near, not cheated. Fairness is the whole trust contract; see [[pattern-fairness-and-trust]] and never [[antipattern-input-lie]].
2. **Music as mechanic** — the track *is* the level. Mute the audio and the timing should still be inferable from the visuals; turn it on and it should feel inevitable. This is where [[pattern-juice-choreography]] earns its keep — every hit lands *on* the beat, never near it.
3. **Readable beat** — the player always knows when the next window opens. Pulse the world (a flash, a scale-bump, a metronome tick) so timing is a *look*, not a memorized count. Lean on [[pattern-readability]].

## Scope & first playable

Build the smallest thing that proves the fusion, then stop. See [[process-core-loop]].

- **One track.** ~60–90 s, a single clear BPM. Pick the BPM so a beat is a whole number of frames — the beat counter is the master clock, audio is an *observer* scheduling off it.
- **One room, three verbs.** Run, jump ([[mechanic-double-jump]] for the second-beat lesson), dash. No wall-run, no [[mechanic-grapple]], no third system — that's [[antipattern-feature-soup]].
- **Jumps quantized to the beat.** Press anytime; the jump *resolves* on the next legal window. Off-beat presses buffer (grace), they don't punish.
- **Grace on the window.** A tolerance band around each beat, plus coyote frames on ledges — and it must be *tunable*, because this dial is the whole difficulty curve.
- **A visible pulse.** Something in-frame beats with the clock so the window is legible before you need it.

First-playable win condition: a beat-perfect run clears clean, and a human who *feels* the song can clear it without counting frames. If clearing means memorizing an arbitrary sequence, you built [[antipattern-guess-the-designer]], not a rhythm game.

Explicit non-goals for v1: no scoring ladder, no combo multiplier, no branching charts, no second track. Difficulty comes from tighter grace and busier hazards on the *same* verbs — [[pattern-escalation-and-payoff]] — not from new buttons.

## Handoff

Design ends here; proof lives in the verify targets.

- **`design/FUN.md#18-·-rhythm`** — the beat-is-sim-time truth and the three frame-exact window assertions it specifies. Your BPM-to-integer-frames choice and the frozen-between-beats world are *its* invariants to prove.
- **[[system-grace]]** — the window tolerance, buffer, and coyote frames are one honest budget; the doc is where their generosity gets asserted, not asserted-away.
- Feel and look land through [[pattern-juice-choreography]] (every effect on the beat) and get judged, not self-scored, per the JUDGE half.

If it fights back, it's usually the clock: an off-beat that *feels* on-beat means audio drifted from the counter. The counter is truth; make audio chase it.

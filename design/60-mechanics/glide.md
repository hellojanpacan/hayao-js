---
id: mechanic-glide
title: Glide / Hover
kind: mechanic
tags: [movement, air-control, traversal, descent]
summary: Trade fall speed for horizontal control — the soft-landing verb that stretches an arc into a decision.
use-when: Descents or gaps need controlled float without full flight.
composes-with: [mechanic-double-jump, mechanic-dash, pattern-pacing-and-tension]
verify-with: docs/FUN.md#19-·-physics-arcade
---

# Glide / Hover

**What it is.** Hold a button in the air to **cap your fall rate** and buy
horizontal steering — you don't gain height, you spend it slowly. A jump is a
committed parabola; a glide turns that parabola into a **line you can bend**.

**Player fantasy.** *"I'll make it."* The apex fear of a normal jump becomes calm:
you see the far ledge, you lean, you feather down onto it. Mastery reads as grace,
not twitch.

## The verb

Airborne, hold **glide** → downward velocity clamps to a slow terminal, lateral
control opens up. Release to drop fast, or run out of the resource that sustains it.

## How it feels / why it's fun

- **The arc becomes a puzzle.** A committed jump is solved at takeoff. A glide
  stays open the whole descent — *when* to deploy, *how long* to hold, *when* to
  cut it and drop. Vertical levels stop being reflex tests and become **slow route
  puzzles** you read on the way down.
- **Soft landing lowers the floor, the resource cost raises the ceiling.** New
  players float to safety; experts hoard altitude and stamina to reach the greedy
  line. One verb, two difficulty bands — see [[system-mastery-curve]].
- **It reframes the camera down.** Gliding pulls the eye toward where you'll land,
  so the level below must be legible *before* you commit ([[pattern-readability]]).

## Tuning levers

| Lever | Effect | Sane default |
|---|---|---|
| **Fall-rate cap** | Terminal velocity while gliding | 25–40% of free-fall |
| **Air-steer authority** | Horizontal accel/max-speed mid-glide | 60–80% of grounded control |
| **Deploy latency** | Frames from press to float engaging | 2–4 frames (crisp, no input-lie — [[antipattern-input-lie]]) |
| **Resource** | What limits it | Stamina meter, altitude budget, or *free* (traversal-only) |
| **Drain rate** | How long a hold lasts | 2–4s of glide per full bar |
| **Refill** | Where it restocks | On ground contact; or updraft; or never (one-shot) |
| **Cancel** | How you exit early | Release → instant fast-fall; dash/jump breaks it |
| **Momentum carry** | Does entry speed feed the glide | Carry ~50% so a running start rewards planning |

Push **fall-rate cap** and **drain rate** together: a slow float on a short bar is
a tight tactical tool; a fast float on a long bar is a lazy cruise. Don't move both
toward "generous" or glide becomes flight and the gaps stop mattering.

## Slots into

- **Genres.** [[genre-precision-platformer]] (recovery + air-time control),
  [[genre-metroidvania]] (a gating traversal verb — locked crossings until you earn
  it), [[genre-puzzle-platformer]] (the descent *is* the puzzle),
  [[genre-physics-arcade]] (float as a scoring/steer tool), [[genre-exploration]]
  (reach-the-vista traversal).
- **Anchors.** [[anchor-celeste]] (air-control feel, generous-but-honest recovery),
  [[anchor-braid]] (traversal-as-puzzle mindset), [[anchor-terraria]] /
  [[anchor-minecraft]] (glide items as a progression unlock — see
  [[system-progression]]).
- **Pairs with verbs.** [[mechanic-double-jump]] (jump → glide is the classic
  extend-the-air combo), [[mechanic-dash]] (dash to break a glide for a burst),
  [[mechanic-wall-jump]] (bounce up, glide across), [[mechanic-grapple]] (swing out,
  release into a glide).

## Twist seams

- **Glide but updrafts are the only way up, so wind IS the level** (structure). The
  fall-rate cap becomes a sail: thermals and vents push you *upward* while you hold,
  so the level is authored as a **wind map** and routing = reading the air. The
  descent verb inverts into an ascent economy. Pair with
  [[system-hazards-and-environment]] and [[system-weather-and-time]]; the wind field
  is level geometry, not decoration.
- **Glide but it consumes the light you also need to see** (constraint). Holding
  glide burns your lantern; float too long and the screen darkens toward blind. Now
  every crossing is a bargain between **reach** and **sight** — the resource meter
  is literally your view. Wires to [[system-resource-loops]] and a lighting layer
  (see the `sandboxes/light-lab`); the cost is legible because you *watch* it drain.
- **Glide but weight is a pickup you can drop mid-air** (mechanic-swap). Carry cargo
  and you fall fast with tight control; drop it and you float far but arrive
  empty-handed — a [[pattern-risk-reward]] toggle mid-descent.

## How it wires to Hayao

Glide is a **cosmetic-free, deterministic movement state** layered on the jump: a
clamp on downward velocity plus opened lateral input, gated by a resource counter —
all in `world.probe()`-visible sim state, all driven through the deterministic RNG
if anything varies. Build the arc and the fall-rate clamp in the `sandboxes/physics-lab`
(gravity, terminal velocity, integration) before it touches a level. Steer-during-air
and the land-target framing belong to the `sandboxes/camera-lab`. The golden
platformer reference [`examples/updrift`](../../examples/updrift/) already owns the
honest-air-control floor — study its feel before you tune yours. The float animation
and any trail are pure view: set them `cosmetic = true` so they stay out of
`world.hash()`. Feel and blockability get *proven* at the pointer in the frontmatter,
not restated here.

## Fails when…

- **It becomes flight.** Cap too high + bar too long + free refill = the gaps stop
  mattering and the level design evaporates. Glide must *spend* something. See
  [[antipattern-false-depth]].
- **The input lies.** Deploy latency too high, or the float ignores your steer for a
  few frames — the player feels the game fighting them ([[antipattern-input-lie]]).
- **Landings are unreadable.** You commit to a descent you can't preview; the camera
  never showed the hazard below. That's a fairness break, not difficulty
  ([[pattern-fairness-and-trust]], [[antipattern-guess-the-designer]]).
- **The resource is invisible.** Glide dies mid-air with no on-screen warning and you
  eat a fall you couldn't have planned around — meter it, telegraph the last second
  ([[pattern-readability]]).
- **It trivializes every other verb.** If glide out-ranges dash, jump, and grapple in
  all contexts, they become dead buttons — glide should own *soft descent*, not all
  of traversal ([[antipattern-boring-optimal]]).

## See also

- [[mechanic-double-jump]] · [[mechanic-dash]] · [[mechanic-grapple]] ·
  [[mechanic-swing]] — the air-verb family glide combos with.
- [[pattern-pacing-and-tension]] — glide is a deliberate *slow beat* between spikes;
  use it to breathe the level.
- [[pattern-risk-reward]] — hoard altitude for the greedy line vs. cash out to a safe
  ledge; the descent is an elected gamble.
- [[system-mastery-curve]] · [[system-progression]] — the soft-floor / high-ceiling
  verb, and glide-as-unlock in a metroidvania gate.
- [`examples/updrift`](../../examples/updrift/) — the honest air-control platformer
  floor. `sandboxes/physics-lab` · `sandboxes/light-lab` · `sandboxes/camera-lab` —
  the parts.
- [`docs/FUN.md`](../../docs/FUN.md) §19 — where the arc and its feel get proven.

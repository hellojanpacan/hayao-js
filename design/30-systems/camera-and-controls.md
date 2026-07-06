---
id: system-camera-and-controls
title: Camera & Controls
kind: system
tags: [game-feel, input, camera, responsiveness, feel]
summary: The felt contract between intent and motion — camera framing, input buffering, and response latency ARE the game feel.
use-when: The game feels "off" and you need to fix the intent→motion pipeline.
composes-with: [system-grace, mechanic-lock-on, pattern-fairness-and-trust]
verify-with: docs/JUICE.md
---

# Camera & Controls

**What it is.** The **pipeline** from a button press to a pixel moving: how input is
sampled, buffered, and resolved; and how the camera chooses what to frame. This is
not chrome around the game — for anything real-time it *is* the game feel.

**Player fantasy / why it's fun.** *The avatar is my body.* When latency is low and
the camera shows me what I need one beat before I need it, intention and motion fuse
— I stop thinking about the controller. Celeste and Super Mario World feel "tight"
here; the mechanics are ordinary, the **pipeline** is not.

## When to use / when NOT

| Sweat this when… | Ease off when… |
|---|---|
| Real-time input decides success (platformer, action, [[genre-bullet-hell]]) | The game is turn-perfect ([[genre-grid-puzzle]], [[genre-tactics]]) |
| The world is larger than one screen | Everything relevant fits on a fixed frame |
| A missed frame costs a life or a combo | Input is a single considered choice ([[genre-narrative-decisions]]) |
| Precision *is* the fantasy ([[genre-precision-platformer]]) | Camera would only add motion sickness |

Turn-based games still have a "camera" — it's *what the board shows and when it
scrolls to the action*. And a considered click still deserves an honest hover state.
The pipeline never fully disappears; it just changes clock.

## Camera variants

| Camera | Frames | Best for | Anchor |
|---|---|---|---|
| **Fixed / room** | one static shot per space | authored layouts, horror sightlines | [[genre-survival-horror]], early [[anchor-celeste]] rooms |
| **Follow (deadzone)** | tracks avatar, lags inside a slack box | most platformers/action | [[mechanic-double-jump]] games |
| **Look-ahead** | leads the direction of travel/aim | fast movement, [[mechanic-dash]] | [[anchor-dead-cells]], [[anchor-nuclear-throne]] |
| **Snap-to-target** | reframes on a locked enemy | 1v1 action | [[mechanic-lock-on]], [[anchor-dark-souls]] |
| **Zoom-to-context** | pulls out on threat, in on calm | pacing beats | bosses, [[system-boss-design]] |
| **Player-framed** | the *player* aims/pans the shot | photography, tactics recon | see twist below |

## Input variants

| Input model | Rule | Use when |
|---|---|---|
| **Raw / polled** | act on the frame the press lands | rhythm-exact reads ([[genre-rhythm]]) |
| **Buffered** | a press just-early still fires | almost every action game |
| **Coyote-graced** | a press just-late still fires | platformers with ledges ([[system-grace]]) |
| **Charged / held** | duration maps to power | [[mechanic-charge-attack]], [[mechanic-throw]] |
| **Context-sensitive** | one button, verb picked by state | see twist below |

## Tuning levers

| Lever | Does | Healthy feel |
|---|---|---|
| **Deadzone** | slack box before the camera moves | wide enough to ignore idle jitter, tight enough to never lose the avatar |
| **Camera smoothing** | lerp/spring toward target | fast enough to keep up on a [[mechanic-dash]]; never so slow the avatar outruns frame |
| **Look-ahead** | how far the frame leads intent | scales with speed — more when fast, none at rest |
| **Input buffer** | window a too-early press survives | ~a few frames; long enough to forgive, short enough to feel deliberate |
| **Coyote time** | window a too-late jump still fires | the [[system-grace]] floor — proven to the frame, not vibed |
| **Response latency** | frames from press → visible motion | the fewer the better; every extra frame reads as "mushy" |

Every window is **specced in frames and proven at the edge** — buffer and coyote are
leniency, and unbounded leniency is its own bug. That proof is [[system-grace]]'s job;
here you only decide the numbers and *why*.

## Twist seams

- **Camera but the player frames their own shot** (perspective). The camera stops
  being a servant and becomes a *tool* — the player pans, zooms, and composes.
  [[anchor-return-of-the-obra-dinn]] freezes time so you walk the frame; a photo-mode
  or recon camera makes *what you choose to look at* the mechanic. The design cost:
  the world must reward inspection, and readability ([[pattern-readability]]) now has
  to hold at *any* angle the player picks.
- **Controls but one input maps to context-sensitive verbs** (constraint). Collapse a
  verb list onto a single button whose meaning is read from state — near a ledge it
  grabs ([[mechanic-ledge-grab]]), mid-air it [[mechanic-double-jump]]s, by a wall it
  [[mechanic-wall-jump]]s. Assassin's Creed's "one button, contextual" traversal is the
  archetype. The payoff is a tiny control surface with a large verb set; the trap is
  **[[antipattern-guess-the-designer]]** — if the state→verb map is unreadable, the
  player presses and prays. Make the *context* legible before the button is honest.

## How it wires to Hayao

- **Camera is a pure view transform.** It reads sim state (avatar position, aim,
  threat) and outputs a frame; it must never mutate the sim or the determinism
  invariant breaks. Mark camera nodes `cosmetic = true` so smoothing/shake stay out
  of `world.hash()` — a replay reproduces the same run at any zoom. See the
  `camera-lab` sandbox for the isolated mechanic (deadzone, smoothing, shake, bounds);
  for screen-space HUD framing see `node.screenSpace` in `docs/ENGINE.md`. Grep
  `docs/API.md` before citing any specific helper.
- **Input maps to sim intent on the fixed `dt`.** Buffer and coyote windows live in
  sim state and tick on sim time, not wall-clock — that is what makes them replayable
  and unit-testable. The *feel* (screen shake, look-ahead ease) is cosmetic on top.
- **Context-sensitive verbs are a pure state→verb function.** Keep the resolver a
  deterministic map from `world.probe()`-visible state to a single verb; then a test
  can assert "near a ledge, the button grabs" without touching pixels.
- Reference wiring: the platformer-feel movement examples for buffer/coyote/look-ahead
  together; snap-to-target framing pairs with [[mechanic-lock-on]].

## Fails when…

- **The input lies.** A press that visibly registered but does nothing, or an animation
  that can't be cancelled through a buffered command — [[antipattern-input-lie]]. This
  is the cardinal sin; no camera polish survives it.
- **A pause eats intent.** Hit-stop, a level-up screen, or a camera transition that
  doesn't re-emit the buffered press → jumps and attacks "randomly" vanish. Buffering
  across every injected pause is [[system-grace]]'s invariant.
- **Camera outruns the avatar.** Smoothing too slow on a fast mechanic, so a [[mechanic-dash]]
  leaves the frame behind and the player acts blind. Look-ahead must scale with speed.
- **Deadzone too tight or too loose.** Tight → the camera judders on idle sway; loose →
  the avatar drifts to a screen edge before the frame reacts.
- **Context button guesses wrong.** The state→verb map fires the verb the player didn't
  mean at the worst moment — [[antipattern-guess-the-designer]]. Legible context first.
- **Motion for its own sake.** Constant shake/zoom that drowns the read; the frame's
  job is clarity, not spectacle ([[pattern-readability]]).

## Verify

- **[JUICE.md](../../docs/JUICE.md)** — the game-feel gates: response latency, camera
  behaviour, and the salience floor (the avatar/threat must stay the most legible thing
  on screen at every zoom).
- Buffer and coyote windows: proven at the frame edge by [[system-grace]] — accepted
  inside, refused outside.
- Determinism: view-on == view-off `world.hash()` — all camera and feel motion is
  cosmetic, so it must not touch the sim.
- Trust it fully by pairing with [[pattern-fairness-and-trust]]: an honest pipeline is
  the floor every other system stands on.

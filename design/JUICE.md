# JUICE.md — the game-feel cookbook

The correctness spine proves a game is *not broken*. This is the other half: how to
make it *feel professional* — and how to make that feel **checkable**, not a vibe.

The engine ships a full juice/art kit; the failure mode this doc exists to fix is
that examples historically left it on the shelf (an audit found the art toolkit
used in 0 of 26 games). Every technique below is cosmetic by construction — its own
Rng, out of `world.hash()` — so you can lean into it with zero risk to the sim.

**Reference instance:** the precision platformer
[`examples/small-flame`](../examples/small-flame) leans on this kit and passes its
feel gates. Copy from it; read here for the why.

---

## Part 1 — The juice kit (all cosmetic)

| want | use | one line |
|---|---|---|
| impact dust, bursts, sparkles | `Particles` + `PARTICLE_PRESETS` | `particles.burst(8, feet, PARTICLE_PRESETS.dust())` |
| screen shake | `Shaker` (as the camera's parent) | `shaker.addTrauma(0.12)` on land, `0.5` on death |
| weather / atmosphere | `AmbientField` + `AMBIENT_PRESETS` | `new AmbientField({ width, height, style: AMBIENT_PRESETS.snow() })` |
| depth | `ParallaxLayer` | `new ParallaxLayer({ factor: 0.25 })` — 0 = far/pinned, 1 = foreground |
| pop numbers / pickups | `FloatingText` + `FLOAT_PRESETS` | `pops.pop('✦', at, FLOAT_PRESETS.heal())` |
| terrain silhouette | `autotileToCommands` / `contourToCommands` | seamless inked mass from a boolean grid |
| procedural SFX | `audio.tone/blip/play/success` | `audio.tone({ freq: 180, duration: 0.07, type: 'sine' })` |
| screen-space HUD | `Text` parented to the `Camera2D` | children of the camera ride the screen |

**The cosmetic rule.** Emitters carry their own Rng and never enter the hash. Wire
them to sim *events*, not to state you read back — then a replay reproduces the
exact same show, and deleting the whole view changes not one game bit. Beat/impact
timing is **sim time** (`world.time`, the fixed `dt`), never wall-clock.

## Part 2 — Feel is a curve, not a constant

Juice without restraint is noise. The envelopes that read as *professional*:

- **Screen shake** scales with impact and *decays fast*: land ≈ 0.12 trauma, dash
  ≈ 0.10, death ≈ 0.5, a boss hit ≈ 0.3. Quadratic falloff, decay ≈ 3/s. Too much
  reads as nausea; the feedback gate caps it.
- **Hit-stop** (freeze frames) sells weight, but > ~12 frames reads as a hitch.
- **Particles** answer an event and vanish (life 0.2–0.6s). A *persistent* field
  (snow, ash) is an `AmbientField`, not a stream of bursts.
- **Every event answers on ≥ 2 senses** within the frame: sfx + particles, or sfx +
  flash + shake. One channel reads as cheap. This is the feedback contract (Part 3).
- **Readability first:** the avatar is the brightest, highest-contrast thing on
  screen. Pick a bright avatar token over a low-key ground (small-flame: a gold
  flame on a dim night shaft). The salience gate proves it.

## Part 3 — Make the feel checkable (Channel 4 gates)

Declare the feel, then prove it. See [VERIFICATION.md](../docs/VERIFICATION.md) Channel 4
for the full list; the shape:

```ts
// Declare a feedback contract next to the sim…
export const FEEDBACK: FeedbackContract = {
  land: { channels: ['audio', 'visual', 'haptic'], shake: 0.12 },
  death:{ channels: ['audio', 'visual', 'haptic'], shake: 0.5, hitstopFrames: 6 },
  // …
};

// …and gate it, plus the other three feel fundamentals, in verify.ts:
feedbackIssues(FEEDBACK, ['land','death', /*…*/]).length === 0;          // ≥2 senses, bounded juice
forgivenessIssues(CONFIG).length === 0;                                   // coyote/buffer/corner specced
salienceIssues(world.render(), avatarFill, background).length === 0;      // avatar out-contrasts scenery
cameraIssues(camSamples).length === 0;                                    // no snaps / jerk
```

A gate that fails is a design regression that used to ship silently. That is the
whole point: "green tests, dead game" is the trap — Channel 4 turns more of *feel*
green so a game can't pass every proof and still play like a physics demo.

## Part 4 — Wiring order gotchas (paid for in a platformer build)

- **A tapped jump is cut to 40%.** Variable jump height cuts the rise the instant
  jump is released — so a single-frame tap barely hops. Bots (and jittery players)
  must *hold* jump. Sample `jumpHeld` honestly; make `jumpPressed` a true edge or a
  held button re-buffers into an auto-bounce on landing.
- **The camera snaps to (0,0)** if its follow target has no position when the
  `CameraController` first `ready()`s (children ready before the first `onProcess`).
  Seed the avatar at the spawn *before* wiring the camera, or the camera gate flags
  a snap on frame 1.
- **The pre-start probe has no camera.** `probe()` at frame 0 (before the first
  `step()`) runs before the tree enters — `activeCamera` is null. Drop that sample
  before feeding the camera gate.
- **Reachability over-approximates.** `platformerReachable` ignores ceiling bonks
  and arc collisions; it is a necessary gate, not a sufficient one. The 0-death
  **bot run** through the real game is the ground truth.

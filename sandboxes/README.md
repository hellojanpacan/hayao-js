# sandboxes/ — one mechanic, no genre

A sandbox is the opposite of an example. An example is a whole game built to
**prove the engine**; a sandbox is a single primitive shown **in isolation, with
the knobs exposed**, built to teach *how a part is used* without smuggling in a
genre.

They exist to break an anchoring trap: when the only reference for "how do I use
particles?" is a whole game, an agent absorbs that game's *design* along with its
API calls, and every new game regresses toward the corpus (see the doctrine in
[AGENTS.md](../AGENTS.md#design-from-the-mechanic-not-from-the-corpus)). A
sandbox answers the API question and nothing else, so composition — not
imitation — is what gets learned.

> Reach for `sandboxes/<x>-lab` to learn ONE primitive. Reach for
> `examples/sokoban` to learn how a game is *structured*. Never reach for either
> to decide *what to build*.

## The labs

| Lab | Primitive | Knobs |
|---|---|---|
| `physics-lab` | rigid bodies, joints, raycasts (`createRigidWorld`) | spawn/drop bodies, gravity, restitution |
| `particle-workshop` | `Particles` + `PARTICLE_PRESETS` | preset, count, gravity, spread |
| `camera-lab` | `Camera2D` + `CameraController` | deadzone, smoothing, shake, bounds |
| `pathfinding-demo` | `astarGrid` / `floodFill` | paint walls, move goal, toggle diagonal |
| `juice-lab` | `EASINGS` + `AnimationPlayer` + `spring` | every easing curve, side by side |
| `procgen-lab` | `generateCave`, `valueNoise`, `autotileToCommands` | re-roll seed, fill %, smoothing passes |
| `synth-lab` | `audio` bus + zzfx-style tones | pitch, wave, envelope, play |
| `anim-lab` | `Bone2D` rig + `ClipPlayer` + `Blend1D` + `IkTarget` + `SkeletonDebug` | blend idle↔wave, reach pointer (IK), skeleton overlay, playback speed |
| `webgl-lab` | `WebGL2Renderer` + `WEBGL_EFFECTS` + `BLOOM_PIPELINE` | cycle 8 post-process effects, adjust per-effect param, particle burst, storm stress |
| `card-lab` | `makeCard` slot stack + `resourceGlyph` (the card kit) | four card anatomies side by side, day↔night theme |
| `hero-lab` | the duotone hero rig + its seven authored clips | scheme, facing; jump/spawn/death auto-replay side by side |
| `light-lab` | `LightLayer` + `PointLight` + `occludersFromTilemap` | drive one light (the other orbits), hard/soft shadows, ambient dark |

## The sandbox contract

A sandbox is deliberately lighter than an example — no `logic.ts`, no solver, no
`verify.ts`, no `golden.json`. It still holds the engine invariants, because
those are what make it an honest reference:

```
sandboxes/<slug>/
  index.html   # page shell, loads main.ts (copy any example's — identical)
  main.ts      # runBrowser(<slug>Game, mount)
  <slug>.ts    # the scene: a Node with knobs (input), a live HUD readout,
               # and defineGame({ ..., probe })
```

Rules a sandbox must keep:

1. **Import only from `@hayao`.** Same seam as everything else.
2. **Deterministic.** All randomness through `world.rng`; no wall-clock in the
   sim. A sandbox that re-rolls a seed re-derives identically.
3. **View nodes are `cosmetic = true`.** A sandbox is almost entirely view; keep
   canonical knob state in the node's serialized props (or `world.state`) and
   mark the rest cosmetic so `world.hash()` stays meaningful.
4. **Expose a `probe(world)`** returning the current knob values + a readout, so
   the sandbox is inspectable headlessly like everything else.
5. **No win/lose, no genre.** No `showScreen` game-over, no levels, no score. The
   readout HUD is the whole UI. If it starts to feel like a game, it belongs in
   `examples/`, not here.

To add one: copy the nearest lab, swap the primitive, keep the contract. Then add
a card to the catalog at [`web/src/pages/docs/sandbox.astro`](../web/src/pages/docs/sandbox.astro).

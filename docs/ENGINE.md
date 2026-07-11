# Why a custom engine (and when not to use it)

## The bet
Godot's *authoring model* is superb — a node/scene tree, signals, resources,
input actions, tweens, an animation player. hayao keeps that model wholesale.
What it rejects is Godot's *interface to that model*: GUIs, binary `.tscn`
scenes, a bespoke scripting language, an editor you cannot grep. All of it is
opaque to an LLM.

hayao re-casts every part of the model as **text, typed, greppable, and
headlessly verifiable**:

| Godot | hayao |
|---|---|
| Node/scene tree in an editor | `Node`/`Node2D`/`Sprite`/… in TypeScript (`scene/`) |
| Signals wired in the GUI | `Signal` / `node.signal(name)` in code |
| `.tscn` binary scenes | `node.serialize()` → plain JSON; `deserializeNode()` back |
| Input Map in project settings | `InputMap` object; actions sampled per fixed step |
| Tween / AnimationPlayer | `AnimationPlayer` node + `EASINGS` (deterministic) |
| GDScript + editor run | `step()` in Node; assert on `probe()`/`hash()` |
| "Does it work?" = play it | solver proof + scripted playthrough + determinism |

## Why decouple sim from render
Canvas/engine loops couple game state to the render loop and the browser: the
rAF loop never idles (screenshot tools time out), headless tabs crash or eat
input, and the sim can't be called as a function. hayao inverts it — the sim is
a pure `step(state, input) → state`, and rendering is a *projection*
(`scene → DrawCommand[] → backend`). Consequences:

- The sim runs in Node. Tests need no DOM.
- Replays are input logs; determinism is a hash comparison.
- Levels are searchable → provably winnable.
- Rendering can never change the outcome, so a render bug can't be a logic bug.

## Why SVG-first
From the *One Hundred Year Garden* build: DOM+SVG deletes two whole problem
classes a canvas engine spends real code fighting. SVG is **resolution-
independent** (no fixed backbuffer, no hiDPI text fuzz — the thing humans notice
first) and **DOM-inspectable** (`querySelector` is a probe; synthetic events
drive real input). The Canvas2D backend exists for scenes where DOM node count
would bite (lots of particles); the Headless backend records the display list for
tests and emits a vector screenshot. Same display list, three sinks.

## When NOT to use hayao
Be honest about the edges:

- **Heavy 3D / shader-driven games.** hayao is 2D vector. Use Three/Babylon/Godot.
- **Thousands of sprites at 60fps with per-pixel effects.** The Canvas2D backend
  helps, but a WebGL-batched engine (LittleJS, PixiJS) will win. hayao's sweet
  spot is turn-based, puzzle, simulation, strategy, card, board, management, and
  moderate-entity arcade games — anything where *logic correctness* and *crisp,
  authored vector art* matter more than raw fill rate.
- **Real-time-audio-synced rhythm precision.** Possible, but prototype carefully.

The dividing line: if the game's truth is a **state you can reason about**, hayao
makes it provably correct and cheap to verify. If the game's truth is **pixels
and frame timing**, reach for a GPU engine.

## Lineage
hayao stands on two prior builds: **narrow-js** (a correct-by-construction kit
over the LittleJS canvas engine — the source of the probe contract, winnability
solvers, code-as-art, docs-as-prompts, and DOM-for-menus) and **One Hundred Year
Garden** (a DOM/SVG game whose pure core proved the headless-native, SVG-first
approach). hayao is the synthesis: narrow-js's discipline on OHYG's substrate,
pushed to "the sim is a pure function" as the founding axiom.

---

# The contracts a game author must know

The rest of this file is reference, not rationale: the exact semantics of
drawing, coordinates, lifecycle, and pause. Every one of these earned its place
by being independently rediscovered (wrongly) during a real port — read the
contract instead of reverse-engineering it from a symptom.

## The `draw(out, wt)` contract

A node subclass emits its own commands in `draw(out, wt)`. The one fact that
prevents an entire bug class: **`wt` is the node's OWN world transform** —

- **Self-inclusive**: it already contains this node's `pos`, `rotation`,
  `scale` (and `pivot`). Emit geometry in **local space** (a circle at `cx: 0,
  cy: 0`, a rect at `-w/2, -h/2`) with `transform: wt`. NEVER add `this.pos`
  to the emitted coordinates — that applies the translation twice, and the
  sprite lands at 2× its distance from the origin (the double-apply bug).
- **Camera-inclusive**: the active camera's view transform is already composed
  in. `transform: IDENTITY` therefore means "raw design/screen space, no
  camera" — legal, but for HUD prefer `node.screenSpace = true` (below), which
  gets the same coordinates *plus* the overlay layer, without hand-rolling.

`VerletChain.draw` in `src/scene/verletChain.ts` is a compact reference
implementation: node-local points, emitted directly with the passed transform.

## Screen-space HUD: `node.screenSpace = true`

Set `screenSpace = true` on a node and its whole subtree:

1. **Ignores the camera** — transforms compose from IDENTITY, so `pos` is in
   design coordinates (a health bar at `{x: 20, y: 20}` stays at the top-left
   whatever the camera does; no per-frame `camX + offset` math, no division by
   zoom).
2. **Paints in the overlay layer** — every command it emits is tagged
   `layer: 1`, so it sorts above ALL world content regardless of z values.

This is the idiom for in-canvas HUD (bars, ammo, in-world-styled overlays that
must scale with the letterbox). DOM `showScreen()` remains the idiom for
menus, titles, and settings — humans compare in-scene type to the DOM around
it, and the scene loses (see CONVENTIONS §House style).

## z-ordering is a global painter's sort

Commands sort by `layer` first, then `z`, then tree order as the tiebreak
(`sortCommands` in `src/render/commands.ts`). The sort is **global across the
whole display list, not sibling-local**: a `z: 5` node deep inside one branch
paints above a `z: 1` node anywhere else in the tree. Use the conventional
bands (background → world → actors → fx → HUD) and reserve `layer: 1` for
overlays (set automatically by `screenSpace`).

## Camera & coordinates

With an active `Camera2D` (ignoring camera rotation):

```
screen = zoom · (world − cam.pos) + (width/2, height/2)
```

- **Y increases downward** (screen convention). Angles are radians, clockwise
  from +x under that convention.
- No active camera → view transform is the identity: world == design == screen.
- `world.worldToScreen(p)` / `world.screenToWorld(p)` apply / invert the view
  transform — use `screenToWorld` to turn a design-space pointer position into
  a world coordinate under a scrolled/zoomed camera (and keep the raw floats
  out of the sim; quantize at the host edge, see CONVENTIONS).

Zoom recipes:

- The design resolution (`width`/`height` in `defineGame`) is the fixed frame;
  `cam.zoom = 0.7` shows *more* world at smaller scale, `2` magnifies.
- An interaction radius the player perceives in SCREEN pixels (click slop,
  hover ring) must be divided by `zoom` when tested in world space — at
  `zoom: 2` a 16px screen affordance is an 8px world radius.
- Nonlinear/eased zoom: keep the *logical* zoom in `world.state` (hashed,
  deterministic) and map it to `cam.zoom` in ONE cosmetic place per frame.
  Don't bury a curve inside the camera — pointer math needs the real render
  scale, and one mapping point keeps `screenToWorld` honest.

## Shapes & paint

The `Shape` vocabulary includes `ellipse` (`rx`/`ry`) and `arc` — an open
stroked arc, or a pie when `sector: true` closes it through the center; angles
in radians, clockwise from +x, `start` → `end`. `Paint` grew:

- `lineDash: number[]` — `[dash, gap, …]` in local px (Canvas `setLineDash` /
  SVG `stroke-dasharray` semantics).
- `gradient` — linear or radial, **in object-bounding-box space**: all
  coordinates are 0..1 relative to the painted shape's bounds, so one gradient
  object reads identically on any size shape. Do not pass pixel coordinates.
- `shadow` — `{ color, blur, dx?, dy? }`; `dx = dy = 0` is a symmetric glow,
  offsets make it a drop shadow.

Style is mutable at runtime: **`sprite.paint` is the live style object**
(constructor `fill`/`stroke`/`strokeWidth`/`opacity` only seed it) — flash a
hit by writing `sprite.paint.fill`, no node rebuild. Reassigning
`sprite.shape` per frame is also supported (a shape is plain data): morphing a
pie-timer's `end` angle each step is the intended pattern.

**Robustness:** a malformed command (NaN position, negative or non-finite
radius…) is *skipped* with a console warn-once naming the command kind — it
can no longer kill the render loop. Treat the warn as a bug to fix, not a
feature to lean on.

## Particles

- `Particles.burst(count, at, style)` — `at` is in the **emitter node's local
  space**, not world space. Parent the emitter where the effect lives (or put
  it at the origin and pass world-ish coordinates deliberately).
- `Particles.emit(ratePerSec, style?)` — continuous emission (attached smoke,
  sparks, thruster). `emit(0)` stops. The signal form `emit(name, payload)`
  still works — the overload dispatches on the first argument's type.
- Full-screen weather (rain, snow, drifting motes) is `AmbientField`, not
  hundreds of sprites.

## Lighting

2D lighting is a **deterministic display list**, not a renderer feature. A
`LightLayer` emits its whole light run as ordinary `DrawCommand`s tagged
`layer: LAYER_LIGHT` (= `0.5`), so every backend — Canvas2D, WebGL, and the
headless/SVG the judge sees — receives the identical stream. `sortCommands`
gives three painter bands (`LAYER_WORLD = 0` → `LAYER_LIGHT = 0.5` →
`LAYER_HUD = 1`): the light run multiplies over the lit world but never darkens
the HUD. Compositing is observer-side (`src/render/lightRun.ts` parses the run
once so both raster and SVG interpret it identically), but *what* to composite
is fixed data.

The run, in stream order: (1) an ambient darkness base — a full-viewport `rect`,
`blend: 'multiply'`; (2) per light, a `circle` pool with a radial gradient,
`blend: 'screen'`; (3) that light's shadow quads — closed `poly`s, ambient fill,
`blend: 'multiply'`. `Paint.blend` (`'multiply' | 'screen'`, omit for
source-over) is the Canvas2D/SVG-expressible intersection: canvas maps it to
`globalCompositeOperation`, SVG to `mix-blend-mode`. The SVG encoding is
validated under resvg (the judge's rasterizer) by a permanent golden — the
lighting reads with depth in a headless PNG, not just live.

`LightLayer({ ambient: { color, level }, softShadows, width, height })` holds the
darkness (`level` lifts it toward white so the scene is never fully black) and
emits the run from its direct `PointLight` children. `PointLight({ radius, color,
intensity, falloff, flicker: { amount, speed }, seed })` emits nothing itself
(its `draw` is empty) — the layer reads its world position and cached
`litIntensity`. **A `LightLayer` must sit in WORLD space at the tree origin**,
never under a `screenSpace` subtree (the layer-1 clamp would promote its run out
of the light band): in `draw(out, world)` the pools/quads compose that received
camera transform, while the ambient rect is screen-fixed (`IDENTITY`, sized by
`width`/`height`). Occluders come from the map: `occludersFromTilemap(map)` →
segments, fed via `layer.setOccluders(segs)`; the layer culls to each light's
reach (`cullSegments`) and extrudes `shadowQuads` per frame.

```ts
import { LightLayer, PointLight, occludersFromTilemap, REGALIA_NIGHT, REGALIA } from '@hayao';

const lights = new LightLayer({ ambient: { color: REGALIA_NIGHT.bg, level: 0.16 }, softShadows: true });
lights.setOccluders(occludersFromTilemap(map));   // shadows off the solid tiles
lights.addChild(new PointLight({ radius: 260, color: REGALIA.gold, intensity: 1,
  falloff: 1, flicker: { amount: 0.12, speed: 9 }, seed: 11 }));
world.root.addChild(lights);                       // world space, at the origin
```

Both nodes are `cosmetic = true` (out of `hash()`); flicker runs on a private
observer-seeded `Rng` in `onProcess`. See `sandboxes/light-lab/` for the lit
tilemap in isolation and `examples/duskveil/` for a shipped relight.

## Animation

Authored animation is a separate, purely-cosmetic layer over the rig. A
`ClipDef` is **plain, serializable data**: `{ duration, loop, tracks, events? }`.
Each `TrackDef` targets one `channel` (`'x' | 'y' | 'rotation' | 'scaleX' |
'scaleY' | 'opacity'`) of one node addressed by a `'/'`-separated path from the
rig root (matched by `Node.name`, e.g. `'upperArm/forearm'`), with ascending
`Keyframe`s `{ t, v, ease? }`. `ease` is an `EASINGS` name only. `loop` is
`'loop' | 'once' | 'pingpong'`. `events` fire on a **fixed half-open `(t0, t1]`**
window in clip-local time (an event exactly at the new time fires, one at the old
time does not re-fire; a `loop` wrap emits the tail then the head; `once` never
re-fires). `sampleClip(def, elapsed)` is the pure reference sampler;
`clipIssues(def, knownTargets?)` validates the data in the `levelIssues` idiom
(all problems at once, never throws).

`ClipPlayer` is the cosmetic Node that plays clips onto a rig: `add(name, def)`,
`play(name, { fade })` (crossfade over `fade` seconds), `stop()`, `rebind()`;
`event` / `finished` signals; `time` / `current` reads. It prebinds each track to
its resolved node once (`buildSkeleton` → `resolveTracks` → `applyChannel`) so the
per-frame apply is allocation-free. **The ordering contract is the tree's DFS
order — no scheduler:** make the `ClipPlayer` child 0 of the rig, `IkTarget`s
later siblings, `VerletChain`s deeper, so writes land **clip → IK → verlet** (the
clip poses the joints, IK overrides the limb it owns, springs trail the result).

Blending is pure pose math: a `Pose` is a flat `"target/channel" → number` bag;
`mixPose` lerps two, `Blend1D`/`Blend2D` weight source clips by a parameter (all
sampled at one shared normalized phase — the walk/run foot-lock). `Bone2D` is a
`Node` + a `length` (the reach IK/skinning/debug need); it is **not** forced
cosmetic — a rig can be hashed structure, only the *writers* are cosmetic.
`solveTwoBoneIK` (analytic) and `solveFabrik` (N-bone) are pure and `dmath`-only,
so the same implementation is safe on either side of the seam; `IkTarget` drives
a `Bone2D` chain to reach the target node's own world position. `SkeletonDebug`
overlays bones/pivots as transient commands.

```ts
import { Bone2D, ClipPlayer, IkTarget, type ClipDef } from '@hayao';

const wave: ClipDef = { duration: 1.2, loop: 'loop',
  tracks: [{ target: 'upperArm', channel: 'rotation',
    keys: [{ t: 0, v: -0.9 }, { t: 0.6, v: -1.15, ease: 'sineInOut' }, { t: 1.2, v: -0.9, ease: 'sineInOut' }] }],
  events: [{ t: 0.3, name: 'wave' }] };

const player = new ClipPlayer({ rig });   // child 0 of the rig
player.add('idle', idle).add('wave', wave);
rig.addChild(player);
player.play('wave', { fade: 0.25 });
rig.addChild(new IkTarget({ bones: [upperArm, forearm], bendDir: 1 })); // later sibling
```

**`ClipPlayer` vs `AnimationPlayer`:** reach for `ClipPlayer` to play whole
authored multi-track rigs against a skeleton; `AnimationPlayer` remains the tool
for ad-hoc value tweens (fade this one property, pulse that one scale) with no
rig. See `sandboxes/anim-lab/` for the rig + clips + blend + IK wired idiomatically.

## Transform semantics (parents, flips, pivots)

- A parent's rotation/scale transforms its CHILDREN (never its siblings) —
  transforms compose down the tree, exactly like Godot.
- **Character-group pattern:** author a character's parts as children facing
  RIGHT, then flip the whole character with parent `scale.x = -1`. Never
  compensate per-child (negating offsets, mirroring each part) — that fights
  the composition and breaks the moment a part is added.
- `Node.pivot` — a local point that rotation/scale anchor to instead of the
  node origin (a door hinged at its edge, a tail wagging from its base).
  Serialized only when set, so existing pinned hashes survive.
- `composeTransform(m, n)` applies **n first, then m** (matrix product M·N) —
  the same order as function composition `m(n(x))`.

## Lifecycle: free, clearChildren, first frame

- **`free()` is deferred** to end-of-step (safe during iteration). The
  corollary: freed nodes survive until the step ends. During a scene swap that
  lets old nodes run one contaminated step inside the new scene —
  **`world.flushFree()`** forces the queue now. Pattern:
  `oldRoot.free(); world.flushFree(); buildNewScene()`.
- **`node.clearChildren()` is immediate** — children are exited and detached
  when it returns. Use it to rebuild a container wholesale; prefer `free()`
  for removals during an update.
- **The first frame renders before the first update.** An overlay meant to be
  hidden until some event must be built with `visible: false` in `build()` —
  hiding it in `onUpdate` is one frame too late and it flashes.

## Pause & time scale

- `world.paused = true` — only `pauseMode: 'always'` subtrees keep updating;
  rendering, input sampling, and the clock keep ticking, so a pause menu (an
  `'always'` subtree) stays live.
- `node.pauseMode: 'inherit' | 'always' | 'stopped'` — `'inherit'` (default)
  takes the parent's effective mode; `'always'` runs through a pause;
  `'stopped'` halts its subtree even while the world runs.
- `world.timeScale` — slow-mo/fast-forward: the tree receives
  `dt × timeScale`, while `'always'` subtrees get the UNSCALED dt — so pause
  menus and UI tweens keep realtime feel through both pause and slow-mo.
- Both are hashed/snapshotted **only when non-default**, so pinned golden
  hashes of games that never pause are unchanged.

## Typed state & the world context

- `defineGame<TState>` / `World<TState>` type `world.state` — canonical
  out-of-tree sim state, plain JSON, hashed + snapshotted.
- Behaviors get everything through the third `WorldContext` argument:
  `ctx.state`, `ctx.events`, `ctx.input`, `ctx.rng`, `ctx.time`,
  `ctx.width/height`, `ctx.paused`, `ctx.timeScale`, and `ctx.camera()`
  (the active camera's `{ pos, zoom }` or null — parallax and screen-edge
  logic without a sibling search). **There is no longer any reason for
  module-level mutable game state** — it leaks across `restart()` (a new
  world, the same module) and hides from `hash()`; `ctx.state` does neither.
- `world.resource<T>(key)` throws on an unknown key, listing what IS
  available — a typo can't silently read `undefined` into the sim (same
  contract as `world.tune`).

## Tree inspection

`world.walk(fn)` visits every live node depth-first; `world.nodeCount` counts
them; `world.debugTree()` returns one indented line per node with type, flags
(`cosmetic`, `screenSpace`, pause mode, `!visible`) and position — drop it
into a test-failure message. For per-frame access, **cache node refs at
`build()`/`onReady` time**; `find()` is a full-tree O(n) scan and does not
belong in `onUpdate`.

## Coroutines: sequenced flow without async

`Coroutines` (`import { Coroutines, sleep, waitFor, nextStep, race, all }`)
runs plain generators on the fixed clock — intros, cutscenes, boss phases,
tutorials, with unlimited concurrent runners:

```ts
const co = new Coroutines();
co.start(function* () {
  yield sleep(1.5);
  const winner = yield race(waitFor(() => bossDown), sleep(30));  // index of the winner
  yield nextStep();               // let the spawn render one frame
}, 'boss-outro');
brain.onUpdate = (_n, dt) => co.step(dt);   // the game owns WHEN it advances
```

Promises/`async` are banned in the sim because `await` resolves on the
microtask queue, whose interleaving with the loop is engine- and
load-dependent — two runs (or two netplay peers) disagree on which tick a
`sleep` lands on. A generator only advances when `co.step(dt)` says so, so
every resume is an exact sim step and replays are bit-identical. Yielding
another runner's handle joins it; a throw kills only that runner (name your
runners). See `src/logic/coroutine.ts` for the full semantics.

## Porting notes (js13k → hayao)

Recurring traps from porting js13k-style code, worth checking mechanically:

- **Argument order:** js13k helpers are usually `between(lo, v, hi)`; hayao is
  `clamp(v, lo, hi)` — value FIRST. A mechanical rename compiles fine and
  clamps to garbage.
- **Cap velocities** wherever a collision response *adds* energy (bounces,
  knockback, springs). The original often survived on frame-rate luck; a
  fixed-step port faithfully integrates the explosion.
- **Pair every position-driven movement with a collision resolve.** Code that
  writes `pos += v·dt` and separately checks overlap tunnels through walls the
  moment speed × dt exceeds wall thickness. The `physics/platformer` and rigid
  body modules do this internally; hand-rolled movement must do it too —
  resolve immediately after every position write, not once per frame somewhere
  else.

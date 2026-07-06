# Conventions — how games are built in hayao.js

Every game in this repo follows these. They exist so that any game — by any
author, human or AI — inherits determinism, testability, and the house look for
free. They are the practical restatement of [ARCHITECTURE.md](ARCHITECTURE.md);
where the two disagree, ARCHITECTURE wins.

---

## Files & boundaries

- A game lives ONLY in `examples/<slug>/`: an `index.html` + a `game.ts` entry,
  split into small modules once the entry approaches ~400 lines (pure sim logic
  in one file, scene/rendering wiring in another). The vite config
  auto-discovers `examples/<slug>/index.html` — a new folder needs zero config.
- Import ONLY from `'@hayao'` — never from `'@hayao/core/rng'`, `'../src/...'`,
  or any deep path. The barrel (`src/index.ts`) is the entire public surface;
  keeping imports there is what lets the internals move without breaking games,
  and lets one grep of one file answer "what can I call?".
- Never modify `src/*`, `package.json`, `docs/ARCHITECTURE.md`, other examples,
  or root config from within a game task.
- Register the game in the hub (`index.html`) so it appears in the example list.

## Bootstrap: `defineGame()`

A game is a single `defineGame()` value — a plain, declarative description of
how to build the initial world, what the input map is, and (optionally) its
levels and probes. It contains **no host wiring**: the same value runs under
`runBrowser()` (rAF loop, real input, an `SvgRenderer`, audio, the UI shell) or
`runHeadless()` (no host; used by tests and `npm run verify`) unchanged.

```ts
import { defineGame, World, Node2D, Sprite, DEFAULT_INPUT_MAP } from '@hayao';

export default defineGame({
  title: 'Slug Rush',
  inputMap: DEFAULT_INPUT_MAP,            // action → key codes (never raw keys in logic)
  build(world: World) {                    // populate the initial scene tree
    const player = world.root.addChild(new Sprite({
      name: 'player',
      shape: { kind: 'circle', radius: 16 },
      fill: '#2485a6', stroke: '#232228', strokeWidth: 3,
    }));
    player.onUpdate = (n, dt, ctx) => {       // ctx = the host world (input/rng/clock/time)
      const move = (ctx.input.isDown('right') ? 1 : 0) - (ctx.input.isDown('left') ? 1 : 0);
      n.pos.x += move * 200 * dt;          // dt is the FIXED step — deterministic
    };
  },
  probe(world) {                           // compact JSON snapshot for the harness
    return { ...world.probe(), x: world.root.find('player')?.pos.x };
  },
});
```

The engine, not game code, owns the clock, the rAF loop, focus, audio muting,
and the DOM shell. Do not re-implement any of that inside a game.

The third `onUpdate`/behavior argument is the **world context** (`input`, `rng`,
`clock`, `time`, plus `state`, `events`, `width`/`height`, `paused`,
`timeScale`, and `camera()`) — prefer it over closing over `world` from
`build()`, so a node's behavior is self-contained and liftable. Type the state
with `defineGame<TState>` and keep it in `world.state`/`ctx.state` — never in
module-level variables, which leak across `restart()` and hide from `hash()`
(see ENGINE.md §Typed state). For headless tests, `world.runSteps(n,
i => actions)` fast-forwards an exact step count; `world.advance(realMs)` is the
*realtime* driver and clamps big deltas to one frame budget (never use it to skip
ahead in a test).

## Renderers

The engine ships four renderer backends, all consuming the same `DrawCommand[]`
display list. The sim never reads the renderer — renderer choice is purely a host
concern and has zero effect on `world.hash()` or determinism.

| Backend | `RunOptions.renderer` | Best for |
|---|---|---|
| `SvgRenderer` | `'svg'` (default) | Sparse scenes, DOM inspection, crisp resolution-independence |
| `Canvas2DRenderer` | `'canvas'` | High entity counts, particles, performance-first |
| `WebGL2Renderer` | `'webgl'` | Post-processing effects (bloom, pixelate, glitch, palette rotation) |
| `HeadlessRenderer` | — (Node.js only) | Tests, `npm run verify`, `toSVGString()` |

To select a renderer:

```ts
import { runBrowser, WebGL2Renderer } from '@hayao';

// Built-in string shorthand:
runBrowser(def, mount, { renderer: 'webgl' });

// Or pass your own configured instance directly via the DOM:
const renderer = new WebGL2Renderer({ width, height, background,
  postProcess: `#version 300 es
    precision mediump float;
    in vec2 v_uv;
    uniform sampler2D u_scene;
    out vec4 fragColor;
    void main() {
      // Vignette
      vec2 uv = v_uv - 0.5;
      float d = dot(uv, uv);
      fragColor = texture(u_scene, v_uv) * (1.0 - d * 1.8);
    }`,
});
```

### WebGL2Renderer post-processing

`WebGL2Renderer` rasterizes the full display list via Canvas2D (pixel-exact
parity with `Canvas2DRenderer`) then passes the frame through a GLSL fragment
shader. This gives you any full-screen effect in 5 lines of GLSL, without
touching the display list or the sim.

The fragment shader interface:
- `in vec2 v_uv` — 0..1 UV with (0,0) at top-left
- `uniform sampler2D u_scene` — the rasterized frame
- `out vec4 fragColor` — output pixel

Change the shader at runtime:
```ts
// On game handle:
(handle.renderer as WebGL2Renderer).setPostProcess(shaderSrc);
(handle.renderer as WebGL2Renderer).clearPostProcess(); // back to passthrough
```

**Verifiability**: because the renderer is a pure display-list consumer, the
`HeadlessRenderer` and `SvgRenderer` see the identical `DrawCommand[]` input
and remain the reference backends for all verify passes. Post-processing effects
are cosmetic — they are never part of the game's `world.hash()`.

## Pointer & continuous input

Keyboard actions are the default and the only input that flows through the
deterministic log. For games driven by *where* the cursor is (slice, aim, drag,
point-and-click, placement), `runBrowser` wires a **`PointerSource`** that samples
the cursor into `world.input.axes` each step, in DESIGN space:
`ctx.input.axis('pointer.x' | 'pointer.y' | 'pointer.down')`. Need the mapping
yourself? `handle.toDesign(clientX, clientY)` (or `renderer.toDesign`) undoes the
letterbox once, so no game re-derives `getBoundingClientRect()` math.

Determinism caveat: pointer axes are live host samples — they are NOT in the string
input log or `world.hash()`, so a raw pointer trail does not replay the way key
actions do. For lockstep/replay, **quantize at the host edge**: map a tap to an
action (`input.press('fire')`) or snap position to a grid cell you feed as a
discrete move. Keep raw pointer floats out of the sim's canonical state.

**Replay-exact analog** (twin-stick aim, analog throttle): pass QUANTIZED axes as
`world.step(actions, axes)`'s second argument. Those enter `getState()` → hash and
the input log (`InputRecorder`/`frameAxes`), so `assertDeterministic` and netplay
reproduce them. Snap at the edge with `snapAxis(v, buckets)` / `quantizeAngle(rad,
buckets)`. Games that never pass axes keep their pinned hashes byte-for-byte.

**Mouse buttons are actions.** The browser driver wires PointerSource to the
KeyboardSource, so while a button is held the actions `mouse.left` /
`mouse.right` / `mouse.middle` are down — bindable in an inputMap
(`shield: ['mouse.right']`), queryable directly
(`input.justPressed('mouse.left')`), and replay-exact because they enter the
same deterministic actionsDown log as keys. The raw 0/1 axes `pointer.right`
/ `pointer.middle` exist alongside `pointer.down` for analog-style reads. The
browser context menu is suppressed by default so right-click is usable as game
input (opt back in via `PointerSourceOptions.contextMenu`).

**Action names, not key codes.** `isDown`/`justPressed`/`justReleased` take
ACTION names from the input map (`'jump'`), never key codes (`'Space'`). Once
a host has declared its sources, querying an action no source can produce
logs a console.warn once per name — so `isDown('jmup')` fails loudly instead
of silently never firing. (`justReleased` exists and mirrors `justPressed`.)

**Sustained virtual input.** `press()` is a one-shot tap (cleared after one step).
For an on-screen control that models STATE (held joystick, hold-to-fire), use
`input.setHeld(action, on)` — it stays in the action set every step until released,
no re-press-per-frame.

**Multitouch.** `pointer.read()`/`sample()` describe the primary pointer (unchanged).
For two thumbs at once, `pointer.readAll()` returns every live touch with its stable
`id`. Or skip the raw layer: **`TouchControls`** (`ui/`, sibling to `Shell`) renders
floating sticks/buttons and drives the same action set via `setHeld` — a virtual
gamepad in one declaration. Anchor host-drawn UI to the played area with
`handle.viewport()` (letterbox rect + scale), never re-derived `getBoundingClientRect`.

**Proving the host layer.** Touch/pointer host code is the one layer sim proofs
can't see. `bootDom(def)` (`verify/dom`, under jsdom/happy-dom) boots the real
`runBrowser` wiring, fires synthetic touches, and steps so you assert on `probe()`.


## Custom input sources (gamepad, MIDI, accelerometer, …)

The engine's input layer is open-ended: anything that implements `InputSource`
(`sample(input: InputState) + optional dispose()`) can be plugged in alongside
the built-in `KeyboardSource` and `PointerSource`.

### Wiring a source into the step loop

Pass sources at start-up — or add them after the handle is returned:

```ts
import { GamepadSource, DEFAULT_GAMEPAD_MAP } from '@hayao';

// Option A: at start-up
const handle = runBrowser(def, mount, {
  sources: [new GamepadSource({ keyboard: handle.input })], // ← needs handle first
});

// Option B: post-creation (recommended for gamepad — wait for 'gamepadconnected')
const handle = runBrowser(def, mount);
window.addEventListener('gamepadconnected', () => {
  const gamepad = new GamepadSource({ keyboard: handle.input });
  handle.addSource(gamepad);  // sampled every step; addSource returns a cleanup fn
});
```

### Axis naming convention

Use a dotted namespace prefixed by the source name. All hayao built-ins follow:

| Axis key          | Source       | Range  | Notes                           |
|-------------------|--------------|--------|---------------------------------|
| `pointer.x`       | PointerSource| design | Design-space x (letterbox-safe) |
| `pointer.y`       | PointerSource| design | Design-space y                  |
| `pointer.down`    | PointerSource| 0/1    | Primary pointer pressed         |
| `gamepad.lx`      | GamepadSource| ±1     | Left stick x (after deadzone)   |
| `gamepad.ly`      | GamepadSource| ±1     | Left stick y                    |
| `gamepad.rx`      | GamepadSource| ±1     | Right stick x                   |
| `gamepad.ry`      | GamepadSource| ±1     | Right stick y                   |
| `gamepad.lt`      | GamepadSource| 0..1   | Left trigger                    |
| `gamepad.rt`      | GamepadSource| 0..1   | Right trigger                   |
| `gamepad.dpad.x`  | GamepadSource| −1/0/1 | D-pad horizontal                |
| `gamepad.dpad.y`  | GamepadSource| −1/0/1 | D-pad vertical (−1 = up)        |

Custom sources: follow the same dotted convention (`mydev.axis1`, `midi.cc7`).

### When to call sample()

The engine calls `sample(world.input)` once per fixed step, **before**
`world.advance()`. This mirrors `PointerSource.sample()` in the browser driver.
Never call `sample()` inside `onUpdate` or from sim code — axes are host-side.

### Determinism rules for custom sources

1. **Quantize at the host edge.** Use `snapAxis(v, buckets)` / `quantizeAngle`
   before writing to `input.axes`. Unquantized floats differ across machines and
   across frames when the device hasn't moved — quantized values are stable.
2. **Axes are live by default** (NOT in `world.hash()` or the input log). This
   is correct for most uses: the sim reads a "current" value, and replay is
   driven by the recorded action log, not raw hardware.
3. **For replay-exact analog** (twin-stick aim, analog throttle): pass the
   quantized axes as the SECOND argument to `world.step(actions, axes)`. They
   then enter `getState()` → hash and `InputRecorder` (same as pointer axes in
   Studio sessions). Only do this if you need bit-exact replay of analog values.
4. **For discrete input** (button press → action): call
   `keyboard.setHeld(action, on)` — presses flow through `KeyboardSource.currentActions()`
   into the SAME deterministic string log as keys and are covered by record/replay
   and lockstep netplay at zero extra cost. This is what `GamepadSource` does for
   its `buttonMap`. Prefer `setHeld` over `press()` for buttons: `press()` is a
   one-shot tap (cleared after one step), `setHeld` models the held/released cycle.

### GamepadSource

`GamepadSource` is the reference implementation of `InputSource`. It polls
`navigator.getGamepads()` per step and provides:

- **Analog sticks + triggers** as quantized axes (see table above).
- **D-pad + face buttons + start/select** as deterministic actions via a
  `GamepadMap` (button index → action name). Defaults match `DEFAULT_INPUT_MAP`
  so a gamepad works with the keyboard action set out of the box.
- **Deadzone** with circular magnitude clamping (default 0.12, matching typical
  hardware drift). Output is remapped to fill the full ±1 range post-deadzone.
- **Configurable quantization** (`stickBuckets`, `triggerBuckets`).

```ts
import { GamepadSource, DEFAULT_GAMEPAD_MAP } from '@hayao';

const gamepad = new GamepadSource({
  keyboard: handle.input,                // required for button→action routing
  index: 0,                              // gamepad slot (default 0)
  deadzone: 0.15,                        // override default 0.12
  stickBuckets: 64,                      // coarser for a grid-based game
  buttonMap: {
    ...DEFAULT_GAMEPAD_MAP,
    6: 'dodge',                          // LT → dodge action
  },
});
const removeGamepad = handle.addSource(gamepad);
// later: removeGamepad() to dispose and stop sampling
```

Sim code reads analog axes the same way pointer input is read:

```ts
player.onUpdate = (n, dt, ctx) => {
  const lx = ctx.input.axis('gamepad.lx'); // −1..1 after deadzone + quantize
  const ly = ctx.input.axis('gamepad.ly');
  // Also check the fallback action for keyboard/dpad parity:
  const dx = ctx.input.isDown('right') ? 1 : ctx.input.isDown('left') ? -1 : lx;
  n.pos.x += dx * 200 * dt;
};
```

### Building your own InputSource

```ts
import { InputSource, snapAxis, InputState } from '@hayao';

class AccelerometerSource implements InputSource {
  private x = 0;
  private y = 0;

  constructor() {
    window.addEventListener('devicemotion', (e) => {
      this.x = e.accelerationIncludingGravity?.x ?? 0;
      this.y = e.accelerationIncludingGravity?.y ?? 0;
    });
  }

  sample(input: InputState): void {
    // Normalize to ±1, quantize for determinism.
    input.axes.set('accel.x', snapAxis(this.x / 9.8, 64, -1, 1));
    input.axes.set('accel.y', snapAxis(this.y / 9.8, 64, -1, 1));
  }
}

handle.addSource(new AccelerometerSource());
// Sim: ctx.input.axis('accel.x')
```

## Depth & 2.5D (isometric / overlap)

Painter's `z` is the one depth primitive: the renderer stable-sorts by it, ties
broken by tree order. For any game where sprites overlap (top-down, iso), derive
`z` from a depth axis instead of hand-setting it per mover:

- **`DepthSort({ key })`** — a container that assigns each child's `z` from an
  accessor at draw time (positions are final for the frame). `key: (n) => n.pos.y`
  for top-down overlap; `key: (n) => n.gx + n.gy` for an iso lattice. It removes
  per-node depth bookkeeping from every overlap game.
- **`iso({ tileW, tileH, origin })`** — the grid↔screen projection (core, no
  trig, hash-safe). `toScreen(gx, gy, elev?)` places a cell; `toGrid(sx, sy)`
  inverts the ground plane so `pointer.x/y` → a tile coord. Use this for picking;
  `physics/tilemap` is **orthogonal-only** and cannot pick on an iso map.
- **`IsoPrism({ tileW, tileH, height, fill })`** — a raised tile as three
  auto-shaded faces (top + two sides), one node instead of three hand-rolled
  polys. Pairs with `DepthSort` keyed on `gx + gy`.
- **`diamond` / `regularPoly` shapes** — sugar over `poly` so an iso tile or hex
  reads as intent, not four re-typed corners.

## The animation & lighting seam

Two subsystems landed in 0.4.1 — authored **animation** (clips, blend spaces, IK,
skeletons) and 2D **lighting** (a light layer, point lights, occluder shadows).
They look unrelated, but they ride the SAME rule, and it is the one rule that
keeps them from rotting the sim: **deterministic data lives in the sim; the
motion and the light are observer-side presentation.**

Concretely, on the LOGICAL side (`world.state`, hashed, rolled back, replayed):
the pose a game *reasons about* is an `Fsm.current` / `PhaseClock` / committed
anchors + hitboxes in `world.state`, all advanced through `dmath`. Light state
that *drives gameplay* (is the torch lit? how alarmed is the sentry?) is a value
in `world.state` too. On the OBSERVER side: `ClipPlayer`, `IkTarget`,
`SkeletonDebug`, `LightLayer`, and `PointLight` are all `cosmetic = true` by
construction — they render state that lives elsewhere and are **excluded from
`serialize()` / `hash()` / `snapshot()`**. State flows LOGICAL → view, never the
reverse.

What that forbids, in order of how often it bites:

- **Never read a visual pose back into the sim.** A gameplay anchor — a muzzle,
  a hand, a foot-plant — is computed on the LOGICAL side with `dmath`, NEVER read
  from a posed `bone.worldTransform()`. The clip/IK result is one frame of eased,
  crossfaded, observer-only motion; sampling it into the sim couples the hash to
  the animation and the replay diverges. **The committed-anchor recipe** is the
  lead pattern: the sim owns the muzzle point as a `dmath` offset from the
  logical body (in `world.state`); the ClipPlayer poses the visible gun to *point
  at* it; a shot spawns from the committed anchor, not from the barrel sprite's
  world transform. The picture follows the truth; the truth never asks the
  picture where it landed.
- **Blend weights, IK reach, and light intensity never gate gameplay.** A
  `Blend1D` weight, an `IkTarget.reached` flag, a `PointLight.litIntensity` after
  flicker — these are view outputs. Branch gameplay on the logical parameter that
  *fed* them (the `world.state` speed, the logical "is the target in range"
  distance, the `world.state` lit boolean), not on the interpolated result.
- **Secondary-motion and flicker RNG is observer-seeded — never `world.rng`.**
  A `PointLight`'s flicker uses a private `Rng` seeded at construction (the
  Particles precedent), advanced in `onProcess`, never in `draw` (which may run
  0..n times per step). Same for any spring/wobble jitter on the rig. Pulling
  those numbers from `world.rng` would race the gameplay stream and desync every
  replay.

**The proof pattern to copy** is the stripped-rig hash-equality test in
`src/scene/clipPlayer.test.ts`: build a world whose logic advances every frame
*with* the full cosmetic rig, build the same world *without* it, and assert
`withRig.hash() === without.hash()` at every frame (plus `assertSnapshotStable`
with warmup landing mid-clip and mid-crossfade). If stripping the animation
changes the hash, a visual write has leaked into the sim — the test names the
frame. Lighting has the same proof: `examples/duskveil/` was relit with a
`LightLayer` + two cosmetic `PointLight`s over the existing fight, and its golden
hash is **unchanged** — the lights are pure view, so the pinned replay survives
the relight. Both sandboxes wire the seam the idiomatic way end to end
(`sandboxes/anim-lab/` for the rig, `sandboxes/light-lab/` for the lights):
canonical knob state is hashed, the whole rig/light apparatus is cosmetic and
excluded.

## The human-contact layer

The first real playtest of the campaign found every defect in the one layer
sim proofs cannot see. These rules close that gap; the machine-checkable ones
are enforced by `layoutIssues()` / `missingControlHints()` from `@hayao`,
which every verify suite must run on its representative screens.

- **Text is sacred.** A shape either fully CONTAINS a text's box (it is a
  panel/scrim) or stays fully clear of it — partial overlap is a collision.
  Background lattice (z ≤ 1: tile grids, felt) is exempt. HUDs drawn over
  world geometry get a scrim panel, not hope.
- **First contact teaches.** Every action in the input map must be named by
  some on-screen text on the first frame (`missingControlHints` = []). Games
  with phases show a CONTEXTUAL coach line ("X has moved — F fires"), not one
  static legend. Anything tactical gets an onboarding overlay: goal, threat,
  verbs — a stranger must know what to do within 30 seconds.
- **Every entity kind is legible.** Distinct shape+outline per kind (items
  must not share silhouettes with creatures) and a legend that names them
  with their true glyphs.
- **Fiction is earned.** Ending copy may not introduce proper nouns the game
  never showed; if the title names a thing in-fiction, the first screen says
  so (the HUD naming "THE DUSKVEIL" is what earns "The Duskveil lifts").
- **No safe camp.** Every real-time game's verify includes a degenerate-
  position probe: park at edges/corners and prove the threat still reaches.
  Bots demonstrate the intended line; this proves there's no cheaper one.
- **The screen arrives intact.** Renderers letterbox (never stretch or crop);
  sim clamps include sprite EXTENTS so nothing sinks out of view at the rim.

## Pure-sim separation (turn-based / puzzle games: mandatory)

For anything grid- or turn-based, keep the **rules** in a module with NO scene
or render imports: state in, state out, deterministic. This is the module the
solver runs over (see [VERIFICATION.md](VERIFICATION.md)); the scene tree then
becomes a thin *projection* of that state. Real-time games instead put logic in
node `onUpdate`/behaviors, but the same rule holds: all state lives in the tree
or a pure module, never in a renderer or the DOM.

The same discipline applies to menus and settings: model them as a pure reducer
`(state, action) → { state, fx }`, with sound cues returned as data, then render
via the DOM shell. "Pure logic" is for anything with state transitions, not just
puzzles.

## Determinism rules (the contract — restated from ARCHITECTURE §Determinism)

These are non-negotiable. Break one and `assertDeterministic` fails loudly,
which is the point.

1. **All randomness flows through `Rng`.** Use `world.rng` (or a child from
   `world.rng.split(key)`). `Math.random()` is banned in `src/` and in games.
2. **No wall-clock reads in the sim.** Time comes from the `Clock`
   (`world.time`, `world.frame`, and the fixed `dt` passed to `update`).
   `Date.now()`, `performance.now()`, and argless `new Date()` are banned in
   sim code.
3. **The scene tree updates in a fixed order** — depth-first, child-index order.
   Don't reorder children for logic reasons mid-step; don't depend on iteration
   racing anything else.
4. **Iterate collections in a stable order** — arrays or insertion-ordered
   `Map`s. Never rely on `Set` iteration order or `Object` key order for logic.
   (The state hash sorts object keys for you, but your *logic* must not branch
   on unordered iteration.)
5. **Floating point is fine** as long as 1–4 hold: same ops, same order, same
   engine → same bits.

RNG state and clock state are part of `world.hash()`, `world.snapshot()`, and
saves, so a restored world resumes *identically* — that is what makes replay,
undo, and time-travel free.

**The dev guard.** Pass `guardDeterminism: true` in the world config and every
`step()` wraps `Math.random`/`Date.now` so a stray call inside the sim warns
ONCE with a stack hint (values still flow — nothing breaks mid-frame). It
never throws, so it is safe to leave on in tests and dev builds. It converts
"the replay diverged three hours later" into "here is the exact call site, now".

**Cosmetic randomness.** Rule 1 has two escape hatches for pure-view code so
decoration never perturbs the gameplay stream:

- `world.rng.split(key)` derives an independent child stream — give a cosmetic
  node its own private `Rng` at construction (Particles and Shaker do this),
  and its draws stop racing gameplay draws for the same numbers.
- `hashNoise(...values)` is *stateless* deterministic noise → `[0, 1)`: same
  inputs, same output, no stream consumed — so it is safe to call from
  `draw()` for per-entity variation (`hashNoise(i, ctx.frame)` for jitter,
  phase offsets, hue nudges). Never call `rng.float()` from `draw()`.

**Catch-up steps.** `advance(realMs)` runs as many fixed steps as real time
demands, clamped at `clock.maxFrameMs` (default 250, with a warn-once when it
clamps). So the FIRST advance after a stall — tab restored, debugger resumed,
slow boot — can legitimately run multiple steps at once, and first-frame logic
that assumes "one advance = one step" (e.g. gravity applied before the floor
exists) sinks the player. Guard the logic, and in tests never fast-forward
with a big `advance(ms)` — use `runSteps(n)`, which has no realtime clamp.

## House style (defaults — swap deliberately, not accidentally)

- **Code-as-art, zero binary assets.** A `Sprite` is a vector `Shape`
  (`rect` / `circle` / `poly` / `path`) or a `glyph` (a Unicode character) —
  never a bitmap. Unicode glyphs (♞ ♝ ⚔ ☠ ✿) are instant, legible art.
  **Shape origins:** `rect`/`circle`/`glyph` are CENTER-anchored on the node's
  `pos` (a rect draws from `-w/2,-h/2`); `poly`/`path` points are local to `pos`.
  Thinking in corners? Pass `{ kind: 'rect', w, h, anchor: 'topLeft' }` — otherwise
  a top-left mental model lands the box half-a-size off.
  **Outlined text:** a `Text` node carries `Paint`, so `stroke`/`strokeWidth`
  outline the glyph (the outline lays UNDER the fill, so it frames rather than
  eats the letter) — the way to make a label read on both light and dark grounds.
  Don't stack offset copies to fake a halo; one `stroke` does it.
- **Default palette is Kentō** (`import { KENTO, MEADOW, DUSK } from '@hayao'`).
  It fuses the site's washi/sumi/ai/shu ink tokens with landscape hues loosely
  drawn from Miyazaki-16 — eight named hues, each with a `Deep` tone for light
  grounds and a bright tone for dark grounds, so `MEADOW` (light) and `DUSK`
  (dark) share one identity. Pick hues by name (`KENTO.asagi`); reach for ~5–6
  per game plus a ground. Alpha/tone variants via `withAlpha`/`mix` are welcome;
  monospace/terminal defaults read as lazy and are discouraged. The engine stays
  palette-agnostic — Kentō is a consistent starting point, never a restriction.
  Every Kentō pairing is WCAG-AA verified: `npm run palette` is the gate.
- **Pickups and interactables carry a dark ink outline** (`stroke: KENTO.sumi`
  on light, `KENTO.gofun` rim on dark), plus a glow/pulse for emphasis. An
  accent-colored shape flat on the floor vanishes the moment two hues share a
  family — contrast lives in the edge, not the fill. Judge contrast from a
  rendered SVG, never from hex values.
- **Menus, titles, HUD, and settings are DOM overlays** (the ui/ shell), never
  `Text` nodes drawn into the scene. Humans compare in-scene type to the DOM
  around it and the scene loses. In-scene `Text` is for in-world labels only.
- **Strict layering** via the `z` field on nodes/commands: background → world →
  actors → fx → HUD. Nothing gameplay-critical may be occluded. In-world `Text`
  defaults to `z=0`, so a label placed ON a sprite (a tile value, a score over a
  token) needs an explicit `z` ABOVE that sprite or it paints underneath and is
  silently invisible. `layoutIssues` now flags this (`text … hidden behind …`).
- **Contrast is now headless-checkable.** Pass the page `background` to
  `layoutIssues(commands, { background })` and it flags near-invisible fills and
  sub-AA text from the hex alone — a first line of defense before the vision
  judge. Still judge final contrast from a rendered SVG; the lint catches the
  "dark shape on dark ground" class the pixel-blind proofs otherwise miss.

## Definition of done

A game is done when ALL of the following hold. This is a checklist, not a vibe.

1. **Typecheck clean** — `npm run check` reports zero errors. TypeScript strict
   mode is a free correctness gate; use it.
2. **Tests pass** — `npm test` green. Sim tests run headlessly in Node.
3. **Every level is solver-proven or scripted-played** — each shipped level has
   either a machine win-proof (`solve()`), or a scripted playthrough that
   asserts the win condition on probes. In-head verification has a documented
   failure rate (see [LESSONS.md](LESSONS.md)); it is not evidence.
4. **Deterministic replay verified** — `assertDeterministic(game, seed,
   inputLog)` passes: two runs of the same seed + input log produce an identical
   `world.hash()` at every checkpoint.
5. **The vision judge run and its high findings fixed** — `npm run judge <slug>`
   renders the game to PNG; actually LOOK at it and score against
   [JUDGE.md](JUDGE.md) (readability, depth, palette, juice, motion, chrome). Fix
   every high-severity finding with cosmetic changes (the golden hash must stay
   unchanged). "Passes the gates" is not "looks shipped"; this closes that gap.
6. **A complete loop exists** — start → play → win/lose → restart, keyboard-only,
   and `restart` fully rebuilds world state (no leaked nodes, no stale RNG).
7. **The full run's hash is pinned** — `t.golden('full run', world.hash())` in
   `verify.ts`, recorded via `UPDATE_GOLDEN=1 npm run verify`, `golden.json`
   committed (VERIFICATION §Channel 1d).
8. **Feel probes gate the genre's pacing** — at least two `recordTimeline`-based
   metrics with tuned windows, plus a `renderFilmstrip` artifact reviewed for
   motion/readability (VERIFICATION §Channel 3). Windows come from a run you
   judged, not from thin air.
9. **A feel spec is declared and its gates pass** — `export const feel: FeelSpec`
   in `game.ts` (avatar fill for salience; controller config for forgiveness; a
   feedback contract; `scrolls` for the camera gate). `npm run feel` runs every
   gate the spec enables and is part of `npm run verify` — the professional FLOOR
   is now a CI gate, not a hope (VERIFICATION §Channel 4). Declare only what is
   honestly true; a false contract is worse than none.

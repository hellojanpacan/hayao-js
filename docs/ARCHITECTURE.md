# hayao.js — Architecture

hayao.js is an **AI-first game engine**. Its one non-negotiable idea:

> **The game is a pure, deterministic function of its inputs. Everything else —
> rendering, audio, the browser — is a plugin that observes that function but
> can never change its result.**

```
state₀ ──step(inputs₀)──▶ state₁ ──step(inputs₁)──▶ state₂ ──▶ …
```

Hold that invariant and every hard problem for an AI author collapses:

| Normally hard for an AI | Why it's easy here |
|---|---|
| "Does my game work?" | `step()` runs in Node. Assert on state. No browser, no pixels. |
| "Is this level winnable?" | `step()` is a pure transition → BFS/DFS search proves it. |
| "Did my refactor change behavior?" | Re-run recorded inputs, compare a state **hash**. Bit-identical or it's a bug. |
| "Undo / time-travel / replay" | Snapshot the state, or replay the input log. Free. |
| "Testing a canvas game is opaque" | Rendering is a *projection* of state; the sim never needed the canvas. |

This is the lesson from **One Hundred Year Garden** (a pure genetics core made the
whole game Node-testable, and DOM/SVG made it browser-inspectable for free) fused
with **narrow-js** (probe contract, winnability solvers, docs-as-prompts, code-as-art,
determinism-as-keystone) — but pushed one level deeper: instead of *bolting* a
capture seam onto a browser-coupled engine, hayao makes the simulation
**headless-native** so no capture seam is needed at all.

---

## The layers

Everything is one npm package, imported through a single barrel seam — **`@hayao`**.
Games and examples import ONLY from `@hayao` (narrow-js's `@engine` discipline):
the internals are swappable behind it, and the whole public surface is greppable
in one file (`src/index.ts`).

```
┌─────────────────────────────────────────────────────────────┐
│  app/         browser driver (rAF loop) · headless runner     │  ← plugs the kernel into a host
│  defineGame() project/scene registry, config                  │
├─────────────────────────────────────────────────────────────┤
│  ui/          DOM overlays (menus, HUD) · settings shell       │  observers
│  render/      display list → SVG | Canvas2D | Headless         │  (never mutate sim state)
│  audio/       procedural Web Audio bus                          │
├─────────────────────────────────────────────────────────────┤
│  verify/      probes · replay · determinism · solver           │  ← the AI-first harness
├─────────────────────────────────────────────────────────────┤
│  scene/       Godot-style node tree: Node2D, Sprite, Text,      │
│               Camera2D, Timer, AnimationPlayer, behaviors       │  THE STATE
│  input/       action map · per-step sampling · record/replay    │
│  core/        RNG · Clock · EventBus · World · state hash        │  THE KERNEL (headless, pure-ish)
└─────────────────────────────────────────────────────────────┘
        core + scene + input are DETERMINISTIC and run in Node.
        render + audio + ui + app are the browser-only observer shell.
```

### core/ — the deterministic kernel (no DOM, ever)
- **`Rng`** — seeded, splittable (SplitMix64/xoshiro). All randomness in a game
  flows through the World's rng or a child stream. Never `Math.random()`.
- **`Clock`** — fixed-timestep accumulator (default 60 Hz). Real time in, whole
  fixed steps out. Tests drive a *virtual* clock, so "pump N frames" is exact.
- **`EventBus`** — synchronous typed signals (Godot-style `emit`/`connect`).
- **`World`** — owns the root scene, the rng, the clock, the input state, a
  resource table, and the frame counter. `world.step(dtMs)` advances the sim by
  whole fixed steps, updating the scene tree in fixed tree order.
- **`hashState(world)`** — deterministic structural hash → the spine of replay
  verification.

### scene/ — the authoring model (Godot-like, and IS the state)
A mutable node tree that updates in fixed order, so it stays deterministic while
being ergonomic. Nodes have a transform, a lifecycle (`ready` → `update(dt)` →
`exit`), and **signals**. Composition via **behaviors** (small attachable update
units) rather than deep inheritance. Trees **serialize** (save/prefab/instancing)
and **snapshot** (undo/time-travel). Built-in node types: `Node`, `Node2D`,
`Sprite` (a code-as-art shape/glyph/path), `Text`, `Camera2D`, `Timer`,
`AnimationPlayer` (tweens).

### input/ — actions, not keys
Author binds **actions** ("jump", "left") to physical keys; game logic reads
actions. Input is **sampled once per fixed step** and fed into `step`, so a run is
a function of its input log. `InputRecorder`/`replayInputs` make any session
reproducible and any playthrough scriptable — in Node or the browser identically.

### render/ — projection, then paint
The scene tree projects to a flat **display list** of `DrawCommand`s (rect,
circle, poly, path, text, image, with transform/fill/stroke/opacity/z). Backends
consume it: **`SvgRenderer`** (crisp, resolution-independent, DOM-inspectable —
the OHYG lesson), **`Canvas2DRenderer`** (many primitives/particles), and
**`HeadlessRenderer`** (records commands for tests — assert on the display list
without a GPU). Authoring is in a fixed **design space** (default 1280×720); the
camera and backend handle DPR/scale/letterboxing.

### audio/ — code-as-sound
A procedural Web Audio bus (master/music/sfx), zzfx-style tone synthesis and
ambient pads (ported from OHYG). No audio files. A no-op in Node so headless runs
are silent by construction.

### ui/ — DOM for chrome
Menus, titles, HUD, and the pause/settings **shell** (volume, mute, fullscreen,
restart, back) are DOM overlays — crisp type, trivial persistence — never canvas
text (narrow-js lesson: humans compare canvas text to DOM and canvas loses).

### verify/ — the reason this engine exists
- **Probes:** `world.probe()` → compact JSON snapshot; `world.goto(scene)`.
- **Determinism:** `assertDeterministic(game, seed, inputLog)` runs the sim twice
  and compares state hashes; any divergence is a hidden nondeterminism bug.
- **Solver:** a generic search over a `Puzzle<State, Move>` interface proves
  levels winnable (narrow-js's single-agent BFS, generalized).
- **Scripted playthrough:** feed an input script headlessly, assert on probes.
- **Browser capture:** `window.__hayao` exposes `step/pump/probe/shot/save`.
  Trivial here — hayao owns the clock and never touches focus, so none of
  narrow-js's four canvas-capture hacks are needed.

### app/ — hosting the kernel
- **`runBrowser(game, mount)`** — rAF loop samples real input, drives the
  fixed-step kernel, projects to a renderer, wires audio + the UI shell.
- **`runHeadless(game, inputLog)`** — the same kernel with no host; returns the
  final world/state hash. This is what tests and the CI verifier call.

---

## Determinism rules (the contract that makes all of the above true)
1. All randomness flows through `Rng`. `Math.random()` is banned in `src/` and games.
2. No wall-clock reads in the sim (`Date.now()`, `performance.now()`) — time comes
   from the `Clock`. `new Date()` argless is banned.
3. The scene tree updates in a fixed order (depth-first, child index order).
4. Iteration over collections is ordered (arrays / insertion-ordered maps; never
   `Set`/`Object` key order for logic).
5. Floating point is fine as long as the above hold (same ops, same order, same
   result on the same engine).

Break one of these and `assertDeterministic` fails loudly — which is the point.

---

## Why not just use Godot / a canvas engine?
See [docs/ENGINE.md](ENGINE.md). Short version: Godot's authoring model (nodes,
signals, scenes, resources, input actions, tweens) is *excellent* and we borrow
it wholesale — but its interface is GUIs, binary scenes, and a bespoke language,
all opaque to an LLM. hayao keeps the model and makes every part of it **text,
typed, greppable, and headlessly verifiable**. Canvas engines couple the sim to
the render loop and the browser; hayao decouples them so the sim is a pure
function you can test in Node.

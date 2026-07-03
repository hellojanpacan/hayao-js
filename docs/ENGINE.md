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

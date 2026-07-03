# hayao.js

**An AI-first game engine.** A deterministic, headless-native simulation kernel
with a Godot-style scene tree, pluggable renderers (SVG / Canvas / headless),
and a built-in verification harness — designed so an LLM can author, test, and
*prove correct* a whole game without ever opening a browser.

## The one idea

> The game is a pure, deterministic function of its inputs. Everything else —
> rendering, audio, the browser — is a plugin that observes that function but
> can never change its result.

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

## Architecture at a glance

```
app/      browser driver (rAF loop) · headless runner
ui/       DOM overlays (menus, HUD)                    ┐
render/   display list → SVG | Canvas2D | Headless     │ observers — never
audio/    procedural Web Audio bus                     ┘ mutate sim state
verify/   probes · replay · determinism · solver       ← the AI-first harness
scene/    Godot-style node tree (THE STATE)            ┐
input/    action map · per-step sampling · replay      │ deterministic,
core/     RNG · Clock · EventBus · state hash          ┘ runs in Node
```

The full design — including the determinism contract that makes it all true —
lives in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Status

**Early — the kernel is being laid down.** Implemented so far:

- `core/` — fixed-timestep `Clock`, seeded splittable `Rng` (xoshiro128\*\*),
  typed synchronous `Signal` bus, deterministic 2D math, structural state hash
- `render/commands` — the backend-agnostic draw-command display list
- `scene/node` — the Godot-style node with transforms, lifecycle, signals,
  and attachable behaviors

Everything above `scene/` in the diagram is designed but not yet built. Expect
the API to move.

## Development

```sh
npm install
npm run check   # typecheck
npm test        # vitest
```

## Determinism rules

1. All randomness flows through `Rng` — `Math.random()` is banned.
2. No wall-clock reads in the sim — time comes from the `Clock`.
3. The scene tree updates in fixed order (depth-first, child-index order).
4. Iteration over collections is ordered — never `Set`/`Object` key order for logic.

Break one and `assertDeterministic` fails loudly. That's the point.

## License

[MIT](LICENSE) © Jan Pacan

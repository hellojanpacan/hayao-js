# hayao.js

[![ci](https://github.com/hellojanpacan/hayao-js/actions/workflows/ci.yml/badge.svg)](https://github.com/hellojanpacan/hayao-js/actions/workflows/ci.yml)

**Play the 22 machine-verified example games at [hayao.dev](https://hayao.dev/).**

**An AI-first game engine.** A deterministic, headless-native simulation kernel
with a Godot-style scene tree, pluggable renderers (SVG / Canvas / headless),
and a built-in verification harness — designed so an LLM can author, test, and
*prove correct* a whole game without ever opening a browser.

## The one idea

> The game is a pure, deterministic function of its inputs. Rendering, audio,
> and the browser are **observer plugins**: they watch that function and paint
> what it produces, but they can never change its result.

```
state₀ ──step(inputs₀)──▶ state₁ ──step(inputs₁)──▶ state₂ ──▶ …
```

Hold that invariant and every hard problem for an AI author collapses:

| Normally hard for an AI | Why it's easy here |
|---|---|
| "Does my game work?" | `world.step()` runs in Node. Assert on state. No browser, no pixels. |
| "Is this level winnable?" | `step()` is a pure transition → BFS/DFS search proves it. |
| "Did my refactor change behavior?" | Replay recorded inputs, compare `world.hash()`. Identical or it's a bug. |
| "Undo / time-travel / replay" | `world.snapshot()` / `world.restore()`, or replay the input log. Free. |
| "Testing a canvas game is opaque" | Rendering is a *projection* of state; the sim never needed the canvas. |

## Quickstart

```sh
npm install
npm run dev      # vite dev server (hub + examples, MPA mode)
npm test         # vitest (headless, runs in Node)
npm run build    # tsc -b && vite build
npm run check    # tsc --noEmit — typecheck only
npm run verify   # run the determinism + solver harness over all examples
```

A game is one folder under `examples/<slug>/`, imports **only** from `@hayao`,
and is a `defineGame()` call. See [docs/CONVENTIONS.md](docs/CONVENTIONS.md).

## The layers

Everything is one npm package behind a single barrel — **`@hayao`**. Games
import only from there; the internals are swappable behind it and the whole
public surface is greppable in one file (`src/index.ts`).

| Layer | Modules | Role |
|---|---|---|
| **app/** | `runBrowser` (rAF loop) · `runHeadless` | plugs the kernel into a host |
| **ui/** | DOM overlays: menus, HUD, pause/settings shell | observer (never mutates sim) |
| **render/** | display list → `SvgRenderer` \| `Canvas2DRenderer` \| `HeadlessRenderer` | observer (projection → paint) |
| **audio/** | procedural Web Audio bus (no-op in Node) | observer |
| **verify/** | probes · replay · `assertDeterministic` · solver | the AI-first harness |
| **scene/** | `Node`, `Node2D`, `Sprite`, `Text`, `Camera2D`, `Timer`, `AnimationPlayer`, behaviors | **THE STATE** |
| **input/** | action map · per-step sampling · record / replay | deterministic |
| **core/** | `Rng` · `Clock` · `EventBus` · `World` · state hash | **THE KERNEL** (headless, pure) |

`core + scene + input` are **deterministic and run in Node**. `render + audio +
ui + app` are the browser-only observer shell. Break that boundary and the
verification harness stops being able to prove anything.

## Why not Godot or a raw canvas engine?

Godot's authoring model (nodes, signals, scenes, resources, input actions,
tweens) is *excellent* — so hayao borrows it wholesale. But Godot's interface is
GUIs, binary scenes, and a bespoke language, all opaque to an LLM; hayao keeps
the model and makes every part **text, typed, greppable, and headlessly
verifiable**. Canvas engines couple the sim to the render loop and the browser;
hayao decouples them so the sim is a pure function you can test in Node. Full
reasoning in [docs/ENGINE.md](docs/ENGINE.md).

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — the authoritative design and the determinism contract.
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — how games are structured, house style, definition of done.
- [docs/VERIFICATION.md](docs/VERIFICATION.md) — the two verification channels; how to prove a game correct.
- [docs/ENGINE.md](docs/ENGINE.md) — why a custom engine, and when NOT to use one.
- [docs/LESSONS.md](docs/LESSONS.md) — transferable lessons from real LLM-authored game builds.
- [docs/FRICTION.md](docs/FRICTION.md) — process-lesson log: what fought an AI session and what check/doc now prevents it.
- [AGENTS.md](AGENTS.md) — the operating manual for an AI author working in this repo.

## Status

**v0.2 — the 20-genre campaign is complete.** Twenty-one games live under
`examples/` — one for each of the most popular 2D indie genres (platformer,
metroidvania, Zelda-like, stealth, horde survival, bullet hell, tower defense,
RTS, roguelike, deckbuilder, tactics, match-3, idle, farming, horror, city
builder, rhythm, physics arcade, racing, narrative — plus the original
Sokoban). Every one ships a `verify.ts` suite that machine-proves its genre's
truth: solver-proven puzzles, bot-beaten levels, duel-proven counter systems,
win-rate-tuned balance, fairness gates for procgen, frame-exact timing
windows, golden replay hashes. 180+ tests; `npm run verify` runs the whole
portfolio. The campaign's findings — what each genre demanded of the engine
and what generalized — live in [docs/BUILDLOG.md](docs/BUILDLOG.md).

## License

[MIT](LICENSE) © Jan Pacan

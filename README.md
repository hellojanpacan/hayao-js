# hayao.js

[![ci](https://github.com/hellojanpacan/hayao-js/actions/workflows/ci.yml/badge.svg)](https://github.com/hellojanpacan/hayao-js/actions/workflows/ci.yml)

**Play the machine-verified example games at [hayao.dev/play](https://hayao.dev/play/).**
Four are art-finished in the house woodblock style (Lanternway, Rootward,
Tarnholm, Driftlight); the rest are playable engine slices. See where it's headed
on the [roadmap](https://hayao.dev/roadmap/).

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

## Start a new game in one command

```sh
npm create hayao@latest my-game   # scaffolds a runnable project
cd my-game && npm install
npm run verify                    # prove every level winnable — no browser
npm run dev                       # play it
```

The scaffolded starter isn't a hello-world — it already **generates a solver-proven,
ramped campaign**, so an AI author lands in a project that knows the invariants
(`AGENTS.md`) and can prove its own output from the first commit.

## Generate an hour of proven content, don't hand-author it

The hard part of "make me a whole game" was never one level — it was *forty* balanced
ones. hayao closes that gap: express a level as a `Puzzle` factory and let the
**solver-backed generator** compose the campaign.

```ts
import { composeCampaign, assertRamp } from '@hayao';

const campaign = composeCampaign({
  seed: 7,
  acts: [
    { name: 'Shallows', count: 12, minDepth: 2, maxDepth: 4, factory: makeLevel },
    { name: 'Deep',     count: 14, minDepth: 5, maxDepth: 7, factory: makeLevel },
    { name: 'Abyss',    count: 16, minDepth: 8, maxDepth: 12, factory: makeLevel },
  ],
});
assertRamp(campaign.difficulty);   // the whole curve is proven well-shaped
```

Every level is `solve()`-proven winnable inside its difficulty band; `assertRamp`
proves the curve escalates without cliffs. An hour of content ships as a **list of
seeds**, each provable — not forty hand-drawn maps. The reference is
[examples/lanternfold](examples/lanternfold) — a 42-level lantern-lighting campaign
composed entirely this way, with `npm run eval` scoring proof coverage across the
whole portfolio.

## The layers

Everything is one npm package behind a single barrel — **`@hayao`**. Games
import only from there; the internals are swappable behind it and the whole
public surface is greppable in one file (`src/index.ts`).

| Layer | Modules | Role |
|---|---|---|
| **app/** | `runBrowser` (rAF loop) · `runHeadless` | plugs the kernel into a host |
| **ui/** | DOM overlays: menus, HUD, pause/settings shell | observer (never mutates sim) |
| **render/** | display list → `SvgRenderer` \| `Canvas2DRenderer` \| `HeadlessRenderer` | observer (projection → paint) |
| **art/** | code-as-art: palettes, shapes, textures, bitmap fonts, autotile | observer (paints, never hashed) |
| **audio/** | procedural Web Audio bus (no-op in Node) | observer |
| **verify/** | probes · replay · `assertDeterministic` · solver · bots · filmstrips | the AI-first harness |
| **scene/** | `Node`, `Node2D`, `Sprite`, `Text`, `Camera2D`, `Timer`, `AnimationPlayer`, behaviors | **THE STATE** |
| **physics/** | tilemap + kinematic AABB · character controllers · deterministic rigid-body dynamics | deterministic |
| **procgen/** | seeded grids, caves, terrain, rooms, stateless scatter | deterministic |
| **logic/** | pure primitives: FSM, weighted tables, graph search, history | deterministic |
| **content/** | data-driven wave/spawn directors + upgrade trees | deterministic |
| **net/** | deterministic multiplayer: lockstep + rollback over a pluggable transport | deterministic |
| **persist/** | save/load over a pluggable storage adapter + compact codecs | deterministic |
| **input/** | action map · per-step sampling · record / replay | deterministic |
| **core/** | `Rng` · `Clock` · `EventBus` · `World` · state hash | **THE KERNEL** (headless, pure) |

`core + scene + input + physics + procgen + logic + content + net + persist` are
**deterministic and run in Node**. `render + art + audio + ui + app` are the
browser-only observer shell. Break that boundary and the verification harness
stops being able to prove anything.

## Why not Godot or a raw canvas engine?

Godot's authoring model (nodes, signals, scenes, resources, input actions,
tweens) is *excellent* — so hayao borrows it wholesale. But Godot's interface is
GUIs, binary scenes, and a bespoke language, all opaque to an LLM; hayao keeps
the model and makes every part **text, typed, greppable, and headlessly
verifiable**. Canvas engines couple the sim to the render loop and the browser;
hayao decouples them so the sim is a pure function you can test in Node. Full
reasoning in [docs/ENGINE.md](docs/ENGINE.md).

## Documentation

- [docs/QUICKSTART.md](docs/QUICKSTART.md) — **using `hayao` from npm**: install (it's ESM-only), define a game, and prove it correct headlessly — a complete runnable example.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — the authoritative design and the determinism contract.
- [docs/CONVENTIONS.md](docs/CONVENTIONS.md) — how games are structured, house style, definition of done.
- [docs/VERIFICATION.md](docs/VERIFICATION.md) — the two verification channels; how to prove a game correct.
- [docs/GALLERY.md](docs/GALLERY.md) — the verified gallery: what "machine-proven" means per game, and how to run the proof yourself.
- [docs/ENGINE.md](docs/ENGINE.md) — why a custom engine, and when NOT to use one.
- [docs/LESSONS.md](docs/LESSONS.md) — transferable lessons from real LLM-authored game builds.
- [docs/FRICTION.md](docs/FRICTION.md) — process-lesson log: what fought an AI session and what check/doc now prevents it.
- [AGENTS.md](AGENTS.md) — the operating manual for an AI author working in this repo.

## The site

Three doors, split by audience: [hayao.dev](https://hayao.dev/) is the marketing
landing (`index.html`), [hayao.dev/play](https://hayao.dev/play/) is the example
store (`play/index.html`), [hayao.dev/roadmap](https://hayao.dev/roadmap/) is the
public roadmap + js13k benchmark ladder (`roadmap/index.html`), and developer docs
live at [hayao.js.org](https://hayao.js.org/). Featured-game thumbnails are
regenerated with `npm run thumbs`.

## Status

**v0.2 — the 20-genre campaign is complete, plus the waves it triggered.**
A growing portfolio of games lives under `examples/`. The core set covers the most
popular 2D indie genres (platformer, metroidvania, Zelda-like, stealth, horde
survival, bullet hell, tower defense, RTS, roguelike, deckbuilder, tactics,
match-3, idle, farming, horror, city builder, rhythm, physics arcade, racing,
narrative — plus the original Sokoban). On top of those sit js13k-benchmark
reproductions (Seamfold, Gravewell), a deterministic rigid-body physics wave
(Rookspire demolition, Brasswick pinball), and a netplay showcase (Fernclash —
lockstep + rollback across tabs). Every one ships a `verify.ts` suite that
machine-proves its truth: solver-proven puzzles, bot-beaten levels, duel-proven
counter systems, win-rate-tuned balance, fairness gates for procgen,
frame-exact timing windows, bit-for-bit peer agreement, golden replay hashes.
400+ tests; `npm run verify` runs the whole portfolio. The campaign's findings — what each
genre demanded of the engine and what generalized — live in
[docs/BUILDLOG.md](docs/BUILDLOG.md).

## License

[MIT](LICENSE) © Jan Pacan

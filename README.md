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

**Pico-8's soul on Godot's skeleton.** The core is an unconstrained,
unopinionated engine — scene tree, deterministic kernel, solver proofs — that
never caps a game's scale. On top of it ships a complete, opinionated house
style (palette, duotone vector art, soft-synthesis audio, generated campaigns)
so prompt-to-game lands somewhere polished. Where Pico-8's constraints are the
product, hayao's are **a default, not a wall**: bring your own art, sound, and
assets and lose nothing structural.

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
and is a `defineGame()` call. See [docs/CONVENTIONS.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/CONVENTIONS.md).

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

## Close the one channel a machine can't: fun

Hayao proves winnability, determinism, ramp, and feel-floors by machine. The one
thing no headless gate can score is **fun** — and that takes a human. **Hayao
Studio** is the instrument for that channel: `npm run dev`, open `/studio/`, and
every human playtest becomes a bit-exactly replayable artifact the agent can read.

```ts
// main.ts — Studio-instrumented driver (drop-in for runBrowser)
import { runStudio } from 'hayao';
runStudio(game, document.getElementById('app')!, { hot: import.meta.hot });
```

```ts
// vite.config.ts — the dev-server harness (sessions, live knobs, A/B, /studio/)
import { hayaoStudio } from 'hayao/studio';
export default { plugins: [hayaoStudio()] };
```

A session `(seed, tuning, inputLog, axes, knobEvents)` re-simulates the whole run
in Node, so any metric is computable after the fact and any tick is re-inspectable.
The bundled `hayao-mcp` sidecar is the agent's window in — `list_sessions`,
`get_playtest_report` (hesitations, deaths, quit context), `inspect_moment`
(replay any tick → probe + screenshot), `get_knob_state` (values the human
accepted, to write back into `tuning:` defaults). Telemetry describes; the human
directs. Full doctrine in [docs/STUDIO.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/STUDIO.md).

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
reasoning in [docs/ENGINE.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/ENGINE.md).

## Documentation

**Designing the game** — [`design/`](https://github.com/hellojanpacan/hayao-js/tree/main/design) is the single home for game design:

- [design/ — the Design Codex](https://github.com/hellojanpacan/hayao-js/tree/main/design) — the *generative* library: anchors (reference-game DNA) · genres · systems · mechanics · worldbuilding · patterns · antipatterns · recipes. Turns a high-level intent into a concrete, buildable design.
- [design/FUN.md](https://github.com/hellojanpacan/hayao-js/blob/main/design/FUN.md) · [design/JUICE.md](https://github.com/hellojanpacan/hayao-js/blob/main/design/JUICE.md) · [design/JUDGE.md](https://github.com/hellojanpacan/hayao-js/blob/main/design/JUDGE.md) — the *craft* playbooks: the design/verification playbook, the game-feel cookbook, and the vision judge.

**Building & proving it** — `docs/` is the engineering manual:

- [docs/QUICKSTART.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/QUICKSTART.md) — **using `hayao` from npm**: install (it's ESM-only), define a game, and prove it correct headlessly — a complete runnable example.
- [docs/ERRORS.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/ERRORS.md) — the common newcomer mistakes and what each `[hayao]` guard message means (missing `shape`, non-finite coords, `build` not returning a Node, unset `world.state`, non-ESM).
- [docs/API.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/API.md) — the full, greppable public surface (every export + signature). Ships in the package.
- [docs/ARCHITECTURE.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/ARCHITECTURE.md) — the authoritative design and the determinism contract.
- [docs/CONVENTIONS.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/CONVENTIONS.md) — how games are structured, house style, definition of done.
- [docs/ASSETS.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/ASSETS.md) — the asset contract: the four clauses that make any outside asset (art, sound, fonts) first-class; "a default, not a wall" made precise.
- [docs/VERIFICATION.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/VERIFICATION.md) — the two verification channels; how to prove a game correct.
- [docs/STUDIO.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/STUDIO.md) — the human/AI playtest loop: sessions, live knobs, A/B variants, the MCP sidecar.
- [docs/GALLERY.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/GALLERY.md) — the verified gallery: what "machine-proven" means per game, and how to run the proof yourself.
- [docs/ENGINE.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/ENGINE.md) — why a custom engine, and when NOT to use one.
- [docs/LESSONS.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/LESSONS.md) — transferable lessons from real LLM-authored game builds.
- [docs/FRICTION.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/FRICTION.md) — process-lesson log: what fought an AI session and what check/doc now prevents it.
- [AGENTS.md](https://github.com/hellojanpacan/hayao-js/blob/main/AGENTS.md) — the operating manual for an AI author working in this repo.

## The site

Three doors, split by audience: [hayao.dev](https://hayao.dev/) is the marketing
landing (`index.html`), [hayao.dev/play](https://hayao.dev/play/) is the example
store (`play/index.html`), [hayao.dev/roadmap](https://hayao.dev/roadmap/) is the
public roadmap + js13k benchmark ladder (`roadmap/index.html`), and developer docs
live at [hayao.js.org](https://hayao.js.org/). Featured-game thumbnails are
regenerated with `npm run thumbs`.

## Status

**Hayao Studio — the human/AI playtest loop — ships with the engine.** The engine
covers the most popular 2D indie genres end to end (platformer, metroidvania,
Zelda-like, stealth, horde survival, bullet hell, tower defense, RTS, roguelike,
deckbuilder, tactics, match-3, idle, farming, horror, city builder, rhythm,
physics arcade, racing, narrative — plus the original Sokoban), and grows from
there: js13k-benchmark reproductions (Seamfold, Gravewell), a deterministic
rigid-body physics wave (Rookspire demolition, Brasswick pinball), a netplay
showcase (Fernclash — lockstep + rollback across tabs), a 2-player co-op survival
(Kinfall), and the flagship metroidvania (Kintsugi). Every example under
`examples/` ships a `verify.ts` suite that machine-proves its truth: solver-proven
puzzles, bot-beaten levels, duel-proven counter systems, win-rate-tuned balance,
fairness gates for procgen, frame-exact timing windows, bit-for-bit peer
agreement, golden replay hashes.

The one channel a machine can't close on its own — **fun** — is a first-class,
replayable instrument (Hayao Studio, above). Alongside it, a de-anchoring
`sandboxes/` shelf collects single-mechanic labs (physics, particles, camera,
pathfinding, procgen, synth, juice) for learning one primitive in isolation, and
the engine surface keeps widening: a screen-space HUD layer (`node.screenSpace`),
pause + time scale (`world.paused`/`timeScale`, `node.pauseMode`), deterministic
generator coroutines, typed `world.state` (`defineGame<TState>`), 2.5D projection
+ touch input, ellipse/arc/lineDash rendering, a ZzFX porting bridge
(`specFromZzfx`), 2D lighting, and authored animation. `npm run verify` runs the
whole portfolio. What each genre demanded of the engine and what generalized lives
in [docs/BUILDLOG.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/BUILDLOG.md);
the engine-authoring contracts are in
[docs/ENGINE.md](https://github.com/hellojanpacan/hayao-js/blob/main/docs/ENGINE.md).

## License

[MIT](LICENSE) © Jan Pacan

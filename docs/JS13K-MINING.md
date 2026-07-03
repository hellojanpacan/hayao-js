# JS13K-MINING — engine gaps mined from the js13k corpus

> Analysis pass that precedes the "engine gaps first" step of the
> [BUILDLOG](BUILDLOG.md) loop. Grounds Hayao's next primitives in what
> top-ranked **≤13 KB** js13k games actually lean on. **No source was copied
> into this repo** — the corpus (mixed licenses) is inspiration only.
>
> Method: read Hayao's real surface ([API.md](API.md) — 202 exports), sample 17
> highly-ranked games spread across genres, catalog the recurring primitives
> they build that Hayao **lacks**, and tally frequency = priority. Every
> candidate is checked against the invariants in [CLAUDE.md](../CLAUDE.md)
> (determinism via `world.rng`; pure logic + `cosmetic` view).

## Don't re-recommend — Hayao already has these

So the backlog stays honest, these were treated as **usage tallies only**, never
gaps: `rng` (`pick`/`shuffle`/`chance`/`range`/`int`/`intRange`), `clock`,
`Timer`, scene tree + `NodePool`, tween/easing (`AnimationPlayer`, `EASINGS`,
`lerp`/`remap`/`clamp`), `Particles` + presets, `Shaker` (screen shake),
`Camera2D`, `Signal`/`EventBus`, input actions + recorder, physics (tilemap,
kinematic AABB, full platformer controller, `SpatialHash`, tile `raycastTiles`,
rigid-body + joints), display list with SVG/Canvas/Headless backends, art shapes
+ palettes + `mix()`/`withAlpha()`, `AudioBus`/`Tone` synth, DOM overlay/shell/
settings, verify harness, `world.state`/`probe`/`hash`, `showScreen`.

Two agent-flagged "gaps" were **false positives** and are dropped: **vision
cone / grid-raycaster LoS** already ships as `inVisionCone` + `lineOfSight` +
`raycastTiles`; **seeded PRNG for procgen** already ships as `world.rng`.

## Sampled games (17)

Selected from `data/registry.csv` by `rank_overall` within a genre spread; all
are top-10-overall in their year and ≤ 13.3 KB zipped.

| Game | Yr | Genre | Overall | Standout criterion ranks |
|---|---|---|---|---|
| clawstrike | 2025 | Stealth-action platformer | **1** | gfx #1, audio #1, gameplay #2, theme #1 |
| dante | 2022 | 3D action-platformer (WebGL) | **1** | gfx #1, gameplay #2, audio #3 |
| 13th-floor | 2024 | First-person survival-horror (WebGL2) | **1** | theme #1, audio #3, gfx #3 |
| dying-dreams | 2022 | Puzzle platformer | **2** | gameplay #1, gfx #2, theme #2 |
| coup-ahoo | 2024 | Dice roguelike / naval | **2** | audio #1, innovation #2 |
| cat-survivors | 2025 | Survivors-like horde | **2** | gameplay #1, gfx #2, theme #3 |
| norman-the-necromancer | 2022 | Reverse-tower-defense arcade | **3** | theme #1, gfx #3, gameplay #4 |
| witchcat | 2025 | Top-down adventure (season-swap) | **3** | gfx #4, gameplay #6, theme #20 |
| soul-jumper | 2022 | Platformer (PICO-8-style) | **4** | audio #4, gameplay #7 |
| tiny-yurts | 2023 | Colony / placement sim | **4** | gfx #4, gameplay #4, innovation #8 |
| the-way-of-the-dodo | 2024 | Puzzle platformer (LittleJS) | **5** | gameplay #2, audio #5 |
| upyri | 2023 | First-person horror (WebGL2) | **5** | gfx #2, theme #2 |
| super-castle-game | 2023 | Sokoban-like puzzle (natlib) | **7** | gameplay #1, audio #4 |
| space-huggers | 2021 | Run-and-gun roguelite (LittleJS) | **8** | — (per-criterion n/a that year) |
| dr1v3n-wild | 2024 | Pseudo-3D arcade racing (WebGL2) | **8** | gameplay #3, gfx #2 |
| knight-dreams | 2023 | Endless auto-runner platformer | **9** | gfx #1, gameplay #5 |
| soul-surf | 2022 | Puzzle-platformer + editor | **10** | gfx #5, innovation #5 |

## Prioritized engine-gap backlog

Frequency = # of the 17 sampled games that hand-build the primitive (or that
clearly want it). "Effort" is rough Hayao-sized T-shirt (S ≈ a day, M ≈ a few
days, L ≈ a week+). Ordered most-frequent first.

| # | Primitive (gap) | Games | Fit | Why it matters | Determinism note | Effort |
|---|---|---|---|---|---|---|
| 1 | **Save/load — `localStorage` + compact serializer** (RLE/BigInt codecs) | ~12 | yes | *Every* game persists score/progress; several also compact levels/state to strings for size. Hayao serializes nodes + `WorldSnapshot` but has no player-facing save API. | Pure. Serialized state should agree with `world.hash()`/`probe()`; guard `JSON.parse`. `localStorage` is browser-only → keep behind a storage adapter that's a no-op headless. | S–M |
| 2 | **Procedural sprite/texture generation** (2-bit→palette LUT, RLE sprite decode, BigInt bitmap) | 6 | yes (`cosmetic`) | The defining js13k art trick — whole tilesets/sprites from code, ~0 asset bytes. knight-dreams, dying-dreams, super-castle, witchcat all ship it. | Pure *given a seed*, but reads canvas `ImageData` / draws pixels → **must be `cosmetic`, out of `hash()`**. Any RNG through `world.rng`. | M |
| 3 | **Bitmap/pixel font + text layout** (glyph atlas, per-char width, wrap, typewriter reveal, colored/rich markup) | 6 | yes | Code-drawn HUD/dialogue with no font asset; damage/label text. norman, dying-dreams, super-castle, witchcat (fonts) + clawstrike, coup-ahoo (inline color-tag markup). Hayao has a `Text` node but no bitmap-font or rich-text layout. | Pure layout; typewriter timing via `clock`, not `performance.now`. Colored text is view-only (`cosmetic`). | M |
| 4 | **FSM / phase-state-machine helper** (`onEnter`/`update`/`leave`, transition table, + phase-interp) | 5 | yes | Ubiquitous for AI, screens, and move-animation. super-castle's `IState`+`NextPhaseMap` **fuses transitions with eased interp** — the exact pure-logic↔`cosmetic` bridge Hayao wants. 13th-floor/upyri ship a clean helper; clawstrike/space-huggers hand-roll it with timers. | Pure. Needs **ordered** transitions (no Set/Map iteration hazards) to stay hash-stable. | S ✅ `logic/fsm.ts` |
| 5 | **Weighted random pick / loot-and-spawn tables** | 5 | yes | Spawn tables, loot, procgen variety, upgrade rolls. tiny-yurts ships an explicit `weightedRandom(weights)`; knight-dreams interpolates weights by difficulty; norman/cat-survivors fake it with filter+shuffle. | Trivial add on `world.rng` — but every sampled impl uses `Math.random`; Hayao's **must** draw from `world.rng`. | S ✅ `logic/random.ts` |
| 6 | **Graph search — BFS / flood-fill / grid pathfinding** (+ connected-components) | 5 | yes | Enemy nav, region/cluster detection, unit routing. 13th-floor/upyri (nav-graph BFS), super-castle (flood-fill clustering), tiny-yurts (grid pathfinding). Hayao has `SpatialHash` + tile raycast but **no graph search at all**. | Pure and hashable if node iteration is ordered. Pairs with existing tilemap/`SpatialHash`. A* is the natural companion. | M ✅ `logic/graph.ts` |
| 7 | **Procgen generators** — cave/terrain carving, room/segment layout, coordinate-hash scatter | 5 | yes | Replayable/endless content: space-huggers (caverns + multi-floor bases), knight-dreams (endless terrain), cat-survivors + witchcat (per-cell integer-hash decoration), dr1v3n-wild (segment-curve track). Hayao has tilemaps but no generators. | Seeded scatter is deterministic; carving **must** run off `world.rng` (knight-dreams' raw `Math.random` is the anti-pattern). Cosmetic-only scatter can use a coord-hash, no PRNG state. | M–L |
| 8 | **HSL/HSV color + gamma-correct interpolation + gradients** | 5 | partial | Procedural theming, palette drift, correct blends. space-huggers (`setHSLA`+`mutate`), knight-dreams (indexed palette), dodo/dr1v3n-wild (`.hsl`), super-castle (linear-space lerp). Hayao's `mix()` is naive sRGB-space RGB only. | Pure. Color drift via `world.rng`. Extends `art/palette.ts`. | S |
| 9 | **Screen transitions + cinematic sequencer** (fade/circle/dither wipe with midpoint callback; timeline of steps) | 3 | yes | Level-to-level polish and scripted intros/outros. dying-dreams (fade/circle/dither), witchcat (step-list cinematic + fade-gated advance), super-castle (phase timing). Hayao has `showScreen` but no transition/sequencer. | Timing via `clock`; the wipe overlay is `cosmetic`. Sequencer steps are pure data. | M ✅ `ui/transition.ts` |
| 10 | **Autotiling — marching-squares / bitmask Wang tiles** | 3 | yes | Turns a boolean grid into seamless tile art automatically (walls, water, ice edges). dying-dreams + witchcat ship full neighbor-bitmask solvers; super-castle borders via clustering. | Fully pure, deterministic, no RNG. Emits `cosmetic` draw data from logical tiles. | S–M |
| 11 | **Framerate-independent damping / spring smoothing** (`lerpDamp`, critically-damped `reach`, spring) | 3 | partial | Smooth camera/value follow without frame coupling. dante (`lerpDamp`), cat-survivors (`v*=exp(-dt*k)` + `reach`), witchcat (spring feel). Hayao has `lerp`/tween but no exp-decay/spring helper. | Feed **fixed `dt`** from `clock`, not variable rAF delta, or the sim diverges. | S ✅ `scene/tween.ts` (`lerpDamp`/`spring`/`makeReach`) + `core/dmath.ts` (`dexp`) |
| 12 | **Floating-text / damage-number popups** | 2 (genre-critical) | yes | Rise-and-fade combat/label numbers — expected in every action/survivors/RPG game. coup-ahoo + cat-survivors ship pooled text-particle systems; Hayao has none. | Spawn positions/jitter via `world.rng`; the popups are `cosmetic`. | S ✅ `scene/floatingText.ts` |
| 13 | **Undo / record-replay buffers** — state-clone (memento) stack, bounded ghost-trail ring buffer | 3 | partial | Puzzle undo (dying-dreams clones pure `PuzzleState`); rewind/echo ghosts (soul-jumper 8-frame ring). Hayao's pure-state + `WorldSnapshot` model makes this nearly free but it isn't packaged. | Pure over snapshot state. Cheap given existing `world` snapshots. | S |
| 14 | **Ambient particle field preset** (snow/rain/weather) | 2 | yes (`cosmetic`) | Grid-seeded, screen-wrapping drift — a distinct preset from burst emitters. dying-dreams (snow), cat-survivors (weather envelopes). Extends `PARTICLE_PRESETS`. | `world.rng` seeded; `cosmetic`. Smoothstep envelopes over sim time, not wall clock. | S |
| 15 | **Data-driven content DSL** — wave/spawn director, card/dice tables, upgrade-evolution trees | 3 | partial | Compact declarative content: norman (flat-array wave DSL), cat-survivors (spawn director + evolution table), coup-ahoo (dice/adjective content). A schema + interpreter would standardize this. | Pure interpretation; scheduling via `clock`. Rolls via `world.rng`. | M |
| 16 | **9-slice panel drawing** | 1 | yes | Scalable UI frames/panels from one sprite (norman). Small, self-contained display-list helper. | Pure, `cosmetic`. | S ✅ `render/nineSlice.ts` |
| 17 | **Component/behavior mixin (ECS-lite hooks)** | 1 | partial | norman's `Behaviour` with `onUpdate`/`onCollision`/`onDamage` hooks composes per-entity logic. Hayao's scene tree covers structure but not composable behavior hooks. | Pure; ordered update. Evaluate vs. keeping the node tree lean. | ~~M~~ **evaluated → declined** |

## Anti-recommendations — evidenced *against*

- **Perlin/simplex/fbm noise is NOT a real gap.** Despite being on the suspect
  list, essentially no sampled game uses hash noise for gameplay: witchcat and
  cat-survivors substitute a pure **integer-hash-per-cell** scatter
  (`((x-812347*y)*928371)%17===0`), dr1v3n-wild and space-huggers use **layered
  sines / slope-smoothing**, and the only turbulence (upyri, 13th-floor) is
  browser `feTurbulence` for textures. If noise is ever added, prefer a small
  **value-noise + integer-hash-scatter** helper (deterministic, seedable via
  `world.rng`) over a heavyweight simplex lib — and treat it as `cosmetic`.
- **SVG-filter procedural texturing (`feTurbulence`/`feDisplacementMap`)** is
  high-leverage for art-from-code but **browser-only** — it won't reproduce in
  the Headless SVG backend or `world.hash()`. Only viable as an explicitly
  `cosmetic`, browser-gated texture step; not a determinism-safe core primitive.

## Explicitly out of scope (2D engine)

Four of the highest-ranked games (dante, 13th-floor, upyri, dr1v3n-wild) are
**full WebGL/WebGL2 3D engines** — CSG/BSP mesh booleans, cascaded shadow maps,
cube-map lighting, `DOMMatrix`/quaternion pipelines, GPU-readback collision,
perspective road projection + arcade vehicle handling. Impressive, but out of
Hayao's deterministic-2D remit. Their *reusable 2D* lessons (seeded RNG, save/
load, HSL color, `lerpDamp`, segment procgen) are folded into the table above;
the 3D machinery is noted here only so it isn't mistaken for a gap.

## Cross-cutting determinism verdict

The corpus is a determinism minefield and a validation of Hayao's stance:
**16 of 17** games use raw `Math.random`, and most drive logic from
`performance.now`/`Date.now`/`setTimeout` (variable-delta). Only super-castle,
cat-survivors (partly), and witchcat's *logic* are `Math.random`-free; only
space-huggers and dr1v3n-wild ship a seeded PRNG — and both seed it from
`Date.now()`. **Every primitive adopted from this backlog must:** (a) draw all
randomness from `world.rng`; (b) take time as fixed `dt` from `clock`, never
wall-clock; (c) mark pure-view output (`ImageData` sprites, wipes, popups,
particle fields, colored text) `cosmetic` so it stays out of `world.hash()`; and
(d) use ordered iteration in any graph/table logic. Save/load, autotiling, FSM,
weighted-pick, graph search, bitmap fonts, and 9-slice are the cleanest
(pure, deterministic) wins; procgen, color-drift, and particle fields are safe
only once rerouted through `world.rng`.

## Suggested first slice

By frequency × low-effort × determinism-cleanliness, the highest-ROI opening
batch: **(1) save/load adapter, (4) FSM helper, (5) weighted pick, (6) BFS/
flood-fill, (10) autotiling, (8) HSL color** — six mostly-pure primitives that
together unblock persistence, AI, procgen art, and content variety, and that
recur across the widest genre spread.

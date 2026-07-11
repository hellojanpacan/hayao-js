# Friction triage — the four js13k recreations (2026-07)

Every FRICTION.md entry from the four hayao@0.3.0 recreations
(**squad-13**, **ninja-cat** / Triska, **ninja-vs-evilcorp**, **path-to-glory**),
triaged against repo HEAD. Verdicts:

- **FIXED@HEAD** — already addressed since 0.3.0 shipped; needs only a release + docs.
- **CODE** — engine change implemented from this triage.
- **DOCS** — real gap, but the fix is documentation.
- **WONT-FIX** — deliberate; rationale given.

## Cross-cutting themes (what actually got built)

1. **Screen-space HUD layer** (`node.screenSpace = true` + render `layer`) — the single
   most-repeated pain across three games (ninja-cat 4.2/4.4, nve 3.2/7.1/10.1, ptg 4/11).
2. **Pause + time scale** (`world.paused`, `world.timeScale`, `node.pauseMode`) —
   squad 14, ptg 18/28.
3. **Deterministic coroutines** (`Coroutines`: generator-based `sleep`/`waitFor`/`race`/`all`,
   many concurrent runners) — ptg 6/17/27.
4. **Shape vocabulary** (`ellipse`, `arc`/sector commands, `lineDash` paint) — ninja-cat 1.1–1.3, ptg 2.
5. **Renderer robustness** (skip + warn-once on non-finite/negative primitives instead of
   killing the loop) — ptg 34.
6. **Hidden-tab ticker + `handle.tick()`** (built-in `document.hidden` setTimeout fallback;
   one-call sample+step+render for harnesses) — squad 1, nve 1.1, ptg 9/32/33.
7. **Typed state** (`World<TState>`, `defineGame<TState>`, `ctx.state` on WorldContext) —
   ninja-cat 3.2, nve 4.1, ptg 1/13/26.
8. **Tree inspection** (`world.walk`, `world.nodeCount`, `world.debugTree()`, public
   `flushFree()`) — squad 3/7/10.
9. **Input reach** (right/middle pointer buttons, unknown-action warn-once) — ptg 3, ninja-cat 7.0.
10. **Character kit** (`VerletChain` rope/streamer node, `Node.pivot`, `Node.x/y`) —
    ninja-cat 10.2/10.5, ptg 22.
11. **ZzFX bridge** (`specFromZzfx()` converter; public `audio.ctx`/`sfxBus`/`musicBus`) —
    ninja-cat 2.1–2.7, ptg 12/16.
12. **Determinism guard** (opt-in dev patch of `Math.random`/`Date.now` during `step()`,
    warn-once) — ninja-cat 6.1, nve 2.1.

## squad-13

| # | Entry | Verdict | Action |
|---|-------|---------|--------|
| 1 | rAF dead in hidden iframes | **CODE** | Built-in ticker fallback in `runBrowser`: when `document.hidden`, pump via per-callback `setTimeout(16)`; native rAF when visible. No more per-game monkey-patching (see ptg 33 for why per-game patches go wrong). |
| 2 | `advance()` silently caps at 250 ms | **FIXED@HEAD + CODE** | Cap is documented and configurable (`clock: { maxFrameMs }`); `runSteps(n)` exists for fast-forward. Added: dev warn-once when `advance()` clamps. |
| 3 | `free()` deferred; old nodes survive a step | **CODE + DOCS** | `world.flushFree()` made public + documented for scene swaps; deferred lifecycle documented. |
| 4 | `actionsDown` Set silently fails | **CODE** | `step()` accepts any iterable (already true at HEAD) and now throws a clear error on non-iterable/string input. Cross-realm Sets iterate fine via `for…of`. |
| 5 | No `between(lo, v, hi)` | **WONT-FIX** | Two clamps with swapped argument orders is a worse footgun than the porting friction it saves. `clamp(v, lo, hi)` documented; porting note added. |
| 6 | First-frame step accumulation sinks player | **DOCS** | Game-logic guard issue; documented "first advance can run multiple steps" note. |
| 7 | No scene-tree inspector | **CODE** | `world.walk(fn)`, `world.nodeCount`, `world.debugTree()`. |
| 8 | Stringly-typed `resources` | **CODE** | `world.resource<T>(key)` throwing accessor (typo → loud error, not silent `undefined`); `world.state` is the typed home for shared state (see theme 7). |
| 9 | World not reachable from `runBrowser` | **FIXED@HEAD** | `GameHandle.world` exists. |
| 10 | `flushFree()` undocumented | **CODE** | Public + documented (see 3). |
| 11 | Fixed dt not configurable | **FIXED@HEAD** | `clock: { hz }` config. |
| 12 | No collision utilities | **FIXED@HEAD** | `physics/`: aabb, tilemap, platformer, raycast, spatialHash, rigid body suite. |
| 13 | No draw layers / z-index | **FIXED@HEAD + CODE** | z-sort is global (painter's sort), not tree-order; plus new `layer` pass for overlays. Documented. |
| 14 | No subtree pause / process mode | **CODE** | `world.paused` + `node.pauseMode: 'inherit' \| 'always' \| 'stopped'`; paused world still renders. Plus `world.timeScale`. Both hashed/snapshotted (only when non-default, so pinned hashes survive). |
| 15 | `wt` vs `IDENTITY` in `draw()` undocumented | **DOCS** | `draw(out, wt)` contract documented: `wt` is camera-inclusive and self-inclusive; `screenSpace` replaces most IDENTITY hand-rolling. |

## ninja-cat (Triska)

| # | Entry | Verdict | Action |
|---|-------|---------|--------|
| 1.1 | No arc shape | **CODE** | `arc` DrawCommand + Sprite shape (open arc or `sector` pie). |
| 1.2 | No ellipse | **CODE** | `ellipse` DrawCommand + Sprite shape. |
| 1.3 | No lineDash | **CODE** | `Paint.lineDash` (Canvas `setLineDash` / SVG `stroke-dasharray`). |
| 1.4 | No gradient fills | **FIXED@HEAD** | `Paint.gradient` exists (bounding-box space); documented per ptg 19. |
| 1.5 | No clipping/masking | **WONT-FIX (for now)** | Rare need; big renderer-parity cost across Canvas/SVG/WebGL/headless. Revisit if a real game needs it. |
| 2.1–2.5 | ZzFX param semantics mismatch | **CODE** | `specFromZzfx(params)` converter encoding exactly these conversions (slide×duration, Hz→semitone jump, deltaSlide curve fit, filter sign convention). `repeat` (ZzFX repeatTime) added to SoundSpec synth. |
| 2.6 | ZzFXM incompatible | **WONT-FIX (documented recipe)** | Tracker→Song transcription is a porting task, not an engine seam; recipe documented (bundle zzfxm verbatim, route through `audio.sfxBus`). Converter is future work if a second port needs it. |
| 2.7 | Two competing AudioContexts | **CODE** | `audio.ctx` / `audio.sfxBus` / `audio.musicBus` exposed publicly (typed) so external synths join hayao's context and volume graph instead of creating their own. |
| 3.1 | `cosmetic` not typed on Node | **FIXED@HEAD** | `Node.cosmetic` is a typed public field. |
| 3.2 | `world.state` untyped | **CODE** | `World<TState>` + `defineGame<TState>()` generics. |
| 3.3 | `sprite.paint` undocumented | **DOCS** | Documented (construction props vs runtime `paint`). |
| 3.4 | `sprite.shape` mutation undocumented | **DOCS** | Documented as supported. |
| 4.1 | Camera2D minimal | **FIXED@HEAD** | `CameraController` (follow, deadzone, smoothing, bounds). |
| 4.2 | No screen-space HUD layer | **CODE** | `node.screenSpace = true`: subtree renders in design coordinates, above the world (layer pass). |
| 4.3 | Zoom default guidance | **DOCS** | Camera recipe: design-res vs zoom, what 0.7 means. |
| 4.4 | HUD offsets compress at zoom≠1 | **CODE** | Solved by `screenSpace` (no more camX+offset math). |
| 4.5 | World-space radii vs screen perception | **DOCS** | Documented pattern: divide interaction radii by zoom when the affordance is perceived in screen space. |
| 5.1 | No scene clear API | **CODE** | `node.clearChildren()` (frees children safely). |
| 5.2 | Parent rotation affects children (undocumented) | **DOCS** | Transform semantics documented (incl. nve 12.1/12.2 flip/pivot patterns). |
| 6.1 | Determinism constraint surfaced late | **CODE** | Opt-in `WorldConfig.guardDeterminism`: during `step()`, `Math.random`/`Date.now` warn once with a stack. (Auto-enabling it in capture/workshop harnesses is follow-up work.) |
| 7.0 | Unknown action names silent; `prevPointerDown` leak | **CODE + WONT-FIX** | Warn-once when querying an action name no source has declared. The prevPointerDown leak is game state (wont-fix), but `justPressed`/`justReleased` cover the underlying need. |
| 7.1 | No `justReleased` | **FIXED@HEAD** | `input.justReleased()` exists. |
| 7.2 | Pointer coords in design space undocumented | **DOCS** | Documented (+ `world.screenToWorld`). |
| 7.3 | No velocity-cap guidance | **DOCS** | Best-practice note (rigid body suite already caps; kinematic recipes note the clamp). |
| 8 | Missing utilities (easing, verlet, particles, shake, tween) | **FIXED@HEAD + CODE** | EASINGS/tween/springs, Particles, Shaker all exist; `VerletChain` added for the rope/streamer gap; segment-circle etc. live in physics. |
| 9.1/9.2 | No property reference / SoundSpec units | **DOCS** | docs/API.md is the generated surface; SoundSpec units already in synth.ts docstrings — audio doc section cross-links them. |
| 10.1 | No path-lerp for bezier morphs | **WONT-FIX (for now)** | Niche; author two paths and crossfade opacity, or poly-lerp. Revisit with real demand. |
| 10.2 | No skeletal/rope/chain node | **CODE** | `VerletChain` node: N-segment verlet, pinned head (optional tail), gravity/damping/length, per-segment angle accessor for sprite mapping. |
| 10.3 | State/view split for characters | **DOCS** | Doctrine already (pure logic + cosmetic view); character example noted. |
| 10.4 | No spritesheet | **WONT-FIX** | Vector-first engine by design; `TextureSprite`/`PixelBuffer` cover raster needs. |
| 10.5 | Rotation pivot implicit | **CODE** | `Node.pivot` (local point that `pos`/rotation/scale anchor to; serialized only when set, so hashes stay pinned). |
| 10.6 | No shadow primitive | **FIXED@HEAD** | `Paint.shadow` exists (blur/dx/dy). Documented. |

## ninja-vs-evilcorp

| # | Entry | Verdict | Action |
|---|-------|---------|--------|
| 1.1 | rAF throttled in iframe | **CODE** | Built-in hidden-tab ticker (see squad 1). |
| 1.2 | `?capture` undocumented | **DOCS** | Documented in VERIFICATION.md + QUICKSTART pointer. |
| 1.3 | `probe()` too manual | **DOCS** | `__hayao.world` + `probe` override documented. |
| 2.1 | Forbidden APIs surfaced late | **CODE** | `guardDeterminism` (see ninja-cat 6.1). |
| 2.2 | `world.rng` unsafe from cosmetic nodes | **FIXED@HEAD + DOCS** | `rng.split(key)` + private-Rng pattern (Particles/Shaker do this); documented. `hashNoise()` added for stable per-entity variation (see ptg 8). |
| 3.1 | Camera transform formula undocumented | **DOCS** | Formula + `worldToScreen`/`screenToWorld` documented. |
| 3.2 | No screen-space HUD | **CODE** | `screenSpace` (see theme 1). |
| 3.3 | Camera scroll tracking manual | **FIXED@HEAD** | `CameraController`. |
| 4.1 | `world.state` untyped | **CODE** | Generics (theme 7). |
| 4.2 | `WorldContext` lacks world/state | **CODE** | `ctx.state`, `ctx.events`, `ctx.width/height`, `ctx.paused/timeScale`, `ctx.camera()` added to WorldContext. |
| 4.3/4.4 | Particles/Shaker untyped | **FIXED@HEAD** | Typed `burst()`/`addTrauma()` at HEAD. |
| 4.5 | `poly` shape missing from types | **FIXED@HEAD** | In the Shape union. |
| 4.6 | `Camera2D.current` untyped | **FIXED@HEAD** | Typed field. |
| 4.7 | `KENTO` opaque | **DOCS** | Palette doc pointer in API digest. |
| 5.1 | First frame renders before onUpdate | **DOCS** | Set `visible:false` in build; documented. (Auto-stepping before first render would shift every recorded replay by one frame — not worth it.) |
| 5.2 | Parent rotation rotates child frames | **DOCS** | Transform semantics section (see ninja-cat 5.2). |
| 5.3 | `find()` is O(n) per call | **DOCS** | "Cache refs at build/onReady" note; `world.walk` for audits. |
| 5.4 | z conventions unclear | **DOCS** | Global painter's sort documented + layer pass. |
| 6.1 | No tilemap collision | **FIXED@HEAD** | `physics/tilemap` + `aabb`. |
| 6.2 | No platformer physics | **FIXED@HEAD** | `physics/platformer` (coyote, buffer, apex, wall-slide…). |
| 6.3 | No vision/LOS | **FIXED@HEAD** | `physics/raycast` (DDA, cones). |
| 6.4 | No localStorage helper | **FIXED@HEAD** | `persist/storage` adapters + SaveManager. |
| 6.5 | Audio: no loops/ambient | **FIXED@HEAD** | `playSong({loop})`, `startAmbient()`, full music stack. |
| 6.6 | No continuous particles | **FIXED@HEAD + CODE** | `AmbientField` covers weather; `Particles.emit(rate)` continuous mode added for attached emitters (smoke/sparks). |
| 7.1 | HUD pos every frame | **CODE** | `screenSpace`. |
| 7.2 | `inputMap as any` | **CODE** | `InputMap` accepts `readonly string[]` bindings. |
| 7.3 | `splash:false` undocumented | **DOCS** | QUICKSTART mention. |
| 7.4 | Float rows in level messages | **WONT-FIX** | Game data choice. |
| 8.1 | 200 sprites for rain | **FIXED@HEAD** | `AmbientField`. |
| 8.2 | Vision cone recompute | **WONT-FIX** | Game-side caching; engine primitives are pure functions by design. |
| 8.3 | `find()` per frame | **DOCS** | See 5.3. |
| 9 | Documentation gaps list | **DOCS** | All items covered by the docs pass. |
| 10.1 | z appears sibling-local | **FIXED@HEAD + DOCS** | Sort is global; report was a misdiagnosis — but it was possible *because* nothing documented it. Documented + layer pass guarantees overlays. |
| 10.2 | Letterboxing | **FIXED@HEAD + DOCS** | By design; `handle.toDesign()`/`viewport()` documented. |
| 11.1 | Position-driven movement bypasses collision | **DOCS** | Recipe: pair every position write with a resolve (platformer module does this internally). |
| 11.2 | `burst()` coordinate space | **DOCS** | Local-to-the-node space documented. |
| 12.1/12.2 | Rotation affects children only; author un-flipped | **DOCS** | Character-group pattern documented; `Node.pivot` helps. |
| 13.1 | Y-axis convention silent | **DOCS** | "Y increases downward" stated in camera/coords docs. |
| 14.1 | No bbox/pivot debug overlay | **CODE (partial)** | `world.debugTree()` covers tree audits; visual bbox overlay logged as future work (needs renderer pass). |
| 15.1 | Keyframe timer conflation | **WONT-FIX** | Game-logic bug; `PhaseClock`/`Fsm` exist for this. Testing suggestion (probe enemy state after N seconds) already supported by `runSteps` + probe. |

## path-to-glory

| # | Entry | Verdict | Action |
|---|-------|---------|--------|
| 1 | `WorldContext` missing `.state` | **CODE** | `ctx.state` added (theme 7). |
| 2 | No clip/dash/gradient/composite | **CODE + FIXED@HEAD + WONT-FIX** | `lineDash` added; gradients existed; clip + composite deferred (see ninja-cat 1.5). |
| 3 | No right-mouse input | **CODE** | `pointer.right` / `pointer.middle` axes + contextmenu suppression in PointerSource. |
| 4 | IDENTITY-for-HUD undocumented | **CODE + DOCS** | `screenSpace` + draw contract docs. |
| 5 | No nonlinear zoom curve | **DOCS** | Recipe: keep logical zoom in state, map to `cam.zoom` in one cosmetic place. Engine indirection would hide the real render scale that pointer math needs. |
| 6 | No coroutine/async flow | **CODE** | `Coroutines` (generator-based, deterministic, concurrent). |
| 7 | `npm create hayao` 404 | **PARTIAL** | Was mis-marked fixed: a `create-hayao` *bin inside* `hayao` does NOT satisfy `npm create hayao` (npm resolves a standalone `create-hayao` package). Fixed for now via `npx hayao create <name>` (subcommand → same scaffolder); `npm create hayao` needs a standalone `create-hayao` package published (Option A, later). |
| 8 | No seeded per-entity RNG for draw | **CODE** | `hashNoise(…values)` — stateless stable float, safe in `draw()`. |
| 9 | rAF in preview | **CODE** | Built-in ticker (squad 1). |
| 10 | No `pointer.justDown` | **CODE** | Pointer buttons feed the action pipeline (`mouse.left/right/middle` bindable in inputMap → `justPressed` works); axes stay for analog reads. |
| 11 | No z-layer grouping | **CODE + DOCS** | `layer` field + global-sort docs. |
| 12 | No procedural audio API | **CODE** | Public `audio.ctx`/buses (ninja-cat 2.7). |
| 13 | Module state persists across `build()` | **DOCS** | With `ctx.state`+generics there is no longer a reason for module globals; documented. |
| 14 | `composeTransform` order | **DOCS** | Docstring: "applies n first, then m (M·N)". |
| 15 | Transform utils undiscoverable | **FIXED@HEAD** | In API digest; docs cross-link. |
| 16 | AudioBus fields private | **CODE** | Public typed getters (see 12). |
| 17/27 | Single-slot `waitFor` | **CODE** | `Coroutines` supports unlimited concurrent runners + `race`/`all`. |
| 18 | No time scale | **CODE** | `world.timeScale` (hashed when ≠1; scales dt handed to the tree; `pauseMode:'always'` nodes ignore it). |
| 19 | Gradient docs | **DOCS** | Bounding-box space documented. |
| 20 | No typed `findChild<T>` | **CODE** | `node.findOfType(Ctor)` / `world.findOfType(Ctor)` typed helpers. |
| 21 | `children` mutates during free | **FIXED@HEAD** | `free()` defers to end-of-step; `updateTree` iterates a copy. Documented. |
| 22 | `pos` vs x/y duplication | **CODE** | `node.x`/`node.y` accessors backed by `pos`. |
| 23 | Charge ratio lost | **WONT-FIX** | Game architecture. |
| 24 | zoom is render scale | **DOCS** | Same as 5. |
| 25 | No regen/wrap utility | **WONT-FIX** | Niche; `ctx.camera()` (new) removes the sibling-search pain that motivated it. |
| 26 | No camera in WorldContext | **CODE** | `ctx.camera()` → `{ pos, zoom } \| null`. |
| 28 | No pause | **CODE** | `world.paused` + `pauseMode` (squad 14). |
| 29 | `onUpdate` undocumented | **DOCS** | Documented. |
| 30 | No onReady | **FIXED@HEAD** | `onReady()` exists. |
| 31 | `addChild` returns void | **FIXED@HEAD** | Returns the child, typed. |
| 32 | No `handle.tick()` | **CODE** | `handle.tick(dtMs?)`: pointer sample + advance + render in one call. |
| 33 | RAF patch self-inflicted bugs | **CODE** | Root cause removed: engine-owned ticker fallback; no more per-game patches. |
| 34 | Renderer dies on bad radius | **CODE** | Canvas renderer skips non-finite/negative primitives with a warn-once naming the command; per-command isolation so one bad draw can't kill the loop. |
| 35 | `draw()` transform self-inclusive | **DOCS** | Contract documented on `Node.draw` + engine docs. |
| 36 | No transition primitive | **FIXED@HEAD** | `ScreenTransition` (fade/iris/dither) + `CinematicPlayer`. Documented. |

## Release note

Everything above lands as **hayao 0.4.0**. The four recreations pinned 0.3.0;
the single biggest meta-friction is that half their pain was already fixed on
main but unreleased — cut releases more often.

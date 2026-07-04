# FLAGSHIP.md — Kintsugi (the flagship metroidvania)

The first REAL hayao game, not an engine slice: a hand-authored, ability-gated,
multi-biome metroidvania in the kentō woodblock style, machine-proven completable
and softlock-free. **Kintsugi** (金継ぎ) — the craft of mending broken pottery
with gold: you descend a shattered world and rejoin its regions, each recovered
ability a golden seam. On-brand with the kentō woodblock identity (Japanese craft),
and the story engine is baked into the title.

## Story premise
The world of **Kintsugi** cracked when its heart-kiln shattered; the light bled
out and the regions drifted apart, each sealed behind what broke it. You are the
**Mender** — you gather the scattered golden abilities, rejoin the regions seam by
seam, quiet the guardians that grief-hardened over each break, and carry the last
ember back to the heart to refire the kiln. Five story beats, one per biome,
told in-world (shrine murals + guardian encounters), paid off at the Heartroot.

## Why it's tractable
The metroidvania spine is proven in miniature (sproutveil: 4 gated rooms, negative
gate proofs, save/load; gleamvale: combat with zero engine changes). The flagship
is a SCALE + POLISH problem, not a new-tech problem. The one true gap — a typed,
verifiable world-graph — is now closed (see `src/content/worldgraph.ts`).

## The verifiable spine (BUILT — `src/content/worldgraph.ts`)
Progression modelled as a `Puzzle`: `State = (region, pickups taken)`,
`Move = traverse a gated edge | collect a pickup`. Then the engine's `solve()`
proves things no human eyeball can:
- `proveCompletable(world)` — a minimal completion order exists.
- `proveFullCompletion(world)` — a 100% (all-abilities) order exists.
- circular gating (an ability locked behind itself) → provably unsolvable.
- `findSoftlocks(world)` — enumerates every reachable state; flags any dead-end
  (only one-way drops can create one; caught directly regardless).
- `reachableRegions(world, abilities)` — ability-gated flood.
- `validateWorld(world)` — dangling ids, dupes, regions unreachable-with-all-abilities.
9 tests green. This is the layer every room's geometry must honour.

## Scope (v1 — honest)
~5 biomes × ~6 rooms ≈ **30 rooms** (≈8× sproutveil). A genuine interconnected
world and a complete first arc — NOT a fake "40 hours". Extensible afterward.

## Traversal abilities (5) — each opens regions
1. **Double-Jump** — `cfg.airJumps` (envelope-proven gates).
2. **Dash** — `cfg.dash*` (gap gates).
3. **Wall-Cling/Jump** — `cfg.wall*` (shaft gates).
4. **Glide** — reduced fall / air control (long-gap gates; extend cfg).
5. **Light-Burst** — breaks light-gates (a graph gate, not a maneuver; the
   "key-like" ability, proven trivially hard-locked).
Four map to `stepPlatformer` config knobs → gate proofs are maneuver sims via
`jumpHeight`/`jumpDistance`/`dashJumpDistance` (with vs. without the ability).

## Biomes (5) — each a distinct render + audio identity
Grove (dawn, green, sunbeams) → Cistern (flooded, teal glow, reflections) →
Emberworks (ash/forge, warm glow, embers) → Skydrift (wind, parallax clouds,
updrafts) → Heartroot (bioluminescent core, the goal). Each: a KENTO sub-palette,
gradient sky + `ParallaxLayer` depth, glow lights, autotiled walls (Wang +
marching-squares contours), and an adaptive audio layer (`layerGains` on threat).

## Engine reuse (mapped, all present)
- Platforming: `stepPlatformer` (coyote/buffer/apex/corner-slip/dash/wall/DJ/moving-platforms).
- Rooms: `tilemapFromAscii`/`asciiEntities`, sproutveil `transition(room,x,y)` pattern, `Camera2D`+`CameraController`.
- Combat: gleamvale kit (sword arc, hit-stop, i-frames, FSM enemies, projectiles) — generalize into a small data-driven `enemy`/`boss` module (rule of three).
- Save: `SaveManager`. Audio: `Song`/`renderSong` + `layerGains` + spatial SFX. UI: `showScreen`, `ScreenTransition`, `CinematicPlayer`, `Shell`.

## Still to build
- Ability-aware gate-proof helper (derive reach envelope from ability set) — small.
- Data-driven enemy + multi-phase boss module (FSM) — promote from gleamvale.
- Map screen + ability-unlock popups (custom overlays).
- The 30 rooms (ASCII) wired to the world graph; per-biome art + audio.

## Verification plan
Per region: bot-proven deathless run. Whole world: `proveFullCompletion` +
`findSoftlocks` green over the real graph; every geometric gate hard-locked by
maneuver sim; per-biome `renderFilmstrip` + adaptive-audio artifact; deterministic
golden; save/load round-trip.

## Build order (next turns)
1. ✅ Verifiable spine (`worldgraph.ts`) + tests.
2. Scaffold `examples/hollowlight/` + author the **world-graph DATA** for all 30
   rooms and prove it (completable/100%/no-softlock) BEFORE any room geometry.
3. Grove biome end-to-end (rooms + platforming + 1 ability gate + art + audio + bot proof) — the vertical slice that sets every pattern.
4. Remaining biomes; enemies/bosses; map screen; ability popups.
5. Full verify, golden, BUILDLOG/LESSONS, hub card, PR.

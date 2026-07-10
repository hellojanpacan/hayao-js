# The asset contract — what makes any asset first-class

The identity (AGENTS.md) says the house style is **a default, not a wall**.
This document is that promise made precise: the four clauses an asset must
satisfy — house-made or brought from outside — to be a first-class citizen,
and the channels the engine provides for each kind of asset today. A creative
human + agent should be able to replace every hayao-branded look and sound
with their own and lose nothing structural; this contract is *how*.

"Asset" here means any content the sim doesn't compute: vector art, pixel art,
images, sound effects, music, samples, fonts.

## The four clauses

1. **Deterministic to render.** An asset is constant data; the sim never
   waits on it, reads it, or branches on it. Whether an asset has loaded may
   never influence `world.state`, `world.hash()`, sim timing, or anything a
   `probe()` reports. Rendering stays a projection: same state + same assets →
   same picture; same state + *missing* assets → same sim, degraded picture.
   All async loading (samples, images, webfonts) lives in the observer shell
   (`app/` / `render/` / `audio/` / `ui/`) — pausing the sim behind a loading
   screen is fine; logic that differs by load order is broken.

2. **Cosmetic-safe.** The node that carries an asset is pure view: it sets
   `cosmetic = true` so the asset never enters `hash()`/`serialize()`/snapshot
   (`TextureSprite` already defaults to this). Gameplay-relevant geometry —
   collision size, hitboxes, anchors — is typed constants in code, never
   measured from the asset. Swapping a sprite must never change the sim's
   truth.

3. **Loadable without engine changes.** Every asset reaches the screen and
   speakers through the existing style-neutral seams (the channel table
   below). If an asset genuinely needs a new engine capability, the capability
   added must itself be style-neutral — an `ImageCommand`, never a
   `DuotoneCommand`. That's the identity tiebreaker: style-specific things are
   content packs behind `@hayao`'s neutral surface, not primitives.

4. **License-clean.** The asset is original, owned, or carries a license that
   permits redistribution inside an MIT project without restricting the
   game's own distribution. Attribution lands in a `CREDITS.md` next to the
   game that uses it (the site's precedent is `web/CREDITS.md`). House assets
   are original by construction; brought assets must not smuggle a restriction
   into the repo.

## The channels — today's surface

| Asset kind | Channel | Headless behavior |
|---|---|---|
| Vector art | `Sprite` shapes (`rect`/`circle`/`poly`/`path`) + `shapes.ts` helpers (`blobPath`, `smoothClosedPath`, …) + the duotone library | Fully deterministic; renders in the headless SVG; first-class everywhere |
| Unicode glyphs | `glyph` shape / `Text` node | Same — deterministic, headless |
| Pixel art | `PixelBuffer` + palette → `TextureSprite` | Deterministic rect runs; cosmetic by default |
| External images (PNG / JPG / SVG file) | `ImageCommand { href }` — a `data:` URI or a Vite-resolved path | Headless SVG carries the `<image href>` through; the canvas rasterizer omits images (async), so pixel-based judging sees them only via the SVG path |
| Sound effects | `SoundSpec` synth + the ZzFX bridge (`specFromZzfx`) | Deterministic; lintable and analyzable in Node |
| Music | `music`/`album`/`genres` → offline PCM (`encodeWav`, `signalHash`) | Deterministic; renders and hashes headlessly |
| Audio samples (ogg / wav / mp3) | `bus.loadSample(url)` → `bus.playSample(buffer)` | Browser-only: resolves `null` / returns a dead handle in Node; the sim never knows |
| Fonts | `BitmapFont` (`FONT_5`, `layoutText`) in-world; CSS webfonts in DOM overlays only | Bitmap fonts deterministic; webfonts stay in the `ui/` shell |

Two consequences worth stating outright:

- **`npm run verify` never touches asset bytes.** Solver proofs, determinism
  checks, and probes run in Node with no browser and no files — by clause 1,
  they must pass with every asset deleted.
- **The vision judge sees assets through the SVG path.** External images
  render in the headless SVG string; judge looks from there, correctness from
  probes — same as always.

## Where asset files live

Colocate with the game that uses them — `examples/<slug>/` in this repo, or
anywhere in a scaffolded project — and resolve them through Vite
(`import heroUrl from './hero.png'`) so paths work in dev and build alike.
There is no global asset dump: an asset belongs to its game until it earns a
place in the engine's `art/` library, and it enters that library as *code*
(the duotone way), not as a binary.

## Bringing an external asset — the checklist

1. **Delete test:** does the game's `verify.ts` pass with the asset absent?
   If not, the sim depends on it — clause 1 is broken.
2. **Cosmetic test:** is the carrying node `cosmetic = true`, and are all
   hitboxes still code constants?
3. **Channel test:** does it enter through a channel in the table? If it
   can't, the missing primitive must be style-neutral before it's added.
4. **License test:** is the license recorded in the game's `CREDITS.md`, and
   is it MIT-compatible for redistribution?

Pass all four and the asset is first-class — the engine makes no distinction
between it and the house style it replaced.

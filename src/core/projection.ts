// Lattice projections: turn integer grid coordinates into screen positions and
// back. Plain data + pure functions (house style) and fully linear — no trig —
// so the forward/inverse maps are bit-exact and hash-safe if used in the sim.
//
// The 2.5D corpus kept re-deriving the 2:1 iso forward map and, worse, its
// inverse (needed to turn a pointer into a tile coord). `World.screenToWorld()`
// only inverts the camera affine; it has no notion of a tile lattice. `iso()`
// owns that lattice math in one deterministic place.

import type { Vec2 } from './math';

export interface IsoConfig {
  /** Full width of a tile diamond in screen px (the horizontal diagonal). */
  tileW: number;
  /** Full height of a tile diamond in screen px (the vertical diagonal). 2:1 iso ⇒ tileW/2. */
  tileH: number;
  /** Screen px where grid cell (0,0)'s CENTER lands. Default (0,0). */
  origin?: Vec2;
  /** Screen px a tile rises per unit of elevation. Default tileH (one tile-height per level). */
  elevStep?: number;
}

/**
 * A parameterised grid↔screen projection. `toScreen` places a (possibly raised)
 * cell centre; `toGrid` inverts the ground plane (elev 0) to FRACTIONAL grid
 * coordinates — floor them for the containing tile. Round-trips exactly for
 * every integer cell. Covers 2:1 iso (tileH = tileW/2), true dimetric, and
 * top-down/oblique (tileH = tileW) by choice of tile size.
 */
export interface IsoProjection {
  readonly tileW: number;
  readonly tileH: number;
  readonly origin: Vec2;
  readonly elevStep: number;
  /** Grid cell → screen-space centre. `elev` shifts the point up by `elevStep` per unit. */
  toScreen(gx: number, gy: number, elev?: number): Vec2;
  /** Screen point → fractional grid coords on the ground plane (floor for the tile). */
  toGrid(sx: number, sy: number): Vec2;
}

/**
 * Build an isometric/dimetric/oblique projection. Diamond lattice:
 *   screenX = origin.x + (gx - gy) · tileW/2
 *   screenY = origin.y + (gx + gy) · tileH/2 − elev · elevStep
 * The inverse solves the 2×2 system directly, so `toGrid(toScreen(g)) === g` for
 * all integer cells (no accumulated float drift).
 */
export function iso(cfg: IsoConfig): IsoProjection {
  const { tileW, tileH } = cfg;
  const origin: Vec2 = cfg.origin ? { x: cfg.origin.x, y: cfg.origin.y } : { x: 0, y: 0 };
  const elevStep = cfg.elevStep ?? tileH;
  const hw = tileW / 2;
  const hh = tileH / 2;
  return {
    tileW,
    tileH,
    origin,
    elevStep,
    toScreen(gx, gy, elev = 0) {
      return {
        x: origin.x + (gx - gy) * hw,
        y: origin.y + (gx + gy) * hh - elev * elevStep,
      };
    },
    toGrid(sx, sy) {
      const dx = (sx - origin.x) / hw; // = gx - gy
      const dy = (sy - origin.y) / hh; // = gx + gy
      return { x: (dx + dy) / 2, y: (dy - dx) / 2 };
    },
  };
}

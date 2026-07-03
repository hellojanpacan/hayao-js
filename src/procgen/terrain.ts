// Endless terrain surface — knight-dreams' infinite auto-runner terrain, done
// deterministically. The ground height at a column is a PURE function of the
// column index + seed (layered value noise), so it needs no PRNG stream and no
// stored state: any column can be sampled in any order and an infinite world
// stays perfectly reproducible across peers and reloads.
//
// This is LOGICAL structure (the surface is collision), so it belongs in the
// hash — and because it is a stateless pure function of (col, seed), it is
// deterministic by construction. Seed is explicit (derive it from `world.rng`
// once at setup, e.g. `rng.int(1e9)`), never `Math.random`.

import { clamp } from '../core/math';
import { fractalNoise, type FractalOptions } from './scatter';

export interface TerrainOptions {
  /** Baseline ground row (tiles from the top). */
  base: number;
  /** Peak deviation above/below the baseline (tiles). */
  amplitude: number;
  /** Horizontal frequency — smaller = longer, smoother hills. Default 0.08. */
  scale?: number;
  /** Clamp ground into [minRow, maxRow] so it stays on-screen. */
  minRow?: number;
  maxRow?: number;
  seed?: number;
  fractal?: FractalOptions;
}

/**
 * Ground row (integer tile Y) for a column. Lower row = higher ground. Sampling
 * the same (col, opts) always returns the same height — the endless-terrain
 * contract.
 */
export function terrainHeight(col: number, opts: TerrainOptions): number {
  const scale = opts.scale ?? 0.08;
  const seed = opts.seed ?? 0;
  // valueNoise is [0,1]; center to [-1,1] so the surface undulates about `base`.
  const n = fractalNoise(col * scale, 0, seed, opts.fractal) * 2 - 1;
  let row = Math.round(opts.base + n * opts.amplitude);
  if (opts.minRow !== undefined || opts.maxRow !== undefined) {
    row = clamp(row, opts.minRow ?? -Infinity, opts.maxRow ?? Infinity);
  }
  return row;
}

/** Ground rows for a contiguous chunk `[startCol, startCol+count)` (ordered). */
export function terrainSlice(startCol: number, count: number, opts: TerrainOptions): number[] {
  const out = new Array<number>(count);
  for (let i = 0; i < count; i++) out[i] = terrainHeight(startCol + i, opts);
  return out;
}

/** True when a tile is solid ground (at or below the surface row) at (col,row). */
export function isGround(col: number, row: number, opts: TerrainOptions): boolean {
  return row >= terrainHeight(col, opts);
}

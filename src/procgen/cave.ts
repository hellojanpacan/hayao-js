// Cave / cavern carving via cellular automata — space-huggers-style organic
// caverns. This is LOGICAL structure (it becomes collision geometry), so it is
// fully deterministic and hash-relevant: all randomness draws from the passed
// `world.rng`, and every loop iterates row-major (ordered). The knight-dreams
// anti-pattern (raw `Math.random`) is exactly what this avoids — pass a seeded
// `Rng` and the same seed always carves the same cave.

import type { Rng } from '../core/rng';
import { makeGrid, gridSet, solidNeighbours, type Grid } from './grid';

export interface CaveOptions {
  cols: number;
  rows: number;
  /** Initial solid-fill probability (0..1). ~0.45 gives balanced caverns. */
  fill?: number;
  /** Smoothing passes (more = rounder, larger chambers). Default 4. */
  steps?: number;
  /** A cell becomes solid if it has ≥ this many solid neighbours. Default 5. */
  birth?: number;
  /** A solid cell survives if it has ≥ this many solid neighbours. Default 4. */
  survive?: number;
  /** Force the outer ring solid so the cave is sealed. Default true. */
  border?: boolean;
}

/**
 * Generate a cave grid (1 = rock, 0 = open) with cellular automata. Deterministic
 * given `rng`'s state + options. Feed the result to `gridToTilemap` for physics.
 */
export function generateCave(rng: Rng, opts: CaveOptions): Grid {
  const { cols, rows } = opts;
  const fill = opts.fill ?? 0.45;
  const steps = opts.steps ?? 4;
  const birth = opts.birth ?? 5;
  const survive = opts.survive ?? 4;
  const border = opts.border ?? true;

  let g = makeGrid(cols, rows, 0);
  // Random seed fill — ordered draws from world.rng so replays match.
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const edge = border && (x === 0 || y === 0 || x === cols - 1 || y === rows - 1);
      gridSet(g, x, y, edge || rng.chance(fill) ? 1 : 0);
    }
  }

  // Smoothing passes into a fresh grid (double-buffer; no in-place bias).
  for (let s = 0; s < steps; s++) {
    const next = makeGrid(cols, rows, 0);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (border && (x === 0 || y === 0 || x === cols - 1 || y === rows - 1)) {
          gridSet(next, x, y, 1);
          continue;
        }
        const n = solidNeighbours(g, x, y);
        const wasSolid = g.cells[y * cols + x] === 1;
        gridSet(next, x, y, (wasSolid ? n >= survive : n >= birth) ? 1 : 0);
      }
    }
    g = next;
  }
  return g;
}

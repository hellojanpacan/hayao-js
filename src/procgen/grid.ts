// Shared boolean grid for procgen output. Plain data + pure functions (house
// style) so generated levels serialize, hash, and diff cleanly. Convention:
// `1` = solid/wall, `0` = open/floor — matching TILE.SOLID / TILE.EMPTY so a
// grid drops straight into the collision tilemap.

import { TILE, type TilemapData } from '../physics/tilemap';

export interface Grid {
  cols: number;
  rows: number;
  /** Row-major cells, length cols*rows. 1 = solid, 0 = open. */
  cells: number[];
}

/** Allocate a grid filled with a single value (default open). */
export function makeGrid(cols: number, rows: number, fill = 0): Grid {
  return { cols, rows, cells: new Array<number>(cols * rows).fill(fill) };
}

/** Read a cell; out-of-bounds reads as solid (1) so borders seal naturally. */
export function gridAt(g: Grid, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return 1;
  return g.cells[y * g.cols + x];
}

/** Write a cell (no-op out of bounds). */
export function gridSet(g: Grid, x: number, y: number, v: number): void {
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return;
  g.cells[y * g.cols + x] = v;
}

/** Count solid cells in the 8-neighbourhood (Moore) around (x,y). */
export function solidNeighbours(g: Grid, x: number, y: number): number {
  let n = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (gridAt(g, x + dx, y + dy) === 1) n++;
    }
  }
  return n;
}

/**
 * Project a grid to collision geometry: 1 → SOLID, everything else → EMPTY.
 * The result is a logical, hash-relevant `TilemapData` — feed it straight to
 * the physics tilemap functions.
 */
export function gridToTilemap(g: Grid, tileSize = 32): TilemapData {
  const tiles = g.cells.map((c) => (c === 1 ? TILE.SOLID : TILE.EMPTY));
  return { cols: g.cols, rows: g.rows, tileSize, tiles };
}

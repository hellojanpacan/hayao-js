// Room / segment layout — space-huggers-style multi-floor bases. Places
// non-overlapping rectangular rooms into a solid grid and links them with
// L-shaped corridors, carving floor (0) out of rock (1). LOGICAL structure, so
// it is hash-relevant: all randomness is drawn from the passed `world.rng` and
// rooms connect in placement order (ordered iteration) — same seed, same base.

import type { Rng } from '../core/rng';
import { makeGrid, gridSet, type Grid } from './grid';

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DungeonOptions {
  cols: number;
  rows: number;
  /** How many placement attempts to make (actual rooms ≤ this). Default 12. */
  attempts?: number;
  /** Room side length range (tiles), inclusive. */
  minSize?: number;
  maxSize?: number;
  /** Keep a 1-tile solid margin around the grid. Default true. */
  border?: boolean;
}

export interface Dungeon {
  rooms: Room[];
  grid: Grid;
}

/** Center tile of a room (floored). */
export function roomCenter(r: Room): { x: number; y: number } {
  return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) };
}

function overlaps(a: Room, b: Room): boolean {
  // 1-tile gap between rooms so walls never merge.
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

function carveRoom(g: Grid, r: Room): void {
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) gridSet(g, x, y, 0);
  }
}

function carveHCorridor(g: Grid, x0: number, x1: number, y: number): void {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) gridSet(g, x, y, 0);
}
function carveVCorridor(g: Grid, y0: number, y1: number, x: number): void {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) gridSet(g, x, y, 0);
}

/**
 * Generate a room-and-corridor layout in a grid (1 = wall, 0 = floor).
 * Deterministic given `rng` state + options; consecutive rooms are joined so the
 * whole floor is connected. Feed `.grid` to `gridToTilemap` for physics.
 */
export function generateDungeon(rng: Rng, opts: DungeonOptions): Dungeon {
  const { cols, rows } = opts;
  const attempts = opts.attempts ?? 12;
  const minSize = opts.minSize ?? 4;
  const maxSize = opts.maxSize ?? 8;
  const margin = (opts.border ?? true) ? 1 : 0;

  const g = makeGrid(cols, rows, 1); // start solid, carve into it
  const rooms: Room[] = [];

  for (let i = 0; i < attempts; i++) {
    const w = rng.intRange(minSize, maxSize);
    const h = rng.intRange(minSize, maxSize);
    const x = rng.intRange(margin, cols - w - margin - 1);
    const y = rng.intRange(margin, rows - h - margin - 1);
    if (x < margin || y < margin) continue;
    const room: Room = { x, y, w, h };
    if (rooms.some((r) => overlaps(room, r))) continue;

    carveRoom(g, room);
    if (rooms.length > 0) {
      // Connect to the previous room with an L corridor; coin-flip the elbow.
      const prev = roomCenter(rooms[rooms.length - 1]);
      const cur = roomCenter(room);
      if (rng.chance(0.5)) {
        carveHCorridor(g, prev.x, cur.x, prev.y);
        carveVCorridor(g, prev.y, cur.y, cur.x);
      } else {
        carveVCorridor(g, prev.y, cur.y, prev.x);
        carveHCorridor(g, prev.x, cur.x, cur.y);
      }
    }
    rooms.push(room);
  }

  return { rooms, grid: g };
}

// Room geometry, authored as DATA and generated into ASCII the physics tilemap
// speaks. Hand-drawing 26 exact 40×22 grids is error-prone; instead each room is
// a spec (border openings for exits + solid/oneway/hazard rects + markers) and
// `buildRoom` stamps the grid. Border openings sit at FIXED positions so
// neighbouring rooms line up: horizontal seams at rows 15–17, vertical seams at
// cols 18–21. The world graph (world.ts) is the source of truth for WHICH rooms
// connect; these specs place the physical seam and the platforming between them.

import { ABIL } from './world';

export const RW = 40; // room width in tiles
export const RH = 22; // room height in tiles
export const TS = 32; // tile size (px) → 1280×704 design rooms

export type Dir = 'left' | 'right' | 'up' | 'down';
type Rect = [x: number, y: number, w: number, h: number];
type Span = [x: number, y: number, w: number]; // a 1-tall strip (oneway / hazard)

export interface RoomSpec {
  region: string;
  /** Which neighbour each border opening leads to (must match world.ts edges). */
  exits: Partial<Record<Dir, string>>;
  solids?: Rect[];
  oneway?: Span[];
  hazard?: Span[];
  /** Markers: char → [x,y] tile. e.g. shrine pickups. */
  marks?: { char: string; x: number; y: number }[];
}

// Fixed seam positions so adjacent rooms connect cleanly. Horizontal seams sit at
// floor level (rows 17–19, just above the 2-tile floor at rows 20–21) so the
// Mender walks straight through them.
export const H_SEAM = 17; // horizontal exit opening spans rows 17..19
export const H_SEAM_H = 3;
export const V_SEAM = 18; // vertical exit opening spans cols 18..21
export const V_SEAM_W = 4;

/** Standard entry tile when arriving THROUGH the given border (opposite side). */
export function entryFor(_spec: RoomSpec, from: Dir): { x: number; y: number } {
  switch (from) {
    case 'left':
      return { x: 2, y: H_SEAM + 1 };
    case 'right':
      return { x: RW - 3, y: H_SEAM + 1 };
    case 'up':
      return { x: V_SEAM + 1, y: 2 };
    case 'down':
      return { x: V_SEAM + 1, y: RH - 4 };
  }
}

/** Generate the 40×22 ASCII rows for a room spec. */
export function buildRoom(spec: RoomSpec): string[] {
  const g: string[][] = [];
  for (let y = 0; y < RH; y++) {
    g.push(new Array(RW).fill(' '));
  }
  const set = (x: number, y: number, c: string) => {
    if (x >= 0 && x < RW && y >= 0 && y < RH) g[y][x] = c;
  };
  const fillRect = (r: Rect, c: string) => {
    for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) set(x, y, c);
  };
  // Solid border.
  for (let x = 0; x < RW; x++) {
    set(x, 0, '#');
    set(x, RH - 1, '#');
  }
  for (let y = 0; y < RH; y++) {
    set(0, y, '#');
    set(RW - 1, y, '#');
  }
  // A default floor two tiles thick.
  fillRect([0, RH - 2, RW, 2], '#');
  // Interior solids.
  for (const r of spec.solids ?? []) fillRect(r, '#');
  for (const s of spec.oneway ?? []) for (let x = s[0]; x < s[0] + s[2]; x++) set(x, s[1], '-');
  for (const s of spec.hazard ?? []) for (let x = s[0]; x < s[0] + s[2]; x++) set(x, s[1], '^');
  // Carve exit openings LAST so nothing blocks a seam.
  if (spec.exits.left) for (let y = H_SEAM; y < H_SEAM + H_SEAM_H; y++) set(0, y, ' ');
  if (spec.exits.right) for (let y = H_SEAM; y < H_SEAM + H_SEAM_H; y++) set(RW - 1, y, ' ');
  if (spec.exits.up) for (let x = V_SEAM; x < V_SEAM + V_SEAM_W; x++) set(x, 0, ' ');
  if (spec.exits.down) {
    for (let x = V_SEAM; x < V_SEAM + V_SEAM_W; x++) {
      set(x, RH - 1, ' ');
      set(x, RH - 2, ' '); // open the floor too
    }
  }
  // Markers.
  for (const m of spec.marks ?? []) set(m.x, m.y, m.char);
  return g.map((row) => row.join(''));
}

// ── SUNDER GROVE — 6 rooms ──────────────────────────────────────────
// Floor is row 20 (top of the 2-tile floor); platforms rest above it.
const GROVE: RoomSpec[] = [
  {
    region: 'grove_gate',
    exits: { right: 'grove_hollow' },
    // a calm entry: the save shrine on a low dais
    solids: [[6, 18, 4, 2]],
    marks: [{ char: 'K', x: 3, y: 19 }], // K = save shrine (kintsugi anvil)
  },
  {
    region: 'grove_hollow',
    exits: { left: 'grove_gate', up: 'grove_climb', right: 'grove_alcove' },
    // right seam sits across a wide pit → only Goldrush (dash) can cross it
    solids: [
      [10, 19, 3, 1], // stepping stone
      [15, 16, 4, 1], // platform toward the up-seam
      [20, 13, 5, 1], // higher platform under the up-exit
    ],
    hazard: [[27, 19, 9]], // the dash-pit below the right seam
  },
  {
    region: 'grove_climb',
    exits: { down: 'grove_hollow', right: 'grove_shrine', up: 'grove_high' },
    // a rising room; the up-seam ledge is DJ-only (a tall gap)
    solids: [
      [6, 16, 5, 1],
      [14, 13, 4, 1],
      [22, 10, 4, 1], // highest single-jump platform
      [17, 5, 6, 1], // ledge under the up-exit — reachable only with Goldstep
    ],
  },
  {
    region: 'grove_shrine',
    exits: { left: 'grove_climb' },
    // the Shrine of the First Step — Goldstep pickup
    solids: [[24, 16, 6, 2]],
    marks: [{ char: 'S', x: 30, y: 15 }], // S = Goldstep shrine pickup
  },
  {
    region: 'grove_high',
    exits: { down: 'grove_climb', up: 'cistern_mouth' },
    // a vertical shaft; DJ up the ledges to the cistern mouth
    solids: [
      [8, 16, 5, 1],
      [18, 12, 5, 1],
      [10, 8, 5, 1],
      [18, 4, 6, 1],
    ],
  },
  {
    region: 'grove_alcove',
    exits: { left: 'grove_hollow' },
    // a sealed alcove holding an ember shard (backtrack: needs dash to enter)
    solids: [[22, 16, 8, 2]],
    marks: [{ char: 'E', x: 30, y: 15 }], // E = ember shard
  },
];

/** All authored rooms, keyed by region id. Grows biome by biome. */
const SPECS: RoomSpec[] = [...GROVE];

const byRegion = new Map(SPECS.map((s) => [s.region, s]));

export function roomSpec(region: string): RoomSpec | undefined {
  return byRegion.get(region);
}
export function roomRows(region: string): string[] | undefined {
  const s = byRegion.get(region);
  return s ? buildRoom(s) : undefined;
}
/** Regions that have authored geometry (playable so far). */
export const AUTHORED_REGIONS: string[] = SPECS.map((s) => s.region);

/** Pickup marker chars → the world-graph pickup id they represent. */
export const MARK_PICKUPS: Record<string, string> = {
  S: 'step', // Shrine of the First Step → Goldstep
  E: 'grove_shard',
};
export { ABIL };

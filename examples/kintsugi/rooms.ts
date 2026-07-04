// Room geometry, authored as DATA and generated into the ASCII the physics
// tilemap speaks. Each of the 26 rooms is a spec (border openings for exits +
// solid/oneway/hazard rects + markers + enemies); `buildRoom` stamps the grid.
// Border openings sit at FIXED positions so neighbours line up: horizontal seams
// at rows 17–19 (floor level), vertical seams at cols 18–21. The world graph
// (world.ts) is the source of truth for WHICH rooms connect; these place the
// physical seam + the platforming. Pickup IDENTITY comes from the graph — a room
// only marks the POSITION ('P' ability shrine, 'E' ember shard, 'K' save anvil).

import type { EnemyKind } from './combat';

export const RW = 40;
export const RH = 22;
export const TS = 32;

export type Dir = 'left' | 'right' | 'up' | 'down';
type Rect = [x: number, y: number, w: number, h: number];
type Span = [x: number, y: number, w: number];

export interface RoomSpec {
  region: string;
  exits: Partial<Record<Dir, string>>;
  solids?: Rect[];
  oneway?: Span[];
  hazard?: Span[];
  marks?: { char: string; x: number; y: number }[];
  enemies?: { kind: EnemyKind; x: number; y: number }[];
}

export const H_SEAM = 17;
export const H_SEAM_H = 3;
export const V_SEAM = 18;
export const V_SEAM_W = 4;

export function entryFor(_spec: RoomSpec, from: Dir): { x: number; y: number } {
  switch (from) {
    case 'left':
      return { x: 2, y: H_SEAM };
    case 'right':
      return { x: RW - 3, y: H_SEAM };
    case 'up':
      return { x: V_SEAM + 1, y: 2 };
    case 'down':
      return { x: V_SEAM + 1, y: RH - 5 };
  }
}

export function buildRoom(spec: RoomSpec): string[] {
  const g: string[][] = [];
  for (let y = 0; y < RH; y++) g.push(new Array(RW).fill(' '));
  const set = (x: number, y: number, c: string) => {
    if (x >= 0 && x < RW && y >= 0 && y < RH) g[y][x] = c;
  };
  const fillRect = (r: Rect, c: string) => {
    for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) set(x, y, c);
  };
  for (let x = 0; x < RW; x++) {
    set(x, 0, '#');
    set(x, RH - 1, '#');
  }
  for (let y = 0; y < RH; y++) {
    set(0, y, '#');
    set(RW - 1, y, '#');
  }
  fillRect([0, RH - 2, RW, 2], '#'); // floor
  for (const r of spec.solids ?? []) fillRect(r, '#');
  for (const s of spec.oneway ?? []) for (let x = s[0]; x < s[0] + s[2]; x++) set(x, s[1], '-');
  for (const s of spec.hazard ?? []) for (let x = s[0]; x < s[0] + s[2]; x++) set(x, s[1], '^');
  if (spec.exits.left) for (let y = H_SEAM; y < H_SEAM + H_SEAM_H; y++) set(0, y, ' ');
  if (spec.exits.right) for (let y = H_SEAM; y < H_SEAM + H_SEAM_H; y++) set(RW - 1, y, ' ');
  if (spec.exits.up) for (let x = V_SEAM; x < V_SEAM + V_SEAM_W; x++) set(x, 0, ' ');
  if (spec.exits.down) for (let x = V_SEAM; x < V_SEAM + V_SEAM_W; x++) {
    set(x, RH - 1, ' ');
    set(x, RH - 2, ' ');
  }
  for (const m of spec.marks ?? []) set(m.x, m.y, m.char);
  return g.map((r) => r.join(''));
}

// Common decorative helpers.
const K = (x: number, y: number) => ({ char: 'K', x, y }); // save anvil
const P = (x: number, y: number) => ({ char: 'P', x, y }); // ability shrine
const E = (x: number, y: number) => ({ char: 'E', x, y }); // ember shard

const SPECS: RoomSpec[] = [
  // ── SUNDER GROVE ──────────────────────────────────────────────────
  { region: 'grove_gate', exits: { right: 'grove_hollow' }, solids: [[6, 18, 4, 2]], marks: [K(3, 19)] },
  {
    region: 'grove_hollow', exits: { left: 'grove_gate', up: 'grove_climb', right: 'grove_alcove' },
    solids: [[10, 19, 3, 1], [15, 16, 4, 1], [20, 13, 6, 1]], hazard: [[28, 19, 8]],
    enemies: [{ kind: 'husk', x: 12, y: 18 }],
  },
  {
    region: 'grove_climb', exits: { down: 'grove_hollow', right: 'grove_shrine', up: 'grove_high' },
    solids: [[6, 16, 5, 1], [14, 13, 4, 1], [22, 10, 4, 1], [17, 5, 6, 1]],
    enemies: [{ kind: 'husk', x: 28, y: 18 }, { kind: 'mote', x: 20, y: 11 }],
  },
  { region: 'grove_shrine', exits: { left: 'grove_climb' }, solids: [[24, 16, 6, 2]], marks: [P(30, 15)] },
  { region: 'grove_high', exits: { down: 'grove_climb', right: 'cistern_mouth' }, solids: [[8, 16, 5, 1], [18, 12, 5, 1], [10, 8, 5, 1], [26, 14, 6, 1]] },
  { region: 'grove_alcove', exits: { left: 'grove_hollow' }, solids: [[22, 16, 8, 2]], marks: [E(30, 15)] },

  // ── WEEPING CISTERN ───────────────────────────────────────────────
  { region: 'cistern_mouth', exits: { left: 'grove_high', right: 'cistern_pool', down: 'cistern_fall' }, solids: [[10, 15, 5, 1], [24, 13, 5, 1]] },
  {
    region: 'cistern_pool', exits: { left: 'cistern_mouth', right: 'cistern_bell', up: 'cistern_fall', down: 'cistern_vault' },
    solids: [[6, 15, 5, 1], [14, 12, 5, 1], [24, 14, 6, 1]], marks: [K(33, 17)],
    enemies: [{ kind: 'mote', x: 18, y: 10 }],
  },
  { region: 'cistern_fall', exits: { down: 'cistern_pool' }, solids: [[8, 14, 6, 1], [24, 11, 6, 1]], hazard: [[14, 19, 6]] },
  { region: 'cistern_bell', exits: { left: 'cistern_pool', right: 'cistern_shrine' }, solids: [[16, 15, 8, 1]], enemies: [{ kind: 'sentry', x: 20, y: 17 }] },
  { region: 'cistern_shrine', exits: { left: 'cistern_bell', right: 'ember_gate' }, solids: [[6, 16, 6, 2]], marks: [P(9, 15)] },
  { region: 'cistern_vault', exits: { up: 'cistern_pool' }, solids: [[10, 16, 10, 2]], marks: [E(14, 15)] },

  // ── EMBERWORKS ────────────────────────────────────────────────────
  { region: 'ember_gate', exits: { left: 'cistern_shrine', right: 'ember_forge' }, solids: [[12, 15, 6, 1], [22, 13, 6, 1]] },
  {
    region: 'ember_forge', exits: { left: 'ember_gate', right: 'ember_flues', down: 'ember_kilnwalk' },
    solids: [[8, 16, 5, 1], [24, 14, 6, 1]], marks: [K(34, 17)], enemies: [{ kind: 'husk', x: 16, y: 18 }],
  },
  { region: 'ember_flues', exits: { left: 'ember_forge', right: 'ember_warden' }, solids: [[10, 14, 4, 1], [20, 11, 4, 1], [28, 15, 5, 1]], hazard: [[14, 19, 6]] },
  { region: 'ember_warden', exits: { left: 'ember_flues', right: 'ember_shrine' }, solids: [[14, 16, 12, 1]], enemies: [{ kind: 'sentry', x: 26, y: 17 }, { kind: 'husk', x: 12, y: 18 }] },
  { region: 'ember_shrine', exits: { left: 'ember_warden', up: 'sky_ascent' }, solids: [[6, 16, 6, 2]], marks: [P(9, 15)] },
  { region: 'ember_kilnwalk', exits: { up: 'ember_forge' }, solids: [[10, 16, 12, 2]], marks: [E(14, 15)] },

  // ── SKYDRIFT SPAN ─────────────────────────────────────────────────
  { region: 'sky_ascent', exits: { down: 'ember_shrine', up: 'sky_span' }, solids: [[8, 16, 4, 1], [22, 13, 4, 1], [12, 9, 5, 1]] },
  {
    region: 'sky_span', exits: { down: 'sky_ascent', right: 'sky_updraft', up: 'sky_perch' },
    solids: [[8, 16, 4, 1], [16, 14, 4, 1], [26, 13, 5, 1]], marks: [K(3, 19)],
    enemies: [{ kind: 'mote', x: 20, y: 9 }],
  },
  { region: 'sky_updraft', exits: { left: 'sky_span', right: 'sky_gale' }, oneway: [[10, 14, 4], [22, 11, 4]], solids: [[14, 8, 4, 1]] },
  { region: 'sky_gale', exits: { left: 'sky_updraft', right: 'sky_shrine' }, solids: [[16, 15, 8, 1]], enemies: [{ kind: 'mote', x: 14, y: 10 }, { kind: 'mote', x: 24, y: 9 }] },
  { region: 'sky_shrine', exits: { left: 'sky_gale', right: 'heart_descent' }, solids: [[6, 16, 6, 2]], marks: [P(9, 15)] },
  { region: 'sky_perch', exits: { down: 'sky_span' }, solids: [[14, 15, 12, 2]], marks: [E(20, 14)] },

  // ── HEARTROOT (finale) ────────────────────────────────────────────
  { region: 'heart_descent', exits: { left: 'sky_shrine', down: 'heart_seam' }, solids: [[10, 15, 5, 1], [24, 13, 5, 1]], marks: [K(3, 19)] },
  { region: 'heart_seam', exits: { up: 'heart_descent', down: 'heart_light' }, solids: [[8, 14, 6, 1], [24, 12, 6, 1]], enemies: [{ kind: 'husk', x: 16, y: 18 }] },
  { region: 'heart_light', exits: { up: 'heart_seam', right: 'heart_gate' }, solids: [[8, 16, 6, 2]], marks: [P(11, 15)] },
  { region: 'heart_gate', exits: { left: 'heart_light', right: 'heart_grief' }, solids: [[14, 14, 12, 1]] },
  { region: 'heart_grief', exits: { left: 'heart_gate', right: 'heart_kiln' }, solids: [[10, 16, 20, 1]], enemies: [{ kind: 'sentry', x: 20, y: 15 }, { kind: 'husk', x: 26, y: 18 }] },
  { region: 'heart_kiln', exits: { left: 'heart_grief' }, solids: [[16, 15, 8, 3]], marks: [{ char: 'W', x: 20, y: 14 }] }, // W = the kiln (win beacon)
];

const byRegion = new Map(SPECS.map((s) => [s.region, s]));

export function roomSpec(region: string): RoomSpec | undefined {
  return byRegion.get(region);
}
export function roomRows(region: string): string[] | undefined {
  const s = byRegion.get(region);
  return s ? buildRoom(s) : undefined;
}
export const AUTHORED_REGIONS: string[] = SPECS.map((s) => s.region);

/** World position (px, tile-centre) of the first marker `char` in a room, or null. */
export function markerPos(region: string, char: string): { x: number; y: number } | null {
  const rows = roomRows(region);
  if (!rows) return null;
  for (let ty = 0; ty < RH; ty++) {
    const tx = rows[ty].indexOf(char);
    if (tx >= 0) return { x: tx * TS + TS / 2, y: ty * TS + TS / 2 };
  }
  return null;
}

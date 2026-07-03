// Bramblefall RTS-lite sim — pure module. Flow-field pathfinding (BFS
// integration field over the tile grid), 300+ units steering with separation
// through the SpatialHash, a spear→cavalry→archer→spear counter triangle,
// keep-vs-keep victory, and a pulsing enemy commander.

import { SpatialHash, TILE, tileAt, tilemapFromAscii, type TilemapData } from '@hayao';

export const TILE_SIZE = 32;
export const COLS = 40;
export const ROWS = 22;

// Open field with bramble blobs mid-map.
export const FIELD_ROWS: string[] = (() => {
  const B = '#'.repeat(40);
  const E = '#' + ' '.repeat(38) + '#';
  const blob = (cols: number[]) => {
    const r = Array(40).fill(' ');
    r[0] = '#';
    r[39] = '#';
    for (const c of cols) r[c] = '#';
    return r.join('');
  };
  return [
    B, E, E, E,
    blob([18, 19, 20, 21]),
    blob([18, 19, 20, 21]),
    E, E, E, E,
    blob([12, 13, 26, 27]),
    blob([12, 13, 26, 27]),
    E, E, E, E,
    blob([18, 19, 20, 21]),
    blob([18, 19, 20, 21]),
    E, E, E, B,
  ];
})();

export type UnitKind = 'spear' | 'cavalry' | 'archer';
export type Team = 0 | 1; // 0 = player (west), 1 = foe (east)

export const U_TUNE: Record<UnitKind, { hp: number; speed: number; range: number; dmg: number; rate: number; radius: number }> = {
  spear: { hp: 60, speed: 66, range: 30, dmg: 8, rate: 1.1, radius: 9 },
  cavalry: { hp: 80, speed: 120, range: 30, dmg: 10, rate: 1.0, radius: 11 },
  archer: { hp: 40, speed: 72, range: 175, dmg: 6, rate: 0.9, radius: 8 },
};

/** attacker → defender damage multiplier (the counter triangle). */
export function counterMult(a: UnitKind, d: UnitKind): number {
  if (a === 'spear' && d === 'cavalry') return 2.4;
  if (a === 'cavalry' && d === 'archer') return 2.4;
  if (a === 'archer' && d === 'spear') return 2.2;
  if (a === 'cavalry' && d === 'spear') return 0.55;
  if (a === 'archer' && d === 'cavalry') return 0.55;
  if (a === 'spear' && d === 'archer') return 0.6;
  return 1;
}

export const KEEPS = [
  { x: 96, y: 352, hp: 600 },
  { x: 1184, y: 352, hp: 600 },
];
export const UNIT_CAP = 150; // per team
export const REINFORCE_EVERY = 1.7; // seconds, round-robin kind
export const PULSE_EVERY = 26; // foe commander attacks

export interface Unit {
  kind: UnitKind;
  team: Team;
  x: number;
  y: number;
  hp: number;
  cd: number;
  /** This unit's current order: a goal tile it flows toward when idle. */
  tx: number;
  ty: number;
}

export interface BfState {
  units: Unit[];
  keepHp: [number, number];
  time: number;
  reinforceT: [number, number];
  reinforceIdx: [number, number];
  pulseT: number;
  /** Player command target (tile coords) + generation, per group (0=all). */
  cursor: { tx: number; ty: number };
  selected: UnitKind | 'all';
  won: boolean;
  dead: boolean;
  kills: [number, number];
  [key: string]: unknown;
}

let _map: TilemapData | null = null;
export const fieldMap = (): TilemapData => (_map ??= tilemapFromAscii(FIELD_ROWS, TILE_SIZE));

// ── Flow fields ──
// A field is Int8 dx/dy per tile toward a goal, from a BFS integration over
// walkable tiles. Cached per goal tile; the cache is derived data (not state).
const fieldCache = new Map<number, { dx: Int8Array; dy: Int8Array }>();

export function flowField(goalTx: number, goalTy: number): { dx: Int8Array; dy: Int8Array } {
  const key = goalTy * COLS + goalTx;
  const hit = fieldCache.get(key);
  if (hit) return hit;
  const map = fieldMap();
  const dist = new Int32Array(COLS * ROWS).fill(-1);
  const q: number[] = [];
  const goal = goalTy * COLS + goalTx;
  dist[goal] = 0;
  q.push(goal);
  for (let head = 0; head < q.length; head++) {
    const cur = q[head];
    const cx = cur % COLS;
    const cy = (cur / COLS) | 0;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + ox;
      const ny = cy + oy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const ni = ny * COLS + nx;
      if (dist[ni] !== -1 || tileAt(map, nx, ny) === TILE.SOLID) continue;
      dist[ni] = dist[cur] + 1;
      q.push(ni);
    }
  }
  const dx = new Int8Array(COLS * ROWS);
  const dy = new Int8Array(COLS * ROWS);
  for (let ty = 0; ty < ROWS; ty++)
    for (let tx = 0; tx < COLS; tx++) {
      const i = ty * COLS + tx;
      if (dist[i] < 0) continue;
      let best = dist[i];
      let bx = 0;
      let by = 0;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
        const nx = tx + ox;
        const ny = ty + oy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
        const nd = dist[ny * COLS + nx];
        if (nd >= 0 && nd < best) {
          best = nd;
          bx = ox;
          by = oy;
        }
      }
      dx[i] = bx;
      dy[i] = by;
    }
  const field = { dx, dy };
  fieldCache.set(key, field);
  return field;
}

function spawnUnit(s: BfState, team: Team, kind: UnitKind): void {
  const keep = KEEPS[team];
  const n = s.units.filter((u) => u.team === team).length;
  if (n >= UNIT_CAP) return;
  const row = n % 7;
  s.units.push({ kind, team, x: keep.x + (team === 0 ? 40 : -40), y: keep.y - 96 + row * 32, hp: U_TUNE[kind].hp, cd: 0, tx: team === 0 ? 6 : 33, ty: 11 });
}

export function initialBf(): BfState {
  const s: BfState = { units: [], keepHp: [KEEPS[0].hp, KEEPS[1].hp], time: 0, reinforceT: [0, 0], reinforceIdx: [0, 0], pulseT: PULSE_EVERY * 0.6, cursor: { tx: 20, ty: 11 }, selected: 'all', won: false, dead: false, kills: [0, 0] };
  const KINDS: UnitKind[] = ['spear', 'cavalry', 'archer'];
  for (let team = 0 as Team; team <= 1; team = (team + 1) as Team)
    for (const kind of KINDS) for (let i = 0; i < 40; i++) spawnUnit(s, team, kind);
  return s;
}

export interface BfInput {
  cursorX: number; // -1/0/1 (held)
  cursorY: number;
  select: UnitKind | 'all' | null; // justPressed
  order: boolean; // justPressed: send selected to cursor
}

export interface BfEvents {
  ordered: boolean;
  won: boolean;
  died: boolean;
}

export function stepBf(s: BfState, input: BfInput, dt: number): BfEvents {
  const ev: BfEvents = { ordered: false, won: false, died: false };
  if (s.won || s.dead) return ev;
  s.time += dt;
  const map = fieldMap();

  // ── Player command interface ──
  s.cursor.tx = Math.min(COLS - 2, Math.max(1, s.cursor.tx + input.cursorX));
  s.cursor.ty = Math.min(ROWS - 2, Math.max(1, s.cursor.ty + input.cursorY));
  if (input.select) s.selected = input.select;
  if (input.order) {
    for (const u of s.units)
      if (u.team === 0 && (s.selected === 'all' || u.kind === s.selected)) {
        u.tx = s.cursor.tx;
        u.ty = s.cursor.ty;
      }
    ev.ordered = true;
  }

  // ── Reinforcements ──
  const KINDS: UnitKind[] = ['spear', 'cavalry', 'archer'];
  for (let team = 0 as Team; team <= 1; team = (team + 1) as Team) {
    s.reinforceT[team] += dt;
    if (s.reinforceT[team] >= REINFORCE_EVERY) {
      s.reinforceT[team] = 0;
      spawnUnit(s, team, KINDS[s.reinforceIdx[team] % 3]);
      s.reinforceIdx[team]++;
    }
  }

  // ── Foe commander: pulse attacks at the player keep ──
  s.pulseT -= dt;
  if (s.pulseT <= 0) {
    s.pulseT = PULSE_EVERY;
    for (const u of s.units)
      if (u.team === 1) {
        u.tx = 3;
        u.ty = 11;
      }
  }

  // ── Broad phase ──
  const hash = new SpatialHash<number>(64);
  s.units.forEach((u, i) => hash.insert(i, { x: u.x - 12, y: u.y - 12, w: 24, h: 24 }));

  // ── Units: fight if an enemy is near, else follow the flow field ──
  for (let i = 0; i < s.units.length; i++) {
    const u = s.units[i];
    if (u.hp <= 0) continue;
    const T = U_TUNE[u.kind];
    u.cd = Math.max(0, u.cd - dt);

    // Nearest enemy within engage radius (range + a seek margin).
    const seek = Math.max(T.range + 8, 120);
    let foe = -1;
    let fd = Infinity;
    for (const j of hash.queryCircle(u.x, u.y, seek)) {
      const v = s.units[j];
      if (v.team === u.team || v.hp <= 0) continue;
      const d = (v.x - u.x) * (v.x - u.x) + (v.y - u.y) * (v.y - u.y);
      if (d < fd) {
        fd = d;
        foe = j;
      }
    }

    let mx = 0;
    let my = 0;
    if (foe >= 0) {
      const v = s.units[foe];
      const d = Math.sqrt(fd) || 1;
      if (d <= T.range) {
        if (u.cd <= 0) {
          u.cd = 1 / T.rate;
          v.hp -= T.dmg * counterMult(u.kind, v.kind);
          if (v.hp <= 0) s.kills[u.team]++;
        }
      } else {
        mx = ((v.x - u.x) / d) * T.speed;
        my = ((v.y - u.y) / d) * T.speed;
      }
    } else {
      // Follow this unit's order field; attack the enemy keep when close.
      const target = { tx: u.tx, ty: u.ty };
      const enemyKeep = KEEPS[u.team === 0 ? 1 : 0];
      const kd = Math.hypot(enemyKeep.x - u.x, enemyKeep.y - u.y);
      if (kd < T.range + 34) {
        if (u.cd <= 0) {
          u.cd = 1 / T.rate;
          s.keepHp[u.team === 0 ? 1 : 0] -= T.dmg;
        }
      } else {
        const f = flowField(target.tx, target.ty);
        const ti = Math.min(ROWS - 1, Math.max(0, Math.floor(u.y / TILE_SIZE))) * COLS + Math.min(COLS - 1, Math.max(0, Math.floor(u.x / TILE_SIZE)));
        const atTarget = Math.abs(u.x - (target.tx + 0.5) * TILE_SIZE) < 50 && Math.abs(u.y - (target.ty + 0.5) * TILE_SIZE) < 50;
        if (!atTarget) {
          mx = f.dx[ti] * T.speed;
          my = f.dy[ti] * T.speed;
          const ml = Math.hypot(mx, my) || 1;
          mx = (mx / ml) * T.speed;
          my = (my / ml) * T.speed;
        }
      }
    }

    // Separation.
    for (const j of hash.queryCircle(u.x, u.y, T.radius + 8)) {
      if (j === i || s.units[j].hp <= 0) continue;
      const ox = u.x - s.units[j].x;
      const oy = u.y - s.units[j].y;
      const od = Math.hypot(ox, oy) || 1;
      mx += (ox / od) * 46;
      my += (oy / od) * 46;
      break;
    }
    const nx = u.x + mx * dt;
    const ny = u.y + my * dt;
    // Tile walls block.
    if (tileAt(map, Math.floor(nx / TILE_SIZE), Math.floor(u.y / TILE_SIZE)) !== TILE.SOLID) u.x = Math.min(1260, Math.max(20, nx));
    if (tileAt(map, Math.floor(u.x / TILE_SIZE), Math.floor(ny / TILE_SIZE)) !== TILE.SOLID) u.y = Math.min(690, Math.max(20, ny));
  }
  s.units = s.units.filter((u) => u.hp > 0);

  // ── Victory ──
  if (s.keepHp[1] <= 0) {
    s.won = true;
    ev.won = true;
  } else if (s.keepHp[0] <= 0) {
    s.dead = true;
    ev.died = true;
  }
  return ev;
}

export const countBy = (s: BfState, team: Team): Record<UnitKind | 'total', number> => {
  const out = { spear: 0, cavalry: 0, archer: 0, total: 0 };
  for (const u of s.units)
    if (u.team === team) {
      out[u.kind]++;
      out.total++;
    }
  return out;
};

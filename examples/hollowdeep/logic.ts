// Hollowdeep roguelike sim — pure module. Procgen floors (rooms + L-corridors,
// connected by construction and PROVEN by BFS in verify), raycast FOV with
// explored-tile memory, bump combat, potions, and a three-floor descent to
// the Pale Amulet. Fully turn-based: one input edge = one world turn.

import { Rng, lineOfSight, tilemapFromAscii, type TilemapData } from '@hayao';

export const COLS = 40;
export const ROWS = 22;
export const TILE_SIZE = 32;
export const FLOORS = 3;
export const FOV_RADIUS = 7; // tiles

export type Cell = 0 | 1; // 0 floor, 1 wall

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Floor {
  cells: Cell[]; // row-major
  rooms: Room[];
  entry: { x: number; y: number };
  stairs: { x: number; y: number }; // stairs down (amulet on the last floor)
  potions: { x: number; y: number }[];
  sword: { x: number; y: number } | null;
  monsters: Monster[];
}

export interface Monster {
  kind: 'rat' | 'shade';
  x: number;
  y: number;
  hp: number;
  /** Shades act every other turn. */
  phase: number;
}

export const M_TUNE = { rat: { hp: 6, atk: 2 }, shade: { hp: 14, atk: 4 } } as const;
export const P_TUNE = { hp: 24, atk: 4, potionHeal: 12 };

export const idx = (x: number, y: number): number => y * COLS + x;

export function genFloor(rng: Rng, depth: number): Floor {
  const cells = new Array<Cell>(COLS * ROWS).fill(1);
  const rooms: Room[] = [];
  const carve = (x: number, y: number) => {
    if (x > 0 && y > 0 && x < COLS - 1 && y < ROWS - 1) cells[idx(x, y)] = 0;
  };
  // Rooms.
  for (let tries = 0; tries < 120 && rooms.length < 9; tries++) {
    const w = 4 + rng.int(6);
    const h = 3 + rng.int(4);
    const x = 1 + rng.int(COLS - w - 2);
    const y = 1 + rng.int(ROWS - h - 2);
    if (rooms.some((r) => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
    rooms.push({ x, y, w, h });
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) carve(xx, yy);
  }
  // L-corridors between consecutive room centres (connected by construction).
  const centres = rooms.map((r) => ({ x: (r.x + r.w / 2) | 0, y: (r.y + r.h / 2) | 0 }));
  const carveH = (x0: number, x1: number, y: number) => {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) carve(x, y);
  };
  const carveV = (y0: number, y1: number, x: number) => {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) carve(x, y);
  };
  for (let i = 1; i < centres.length; i++) {
    const a = centres[i - 1];
    const b = centres[i];
    if (rng.chance(0.5)) {
      carveH(a.x, b.x, a.y); // east/west first…
      carveV(a.y, b.y, b.x); // …then turn
    } else {
      carveV(a.y, b.y, a.x);
      carveH(a.x, b.x, b.y);
    }
  }
  const inRoom = (i: number) => {
    const r = rooms[i];
    return { x: r.x + rng.int(r.w), y: r.y + rng.int(r.h) };
  };
  const entry = inRoom(0);
  const stairs = inRoom(rooms.length - 1);
  const potions = Array.from({ length: 2 + rng.int(2) }, () => inRoom(1 + rng.int(rooms.length - 1)));
  const sword = depth === 1 ? inRoom(1 + rng.int(rooms.length - 1)) : null;
  const monsters: Monster[] = [];
  const count = 4 + depth * 2;
  for (let i = 0; i < count; i++) {
    const p = inRoom(1 + rng.int(rooms.length - 1));
    if (p.x === entry.x && p.y === entry.y) continue;
    const kind = rng.chance(0.25 + depth * 0.15) ? 'shade' : 'rat';
    monsters.push({ kind, x: p.x, y: p.y, hp: M_TUNE[kind].hp, phase: i % 2 });
  }
  return { cells, rooms, entry, stairs, potions, sword, monsters };
}

export interface HdState {
  depth: number;
  floors: Floor[];
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  potions: number;
  turns: number;
  visible: boolean[]; // current-floor FOV
  explored: boolean[][]; // per floor
  won: boolean;
  dead: boolean;
  kills: number;
  msg: string;
  [key: string]: unknown;
}

/** ASCII cells → tilemap so the engine raycast can answer sight queries. */
const mapCache = new WeakMap<Floor, TilemapData>();
export function floorTilemap(f: Floor): TilemapData {
  let m = mapCache.get(f);
  if (!m) {
    const rows: string[] = [];
    for (let y = 0; y < ROWS; y++) {
      let row = '';
      for (let x = 0; x < COLS; x++) row += f.cells[idx(x, y)] ? '#' : ' ';
      rows.push(row);
    }
    m = tilemapFromAscii(rows, TILE_SIZE);
    mapCache.set(f, m);
  }
  return m;
}

export function computeFov(s: HdState): void {
  const f = s.floors[s.depth];
  const map = floorTilemap(f);
  s.visible = new Array(COLS * ROWS).fill(false);
  const px = (s.x + 0.5) * TILE_SIZE;
  const py = (s.y + 0.5) * TILE_SIZE;
  for (let y = Math.max(0, s.y - FOV_RADIUS); y <= Math.min(ROWS - 1, s.y + FOV_RADIUS); y++)
    for (let x = Math.max(0, s.x - FOV_RADIUS); x <= Math.min(COLS - 1, s.x + FOV_RADIUS); x++) {
      const dx = x - s.x;
      const dy = y - s.y;
      if (dx * dx + dy * dy > FOV_RADIUS * FOV_RADIUS) continue;
      // A tile is visible if a ray reaches its centre (walls are lit when hit).
      const vis = f.cells[idx(x, y)] === 1
        ? lineOfSight(map, px, py, (x + 0.5) * TILE_SIZE - Math.sign(dx) * 14, (y + 0.5) * TILE_SIZE - Math.sign(dy) * 14)
        : lineOfSight(map, px, py, (x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
      if (vis) {
        s.visible[idx(x, y)] = true;
        s.explored[s.depth][idx(x, y)] = true;
      }
    }
}

export function initialHd(rng: Rng): HdState {
  const floors = Array.from({ length: FLOORS }, (_, d) => genFloor(rng, d));
  const s: HdState = {
    depth: 0,
    floors,
    x: floors[0].entry.x,
    y: floors[0].entry.y,
    hp: P_TUNE.hp,
    maxHp: P_TUNE.hp,
    atk: P_TUNE.atk,
    potions: 1,
    turns: 0,
    visible: [],
    explored: Array.from({ length: FLOORS }, () => new Array(COLS * ROWS).fill(false)),
    won: false,
    dead: false,
    kills: 0,
    msg: 'The Hollow yawns below. Find the Pale Amulet.',
  };
  computeFov(s);
  return s;
}

export type HdMove = 'left' | 'right' | 'up' | 'down' | 'wait' | 'quaff';

export interface HdEvents {
  fought: boolean;
  killed: boolean;
  hurt: boolean;
  descended: boolean;
  drank: boolean;
  won: boolean;
  died: boolean;
}

/** One full turn: player action, then every monster on this floor acts. */
export function stepHd(s: HdState, move: HdMove, rng: Rng): HdEvents {
  const ev: HdEvents = { fought: false, killed: false, hurt: false, descended: false, drank: false, won: false, died: false };
  if (s.won || s.dead) return ev;
  const f = s.floors[s.depth];
  s.turns++;

  // ── Player action ──
  if (move === 'quaff') {
    if (s.potions > 0 && s.hp < s.maxHp) {
      s.potions--;
      s.hp = Math.min(s.maxHp, s.hp + P_TUNE.potionHeal);
      s.msg = 'The draught knits your wounds.';
      ev.drank = true;
    }
  } else if (move !== 'wait') {
    const d = move === 'left' ? [-1, 0] : move === 'right' ? [1, 0] : move === 'up' ? [0, -1] : [0, 1];
    const nx = s.x + d[0];
    const ny = s.y + d[1];
    const m = f.monsters.find((mo) => mo.x === nx && mo.y === ny && mo.hp > 0);
    if (m) {
      m.hp -= s.atk;
      ev.fought = true;
      if (m.hp <= 0) {
        s.kills++;
        ev.killed = true;
        s.msg = `The ${m.kind} is no more.`;
      }
    } else if (f.cells[idx(nx, ny)] === 0) {
      s.x = nx;
      s.y = ny;
    }
  }
  f.monsters = f.monsters.filter((m) => m.hp > 0);

  // ── Pickups / stairs ──
  const pi = f.potions.findIndex((p) => p.x === s.x && p.y === s.y);
  if (pi >= 0) {
    f.potions.splice(pi, 1);
    s.potions++;
    s.msg = 'You pocket a murky draught.';
  }
  if (f.sword && f.sword.x === s.x && f.sword.y === s.y) {
    f.sword = null;
    s.atk += 3;
    s.msg = 'A pale blade — it hums. (+3 atk)';
  }
  if (f.stairs.x === s.x && f.stairs.y === s.y) {
    if (s.depth === FLOORS - 1) {
      s.won = true;
      ev.won = true;
      s.msg = 'The Pale Amulet is yours. The Hollow exhales.';
      return ev;
    }
    s.depth++;
    const nf = s.floors[s.depth];
    s.x = nf.entry.x;
    s.y = nf.entry.y;
    ev.descended = true;
    s.msg = `You descend to floor ${s.depth + 1}.`;
    computeFov(s);
    return ev; // descending consumes the monsters' turn
  }

  // ── Monsters act ──
  const map = floorTilemap(f);
  for (const m of f.monsters) {
    if (m.kind === 'shade') {
      m.phase = (m.phase + 1) % 2;
      if (m.phase === 0) continue; // shades are slow
    }
    const dx = s.x - m.x;
    const dy = s.y - m.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    if (dist === 1) {
      s.hp -= M_TUNE[m.kind].atk;
      ev.hurt = true;
      s.msg = `The ${m.kind} ${m.kind === 'rat' ? 'bites' : 'chills'} you.`;
      continue;
    }
    // Chase when the monster can see the player; else shuffle.
    const sees = dist <= FOV_RADIUS + 2 && lineOfSight(map, (m.x + 0.5) * TILE_SIZE, (m.y + 0.5) * TILE_SIZE, (s.x + 0.5) * TILE_SIZE, (s.y + 0.5) * TILE_SIZE);
    let step: [number, number];
    if (sees) {
      step = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
      // If the primary axis is blocked, try the other.
      const [px2, py2] = [m.x + step[0], m.y + step[1]];
      if (f.cells[idx(px2, py2)] !== 0 || f.monsters.some((o) => o !== m && o.x === px2 && o.y === py2)) {
        step = Math.abs(dx) >= Math.abs(dy) ? [0, Math.sign(dy)] : [Math.sign(dx), 0];
      }
    } else {
      const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      step = dirs[rng.int(4)];
    }
    const nx = m.x + step[0];
    const ny = m.y + step[1];
    if (f.cells[idx(nx, ny)] === 0 && !(nx === s.x && ny === s.y) && !f.monsters.some((o) => o !== m && o.x === nx && o.y === ny)) {
      m.x = nx;
      m.y = ny;
    }
  }

  if (s.hp <= 0) {
    s.dead = true;
    ev.died = true;
    s.msg = 'The Hollow keeps you.';
  }
  computeFov(s);
  return ev;
}

/** BFS reachability over floor cells (the connectivity proof). */
export function reachable(f: Floor, fromX: number, fromY: number, toX: number, toY: number): boolean {
  const seen = new Array(COLS * ROWS).fill(false);
  const q = [idx(fromX, fromY)];
  seen[q[0]] = true;
  for (let head = 0; head < q.length; head++) {
    const cur = q[head];
    if (cur === idx(toX, toY)) return true;
    const cx = cur % COLS;
    const cy = (cur / COLS) | 0;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = idx(cx + ox, cy + oy);
      if (cx + ox < 0 || cy + oy < 0 || cx + ox >= COLS || cy + oy >= ROWS) continue;
      if (seen[ni] || f.cells[ni] === 1) continue;
      seen[ni] = true;
      q.push(ni);
    }
  }
  return false;
}

/** Deterministic layout fingerprint for seed-reproducibility checks. */
export const floorHash = (f: Floor): string => f.cells.join('') + '|' + f.stairs.x + ',' + f.stairs.y;

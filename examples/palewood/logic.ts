// Palewood horror sim — pure module. One night in the woods: a lantern with
// draining fuel, fuel cans scattered among the trees, and the Pales — shapes
// that stalk the darkness, flinch from light, and feed on the unlit. Survive
// to dawn. Light repels; darkness kills; fuel forces you out of safety.

import { lineOfSight, tilemapFromAscii, moveRect, type Rng, type TilemapData, dhypot } from '@hayao';

export const TILE_SIZE = 32;
export const W = 1280;
export const H = 704;
export const DAWN_AT = 90; // seconds
export const LANTERN = { radius: 190, fuelMax: 30, drainPerSec: 1, refuel: 16 };
export const PALE = { speed: 74, fleeSpeed: 130, killDist: 26, spawnEvery: 11, cap: 5 };
export const P_SPEED = 200;

// The clearing: border trees + scattered copses.
export const WOODS_ROWS: string[] = (() => {
  const B = '#'.repeat(40);
  const E = '#' + ' '.repeat(38) + '#';
  const t = (cols: number[]) => {
    const r = Array(40).fill(' ');
    r[0] = '#';
    r[39] = '#';
    for (const c of cols) r[c] = '#';
    return r.join('');
  };
  return [
    B, E,
    t([8, 9, 30]),
    t([8, 9]),
    E,
    t([20, 21]),
    t([20, 21, 33, 34]),
    E, E,
    t([5, 6, 26]),
    t([5, 6, 26, 27]),
    E,
    t([14, 15]),
    t([14, 15, 31, 32]),
    E, E,
    t([9, 10, 22, 23]),
    t([22, 23]),
    E, E, E, B,
  ];
})();

export interface Pale {
  x: number;
  y: number;
  /** stalk | flee */
  state: string;
}

export interface PwState {
  x: number;
  y: number;
  fuel: number;
  /** Grabs survived (2 = death). */
  wounds: number;
  grace: number;
  time: number;
  cans: { x: number; y: number }[];
  fetched: number;
  pales: Pale[];
  spawnT: number;
  dead: boolean;
  won: boolean;
  [key: string]: unknown;
}

let _map: TilemapData | null = null;
export const woodsMap = (): TilemapData => (_map ??= tilemapFromAscii(WOODS_ROWS, TILE_SIZE));

export const CAN_SPOTS = [
  { x: 200, y: 130 },
  { x: 1090, y: 180 },
  { x: 170, y: 560 },
  { x: 1130, y: 540 },
  { x: 660, y: 100 },
];

export function initialPw(): PwState {
  return { x: 640, y: 360, fuel: LANTERN.fuelMax, time: 0, wounds: 0, grace: 0, cans: CAN_SPOTS.map((c) => ({ ...c })), fetched: 0, pales: [], spawnT: 4, dead: false, won: false };
}

/** Is a point inside the player's lantern light (fuel > 0, LOS, radius)? */
export function inLight(s: PwState, x: number, y: number): boolean {
  if (s.fuel <= 0) return false;
  const d = dhypot(x - s.x, y - s.y);
  if (d > LANTERN.radius) return false;
  return lineOfSight(woodsMap(), s.x, s.y, x, y);
}

export interface PwInput {
  moveX: number;
  moveY: number;
}

export interface PwEvents {
  fetched: boolean;
  grabbed: boolean;
  paleFled: boolean;
  growl: { dx: number; dist: number } | null; // nearest stalking pale (spatial cue)
  heartbeat: number; // 0..1 dread level
  died: boolean;
  won: boolean;
}

export function stepPw(s: PwState, input: PwInput, dt: number, rng: Rng): PwEvents {
  const ev: PwEvents = { fetched: false, grabbed: false, paleFled: false, growl: null, heartbeat: 0, died: false, won: false };
  if (s.dead || s.won) return ev;
  const map = woodsMap();
  s.time += dt;
  s.grace = Math.max(0, s.grace - dt);
  s.fuel = Math.max(0, s.fuel - LANTERN.drainPerSec * dt);

  // ── Player ──
  const il = dhypot(input.moveX, input.moveY) || 1;
  const res = moveRect(map, { x: s.x - 11, y: s.y - 11, w: 22, h: 22 }, (input.moveX / il) * P_SPEED * dt, (input.moveY / il) * P_SPEED * dt);
  s.x = res.x + 11;
  s.y = res.y + 11;

  // ── Fuel cans ──
  for (let i = s.cans.length - 1; i >= 0; i--) {
    if (dhypot(s.cans[i].x - s.x, s.cans[i].y - s.y) < 26) {
      s.cans.splice(i, 1);
      s.fuel = Math.min(LANTERN.fuelMax, s.fuel + LANTERN.refuel);
      s.fetched++;
      ev.fetched = true;
    }
  }

  // ── Pales spawn from the treeline, more as the night deepens ──
  s.spawnT -= dt * (1 + s.time / 60);
  if (s.spawnT <= 0 && s.pales.length < PALE.cap) {
    s.spawnT = PALE.spawnEvery;
    const side = rng.int(4);
    const along = rng.float();
    const x = side === 0 ? 50 : side === 1 ? W - 50 : 60 + along * (W - 120);
    const y = side < 2 ? 60 + along * (H - 120) : side === 2 ? 50 : H - 60;
    s.pales.push({ x, y, state: 'stalk' });
  }

  // ── Pales: flee light, stalk darkness ──
  let nearest: Pale | null = null;
  let nd = Infinity;
  for (const p of s.pales) {
    const lit = inLight(s, p.x, p.y);
    const dx = s.x - p.x;
    const dy = s.y - p.y;
    const d = dhypot(dx, dy) || 1;
    // Pales are physical: they cannot pass through the trees (a Pale hiding
    // INSIDE a copse would be LOS-shadowed yet adjacent — an unfair ambush).
    const paleMove = (mx: number, my: number) => {
      const r = moveRect(map, { x: p.x - 10, y: p.y - 10, w: 20, h: 20 }, mx, my);
      p.x = r.x + 10;
      p.y = r.y + 10;
    };
    if (lit) {
      if (p.state !== 'flee') ev.paleFled = true;
      p.state = 'flee';
      paleMove((-dx / d) * PALE.fleeSpeed * dt, (-dy / d) * PALE.fleeSpeed * dt);
    } else {
      p.state = 'stalk';
      const ox = p.x;
      const oy = p.y;
      paleMove((dx / d) * PALE.speed * dt, (dy / d) * PALE.speed * dt);
      // Wedged against a copse: slide along it (perpendicular) instead.
      if (Math.abs(p.x - ox) + Math.abs(p.y - oy) < PALE.speed * dt * 0.25) {
        paleMove((-dy / d) * PALE.speed * dt, (dx / d) * PALE.speed * dt);
      }
      if (d < nd) {
        nd = d;
        nearest = p;
      }
      if (d < PALE.killDist && s.grace <= 0) {
        // A grab: the first wounds you and the Pale recoils; the second kills.
        s.wounds++;
        ev.grabbed = true;
        if (s.wounds >= 2) {
          s.dead = true;
          ev.died = true;
          return ev;
        }
        s.grace = 2.0;
        paleMove((-dx / d) * 240, (-dy / d) * 240); // recoil respects the trees
      }
    }
    p.x = Math.min(W - 40, Math.max(40, p.x));
    p.y = Math.min(H - 40, Math.max(40, p.y));
  }
  if (nearest) ev.growl = { dx: nearest.x - s.x, dist: nd };
  ev.heartbeat = Math.max(0, Math.min(1, 1 - nd / 500)) * (s.fuel <= 6 ? 1 : 0.7);

  // ── Dawn ──
  if (s.time >= DAWN_AT) {
    s.won = true;
    ev.won = true;
  }
  return ev;
}

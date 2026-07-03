// Emberwake horde sim — pure module. Hundreds of enemies + bullets stepped
// through the SpatialHash broad phase; auto-aim fire; kill-count level-ups
// with pick-1-of-3 upgrades; survive to dawn (120 sim-seconds).

import { SpatialHash, type Rng, type TilemapData, tilemapFromAscii, moveRect, dhypot, dcos, dsin, datan2 } from '@hayao';

export const TILE_SIZE = 32;
export const ARENA_W = 1280;
export const ARENA_H = 704;

// Open arena with four pillar clusters.
export const ARENA_ROWS: string[] = (() => {
  const B = '#'.repeat(40);
  const E = '#' + ' '.repeat(38) + '#';
  const P = (at: number[]) => {
    const row = Array(40).fill(' ');
    row[0] = '#';
    row[39] = '#';
    for (const c of at) row[c] = '#';
    return row.join('');
  };
  return [B, E, E, E, E, E, P([10, 11, 28, 29]), P([10, 11, 28, 29]), E, E, E, E, E, E, P([10, 11, 28, 29]), P([10, 11, 28, 29]), E, E, E, E, E, B];
})();

export const WIN_AT = 120; // sim-seconds survived = dawn
export const P_TUNE = { speed: 240, hp: 8, iframes: 0.7, radius: 12, fireRate: 2.5, dmg: 1, bulletSpeed: 520, bulletLife: 1.1, shots: 1 };
export const E_TUNE = {
  swarmer: { hp: 2, speed: 96, dmg: 1, radius: 12 },
  brute: { hp: 9, speed: 54, dmg: 2, radius: 20 },
} as const;
export const CAP_ALIVE = 360;

export interface Upgrade {
  id: string;
  label: string;
  apply(s: EwState): void;
}

export const UPGRADES: Upgrade[] = [
  { id: 'rate', label: 'Kindled fury (+45% fire rate)', apply: (s) => (s.fireRate *= 1.45) },
  { id: 'dmg', label: 'White heat (+1 damage)', apply: (s) => (s.dmg += 1) },
  { id: 'shots', label: 'Twin flame (+1 projectile)', apply: (s) => (s.shots += 1) },
  { id: 'speed', label: 'Windborne (+15% move speed)', apply: (s) => (s.speed *= 1.15) },
  { id: 'hp', label: 'Emberheart (+3 max hp, heal 3)', apply: (s) => ((s.maxHp += 3), (s.hp = Math.min(s.maxHp, s.hp + 3))) },
];

export interface Enemy {
  x: number;
  y: number;
  hp: number;
  kind: keyof typeof E_TUNE;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface EwState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  fireRate: number;
  dmg: number;
  shots: number;
  iframes: number;
  fireCd: number;
  time: number;
  kills: number;
  level: number;
  nextLevelAt: number;
  /** When non-null, the sim is paused on a level-up choice (indices into UPGRADES). */
  choice: number[] | null;
  enemies: Enemy[];
  bullets: Bullet[];
  spawnAcc: number;
  dead: boolean;
  won: boolean;
  [key: string]: unknown;
}

let _map: TilemapData | null = null;
export const arenaMap = (): TilemapData => (_map ??= tilemapFromAscii(ARENA_ROWS, TILE_SIZE));

export function initialEw(): EwState {
  return { x: 640, y: 352, hp: P_TUNE.hp, maxHp: P_TUNE.hp, speed: P_TUNE.speed, fireRate: P_TUNE.fireRate, dmg: P_TUNE.dmg, shots: P_TUNE.shots, iframes: 0, fireCd: 0, time: 0, kills: 0, level: 1, nextLevelAt: 10, choice: null, enemies: [], bullets: [], spawnAcc: 0, dead: false, won: false };
}

export interface EwInput {
  moveX: number;
  moveY: number;
  /** Level-up picks (justPressed): index 0-2 or -1. */
  pick: number;
}

export interface EwEvents {
  fired: boolean;
  kill: boolean;
  hurt: boolean;
  levelUp: boolean;
  died: boolean;
  won: boolean;
}

export const spawnRate = (t: number): number => 0.75 + (t * t) / 900; // enemies per second
export const bruteShare = (t: number): number => Math.min(0.45, t / 170);

export function stepEw(s: EwState, input: EwInput, dt: number, rng: Rng): EwEvents {
  const ev: EwEvents = { fired: false, kill: false, hurt: false, levelUp: false, died: false, won: false };
  if (s.dead || s.won) return ev;

  // Level-up choice pauses the night.
  if (s.choice) {
    if (input.pick >= 0 && input.pick < s.choice.length) {
      UPGRADES[s.choice[input.pick]].apply(s);
      s.choice = null;
    }
    return ev;
  }

  s.time += dt;
  s.iframes = Math.max(0, s.iframes - dt);
  s.fireCd = Math.max(0, s.fireCd - dt);
  const map = arenaMap();

  // ── Player movement ──
  const il = dhypot(input.moveX, input.moveY) || 1;
  const r = P_TUNE.radius;
  const res = moveRect(map, { x: s.x - r, y: s.y - r, w: r * 2, h: r * 2 }, (input.moveX / il) * s.speed * dt, (input.moveY / il) * s.speed * dt);
  s.x = res.x + r;
  s.y = res.y + r;

  // ── Spawns (arena edge, rng-driven) ──
  s.spawnAcc += spawnRate(s.time) * dt;
  while (s.spawnAcc >= 1 && s.enemies.length < CAP_ALIVE) {
    s.spawnAcc -= 1;
    const side = rng.int(4);
    const along = rng.float();
    const x = side === 0 ? 40 : side === 1 ? ARENA_W - 40 : 60 + along * (ARENA_W - 120);
    const y = side < 2 ? 60 + along * (ARENA_H - 120) : side === 2 ? 40 : ARENA_H - 40;
    const kind = rng.chance(bruteShare(s.time)) ? 'brute' : 'swarmer';
    s.enemies.push({ x, y, hp: E_TUNE[kind].hp, kind });
  }

  // ── Broad phase ──
  const hash = new SpatialHash<number>(64);
  s.enemies.forEach((e, i) => {
    const er = E_TUNE[e.kind].radius;
    hash.insert(i, { x: e.x - er, y: e.y - er, w: er * 2, h: er * 2 });
  });

  // ── Auto-fire at the nearest enemy ──
  if (s.fireCd <= 0 && s.enemies.length > 0) {
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < s.enemies.length; i++) {
      const e = s.enemies[i];
      const d = (e.x - s.x) * (e.x - s.x) + (e.y - s.y) * (e.y - s.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    const e = s.enemies[best];
    const baseA = datan2(e.y - s.y, e.x - s.x);
    for (let k = 0; k < s.shots; k++) {
      const a = baseA + (k - (s.shots - 1) / 2) * 0.16;
      s.bullets.push({ x: s.x, y: s.y, vx: dcos(a) * P_TUNE.bulletSpeed, vy: dsin(a) * P_TUNE.bulletSpeed, life: P_TUNE.bulletLife });
    }
    s.fireCd = 1 / s.fireRate;
    ev.fired = true;
  }

  // ── Bullets: move, hit via hash ──
  let bw = 0;
  for (const b of s.bullets) {
    b.life -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.life <= 0 || b.x < 16 || b.x > ARENA_W - 16 || b.y < 16 || b.y > ARENA_H - 16) continue;
    let hit = false;
    for (const i of hash.queryCircle(b.x, b.y, 4)) {
      const e = s.enemies[i];
      if (e.hp <= 0) continue;
      e.hp -= s.dmg;
      hit = true;
      if (e.hp <= 0) {
        s.kills++;
        ev.kill = true;
      }
      break;
    }
    if (!hit) s.bullets[bw++] = b;
  }
  s.bullets.length = bw;

  // ── Enemies: chase + soft separation + touch damage ──
  for (let i = 0; i < s.enemies.length; i++) {
    const e = s.enemies[i];
    if (e.hp <= 0) continue;
    const T = E_TUNE[e.kind];
    const dx = s.x - e.x;
    const dy = s.y - e.y;
    const d = dhypot(dx, dy) || 1;
    let mx = (dx / d) * T.speed;
    let my = (dy / d) * T.speed;
    // Separation: push away from ONE near neighbour (cheap, looks organic).
    for (const j of hash.queryCircle(e.x, e.y, T.radius + 6)) {
      if (j === i || s.enemies[j].hp <= 0) continue;
      const ox = e.x - s.enemies[j].x;
      const oy = e.y - s.enemies[j].y;
      const od = dhypot(ox, oy) || 1;
      mx += (ox / od) * 42;
      my += (oy / od) * 42;
      break;
    }
    e.x = Math.min(ARENA_W - 40, Math.max(40, e.x + mx * dt));
    e.y = Math.min(ARENA_H - 40, Math.max(40, e.y + my * dt));
    if (d < T.radius + P_TUNE.radius && s.iframes <= 0) {
      s.hp -= T.dmg;
      s.iframes = P_TUNE.iframes;
      ev.hurt = true;
    }
  }
  // Compact the dead.
  s.enemies = s.enemies.filter((e) => e.hp > 0);

  // ── Level-ups ──
  if (s.kills >= s.nextLevelAt) {
    s.level++;
    s.nextLevelAt = Math.ceil(s.nextLevelAt * 1.5) + 4;
    // Offer 3 distinct upgrades, rng-chosen.
    const pool = UPGRADES.map((_, i) => i);
    const offer: number[] = [];
    while (offer.length < 3) offer.push(pool.splice(rng.int(pool.length), 1)[0]);
    s.choice = offer;
    ev.levelUp = true;
  }

  // ── Death / dawn ──
  if (s.hp <= 0) {
    s.dead = true;
    ev.died = true;
  } else if (s.time >= WIN_AT) {
    s.won = true;
    ev.won = true;
  }
  return ev;
}

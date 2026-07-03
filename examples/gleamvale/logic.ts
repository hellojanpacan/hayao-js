// Gleamvale combat sim — a pure module. Player movement, sword arcs, enemy
// FSMs, orbs, doors, and room transitions are all plain-data state
// transitions, so the whole combat system is testable and bot-drivable in Node.

import { moveRect, tilemapFromAscii, asciiEntities, type SolidRect, type TilemapData, type Vec2 } from '@hayao';
import { DOOR_RECT, ROOMS } from './rooms';

export const TILE_SIZE = 32;
export const ROOM_W = 40 * TILE_SIZE;
export const ROOM_H = 22 * TILE_SIZE;

// ── Tuning ──
export const PLAYER = { speed: 260, accel: 2600, size: 22, hp: 3, iframes: 0.8, slashRange: 56, slashArc: Math.PI / 1.6, slashTime: 0.12, slashCd: 0.26, knockback: 340, hitstop: 5 };
export const ENEMY_TUNE = {
  chaser: { hp: 2, speed: 118, size: 24, touch: 24 },
  darter: { hp: 2, dashSpeed: 520, telegraph: 0.45, dashTime: 0.28, recover: 0.6, sight: 260, touch: 24 },
  sentry: { hp: 3, fireEvery: 1.6, orbSpeed: 190, sight: 430, touch: 26 },
} as const;

export type EnemyKind = 'chaser' | 'darter' | 'sentry';

export interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  /** FSM: chaser 'chase'; darter 'idle'|'telegraph'|'dash'|'recover'; sentry 'idle'. */
  state: string;
  t: number; // time in state
  dirX: number;
  dirY: number;
  hurt: number; // hit-flash timer
}

export interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface RoomState {
  enemies: Enemy[];
  cleared: boolean;
}

export interface GvState {
  room: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  faceX: number;
  faceY: number;
  hp: number;
  iframes: number;
  slashCd: number;
  slashing: number;
  hitstop: number;
  /** Attack pressed during hit-stop is buffered, not eaten (mash-friendly). */
  attackBuf: boolean;
  keys: number;
  doorOpen: boolean;
  keyOnGround: boolean;
  deaths: number;
  won: boolean;
  rooms: RoomState[];
  orbs: Orb[];
  [key: string]: unknown;
}

export interface ParsedRoom {
  name: string;
  map: TilemapData;
  spawn: Vec2 | null;
  heart: Vec2 | null;
  enemies: Enemy[];
}

const cache: ParsedRoom[] = [];
export function parseRoom(i: number): ParsedRoom {
  if (cache[i]) return cache[i];
  const def = ROOMS[i];
  const map = tilemapFromAscii(def.rows, TILE_SIZE);
  const ents = asciiEntities(def.rows, TILE_SIZE);
  const enemies: Enemy[] = [];
  let spawn: Vec2 | null = null;
  let heart: Vec2 | null = null;
  for (const e of ents) {
    if (e.char === '@') spawn = { x: e.x, y: e.y };
    else if (e.char === 'H') heart = { x: e.x, y: e.y };
    else if (e.char === 'c') enemies.push(makeEnemy('chaser', e.x, e.y));
    else if (e.char === 'd') enemies.push(makeEnemy('darter', e.x, e.y));
    else if (e.char === 's') enemies.push(makeEnemy('sentry', e.x, e.y));
  }
  cache[i] = { name: def.name, map, spawn, heart, enemies };
  return cache[i];
}

export function makeEnemy(kind: EnemyKind, x: number, y: number): Enemy {
  const hp = kind === 'chaser' ? ENEMY_TUNE.chaser.hp : kind === 'darter' ? ENEMY_TUNE.darter.hp : ENEMY_TUNE.sentry.hp;
  return { kind, x, y, hp, state: kind === 'chaser' ? 'chase' : 'idle', t: 0, dirX: 0, dirY: 0, hurt: 0 };
}

export function initialGv(): GvState {
  const spawn = parseRoom(0).spawn!;
  return {
    room: 0, x: spawn.x, y: spawn.y, vx: 0, vy: 0, faceX: 1, faceY: 0,
    hp: PLAYER.hp, iframes: 0, slashCd: 0, slashing: 0, hitstop: 0, attackBuf: false,
    keys: 0, doorOpen: false, keyOnGround: false, deaths: 0, won: false,
    rooms: ROOMS.map((_, i) => ({ enemies: parseRoom(i).enemies.map((e) => ({ ...e })), cleared: false })),
    orbs: [],
  };
}

/** The key drop position (Barrow Pit centre) and door interaction radius. */
export const KEY_AT: Vec2 = { x: 640, y: 352 };
export const DOOR_TOUCH = 60;

export const doorSolids = (s: GvState, room: number): SolidRect[] => {
  if (s.doorOpen) return [];
  if (room === 1) return [DOOR_RECT];
  if (room === 3) return [{ ...DOOR_RECT, y: -DOOR_RECT.h + TILE_SIZE }]; // top-side mirror
  return [];
};

export interface StepInput {
  moveX: number;
  moveY: number;
  attack: boolean; // justPressed
}

export interface StepEvents {
  slashed: boolean;
  hitEnemy: boolean;
  killedEnemy: boolean;
  playerHurt: boolean;
  died: boolean;
  pickedKey: boolean;
  openedDoor: boolean;
  cleared: boolean;
  won: boolean;
  transitioned: boolean;
}

const approach = (v: number, t: number, d: number) => (v < t ? Math.min(v + d, t) : Math.max(v - d, t));
const len = (x: number, y: number) => Math.hypot(x, y) || 1;

/** Advance the whole combat sim one fixed step. Mutates s; returns events. */
export function stepGv(s: GvState, input: StepInput, dt: number): StepEvents {
  const ev: StepEvents = { slashed: false, hitEnemy: false, killedEnemy: false, playerHurt: false, died: false, pickedKey: false, openedDoor: false, cleared: false, won: false, transitioned: false };
  if (s.won) return ev;
  const room = parseRoom(s.room);
  const rs = s.rooms[s.room];
  const solids = doorSolids(s, s.room);

  // Hit-stop freezes the world for a few frames after a solid hit. Attack
  // presses during the freeze are buffered — eating mashed inputs feels awful.
  if (s.hitstop > 0) {
    if (input.attack) s.attackBuf = true;
    s.hitstop--;
    return ev;
  }
  const attack = input.attack || s.attackBuf;
  s.attackBuf = false;

  // ── Timers ──
  s.iframes = Math.max(0, s.iframes - dt);
  s.slashCd = Math.max(0, s.slashCd - dt);
  s.slashing = Math.max(0, s.slashing - dt);

  // ── Player movement ──
  const il = input.moveX || input.moveY ? len(input.moveX, input.moveY) : 1;
  s.vx = approach(s.vx, (input.moveX / il) * PLAYER.speed, PLAYER.accel * dt);
  s.vy = approach(s.vy, (input.moveY / il) * PLAYER.speed, PLAYER.accel * dt);
  if (input.moveX || input.moveY) {
    s.faceX = input.moveX / il;
    s.faceY = input.moveY / il;
  }
  const half = PLAYER.size / 2;
  const res = moveRect(room.map, { x: s.x - half, y: s.y - half, w: PLAYER.size, h: PLAYER.size }, s.vx * dt, s.vy * dt, { solids });
  s.x = res.x + half;
  s.y = res.y + half;
  if (res.hitX) s.vx = 0;
  if (res.hitY) s.vy = 0;

  // ── Sword ──
  if (attack && s.slashCd <= 0) {
    s.slashing = PLAYER.slashTime;
    s.slashCd = PLAYER.slashCd;
    ev.slashed = true;
  }
  if (s.slashing > 0) {
    for (const e of rs.enemies) {
      if (e.hp <= 0 || e.hurt > 0) continue;
      const dx = e.x - s.x;
      const dy = e.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d > PLAYER.slashRange + 12) continue;
      const dot = (dx * s.faceX + dy * s.faceY) / (d || 1);
      if (dot < Math.cos(PLAYER.slashArc / 2)) continue;
      e.hp--;
      e.hurt = 0.22;
      e.x += (dx / (d || 1)) * 26;
      e.y += (dy / (d || 1)) * 26;
      s.hitstop = PLAYER.hitstop;
      ev.hitEnemy = true;
      if (e.hp <= 0) ev.killedEnemy = true;
    }
  }

  // ── Enemies ──
  for (const e of rs.enemies) {
    if (e.hp <= 0) continue;
    e.hurt = Math.max(0, e.hurt - dt);
    e.t += dt;
    const dx = s.x - e.x;
    const dy = s.y - e.y;
    const d = len(dx, dy);
    if (e.kind === 'chaser') {
      const sp = ENEMY_TUNE.chaser.speed;
      const m = moveRect(room.map, { x: e.x - 12, y: e.y - 12, w: 24, h: 24 }, (dx / d) * sp * dt, (dy / d) * sp * dt, { solids });
      e.x = m.x + 12;
      e.y = m.y + 12;
    } else if (e.kind === 'darter') {
      const T = ENEMY_TUNE.darter;
      if (e.state === 'idle') {
        if (d < T.sight) {
          e.state = 'telegraph';
          e.t = 0;
        }
      } else if (e.state === 'telegraph') {
        if (e.t >= T.telegraph) {
          e.state = 'dash';
          e.t = 0;
          e.dirX = dx / d;
          e.dirY = dy / d;
        }
      } else if (e.state === 'dash') {
        const m = moveRect(room.map, { x: e.x - 12, y: e.y - 12, w: 24, h: 24 }, e.dirX * T.dashSpeed * dt, e.dirY * T.dashSpeed * dt, { solids });
        e.x = m.x + 12;
        e.y = m.y + 12;
        if (e.t >= T.dashTime || m.hitX || m.hitY) {
          e.state = 'recover';
          e.t = 0;
        }
      } else if (e.t >= T.recover) e.state = 'idle';
    } else {
      // sentry: fire at intervals when in sight.
      const T = ENEMY_TUNE.sentry;
      if (d < T.sight && e.t >= T.fireEvery) {
        e.t = 0;
        s.orbs.push({ x: e.x, y: e.y, vx: (dx / d) * T.orbSpeed, vy: (dy / d) * T.orbSpeed });
      }
    }
    // Contact damage.
    const touch = ENEMY_TUNE[e.kind].touch;
    if (d < touch && s.iframes <= 0) hurtPlayer(s, ev, dx / d, dy / d);
  }

  // ── Orbs ──
  let w = 0;
  for (const o of s.orbs) {
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    const dx = s.x - o.x;
    const dy = s.y - o.y;
    if (Math.hypot(dx, dy) < 18 && s.iframes <= 0) {
      hurtPlayer(s, ev, dx / len(dx, dy), dy / len(dx, dy));
      continue; // orb consumed
    }
    if (o.x < 0 || o.x > ROOM_W || o.y < 0 || o.y > ROOM_H) continue;
    const tx = Math.floor(o.x / TILE_SIZE);
    const ty = Math.floor(o.y / TILE_SIZE);
    if (room.map.tiles[ty * room.map.cols + tx] === 1) continue; // hit a wall
    s.orbs[w++] = o;
  }
  s.orbs.length = w;

  // ── Death / clear / pickups / win ──
  if (s.hp <= 0) {
    ev.died = true;
    s.deaths++;
    const spawn = parseRoom(0).spawn!;
    Object.assign(s, { room: 0, x: spawn.x, y: spawn.y, vx: 0, vy: 0, hp: PLAYER.hp, iframes: 1.2, orbs: [] });
    return ev;
  }
  if (!rs.cleared && rs.enemies.every((e) => e.hp <= 0)) {
    rs.cleared = true;
    ev.cleared = true;
    if (s.room === 2) s.keyOnGround = true;
  }
  if (s.keyOnGround && s.room === 2 && Math.hypot(s.x - KEY_AT.x, s.y - KEY_AT.y) < 30) {
    s.keyOnGround = false;
    s.keys++;
    ev.pickedKey = true;
  }
  if (!s.doorOpen && s.keys > 0 && s.room === 1 && Math.hypot(s.x - (DOOR_RECT.x + 32), s.y - (DOOR_RECT.y + 16)) < DOOR_TOUCH) {
    s.keys--;
    s.doorOpen = true;
    ev.openedDoor = true;
  }
  if (room.heart && Math.hypot(s.x - room.heart.x, s.y - room.heart.y) < 30) {
    s.won = true;
    ev.won = true;
    return ev;
  }

  // ── Room transitions (thresholds inside the border; see sproutveil lesson) ──
  const exits = ROOMS[s.room].exits;
  let moved: { room: number; x: number; y: number } | null = null;
  if (s.x < 16 && exits.left !== undefined) moved = { room: exits.left, x: ROOM_W - 30, y: s.y };
  else if (s.x > ROOM_W - 16 && exits.right !== undefined) moved = { room: exits.right, x: 30, y: s.y };
  else if (s.y < 16 && exits.up !== undefined) moved = { room: exits.up, x: s.x, y: ROOM_H - 30 };
  else if (s.y > ROOM_H - 16 && exits.down !== undefined) moved = { room: exits.down, x: s.x, y: 30 };
  if (moved) {
    s.room = moved.room;
    s.x = moved.x;
    s.y = moved.y;
    s.orbs = [];
    ev.transitioned = true;
  }
  return ev;
}

function hurtPlayer(s: GvState, ev: StepEvents, kx: number, ky: number): void {
  s.hp--;
  s.iframes = PLAYER.iframes;
  s.vx = kx * PLAYER.knockback;
  s.vy = ky * PLAYER.knockback;
  s.hitstop = PLAYER.hitstop;
  ev.playerHurt = true;
}

export { ROOMS, DOOR_RECT };

// Combat — pure sim for the Mender's gold-blade and the grief-hardened things
// that guard the seams. Data-driven enemies with tiny FSMs (husk chases, mote
// telegraphs then darts, sentry fires motes of grief), a swept melee hitbox with
// hit-stop + knockback, and i-framed contact damage. All plain data → hashes and
// saves. Feel is tuned for READABLE, satisfying hits: a wind-up, a freeze on
// contact, a shove, and a flash.

import { moveRect, dhypot, dsin, type TilemapData } from '@hayao';

export type EnemyKind = 'husk' | 'mote' | 'sentry';

export interface EnemyState {
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  st: string; // FSM state
  t: number; // time in state
  face: number; // -1 | 1
  hurt: number; // hit-flash timer
}

export interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Tune {
  hp: number;
  w: number;
  h: number;
  speed: number;
  sight: number;
  dmg: number;
}

export const ETUNE: Record<EnemyKind, Tune> = {
  husk: { hp: 3, w: 26, h: 30, speed: 96, sight: 460, dmg: 1 },
  mote: { hp: 2, w: 24, h: 24, speed: 300, sight: 320, dmg: 1 },
  sentry: { hp: 4, w: 30, h: 34, speed: 0, sight: 420, dmg: 1 },
};

export const GRAVITY = 2200;
export const ATTACK_TIME = 0.3; // total swing
const ATTACK_ACTIVE = [0.08, 0.22]; // window (s from start) the blade bites
export const ATTACK_DMG = 1;
export const ATTACK_RANGE = 46;
export const HITSTOP = 5; // frames frozen on a landed hit
export const IFRAMES = 0.9; // seconds after taking a hit
export const PLAYER_KNOCK = 260;
export const ENEMY_KNOCK = 300;

export function spawnEnemy(kind: EnemyKind, x: number, y: number): EnemyState {
  const t = ETUNE[kind];
  return { kind, x, y, w: t.w, h: t.h, vx: 0, vy: 0, hp: t.hp, maxHp: t.hp, st: 'idle', t: 0, face: -1, hurt: 0 };
}

const dist = (ax: number, ay: number, bx: number, by: number): number => dhypot(ax - bx, ay - by);

/** The Mender's melee hitbox during the active swing window, else null. */
export function attackHitbox(px: number, py: number, pw: number, ph: number, face: number, atk: number): { x: number; y: number; w: number; h: number } | null {
  const elapsed = ATTACK_TIME - atk; // atk counts DOWN from ATTACK_TIME
  if (elapsed < ATTACK_ACTIVE[0] || elapsed > ATTACK_ACTIVE[1]) return null;
  const cx = px + pw / 2;
  const cy = py + ph / 2;
  return { x: face < 0 ? cx - ATTACK_RANGE : cx, y: cy - ATTACK_RANGE * 0.7, w: ATTACK_RANGE, h: ATTACK_RANGE * 1.4 };
}

const rectsOverlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export interface AttackResult {
  hits: number;
  killed: number;
}

/** Resolve a swing against the enemy list — damage, knockback, flash. */
export function resolvePlayerAttack(box: { x: number; y: number; w: number; h: number }, playerCx: number, enemies: EnemyState[]): AttackResult {
  let hits = 0;
  let killed = 0;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    if (rectsOverlap(box, e)) {
      e.hp -= ATTACK_DMG;
      e.hurt = 0.22;
      const dir = e.x + e.w / 2 < playerCx ? -1 : 1;
      e.vx += dir * ENEMY_KNOCK;
      e.vy -= 120;
      hits += 1;
      if (e.hp <= 0) killed += 1;
    }
  }
  return { hits, killed };
}

export interface EnemyStepResult {
  /** Damage dealt to the player this step (0 if none / i-framed away by caller). */
  playerDmg: number;
  /** Direction to knock the player, if damaged. */
  knockDir: number;
}

/**
 * Advance all enemies + orbs one step. Enemies chase/telegraph/fire; contact and
 * orb hits accumulate into `playerDmg` (the caller applies it respecting iframes).
 */
export function stepEnemies(
  enemies: EnemyState[],
  orbs: Orb[],
  px: number,
  py: number,
  pw: number,
  ph: number,
  dt: number,
  map: TilemapData,
): EnemyStepResult {
  const pcx = px + pw / 2;
  const pcy = py + ph / 2;
  let playerDmg = 0;
  let knockDir = 1;
  const pbox = { x: px, y: py, w: pw, h: ph };

  for (const e of enemies) {
    if (e.hp <= 0) continue;
    if (e.hurt > 0) e.hurt = Math.max(0, e.hurt - dt);
    e.t += dt;
    const t = ETUNE[e.kind];
    const ex = e.x + e.w / 2;
    const ey = e.y + e.h / 2;
    const d = dist(ex, ey, pcx, pcy);
    e.face = pcx < ex ? -1 : 1;

    if (e.kind === 'husk') {
      // grief-hardened crawler: chase on the ground
      const chase = d < t.sight ? e.face * t.speed : 0;
      e.vx += (chase - e.vx) * Math.min(1, dt * 6);
      e.vy = Math.min(600, e.vy + GRAVITY * dt);
      const mv = moveRect(map, { x: e.x, y: e.y, w: e.w, h: e.h }, e.vx * dt, e.vy * dt, {});
      e.x = mv.x;
      e.y = mv.y;
      if (mv.onFloor) e.vy = 0;
      if (mv.hitX) e.vx = 0;
    } else if (e.kind === 'mote') {
      // floats, telegraphs, then darts through the Mender
      if (e.st === 'idle') {
        e.vx *= 0.9;
        e.vy = dsin(e.t * 3) * 30;
        if (d < t.sight) { e.st = 'tell'; e.t = 0; }
      } else if (e.st === 'tell') {
        e.vx *= 0.8;
        e.vy *= 0.8;
        if (e.t > 0.45) {
          const dx = pcx - ex;
          const dy = pcy - ey;
          const n = Math.max(1, dhypot(dx, dy));
          e.vx = (dx / n) * t.speed;
          e.vy = (dy / n) * t.speed;
          e.st = 'dart';
          e.t = 0;
        }
      } else if (e.st === 'dart') {
        if (e.t > 0.35) { e.st = 'idle'; e.t = 0; }
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'sentry') {
      // stationary; fires an orb of grief on an interval when it sees you
      e.vy = Math.min(600, e.vy + GRAVITY * dt);
      const mv = moveRect(map, { x: e.x, y: e.y, w: e.w, h: e.h }, 0, e.vy * dt, {});
      e.y = mv.y;
      if (mv.onFloor) e.vy = 0;
      if (d < t.sight && e.t > 1.6) {
        e.t = 0;
        const dx = pcx - ex;
        const dy = pcy - ey;
        const n = Math.max(1, dhypot(dx, dy));
        orbs.push({ x: ex, y: ey, vx: (dx / n) * 220, vy: (dy / n) * 220, life: 4 });
      }
    }

    if (rectsOverlap(pbox, e)) {
      playerDmg += t.dmg;
      knockDir = pcx < ex ? -1 : 1;
    }
  }

  // orbs
  for (const o of orbs) {
    o.life -= dt;
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    if (rectsOverlap(pbox, { x: o.x - 7, y: o.y - 7, w: 14, h: 14 })) {
      playerDmg += 1;
      knockDir = o.vx < 0 ? -1 : 1;
      o.life = 0;
    }
  }
  // cull dead
  for (let i = orbs.length - 1; i >= 0; i--) if (orbs[i].life <= 0) orbs.splice(i, 1);

  return { playerDmg, knockDir };
}

// Guardians — the four grief-hardened bosses that seal each biome's shrine. One
// multi-phase FSM (move → telegraph → attack → recover) escalates as HP falls:
// faster tells, denser volleys, added lunges. Per-boss tuning gives each its
// character (the Bell's tolling rings, the Warden's heavy lunge, the Gale's
// darts, the Grief's everything). Pure data; orbs share the combat pool.

import { moveRect, datan2, dcos, dsin, type TilemapData } from '@hayao';
import { type Orb, type EnemyState } from './combat';

export type BossId = 'drowned_bell' | 'cinder_warden' | 'gale' | 'grief';

export interface BossState {
  id: BossId;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  phase: number; // 0..2
  st: string; // move | tell | attack | recover
  t: number;
  face: number;
  hurt: number;
  flies: boolean;
  dead: boolean;
}

interface BossTune {
  hp: number;
  w: number;
  h: number;
  speed: number;
  flies: boolean;
  ring: boolean; // fire a full ring vs an aimed spread
  contact: number;
}

export const BOSS_TUNE: Record<BossId, BossTune> = {
  drowned_bell: { hp: 12, w: 56, h: 60, speed: 70, flies: false, ring: true, contact: 1 },
  cinder_warden: { hp: 16, w: 60, h: 66, speed: 120, flies: false, ring: false, contact: 1 },
  gale: { hp: 14, w: 50, h: 54, speed: 260, flies: true, ring: false, contact: 1 },
  grief: { hp: 22, w: 64, h: 72, speed: 150, flies: true, ring: true, contact: 1 },
};

/** Which boss guards each arena room, and which exit it seals until slain. */
export const GUARDIAN_OF: Record<string, BossId> = {
  cistern_bell: 'drowned_bell',
  ember_warden: 'cinder_warden',
  sky_gale: 'gale',
  heart_grief: 'grief',
};

const GRAVITY = 2200;

export function spawnBoss(id: BossId, x: number, y: number): BossState {
  const t = BOSS_TUNE[id];
  return { id, x, y, w: t.w, h: t.h, vx: 0, vy: 0, hp: t.hp, maxHp: t.hp, phase: 0, st: 'move', t: 0, face: -1, hurt: 0, flies: t.flies, dead: false };
}

const rectsOverlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** A player swing that overlaps the boss: damage + knock + flash. Returns hits. */
export function resolveBossHit(box: { x: number; y: number; w: number; h: number } | null, playerCx: number, b: BossState): number {
  if (!box || b.hp <= 0) return 0;
  if (!rectsOverlap(box, b)) return 0;
  b.hp -= 1;
  b.hurt = 0.18;
  b.vx += (b.x + b.w / 2 < playerCx ? -1 : 1) * 90;
  if (b.hp <= 0) b.dead = true;
  return 1;
}

export interface BossStepResult {
  playerDmg: number;
  knockDir: number;
}

/** Advance the boss one step: FSM + phase escalation + attacks into `orbs`. */
export function stepBoss(b: BossState, orbs: Orb[], px: number, py: number, pw: number, ph: number, dt: number, map: TilemapData): BossStepResult {
  const t = BOSS_TUNE[b.id];
  if (b.hurt > 0) b.hurt = Math.max(0, b.hurt - dt);
  b.phase = b.hp > b.maxHp * 0.66 ? 0 : b.hp > b.maxHp * 0.33 ? 1 : 2;
  b.t += dt;
  const rate = 1 + b.phase * 0.6; // everything speeds up as it weakens
  const pcx = px + pw / 2;
  const pcy = py + ph / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  b.face = pcx < bcx ? -1 : 1;

  let playerDmg = 0;
  let knockDir = 1;

  switch (b.st) {
    case 'move': {
      const toward = b.face * t.speed;
      b.vx += (toward - b.vx) * Math.min(1, dt * 3);
      if (b.flies) {
        const targetY = pcy - 40;
        b.vy += (Math.max(-140, Math.min(140, (targetY - bcy) * 2)) - b.vy) * Math.min(1, dt * 3);
      }
      if (b.t > 1.1 / rate) {
        b.st = 'tell';
        b.t = 0;
      }
      break;
    }
    case 'tell': {
      b.vx *= 0.86;
      b.vy *= 0.86;
      if (b.t > 0.5 / rate) {
        b.st = 'attack';
        b.t = 0;
        fireVolley(b, orbs, pcx, pcy, t);
        if (!t.ring) b.vx = b.face * (t.speed + 120 + b.phase * 90); // lunge
      }
      break;
    }
    case 'attack': {
      if (b.t > 0.35) {
        b.st = 'recover';
        b.t = 0;
      }
      break;
    }
    default: {
      // recover
      b.vx *= 0.9;
      if (b.t > 0.6 / rate) {
        b.st = 'move';
        b.t = 0;
      }
    }
  }

  // integrate
  if (b.flies) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  } else {
    b.vy = Math.min(640, b.vy + GRAVITY * dt);
    const mv = moveRect(map, { x: b.x, y: b.y, w: b.w, h: b.h }, b.vx * dt, b.vy * dt, {});
    b.x = mv.x;
    b.y = mv.y;
    if (mv.onFloor) b.vy = 0;
    if (mv.hitX) b.vx = 0;
  }

  if (rectsOverlap({ x: px, y: py, w: pw, h: ph }, b)) {
    playerDmg = t.contact;
    knockDir = pcx < bcx ? -1 : 1;
  }
  return { playerDmg, knockDir };
}

function fireVolley(b: BossState, orbs: Orb[], pcx: number, pcy: number, t: BossTune): void {
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const speed = 200 + b.phase * 60;
  if (t.ring) {
    const n = 8 + b.phase * 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      orbs.push({ x: bcx, y: bcy, vx: dcos(a) * speed, vy: dsin(a) * speed, life: 4 });
    }
  } else {
    const spread = 3 + b.phase * 2;
    const dx = pcx - bcx;
    const dy = pcy - bcy;
    const base = datan2(dy, dx);
    for (let i = 0; i < spread; i++) {
      const a = base + (i - (spread - 1) / 2) * 0.18;
      orbs.push({ x: bcx, y: bcy, vx: dcos(a) * speed, vy: dsin(a) * speed, life: 4 });
    }
  }
}

/** Convert a boss to the enemy-shaped record the view already knows how to draw. */
export function bossAsEnemy(b: BossState): EnemyState {
  return { kind: 'sentry', x: b.x, y: b.y, w: b.w, h: b.h, vx: b.vx, vy: b.vy, hp: b.hp, maxHp: b.maxHp, st: b.st, t: b.t, face: b.face, hurt: b.hurt };
}

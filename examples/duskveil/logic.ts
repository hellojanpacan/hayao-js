// Duskveil bullet-hell sim — pure module. A three-phase boss fires patterns
// from a tiny declarative DSL (ring / fan / rain); the player dodges with a
// 5px hitbox, grazes for glory, and whittles the veil down. The stress: over
// a thousand live bullets in a deterministic, replayable sim.

import { dhypot, dcos, dsin, datan2 } from '@hayao';
import type { Rng } from '@hayao';

export const W = 1280;
export const H = 704;

export const P_TUNE = { speed: 300, slowSpeed: 150, hitbox: 5, graze: 26, lives: 3, invuln: 2.2, fireRate: 9, shotDmg: 3, shotSpeed: 720, clearRadius: 220 };
export const BULLET_CAP = 1600;

// ── Pattern DSL ──
export interface Emitter {
  kind: 'ring' | 'fan' | 'rain';
  every: number; // seconds between volleys
  count: number;
  speed: number;
  /** ring: radians the base angle advances per volley (spiral). */
  spin?: number;
  /** fan: full arc width (radians), aimed at the player. */
  arc?: number;
}

export interface Phase {
  hp: number;
  emitters: Emitter[];
}

export const PHASES: Phase[] = [
  {
    hp: 200,
    emitters: [
      { kind: 'ring', every: 1.3, count: 22, speed: 120, spin: 0.35 },
      { kind: 'fan', every: 1.0, count: 5, speed: 190, arc: 0.55 },
    ],
  },
  {
    hp: 260,
    emitters: [
      { kind: 'ring', every: 0.5, count: 18, speed: 140, spin: 0.9 },
      { kind: 'fan', every: 1.4, count: 7, speed: 210, arc: 0.8 },
      { kind: 'rain', every: 0.5, count: 3, speed: 160 },
    ],
  },
  {
    hp: 320,
    emitters: [
      { kind: 'ring', every: 0.62, count: 32, speed: 150, spin: -0.6 },
      { kind: 'ring', every: 0.62, count: 32, speed: 105, spin: 0.6 },
      { kind: 'fan', every: 1.1, count: 9, speed: 240, arc: 1.0 },
    ],
  },
];

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Already grazed (count once). */
  grazed: boolean;
}

export interface DvState {
  x: number;
  y: number;
  lives: number;
  invuln: number;
  fireCd: number;
  graze: number;
  time: number;
  phase: number; // index into PHASES; PHASES.length = victory
  bossHp: number;
  bossX: number;
  bossY: number;
  phaseT: number;
  timers: number[]; // per-emitter accumulators
  bullets: Bullet[];
  shots: { x: number; y: number }[];
  deaths: number;
  dead: boolean;
  won: boolean;
  [key: string]: unknown;
}

export function initialDv(): DvState {
  return { x: W / 2, y: H - 90, lives: P_TUNE.lives, invuln: 0, fireCd: 0, graze: 0, time: 0, phase: 0, bossHp: PHASES[0].hp, bossX: W / 2, bossY: 120, phaseT: 0, timers: PHASES[0].emitters.map(() => 0), bullets: [], shots: [], deaths: 0, dead: false, won: false };
}

export interface DvInput {
  moveX: number;
  moveY: number;
  slow: boolean;
}

export interface DvEvents {
  hit: boolean; // player lost a life
  grazed: boolean;
  phaseDown: boolean;
  won: boolean;
  died: boolean;
}

export function stepDv(s: DvState, input: DvInput, dt: number, rng: Rng): DvEvents {
  const ev: DvEvents = { hit: false, grazed: false, phaseDown: false, won: false, died: false };
  if (s.dead || s.won) return ev;
  s.time += dt;
  s.phaseT += dt;
  s.invuln = Math.max(0, s.invuln - dt);
  s.fireCd = Math.max(0, s.fireCd - dt);

  // ── Player ──
  const il = dhypot(input.moveX, input.moveY) || 1;
  const sp = input.slow ? P_TUNE.slowSpeed : P_TUNE.speed;
  // Clamp includes the SHIP'S EXTENTS (poly spans -14..+12): the whole craft
  // stays on the playfield — no sinking out of view at the rim.
  s.x = Math.min(W - 30, Math.max(30, s.x + (input.moveX / il) * sp * dt));
  s.y = Math.min(H - 34, Math.max(32, s.y + (input.moveY / il) * sp * dt));

  // Auto-fire upward.
  if (s.fireCd <= 0) {
    s.shots.push({ x: s.x - 8, y: s.y - 14 }, { x: s.x + 8, y: s.y - 14 });
    s.fireCd = 1 / P_TUNE.fireRate;
  }

  // ── Boss sway + patterns ──
  s.bossX = W / 2 + dsin(s.time * 0.42) * 330;
  const phase = PHASES[s.phase];
  phase.emitters.forEach((em, i) => {
    s.timers[i] += dt;
    while (s.timers[i] >= em.every) {
      s.timers[i] -= em.every;
      if (s.bullets.length > BULLET_CAP - em.count) break;
      if (em.kind === 'ring') {
        const base = (em.spin ?? 0) * s.phaseT * 6;
        for (let k = 0; k < em.count; k++) {
          const a = base + (k / em.count) * Math.PI * 2;
          s.bullets.push({ x: s.bossX, y: s.bossY, vx: dcos(a) * em.speed, vy: dsin(a) * em.speed, grazed: false });
        }
      } else if (em.kind === 'fan') {
        const aim = datan2(s.y - s.bossY, s.x - s.bossX);
        for (let k = 0; k < em.count; k++) {
          const a = aim + (k / (em.count - 1) - 0.5) * (em.arc ?? 0.6);
          s.bullets.push({ x: s.bossX, y: s.bossY, vx: dcos(a) * em.speed, vy: dsin(a) * em.speed, grazed: false });
        }
      } else {
        for (let k = 0; k < em.count; k++) {
          s.bullets.push({ x: 40 + rng.float() * (W - 80), y: 20, vx: (rng.float() - 0.5) * 40, vy: em.speed, grazed: false });
        }
      }
    }
  });

  // ── Player shots vs boss ──
  let sw = 0;
  let phaseDown = false;
  for (const sh of s.shots) {
    sh.y -= P_TUNE.shotSpeed * dt;
    if (sh.y < 0) continue;
    if (Math.abs(sh.x - s.bossX) < 62 && Math.abs(sh.y - s.bossY) < 44) {
      s.bossHp -= P_TUNE.shotDmg;
      if (s.bossHp <= 0 && !phaseDown) phaseDown = true;
      continue;
    }
    s.shots[sw++] = sh;
  }
  s.shots.length = sw;
  if (phaseDown) {
    s.phase++;
    s.phaseT = 0;
    s.bullets = []; // phase transition mercy-clear
    ev.phaseDown = true;
    if (s.phase >= PHASES.length) {
      s.won = true;
      ev.won = true;
      return ev;
    }
    s.bossHp = PHASES[s.phase].hp;
    s.timers = PHASES[s.phase].emitters.map(() => 0);
  }

  // ── Bullets vs player (hit + graze) ──
  let bw = 0;
  for (const b of s.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) continue;
    const dx = b.x - s.x;
    const dy = b.y - s.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < (P_TUNE.hitbox + 4) * (P_TUNE.hitbox + 4) && s.invuln <= 0) {
      s.lives--;
      s.deaths++;
      s.invuln = P_TUNE.invuln;
      ev.hit = true;
      if (s.lives < 0) {
        s.dead = true;
        ev.died = true;
        return ev;
      }
      // Mercy: clear the neighbourhood so respawn isn't instant death.
      s.bullets = s.bullets.filter((o) => (o.x - s.x) * (o.x - s.x) + (o.y - s.y) * (o.y - s.y) > P_TUNE.clearRadius * P_TUNE.clearRadius);
      return ev;
    }
    if (!b.grazed && d2 < P_TUNE.graze * P_TUNE.graze) {
      b.grazed = true;
      s.graze++;
      ev.grazed = true;
    }
    s.bullets[bw++] = b;
  }
  s.bullets.length = bw;
  return ev;
}

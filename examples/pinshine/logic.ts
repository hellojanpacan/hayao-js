// Pinshine physics sim — pure module. A Peggle-ish board: aim, launch, and
// watch the ball carom through pegs under gravity. Collisions are SWEPT
// (circle-vs-circle time-of-impact inside each substep), so even a screaming
// ball never tunnels — continuous collision as closed-form arithmetic.

import { dcos, dsin } from '@hayao';
export const W = 1280;
export const H = 704;
export const BALL_R = 8;
export const PEG_R = 11;
export const GRAVITY = 640;
export const RESTITUTION = 0.86;
export const LAUNCH_SPEED = 620;
export const LAUNCH_Y = 40;
export const BALLS = 8;
export const SUBSTEPS = 4;
export const BUCKET = { w: 130, h: 22, y: H - 26, speed: 160 };

export interface Peg {
  x: number;
  y: number;
  orange: boolean;
  lit: boolean;
}

/** A diamond lattice with an orange ring — fixed layout, physics is the star. */
export function makePegs(): Peg[] {
  const pegs: Peg[] = [];
  for (let row = 0; row < 7; row++) {
    const n = row % 2 === 0 ? 10 : 9;
    for (let i = 0; i < n; i++) {
      const x = 140 + i * 110 + (row % 2 ? 55 : 0);
      const y = 170 + row * 68;
      pegs.push({ x, y, orange: false, lit: false });
    }
  }
  // Orange ring: every 6th peg plus the low centre arc.
  const oranges = [4, 11, 18, 23, 29, 34, 41, 47, 52, 58];
  for (const i of oranges) if (pegs[i]) pegs[i].orange = true;
  return pegs;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PsState {
  pegs: Peg[];
  ball: Ball | null;
  ballsLeft: number;
  aim: number; // radians from straight down (-1.2..1.2)
  bucketX: number;
  bucketDir: number;
  score: number;
  caught: number;
  time: number;
  won: boolean;
  dead: boolean;
  [key: string]: unknown;
}

export function initialPs(): PsState {
  return { pegs: makePegs(), ball: null, ballsLeft: BALLS, aim: 0, bucketX: W / 2, bucketDir: 1, score: 0, caught: 0, time: 0, won: false, dead: false };
}

/**
 * Swept circle-vs-circle: earliest t in [0, dt] where |(p + v·t) − c| = R.
 * Solves the quadratic |v|²t² + 2(d·v)t + |d|² − R² = 0. Null = no hit.
 */
export function sweptCircleHit(px: number, py: number, vx: number, vy: number, cx: number, cy: number, R: number, dt: number): number | null {
  const dx = px - cx;
  const dy = py - cy;
  const a = vx * vx + vy * vy;
  if (a === 0) return null;
  const b = 2 * (dx * vx + dy * vy);
  const c = dx * dx + dy * dy - R * R;
  if (c <= 0) return 0; // already overlapping — treat as immediate contact
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= dt ? t : null;
}

export interface PsInput {
  aimDir: number; // -1/0/1 held
  launch: boolean; // justPressed
}

export interface PsEvents {
  launched: boolean;
  pegHit: number; // pegs hit this step
  orangeHit: boolean;
  caught: boolean;
  ballLost: boolean;
  won: boolean;
  died: boolean;
}

export function stepPs(s: PsState, input: PsInput, dt: number): PsEvents {
  const ev: PsEvents = { launched: false, pegHit: 0, orangeHit: false, caught: false, ballLost: false, won: false, died: false };
  if (s.won || s.dead) return ev;
  s.time += dt;

  // Bucket patrol.
  s.bucketX += s.bucketDir * BUCKET.speed * dt;
  if (s.bucketX < BUCKET.w / 2 + 10 || s.bucketX > W - BUCKET.w / 2 - 10) s.bucketDir *= -1;

  // Aim + launch.
  if (!s.ball) {
    s.aim = Math.max(-1.2, Math.min(1.2, s.aim + input.aimDir * 1.4 * dt));
    if (input.launch && s.ballsLeft > 0) {
      s.ballsLeft--;
      const a = s.aim + Math.PI / 2; // 0 aims straight down
      s.ball = { x: W / 2, y: LAUNCH_Y, vx: dcos(a) * LAUNCH_SPEED, vy: dsin(a) * LAUNCH_SPEED };
      ev.launched = true;
    }
    return ev;
  }

  // ── Ball physics: substepped, swept against every unlit-or-lit peg ──
  const ball = s.ball;
  const h = dt / SUBSTEPS;
  for (let sub = 0; sub < SUBSTEPS && s.ball; sub++) {
    ball.vy += GRAVITY * h;
    let remaining = h;
    // Resolve up to 3 impacts inside one substep (corner rattles).
    for (let guard = 0; guard < 3 && remaining > 1e-6; guard++) {
      let bestT = remaining;
      let hitPeg: Peg | null = null;
      let wall: 'left' | 'right' | 'top' | null = null;
      for (const peg of s.pegs) {
        const t = sweptCircleHit(ball.x, ball.y, ball.vx, ball.vy, peg.x, peg.y, BALL_R + PEG_R, remaining);
        if (t !== null && t < bestT) {
          bestT = t;
          hitPeg = peg;
          wall = null;
        }
      }
      // Walls (left/right/top) as swept planes.
      if (ball.vx < 0) {
        const t = (BALL_R - ball.x) / ball.vx;
        if (t >= 0 && t < bestT) {
          bestT = t;
          wall = 'left';
          hitPeg = null;
        }
      }
      if (ball.vx > 0) {
        const t = (W - BALL_R - ball.x) / ball.vx;
        if (t >= 0 && t < bestT) {
          bestT = t;
          wall = 'right';
          hitPeg = null;
        }
      }
      if (ball.vy < 0) {
        const t = (BALL_R - ball.y) / ball.vy;
        if (t >= 0 && t < bestT) {
          bestT = t;
          wall = 'top';
          hitPeg = null;
        }
      }
      ball.x += ball.vx * bestT;
      ball.y += ball.vy * bestT;
      remaining -= bestT;
      if (hitPeg) {
        // Reflect off the peg normal with restitution.
        const nx = (ball.x - hitPeg.x) / (BALL_R + PEG_R);
        const ny = (ball.y - hitPeg.y) / (BALL_R + PEG_R);
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx = (ball.vx - 2 * dot * nx) * RESTITUTION;
        ball.vy = (ball.vy - 2 * dot * ny) * RESTITUTION;
        // Nudge off the surface to avoid re-contact at t=0.
        ball.x += nx * 0.5;
        ball.y += ny * 0.5;
        if (!hitPeg.lit) {
          hitPeg.lit = true;
          ev.pegHit++;
          s.score += hitPeg.orange ? 100 : 10;
          if (hitPeg.orange) ev.orangeHit = true;
        }
      } else if (wall) {
        if (wall === 'left' || wall === 'right') ball.vx = -ball.vx * RESTITUTION;
        else ball.vy = -ball.vy * RESTITUTION;
      } else break;
    }
    // Exit / bucket at the floor line.
    if (ball.y > BUCKET.y - BALL_R) {
      const inBucket = Math.abs(ball.x - s.bucketX) < BUCKET.w / 2;
      if (inBucket) {
        s.ballsLeft++;
        s.caught++;
        ev.caught = true;
      } else ev.ballLost = true;
      // Lit pegs are cleared when the ball leaves the field.
      s.pegs = s.pegs.filter((p) => !p.lit);
      s.ball = null;
    }
  }

  // Win/lose bookkeeping.
  if (!s.pegs.some((p) => p.orange)) {
    s.won = true;
    ev.won = true;
  } else if (!s.ball && s.ballsLeft <= 0) {
    s.dead = true;
    ev.died = true;
  }
  return ev;
}

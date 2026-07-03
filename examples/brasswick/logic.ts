// Brasswick sim — pure module. A one-screen pinball table built on the rigid
// engine's hardest features: FLIPPERS are dynamic bodies driven by revolute
// MOTORS with angle LIMITS, the ball is a bullet-CCD circle that must never
// tunnel a wall at any speed, and bumper-bells kick with impulses. The whole
// table is plain data — clone it and you have a flipper-timing bot for free.

import {
  addBody, applyImpulse, createRigidWorld, dcos, dsin,
  getBody, polygonBox, removeBody, rigidStep, type RigidWorld,
} from '@hayao';

export const W = 1280;
export const H = 704;
export const TABLE = { left: 430, right: 850, top: 100, drainY: 660 };
export const BALL_R = 10;
export const TARGET_SCORE = 2000;
export const BALLS = 3;

export interface PbBell {
  id: number;      // static bumper body id
  x: number; y: number; r: number;
  lit: boolean;
}

export interface PbState {
  phys: RigidWorld;
  score: number;
  ballsLeft: number;   // serves remaining (not counting the live ball)
  ball: number;        // live ball body id (0 = none)
  serveIndex: number;
  bells: PbBell[];
  flipL: number; flipR: number;       // flipper body ids (kinematic paddles)
  drain: number;                       // sensor body id
  won: boolean;
  dead: boolean;
}

export interface PbInput {
  left: boolean;    // hold left flipper up
  right: boolean;
  launch: boolean;  // serve a ball
}

export interface PbEvents {
  served: boolean;
  bells: number;     // bumper hits this step
  jackpot: boolean;  // all three lit → bonus + relight
  flipped: boolean;
  drained: boolean;
  won: boolean;
  died: boolean;
}

const FLIP_LEN = 84;
const FLIP_REST = 0.5;       // rest angle magnitude (tips toward the drain)
const FLIP_UP = -0.55;       // pressed angle (tips up)
export const PIVOT_L = { x: 550, y: 612 };
export const PIVOT_R = { x: 730, y: 612 };
const BELL_KICK = 72;
const BELL_SCORE = 100;
const JACKPOT = 700;

function wall(rw: RigidWorld, x: number, y: number, w: number, h: number, a = 0, restitution = 0.25): number {
  return addBody(rw, { kind: 'static', shape: polygonBox(w, h), x, y, a, friction: 0.1, restitution });
}

export function initialPb(): PbState {
  const rw = createRigidWorld({ gravityY: 760 });
  // Outer walls (thick, so nothing escapes even in theory).
  wall(rw, TABLE.left - 14, 380, 28, 600);                    // left
  wall(rw, TABLE.right + 14, 380, 28, 600);                   // right
  wall(rw, 640, TABLE.top - 14, 480, 28);                     // top
  // Corner slants (rotated boxes — no winding pitfalls).
  wall(rw, TABLE.left + 40, TABLE.top + 42, 150, 24, Math.PI / 4);
  wall(rw, TABLE.right - 40, TABLE.top + 42, 150, 24, -Math.PI / 4);
  // Funnel slants guiding to the flipper gap.
  wall(rw, TABLE.left + 62, 549, 185, 22, 0.62, 0.05);
  wall(rw, TABLE.right - 62, 549, 185, 22, -0.62, 0.05);
  // Bumper-bells (static circles; the kick is applied as an impulse).
  const bells: PbBell[] = [];
  for (const [bx, by] of [[552, 258], [728, 258], [640, 372]] as const) {
    const id = addBody(rw, { kind: 'static', shape: { kind: 'circle', r: 30 }, x: bx, y: by, restitution: 0.1 });
    bells.push({ id, x: bx, y: by, r: 30, lit: false });
  }
  // Flippers: KINEMATIC paddles (infinite mass — the ball never budges them)
  // whose angular velocity is driven directly and whose angle is clamped in
  // stepPb. The body's center orbits the pivot, so position AND velocity are
  // recomputed from the pivot each step; the contact solver sees the blade's
  // true surface velocity and whacks the ball accordingly.
  const makeFlipper = (px: number, py: number, dir: 1 | -1) => {
    const rest = dir * FLIP_REST;
    return addBody(rw, {
      kind: 'kinematic',
      shape: polygonBox(FLIP_LEN, 16),
      x: px + dcos(rest) * dir * (FLIP_LEN / 2), y: py + dsin(dir * FLIP_REST) * (FLIP_LEN / 2) * (dir === 1 ? 1 : 1),
      a: rest,
      friction: 0.4, restitution: 0.05, canSleep: false,
    });
  };
  const L = { flip: makeFlipper(PIVOT_L.x, PIVOT_L.y, 1) };
  const R = { flip: makeFlipper(PIVOT_R.x, PIVOT_R.y, -1) };
  // Drain sensor spanning the whole bottom.
  const drain = addBody(rw, { kind: 'static', sensor: true, shape: polygonBox(480, 36), x: 640, y: TABLE.drainY + 40 });

  return {
    phys: rw,
    score: 0,
    ballsLeft: BALLS,
    ball: 0,
    serveIndex: 0,
    bells,
    flipL: L.flip, flipR: R.flip,
    drain,
    won: false,
    dead: false,
  };
}

/** Deterministic serve fan — three distinct openings, no RNG needed. */
const SERVES = [
  { vx: 38, vy: 260 },
  { vx: -60, vy: 240 },
  { vx: 12, vy: 290 },
];

export function stepPb(s: PbState, input: PbInput, dt: number): PbEvents {
  const ev: PbEvents = { served: false, bells: 0, jackpot: false, flipped: false, drained: false, won: false, died: false };
  const terminal = s.won || s.dead;

  // Flipper drive: angular velocity toward the pressed/rest bound, angle
  // clamped hard at the bounds; pose recomputed about the pivot so the blade
  // pivots at its base (not its center).
  const driveFlipper = (id: number, pivot: { x: number; y: number }, dir: 1 | -1, held: boolean) => {
    const f = getBody(s.phys, id);
    if (!f) return;
    const lo = dir === 1 ? FLIP_UP : -FLIP_REST;   // most-CCW bound
    const hi = dir === 1 ? FLIP_REST : -FLIP_UP;   // most-CW bound
    const targetW = dir === 1 ? (held ? -24 : 16) : held ? 24 : -16;
    let a = f.a + targetW * dt;
    let w = targetW;
    if (a <= lo) { a = lo; w = 0; }
    if (a >= hi) { a = hi; w = 0; }
    // Pose the body so its BASE sits on the pivot at angle `a` (the blade
    // extends toward +x for the left flipper, -x for the right)…
    const mid = a - w * dt; // integration will carry it to exactly `a`
    const hl = FLIP_LEN / 2;
    f.a = mid;
    f.w = w;
    f.x = pivot.x + dir * dcos(mid) * hl;
    f.y = pivot.y + dir * dsin(mid) * hl;
    // …and give the center its true orbital velocity about the pivot.
    f.vx = dir * -dsin(mid) * w * hl;
    f.vy = dir * dcos(mid) * w * hl;
  };
  driveFlipper(s.flipL, PIVOT_L, 1, !terminal && input.left);
  driveFlipper(s.flipR, PIVOT_R, -1, !terminal && input.right);
  if (!terminal && (input.left || input.right)) ev.flipped = true;

  // Serve.
  if (!terminal && input.launch && s.ball === 0 && s.ballsLeft > 0) {
    const v = SERVES[s.serveIndex % SERVES.length];
    s.ball = addBody(s.phys, {
      shape: { kind: 'circle', r: BALL_R }, x: 640, y: 150, vx: v.vx, vy: v.vy,
      density: 2, friction: 0.15, restitution: 0.35, angDamp: 0.05, bullet: true, canSleep: false,
    });
    s.serveIndex++;
    s.ballsLeft--;
    ev.served = true;
  }

  const contacts = rigidStep(s.phys, dt);

  // Bumper-bells: kick + score + light.
  for (const c of contacts) {
    if (s.ball === 0) break;
    const other = c.a === s.ball ? c.b : c.b === s.ball ? c.a : 0;
    if (!other) continue;
    const bell = s.bells.find((b) => b.id === other);
    if (!bell || c.sensor) continue;
    // Kick radially out from the bell center.
    const b = getBody(s.phys, s.ball)!;
    const dx = b.x - bell.x, dy = b.y - bell.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    applyImpulse(s.phys, s.ball, (dx / d) * BELL_KICK, (dy / d) * BELL_KICK);
    s.score += BELL_SCORE;
    bell.lit = true;
    ev.bells++;
    if (s.bells.every((x) => x.lit)) {
      s.score += JACKPOT;
      for (const x of s.bells) x.lit = false;
      ev.jackpot = true;
    }
  }
  // Drain.
  for (const c of contacts) {
    if (!c.sensor || s.ball === 0) continue;
    const pair = [c.a, c.b];
    if (pair.includes(s.drain) && pair.includes(s.ball)) {
      removeBody(s.phys, s.ball);
      s.ball = 0;
      ev.drained = true;
    }
  }

  if (terminal) return ev;
  if (s.score >= TARGET_SCORE) {
    s.won = true;
    ev.won = true;
  } else if (s.ballsLeft === 0 && s.ball === 0) {
    s.dead = true;
    ev.died = true;
  }
  return ev;
}

export function flipperAngle(s: PbState, side: 'L' | 'R'): number {
  const b = getBody(s.phys, side === 'L' ? s.flipL : s.flipR);
  return b ? b.a : 0;
}

export function ballPos(s: PbState): { x: number; y: number; vx: number; vy: number } | null {
  if (s.ball === 0) return null;
  const b = getBody(s.phys, s.ball);
  return b ? { x: b.x, y: b.y, vx: b.vx, vy: b.vy } : null;
}

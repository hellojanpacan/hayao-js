// Fernclash duel sim — pure module. Two circles on a round arena: steer,
// shove, dash; force the rival past the fern ring to take the round, first to
// three rounds wins. Fixed iteration order (p1 then p2), no rng, no wall
// clock — a NETPLAY-GRADE deterministic transition, which is the whole point
// of this example.

export type Side = 'p1' | 'p2';
export const SIDES: readonly Side[] = ['p1', 'p2'];

export interface FcInput {
  /** −1..1 steering (digital inputs give −1/0/1). */
  x: number;
  y: number;
  dash: boolean;
}

export interface FcBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Last non-zero steer direction — dash aims along it. */
  dirX: number;
  dirY: number;
  /** Seconds until the next dash is available. */
  dashCd: number;
}

export type FcPhase = 'countdown' | 'play' | 'roundEnd' | 'over';

export interface FcState {
  bodies: Record<Side, FcBody>;
  score: Record<Side, number>;
  round: number;
  phase: FcPhase;
  /** Seconds left in the current countdown/roundEnd pause. */
  timer: number;
  /** Winner of the last round / the match. */
  lastWinner: Side | null;
  time: number;
  [key: string]: unknown;
}

export interface FcEvents {
  go: boolean;
  hit: boolean;
  dash: boolean;
  roundEnd: Side | null;
  over: Side | null;
}

export const ARENA = { cx: 640, cy: 380, r: 250 };
export const FIGHTER = {
  radius: 30,
  accel: 1050,
  maxSpeed: 330,
  /** Exponential drag factor per second. */
  drag: 2.6,
  /** Restitution > 1: shoves add energy, so contact is decisive. */
  restitution: 1.35,
  dashImpulse: 520,
  dashCooldown: 1.4,
};
export const WIN_SCORE = 3;
const COUNTDOWN = 1.0;
const ROUND_PAUSE = 1.4;

const START: Record<Side, { x: number; y: number }> = {
  p1: { x: ARENA.cx - 130, y: ARENA.cy },
  p2: { x: ARENA.cx + 130, y: ARENA.cy },
};

export function initialFc(): FcState {
  return {
    bodies: { p1: makeBody('p1'), p2: makeBody('p2') },
    score: { p1: 0, p2: 0 },
    round: 1,
    phase: 'countdown',
    timer: COUNTDOWN,
    lastWinner: null,
    time: 0,
  };
}

function makeBody(side: Side): FcBody {
  const s = START[side];
  return { x: s.x, y: s.y, vx: 0, vy: 0, dirX: side === 'p1' ? 1 : -1, dirY: 0, dashCd: 0 };
}

function resetRound(s: FcState): void {
  s.bodies = { p1: makeBody('p1'), p2: makeBody('p2') };
  s.phase = 'countdown';
  s.timer = COUNTDOWN;
}

/** Distance from the arena centre (a fighter falls when this exceeds r). */
export function centreDist(b: FcBody): number {
  const dx = b.x - ARENA.cx;
  const dy = b.y - ARENA.cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function integrate(b: FcBody, input: FcInput, dt: number, events: FcEvents): void {
  // Normalise diagonal steering so no direction is privileged.
  let ix = input.x;
  let iy = input.y;
  const il = Math.sqrt(ix * ix + iy * iy);
  if (il > 1) {
    ix /= il;
    iy /= il;
  }
  if (il > 0) {
    const l = Math.sqrt(ix * ix + iy * iy);
    b.dirX = ix / l;
    b.dirY = iy / l;
  }
  b.vx += ix * FIGHTER.accel * dt;
  b.vy += iy * FIGHTER.accel * dt;

  b.dashCd = Math.max(0, b.dashCd - dt);
  if (input.dash && b.dashCd === 0) {
    const dl = Math.sqrt(b.dirX * b.dirX + b.dirY * b.dirY) || 1;
    b.vx += (b.dirX / dl) * FIGHTER.dashImpulse;
    b.vy += (b.dirY / dl) * FIGHTER.dashImpulse;
    b.dashCd = FIGHTER.dashCooldown;
    events.dash = true;
  }

  // Exponential drag, then a hard speed cap (dash may exceed it briefly).
  const damp = 1 / (1 + FIGHTER.drag * dt);
  b.vx *= damp;
  b.vy *= damp;
  const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  const cap = FIGHTER.maxSpeed * 2.2;
  if (sp > cap) {
    b.vx = (b.vx / sp) * cap;
    b.vy = (b.vy / sp) * cap;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;
}

function collide(a: FcBody, b: FcBody, events: FcEvents): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = FIGHTER.radius * 2;
  if (dist === 0 || dist >= minDist) return;
  const nx = dx / dist;
  const ny = dy / dist;
  // Positional separation, half each.
  const overlap = minDist - dist;
  a.x -= (nx * overlap) / 2;
  a.y -= (ny * overlap) / 2;
  b.x += (nx * overlap) / 2;
  b.y += (ny * overlap) / 2;
  // Equal-mass impulse along the normal with juicy restitution.
  const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rel < 0) {
    const j = (-(1 + FIGHTER.restitution) * rel) / 2;
    a.vx -= j * nx;
    a.vy -= j * ny;
    b.vx += j * nx;
    b.vy += j * ny;
    events.hit = true;
  }
}

/** Advance the duel one fixed step. Mutates `s`, returns the step's events. */
export function stepFc(s: FcState, inputs: Record<Side, FcInput>, dt: number): FcEvents {
  const events: FcEvents = { go: false, hit: false, dash: false, roundEnd: null, over: null };
  s.time += dt;

  if (s.phase === 'countdown') {
    s.timer -= dt;
    if (s.timer <= 0) {
      s.phase = 'play';
      events.go = true;
    }
    return events;
  }
  if (s.phase === 'roundEnd') {
    s.timer -= dt;
    if (s.timer <= 0) {
      s.round += 1;
      resetRound(s);
    }
    return events;
  }
  if (s.phase === 'over') return events;

  // play: fixed order — p1 integrates first, always.
  integrate(s.bodies.p1, inputs.p1, dt, events);
  integrate(s.bodies.p2, inputs.p2, dt, events);
  collide(s.bodies.p1, s.bodies.p2, events);

  // Fallout — p1 checked first; a simultaneous double-out goes to p2's column
  // deterministically (p1 fell first in iteration order).
  for (const side of SIDES) {
    if (centreDist(s.bodies[side]) > ARENA.r) {
      const winner: Side = side === 'p1' ? 'p2' : 'p1';
      s.score[winner] += 1;
      s.lastWinner = winner;
      if (s.score[winner] >= WIN_SCORE) {
        s.phase = 'over';
        events.over = winner;
      } else {
        s.phase = 'roundEnd';
        s.timer = ROUND_PAUSE;
        events.roundEnd = winner;
      }
      break;
    }
  }
  return events;
}

/** A simple chasing policy — verify's bot and a decent practice rival. */
export function chaseInput(s: FcState, me: Side): FcInput {
  const mine = s.bodies[me];
  const other = s.bodies[me === 'p1' ? 'p2' : 'p1'];
  // Survival first: near the rim, forget the rival and steer for the centre.
  if (centreDist(mine) > ARENA.r - 60) {
    const cx = ARENA.cx - mine.x;
    const cy = ARENA.cy - mine.y;
    return { x: Math.abs(cx) > 8 ? Math.sign(cx) : 0, y: Math.abs(cy) > 8 ? Math.sign(cy) : 0, dash: false };
  }
  const dx = other.x - mine.x;
  const dy = other.y - mine.y;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  // Dash only when close, nearly lined up on an axis (a diagonal dash at an
  // offset target sails past it), and far enough from the rim to overshoot
  // safely.
  const aligned = Math.abs(dx) < 24 || Math.abs(dy) < 24;
  const safe = centreDist(mine) < ARENA.r - 130;
  return { x: Math.abs(dx) > 8 ? Math.sign(dx) : 0, y: Math.abs(dy) > 8 ? Math.sign(dy) : 0, dash: d < 140 && aligned && safe && mine.dashCd === 0 };
}

// Vellgrove Rally racing sim — pure module. Arcade handling (forward thrust,
// grip that eats lateral slip, grass drag), an ordered-checkpoint lap system
// that cutting cannot cheat, and rivals that drive the racing line by seeking
// ahead and braking for corners.

import { dhypot, dcos, dsin, datan2 } from '@hayao';
export interface Vec {
  x: number;
  y: number;
}

/** The circuit: a rounded loop of centreline waypoints (clockwise). */
export const TRACK: Vec[] = [
  { x: 240, y: 140 }, { x: 500, y: 110 }, { x: 800, y: 110 }, { x: 1050, y: 150 },
  { x: 1150, y: 300 }, { x: 1120, y: 470 }, { x: 950, y: 590 }, { x: 700, y: 620 },
  { x: 430, y: 600 }, { x: 220, y: 520 }, { x: 130, y: 360 }, { x: 150, y: 220 },
];
export const HALF_WIDTH = 88;
export const LAPS = 3;
export const CP_RADIUS = 110;

export const CAR = { thrust: 340, maxSpeed: 430, brake: 500, steerRate: 2.6, grip: 2.4, grassDrag: 4.2, drag: 0.35 };

export interface Car {
  x: number;
  y: number;
  heading: number;
  vx: number;
  vy: number;
  nextCp: number;
  lap: number;
  /** Total progress = lap * TRACK.length + nextCp (for positions). */
  finished: boolean;
}

export interface VgState {
  cars: Car[]; // [0] = player
  time: number;
  countdown: number;
  results: number[]; // car indices in finish order
  won: boolean;
  done: boolean;
  [key: string]: unknown;
}

export function makeCar(gridSlot: number): Car {
  return { x: 240 - gridSlot * 10, y: 180 + gridSlot * 42, heading: -0.15, vx: 0, vy: 0, nextCp: 1, lap: 0, finished: false };
}

export function initialVg(): VgState {
  return { cars: [makeCar(0), makeCar(1), makeCar(2)], time: 0, countdown: 3, results: [], won: false, done: false };
}

/** Distance from a point to the nearest centreline segment. */
export function trackDistance(x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i < TRACK.length; i++) {
    const a = TRACK[i];
    const b = TRACK[(i + 1) % TRACK.length];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (y - a.y) * aby) / (abx * abx + aby * aby)));
    const dx = x - (a.x + abx * t);
    const dy = y - (a.y + aby * t);
    best = Math.min(best, dhypot(dx, dy));
  }
  return best;
}

export const onTrack = (x: number, y: number): boolean => trackDistance(x, y) <= HALF_WIDTH;

export interface CarInput {
  throttle: number; // 0..1
  brake: number;
  steer: number; // -1..1
}

/** One fixed step of arcade car physics. */
export function stepCar(c: Car, input: CarInput, dt: number): void {
  const speed = dhypot(c.vx, c.vy);
  // Steering authority: none at standstill, full at cruise, UNDERSTEER at
  // speed — flat-out cars physically cannot make the tight bends.
  const authority = Math.min(1, speed / 160) / (1 + Math.max(0, speed - 240) / 160);
  c.heading += input.steer * CAR.steerRate * dt * authority;
  const fx = dcos(c.heading);
  const fy = dsin(c.heading);
  // Thrust + brake along heading.
  c.vx += fx * (input.throttle * CAR.thrust - input.brake * CAR.brake * Math.sign(c.vx * fx + c.vy * fy)) * dt;
  c.vy += fy * (input.throttle * CAR.thrust - input.brake * CAR.brake * Math.sign(c.vx * fx + c.vy * fy)) * dt;
  // Grip: decompose into forward/lateral, damp the lateral hard.
  const fwd = c.vx * fx + c.vy * fy;
  let latX = c.vx - fx * fwd;
  let latY = c.vy - fy * fwd;
  const gripK = Math.max(0, 1 - CAR.grip * dt);
  latX *= gripK;
  latY *= gripK;
  let nvx = fx * fwd + latX;
  let nvy = fy * fwd + latY;
  // Grass drags; tarmac barely.
  const drag = onTrack(c.x, c.y) ? CAR.drag : CAR.grassDrag;
  nvx *= Math.max(0, 1 - drag * dt);
  nvy *= Math.max(0, 1 - drag * dt);
  // Speed cap.
  const ns = dhypot(nvx, nvy);
  if (ns > CAR.maxSpeed) {
    nvx *= CAR.maxSpeed / ns;
    nvy *= CAR.maxSpeed / ns;
  }
  c.vx = nvx;
  c.vy = nvy;
  c.x += c.vx * dt;
  c.y += c.vy * dt;

  // Ordered checkpoints: only the NEXT one counts (cutting is worthless).
  const cp = TRACK[c.nextCp];
  if (dhypot(cp.x - c.x, cp.y - c.y) < CP_RADIUS) {
    c.nextCp = (c.nextCp + 1) % TRACK.length;
    if (c.nextCp === 1) c.lap++; // crossed the start sector again
  }
}

export const progress = (c: Car): number => c.lap * TRACK.length + ((c.nextCp - 1 + TRACK.length) % TRACK.length);

/** The racing line: seek a waypoint ahead, brake for the bend after it. */
export function driveLine(c: Car): CarInput {
  const target = TRACK[c.nextCp];
  const after = TRACK[(c.nextCp + 1) % TRACK.length];
  const want = datan2(target.y - c.y, target.x - c.x);
  let da = want - c.heading;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  // Corner sharpness: angle between this leg and the next.
  const legA = datan2(target.y - c.y, target.x - c.x);
  const legB = datan2(after.y - target.y, after.x - target.x);
  let bend = legB - legA;
  while (bend > Math.PI) bend -= 2 * Math.PI;
  while (bend < -Math.PI) bend += 2 * Math.PI;
  const near = dhypot(target.x - c.x, target.y - c.y) < 220;
  const speed = dhypot(c.vx, c.vy);
  const brakeForBend = near && Math.abs(bend) > 0.55 && speed > 250;
  return { throttle: brakeForBend ? 0.25 : Math.abs(da) > 1.2 ? 0.45 : 1, brake: brakeForBend ? 0.7 : 0, steer: Math.max(-1, Math.min(1, da * 2.2)) };
}

export interface VgEvents {
  go: boolean;
  playerLap: boolean;
  finished: boolean; // player crossed the final line
  done: boolean; // race over (all finished or player done)
}

export function stepVg(s: VgState, playerInput: CarInput, dt: number): VgEvents {
  const ev: VgEvents = { go: false, playerLap: false, finished: false, done: false };
  if (s.done) return ev;
  if (s.countdown > 0) {
    s.countdown -= dt;
    if (s.countdown <= 0) ev.go = true;
    return ev;
  }
  s.time += dt;
  s.cars.forEach((c, i) => {
    if (c.finished) return;
    const lapBefore = c.lap;
    stepCar(c, i === 0 ? playerInput : driveLine(c), dt);
    if (c.lap > lapBefore && i === 0) ev.playerLap = true;
    if (c.lap >= LAPS) {
      c.finished = true;
      s.results.push(i);
      if (i === 0) {
        ev.finished = true;
        s.won = s.results[0] === 0;
      }
    }
  });
  if (s.cars[0].finished) {
    s.done = true;
    ev.done = true;
  }
  return ev;
}

/** Live standings: 1-based position of the player. */
export function playerPosition(s: VgState): number {
  const p = progress(s.cars[0]);
  let pos = 1;
  for (let i = 1; i < s.cars.length; i++) {
    if (s.cars[i].finished && !s.cars[0].finished) pos++;
    else if (progress(s.cars[i]) > p) pos++;
  }
  return pos;
}

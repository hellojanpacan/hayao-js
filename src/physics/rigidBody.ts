// Deterministic 2D rigid-body dynamics — data model. The whole physics world
// is PLAIN JSON (no classes, no hidden caches), so it can live in
// `world.state` and inherit hashing, snapshot/restore, replay verification,
// and structuredClone-based planning bots for free. Pure functions over data.
//
// Units are pixels / seconds / radians. Only mass RATIOS matter to the
// solver; density defaults keep numbers small. Convention: a body's local
// origin is its center of mass (use `polygonBox`/`regularPolygon` helpers).

import { dcos, dsin } from '../core/dmath';
import type { Rect } from '../core/math';

export type RigidShape =
  | { kind: 'circle'; r: number }
  /** Convex polygon, CCW winding, local coords flat [x0,y0,x1,y1,…]. */
  | { kind: 'poly'; points: number[] };

export type BodyKind = 'dynamic' | 'static' | 'kinematic';

export interface RigidBody {
  id: number;
  kind: BodyKind;
  shape: RigidShape;
  /** Pose: position of the center of mass + rotation. */
  x: number; y: number; a: number;
  /** Velocity: linear + angular (rad/s). */
  vx: number; vy: number; w: number;
  /** Mass properties (0 inverse = immovable / non-rotating). */
  m: number; invM: number; i: number; invI: number;
  restitution: number;
  friction: number;
  linDamp: number;
  angDamp: number;
  gravityScale: number;
  /** Swept-circle CCD each step (circles only) — for very fast bodies. */
  bullet: boolean;
  /** Overlap events only, no collision response. */
  sensor: boolean;
  /** Collision filtering: collide iff (a.mask & b.layer) && (b.mask & a.layer). */
  layer: number;
  mask: number;
  canSleep: boolean;
  sleeping: boolean;
  sleepTime: number;
  /** Characteristic radius: converts spin to rim speed for the sleep test. */
  sleepR: number;
  /** Per-step force/torque accumulators (cleared after integration). */
  fx: number; fy: number; torque: number;
}

export interface RigidWorldOpts {
  gravityX?: number;
  gravityY?: number;
  /** Solver velocity iterations (default 16 — stacks need it). */
  iterations?: number;
  /** Broadphase cell size in px (default 96). */
  cellSize?: number;
}

export interface RigidWorld {
  gravityX: number;
  gravityY: number;
  iterations: number;
  cellSize: number;
  nextId: number;
  bodies: RigidBody[];
  joints: import('./rigidJoints').Joint[];
  /** Warm-start impulse cache from the previous step, keyed "a:b:feature". */
  warm: Record<string, [number, number]>;
}

export function createRigidWorld(opts: RigidWorldOpts = {}): RigidWorld {
  return {
    gravityX: opts.gravityX ?? 0,
    gravityY: opts.gravityY ?? 900,
    iterations: opts.iterations ?? 16,
    cellSize: opts.cellSize ?? 96,
    nextId: 1,
    bodies: [],
    joints: [],
    warm: {},
  };
}

export interface RigidBodyDef {
  kind?: BodyKind;
  shape: RigidShape;
  x?: number; y?: number; a?: number;
  vx?: number; vy?: number; w?: number;
  density?: number;
  restitution?: number;
  friction?: number;
  linDamp?: number;
  angDamp?: number;
  gravityScale?: number;
  bullet?: boolean;
  sensor?: boolean;
  layer?: number;
  mask?: number;
  canSleep?: boolean;
  /** Lock rotation (players, elevators): infinite inertia. */
  fixedRotation?: boolean;
}

/** Area + second moment of area (about the local origin) for a shape. */
function massProps(shape: RigidShape): { area: number; unitI: number } {
  if (shape.kind === 'circle') {
    const area = Math.PI * shape.r * shape.r;
    return { area, unitI: (shape.r * shape.r) / 2 }; // I = m r²/2
  }
  // Convex polygon: standard cross-product accumulation about the origin.
  const p = shape.points;
  const n = p.length / 2;
  let area = 0;
  let inertia = 0;
  for (let k = 0; k < n; k++) {
    const x0 = p[k * 2], y0 = p[k * 2 + 1];
    const j = (k + 1) % n;
    const x1 = p[j * 2], y1 = p[j * 2 + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross / 2;
    inertia += (cross * (x0 * x0 + x0 * x1 + x1 * x1 + y0 * y0 + y0 * y1 + y1 * y1)) / 12;
  }
  return { area: Math.abs(area), unitI: area !== 0 ? Math.abs(inertia) / Math.abs(area) : 0 };
}

/** Mass scale keeps typical bodies O(0.1–10) so impulses stay well-ranged. */
const DENSITY_SCALE = 1e-4;

export function addBody(rw: RigidWorld, def: RigidBodyDef): number {
  const kind = def.kind ?? 'dynamic';
  const density = def.density ?? 1;
  const { area, unitI } = massProps(def.shape);
  const m = kind === 'dynamic' ? Math.max(area * density * DENSITY_SCALE, 1e-6) : 0;
  const i = kind === 'dynamic' && !def.fixedRotation ? m * unitI : 0;
  const body: RigidBody = {
    id: rw.nextId++,
    kind,
    shape: def.shape,
    x: def.x ?? 0, y: def.y ?? 0, a: def.a ?? 0,
    vx: def.vx ?? 0, vy: def.vy ?? 0, w: def.w ?? 0,
    m, invM: m > 0 ? 1 / m : 0,
    i, invI: i > 0 ? 1 / i : 0,
    restitution: def.restitution ?? 0.1,
    friction: def.friction ?? 0.4,
    linDamp: def.linDamp ?? 0,
    angDamp: def.angDamp ?? 0.6,
    gravityScale: def.gravityScale ?? 1,
    bullet: def.bullet ?? false,
    sensor: def.sensor ?? false,
    layer: def.layer ?? 1,
    mask: def.mask ?? 0xffff,
    canSleep: def.canSleep ?? true,
    sleeping: false,
    sleepTime: 0,
    sleepR: def.shape.kind === 'circle'
      ? def.shape.r
      : Math.sqrt(def.shape.points.reduce((m, _, i, p) => (i % 2 ? m : Math.max(m, p[i] * p[i] + p[i + 1] * p[i + 1])), 0)),
    fx: 0, fy: 0, torque: 0,
  };
  rw.bodies.push(body);
  return body.id;
}

export function getBody(rw: RigidWorld, id: number): RigidBody | undefined {
  const bs = rw.bodies;
  for (let k = 0; k < bs.length; k++) if (bs[k].id === id) return bs[k];
  return undefined;
}

export function removeBody(rw: RigidWorld, id: number): void {
  const idx = rw.bodies.findIndex((b) => b.id === id);
  if (idx >= 0) rw.bodies.splice(idx, 1);
  rw.joints = rw.joints.filter((j) => j.a !== id && j.b !== id);
}

export function wakeBody(b: RigidBody): void {
  b.sleeping = false;
  b.sleepTime = 0;
}

/** Apply an impulse at a world point (wakes the body). */
export function applyImpulse(rw: RigidWorld, id: number, ix: number, iy: number, px?: number, py?: number): void {
  const b = getBody(rw, id);
  if (!b || b.invM === 0) return;
  wakeBody(b);
  b.vx += ix * b.invM;
  b.vy += iy * b.invM;
  if (px !== undefined && py !== undefined) {
    b.w += ((px - b.x) * iy - (py - b.y) * ix) * b.invI;
  }
}

/** World-space vertices of a poly body (freshly computed — no caches). */
export function worldPoints(b: RigidBody): number[] {
  if (b.shape.kind !== 'poly') return [];
  const c = dcos(b.a), s = dsin(b.a);
  const p = b.shape.points;
  const out = new Array<number>(p.length);
  for (let k = 0; k < p.length; k += 2) {
    out[k] = b.x + p[k] * c - p[k + 1] * s;
    out[k + 1] = b.y + p[k] * s + p[k + 1] * c;
  }
  return out;
}

export function bodyAABB(b: RigidBody): Rect {
  if (b.shape.kind === 'circle') {
    const r = b.shape.r;
    return { x: b.x - r, y: b.y - r, w: r * 2, h: r * 2 };
  }
  const wp = worldPoints(b);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let k = 0; k < wp.length; k += 2) {
    if (wp[k] < x0) x0 = wp[k];
    if (wp[k] > x1) x1 = wp[k];
    if (wp[k + 1] < y0) y0 = wp[k + 1];
    if (wp[k + 1] > y1) y1 = wp[k + 1];
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Centered box as a CCW convex polygon — the workhorse shape helper. */
export function polygonBox(w: number, h: number): RigidShape {
  const hw = w / 2, hh = h / 2;
  return { kind: 'poly', points: [-hw, -hh, hw, -hh, hw, hh, -hw, hh] };
}

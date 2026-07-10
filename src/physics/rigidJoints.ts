// Joints for the rigid-body engine: distance (rod / rope), revolute (pin,
// with optional motor and angle limits), prismatic (slider, with optional
// motor and travel limits), and weld (rigid glue). Velocity-level constraints
// with Baumgarte stabilization, solved inside the same iteration loop as
// contacts. Plain data + pure solve functions.

import { dcos, dhypot, dsin } from '../core/dmath';
import type { RigidBody, RigidWorld } from './rigidBody';
import { getBody, wakeBody } from './rigidBody';

export interface DistanceJoint {
  kind: 'distance';
  id: number;
  a: number; b: number;          // body ids
  ax: number; ay: number;        // local anchor on A
  bx: number; by: number;        // local anchor on B
  length: number;
  /** Rope mode: only constrain when stretched past `length`. */
  rope: boolean;
}

export interface RevoluteJoint {
  kind: 'revolute';
  id: number;
  a: number; b: number;
  ax: number; ay: number;
  bx: number; by: number;
  /** Motor: drive relative angular velocity toward `motorSpeed`. */
  motorSpeed: number;
  maxMotorTorque: number;        // 0 = motor off
  /** Angle limits on (b.a - a.a - refAngle); NaN-free: enabled flag. */
  limitLower: number;
  limitUpper: number;
  limitEnabled: boolean;
  refAngle: number;
}

export interface PrismaticJoint {
  kind: 'prismatic';
  id: number;
  a: number; b: number;
  ax: number; ay: number;        // local anchor on A
  bx: number; by: number;        // local anchor on B
  /** Slide axis, unit, LOCAL to body A. */
  ux: number; uy: number;
  /** Motor: drive translation speed along the axis toward `motorSpeed`. */
  motorSpeed: number;
  maxMotorForce: number;         // 0 = motor off
  /** Travel limits on the translation s (anchor B along the axis from anchor A). */
  limitLower: number;
  limitUpper: number;
  limitEnabled: boolean;
  refAngle: number;
}

export interface WeldJoint {
  kind: 'weld';
  id: number;
  a: number; b: number;
  ax: number; ay: number;
  bx: number; by: number;
  refAngle: number;
}

export type Joint = DistanceJoint | RevoluteJoint | PrismaticJoint | WeldJoint;

export interface DistanceJointDef {
  a: number; b: number;
  ax?: number; ay?: number; bx?: number; by?: number;
  /** Defaults to the current anchor distance. */
  length?: number;
  rope?: boolean;
}

export interface RevoluteJointDef {
  a: number; b: number;
  /** World-space pivot; local anchors are derived from current poses. */
  px: number; py: number;
  motorSpeed?: number;
  maxMotorTorque?: number;
  limitLower?: number;
  limitUpper?: number;
}

export interface PrismaticJointDef {
  a: number; b: number;
  /** World-space anchor; local anchors are derived from current poses. */
  px: number; py: number;
  /** World-space slide axis (normalized internally; defaults to +x). */
  axisX?: number; axisY?: number;
  /** Drive translation speed (px/s) along the axis. */
  motorSpeed?: number;
  maxMotorForce?: number;
  /** Travel limits (px) on the translation from the initial anchor. */
  limitLower?: number;
  limitUpper?: number;
}

export interface WeldJointDef {
  a: number; b: number;
  /** World-space weld point; local anchors are derived from current poses. */
  px: number; py: number;
}

function toLocal(b: RigidBody, wx: number, wy: number): [number, number] {
  const c = dcos(b.a), s = dsin(b.a);
  const dx = wx - b.x, dy = wy - b.y;
  return [dx * c + dy * s, -dx * s + dy * c];
}

function anchorWorld(b: RigidBody, lx: number, ly: number): [number, number] {
  const c = dcos(b.a), s = dsin(b.a);
  return [b.x + lx * c - ly * s, b.y + lx * s + ly * c];
}

export function addDistanceJoint(rw: RigidWorld, def: DistanceJointDef): number {
  const A = getBody(rw, def.a), B = getBody(rw, def.b);
  if (!A || !B) throw new Error(`distance joint: missing body ${def.a}/${def.b}`);
  const ax = def.ax ?? 0, ay = def.ay ?? 0, bx = def.bx ?? 0, by = def.by ?? 0;
  const [wax, way] = anchorWorld(A, ax, ay);
  const [wbx, wby] = anchorWorld(B, bx, by);
  const j: DistanceJoint = {
    kind: 'distance', id: rw.nextId++,
    a: def.a, b: def.b, ax, ay, bx, by,
    length: def.length ?? dhypot(wbx - wax, wby - way),
    rope: def.rope ?? false,
  };
  rw.joints.push(j);
  wakeBody(A); wakeBody(B);
  return j.id;
}

export function addRevoluteJoint(rw: RigidWorld, def: RevoluteJointDef): number {
  const A = getBody(rw, def.a), B = getBody(rw, def.b);
  if (!A || !B) throw new Error(`revolute joint: missing body ${def.a}/${def.b}`);
  const [ax, ay] = toLocal(A, def.px, def.py);
  const [bx, by] = toLocal(B, def.px, def.py);
  const j: RevoluteJoint = {
    kind: 'revolute', id: rw.nextId++,
    a: def.a, b: def.b, ax, ay, bx, by,
    motorSpeed: def.motorSpeed ?? 0,
    maxMotorTorque: def.maxMotorTorque ?? 0,
    limitLower: def.limitLower ?? 0,
    limitUpper: def.limitUpper ?? 0,
    limitEnabled: def.limitLower !== undefined || def.limitUpper !== undefined,
    refAngle: B.a - A.a,
  };
  rw.joints.push(j);
  wakeBody(A); wakeBody(B);
  return j.id;
}

/**
 * A slider: body B may only translate along one axis of body A (an elevator
 * rail, a piston, a drawer). Optional motor drives the slide; optional limits
 * bound the travel. Relative rotation is locked.
 */
export function addPrismaticJoint(rw: RigidWorld, def: PrismaticJointDef): number {
  const A = getBody(rw, def.a), B = getBody(rw, def.b);
  if (!A || !B) throw new Error(`prismatic joint: missing body ${def.a}/${def.b}`);
  const [ax, ay] = toLocal(A, def.px, def.py);
  const [bx, by] = toLocal(B, def.px, def.py);
  // Normalize the world axis, then store it local to A.
  const wx = def.axisX ?? 1, wy = def.axisY ?? 0;
  const len = dhypot(wx, wy) || 1;
  const c = dcos(A.a), s = dsin(A.a);
  const nx = wx / len, ny = wy / len;
  const j: PrismaticJoint = {
    kind: 'prismatic', id: rw.nextId++,
    a: def.a, b: def.b, ax, ay, bx, by,
    ux: nx * c + ny * s, uy: -nx * s + ny * c,
    motorSpeed: def.motorSpeed ?? 0,
    maxMotorForce: def.maxMotorForce ?? 0,
    limitLower: def.limitLower ?? 0,
    limitUpper: def.limitUpper ?? 0,
    limitEnabled: def.limitLower !== undefined || def.limitUpper !== undefined,
    refAngle: B.a - A.a,
  };
  rw.joints.push(j);
  wakeBody(A); wakeBody(B);
  return j.id;
}

/** Rigid glue: locks relative position AND angle (multi-part bodies, breakable-on-demand). */
export function addWeldJoint(rw: RigidWorld, def: WeldJointDef): number {
  const A = getBody(rw, def.a), B = getBody(rw, def.b);
  if (!A || !B) throw new Error(`weld joint: missing body ${def.a}/${def.b}`);
  const [ax, ay] = toLocal(A, def.px, def.py);
  const [bx, by] = toLocal(B, def.px, def.py);
  const j: WeldJoint = { kind: 'weld', id: rw.nextId++, a: def.a, b: def.b, ax, ay, bx, by, refAngle: B.a - A.a };
  rw.joints.push(j);
  wakeBody(A); wakeBody(B);
  return j.id;
}

export function getJoint(rw: RigidWorld, id: number): Joint | undefined {
  for (const j of rw.joints) if (j.id === id) return j;
  return undefined;
}

export function removeJoint(rw: RigidWorld, id: number): void {
  rw.joints = rw.joints.filter((j) => j.id !== id);
}

/** Per-step scratch for accumulated-impulse clamping (one per joint). */
export interface JointScratch {
  motorImpulse: number;
}

/** One velocity iteration for a single joint. `bias` uses dt for Baumgarte. */
export function solveJoint(j: Joint, A: RigidBody, B: RigidBody, dt: number, scratch: JointScratch): void {
  const [wax, way] = anchorWorld(A, j.ax, j.ay);
  const [wbx, wby] = anchorWorld(B, j.bx, j.by);
  const rax = wax - A.x, ray = way - A.y;
  const rbx = wbx - B.x, rby = wby - B.y;

  if (j.kind === 'distance') {
    let dx = wbx - wax, dy = wby - way;
    const dist = dhypot(dx, dy);
    if (dist < 1e-9) return;
    dx /= dist; dy /= dist;
    const stretch = dist - j.length;
    if (j.rope && stretch <= 0) return; // slack rope
    // Relative velocity along the axis.
    const vax = A.vx - A.w * ray, vay = A.vy + A.w * rax;
    const vbx = B.vx - B.w * rby, vby = B.vy + B.w * rbx;
    const vrel = (vbx - vax) * dx + (vby - vay) * dy;
    const crossA = rax * dy - ray * dx;
    const crossB = rbx * dy - rby * dx;
    const k = A.invM + B.invM + A.invI * crossA * crossA + B.invI * crossB * crossB;
    if (k < 1e-12) return;
    const bias = (0.2 / dt) * stretch;
    let lambda = -(vrel + bias) / k;
    if (j.rope && lambda > 0) lambda = 0; // rope can only pull inward
    const ix = dx * lambda, iy = dy * lambda;
    A.vx -= ix * A.invM; A.vy -= iy * A.invM;
    A.w -= (rax * iy - ray * ix) * A.invI;
    B.vx += ix * B.invM; B.vy += iy * B.invM;
    B.w += (rbx * iy - rby * ix) * B.invI;
    return;
  }

  if (j.kind === 'prismatic') {
    // Slide axis in world space (stored local to A) + its perpendicular.
    const c = dcos(A.a), s = dsin(A.a);
    const ux = j.ux * c - j.uy * s, uy = j.ux * s + j.uy * c;
    const px = -uy, py = ux;
    const dx = wbx - wax, dy = wby - way;
    // Lever arms (Box2D convention: the A side pivots around rA + d).
    const s1 = (rax + dx) * py - (ray + dy) * px;
    const s2 = rbx * py - rby * px;
    // Angular lock: relative rotation stays at refAngle.
    const kw = A.invI + B.invI;
    if (kw > 1e-12) {
      const angErr = B.a - A.a - j.refAngle;
      const imp = -(B.w - A.w + (0.2 / dt) * angErr) / kw;
      A.w -= imp * A.invI;
      B.w += imp * B.invI;
    }
    // Perpendicular lock: the anchors may separate only along the axis.
    const kp = A.invM + B.invM + A.invI * s1 * s1 + B.invI * s2 * s2;
    if (kp > 1e-12) {
      const cPerp = dx * px + dy * py;
      const cdot = (B.vx - A.vx) * px + (B.vy - A.vy) * py + s2 * B.w - s1 * A.w;
      const imp = -(cdot + (0.2 / dt) * cPerp) / kp;
      A.vx -= imp * px * A.invM; A.vy -= imp * py * A.invM;
      A.w -= imp * s1 * A.invI;
      B.vx += imp * px * B.invM; B.vy += imp * py * B.invM;
      B.w += imp * s2 * B.invI;
    }
    // Axis direction: motor drives the slide, limits bound the travel.
    const a1 = (rax + dx) * uy - (ray + dy) * ux;
    const a2 = rbx * uy - rby * ux;
    const ka = A.invM + B.invM + A.invI * a1 * a1 + B.invI * a2 * a2;
    if (j.maxMotorForce > 0 && ka > 1e-12) {
      const cdot = (B.vx - A.vx) * ux + (B.vy - A.vy) * uy + a2 * B.w - a1 * A.w;
      const imp0 = -(cdot - j.motorSpeed) / ka;
      // Accumulated clamp: total motor impulse this STEP ≤ maxMotorForce·dt (Box2D semantics).
      const maxImp = j.maxMotorForce * dt;
      const acc0 = scratch.motorImpulse;
      scratch.motorImpulse = Math.min(Math.max(acc0 + imp0, -maxImp), maxImp);
      const applied = scratch.motorImpulse - acc0;
      A.vx -= applied * ux * A.invM; A.vy -= applied * uy * A.invM;
      A.w -= applied * a1 * A.invI;
      B.vx += applied * ux * B.invM; B.vy += applied * uy * B.invM;
      B.w += applied * a2 * B.invI;
    }
    if (j.limitEnabled && ka > 1e-12) {
      const trans = dx * ux + dy * uy;
      let cLim = 0;
      if (trans < j.limitLower) cLim = trans - j.limitLower;
      else if (trans > j.limitUpper) cLim = trans - j.limitUpper;
      if (cLim !== 0) {
        const cdot = (B.vx - A.vx) * ux + (B.vy - A.vy) * uy + a2 * B.w - a1 * A.w;
        const imp = -(cdot + (0.2 / dt) * cLim) / ka;
        // Only push back toward the range.
        if ((cLim < 0 && imp > 0) || (cLim > 0 && imp < 0)) {
          A.vx -= imp * ux * A.invM; A.vy -= imp * uy * A.invM;
          A.w -= imp * a1 * A.invI;
          B.vx += imp * ux * B.invM; B.vy += imp * uy * B.invM;
          B.w += imp * a2 * B.invI;
        }
      }
    }
    return;
  }

  if (j.kind === 'weld') {
    // Angular lock, then fall through to the shared point-to-point solve.
    const kw = A.invI + B.invI;
    if (kw > 1e-12) {
      const angErr = B.a - A.a - j.refAngle;
      const imp = -(B.w - A.w + (0.2 / dt) * angErr) / kw;
      A.w -= imp * A.invI;
      B.w += imp * B.invI;
    }
  } else {
    // Revolute: motor + limits first (1D angular), then point-to-point (2D).
    if (j.maxMotorTorque > 0) {
      const kw = A.invI + B.invI;
      if (kw > 1e-12) {
        const cdot = B.w - A.w - j.motorSpeed;
        const imp = -cdot / kw;
        // Accumulated clamp: total motor impulse this STEP ≤ maxMotorTorque·dt,
        // regardless of iteration count (Box2D semantics).
        const maxImp = j.maxMotorTorque * dt;
        const acc0 = scratch.motorImpulse;
        scratch.motorImpulse = Math.min(Math.max(acc0 + imp, -maxImp), maxImp);
        const applied = scratch.motorImpulse - acc0;
        A.w -= applied * A.invI;
        B.w += applied * B.invI;
      }
    }
    if (j.limitEnabled) {
      const kw = A.invI + B.invI;
      if (kw > 1e-12) {
        const angle = B.a - A.a - j.refAngle;
        let c = 0;
        if (angle < j.limitLower) c = angle - j.limitLower;
        else if (angle > j.limitUpper) c = angle - j.limitUpper;
        if (c !== 0) {
          const cdot = B.w - A.w;
          const imp = -(cdot + (0.2 / dt) * c) / kw;
          // Only push back toward the range.
          if ((c < 0 && imp > 0) || (c > 0 && imp < 0)) {
            A.w -= imp * A.invI;
            B.w += imp * B.invI;
          }
        }
      }
    }
  }
  // Point-to-point: solve the 2x2 system K * lambda = -(vrel + bias).
  const vax = A.vx - A.w * ray, vay = A.vy + A.w * rax;
  const vbx = B.vx - B.w * rby, vby = B.vy + B.w * rbx;
  const cx = wbx - wax, cy = wby - way;
  const vrx = vbx - vax + (0.2 / dt) * cx;
  const vry = vby - vay + (0.2 / dt) * cy;
  const k11 = A.invM + B.invM + A.invI * ray * ray + B.invI * rby * rby;
  const k12 = -A.invI * rax * ray - B.invI * rbx * rby;
  const k22 = A.invM + B.invM + A.invI * rax * rax + B.invI * rbx * rbx;
  const det = k11 * k22 - k12 * k12;
  if (Math.abs(det) < 1e-12) return;
  const ix = -(k22 * vrx - k12 * vry) / det;
  const iy = -(k11 * vry - k12 * vrx) / det;
  A.vx -= ix * A.invM; A.vy -= iy * A.invM;
  A.w -= (rax * iy - ray * ix) * A.invI;
  B.vx += ix * B.invM; B.vy += iy * B.invM;
  B.w += (rbx * iy - rby * ix) * B.invI;
}

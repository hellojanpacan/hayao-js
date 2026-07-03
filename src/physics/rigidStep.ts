// The rigid-body step pipeline: integrate forces → broadphase (spatial hash,
// ordered pairs) → narrowphase → warm-started sequential-impulse solve
// (joints + contacts) → integrate positions → bullet CCD → sleeping.
//
// Penetration recovery uses SPLIT IMPULSE (Chipmunk-style bias velocities): a
// separate pseudo-velocity field feels the Baumgarte push, integrates into
// POSITION only, and is discarded — so stacks recover overlap without gaining
// kinetic energy, settle truly calm, and can sleep.
//
// Deterministic: bodies iterate in array order, pairs in (idA, idB) order,
// and the warm-start cache is rebuilt every step from plain data.

import { dhypot } from '../core/dmath';
import { SpatialHash } from './spatialHash';
import type { RigidBody, RigidWorld } from './rigidBody';
import { bodyAABB, getBody, wakeBody, worldPoints } from './rigidBody';
import { collide, type Manifold } from './rigidCollide';
import { solveJoint } from './rigidJoints';

export interface ContactEvent {
  a: number; b: number;          // body ids (a < b)
  px: number; py: number;        // representative contact point
  nx: number; ny: number;        // normal a→b
  /** Total normal impulse this step — scales with hit violence. */
  impulse: number;
  /** Sensor overlap (no collision response was applied). */
  sensor: boolean;
}

const SLOP = 0.5;                // allowed overlap, px
const BIAS = 0.2;                // Baumgarte factor (position recovery rate)
const REST_THRESHOLD = 40;       // px/s — below this, no bounce
const SLEEP_LIN2 = 64;           // (8 px/s)² — resting piles hum at 5–20 px/s
const SLEEP_RIM = 8;             // px/s of rim speed (|w|·sleepR)
const TIME_TO_SLEEP = 0.5;       // s
const WAKE_LIN2 = 100;           // partner speed² that wakes a sleeper

interface SolvePoint {
  rax: number; ray: number; rbx: number; rby: number;
  pen: number;
  massN: number; massT: number;
  restBias: number;              // restitution target velocity (real)
  posBias: number;               // penetration target velocity (pseudo)
  pn: number; pt: number;        // accumulated impulses (real)
  pb: number;                    // accumulated impulse (pseudo)
  key: string;
}

interface SolveManifold {
  m: Manifold;
  ia: number; ib: number;        // body array indices (for the bias fields)
  points: SolvePoint[];
  friction: number;
}

function canCollide(a: RigidBody, b: RigidBody): boolean {
  if (a.invM === 0 && b.invM === 0 && a.kind !== 'kinematic' && b.kind !== 'kinematic' && !a.sensor && !b.sensor) return false;
  return (a.mask & b.layer) !== 0 && (b.mask & a.layer) !== 0;
}

export function rigidStep(rw: RigidWorld, dt: number): ContactEvent[] {
  const bodies = rw.bodies;
  const events: ContactEvent[] = [];
  if (dt <= 0) return events;

  // ── 1 · integrate forces ─────────────────────────────────────────
  for (let k = 0; k < bodies.length; k++) {
    const b = bodies[k];
    if (b.kind !== 'dynamic' || b.sleeping) { b.fx = 0; b.fy = 0; b.torque = 0; continue; }
    b.vx += (rw.gravityX * b.gravityScale + b.fx * b.invM) * dt;
    b.vy += (rw.gravityY * b.gravityScale + b.fy * b.invM) * dt;
    b.w += b.torque * b.invI * dt;
    const ld = 1 / (1 + b.linDamp * dt);
    b.vx *= ld; b.vy *= ld;
    b.w *= 1 / (1 + b.angDamp * dt);
    b.fx = 0; b.fy = 0; b.torque = 0;
  }

  // ── 2 · broadphase: spatial hash, pairs in deterministic order ───
  const hash = new SpatialHash<RigidBody>(rw.cellSize);
  const indexOf = new Map<RigidBody, number>();
  for (let k = 0; k < bodies.length; k++) {
    hash.insert(bodies[k], bodyAABB(bodies[k]));
    indexOf.set(bodies[k], k);
  }
  const manifolds: SolveManifold[] = [];
  const seen = new Set<number>();
  // Joint-connected bodies never collide with each other (Box2D convention —
  // a pinned wheel must not grind against its own anchor).
  const jointed = new Set<number>();
  for (const j of rw.joints) {
    const lo = Math.min(j.a, j.b), hi = Math.max(j.a, j.b);
    jointed.add(lo * 1048576 + hi);
  }
  for (let k = 0; k < bodies.length; k++) {
    const a = bodies[k];
    const near = hash.query(bodyAABB(a));
    for (const b of near) {
      if (b.id <= a.id) continue;
      const packed = a.id * 1048576 + b.id;
      if (seen.has(packed)) continue;
      seen.add(packed);
      if (jointed.has(packed)) continue;
      if (!canCollide(a, b)) continue;
      // Skip unless at least one side is an AWAKE mover — this is what lets a
      // settled stack truly freeze (a sleeping box on a static floor gets no
      // solver impulses at all).
      const activeA = !a.sleeping && a.kind !== 'static';
      const activeB = !b.sleeping && b.kind !== 'static';
      if (!activeA && !activeB) continue;
      const m = collide(a, b);
      if (!m) continue;
      // Wake a sleeper hit by something moving.
      const wakeIf = (s: RigidBody, o: RigidBody) => {
        if (s.sleeping && (o.vx * o.vx + o.vy * o.vy > WAKE_LIN2 || o.kind === 'kinematic')) wakeBody(s);
      };
      wakeIf(a, b); wakeIf(b, a);
      if (a.sensor || b.sensor) {
        events.push({ a: a.id, b: b.id, px: m.points[0].px, py: m.points[0].py, nx: m.nx, ny: m.ny, impulse: 0, sensor: true });
        continue;
      }
      // Pre-step: effective masses, restitution capture, warm start.
      const sp: SolvePoint[] = [];
      const tx = -m.ny, ty = m.nx;
      for (const p of m.points) {
        const rax = p.px - a.x, ray = p.py - a.y;
        const rbx = p.px - b.x, rby = p.py - b.y;
        const crossAN = rax * m.ny - ray * m.nx;
        const crossBN = rbx * m.ny - rby * m.nx;
        const kn = a.invM + b.invM + a.invI * crossAN * crossAN + b.invI * crossBN * crossBN;
        const crossAT = rax * ty - ray * tx;
        const crossBT = rbx * ty - rby * tx;
        const kt = a.invM + b.invM + a.invI * crossAT * crossAT + b.invI * crossBT * crossBT;
        // Approach speed for restitution (captured before solving).
        const vrx = b.vx - b.w * rby - a.vx + a.w * ray;
        const vry = b.vy + b.w * rbx - a.vy - a.w * rax;
        const vn = vrx * m.nx + vry * m.ny;
        const e = Math.max(a.restitution, b.restitution);
        const key = `${a.id}:${b.id}:${p.feature}`;
        const warm = rw.warm[key];
        const sp1: SolvePoint = {
          rax, ray, rbx, rby, pen: p.pen,
          massN: kn > 1e-12 ? 1 / kn : 0,
          massT: kt > 1e-12 ? 1 / kt : 0,
          restBias: vn < -REST_THRESHOLD ? -e * vn : 0,
          posBias: (BIAS / dt) * Math.max(0, p.pen - SLOP),
          pn: warm ? warm[0] : 0,
          pt: warm ? warm[1] : 0,
          pb: 0,
          key,
        };
        sp.push(sp1);
      }
      manifolds.push({ m, ia: k, ib: indexOf.get(b)!, points: sp, friction: Math.sqrt(a.friction * b.friction) });
    }
  }

  // Warm-start pass — applied only AFTER every point captured its clean
  // approach velocity. Interleaving capture with application double-counts
  // restitution (the bounce target re-adds speed warm-starting already
  // reversed) and pumps energy into resting piles.
  for (const sm of manifolds) {
    const { a, b, nx, ny } = sm.m;
    const tx = -ny, ty = nx;
    for (const p of sm.points) {
      if (p.pn === 0 && p.pt === 0) continue;
      const ix = nx * p.pn + tx * p.pt;
      const iy = ny * p.pn + ty * p.pt;
      a.vx -= ix * a.invM; a.vy -= iy * a.invM;
      a.w -= (p.rax * iy - p.ray * ix) * a.invI;
      b.vx += ix * b.invM; b.vy += iy * b.invM;
      b.w += (p.rbx * iy - p.rby * ix) * b.invI;
    }
  }

  // Solve in SUPPORT ORDER — static pairs first, then bottom-up (larger y
  // first in y-down coords). Sequential impulse converges a resting pile in
  // far fewer iterations when impulses propagate up the support chain.
  // Deterministic: ties break on (a.id, b.id).
  manifolds.sort((p, q) => {
    const ps = p.m.a.invM === 0 || p.m.b.invM === 0 ? 0 : 1;
    const qs = q.m.a.invM === 0 || q.m.b.invM === 0 ? 0 : 1;
    if (ps !== qs) return ps - qs;
    const py = Math.max(p.m.a.y, p.m.b.y), qy = Math.max(q.m.a.y, q.m.b.y);
    if (py !== qy) return qy - py;
    if (p.m.a.id !== q.m.a.id) return p.m.a.id - q.m.a.id;
    return p.m.b.id - q.m.b.id;
  });

  // Pseudo-velocity fields for split-impulse position recovery (scratch —
  // never serialized, discarded at the end of the step).
  const bvx = new Float64Array(bodies.length);
  const bvy = new Float64Array(bodies.length);
  const bw = new Float64Array(bodies.length);

  // ── 3 · velocity iterations: joints then contacts ────────────────
  const jointScratch = rw.joints.map(() => ({ motorImpulse: 0 }));
  for (let iter = 0; iter < rw.iterations; iter++) {
    for (let jk = 0; jk < rw.joints.length; jk++) {
      const j = rw.joints[jk];
      const A = getBody(rw, j.a), B = getBody(rw, j.b);
      if (!A || !B) continue;
      if (A.sleeping && B.sleeping) continue;
      if (A.sleeping) wakeBody(A);
      if (B.sleeping) wakeBody(B);
      solveJoint(j, A, B, dt, jointScratch[jk]);
    }
    for (const sm of manifolds) {
      const { a, b, nx, ny } = sm.m;
      const { ia, ib } = sm;
      const tx = -ny, ty = nx;
      for (const p of sm.points) {
        // Normal impulse (real velocities; restitution target only).
        let vrx = b.vx - b.w * p.rby - a.vx + a.w * p.ray;
        let vry = b.vy + b.w * p.rbx - a.vy - a.w * p.rax;
        const vn = vrx * nx + vry * ny;
        let dPn = p.massN * (p.restBias - vn);
        const pn0 = p.pn;
        p.pn = Math.max(pn0 + dPn, 0);
        dPn = p.pn - pn0;
        let ix = nx * dPn, iy = ny * dPn;
        a.vx -= ix * a.invM; a.vy -= iy * a.invM;
        a.w -= (p.rax * iy - p.ray * ix) * a.invI;
        b.vx += ix * b.invM; b.vy += iy * b.invM;
        b.w += (p.rbx * iy - p.rby * ix) * b.invI;
        // Friction impulse (clamped by the friction cone).
        vrx = b.vx - b.w * p.rby - a.vx + a.w * p.ray;
        vry = b.vy + b.w * p.rbx - a.vy - a.w * p.rax;
        const vt = vrx * tx + vry * ty;
        let dPt = p.massT * -vt;
        const maxPt = sm.friction * p.pn;
        const pt0 = p.pt;
        p.pt = Math.min(Math.max(pt0 + dPt, -maxPt), maxPt);
        dPt = p.pt - pt0;
        ix = tx * dPt; iy = ty * dPt;
        a.vx -= ix * a.invM; a.vy -= iy * a.invM;
        a.w -= (p.rax * iy - p.ray * ix) * a.invI;
        b.vx += ix * b.invM; b.vy += iy * b.invM;
        b.w += (p.rbx * iy - p.rby * ix) * b.invI;
        // Split-impulse penetration recovery (pseudo velocities → position
        // only; no kinetic energy enters the sim).
        if (p.posBias > 0) {
          const vbn = (bvx[ib] - bw[ib] * p.rby - bvx[ia] + bw[ia] * p.ray) * nx
                    + (bvy[ib] + bw[ib] * p.rbx - bvy[ia] - bw[ia] * p.rax) * ny;
          let dPb = p.massN * (p.posBias - vbn);
          const pb0 = p.pb;
          p.pb = Math.max(pb0 + dPb, 0);
          dPb = p.pb - pb0;
          const bix = nx * dPb, biy = ny * dPb;
          // Linear-only pseudo push: rotating positions without refreshing
          // manifolds amplifies stack rocking, so pseudo torque stays off.
          bvx[ia] -= bix * a.invM; bvy[ia] -= biy * a.invM;
          bvx[ib] += bix * b.invM; bvy[ib] += biy * b.invM;
        }
      }
    }
  }

  // ── 4 · integrate positions (real + pseudo velocity; pseudo dies) ─
  const preX: number[] = [], preY: number[] = [];
  for (let k = 0; k < bodies.length; k++) {
    const b = bodies[k];
    preX.push(b.x); preY.push(b.y);
    if (b.invM === 0 && b.kind !== 'kinematic') continue;
    if (b.sleeping) continue;
    b.x += (b.vx + bvx[k]) * dt;
    b.y += (b.vy + bvy[k]) * dt;
    b.a += (b.w + bw[k]) * dt;
  }

  // ── 5 · bullet CCD (swept circle vs everything it can hit) ───────
  for (let k = 0; k < bodies.length; k++) {
    const b = bodies[k];
    if (!b.bullet || b.shape.kind !== 'circle' || b.sleeping) continue;
    const dx = b.x - preX[k], dy = b.y - preY[k];
    if (dx * dx + dy * dy < 1) continue;
    let bestT = 1;
    for (let q = 0; q < bodies.length; q++) {
      const o = bodies[q];
      if (o === b || o.bullet || o.sensor || !canCollide(b, o)) continue;
      const t = sweepCircle(preX[k], preY[k], dx, dy, b.shape.r, o);
      if (t >= 0 && t < bestT) bestT = t;
    }
    if (bestT < 1) {
      // Stop just PAST the impact time: a sub-slop penetration must exist or
      // the discrete narrowphase (pen > 0) never sees a contact, and the body
      // hangs on the surface accumulating gravity velocity forever.
      const len = dhypot(dx, dy) || 1;
      b.x = preX[k] + dx * bestT + (dx / len) * 0.4;
      b.y = preY[k] + dy * bestT + (dy / len) * 0.4;
      // leave velocity intact — next step's contact solve applies restitution.
    }
  }

  // ── 6 · sleeping — ISLAND-atomic (a pile sleeps as one, or not at all) ─
  // Union-find over dynamic–dynamic contacts and joints; static bodies do
  // not conduct (two piles on one floor are separate islands).
  const touching = new Set<number>();
  const parent: number[] = [];
  for (let k = 0; k < bodies.length; k++) parent.push(k);
  const find = (x: number): number => {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
    return x;
  };
  const union = (x: number, y: number) => { parent[find(x)] = find(y); };
  for (const sm of manifolds) {
    touching.add(sm.m.a.id); touching.add(sm.m.b.id);
    if (sm.m.a.kind === 'dynamic' && sm.m.b.kind === 'dynamic') union(sm.ia, sm.ib);
  }
  for (const j of rw.joints) {
    touching.add(j.a); touching.add(j.b);
    const A = getBody(rw, j.a), B = getBody(rw, j.b);
    if (A?.kind === 'dynamic' && B?.kind === 'dynamic') union(indexOf.get(A)!, indexOf.get(B)!);
  }
  // Per-body calm clocks (a solver-injected velocity also re-wakes a sleeper).
  for (let k = 0; k < bodies.length; k++) {
    const b = bodies[k];
    if (b.kind !== 'dynamic') continue;
    const lin2 = b.vx * b.vx + b.vy * b.vy;
    if (b.sleeping) {
      if (lin2 > WAKE_LIN2) wakeBody(b);
      continue;
    }
    if (!b.canSleep || !touching.has(b.id)) { b.sleepTime = 0; continue; }
    b.sleepTime = lin2 < SLEEP_LIN2 && Math.abs(b.w) * b.sleepR < SLEEP_RIM ? b.sleepTime + dt : 0;
  }
  // An island sleeps when EVERY member has been calm long enough.
  const islandMin = new Map<number, number>();
  for (let k = 0; k < bodies.length; k++) {
    const b = bodies[k];
    if (b.kind !== 'dynamic' || b.sleeping) continue;
    const root = find(k);
    const t = !b.canSleep || !touching.has(b.id) ? -1 : b.sleepTime;
    const cur = islandMin.get(root);
    islandMin.set(root, cur === undefined ? t : Math.min(cur, t));
  }
  for (let k = 0; k < bodies.length; k++) {
    const b = bodies[k];
    if (b.kind !== 'dynamic' || b.sleeping) continue;
    if ((islandMin.get(find(k)) ?? -1) >= TIME_TO_SLEEP) {
      b.sleeping = true;
      b.vx = 0; b.vy = 0; b.w = 0;
    }
  }

  // ── 7 · contact events + rebuild the warm cache ──────────────────
  const warm: Record<string, [number, number]> = {};
  for (const sm of manifolds) {
    let total = 0;
    for (const p of sm.points) {
      total += p.pn;
      if (p.pn !== 0 || p.pt !== 0) warm[p.key] = [p.pn, p.pt];
    }
    const p0 = sm.m.points[0];
    events.push({
      a: sm.m.a.id, b: sm.m.b.id, px: p0.px, py: p0.py,
      nx: sm.m.nx, ny: sm.m.ny, impulse: total, sensor: false,
    });
  }
  rw.warm = warm;
  return events;
}

/** Earliest t∈[0,1] where a circle swept along (dx,dy) first touches body o, or -1. */
function sweepCircle(x0: number, y0: number, dx: number, dy: number, r: number, o: RigidBody): number {
  if (o.shape.kind === 'circle') {
    return sweepVsCircle(x0, y0, dx, dy, o.x, o.y, r + o.shape.r);
  }
  // Poly: Minkowski sum = edges offset outward by r + vertex circles of radius r.
  const wp = worldPoints(o);
  const n = wp.length / 2;
  let best = -1;
  for (let k = 0; k < n; k++) {
    const j = (k + 1) % n;
    const ax = wp[k * 2], ay = wp[k * 2 + 1];
    const bx = wp[j * 2], by = wp[j * 2 + 1];
    const ex = bx - ax, ey = by - ay;
    const len = dhypot(ex, ey) || 1;
    const nx = ey / len, ny = -ex / len;
    // Offset edge segment — only FRONT-side crossings count (motion into the
    // face); an exit crossing from inside the hull is not a hit, or a bullet
    // could pin itself against a platform it launches from.
    if (dx * nx + dy * ny < 0) {
      const t = sweepVsSegment(x0, y0, dx, dy, ax + nx * r, ay + ny * r, bx + nx * r, by + ny * r);
      if (t >= 0 && (best < 0 || t < best)) best = t;
    }
    // Vertex circle.
    const tv = sweepVsCircle(x0, y0, dx, dy, ax, ay, r);
    if (tv >= 0 && (best < 0 || tv < best)) best = tv;
  }
  return best;
}

function sweepVsCircle(x0: number, y0: number, dx: number, dy: number, cx: number, cy: number, R: number): number {
  const fx = x0 - cx, fy = y0 - cy;
  const a = dx * dx + dy * dy;
  if (a < 1e-12) return -1;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - R * R;
  if (c < 0) return -1; // already overlapping — let the contact solver handle it
  const disc = b * b - 4 * a * c;
  if (disc < 0) return -1;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : -1;
}

function sweepVsSegment(x0: number, y0: number, dx: number, dy: number, ax: number, ay: number, bx: number, by: number): number {
  const ex = bx - ax, ey = by - ay;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-12) return -1;
  const t = ((ax - x0) * ey - (ay - y0) * ex) / denom;
  const s = ((ax - x0) * dy - (ay - y0) * dx) / denom;
  return t >= 0 && t <= 1 && s >= 0 && s <= 1 ? t : -1;
}

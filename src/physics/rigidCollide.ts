// Narrowphase collision for rigid bodies: circle–circle, circle–poly, and
// poly–poly (SAT + reference-face clipping, Box2D-lite style). Produces
// contact manifolds with STABLE feature ids so the solver can warm-start.
// Pure functions; deterministic tie-breaks everywhere.

import { dhypot } from '../core/dmath';
import type { RigidBody } from './rigidBody';
import { worldPoints } from './rigidBody';

export interface ContactPoint {
  px: number; py: number;    // world contact point
  pen: number;               // penetration depth (>0 means overlapping)
  feature: number;           // stable id for warm starting
  // solver scratch (accumulated impulses live in the warm cache, not here)
}

export interface Manifold {
  a: RigidBody;
  b: RigidBody;
  nx: number; ny: number;    // contact normal, from A toward B
  points: ContactPoint[];    // 1..2
}

function collideCircles(a: RigidBody, b: RigidBody): Manifold | null {
  if (a.shape.kind !== 'circle' || b.shape.kind !== 'circle') return null;
  const dx = b.x - a.x, dy = b.y - a.y;
  const rsum = a.shape.r + b.shape.r;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rsum * rsum) return null;
  const d = Math.sqrt(d2);
  // Coincident centers: deterministic fallback normal.
  const nx = d > 1e-9 ? dx / d : 1, ny = d > 1e-9 ? dy / d : 0;
  return {
    a, b, nx, ny,
    points: [{ px: a.x + nx * a.shape.r, py: a.y + ny * a.shape.r, pen: rsum - d, feature: 0 }],
  };
}

/** Circle B against polygon A. Returns manifold with normal A→B. */
function collidePolyCircle(a: RigidBody, b: RigidBody): Manifold | null {
  if (a.shape.kind !== 'poly' || b.shape.kind !== 'circle') return null;
  const wp = worldPoints(a);
  const n = wp.length / 2;
  const r = b.shape.r;
  // Find the face with max separation of the circle center.
  let bestSep = -Infinity, bestI = 0;
  for (let k = 0; k < n; k++) {
    const j = (k + 1) % n;
    const ex = wp[j * 2] - wp[k * 2], ey = wp[j * 2 + 1] - wp[k * 2 + 1];
    const len = dhypot(ex, ey) || 1;
    const nx = ey / len, ny = -ex / len; // outward for CCW in y-down coords
    const sep = (b.x - wp[k * 2]) * nx + (b.y - wp[k * 2 + 1]) * ny;
    if (sep > bestSep) { bestSep = sep; bestI = k; }
  }
  if (bestSep > r) return null;
  const k = bestI, j = (bestI + 1) % n;
  const ax = wp[k * 2], ay = wp[k * 2 + 1], bx2 = wp[j * 2], by2 = wp[j * 2 + 1];
  if (bestSep < 1e-9) {
    // Center inside the poly: push out along the deepest face normal.
    const ex = bx2 - ax, ey = by2 - ay;
    const len = dhypot(ex, ey) || 1;
    const nx = ey / len, ny = -ex / len;
    return { a, b, nx, ny, points: [{ px: b.x - nx * r, py: b.y - ny * r, pen: r - bestSep, feature: bestI }] };
  }
  // Closest point on the face segment (vertex regions included).
  const ex = bx2 - ax, ey = by2 - ay;
  const e2 = ex * ex + ey * ey || 1;
  let t = ((b.x - ax) * ex + (b.y - ay) * ey) / e2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + ex * t, cy = ay + ey * t;
  const dx = b.x - cx, dy = b.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  const d = Math.sqrt(d2) || 1e-9;
  const nx = dx / d, ny = dy / d;
  return { a, b, nx, ny, points: [{ px: cx, py: cy, pen: r - d, feature: bestI }] };
}

/** Max separation of B's hull from A's faces; returns [separation, faceIndex]. */
function maxSeparation(wpA: number[], wpB: number[]): [number, number] {
  const nA = wpA.length / 2, nB = wpB.length / 2;
  let best = -Infinity, bestI = 0;
  for (let k = 0; k < nA; k++) {
    const j = (k + 1) % nA;
    const ex = wpA[j * 2] - wpA[k * 2], ey = wpA[j * 2 + 1] - wpA[k * 2 + 1];
    const len = dhypot(ex, ey) || 1;
    const nx = ey / len, ny = -ex / len;
    // Deepest point of B along this face normal.
    let minDot = Infinity;
    for (let v = 0; v < nB; v++) {
      const d = (wpB[v * 2] - wpA[k * 2]) * nx + (wpB[v * 2 + 1] - wpA[k * 2 + 1]) * ny;
      if (d < minDot) minDot = d;
    }
    if (minDot > best) { best = minDot; bestI = k; }
  }
  return [best, bestI];
}

function collidePolys(a: RigidBody, b: RigidBody): Manifold | null {
  const wpA = worldPoints(a), wpB = worldPoints(b);
  const [sepA, faceA] = maxSeparation(wpA, wpB);
  if (sepA > 0) return null;
  const [sepB, faceB] = maxSeparation(wpB, wpA);
  if (sepB > 0) return null;

  // Reference poly: the one with the larger (less negative) separation.
  // Deterministic bias toward A on near-ties.
  let ref: number[], inc: number[], refFace: number, flip: boolean;
  if (sepB > sepA + 1e-4) { ref = wpB; inc = wpA; refFace = faceB; flip = true; }
  else { ref = wpA; inc = wpB; refFace = faceA; flip = false; }

  const nRef = ref.length / 2, nInc = inc.length / 2;
  const rj = (refFace + 1) % nRef;
  const rex = ref[rj * 2] - ref[refFace * 2], rey = ref[rj * 2 + 1] - ref[refFace * 2 + 1];
  const rlen = dhypot(rex, rey) || 1;
  const rnx = rey / rlen, rny = -rex / rlen;       // reference face normal (outward)
  const rtx = rex / rlen, rty = rey / rlen;        // reference face tangent

  // Incident face: most anti-parallel to the reference normal.
  let incFace = 0, minDot = Infinity;
  for (let k = 0; k < nInc; k++) {
    const j = (k + 1) % nInc;
    const ex = inc[j * 2] - inc[k * 2], ey = inc[j * 2 + 1] - inc[k * 2 + 1];
    const len = dhypot(ex, ey) || 1;
    const d = (ey / len) * rnx + (-ex / len) * rny;
    if (d < minDot) { minDot = d; incFace = k; }
  }
  const ij = (incFace + 1) % nInc;
  // Two incident vertices; the feature id is (flip, refFace, slot) — NOT the
  // clip state. Clip-state ids churn every frame while a stack micro-rocks,
  // which mis-applies warm-start impulses and pumps energy into the pile.
  let v1x = inc[incFace * 2], v1y = inc[incFace * 2 + 1];
  let v2x = inc[ij * 2], v2y = inc[ij * 2 + 1];

  // Clip against the two side planes of the reference face.
  const refX = ref[refFace * 2], refY = ref[refFace * 2 + 1];
  const refX2 = ref[rj * 2], refY2 = ref[rj * 2 + 1];
  // Side 1: keep t >= 0 along tangent from refV1; Side 2: keep t <= faceLen.
  for (let side = 0; side < 2; side++) {
    const ox = side === 0 ? refX : refX2, oy = side === 0 ? refY : refY2;
    const sx = side === 0 ? rtx : -rtx, sy = side === 0 ? rty : -rty;
    const d1 = (v1x - ox) * sx + (v1y - oy) * sy;
    const d2 = (v2x - ox) * sx + (v2y - oy) * sy;
    if (d1 < 0 && d2 < 0) return null; // fully clipped (shouldn't happen on overlap)
    if (d1 < 0) {
      const t = d1 / (d1 - d2);
      v1x = v1x + (v2x - v1x) * t; v1y = v1y + (v2y - v1y) * t;
    } else if (d2 < 0) {
      const t = d2 / (d2 - d1);
      v2x = v2x + (v1x - v2x) * t; v2y = v2y + (v1y - v2y) * t;
    }
  }

  // Keep points behind the reference face; normal must point A→B.
  const nx = flip ? -rnx : rnx, ny = flip ? -rny : rny;
  const points: ContactPoint[] = [];
  const pen1 = -((v1x - refX) * rnx + (v1y - refY) * rny);
  const pen2 = -((v2x - refX) * rnx + (v2y - refY) * rny);
  // Feature id = (flip, refFace, incFace, slot). Stable while the same two
  // faces stay in contact (micro-rocking stacks reuse warm impulses), but
  // fresh whenever a tumbling box rolls onto its next corner (stale impulses
  // at new lever arms would pump energy).
  const fid = ((flip ? 1 : 0) * 64 + refFace) * 64 + incFace;
  if (pen1 > 0) points.push({ px: v1x, py: v1y, pen: pen1, feature: fid * 2 });
  if (pen2 > 0) points.push({ px: v2x, py: v2y, pen: pen2, feature: fid * 2 + 1 });
  if (points.length === 0) return null;
  return { a, b, nx, ny, points };
}

/** Dispatch on shape kinds. Normal always points from A toward B. */
export function collide(a: RigidBody, b: RigidBody): Manifold | null {
  const ka = a.shape.kind, kb = b.shape.kind;
  if (ka === 'circle' && kb === 'circle') return collideCircles(a, b);
  if (ka === 'poly' && kb === 'poly') return collidePolys(a, b);
  if (ka === 'poly' && kb === 'circle') return collidePolyCircle(a, b);
  // circle vs poly: flip so poly is A, then invert the normal back.
  const m = collidePolyCircle(b, a);
  if (!m) return null;
  return { a, b, nx: -m.nx, ny: -m.ny, points: m.points };
}

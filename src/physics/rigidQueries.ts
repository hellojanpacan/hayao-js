// Spatial queries against rigid bodies: point tests and raycasts.
// Pure functions; results are deterministic (bodies scanned in array order).

import { dhypot } from '../core/dmath';
import type { RigidBody, RigidWorld } from './rigidBody';
import { worldPoints } from './rigidBody';

export interface RigidRayHit {
  id: number;
  t: number;                  // fraction along the ray [0,1]
  x: number; y: number;       // hit point
  nx: number; ny: number;     // surface normal
}

/** Is a world point inside this body's shape? */
export function bodyContains(b: RigidBody, x: number, y: number): boolean {
  if (b.shape.kind === 'circle') {
    const dx = x - b.x, dy = y - b.y;
    return dx * dx + dy * dy <= b.shape.r * b.shape.r;
  }
  const wp = worldPoints(b);
  const n = wp.length / 2;
  for (let k = 0; k < n; k++) {
    const j = (k + 1) % n;
    const ex = wp[j * 2] - wp[k * 2], ey = wp[j * 2 + 1] - wp[k * 2 + 1];
    if ((x - wp[k * 2]) * ey - (y - wp[k * 2 + 1]) * ex > 0) return false;
  }
  return true;
}

/** First body containing the point (topmost = last added wins ties via scan order). */
export function pointQuery(rw: RigidWorld, x: number, y: number, mask = 0xffff): RigidBody | undefined {
  let hit: RigidBody | undefined;
  for (const b of rw.bodies) if ((b.layer & mask) !== 0 && bodyContains(b, x, y)) hit = b;
  return hit;
}

function rayCircle(x0: number, y0: number, dx: number, dy: number, cx: number, cy: number, r: number): number {
  const fx = x0 - cx, fy = y0 - cy;
  const a = dx * dx + dy * dy;
  if (a < 1e-12) return -1;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return -1;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : -1;
}

/** Closest hit along the segment (x0,y0)→(x1,y1), or null. */
export function rayCastRigid(rw: RigidWorld, x0: number, y0: number, x1: number, y1: number, mask = 0xffff): RigidRayHit | null {
  const dx = x1 - x0, dy = y1 - y0;
  let best: RigidRayHit | null = null;
  for (const b of rw.bodies) {
    if ((b.layer & mask) === 0) continue;
    if (b.shape.kind === 'circle') {
      const t = rayCircle(x0, y0, dx, dy, b.x, b.y, b.shape.r);
      if (t >= 0 && (!best || t < best.t)) {
        const hx = x0 + dx * t, hy = y0 + dy * t;
        const len = dhypot(hx - b.x, hy - b.y) || 1;
        best = { id: b.id, t, x: hx, y: hy, nx: (hx - b.x) / len, ny: (hy - b.y) / len };
      }
      continue;
    }
    const wp = worldPoints(b);
    const n = wp.length / 2;
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      const ax = wp[k * 2], ay = wp[k * 2 + 1];
      const ex = wp[j * 2] - ax, ey = wp[j * 2 + 1] - ay;
      const denom = dx * ey - dy * ex;
      if (Math.abs(denom) < 1e-12) continue;
      const t = ((ax - x0) * ey - (ay - y0) * ex) / denom;
      const s = ((ax - x0) * dy - (ay - y0) * dx) / denom;
      if (t < 0 || t > 1 || s < 0 || s > 1) continue;
      if (!best || t < best.t) {
        const len = dhypot(ex, ey) || 1;
        best = { id: b.id, t, x: x0 + dx * t, y: y0 + dy * t, nx: ey / len, ny: -ex / len };
      }
    }
  }
  return best;
}

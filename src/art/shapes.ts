// Procedural vector shape builders — the "code-as-art" toolkit. All pure and
// deterministic (any randomness must be passed an Rng), producing point arrays
// or SVG path strings usable directly in a Sprite.

import type { Rng } from '../core/rng';
import { TAU, type Vec2 } from '../core/math';

/** Regular polygon points (flat [x,y,…]) centered at origin. */
export function regularPolygon(sides: number, radius: number, rotation = 0): number[] {
  const pts: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i / sides) * TAU;
    pts.push(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  return pts;
}

/** Star with alternating outer/inner radii. */
export function star(points: number, outer: number, inner: number, rotation = -Math.PI / 2): number[] {
  const pts: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i / (points * 2)) * TAU;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  return pts;
}

/** An organic blob outline as an SVG path (deterministic given the Rng). */
export function blobPath(rng: Rng, radius: number, wobble = 0.25, lobes = 7): string {
  const pts: Vec2[] = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * TAU;
    const r = radius * (1 - wobble + rng.float() * wobble * 2);
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return smoothClosedPath(pts);
}

/** Convert a point list into a smooth closed path (Catmull-Rom → cubic Bézier). */
export function smoothClosedPath(points: Vec2[], tension = 1): string {
  const nPts = points.length;
  if (nPts < 3) return '';
  const p = (i: number) => points[((i % nPts) + nPts) % nPts];
  const r = (v: number) => Math.round(v * 100) / 100;
  let d = `M ${r(p(0).x)} ${r(p(0).y)}`;
  for (let i = 0; i < nPts; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${r(c1x)} ${r(c1y)}, ${r(c2x)} ${r(c2y)}, ${r(p2.x)} ${r(p2.y)}`;
  }
  return d + ' Z';
}

/** Smooth open path through points (for trails, curves). */
export function smoothOpenPath(points: Vec2[], tension = 1): string {
  const nPts = points.length;
  if (nPts < 2) return '';
  const r = (v: number) => Math.round(v * 100) / 100;
  let d = `M ${r(points[0].x)} ${r(points[0].y)}`;
  for (let i = 0; i < nPts - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(nPts - 1, i + 2)];
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C ${r(c1x)} ${r(c1y)}, ${r(c2x)} ${r(c2y)}, ${r(p2.x)} ${r(p2.y)}`;
  }
  return d;
}

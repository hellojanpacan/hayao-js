// 2D shadow geometry: turn occluder segments + a light into the shadow quads
// the lighting run erases the pool with. Pure functions over plain data (house
// style) — the quads are part of the DETERMINISTIC light set every backend
// sees, so extrusion routes through dmath (`dhypot`) for bit-identical results.
//
// A shadow volume per segment: extrude both endpoints away from the light by
// E = 2×radius (far enough to leave the lit disc), forming a closed quad
// [a, b, b', a'] where p' = p + normalize(p − L)·E. O(lights × culled segments);
// back-face culling (skip segments facing away from the light) is a noted
// follow-up — the current set over-draws hidden segments but is never wrong.

import { dhypot } from '../core/dmath';
import type { Vec2 } from '../core/math';
import { marchingSquaresContours, type ContourSegment } from '../art/autotile';
import { TILE, tileAt, type TilemapData } from '../physics/tilemap';

/** An occluder edge in world (design-space) coordinates. */
export type Occluder = ContourSegment;

/**
 * Occluder edges from a tilemap: the marching-squares contour of the SOLID
 * cells, in design-space px. Wraps `marchingSquaresContours` over a boolean
 * grid of `tileAt === TILE.SOLID`, scaled by the map's tileSize.
 */
export function occludersFromTilemap(map: TilemapData): Occluder[] {
  const grid: boolean[][] = [];
  for (let ty = 0; ty < map.rows; ty++) {
    const row: boolean[] = [];
    for (let tx = 0; tx < map.cols; tx++) row.push(tileAt(map, tx, ty) === TILE.SOLID);
    grid.push(row);
  }
  return marchingSquaresContours(grid, { cell: map.tileSize });
}

/**
 * Cull occluders to those that can matter for a light: an endpoint within, or
 * the segment straddling, the light's reach (radius). A cheap circle/AABB-ish
 * test — keeps the O(lights × segments) shadow pass tight without changing the
 * result (a segment fully outside the disc casts no shadow inside it).
 */
export function cullSegments(light: Vec2, radius: number, segs: readonly Occluder[]): Occluder[] {
  const out: Occluder[] = [];
  const r2 = radius * radius;
  for (const s of segs) {
    const dax = s.a.x - light.x;
    const day = s.a.y - light.y;
    const dbx = s.b.x - light.x;
    const dby = s.b.y - light.y;
    const da2 = dax * dax + day * day;
    const db2 = dbx * dbx + dby * dby;
    // Keep if either endpoint is in reach, or the segment crosses the disc
    // (closest point on the segment to the light is within radius).
    if (da2 <= r2 || db2 <= r2 || closestDist2(light, s) <= r2) out.push(s);
  }
  return out;
}

/** Squared distance from a point to a segment (deterministic — pure arithmetic). */
function closestDist2(p: Vec2, s: Occluder): number {
  const ex = s.b.x - s.a.x;
  const ey = s.b.y - s.a.y;
  const len2 = ex * ex + ey * ey;
  if (len2 === 0) {
    const dx = p.x - s.a.x;
    const dy = p.y - s.a.y;
    return dx * dx + dy * dy;
  }
  let t = ((p.x - s.a.x) * ex + (p.y - s.a.y) * ey) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = s.a.x + ex * t;
  const cy = s.a.y + ey * t;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return dx * dx + dy * dy;
}

/**
 * Shadow quads cast by `segs` from `light`, one flat `[ax,ay, bx,by, bx',by',
 * ax',ay']` quad per segment (closed poly winding). Extrusion length is 2×radius
 * so the far edge always clears the lit disc. A segment passing through the light
 * (degenerate direction) is skipped. Culling is the caller's job (`cullSegments`).
 */
export function shadowQuads(light: Vec2, radius: number, segs: readonly Occluder[]): number[][] {
  const E = 2 * radius;
  const quads: number[][] = [];
  for (const s of segs) {
    const ax = s.a.x;
    const ay = s.a.y;
    const bx = s.b.x;
    const by = s.b.y;
    const adx = ax - light.x;
    const ady = ay - light.y;
    const bdx = bx - light.x;
    const bdy = by - light.y;
    const al = dhypot(adx, ady);
    const bl = dhypot(bdx, bdy);
    if (al === 0 || bl === 0) continue; // endpoint on the light: no direction to extrude
    const aex = ax + (adx / al) * E;
    const aey = ay + (ady / al) * E;
    const bex = bx + (bdx / bl) * E;
    const bey = by + (bdy / bl) * E;
    quads.push([ax, ay, bx, by, bex, bey, aex, aey]);
  }
  return quads;
}

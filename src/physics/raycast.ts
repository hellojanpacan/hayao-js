// Grid raycasting (DDA) over a tilemap — the sight primitive behind stealth
// vision cones, sentry line-of-sight, roguelike FOV, and 2D lighting.

import { dcos, dhypot } from '../core/dmath';
import { TILE, tileAt, type TilemapData } from './tilemap';

export interface RayHit {
  /** True if a solid tile stopped the ray before reaching (x1, y1). */
  blocked: boolean;
  /** Where the ray stopped (the hit point, or the target if unblocked). */
  x: number;
  y: number;
  /** Distance travelled. */
  dist: number;
}

/**
 * March a ray from (x0,y0) toward (x1,y1) through the tile grid (DDA — exact,
 * no step-size tuning). SOLID tiles block; everything else passes.
 */
export function raycastTiles(map: TilemapData, x0: number, y0: number, x1: number, y1: number): RayHit {
  const ts = map.tileSize;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const maxDist = dhypot(dx, dy);
  if (maxDist === 0) return { blocked: false, x: x1, y: y1, dist: 0 };
  const dirX = dx / maxDist;
  const dirY = dy / maxDist;

  let tx = Math.floor(x0 / ts);
  let ty = Math.floor(y0 / ts);
  const stepX = dirX > 0 ? 1 : -1;
  const stepY = dirY > 0 ? 1 : -1;
  const tDeltaX = dirX !== 0 ? Math.abs(ts / dirX) : Infinity;
  const tDeltaY = dirY !== 0 ? Math.abs(ts / dirY) : Infinity;
  let tMaxX = dirX !== 0 ? (dirX > 0 ? (tx + 1) * ts - x0 : x0 - tx * ts) / Math.abs(dirX) : Infinity;
  let tMaxY = dirY !== 0 ? (dirY > 0 ? (ty + 1) * ts - y0 : y0 - ty * ts) / Math.abs(dirY) : Infinity;

  let t = 0;
  // The starting tile never blocks (the caster stands in it).
  for (let guard = 0; guard < 512; guard++) {
    if (tMaxX < tMaxY) {
      t = tMaxX;
      tMaxX += tDeltaX;
      tx += stepX;
    } else {
      t = tMaxY;
      tMaxY += tDeltaY;
      ty += stepY;
    }
    if (t >= maxDist) return { blocked: false, x: x1, y: y1, dist: maxDist };
    if (tileAt(map, tx, ty) === TILE.SOLID) {
      return { blocked: true, x: x0 + dirX * t, y: y0 + dirY * t, dist: t };
    }
  }
  return { blocked: true, x: x0 + dirX * t, y: y0 + dirY * t, dist: t };
}

/** Can a see b with no solid tile between? */
export function lineOfSight(map: TilemapData, ax: number, ay: number, bx: number, by: number): boolean {
  return !raycastTiles(map, ax, ay, bx, by).blocked;
}

/**
 * Is the target inside a vision cone AND visible? (facing is a unit vector;
 * fov is the FULL cone angle in radians.)
 */
export function inVisionCone(map: TilemapData, ex: number, ey: number, faceX: number, faceY: number, fov: number, range: number, tx: number, ty: number): boolean {
  const dx = tx - ex;
  const dy = ty - ey;
  const d = dhypot(dx, dy);
  if (d > range || d === 0) return false;
  const dot = (dx * faceX + dy * faceY) / d;
  if (dot < dcos(fov / 2)) return false;
  return lineOfSight(map, ex, ey, tx, ty);
}

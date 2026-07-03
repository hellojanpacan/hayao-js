// Kinematic AABB movement against a tilemap plus extra solid rects (moving
// platforms). Axis-separated, analytically clamped to obstacle edges — no
// tunneling, exact and deterministic. Pure functions over plain data.

import type { Rect } from '../core/math';
import { TILE, tileAt, type TilemapData } from './tilemap';

const EPS = 1e-6;

/** An extra solid the body collides with (moving platform, door, crate…). */
export interface SolidRect extends Rect {
  /** Solid only when landing on its top (jump-through platform). */
  oneway?: boolean;
}

export interface MoveResult {
  x: number;
  y: number;
  hitX: boolean;
  hitY: boolean;
  onFloor: boolean;
  onCeiling: boolean;
  onWallLeft: boolean;
  onWallRight: boolean;
  /** Final rect overlaps a HAZARD tile (with a small forgiveness inset). */
  hazard: boolean;
  /** Index into `solids` of the rect the body stands on, or -1. */
  floorSolid: number;
}

const spanTiles = (lo: number, hi: number, ts: number): [number, number] => [Math.floor(lo / ts), Math.floor((hi - EPS) / ts)];

export interface MoveOpts {
  solids?: SolidRect[];
  /** Pass true while the player holds "down" to drop through one-way platforms. */
  dropThrough?: boolean;
}

/** Would a rect at (x, y) overlap any solid geometry? (Used for corner-correction probes.) */
export function rectBlocked(map: TilemapData, x: number, y: number, w: number, h: number, solids: SolidRect[] = []): boolean {
  const ts = map.tileSize;
  const [tx0, tx1] = spanTiles(x, x + w, ts);
  const [ty0, ty1] = spanTiles(y, y + h, ts);
  for (let ty = ty0; ty <= ty1; ty++)
    for (let tx = tx0; tx <= tx1; tx++) if (tileAt(map, tx, ty) === TILE.SOLID) return true;
  for (const s of solids) {
    if (s.oneway) continue;
    if (x < s.x + s.w - EPS && x + w > s.x + EPS && y < s.y + s.h - EPS && y + h > s.y + EPS) return true;
  }
  return false;
}

/**
 * Move a rect by (dx, dy) with axis-separated collision: X first, then Y.
 * One-way surfaces block only downward motion that starts at-or-above their top.
 */
export function moveRect(map: TilemapData, rect: Rect, dx: number, dy: number, opts: MoveOpts = {}): MoveResult {
  const ts = map.tileSize;
  const solids = opts.solids ?? [];
  let { x, y } = rect;
  const { w, h } = rect;
  let hitX = false;
  let hitY = false;
  let onWallLeft = false;
  let onWallRight = false;

  // ── X axis ──
  if (dx !== 0) {
    const [ty0, ty1] = spanTiles(y, y + h, ts);
    if (dx > 0) {
      let limit = x + dx; // furthest allowed left-edge position
      const [c0, c1] = [Math.floor((x + w) / ts), Math.floor((x + w + dx - EPS) / ts)];
      for (let tx = c0; tx <= c1; tx++)
        for (let ty = ty0; ty <= ty1; ty++)
          if (tileAt(map, tx, ty) === TILE.SOLID) limit = Math.min(limit, tx * ts - w);
      for (const s of solids)
        if (!s.oneway && s.y < y + h - EPS && s.y + s.h > y + EPS && s.x >= x + w - EPS) limit = Math.min(limit, s.x - w);
      if (limit < x + dx - EPS) {
        hitX = true;
        onWallRight = true;
      }
      x = Math.min(x + dx, limit);
    } else {
      let limit = x + dx;
      const [c0, c1] = [Math.floor((x - EPS) / ts), Math.floor((x + dx) / ts)];
      for (let tx = c0; tx >= c1; tx--)
        for (let ty = ty0; ty <= ty1; ty++)
          if (tileAt(map, tx, ty) === TILE.SOLID) limit = Math.max(limit, (tx + 1) * ts);
      for (const s of solids)
        if (!s.oneway && s.y < y + h - EPS && s.y + s.h > y + EPS && s.x + s.w <= x + EPS) limit = Math.max(limit, s.x + s.w);
      if (limit > x + dx + EPS) {
        hitX = true;
        onWallLeft = true;
      }
      x = Math.max(x + dx, limit);
    }
  }

  // ── Y axis ──
  const prevBottom = y + h;
  let onFloor = false;
  let onCeiling = false;
  let floorSolid = -1;
  if (dy !== 0) {
    const [tx0, tx1] = spanTiles(x, x + w, ts);
    if (dy > 0) {
      let limit = y + dy; // furthest allowed top position
      const [r0, r1] = [Math.floor(prevBottom / ts), Math.floor((prevBottom + dy - EPS) / ts)];
      for (let ty = r0; ty <= r1; ty++)
        for (let tx = tx0; tx <= tx1; tx++) {
          const t = tileAt(map, tx, ty);
          const blocks = t === TILE.SOLID || (t === TILE.ONEWAY && !opts.dropThrough && prevBottom <= ty * ts + EPS);
          if (blocks) limit = Math.min(limit, ty * ts - h);
        }
      for (let i = 0; i < solids.length; i++) {
        const s = solids[i];
        const inX = s.x < x + w - EPS && s.x + s.w > x + EPS;
        if (!inX || s.y < prevBottom - EPS) continue;
        if (s.oneway && (opts.dropThrough || prevBottom > s.y + EPS)) continue;
        if (s.y - h < limit) {
          limit = s.y - h;
          floorSolid = i;
        }
      }
      if (limit < y + dy - EPS) {
        hitY = true;
        onFloor = true;
      } else floorSolid = -1;
      y = Math.min(y + dy, limit);
    } else {
      let limit = y + dy;
      const [r0, r1] = [Math.floor((y - EPS) / ts), Math.floor((y + dy) / ts)];
      for (let ty = r0; ty >= r1; ty--)
        for (let tx = tx0; tx <= tx1; tx++)
          if (tileAt(map, tx, ty) === TILE.SOLID) limit = Math.max(limit, (ty + 1) * ts);
      for (const s of solids)
        if (!s.oneway && s.x < x + w - EPS && s.x + s.w > x + EPS && s.y + s.h <= y + EPS) limit = Math.max(limit, s.y + s.h);
      if (limit > y + dy + EPS) {
        hitY = true;
        onCeiling = true;
      }
      y = Math.max(y + dy, limit);
    }
  }

  // ── Ground probe (also true when dy was 0 or clamped exactly) ──
  if (!onFloor) {
    const probe = groundAt(map, x, y, w, h, solids, opts.dropThrough ?? false);
    onFloor = probe.grounded;
    floorSolid = probe.solid;
  }

  // ── Hazard overlap (inset for forgiveness) ──
  const inset = 3;
  let hazard = false;
  {
    const [hx0, hx1] = spanTiles(x + inset, x + w - inset, ts);
    const [hy0, hy1] = spanTiles(y + inset, y + h - inset, ts);
    for (let ty = hy0; ty <= hy1 && !hazard; ty++)
      for (let tx = hx0; tx <= hx1 && !hazard; tx++) if (tileAt(map, tx, ty) === TILE.HAZARD) hazard = true;
  }

  return { x, y, hitX, hitY, onFloor, onCeiling, onWallLeft, onWallRight, hazard, floorSolid };
}

/** Is there support directly under the rect (within 1px)? */
export function groundAt(map: TilemapData, x: number, y: number, w: number, h: number, solids: SolidRect[] = [], dropThrough = false): { grounded: boolean; solid: number } {
  const ts = map.tileSize;
  const bottom = y + h;
  const [tx0, tx1] = spanTiles(x, x + w, ts);
  const ty = Math.floor((bottom + 1) / ts);
  for (let tx = tx0; tx <= tx1; tx++) {
    const t = tileAt(map, tx, ty);
    if (t === TILE.SOLID) return { grounded: true, solid: -1 };
    if (t === TILE.ONEWAY && !dropThrough && Math.abs(bottom - ty * ts) <= 1 + EPS) return { grounded: true, solid: -1 };
  }
  for (let i = 0; i < solids.length; i++) {
    const s = solids[i];
    const inX = s.x < x + w - EPS && s.x + s.w > x + EPS;
    if (inX && bottom <= s.y + 1 + EPS && bottom >= s.y - 1 - EPS) return { grounded: true, solid: i };
  }
  return { grounded: false, solid: -1 };
}

// Uniform-grid spatial hash for broad-phase queries over many moving entities
// (hordes, bullets, RTS units). Deterministic: iteration order is insertion
// order within cells, and query results preserve first-insertion order.
// Rebuild-per-step is the intended pattern — clear() + insert all — which is
// O(n) and avoids stale incremental state entirely.

import type { Rect } from '../core/math';

export class SpatialHash<T> {
  private cells = new Map<number, T[]>();
  private bounds = new Map<T, Rect>();
  private readonly cellSize: number;

  constructor(cellSize = 64) {
    this.cellSize = cellSize;
  }

  clear(): void {
    this.cells.clear();
    this.bounds.clear();
  }

  get size(): number {
    return this.bounds.size;
  }

  private key(cx: number, cy: number): number {
    // Interleave-free packing; fine for worlds within ±2^15 cells.
    return (cx + 32768) * 65536 + (cy + 32768);
  }

  insert(item: T, rect: Rect): void {
    this.bounds.set(item, rect);
    const cs = this.cellSize;
    const x0 = Math.floor(rect.x / cs);
    const x1 = Math.floor((rect.x + rect.w) / cs);
    const y0 = Math.floor(rect.y / cs);
    const y1 = Math.floor((rect.y + rect.h) / cs);
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const k = this.key(cx, cy);
        const cell = this.cells.get(k);
        if (cell) cell.push(item);
        else this.cells.set(k, [item]);
      }
  }

  /** All items whose rects overlap the query rect (deduplicated, deterministic order). */
  query(rect: Rect): T[] {
    const cs = this.cellSize;
    const x0 = Math.floor(rect.x / cs);
    const x1 = Math.floor((rect.x + rect.w) / cs);
    const y0 = Math.floor(rect.y / cs);
    const y1 = Math.floor((rect.y + rect.h) / cs);
    const seen = new Set<T>();
    const out: T[] = [];
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++) {
        const cell = this.cells.get(this.key(cx, cy));
        if (!cell) continue;
        for (const item of cell) {
          if (seen.has(item)) continue;
          seen.add(item);
          const b = this.bounds.get(item)!;
          if (b.x < rect.x + rect.w && b.x + b.w > rect.x && b.y < rect.y + rect.h && b.y + b.h > rect.y) out.push(item);
        }
      }
    return out;
  }

  /** All items within `radius` of a point (circle vs rect-center test on bounds). */
  queryCircle(x: number, y: number, radius: number): T[] {
    const near = this.query({ x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 });
    return near.filter((item) => {
      const b = this.bounds.get(item)!;
      const cx = Math.max(b.x, Math.min(x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(y, b.y + b.h));
      return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= radius * radius;
    });
  }
}

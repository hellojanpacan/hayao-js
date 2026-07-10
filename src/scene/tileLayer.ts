// TileLayer — cached vector tile rendering for big maps. The naive pattern
// (regenerate every tile's autotile/contour geometry into the display list
// each frame) is fine for one screen of tiles and a wall at metroidvania
// scale. This node bakes each cell's commands ONCE (pure vector — no raster,
// no atlas), re-bakes only cells whose neighbourhood changed, and culls to
// the camera view each frame, so a 200×60 zone costs what the visible screen
// costs.
//
// COSMETIC by design: tile ART is view. The logical map (collision, hazards)
// stays in world.state / your TilemapData — this node only paints it.

import { composeTransform, IDENTITY, invertTransform, applyTransform, type Transform } from '../core/math';
import type { DrawCommand } from '../render/commands';
import { tileAt, type TilemapData } from '../physics/tilemap';
import { Node, type NodeConfig } from './node';

/** What a tile producer sees for one cell. */
export interface TileCell {
  /** Cell coords. */
  tx: number;
  ty: number;
  /** Tile id at the cell (TILE.EMPTY/SOLID/… or your own vocabulary). */
  id: number;
  /** Top-left corner in layer-local px. */
  x: number;
  y: number;
  /** Tile edge in px. */
  size: number;
  /** The whole map, for neighbour-aware art (autotile masks). */
  map: TilemapData;
}

/**
 * Produce the vector commands for ONE cell, in layer-local coordinates with
 * IDENTITY transforms (the layer stamps its world transform at emit time).
 * Called only when the cell (re)bakes — never per frame. Return [] to draw
 * nothing (e.g. for EMPTY).
 */
export type TileProducer = (cell: TileCell) => DrawCommand[];

export interface TileLayerConfig extends NodeConfig {
  map: TilemapData;
  tile: TileProducer;
  /**
   * Cull to the camera view each frame (needs the node to be in a world).
   * Default true; set false for screenshots of the whole map.
   */
  cull?: boolean;
  /** Extra px kept visible beyond the view edge (shake/parallax slack). Default one tile. */
  cullPad?: number;
}

export class TileLayer extends Node {
  override readonly type: string = 'TileLayer';
  map: TilemapData;
  private producer: TileProducer;
  private cullEnabled: boolean;
  private cullPad: number;
  /** Per-cell baked commands (row-major, parallel to map.tiles). Null = not baked yet. */
  private cells: DrawCommand[][] | null = null;

  constructor(config: TileLayerConfig) {
    super(config);
    this.map = config.map;
    this.producer = config.tile;
    this.cullEnabled = config.cull ?? true;
    this.cullPad = config.cullPad ?? config.map.tileSize;
    this.cosmetic = true; // tile art is view — the logical map lives elsewhere
  }

  /** Number of baked cells with at least one command (test/debug aid). */
  get bakedCellCount(): number {
    if (!this.cells) return 0;
    let n = 0;
    for (const c of this.cells) if (c.length > 0) n++;
    return n;
  }

  private bakeCell(tx: number, ty: number): DrawCommand[] {
    const size = this.map.tileSize;
    return this.producer({
      tx,
      ty,
      id: tileAt(this.map, tx, ty),
      x: tx * size,
      y: ty * size,
      size,
      map: this.map,
    });
  }

  private bakeAll(): DrawCommand[][] {
    const { cols, rows } = this.map;
    const cells: DrawCommand[][] = new Array(cols * rows);
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) cells[ty * cols + tx] = this.bakeCell(tx, ty);
    }
    this.cells = cells;
    return cells;
  }

  /** Throw the whole cache away (map swapped / producer style changed). */
  invalidate(): void {
    this.cells = null;
  }

  /**
   * Write a tile id and re-bake the 3×3 neighbourhood around it — autotile art
   * reads its neighbours, so a lone-cell re-bake would leave stale seams.
   */
  setTile(tx: number, ty: number, id: number): void {
    if (tx < 0 || ty < 0 || tx >= this.map.cols || ty >= this.map.rows) return;
    this.map.tiles[ty * this.map.cols + tx] = id;
    if (!this.cells) return; // nothing baked yet — first draw will
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= this.map.cols || ny >= this.map.rows) continue;
        this.cells[ny * this.map.cols + nx] = this.bakeCell(nx, ny);
      }
    }
  }

  /** The visible cell range under the current view, or the full map without culling. */
  private visibleRange(world: Transform): { x0: number; y0: number; x1: number; y1: number } {
    const full = { x0: 0, y0: 0, x1: this.map.cols - 1, y1: this.map.rows - 1 };
    if (!this.cullEnabled || !this.world) return full;
    // Map the design-space view corners back to layer-local space; the local
    // AABB of the (possibly rotated) view quad bounds what can be seen.
    const inv = invertTransform(world);
    const w = this.world.width;
    const h = this.world.height;
    const corners = [applyTransform(inv, { x: 0, y: 0 }), applyTransform(inv, { x: w, y: 0 }), applyTransform(inv, { x: 0, y: h }), applyTransform(inv, { x: w, y: h })];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of corners) {
      if (!Number.isFinite(c.x) || !Number.isFinite(c.y)) return full; // degenerate transform
      minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
      minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
    }
    const size = this.map.tileSize;
    const pad = this.cullPad;
    return {
      x0: Math.max(0, Math.floor((minX - pad) / size)),
      y0: Math.max(0, Math.floor((minY - pad) / size)),
      x1: Math.min(this.map.cols - 1, Math.floor((maxX + pad) / size)),
      y1: Math.min(this.map.rows - 1, Math.floor((maxY + pad) / size)),
    };
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    const cells = this.cells ?? this.bakeAll();
    const { x0, y0, x1, y1 } = this.visibleRange(world);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        for (const cmd of cells[ty * this.map.cols + tx]) {
          // Cached commands are layer-local; stamp the world transform now
          // (composed, so a producer's own local transform still applies).
          out.push({ ...cmd, transform: cmd.transform === IDENTITY ? world : composeTransform(world, cmd.transform) });
        }
      }
    }
  }
}

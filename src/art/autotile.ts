// Autotiling: turn a boolean/logical grid into seamless tile art. Two solvers,
// both fully pure and deterministic (no RNG):
//   • 4-/8-neighbour bitmask → a base `frame` + `rotation` (Wang tiles), the
//     dying-dreams/witchcat wall-and-edge trick.
//   • marching squares over the grid corners → a 0–15 case per dual cell, plus
//     iso-contour segments for smooth outlines.
//
// The classification is pure logic and MAY inform gameplay, but the *emitted*
// draw commands are art → the caller places them under a `cosmetic` node so
// they stay out of `world.hash()`. BoolGrid is row-major: `grid[y][x]`.

import { IDENTITY, type Transform } from '../core/math';
import type { PolyCommand, RectCommand } from '../render/commands';

export type BoolGrid = readonly (readonly boolean[])[];

/** Build a grid from rows of text; a cell is solid when its char is in `solid`. */
export function gridFromRows(rows: readonly string[], solid = '#'): boolean[][] {
  return rows.map((r) => [...r].map((c) => solid.includes(c)));
}

function at(grid: BoolGrid, x: number, y: number): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < grid[y].length && grid[y][x];
}

// ── 4-neighbour Wang bitmask ────────────────────────────────────────
// Bit order N=1, E=2, S=4, W=8 (set when that side connects to another solid).

export const Edge = { N: 1, E: 2, S: 4, W: 8 } as const;
export type Edge = (typeof Edge)[keyof typeof Edge];

/** 4-bit edge mask of solid neighbours around a cell. */
export function mask4(grid: BoolGrid, x: number, y: number): number {
  return (
    (at(grid, x, y - 1) ? Edge.N : 0) |
    (at(grid, x + 1, y) ? Edge.E : 0) |
    (at(grid, x, y + 1) ? Edge.S : 0) |
    (at(grid, x - 1, y) ? Edge.W : 0)
  );
}

/** 8-bit neighbour mask, bit order N,NE,E,SE,S,SW,W,NW (1,2,4,…,128). */
export function mask8(grid: BoolGrid, x: number, y: number): number {
  let m = 0;
  const dirs: ReadonlyArray<readonly [number, number]> = [
    [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1],
  ];
  for (let i = 0; i < 8; i++) if (at(grid, x + dirs[i][0], y + dirs[i][1])) m |= 1 << i;
  return m;
}

/** Base tile shapes an edge mask resolves to (rotate `frame` by `rotation`×90° CW). */
export const WangFrame = { Isolated: 0, Cap: 1, Straight: 2, Bend: 3, Tee: 4, Cross: 5 } as const;
export type WangFrame = (typeof WangFrame)[keyof typeof WangFrame];

export interface WangTile {
  mask: number;
  frame: WangFrame;
  /** Quarter turns clockwise applied to the base frame (0–3). */
  rotation: number;
}

function rotateCW(m: number): number {
  let r = 0;
  if (m & Edge.N) r |= Edge.E;
  if (m & Edge.E) r |= Edge.S;
  if (m & Edge.S) r |= Edge.W;
  if (m & Edge.W) r |= Edge.N;
  return r;
}

// Precomputed 16-entry mask → {frame, rotation} table. Built by rotating one
// canonical mask per frame through four quarter turns (pure, module-load once).
const WANG4: WangTile[] = (() => {
  const bases: ReadonlyArray<readonly [WangFrame, number]> = [
    [WangFrame.Isolated, 0b0000],
    [WangFrame.Cap, Edge.N],
    [WangFrame.Straight, Edge.N | Edge.S],
    [WangFrame.Bend, Edge.N | Edge.E],
    [WangFrame.Tee, Edge.N | Edge.E | Edge.S],
    [WangFrame.Cross, 0b1111],
  ];
  const table: WangTile[] = new Array(16);
  for (const [frame, mask0] of bases) {
    let m = mask0;
    for (let rotation = 0; rotation < 4; rotation++) {
      if (table[m] === undefined) table[m] = { mask: m, frame, rotation };
      m = rotateCW(m);
    }
  }
  return table;
})();

/** Resolve an edge mask (0–15) to its base frame + rotation. */
export function wangTile(mask: number): WangTile {
  return WANG4[mask & 15];
}

/** Classify every solid cell into a {frame, rotation}; empty cells are `null`. */
export function autotile4(grid: BoolGrid): (WangTile | null)[][] {
  return grid.map((row, y) => row.map((solid, x) => (solid ? wangTile(mask4(grid, x, y)) : null)));
}

// ── Marching squares (corner-sampled dual grid) ─────────────────────
// Case bit order over a cell's corners: TL=1, TR=2, BR=4, BL=8.

/** Per-dual-cell case index (0–15) over the grid corners; size (h-1)×(w-1). */
export function marchingSquaresCases(grid: BoolGrid): number[][] {
  const h = grid.length;
  const w = h ? grid[0].length : 0;
  const out: number[][] = [];
  for (let y = 0; y < h - 1; y++) {
    const row: number[] = [];
    for (let x = 0; x < w - 1; x++) {
      row.push(
        (at(grid, x, y) ? 1 : 0) |
          (at(grid, x + 1, y) ? 2 : 0) |
          (at(grid, x + 1, y + 1) ? 4 : 0) |
          (at(grid, x, y + 1) ? 8 : 0),
      );
    }
    out.push(row);
  }
  return out;
}

// Edge midpoints per case, referenced as pairs. T=top, R=right, B=bottom, L=left.
type MSEdge = 'T' | 'R' | 'B' | 'L';
const MS_SEGMENTS: ReadonlyArray<ReadonlyArray<readonly [MSEdge, MSEdge]>> = [
  [], // 0
  [['L', 'T']], // 1 TL
  [['T', 'R']], // 2 TR
  [['L', 'R']], // 3 TL,TR
  [['R', 'B']], // 4 BR
  [['L', 'T'], ['R', 'B']], // 5 saddle
  [['T', 'B']], // 6 TR,BR
  [['L', 'B']], // 7 TL,TR,BR
  [['B', 'L']], // 8 BL
  [['T', 'B']], // 9 TL,BL
  [['T', 'R'], ['B', 'L']], // 10 saddle
  [['R', 'B']], // 11 TL,TR,BL
  [['L', 'R']], // 12 BR,BL
  [['T', 'R']], // 13 TL,BR,BL
  [['L', 'T']], // 14 TR,BR,BL
  [], // 15
];

export interface ContourSegment {
  a: { x: number; y: number };
  b: { x: number; y: number };
}

export interface ContourOptions {
  /** Cell size in design units. Default 1. */
  cell?: number;
  x?: number;
  y?: number;
}

/** Iso-contour line segments tracing the solid/empty boundary (design units). */
export function marchingSquaresContours(grid: BoolGrid, options: ContourOptions = {}): ContourSegment[] {
  const cell = options.cell ?? 1;
  const ox = options.x ?? 0;
  const oy = options.y ?? 0;
  const cases = marchingSquaresCases(grid);
  const segs: ContourSegment[] = [];
  const mid = (edge: MSEdge, cx: number, cy: number) => {
    switch (edge) {
      case 'T': return { x: cx + cell / 2, y: cy };
      case 'R': return { x: cx + cell, y: cy + cell / 2 };
      case 'B': return { x: cx + cell / 2, y: cy + cell };
      case 'L': return { x: cx, y: cy + cell / 2 };
    }
  };
  for (let y = 0; y < cases.length; y++) {
    for (let x = 0; x < cases[y].length; x++) {
      const cx = ox + x * cell;
      const cy = oy + y * cell;
      for (const [e1, e2] of MS_SEGMENTS[cases[y][x]]) segs.push({ a: mid(e1, cx, cy), b: mid(e2, cx, cy) });
    }
  }
  return segs;
}

// ── Emitters (cosmetic draw data) ───────────────────────────────────

export interface AutotileDrawOptions {
  /** Tile size in design units. Default 8. */
  tile?: number;
  x?: number;
  y?: number;
  z?: number;
  transform?: Transform;
  /** Fill colour of solid tiles. */
  fill?: string;
  /** Stroke colour drawn only on sides exposed to empty (the seam). */
  edge?: string;
  edgeWidth?: number;
}

/**
 * Draw a boolean grid as seamless tiles: a fill per solid cell plus an edge
 * stroke only on sides facing empty (derived from `mask4`). Pure draw data for
 * a `cosmetic` node.
 */
export function autotileToCommands(grid: BoolGrid, options: AutotileDrawOptions = {}): (RectCommand | PolyCommand)[] {
  const tile = options.tile ?? 8;
  const ox = options.x ?? 0;
  const oy = options.y ?? 0;
  const z = options.z ?? 0;
  const transform = options.transform ?? IDENTITY;
  const fill = options.fill ?? '#888';
  const edge = options.edge;
  const edgeWidth = options.edgeWidth ?? Math.max(1, tile / 8);
  const out: (RectCommand | PolyCommand)[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!grid[y][x]) continue;
      const px = ox + x * tile;
      const py = oy + y * tile;
      out.push({ kind: 'rect', x: px, y: py, w: tile, h: tile, transform, z, fill });
      if (!edge) continue;
      const m = mask4(grid, x, y);
      const line = (points: number[]) =>
        out.push({ kind: 'poly', points, closed: false, transform, z: z + 1, stroke: edge, strokeWidth: edgeWidth });
      if (!(m & Edge.N)) line([px, py, px + tile, py]);
      if (!(m & Edge.E)) line([px + tile, py, px + tile, py + tile]);
      if (!(m & Edge.S)) line([px, py + tile, px + tile, py + tile]);
      if (!(m & Edge.W)) line([px, py, px, py + tile]);
    }
  }
  return out;
}

/** Draw the marching-squares iso-contour as open polylines (cosmetic draw data). */
export function contourToCommands(grid: BoolGrid, options: AutotileDrawOptions = {}): PolyCommand[] {
  const tile = options.tile ?? 8;
  const transform = options.transform ?? IDENTITY;
  const z = options.z ?? 0;
  const stroke = options.edge ?? options.fill ?? '#333';
  const strokeWidth = options.edgeWidth ?? Math.max(1, tile / 8);
  const segs = marchingSquaresContours(grid, { cell: tile, x: options.x ?? 0, y: options.y ?? 0 });
  return segs.map((s) => ({
    kind: 'poly',
    points: [s.a.x, s.a.y, s.b.x, s.b.y],
    closed: false,
    transform,
    z,
    stroke,
    strokeWidth,
    round: true,
  }));
}

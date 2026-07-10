// Lumen — pure chain-fire rules. No engine imports, no rendering. This is the
// "pure logic module" convention: the turn-based truth lives here so the solver
// can PROVE every generated board winnable; the scene tree is only a view.
//
// The mechanic (the signature): drop a spark on an empty cell. It emits four
// orthogonal beams. A beam travels in a straight line, PASSING THROUGH already-lit
// prisms and empty cells, and is ABSORBED by the first dormant prism it meets —
// which lights and re-emits a single beam along ITS OWN arrow. Light cascades.
// Solve = every prism lit within the spark budget.
//
// Because a beam passes through lit prisms but stops at dormant ones, the ORDER
// of placements changes what a later spark can reach — that ordering is where the
// depth lives. The final lit set is still a pure function of (board, litMask,
// spark cell), so the state stays Markov and the solver's (litMask, sparksLeft)
// key dedups correctly.

import type { Puzzle } from '@hayao';

/** Compass direction a prism re-emits toward. 0=N, 1=E, 2=S, 3=W. */
export type Dir = 0 | 1 | 2 | 3;
export const DELTAS: ReadonlyArray<readonly [number, number]> = [
  [0, -1], // N
  [1, 0], //  E
  [0, 1], //  S
  [-1, 0], // W
];
export const DIR_NAMES = ['N', 'E', 'S', 'W'] as const;

/** A dormant lamp on the board: the cell it sits in + the arrow it fires along. */
export interface Prism {
  cell: number;
  dir: Dir;
}

/** Static board geometry + the spark budget. Immutable per puzzle. */
export interface Level {
  width: number;
  height: number;
  /** Ordered by cell index — the bit position of a prism is its index here. */
  prisms: Prism[];
  /** How many sparks the player may place (== the minimum the board needs). */
  sparks: number;
  /** The seed this board was generated from (for reproducibility / sharing). */
  seed: number;
  /** Estimated difficulty, used as the puzzle's Elo rating. */
  rating: number;
}

/** The mutable puzzle state the solver searches over. `lit` is a bitmask. */
export interface LumenState {
  lit: number;
  sparksLeft: number;
}

/** A player move: the cell index to drop a spark on. */
export type Move = number;

export const cellX = (level: Level, cell: number): number => cell % level.width;
export const cellY = (level: Level, cell: number): number => Math.floor(cell / level.width);
export const toCell = (level: Level, x: number, y: number): number => y * level.width + x;

/** The bitmask with every prism lit — the win target. */
export function allLitMask(level: Level): number {
  return level.prisms.length === 0 ? 0 : (1 << level.prisms.length) - 1;
}

/** cell index → prism index, built once per resolution. */
function prismByCell(level: Level): Map<number, number> {
  const m = new Map<number, number>();
  level.prisms.forEach((p, i) => m.set(p.cell, i));
  return m;
}

/**
 * Cast one beam from a starting cell in a direction. Returns the index of the
 * first DORMANT prism it hits (passing through lit prisms and empty cells), or
 * -1 if it leaves the board without absorbing.
 */
function castBeam(
  level: Level,
  byCell: Map<number, number>,
  litMask: number,
  fromX: number,
  fromY: number,
  dir: Dir,
): number {
  const [dx, dy] = DELTAS[dir];
  let x = fromX + dx;
  let y = fromY + dy;
  while (x >= 0 && x < level.width && y >= 0 && y < level.height) {
    const pIdx = byCell.get(toCell(level, x, y));
    if (pIdx !== undefined && (litMask & (1 << pIdx)) === 0) return pIdx; // dormant → absorbed
    x += dx;
    y += dy;
  }
  return -1;
}

/** A single lit beam segment, for the view's racing-light choreography. */
export interface Beam {
  from: number;
  to: number;
  wave: number;
}

/**
 * Lean resolver: the new lit mask after dropping a spark at `sparkCell` given the
 * current `litMask`. This is the solver's hot path (called once per explored
 * move) so it builds no cascade metadata — see `chainFrom` for the view version.
 */
export function resolveMask(level: Level, litMask: number, sparkCell: number): number {
  const byCell = prismByCell(level);
  let mask = litMask;
  const sx = cellX(level, sparkCell);
  const sy = cellY(level, sparkCell);
  let emitters: Array<{ x: number; y: number; dir: Dir }> = [0, 1, 2, 3].map((d) => ({ x: sx, y: sy, dir: d as Dir }));
  while (emitters.length > 0) {
    const hits: number[] = [];
    for (const e of emitters) {
      const pIdx = castBeam(level, byCell, mask, e.x, e.y, e.dir);
      if (pIdx >= 0 && (mask & (1 << pIdx)) === 0 && !hits.includes(pIdx)) hits.push(pIdx);
    }
    if (hits.length === 0) break;
    for (const pIdx of hits) mask |= 1 << pIdx;
    emitters = hits.map((pIdx) => {
      const p = level.prisms[pIdx];
      return { x: cellX(level, p.cell), y: cellY(level, p.cell), dir: p.dir };
    });
  }
  return mask;
}

/**
 * Resolve dropping a spark at `sparkCell` given the current `litMask`, WITH the
 * full cascade for the view: the new mask, ordered waves of prism indices, and
 * the beam segments that light them. Deterministic: prisms within a wave are
 * processed in index order.
 */
export function chainFrom(
  level: Level,
  litMask: number,
  sparkCell: number,
): { mask: number; waves: number[][]; beams: Beam[] } {
  const byCell = prismByCell(level);
  let mask = litMask;
  const waves: number[][] = [];
  const beams: Beam[] = [];

  const sx = cellX(level, sparkCell);
  const sy = cellY(level, sparkCell);
  // Wave 0's beams come from the spark itself, in all four directions.
  let emitters: Array<{ cell: number; x: number; y: number; dir: Dir }> = [0, 1, 2, 3].map((d) => ({
    cell: sparkCell,
    x: sx,
    y: sy,
    dir: d as Dir,
  }));

  while (emitters.length > 0) {
    const wave = waves.length;
    const hits: number[] = [];
    for (const e of emitters) {
      const pIdx = castBeam(level, byCell, mask, e.x, e.y, e.dir);
      if (pIdx < 0 || (mask & (1 << pIdx)) !== 0) continue;
      if (!hits.includes(pIdx)) hits.push(pIdx);
      beams.push({ from: e.cell, to: level.prisms[pIdx].cell, wave });
    }
    if (hits.length === 0) break;
    hits.sort((a, b) => a - b);
    waves.push(hits);
    for (const pIdx of hits) mask |= 1 << pIdx;
    // Each newly-lit prism re-emits one beam along its own arrow.
    emitters = hits.map((pIdx) => {
      const p = level.prisms[pIdx];
      return { cell: p.cell, x: cellX(level, p.cell), y: cellY(level, p.cell), dir: p.dir };
    });
  }
  return { mask, waves, beams };
}

/** Cells with no prism — where a spark may be dropped. Sorted, deterministic. */
export function emptyCells(level: Level): number[] {
  const occupied = new Set(level.prisms.map((p) => p.cell));
  const out: number[] = [];
  for (let c = 0; c < level.width * level.height; c++) if (!occupied.has(c)) out.push(c);
  return out;
}

/**
 * Empty cells that share a row or column with at least one prism — the only
 * placements that can light anything. Pruning the rest keeps the solver fast
 * without changing winnability (a dud placement never helps).
 */
export function usefulCells(level: Level): number[] {
  const rows = new Set(level.prisms.map((p) => cellY(level, p.cell)));
  const cols = new Set(level.prisms.map((p) => cellX(level, p.cell)));
  return emptyCells(level).filter((c) => rows.has(cellY(level, c)) || cols.has(cellX(level, c)));
}

/** Replay an ordered list of spark placements from empty; returns the lit mask. */
export function litAfter(level: Level, placements: readonly number[]): number {
  let mask = 0;
  for (const cell of placements) mask = resolveMask(level, mask, cell);
  return mask;
}

/**
 * The Puzzle contract the engine solver consumes. Given a concrete generated
 * level, this proves winnability by BFS over spark placements — the shortest
 * solution's depth IS the minimum sparks the board needs.
 */
export function makePuzzle(level: Level, start?: LumenState): Puzzle<LumenState, Move> {
  const target = allLitMask(level);
  const useful = usefulCells(level);
  return {
    initial: () => start ?? { lit: 0, sparksLeft: level.sparks },
    moves: (s) => (s.sparksLeft > 0 && s.lit !== target ? useful : []),
    apply: (s, cell) => ({ lit: resolveMask(level, s.lit, cell), sparksLeft: s.sparksLeft - 1 }),
    isWin: (s) => s.lit === target,
    isDead: (s) => s.sparksLeft === 0 && s.lit !== target,
    key: (s) => `${s.lit}|${s.sparksLeft}`,
  };
}

/** Is the board fully lit? */
export const isSolved = (level: Level, litMask: number): boolean => litMask === allLitMask(level);

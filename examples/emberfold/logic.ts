// Emberfold — pure logic. A 2048-family slide-and-merge puzzle, PUZZLE-SHAPED so
// it can be machine-proven: no random spawns. The board is dealt once (embers +
// immovable stones); you slide the whole grid and equal embers fuse into their
// double, chasing a target heat. Because the board only ever loses tiles (merges
// never add them) and nothing spawns, the whole thing is a finite, deterministic
// search — the solver PROVES a target is reachable and reports the minimum slides.
//
// No engine imports beyond `Puzzle`/`Rng`. The twist over vanilla 2048 is the
// STONE block: it never slides and never merges, so it partitions each row and
// column into independent runs — that is what turns "swipe till it works" into a
// spatial puzzle the solver has to think about.

import type { Puzzle } from '@hayao';
import { Rng } from '@hayao';

export const DIRS = ['up', 'down', 'left', 'right'] as const;
export type Move = (typeof DIRS)[number];

/** Cell sentinels. Positive values are powers of two (embers). */
export const EMPTY = 0;
export const STONE = -1;

/** Static + mutable board in one self-describing record (the puzzle State). */
export interface Grid {
  cols: number;
  rows: number;
  /** Row-major cells: -1 stone, 0 empty, else a power of two. */
  cells: number[];
  /** Win when any ember reaches this value. */
  target: number;
}

/** The reproducible recipe for one dealt board — everything `makePuzzle` needs. */
export interface BoardParams {
  cols: number;
  rows: number;
  /** Immovable stone blocks. */
  stones: number;
  /** Value-2 embers dealt. */
  embers: number;
  /** Value-4 embers dealt (a small head start). */
  fours: number;
  /** Reach this heat to win. */
  target: number;
}

const cloneGrid = (g: Grid): Grid => ({ ...g, cells: g.cells.slice() });

/**
 * Compact + merge one run of cells (no stones inside) toward index 0. Standard
 * 2048 rule: each ember merges at most once per slide, front-to-back.
 */
function mergeRun(run: number[]): number[] {
  const vals = run.filter((v) => v !== EMPTY);
  const out: number[] = [];
  for (let i = 0; i < vals.length; i++) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      i++; // consume the partner
    } else {
      out.push(vals[i]);
    }
  }
  while (out.length < run.length) out.push(EMPTY);
  return out;
}

/** Slide one line toward index 0, treating stones as fixed partitions. */
function slideLine(line: number[]): number[] {
  const out = line.slice();
  let i = 0;
  while (i < line.length) {
    if (line[i] === STONE) { i++; continue; }
    let j = i;
    while (j < line.length && line[j] !== STONE) j++;
    const merged = mergeRun(line.slice(i, j));
    for (let k = 0; k < merged.length; k++) out[i + k] = merged[k];
    i = j;
  }
  return out;
}

/**
 * Apply a slide. Returns a NEW grid, or the SAME reference when nothing moved
 * (so callers — and the solver's dedup — can cheaply detect a no-op).
 */
export function applyMove(g: Grid, move: Move): Grid {
  const { cols, rows, cells } = g;
  const horizontal = move === 'left' || move === 'right';
  const reverse = move === 'right' || move === 'down';
  const lines = horizontal ? rows : cols;
  const len = horizontal ? cols : rows;
  const next = cells.slice();
  let moved = false;

  for (let l = 0; l < lines; l++) {
    const line: number[] = [];
    for (let k = 0; k < len; k++) {
      const idx = horizontal ? l * cols + k : k * cols + l;
      line.push(cells[idx]);
    }
    const oriented = reverse ? line.slice().reverse() : line;
    const slid = slideLine(oriented);
    const result = reverse ? slid.reverse() : slid;
    for (let k = 0; k < len; k++) {
      const idx = horizontal ? l * cols + k : k * cols + l;
      if (next[idx] !== result[k]) moved = true;
      next[idx] = result[k];
    }
  }
  if (!moved) return g;
  return { ...g, cells: next };
}

/** The hottest ember on the board (0 if none). */
export function maxTile(g: Grid): number {
  let m = 0;
  for (const v of g.cells) if (v > m) m = v;
  return m;
}

export const isWin = (g: Grid): boolean => maxTile(g) >= g.target;

/** No win possible from here (no slide changes the board). Prunes the search. */
export function isDead(g: Grid): boolean {
  if (isWin(g)) return false;
  return DIRS.every((m) => applyMove(g, m) === g);
}

/** Deal one board from a seeded stream: stones first, then a 4, then the 2s. */
export function buildBoard(rng: Rng, p: BoardParams): Grid {
  const cells = new Array<number>(p.cols * p.rows).fill(EMPTY);
  const dealOn = (val: number): void => {
    const empties: number[] = [];
    for (let i = 0; i < cells.length; i++) if (cells[i] === EMPTY) empties.push(i);
    if (empties.length === 0) return;
    cells[empties[rng.int(empties.length)]] = val;
  };
  for (let s = 0; s < p.stones; s++) dealOn(STONE);
  for (let f = 0; f < p.fours; f++) dealOn(4);
  for (let e = 0; e < p.embers; e++) dealOn(2);
  return { cols: p.cols, rows: p.rows, cells, target: p.target };
}

/** A single-level Puzzle over a dealt board — the surface the solver bites on. */
export function makePuzzle(rng: Rng, p: BoardParams): Puzzle<Grid, Move> {
  const start = buildBoard(rng, p);
  return {
    initial: () => cloneGrid(start),
    moves: () => [...DIRS],
    apply: (s, m) => applyMove(s, m),
    isWin,
    isDead,
    key: (s) => s.cells.join(','),
  };
}

/** The shippable, hashable description of one generated level — pure data. */
export interface LevelRecord extends BoardParams {
  /** Sub-seed that rebuilds the exact board via `makePuzzle`. */
  seed: number;
  /** Solver-proven minimum slides to win — the difficulty metric. */
  depth: number;
  /** Which act it belongs to (0-based) and the act's name. */
  act: number;
  actName: string;
}

/** Rebuild the exact board for a stored level record. */
export function puzzleFromRecord(rec: LevelRecord): Puzzle<Grid, Move> {
  return makePuzzle(new Rng(rec.seed), rec);
}

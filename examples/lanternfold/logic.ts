// Lanternfold — pure logic. A Lights-Out-family puzzle: a grid of paper lanterns,
// each lit or dark. Tapping a lantern toggles it and its orthogonal neighbours
// (the "plus" stencil). Win when the whole grid glows.
//
// No engine imports beyond the `Puzzle` type — this is the pure truth the solver
// bites on and the scene tree merely views. Two properties make this the ideal
// GENERATOR target (see ../../src/content/generate.ts):
//   • Every tap is its own inverse and taps commute, so any board reached by
//     scrambling from the all-lit state is GUARANTEED solvable — the generator
//     never emits an impossible level.
//   • The solver's shortest-solution length is a clean, honest difficulty metric,
//     so difficulty bands and the ramp gate mean exactly what they say.

import type { Puzzle } from '@hayao';
import { Rng } from '@hayao';

/** Mutable board: one 0/1 per cell (1 = lit), plus its dimensions for self-describing state. */
export interface LanternState {
  /** Row-major lit flags, length cols*rows. */
  lit: number[];
  cols: number;
  rows: number;
}

/** A tap is the index of the lantern pressed. */
export type Tap = number;

export interface BoardParams {
  cols: number;
  rows: number;
  /** Inclusive range of random taps used to scramble a solved board into a start. */
  scrambleLo: number;
  scrambleHi: number;
}

/** Toggle cell `i` and its plus-neighbours; returns a NEW lit array. */
export function toggleAt(lit: readonly number[], i: number, cols: number, rows: number): number[] {
  const out = lit.slice();
  const x = i % cols;
  const y = Math.floor(i / cols);
  const flip = (xx: number, yy: number): void => {
    if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) return;
    const j = yy * cols + xx;
    out[j] = out[j] ? 0 : 1;
  };
  flip(x, y);
  flip(x - 1, y);
  flip(x + 1, y);
  flip(x, y - 1);
  flip(x, y + 1);
  return out;
}

export const isAllLit = (lit: readonly number[]): boolean => lit.every((v) => v === 1);

/**
 * Build ONE candidate puzzle from a seeded stream: start from the solved
 * (all-lit) board and apply a random number of taps to scramble it. Because taps
 * are self-inverse the result is always solvable; the generator then asks the
 * solver for the TRUE minimum and keeps it only if that lands in the target band.
 *
 * Reproducible: `makeLanternPuzzle(new Rng(seed), params)` yields the identical
 * board for the same seed+params — which is why a campaign can ship as a list of
 * seeds rather than a folder of hand-drawn maps.
 */
export function makeLanternPuzzle(rng: Rng, params: BoardParams): Puzzle<LanternState, Tap> {
  const { cols, rows, scrambleLo, scrambleHi } = params;
  const n = cols * rows;
  let lit = new Array<number>(n).fill(1);
  const taps = rng.intRange(scrambleLo, scrambleHi);
  for (let k = 0; k < taps; k++) {
    lit = toggleAt(lit, rng.int(n), cols, rows);
  }
  const start = lit.slice();
  const allTaps = Array.from({ length: n }, (_, i) => i);
  return {
    initial: () => ({ lit: start.slice(), cols, rows }),
    moves: () => allTaps,
    apply: (s, i) => ({ lit: toggleAt(s.lit, i, cols, rows), cols, rows }),
    isWin: (s) => isAllLit(s.lit),
    key: (s) => s.lit.join(''),
  };
}

/** Rebuild the exact board for a stored level record (seed + board params). */
export function puzzleFromRecord(rec: LevelRecord): Puzzle<LanternState, Tap> {
  return makeLanternPuzzle(new Rng(rec.seed), rec);
}

/** The shippable, hashable description of one generated level — pure data. */
export interface LevelRecord extends BoardParams {
  /** Sub-seed that reproduces the board via `makeLanternPuzzle`. */
  seed: number;
  /** Solver-proven minimum taps to win — the difficulty metric. */
  depth: number;
  /** Which act it belongs to (0-based) and the act's name. */
  act: number;
  actName: string;
}

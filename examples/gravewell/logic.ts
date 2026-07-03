// Pure Gravewell rules — tap-puzzle on a 6×6 board (SPEC.md: reproduction of
// Black Hole Square's extracted rules). No engine imports; the solver proves
// every level solvable within its tap budget AND unsolvable in par−1.

import type { Puzzle } from '@hayao';

export const W = 6;
export const H = 6;

/** Cell contents. Order matters only for readability; logic uses the sets below. */
export type Cell =
  | 'empty'
  | 'hole'
  | 'blank'
  | 'x'
  | 'up'
  | 'right'
  | 'down'
  | 'left'
  | 'star';

export const PUSHABLE: ReadonlySet<Cell> = new Set(['blank', 'x', 'up', 'right', 'down', 'left', 'star']);
export const CLICKABLE: ReadonlySet<Cell> = new Set(['x', 'up', 'right', 'down', 'left', 'star']);
const ARROW_DELTA: Partial<Record<Cell, number>> = { up: -W, right: 1, down: W, left: -1 };

export interface Level {
  name: string;
  /** Hard tap budget (par). Effective taps only; blocked taps are free. */
  taps: number;
  cells: Cell[];
}

export interface GravewellState {
  cells: Cell[];
  tapsLeft: number;
  levelIndex: number;
}

// ── Level maps. '.'=empty O=hole b=blank x=X ^>v<=arrows *=neutron star ──
// Original designs (SPEC.md licensing note). Teaching arc: tap → collapse →
// slide → sweep → collapse-then-sweep finale. Par values are the solver-proven
// optima (asserted by verify M7: par−1 is unsolvable).
const CHAR: Record<string, Cell> = {
  '.': 'empty', O: 'hole', b: 'blank', x: 'x', '^': 'up', '>': 'right', v: 'down', '<': 'left', '*': 'star',
};

export const LEVEL_MAPS: { name: string; taps: number; map: string }[] = [
  {
    // 0 — taps remove X squares. Par = one per piece.
    name: 'Dustfield',
    taps: 3,
    map: ['......', '..x...', '....x.', '.x....', '......', '......'].join('\n'),
  },
  {
    // 1 — the neutron star cleans ITSELF by collapsing; X squares as before.
    name: 'Collapse',
    taps: 3,
    map: ['......', '..x.x.', '......', '...*..', '......', '......'].join('\n'),
  },
  {
    // 2 — the arrow sweeps its column into the hole, one swallow per tap,
    // and finally falls in itself.
    name: 'Downdraft',
    taps: 3,
    map: ['..v...', '..b...', '..b...', '..O...', '......', '......'].join('\n'),
  },
  {
    // 3 — the run must first SLIDE across a gap (a tap that swallows nothing)
    // before the sweep begins: gaps cost budget.
    name: 'Driftline',
    taps: 5,
    map: ['......', '>bb.O.', '......', '..x...', '......', '......'].join('\n'),
  },
  {
    // 4 — finale: NO hole on the board. Collapse the star first, then sweep
    // everything into the well it leaves behind (gap included).
    name: 'Gravewell',
    taps: 6,
    map: ['......', '..x...', '......', '......', '.*.bb<', '......'].join('\n'),
  },
];

export function parseLevel(def: (typeof LEVEL_MAPS)[number]): Level {
  const rows = def.map.split('\n');
  const cells: Cell[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) cells.push(CHAR[rows[y]?.[x] ?? '.'] ?? 'empty');
  }
  return { name: def.name, taps: def.taps, cells };
}

export const LEVELS: Level[] = LEVEL_MAPS.map(parseLevel);

export function initialState(levelIndex = 0, tapsOverride?: number): GravewellState {
  const lvl = LEVELS[levelIndex];
  return { cells: lvl.cells.slice(), tapsLeft: tapsOverride ?? lvl.taps, levelIndex };
}

/** Row-bounded horizontally, grid-bounded vertically — as the original. */
function inBounds(from: number, to: number, delta: number): boolean {
  if (to < 0 || to >= W * H) return false;
  if (Math.abs(delta) === 1 && Math.floor(to / W) !== Math.floor(from / W)) return false;
  return true;
}

/**
 * Apply a tap at cell index i. Returns a NEW state, or the SAME state if the
 * tap is ineffective (not clickable, or a blocked push) — ineffective taps do
 * not consume budget (SPEC.md M5).
 */
export function applyTap(state: GravewellState, i: number): GravewellState {
  const piece = state.cells[i];
  if (!CLICKABLE.has(piece)) return state;

  if (piece === 'x') {
    const cells = state.cells.slice();
    cells[i] = 'empty';
    return { ...state, cells, tapsLeft: state.tapsLeft - 1 };
  }
  if (piece === 'star') {
    const cells = state.cells.slice();
    cells[i] = 'hole';
    return { ...state, cells, tapsLeft: state.tapsLeft - 1 };
  }

  // Arrow: collect the contiguous pushable run from i in the arrow's direction.
  const d = ARROW_DELTA[piece]!;
  const run: number[] = [];
  let j = i;
  while (PUSHABLE.has(state.cells[j])) {
    run.push(j);
    const next = j + d;
    if (!inBounds(j, next, d)) return state; // walked off the board — blocked
    j = next;
  }
  const stop = state.cells[j]; // 'empty' or 'hole' (holes stop the walk)
  const cells = state.cells.slice();
  // Slide the run one step toward the stop cell, last piece first.
  for (let k = run.length - 1; k >= 0; k--) {
    const from = run[k];
    const to = from + d;
    if (to === j && stop === 'hole') {
      // swallowed — the hole keeps its place
    } else {
      cells[to] = cells[from];
    }
  }
  cells[i] = 'empty';
  return { ...state, cells, tapsLeft: state.tapsLeft - 1 };
}

export const countPushables = (s: GravewellState) => s.cells.filter((c) => PUSHABLE.has(c)).length;
export const countClickables = (s: GravewellState) => s.cells.filter((c) => CLICKABLE.has(c)).length;

export function isWin(s: GravewellState): boolean {
  return countPushables(s) === 0;
}

/** Effective moves: clickable cells whose tap actually changes the board. */
export function effectiveTaps(s: GravewellState): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.cells.length; i++) {
    if (CLICKABLE.has(s.cells[i]) && applyTap(s, i) !== s) out.push(i);
  }
  return out;
}

/** The three fail states: out of taps · not clean · stuck (SPEC.md M8). */
export type FailReason = 'out-of-taps' | 'not-clean' | 'stuck' | null;
export function failReason(s: GravewellState): FailReason {
  if (isWin(s)) return null;
  if (s.tapsLeft <= 0) return 'out-of-taps';
  if (countClickables(s) === 0) return 'not-clean';
  if (effectiveTaps(s).length === 0) return 'stuck';
  return null;
}

export const isDead = (s: GravewellState) => failReason(s) !== null;

const key = (s: GravewellState) => `${s.tapsLeft}|${s.cells.join(',')}`;

/** The Puzzle contract. Budget is enforced by isDead, not by search depth. */
export const gravewellPuzzle: Puzzle<GravewellState, number> = {
  initial: (level = 0) => initialState(level),
  moves: (s) => effectiveTaps(s),
  apply: (s, i) => applyTap(s, i),
  isWin,
  isDead,
  key,
};

/** M7 fidelity variant: one tap fewer — must be unsolvable for every level. */
export const tightParPuzzle: Puzzle<GravewellState, number> = {
  initial: (level = 0) => initialState(level, LEVELS[level].taps - 1),
  moves: (s) => effectiveTaps(s),
  apply: (s, i) => applyTap(s, i),
  isWin,
  isDead,
  key,
};

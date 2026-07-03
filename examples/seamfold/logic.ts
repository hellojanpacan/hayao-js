// Pure Seamfold rules — Sokoban on a twisted torus. No engine imports; the
// solver PROVES every level winnable (and, with wrapping disabled, unwinnable —
// the seam is the mechanic, see SPEC.md M4).
//
// Wrap semantics (SPEC.md): crossing a vertical seam shifts y by ∓yOff,
// crossing a horizontal seam shifts x by ∓xOff, resolved to a fixpoint.

import type { Puzzle } from '@hayao';

export interface Cell {
  x: number;
  y: number;
}
export const DIRS = ['up', 'down', 'left', 'right'] as const;
export type Move = (typeof DIRS)[number];

const DELTA: Record<Move, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Static level geometry. Offsets define the torus twist. */
export interface Level {
  name: string;
  width: number;
  height: number;
  /** Crossing a horizontal seam (top/bottom) shifts x by ∓xOff. */
  xOff: number;
  /** Crossing a vertical seam (left/right) shifts y by ∓yOff. */
  yOff: number;
  walls: Set<string>;
  goals: Cell[];
  start: Cell;
  boxes: Cell[];
}

export interface SeamfoldState {
  player: Cell;
  /** Sorted for a canonical key. */
  boxes: Cell[];
  levelIndex: number;
}

const cellKey = (c: Cell) => `${c.x},${c.y}`;
const sortBoxes = (b: Cell[]) => b.slice().sort((p, q) => p.y - q.y || p.x - q.x);

// ── Level maps. #=wall @=player $=box .=goal *=box-on-goal +=player-on-goal ──
// All levels are ORIGINAL designs (see SPEC.md licensing note); each teaches
// one rung of the twist ladder and each is unsolvable without using a seam.
export const LEVEL_MAPS: { name: string; xOff: number; yOff: number; map: string }[] = [
  {
    // 0 — plain torus: the only route to the goal crosses the right seam.
    name: 'First Seam',
    xOff: 0,
    yOff: 0,
    map: ['######', '      ', '.# $ @', '######'].join('\n'),
  },
  {
    // 1 — yOff twist: two sealed lanes, connected only through the side seams.
    name: 'Twisted Lanes',
    xOff: 0,
    yOff: -2,
    map: ['######', ' @  $ ', '######', '  .   ', '######'].join('\n'),
  },
  {
    // 2 — xOff twist: two sealed columns, connected through top/bottom seams.
    name: 'Cross Stitch',
    xOff: -2,
    yOff: 0,
    map: ['# # #', '# # #', '#@#.#', '#$# #', '# # #', '# # #'].join('\n'),
  },
  {
    // 3 — both twists: two boxes, two goals, every route folds through a seam.
    name: 'Seamfold',
    xOff: 1,
    yOff: 1,
    map: ['##  ##', ' $  . ', '  ##  ', '  ##  ', ' .  $ ', '## @##'].join('\n'),
  },
];

export function parseLevel(def: (typeof LEVEL_MAPS)[number]): Level {
  const rows = def.map.split('\n');
  const width = Math.max(...rows.map((r) => r.length));
  const walls = new Set<string>();
  const goals: Cell[] = [];
  const boxes: Cell[] = [];
  let start: Cell = { x: 0, y: 0 };
  rows.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? ' ';
      const c = { x, y };
      switch (ch) {
        case '#': walls.add(cellKey(c)); break;
        case '.': goals.push(c); break;
        case '$': boxes.push(c); break;
        case '*': boxes.push(c); goals.push(c); break;
        case '@': start = c; break;
        case '+': start = c; goals.push(c); break;
      }
    }
  });
  return { name: def.name, width, height: rows.length, xOff: def.xOff, yOff: def.yOff, walls, goals, start, boxes };
}

export const LEVELS: Level[] = LEVEL_MAPS.map(parseLevel);

/**
 * Resolve raw coords to canonical [0,W)×[0,H) through the twisted seams.
 * Each vertical-seam crossing shifts y, each horizontal-seam crossing shifts x;
 * a shift can push the other axis back out of range, so loop to a fixpoint.
 */
export function wrap(lvl: Level, x: number, y: number): Cell {
  for (let i = 0; i < 16; i++) {
    if (x >= lvl.width) { x -= lvl.width; y -= lvl.yOff; continue; }
    if (x < 0) { x += lvl.width; y += lvl.yOff; continue; }
    if (y >= lvl.height) { y -= lvl.height; x -= lvl.xOff; continue; }
    if (y < 0) { y += lvl.height; x += lvl.xOff; continue; }
    return { x, y };
  }
  /* c8 ignore next */
  throw new Error(`wrap did not converge at (${x},${y}) in ${lvl.name}`);
}

/** Would this single step cross a seam? (Used for the M4 no-wrap variant.) */
export function crossesSeam(lvl: Level, from: Cell, move: Move): boolean {
  const d = DELTA[move];
  const rx = from.x + d.x;
  const ry = from.y + d.y;
  return rx < 0 || rx >= lvl.width || ry < 0 || ry >= lvl.height;
}

export function initialState(levelIndex = 0): SeamfoldState {
  const lvl = LEVELS[levelIndex];
  return { player: { ...lvl.start }, boxes: sortBoxes(lvl.boxes), levelIndex };
}

const isWall = (lvl: Level, c: Cell) => lvl.walls.has(cellKey(c));
const boxAt = (boxes: Cell[], c: Cell) => boxes.findIndex((b) => b.x === c.x && b.y === c.y);

/**
 * Apply a move; returns a NEW state (unchanged if blocked).
 * `allowWrap:false` blocks any step (player or box) that would cross a seam —
 * the fidelity probe that proves the seam is load-bearing (SPEC.md M4).
 */
export function applyMove(state: SeamfoldState, move: Move, allowWrap = true): SeamfoldState {
  const lvl = LEVELS[state.levelIndex];
  const d = DELTA[move];
  if (!allowWrap && crossesSeam(lvl, state.player, move)) return state;
  const target = wrap(lvl, state.player.x + d.x, state.player.y + d.y);
  if (isWall(lvl, target)) return state;

  const bi = boxAt(state.boxes, target);
  if (bi >= 0) {
    if (!allowWrap && crossesSeam(lvl, target, move)) return state;
    const beyond = wrap(lvl, target.x + d.x, target.y + d.y);
    if (isWall(lvl, beyond) || boxAt(state.boxes, beyond) >= 0) return state; // blocked push
    const boxes = state.boxes.map((b, i) => (i === bi ? beyond : b));
    return { player: target, boxes: sortBoxes(boxes), levelIndex: state.levelIndex };
  }
  return { player: target, boxes: state.boxes, levelIndex: state.levelIndex };
}

export function isSolved(state: SeamfoldState): boolean {
  const lvl = LEVELS[state.levelIndex];
  return state.boxes.every((b) => lvl.goals.some((g) => g.x === b.x && g.y === b.y));
}

/**
 * Corner deadlock, torus-aware: neighbors are wrapped, so a "corner" only
 * exists where actual walls meet — the seam itself never deadlocks a box.
 */
export function isDead(state: SeamfoldState): boolean {
  const lvl = LEVELS[state.levelIndex];
  const isGoal = (c: Cell) => lvl.goals.some((g) => g.x === c.x && g.y === c.y);
  const wallAt = (x: number, y: number) => isWall(lvl, wrap(lvl, x, y));
  for (const b of state.boxes) {
    if (isGoal(b)) continue;
    const up = wallAt(b.x, b.y - 1);
    const down = wallAt(b.x, b.y + 1);
    const left = wallAt(b.x - 1, b.y);
    const right = wallAt(b.x + 1, b.y);
    if ((up || down) && (left || right)) return true;
  }
  return false;
}

const stateKey = (s: SeamfoldState) => `${s.player.x},${s.player.y}|${s.boxes.map(cellKey).join(';')}`;

/** The Puzzle contract the solver consumes. */
export const seamfoldPuzzle: Puzzle<SeamfoldState, Move> = {
  initial: (level = 0) => initialState(level),
  moves: () => [...DIRS],
  apply: (s, m) => applyMove(s, m),
  isWin: isSolved,
  isDead,
  key: stateKey,
};

/** M4 fidelity variant: identical rules but seam crossings are forbidden. */
export const noWrapPuzzle: Puzzle<SeamfoldState, Move> = {
  initial: (level = 0) => initialState(level),
  moves: () => [...DIRS],
  apply: (s, m) => applyMove(s, m, false),
  isWin: isSolved,
  isDead,
  key: stateKey,
};

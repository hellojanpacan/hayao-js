// Pure Sokoban rules — no engine imports, no rendering. Implements the Puzzle
// interface so the solver can PROVE every level winnable. This is the "pure logic
// module" convention: turn-based truth lives here; the scene tree is just a view.

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

/** Static level geometry (walls + goals), separate from the mutable state. */
export interface Level {
  width: number;
  height: number;
  walls: Set<string>;
  goals: Cell[];
  start: Cell;
  boxes: Cell[];
}

export interface SokobanState {
  player: Cell;
  /** Box positions, kept sorted for a canonical key. */
  boxes: Cell[];
  levelIndex: number;
}

const cellKey = (c: Cell) => `${c.x},${c.y}`;
const sortBoxes = (b: Cell[]) => b.slice().sort((p, q) => p.y - q.y || p.x - q.x);

// ── Level maps (ASCII). #=wall @=player $=box .=goal *=box-on-goal +=player-on-goal ──
export const LEVEL_MAPS: string[] = [
  // 0 — a gentle first push
  [
    '#####',
    '#.@ #',
    '#.$ #',
    '#  $#',
    '#. .#',
    '#####',
  ].join('\n'),
  // 1 — a corner turn
  [
    '######',
    '#.   #',
    '#.$$@#',
    '#.   #',
    '#. . #',
    '######',
  ].join('\n'),
  // 2 — thread the needle
  [
    '#######',
    '#  .  #',
    '# $#$ #',
    '#.@ . #',
    '# $#  #',
    '#  .  #',
    '#######',
  ].join('\n'),
];

export function parseLevel(map: string): Level {
  const rows = map.split('\n');
  const walls = new Set<string>();
  const goals: Cell[] = [];
  const boxes: Cell[] = [];
  let start: Cell = { x: 0, y: 0 };
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = { x, y };
      switch (ch) {
        case '#': walls.add(cellKey(c)); break;
        case '.': goals.push(c); break;
        case '$': boxes.push(c); break;
        case '*': boxes.push(c); goals.push(c); break;
        case '@': start = c; break;
        case '+': start = c; goals.push(c); break;
      }
    });
  });
  return { width: Math.max(...rows.map((r) => r.length)), height: rows.length, walls, goals, boxes, start };
}

export const LEVELS: Level[] = LEVEL_MAPS.map(parseLevel);

export function initialState(levelIndex = 0): SokobanState {
  const lvl = LEVELS[levelIndex];
  return { player: { ...lvl.start }, boxes: sortBoxes(lvl.boxes), levelIndex };
}

const isWall = (lvl: Level, c: Cell) => lvl.walls.has(cellKey(c));
const boxAt = (boxes: Cell[], c: Cell) => boxes.findIndex((b) => b.x === c.x && b.y === c.y);

/** Apply a move; returns a NEW state (unchanged if the move is blocked). */
export function applyMove(state: SokobanState, move: Move): SokobanState {
  const lvl = LEVELS[state.levelIndex];
  const d = DELTA[move];
  const target: Cell = { x: state.player.x + d.x, y: state.player.y + d.y };
  if (isWall(lvl, target)) return state;

  const bi = boxAt(state.boxes, target);
  if (bi >= 0) {
    const beyond: Cell = { x: target.x + d.x, y: target.y + d.y };
    if (isWall(lvl, beyond) || boxAt(state.boxes, beyond) >= 0) return state; // blocked push
    const boxes = state.boxes.map((b, i) => (i === bi ? beyond : b));
    return { player: target, boxes: sortBoxes(boxes), levelIndex: state.levelIndex };
  }
  return { player: target, boxes: state.boxes, levelIndex: state.levelIndex };
}

export function isSolved(state: SokobanState): boolean {
  const lvl = LEVELS[state.levelIndex];
  return state.boxes.every((b) => lvl.goals.some((g) => g.x === b.x && g.y === b.y));
}

/** Is a box shoved into a non-goal corner (dead — unrecoverable)? Prunes the search. */
export function isDead(state: SokobanState): boolean {
  const lvl = LEVELS[state.levelIndex];
  const isGoal = (c: Cell) => lvl.goals.some((g) => g.x === c.x && g.y === c.y);
  for (const b of state.boxes) {
    if (isGoal(b)) continue;
    const up = isWall(lvl, { x: b.x, y: b.y - 1 });
    const down = isWall(lvl, { x: b.x, y: b.y + 1 });
    const left = isWall(lvl, { x: b.x - 1, y: b.y });
    const right = isWall(lvl, { x: b.x + 1, y: b.y });
    if ((up || down) && (left || right)) return true; // cornered off-goal
  }
  return false;
}

/** The Puzzle contract the solver consumes. */
export const sokobanPuzzle: Puzzle<SokobanState, Move> = {
  initial: (level = 0) => initialState(level),
  moves: () => [...DIRS],
  apply: (s, m) => applyMove(s, m),
  isWin: isSolved,
  isDead,
  key: (s) => `${s.player.x},${s.player.y}|${s.boxes.map(cellKey).join(';')}`,
};

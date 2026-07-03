// Glimmerfall match-3 sim — pure module. Swaps, line matches, gravity,
// rng refills, cascade combos. The sim resolves a whole cascade in one
// deterministic step; the VIEW animates it afterwards (choreography is
// cosmetic, resolution is instant truth).

import type { Rng } from '@hayao';

export const BOARD = 8;
export const COLORS = 6;
export const TARGET_SCORE = 1300;
export const MOVE_BUDGET = 22;

export type Board = number[]; // BOARD*BOARD gem colors (0..COLORS-1)

export const bidx = (x: number, y: number): number => y * BOARD + x;

/** All cells that are part of a 3+ line right now. */
export function findMatches(b: Board): Set<number> {
  const hit = new Set<number>();
  for (let y = 0; y < BOARD; y++)
    for (let x = 0; x < BOARD; x++) {
      const c = b[bidx(x, y)];
      if (c < 0) continue;
      if (x + 2 < BOARD && b[bidx(x + 1, y)] === c && b[bidx(x + 2, y)] === c) {
        hit.add(bidx(x, y));
        hit.add(bidx(x + 1, y));
        hit.add(bidx(x + 2, y));
      }
      if (y + 2 < BOARD && b[bidx(x, y + 1)] === c && b[bidx(x, y + 2)] === c) {
        hit.add(bidx(x, y));
        hit.add(bidx(x, y + 1));
        hit.add(bidx(x, y + 2));
      }
    }
  return hit;
}

/** Does swapping (x,y)→(x+dx,y+dy) produce a match? */
export function swapMakesMatch(b: Board, x: number, y: number, dx: number, dy: number): boolean {
  const nx = x + dx;
  const ny = y + dy;
  if (nx < 0 || ny < 0 || nx >= BOARD || ny >= BOARD) return false;
  const a = bidx(x, y);
  const c = bidx(nx, ny);
  [b[a], b[c]] = [b[c], b[a]];
  const ok = findMatches(b).size > 0;
  [b[a], b[c]] = [b[c], b[a]];
  return ok;
}

/** Any legal move on the board? */
export function hasMove(b: Board): boolean {
  for (let y = 0; y < BOARD; y++)
    for (let x = 0; x < BOARD; x++)
      if (swapMakesMatch(b, x, y, 1, 0) || swapMakesMatch(b, x, y, 0, 1)) return true;
  return false;
}

/** Fresh board: no pre-matches, at least one legal move. */
export function genBoard(rng: Rng): Board {
  for (let attempt = 0; attempt < 200; attempt++) {
    const b: Board = new Array(BOARD * BOARD);
    for (let y = 0; y < BOARD; y++)
      for (let x = 0; x < BOARD; x++) {
        let c = rng.int(COLORS);
        // Avoid completing a run of 3 during generation.
        for (let guard = 0; guard < 8; guard++) {
          const left2 = x >= 2 && b[bidx(x - 1, y)] === c && b[bidx(x - 2, y)] === c;
          const up2 = y >= 2 && b[bidx(x, y - 1)] === c && b[bidx(x, y - 2)] === c;
          if (!left2 && !up2) break;
          c = rng.int(COLORS);
        }
        b[bidx(x, y)] = c;
      }
    if (findMatches(b).size === 0 && hasMove(b)) return b;
  }
  throw new Error('glimmerfall: board generation failed (should be unreachable)');
}

export interface CascadeStep {
  cleared: number[];
  combo: number;
}

/**
 * Resolve all matches, gravity and refills until stable. Returns the score
 * gained and the choreography script (what cleared at each combo depth) for
 * the view to animate.
 */
export function resolve(b: Board, rng: Rng): { gained: number; steps: CascadeStep[] } {
  let gained = 0;
  let combo = 0;
  const steps: CascadeStep[] = [];
  for (;;) {
    const hit = findMatches(b);
    if (hit.size === 0) break;
    combo++;
    gained += hit.size * 10 * combo;
    steps.push({ cleared: [...hit].sort((a, z) => a - z), combo });
    for (const i of hit) b[i] = -1;
    // Gravity: per column, compact downward.
    for (let x = 0; x < BOARD; x++) {
      let write = BOARD - 1;
      for (let y = BOARD - 1; y >= 0; y--) {
        if (b[bidx(x, y)] >= 0) {
          b[bidx(x, write)] = b[bidx(x, y)];
          if (write !== y) b[bidx(x, y)] = -1;
          write--;
        }
      }
      for (let y = write; y >= 0; y--) b[bidx(x, y)] = rng.int(COLORS);
    }
  }
  return { gained, steps };
}

export interface GfState {
  board: Board;
  score: number;
  movesLeft: number;
  cursor: { x: number; y: number };
  /** Selected gem awaiting a swap direction, or null. */
  sel: { x: number; y: number } | null;
  reshuffles: number;
  lastSteps: CascadeStep[]; // choreography of the last resolve (view reads it)
  won: boolean;
  dead: boolean;
  [key: string]: unknown;
}

export function initialGf(rng: Rng): GfState {
  return { board: genBoard(rng), score: 0, movesLeft: MOVE_BUDGET, cursor: { x: 3, y: 3 }, sel: null, reshuffles: 0, lastSteps: [], won: false, dead: false };
}

export interface GfEvents {
  swapped: boolean;
  rejected: boolean;
  cascaded: number; // combo depth of the resolve
  reshuffled: boolean;
  won: boolean;
  died: boolean;
}

/** Attempt the swap (x,y) toward (dx,dy). Invalid swaps revert, cost nothing. */
export function trySwap(s: GfState, x: number, y: number, dx: number, dy: number, rng: Rng): GfEvents {
  const ev: GfEvents = { swapped: false, rejected: false, cascaded: 0, reshuffled: false, won: false, died: false };
  if (s.won || s.dead) return ev;
  if (!swapMakesMatch(s.board, x, y, dx, dy)) {
    ev.rejected = true;
    return ev;
  }
  const a = bidx(x, y);
  const c = bidx(x + dx, y + dy);
  [s.board[a], s.board[c]] = [s.board[c], s.board[a]];
  const { gained, steps } = resolve(s.board, rng);
  s.score += gained;
  s.movesLeft--;
  s.lastSteps = steps;
  ev.swapped = true;
  ev.cascaded = steps.length;
  // Board can go dead after refills: reshuffle until a move exists.
  while (!hasMove(s.board)) {
    s.board = genBoard(rng);
    s.reshuffles++;
    ev.reshuffled = true;
  }
  if (s.score >= TARGET_SCORE) {
    s.won = true;
    ev.won = true;
  } else if (s.movesLeft <= 0) {
    s.dead = true;
    ev.died = true;
  }
  return ev;
}

/** Best immediate swap by resolved score on a cloned board (greedy bot). */
export function bestSwap(s: GfState): { x: number; y: number; dx: number; dy: number } | null {
  let best: { x: number; y: number; dx: number; dy: number } | null = null;
  let bestGain = -1;
  for (let y = 0; y < BOARD; y++)
    for (let x = 0; x < BOARD; x++)
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        if (!swapMakesMatch(s.board, x, y, dx, dy)) continue;
        const clone = [...s.board];
        const a = bidx(x, y);
        const c = bidx(x + dx, y + dy);
        [clone[a], clone[c]] = [clone[c], clone[a]];
        // Score the immediate matches only (refills are luck, not skill).
        const gain = findMatches(clone).size;
        if (gain > bestGain) {
          bestGain = gain;
          best = { x, y, dx, dy };
        }
      }
  return best;
}

// Lumen's content pipeline — generate a board, PROVE it winnable with the engine
// solver, then estimate its difficulty so the Elo loop can serve it to a matched
// player. Following the house rule: never hand-author volume; express a board as
// a seed + params and let the solver gate every one. An unsolvable board is
// unshippable, so generation loops until the proof passes (with a guaranteed
// fallback that can never fail).

import { Rng, solve } from '@hayao';
import { allLitMask, chainFrom, makePuzzle, toCell, usefulCells, type Level } from './logic';

/** Difficulty band → board shape. Bigger, denser, more sparks = harder. */
export interface GenParams {
  width: number;
  height: number;
  prismMin: number;
  prismMax: number;
  maxSparks: number;
  /** Require the board to genuinely need the whole budget (no cheaper solve). */
  requireExactSparks: boolean;
}

/** Map a player rating to the board shape most likely to land near it. */
export function paramsForRating(rating: number): GenParams {
  if (rating < 900) return { width: 4, height: 4, prismMin: 3, prismMax: 4, maxSparks: 1, requireExactSparks: false };
  if (rating < 1150) return { width: 5, height: 5, prismMin: 4, prismMax: 6, maxSparks: 2, requireExactSparks: false };
  if (rating < 1450) return { width: 5, height: 5, prismMin: 6, prismMax: 8, maxSparks: 2, requireExactSparks: true };
  if (rating < 1750) return { width: 6, height: 6, prismMin: 8, prismMax: 11, maxSparks: 3, requireExactSparks: false };
  return { width: 6, height: 6, prismMin: 10, prismMax: 14, maxSparks: 3, requireExactSparks: true };
}

const NODE_CAP = 300_000;

/** Estimate a board's difficulty → its Elo rating. A heuristic, deliberately. */
export function rateLevel(level: Level, solutionPath: number[]): number {
  const target = allLitMask(level);
  const minSparks = level.sparks;

  // Spectacle proxy: the longest cascade in the intended solution.
  let chainDepth = 0;
  let mask = 0;
  for (const cell of solutionPath) {
    const { mask: next, waves } = chainFrom(level, mask, cell);
    chainDepth = Math.max(chainDepth, waves.length);
    mask = next;
  }

  // Trap proxy: of the placements that light something, how many CANNOT start a
  // full solution. A board with one true opening seed reads much harder than one
  // where any reasonable drop works.
  const starts = usefulCells(level);
  let winningStarts = 0;
  for (const c of starts) {
    const mask1 = chainFrom(level, 0, c).mask;
    if (mask1 === target) {
      winningStarts++;
      continue;
    }
    if (minSparks - 1 <= 0) continue;
    const r = solve(makePuzzle(level, { lit: mask1, sparksLeft: minSparks - 1 }), {
      maxDepth: minSparks - 1,
      nodeCap: NODE_CAP,
    });
    if (r.solvable) winningStarts++;
  }
  const hardness = Math.max(0, starts.length - winningStarts);

  const raw =
    600 +
    level.prisms.length * 26 +
    (minSparks - 1) * 230 +
    chainDepth * 22 +
    hardness * 14 +
    level.width * level.height * 2;
  return Math.max(500, Math.min(2600, Math.round(raw)));
}

/** A tiny board that is guaranteed solvable — the never-fail fallback. */
function fallbackLevel(seed: number, params: GenParams): Level {
  // A row of dormant prisms all firing east: one spark to their west lights the
  // leftmost, which relays into the next, and so on. Always winnable in 1.
  const prisms = [1, 2, 3].map((x) => ({ cell: toCell({ width: params.width } as Level, x, 0), dir: 1 as const }));
  const level: Level = { width: params.width, height: params.height, prisms, sparks: 1, seed, rating: 0 };
  const r = solve(makePuzzle(level), { maxDepth: 1, nodeCap: NODE_CAP });
  return { ...level, rating: rateLevel(level, r.path ?? [toCell(level, 0, 0)]) };
}

/**
 * Generate a solver-proven board from a seed within a difficulty band. Returns a
 * board whose `sparks` equals the minimum it truly needs and whose `rating` is
 * the difficulty estimate. Deterministic in `seed`.
 */
export function generateLevel(seed: number, params: GenParams): Level {
  const rng = new Rng(seed);
  const cellCount = params.width * params.height;

  for (let attempt = 0; attempt < 240; attempt++) {
    const prismCount = Math.min(cellCount - 2, rng.intRange(params.prismMin, params.prismMax));
    const cells = rng.shuffle(Array.from({ length: cellCount }, (_, i) => i)).slice(0, prismCount);
    const prisms = cells
      .map((cell) => ({ cell, dir: rng.int(4) as 0 | 1 | 2 | 3 }))
      .sort((a, b) => a.cell - b.cell);

    const probe: Level = {
      width: params.width,
      height: params.height,
      prisms,
      sparks: params.maxSparks,
      seed,
      rating: 0,
    };
    const r = solve(makePuzzle(probe), { maxDepth: params.maxSparks, nodeCap: NODE_CAP });
    if (!r.solvable || r.depth === undefined || r.depth < 1) continue;
    const minSparks = r.depth;
    if (params.requireExactSparks && minSparks !== params.maxSparks) continue;

    const level: Level = { ...probe, sparks: minSparks };
    return { ...level, rating: rateLevel(level, r.path ?? []) };
  }
  return fallbackLevel(seed, params);
}

/** A puzzle chosen for the player: the level + the seed it came from. */
export interface Served {
  level: Level;
  seed: number;
}

/**
 * Draw a handful of candidate boards for the player's rating band and serve the
 * one whose difficulty sits closest to a slightly-above-current target — enough
 * stretch to earn rating, never a wall. Deterministic in the passed `rng`.
 */
export function nextPuzzle(playerRating: number, rng: Rng, candidates = 6): Served {
  const params = paramsForRating(playerRating);
  const target = playerRating + 25;
  let best: Served | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < candidates; i++) {
    const seed = rng.intRange(1, 0x7fffffff);
    const level = generateLevel(seed, params);
    const score = Math.abs(level.rating - target);
    if (score < bestScore) {
      bestScore = score;
      best = { level, seed };
    }
  }
  // `best` is always set: candidates >= 1.
  return best as Served;
}

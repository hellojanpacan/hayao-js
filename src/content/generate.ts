// Solver-backed level GENERATION — the piece that turns "an agent hand-authors
// forty balanced rooms" (unreliable) into "an agent calls a generator and gets
// forty PROVEN rooms" (reliable). This is the content-volume unlock: the solver
// (verify/solver) already proves one hand-authored level winnable; here we run it
// in a loop over procedurally-seeded candidates and keep only the ones that are
// both winnable AND land inside a target difficulty band.
//
// Genre-agnostic by construction. You pass a `factory(rng) → Puzzle` that builds
// ONE candidate level from a seeded stream (a Sokoban layout, a tactics board, a
// wiring puzzle — anything that implements the pure `Puzzle` contract). The
// generator derives an independent, reproducible sub-seed per attempt, builds the
// candidate, solves it, and accepts it only if the proof lands in-band. Every kept
// level carries the sub-seed that reproduces it exactly, so the campaign that
// ships is data (a list of seeds), not forty hand-written maps.
//
// Determinism: the same (seed, count, band, factory) yields the same set on every
// machine — sub-seeds come from `hashString`, never wall-clock or Math.random.

import { Rng, hashString } from '../core/rng';
import { solve, type Puzzle, type SolveOptions } from '../verify/solver';

/** A difficulty window expressed on the solver's own proof metrics. */
export interface DifficultyBand {
  /** Minimum solution length (shortest winning move count). Below this = trivial. */
  minDepth?: number;
  /** Maximum solution length. Above this = a slog / likely unfair. */
  maxDepth?: number;
  /** Minimum nodes the solver expanded (a branchiness / "how much thinking" proxy). */
  minNodes?: number;
  /** Maximum nodes expanded — caps combinatorial monsters. */
  maxNodes?: number;
}

export interface GenerateOptions<State, Move> extends DifficultyBand {
  /** How many verified levels to return. */
  count: number;
  /** Base seed; the whole run is a pure function of it (default 1). */
  seed?: number;
  /** Cap on candidate attempts before giving up (default count * 60). */
  maxAttempts?: number;
  /** Search budget handed to the solver per candidate. */
  solve?: SolveOptions;
  /**
   * Extra rejection hook — return true to discard an otherwise in-band candidate
   * (e.g. a genre-specific "too few boxes" or "spawn adjacent to goal" rule).
   */
  reject?: (puzzle: Puzzle<State, Move>, result: AcceptedProof<Move>, subSeed: number) => boolean;
  /**
   * Canonical de-dup key for a candidate. Defaults to the puzzle's own initial
   * state key, so two seeds that happen to build the same layout collapse to one.
   */
  dedupeKey?: (puzzle: Puzzle<State, Move>, result: AcceptedProof<Move>) => string;
}

/** The solver proof carried by an accepted candidate. */
export interface AcceptedProof<Move> {
  /** Shortest winning move sequence (the existence proof). */
  path: Move[];
  /** Its length — the primary difficulty metric. */
  depth: number;
  /** Nodes the solver expanded to find it — a complexity proxy. */
  nodes: number;
}

/** A generated, solver-verified level: reproducible from `seed`, ramped by `depth`. */
export interface GeneratedLevel<State, Move> extends AcceptedProof<Move> {
  /** Position in the returned (difficulty-sorted) sequence. */
  index: number;
  /** The sub-seed that rebuilds this exact puzzle via `factory(new Rng(seed))`. */
  seed: number;
  /** The built puzzle instance (single-level: `initial()` returns this candidate). */
  puzzle: Puzzle<State, Move>;
}

export interface GenerateReport<State, Move> {
  levels: GeneratedLevel<State, Move>[];
  /** Candidates tried. */
  attempts: number;
  /** How many were solvable at all (in-band or not). */
  solvable: number;
  /** True if `count` levels were found before `maxAttempts` ran out. */
  complete: boolean;
  /** Reproduce the whole run: the sub-seeds, in ramp order. */
  seeds: number[];
}

/** Derive an independent, reproducible sub-seed for attempt `i` of a base run. */
export function subSeed(seed: number, i: number): number {
  return hashString(`hayao/gen:${seed >>> 0}:${i}`);
}

const inBand = (depth: number, nodes: number, band: DifficultyBand): boolean =>
  (band.minDepth === undefined || depth >= band.minDepth) &&
  (band.maxDepth === undefined || depth <= band.maxDepth) &&
  (band.minNodes === undefined || nodes >= band.minNodes) &&
  (band.maxNodes === undefined || nodes <= band.maxNodes);

/**
 * Generate `count` solver-verified levels inside a difficulty band. Builds
 * candidates from `factory`, proves each with the BFS solver, and keeps the
 * in-band, non-duplicate ones — sorted by solution depth so the returned
 * sequence already ramps. Pure: same options → same levels, everywhere.
 *
 * A capped solver search (`exhausted`) is treated as "unknown, reject" — a level
 * only ships if it was actually PROVEN winnable within budget.
 */
export function generateLevelsReport<State, Move>(
  factory: (rng: Rng) => Puzzle<State, Move>,
  opts: GenerateOptions<State, Move>,
): GenerateReport<State, Move> {
  const seed = opts.seed ?? 1;
  const maxAttempts = opts.maxAttempts ?? opts.count * 60;
  const dedupeKey = opts.dedupeKey ?? ((p) => p.key(p.initial()));
  const kept: GeneratedLevel<State, Move>[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  let solvable = 0;

  for (let i = 0; i < maxAttempts && kept.length < opts.count; i++) {
    attempts++;
    const s = subSeed(seed, i);
    const puzzle = factory(new Rng(s));
    const res = solve(puzzle, opts.solve);
    if (!res.solvable || res.exhausted || res.depth === undefined) continue;
    solvable++;
    const proof: AcceptedProof<Move> = { path: res.path ?? [], depth: res.depth, nodes: res.nodes };
    if (!inBand(proof.depth, proof.nodes, opts)) continue;
    const k = dedupeKey(puzzle, proof);
    if (seen.has(k)) continue;
    if (opts.reject?.(puzzle, proof, s)) continue;
    seen.add(k);
    kept.push({ ...proof, index: 0, seed: s, puzzle });
  }

  // Ramp: shortest solution first, nodes as a stable tiebreak, then seed.
  kept.sort((a, b) => a.depth - b.depth || a.nodes - b.nodes || a.seed - b.seed);
  kept.forEach((l, idx) => (l.index = idx));

  return {
    levels: kept,
    attempts,
    solvable,
    complete: kept.length >= opts.count,
    seeds: kept.map((l) => l.seed),
  };
}

/** Convenience: just the ramped levels. Throws if the band was too tight to fill. */
export function generateLevels<State, Move>(
  factory: (rng: Rng) => Puzzle<State, Move>,
  opts: GenerateOptions<State, Move>,
): GeneratedLevel<State, Move>[] {
  const report = generateLevelsReport(factory, opts);
  if (!report.complete) {
    throw new Error(
      `hayao: generator found only ${report.levels.length}/${opts.count} in-band levels ` +
        `in ${report.attempts} attempts (${report.solvable} solvable). ` +
        `Widen the band [depth ${opts.minDepth ?? 0}..${opts.maxDepth ?? '∞'}] or raise maxAttempts.`,
    );
  }
  return report.levels;
}

/** Rebuild the exact puzzle for a stored sub-seed — the campaign ships seeds, not maps. */
export function levelFromSeed<State, Move>(
  factory: (rng: Rng) => Puzzle<State, Move>,
  seed: number,
): Puzzle<State, Move> {
  return factory(new Rng(seed));
}

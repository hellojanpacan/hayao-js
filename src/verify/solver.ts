// Generic winnability solver. Turn-based/puzzle logic implements the pure
// Puzzle interface; the solver proves a level beatable by search. Deterministic
// opponent (fixed order + tie-breaks) means single-agent BFS — no adversarial
// branching. (narrow-js's insight, generalized and typed.)
//
// Rule of the house: a hand-authored level is presumed WRONG until the solver
// proves it winnable. In-head verification has a documented failure rate.

export interface Puzzle<State, Move> {
  /** Starting state (optionally per level index). */
  initial(level?: number): State;
  /** Legal moves from a state, in deterministic order. */
  moves(state: State): Move[];
  /** Apply a player move (may fold in a deterministic opponent response). */
  apply(state: State, move: Move): State;
  /** Win test. */
  isWin(state: State): boolean;
  /** Optional dead/lost test — pruned from the search. */
  isDead?(state: State): boolean;
  /** Canonical key for de-duplication (visited set). */
  key(state: State): string;
}

export interface SolveResult<Move> {
  solvable: boolean;
  /** Shortest winning move sequence, if found. */
  path?: Move[];
  /** Depth of the shortest solution. */
  depth?: number;
  /** Nodes expanded (a difficulty/complexity proxy). */
  nodes: number;
  /** True if the search hit a cap before proving/​disproving. */
  exhausted: boolean;
}

export interface SolveOptions {
  level?: number;
  maxDepth?: number;
  nodeCap?: number;
}

/** Breadth-first search → the shortest solution and a real winnability proof. */
export function solve<State, Move>(
  puzzle: Puzzle<State, Move>,
  options: SolveOptions = {},
): SolveResult<Move> {
  const maxDepth = options.maxDepth ?? 60;
  const nodeCap = options.nodeCap ?? 1_000_000;
  const start = puzzle.initial(options.level);

  if (puzzle.isWin(start)) return { solvable: true, path: [], depth: 0, nodes: 0, exhausted: false };

  interface QNode {
    state: State;
    path: Move[];
  }
  let frontier: QNode[] = [{ state: start, path: [] }];
  const seen = new Set<string>([puzzle.key(start)]);
  let nodes = 0;

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const next: QNode[] = [];
    for (const { state, path } of frontier) {
      for (const move of puzzle.moves(state)) {
        if (nodes >= nodeCap) return { solvable: false, nodes, exhausted: true };
        nodes++;
        const after = puzzle.apply(state, move);
        if (puzzle.isDead?.(after)) continue;
        if (puzzle.isWin(after)) {
          return { solvable: true, path: [...path, move], depth: depth + 1, nodes, exhausted: false };
        }
        const k = puzzle.key(after);
        if (!seen.has(k)) {
          seen.add(k);
          next.push({ state: after, path: [...path, move] });
        }
      }
    }
    frontier = next;
  }
  return { solvable: false, nodes, exhausted: frontier.length > 0 };
}

/**
 * Assert a puzzle level is winnable (throws with detail if not). Use in tests as
 * the content-balance gate.
 */
export function assertSolvable<State, Move>(
  puzzle: Puzzle<State, Move>,
  options: SolveOptions = {},
): SolveResult<Move> {
  const result = solve(puzzle, options);
  if (!result.solvable) {
    throw new Error(
      `hayao: level ${options.level ?? 0} is NOT winnable ` +
        `(expanded ${result.nodes} nodes${result.exhausted ? ', search capped — raise nodeCap/maxDepth' : ''}).`,
    );
  }
  return result;
}

// Agency gate (Channel 7): score a puzzle's DECISION SPACE, not just its
// winnability. The automated half of "interesting choices" — the machine-checkable
// complement to the human coherence gate (design/00-process/the-spine.md).
//
// The solver proves a line EXISTS. It says nothing about whether the player gets to
// CHOOSE. A level with exactly one non-losing move at every step is provably
// winnable and a dead corridor — you execute it, you don't play it. This gate reads
// the reachable state graph (the same substrate the solver walks) and measures the
// things that make choices real:
//
//   • viable ≠ legal.  A move is *viable* only if the state it leads to can still
//     reach a win. Four legal buttons where three kill you is one real choice, not
//     four. Every metric below counts viable moves, never merely legal ones.
//   • forced fraction — the share of decision points with exactly ONE viable move.
//     High = a corridor (antipattern-fake-choice, one node at a time).
//   • viable-line count — how many DISTINCT shortest solutions exist. One = a single
//     path to win = no strategic agency, however branchy it looks locally.
//   • mean viable branching / staked choices — breadth of real options, and whether
//     a wrong turn is even possible (a choice with no losing option has no stakes).
//   • dominant-line detection — OPT-IN via a `value(state)`: the share of real
//     choices with one obviously-best move. High = the game solves to a script
//     (antipattern-boring-optimal / solved-metagame).
//
// Pure and deterministic, the `rampIssues` / `ablationIssues` idiom: an
// `*Issues(): string[]` gate (empty = pass) plus an `assert*` thrower and a `*Stats`
// probe for logging the numbers.

import type { Puzzle } from './solver';

const dedupe = (a: string[]): string[] => [...new Set(a)];

export interface AgencyOptions<State> {
  /** Level index passed to `puzzle.initial` (default 0). */
  level?: number;
  /** BFS depth cap (default 40). */
  maxDepth?: number;
  /** Node-expansion cap — the exploration budget (default 200_000). */
  nodeCap?: number;
  /** Saturation cap for the viable-line counter, so a wide graph can't overflow (default 100_000). */
  lineCap?: number;
  /**
   * Optional value of a state (higher = better) — enables dominant-line detection.
   * Without it, the gate measures corridor/branching/lines; with it, it also flags
   * choices that resolve to one obvious answer.
   */
  value?: (state: State) => number;
  /**
   * How much the best viable option must beat the runner-up (in `value` units) to
   * count as an "obvious" choice (default 0 — any strict best counts). Set this to a
   * meaningful gap in your score scale so near-ties aren't called obvious.
   */
  dominanceMargin?: number;
  /** Max share of decisions allowed to be forced before it reads as a corridor (default 0.6). */
  maxForcedFraction?: number;
  /** Minimum distinct shortest solutions (default 2 — one is a corridor). */
  minViableLines?: number;
  /** Minimum mean viable moves per decision (default 1.5). */
  minMeanBranching?: number;
  /** Max share of real choices with an obvious best move, when `value` is given (default 0.8). */
  maxDominance?: number;
}

export interface AgencyStats {
  /** States reached within the caps. */
  reachableStates: number;
  /** States from which a win is still reachable (the "live" set). */
  liveStates: number;
  /** Live, non-win states with ≥1 legal move — the places you actually choose. */
  decisionStates: number;
  /** Decision states with exactly one VIABLE move (no real choice). */
  forcedStates: number;
  /** forcedStates / decisionStates — corridor-ness (0 = always a choice, 1 = on rails). */
  forcedFraction: number;
  /** Mean viable moves across decision states — breadth of real options. */
  meanViableBranching: number;
  /** Decision states with ≥2 viable moves. */
  openChoiceStates: number;
  openChoiceFraction: number;
  /** Open choices that ALSO have a losing option — a fork where a wrong turn exists (real stakes). */
  stakedChoiceStates: number;
  stakedChoiceFraction: number;
  /** Distinct shortest winning paths (capped at `lineCap`). */
  viableLineCount: number;
  /** True if the line counter hit its cap (the true count is ≥ the reported one). */
  viableLineCapped: boolean;
  /** Shortest winning depth, or -1 if no win was found within the caps. */
  solutionDepth: number;
  /** Legal first moves from the initial state. */
  legalFirstMoves: number;
  /** Of those, how many keep a win reachable — the real opening choices. */
  viableFirstMoves: number;
  /** Share of open choices with one obviously-best move (only when `value` is given). */
  dominanceFraction?: number;
  /** True if exploration hit a cap (metrics are a lower bound on the full graph). */
  exhausted: boolean;
}

/**
 * Explore the winnable state graph and compute the full decision-space profile.
 * Never throws — the verdict lives in `agencyIssues`.
 */
export function agencyStats<State, Move>(puzzle: Puzzle<State, Move>, opts: AgencyOptions<State> = {}): AgencyStats {
  const maxDepth = opts.maxDepth ?? 40;
  const nodeCap = opts.nodeCap ?? 200_000;
  const lineCap = opts.lineCap ?? 100_000;
  const capAdd = (a: number, b: number): number => Math.min(lineCap, a + b);

  const start = puzzle.initial(opts.level);
  const startKey = puzzle.key(start);

  const dist = new Map<string, number>();
  const ways = new Map<string, number>(); // # shortest paths start→key (saturating at lineCap)
  const moveKeys = new Map<string, (string | null)[]>(); // expanded state → successor key per legal move (null = a losing/dead move)
  const stateOf = new Map<string, State>(); // expanded states, kept for value/dominance
  const winK = new Set<string>();
  const seen = new Set<string>([startKey]);

  dist.set(startKey, 0);
  ways.set(startKey, 1);
  const startWin = puzzle.isWin(start);
  if (startWin) winK.add(startKey);

  let nodes = 0;
  let exhausted = false;
  let frontier: { state: State; key: string }[] = startWin ? [] : [{ state: start, key: startKey }];

  // Layered BFS: processing states in nondecreasing depth keeps the shortest-path
  // (`ways`) counting correct, and records the graph for backward liveness.
  for (let depth = 0; depth < maxDepth && frontier.length > 0 && !exhausted; depth++) {
    const next: { state: State; key: string }[] = [];
    for (const { state, key } of frontier) {
      const moves = puzzle.moves(state);
      stateOf.set(key, state);
      const targets: (string | null)[] = [];
      for (const m of moves) {
        if (nodes >= nodeCap) {
          exhausted = true;
          break;
        }
        nodes++;
        const after = puzzle.apply(state, m);
        if (puzzle.isDead?.(after)) {
          targets.push(null); // a legal move that loses — real, but never viable
          continue;
        }
        const k = puzzle.key(after);
        targets.push(k);
        const isW = puzzle.isWin(after);
        if (!seen.has(k)) {
          seen.add(k);
          dist.set(k, depth + 1);
          ways.set(k, ways.get(key) ?? 0);
          if (isW) winK.add(k);
          else next.push({ state: after, key: k });
        } else {
          if (dist.get(k) === depth + 1) ways.set(k, capAdd(ways.get(k) ?? 0, ways.get(key) ?? 0));
          if (isW) winK.add(k);
        }
      }
      moveKeys.set(key, targets);
      if (exhausted) break;
    }
    frontier = next;
  }

  // Backward liveness: a state is live if it is a win or a non-dead move leads to a
  // live state. Seed with wins, propagate along reversed edges.
  const rev = new Map<string, string[]>();
  for (const [u, targets] of moveKeys) {
    for (const t of targets) {
      if (t === null) continue;
      const arr = rev.get(t);
      if (arr) arr.push(u);
      else rev.set(t, [u]);
    }
  }
  const live = new Set<string>(winK);
  const q: string[] = [...winK];
  while (q.length > 0) {
    const k = q.pop() as string;
    for (const u of rev.get(k) ?? []) {
      if (!live.has(u)) {
        live.add(u);
        q.push(u);
      }
    }
  }

  // Decision-space metrics over live, non-win, expanded states.
  const margin = opts.dominanceMargin ?? 0;
  let decisionStates = 0;
  let forcedStates = 0;
  let openChoiceStates = 0;
  let stakedChoiceStates = 0;
  let branchingSum = 0;
  let obviousChoices = 0;
  let openForDominance = 0;

  for (const [u, targets] of moveKeys) {
    if (winK.has(u) || !live.has(u) || targets.length === 0) continue;
    let viable = 0;
    let losing = 0;
    for (const t of targets) {
      if (t !== null && live.has(t)) viable++;
      else losing++;
    }
    decisionStates++;
    branchingSum += viable;
    if (viable === 1) forcedStates++;
    if (viable >= 2) {
      openChoiceStates++;
      if (losing >= 1) stakedChoiceStates++;
      if (opts.value) {
        openForDominance++;
        const st = stateOf.get(u) as State;
        const mvs = puzzle.moves(st);
        const vals: number[] = [];
        for (let i = 0; i < mvs.length; i++) {
          const t = targets[i];
          if (t !== null && live.has(t)) vals.push(opts.value(puzzle.apply(st, mvs[i])));
        }
        vals.sort((a, b) => b - a);
        if (vals.length >= 2 && vals[0] - vals[1] > margin) obviousChoices++;
      }
    }
  }

  // Viable lines = distinct shortest winning paths.
  let solutionDepth = -1;
  for (const w of winK) {
    const d = dist.get(w) ?? Infinity;
    if (solutionDepth === -1 || d < solutionDepth) solutionDepth = d;
  }
  let viableLineCount = 0;
  if (solutionDepth >= 0) {
    for (const w of winK) if (dist.get(w) === solutionDepth) viableLineCount = capAdd(viableLineCount, ways.get(w) ?? 0);
  }

  const rootTargets = moveKeys.get(startKey) ?? [];
  let viableFirstMoves = 0;
  for (const t of rootTargets) if (t !== null && live.has(t)) viableFirstMoves++;

  return {
    reachableStates: seen.size,
    liveStates: live.size,
    decisionStates,
    forcedStates,
    forcedFraction: decisionStates > 0 ? forcedStates / decisionStates : 0,
    meanViableBranching: decisionStates > 0 ? branchingSum / decisionStates : 0,
    openChoiceStates,
    openChoiceFraction: decisionStates > 0 ? openChoiceStates / decisionStates : 0,
    stakedChoiceStates,
    stakedChoiceFraction: decisionStates > 0 ? stakedChoiceStates / decisionStates : 0,
    viableLineCount,
    viableLineCapped: viableLineCount >= lineCap,
    solutionDepth,
    legalFirstMoves: rootTargets.length,
    viableFirstMoves,
    dominanceFraction: opts.value ? (openForDominance > 0 ? obviousChoices / openForDominance : 0) : undefined,
    exhausted,
  };
}

/**
 * The gate: the specific ways a level's decision space is impoverished (empty array
 * = a rich, agentful level). Complements `assertSolvable` — winnable AND worth
 * choosing, not just winnable.
 */
export function agencyIssues<State, Move>(puzzle: Puzzle<State, Move>, opts: AgencyOptions<State> = {}): string[] {
  const s = agencyStats(puzzle, opts);
  const maxForced = opts.maxForcedFraction ?? 0.6;
  const minLines = opts.minViableLines ?? 2;
  const minBranch = opts.minMeanBranching ?? 1.5;
  const maxDom = opts.maxDominance ?? 0.8;
  const issues: string[] = [];

  if (s.solutionDepth < 0) {
    issues.push(
      `no winning line found within the caps (${s.reachableStates} states${s.exhausted ? ', search capped — raise nodeCap/maxDepth' : ''}) — prove winnability first with assertSolvable, or the level is unwinnable`,
    );
    return dedupe(issues);
  }
  if (s.decisionStates === 0) {
    issues.push('no decision states on any winning line — the win is immediate or on rails; there is nothing to choose');
    return dedupe(issues);
  }
  if (s.forcedFraction > maxForced) {
    issues.push(
      `corridor: ${(s.forcedFraction * 100).toFixed(0)}% of decisions are forced — only one non-losing move (past the ${(maxForced * 100).toFixed(0)}% ceiling). The player executes a line, they don't choose one (see antipattern-fake-choice; the-spine agency)`,
    );
  }
  if (s.viableLineCount < minLines) {
    issues.push(
      `single-solution corridor: only ${s.viableLineCount} distinct optimal line${s.viableLineCount === 1 ? '' : 's'} (need ≥ ${minLines}) — one path to the win is no strategic agency, however branchy it looks locally`,
    );
  }
  if (s.meanViableBranching < minBranch) {
    issues.push(
      `thin decision space: ${s.meanViableBranching.toFixed(2)} viable move(s) per decision on average (need ≥ ${minBranch}) — the options are narrow; most "choices" are one real move dressed as several`,
    );
  }
  if (opts.value && s.dominanceFraction !== undefined && s.dominanceFraction > maxDom) {
    issues.push(
      `dominant line: ${(s.dominanceFraction * 100).toFixed(0)}% of real choices have one obviously-best move (past the ${(maxDom * 100).toFixed(0)}% ceiling) — the game solves to a script (antipattern-boring-optimal / solved-metagame)`,
    );
  }
  return dedupe(issues);
}

/**
 * Assert a level has real agency (throws with the first failure if not). The
 * decision-space analogue of `assertSolvable`: one call gates that a winnable level
 * is also worth playing. Returns the stats on success so a test can log them.
 */
export function assertAgency<State, Move>(puzzle: Puzzle<State, Move>, opts: AgencyOptions<State> = {}): AgencyStats {
  const issues = agencyIssues(puzzle, opts);
  if (issues.length > 0) {
    throw new Error(`hayao: level ${opts.level ?? 0} has impoverished agency — ${issues[0]}`);
  }
  return agencyStats(puzzle, opts);
}

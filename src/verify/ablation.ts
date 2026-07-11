// Ablation proof (Channel 6): prove a game's CENTRAL COUPLING is load-bearing —
// the sharp form of FUN law 2 ("skill-delta is the closest thing to a fun proof").
//
// Law 2 asks: does skilled play beat null play? That proves *some* tension exists.
// It does NOT prove *where* it comes from. A game can pass law 2 while its tension
// lives in one system and a dozen others are decoration (design/70-antipatterns/
// decoration.md) riding along, unproven.
//
// The ablation proof localizes the tension to the spine (design/00-process/
// the-spine.md). Build the game twice: once with its central coupling intact
// (`coupled`), once with that ONE coupling neutralized (`ablated` — free light,
// infinite water, no stamina; everything else identical). Run the SAME two
// policies — skilled and lazy — over both. The claim:
//
//   • WITH the coupling, skilled ≫ lazy      (tension present — this is law 2)
//   • WITHOUT it, skilled ≈ lazy             (skill stops discriminating)
//   • therefore the skill-gap COLLAPSES when the coupling is removed
//
// A gap that collapses proves the coupling is the *source* of the tension — the
// spine's "does using the superpower well create the next problem?" gate, made
// mechanical. A gap that survives ablation proves the coupling is decoration: the
// game is fun for some OTHER reason, and this system is unproven weight.
//
// Pure and deterministic, the same idiom as `rampIssues` / `assertRamp`: an
// `*Issues(): string[]` gate (empty = pass) plus an `assert*` thrower. Policies
// route all randomness through `Rng` (never Math.random), so a report replays bit
// for bit.

import type { Puzzle } from './solver';
import { solve, type SolveOptions } from './solver';
import { Rng } from '../core/rng';

const dedupe = (a: string[]): string[] => [...new Set(a)];

/**
 * A policy plays a puzzle from its initial state and returns a scalar SCORE —
 * higher means better play. Win/lose games use 1/0 (or a win-rate in [0,1] when
 * the policy samples); scored games return the score. Must be a pure function of
 * the puzzle (route any randomness through a seeded `Rng`), so the whole proof is
 * reproducible.
 */
export type Policy<State, Move> = (puzzle: Puzzle<State, Move>, level?: number) => number;

/**
 * One ablation experiment: the same game in two forms, and the two policies to run
 * over both. `coupled` has the central coupling intact; `ablated` is byte-identical
 * except that ONE coupling is neutralized. `skilled` should play well, `lazy`
 * should play carelessly — the proof is about the GAP between them, not either
 * alone.
 */
export interface AblationExperiment<State, Move> {
  /** Human name of the coupling being tested, for messages ("flare-cost", "aquifer drawdown"). */
  coupling: string;
  /** The real game — its central coupling intact. */
  coupled: Puzzle<State, Move>;
  /** The same game with that ONE coupling neutralized; everything else identical. */
  ablated: Puzzle<State, Move>;
  /** Good play (e.g. `optimalPolicy()` or a hand-written heuristic). */
  skilled: Policy<State, Move>;
  /** Careless / null play (e.g. `randomPolicy(seed)`). */
  lazy: Policy<State, Move>;
  /** Levels to average each policy over (default `[0]`). More levels = a steadier signal. */
  levels?: number[];
}

export interface AblationOptions {
  /**
   * Minimum skill-gap WITH the coupling (skilled − lazy). Below this there's no
   * tension to localize — the game fails law 2 before ablation is even meaningful
   * (default 0.5, assuming [0,1]-normalized win-rate policies; set to your score
   * units for a scored game).
   */
  minCoupledGap?: number;
  /**
   * Minimum COLLAPSE of the skill-gap under ablation (coupledGap − ablatedGap).
   * This is the ablation claim proper: how much of the tension the coupling
   * actually carries (default 0.4).
   */
  minCollapse?: number;
}

export interface AblationReport {
  coupling: string;
  /** Averaged policy scores across the levels, per cell of the 2×2. */
  skilled: { coupled: number; ablated: number };
  lazy: { coupled: number; ablated: number };
  /** skilled − lazy, WITH the coupling (the law-2 gap). */
  coupledGap: number;
  /** skilled − lazy, WITHOUT the coupling (the residual gap). */
  ablatedGap: number;
  /** coupledGap − ablatedGap: how much tension the coupling carries. */
  collapse: number;
  /** How much lazy play IMPROVED when the coupling was removed (scarcity lifted). */
  lazyRise: number;
  /** How much skilled play FELL when the coupling was removed (coupling aided winning). */
  skilledDrop: number;
  /** One-line reading of WHERE the collapse came from — informative, not a verdict. */
  note: string;
  ok: boolean;
  issues: string[];
  /** Levels averaged over. */
  levels: number[];
}

/** Average a policy's score across the experiment's levels (deterministic). */
function averageScore<S, M>(policy: Policy<S, M>, puzzle: Puzzle<S, M>, levels: number[]): number {
  let sum = 0;
  for (const level of levels) sum += policy(puzzle, level);
  return sum / levels.length;
}

/** The 2×2 of averaged scores plus the three derived gaps — computed once, shared. */
interface Cells {
  skilled: { coupled: number; ablated: number };
  lazy: { coupled: number; ablated: number };
  coupledGap: number;
  ablatedGap: number;
  collapse: number;
}

function computeCells<S, M>(exp: AblationExperiment<S, M>): { cells: Cells; levels: number[] } {
  const levels = exp.levels && exp.levels.length ? exp.levels : [0];
  const skilled = {
    coupled: averageScore(exp.skilled, exp.coupled, levels),
    ablated: averageScore(exp.skilled, exp.ablated, levels),
  };
  const lazy = {
    coupled: averageScore(exp.lazy, exp.coupled, levels),
    ablated: averageScore(exp.lazy, exp.ablated, levels),
  };
  const coupledGap = skilled.coupled - lazy.coupled;
  const ablatedGap = skilled.ablated - lazy.ablated;
  return { cells: { skilled, lazy, coupledGap, ablatedGap, collapse: coupledGap - ablatedGap }, levels };
}

/** The proof failures for a pre-computed 2×2 (shared by the gate and the runner). */
function issuesFromCells(coupling: string, opts: AblationOptions, c: Cells): string[] {
  const minCoupledGap = opts.minCoupledGap ?? 0.5;
  const minCollapse = opts.minCollapse ?? 0.4;
  const issues: string[] = [];
  const f = (n: number): string => n.toFixed(3);

  // 0. Sanity: a "skilled" policy that loses to "lazy" WITH the coupling means the
  // labels are swapped or the game actively punishes skill — louder than a weak gap.
  if (c.coupledGap < 0) {
    issues.push(
      `"${coupling}": skilled play LOSES to lazy play with the coupling (${f(c.skilled.coupled)} vs ${f(c.lazy.coupled)}) — policies swapped, or the game rewards carelessness (FUN law 2 inverted)`,
    );
  } else if (c.coupledGap < minCoupledGap) {
    // 1. No tension even WITH the coupling → it carries no skill-gap (law 2 fails).
    issues.push(
      `"${coupling}" carries no tension: WITH it, skilled beats lazy by only ${f(c.coupledGap)} (need ≥ ${f(minCoupledGap)}) — the coupling is not load-bearing; likely decoration (see the-spine / antipattern-decoration)`,
    );
  }

  // 2. The ablation claim: removing the coupling must COLLAPSE the skill-gap. A gap
  // that survives ablation means the tension comes from elsewhere — this system is
  // decoration even if the game as a whole is fun.
  if (c.coupledGap >= 0 && c.collapse < minCollapse) {
    issues.push(
      `"${coupling}" is not the SOURCE of the tension: ablating it moved the skill-gap by only ${f(c.collapse)} ` +
        `(coupled ${f(c.coupledGap)} → ablated ${f(c.ablatedGap)}, need a drop ≥ ${f(minCollapse)}). ` +
        `The spine's pressure lives elsewhere — or "${coupling}" is decoration`,
    );
  }

  return dedupe(issues);
}

/**
 * Run the 2×2 (skilled/lazy × coupled/ablated) and compute every derived number.
 * Never throws; the verdict lives in `report.ok` / `report.issues`.
 */
export function runAblation<S, M>(exp: AblationExperiment<S, M>, opts: AblationOptions = {}): AblationReport {
  const { cells: c, levels } = computeCells(exp);
  const lazyRise = c.lazy.ablated - c.lazy.coupled;
  const skilledDrop = c.skilled.coupled - c.skilled.ablated;
  const issues = issuesFromCells(exp.coupling, opts, c);
  return {
    coupling: exp.coupling,
    skilled: c.skilled,
    lazy: c.lazy,
    coupledGap: c.coupledGap,
    ablatedGap: c.ablatedGap,
    collapse: c.collapse, // === skilledDrop + lazyRise
    lazyRise,
    skilledDrop,
    note: describeCollapse(exp.coupling, lazyRise, skilledDrop),
    ok: issues.length === 0,
    issues,
    levels,
  };
}

/**
 * The gate proper. Returns the specific proof failures — empty array means the
 * coupling is proven load-bearing. Runs the four policy passes; use `runAblation`
 * when you also want the numbers back.
 */
export function ablationIssues<S, M>(exp: AblationExperiment<S, M>, opts: AblationOptions = {}): string[] {
  return issuesFromCells(exp.coupling, opts, computeCells(exp).cells);
}

/**
 * Assert a coupling is load-bearing (throws with the first proof failure if not).
 * The spine-level analogue of `assertSolvable` / `assertRamp`: one call turns the
 * "does the superpower create its own problem?" gate into CI. Returns the full
 * report on success so a test can log the numbers.
 */
export function assertLoadBearing<S, M>(exp: AblationExperiment<S, M>, opts: AblationOptions = {}): AblationReport {
  const report = runAblation(exp, opts);
  if (!report.ok) {
    throw new Error(`hayao: coupling "${exp.coupling}" is not proven load-bearing — ${report.issues[0]}`);
  }
  return report;
}

/** Human reading of which side of the 2×2 moved (informative; both are valid collapses). */
function describeCollapse(coupling: string, lazyRise: number, skilledDrop: number): string {
  const eps = 1e-9;
  if (lazyRise <= eps && skilledDrop <= eps) return `"${coupling}": ablation barely moved either policy — the gap does not depend on it`;
  if (lazyRise >= skilledDrop) {
    return `"${coupling}": ablation lifted the SCARCITY — lazy play catches up (+${lazyRise.toFixed(3)}); the coupling was gating careless play`;
  }
  return `"${coupling}": ablation dropped SKILLED play (−${skilledDrop.toFixed(3)}) more than it lifted lazy — the coupling was load-bearing for winning itself, not only for tension`;
}

// ── Built-in policies ────────────────────────────────────────────────────────
// Two ready-made poles for the skilled/lazy contrast on any `Puzzle`. Bring your
// own for scored games (a heuristic pilot, a null baseline) — a Policy is just
// `(puzzle, level) => score`.

/**
 * The optimal player: BFS via the solver. Scores 1 if the level is winnable within
 * the caps, else 0. The natural "skilled" pole for a winnability puzzle — it plays
 * as well as the game allows.
 */
export function optimalPolicy<S, M>(opts: SolveOptions = {}): Policy<S, M> {
  return (puzzle, level) => (solve(puzzle, { ...opts, level }).solvable ? 1 : 0);
}

export interface RandomPolicyOptions {
  /** Independent random playthroughs to average per level (default 16). */
  tries?: number;
  /** Max moves per playthrough before giving up (default 80). */
  depthCap?: number;
}

/**
 * The null player: takes uniformly-random legal moves until it wins, dies, or hits
 * the depth cap; scores the fraction of `tries` that reached a win. Deterministic —
 * each try seeds a fresh `Rng` from `(seed, level, try)`, so the same experiment
 * always yields the same number. The natural "lazy" pole: careless play that a
 * real tension should defeat.
 */
export function randomPolicy<S, M>(seed: number, opts: RandomPolicyOptions = {}): Policy<S, M> {
  const tries = Math.max(1, opts.tries ?? 16);
  const depthCap = opts.depthCap ?? 80;
  return (puzzle, level) => {
    let wins = 0;
    for (let t = 0; t < tries; t++) {
      const rng = new Rng(((seed >>> 0) ^ Math.imul((level ?? 0) + 1, 0x9e3779b9) ^ Math.imul(t + 1, 0x85ebca6b)) >>> 0);
      let state = puzzle.initial(level);
      let won = puzzle.isWin(state);
      for (let d = 0; d < depthCap && !won; d++) {
        if (puzzle.isDead?.(state)) break;
        const ms = puzzle.moves(state);
        if (ms.length === 0) break;
        state = puzzle.apply(state, ms[rng.int(ms.length)]);
        won = puzzle.isWin(state);
      }
      if (won) wins++;
    }
    return wins / tries;
  };
}

export interface GreedyPolicyOptions {
  /** Max moves before giving up (default 80). */
  depthCap?: number;
}

/**
 * A greedy player: each turn takes the legal move whose resulting state scores
 * highest under `heuristic` (deterministic first-move tie-break). Scores 1 on a
 * win, else 0. A smarter-than-random "skilled" pole for games where the optimal
 * solver is too slow, or a middling baseline to sandwich between optimal and null.
 */
export function greedyPolicy<S, M>(heuristic: (state: S) => number, opts: GreedyPolicyOptions = {}): Policy<S, M> {
  const depthCap = opts.depthCap ?? 80;
  return (puzzle, level) => {
    let state = puzzle.initial(level);
    let won = puzzle.isWin(state);
    for (let d = 0; d < depthCap && !won; d++) {
      if (puzzle.isDead?.(state)) break;
      const ms = puzzle.moves(state);
      if (ms.length === 0) break;
      let best = ms[0];
      let bestH = -Infinity;
      for (const m of ms) {
        const h = heuristic(puzzle.apply(state, m));
        if (h > bestH) {
          bestH = h;
          best = m;
        }
      }
      state = puzzle.apply(state, best);
      won = puzzle.isWin(state);
    }
    return won ? 1 : 0;
  };
}

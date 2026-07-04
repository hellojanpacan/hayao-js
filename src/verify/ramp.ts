// Ramp gate (Channel 5): prove the SHAPE of an hour, not just one level.
//
// The solver proves each level winnable; the feel gates prove each moment feels
// fair. Neither says the *sequence* is well-formed. A campaign that jumps from
// trivial to brutal in one step, or flatlines at one difficulty for forty levels,
// is "correct" level-by-level and miserable to play. This gate reads the per-level
// difficulty series (solver depths, or any monotone difficulty proxy) and asserts
// the fundamentals of a good curve — the things that ARE mechanical, not taste:
//
//   1. escalation   — the finale out-challenges the opening; the trend rises.
//   2. no cliffs     — no single step spikes difficulty beyond an envelope (the
//                      #1 cause of a "difficulty wall" that sheds players).
//   3. rhythm        — small dips (breathers) are allowed, but the curve doesn't
//                      mostly descend; forward progress dominates.
//   4. variety       — the series isn't a flat line; levels actually differ.
//
// Pure, allocation-light, and returns human-readable issues (empty = pass), the
// same idiom as `layoutIssues` / the feel gates — one line wires it into verify.

const dedupe = (a: string[]): string[] => [...new Set(a)];

export interface RampStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  /** Distinct difficulty values — a flat curve has 1. */
  distinct: number;
  /** Largest single step-to-step increase. */
  maxJump: number;
  /** Fraction of steps that rise or hold (0..1). */
  forwardFraction: number;
}

/** Summarize a difficulty series — handy for logging the curve next to the gate. */
export function rampStats(difficulty: readonly number[]): RampStats {
  const n = difficulty.length;
  if (n === 0) return { count: 0, min: 0, max: 0, mean: 0, distinct: 0, maxJump: 0, forwardFraction: 1 };
  let min = difficulty[0];
  let max = difficulty[0];
  let sum = 0;
  let maxJump = 0;
  let forward = 0;
  for (let i = 0; i < n; i++) {
    const d = difficulty[i];
    if (d < min) min = d;
    if (d > max) max = d;
    sum += d;
    if (i > 0) {
      const step = d - difficulty[i - 1];
      if (step > maxJump) maxJump = step;
      if (step >= 0) forward++;
    }
  }
  return {
    count: n,
    min,
    max,
    mean: sum / n,
    distinct: new Set(difficulty).size,
    maxJump,
    forwardFraction: n > 1 ? forward / (n - 1) : 1,
  };
}

export interface RampOptions {
  /**
   * Largest allowed single-step increase, as a MULTIPLE of the average forward
   * step. A step steeper than this reads as a difficulty cliff (default 3×).
   */
  maxJumpFactor?: number;
  /** Absolute floor for the jump envelope so tiny early steps don't over-constrain (default 2). */
  minJumpAllowance?: number;
  /** Minimum fraction of steps that must rise-or-hold — forward progress (default 0.6). */
  minForwardFraction?: number;
  /** Minimum distinct difficulty values — variety, not a flat line (default 3). */
  minDistinct?: number;
  /** Require the last level to be within this fraction of the peak (default 0.8 = finale ≥ 80% of max). */
  finaleFraction?: number;
}

/**
 * Audit a difficulty curve. `difficulty[i]` is the i-th level's difficulty proxy
 * — typically the solver's solution depth, but any monotone measure works. Returns
 * the specific curve sins found (empty array = a well-shaped ramp).
 */
export function rampIssues(difficulty: readonly number[], opts: RampOptions = {}): string[] {
  const maxJumpFactor = opts.maxJumpFactor ?? 3;
  const minJumpAllowance = opts.minJumpAllowance ?? 2;
  const minForward = opts.minForwardFraction ?? 0.6;
  const minDistinct = opts.minDistinct ?? 3;
  const finaleFraction = opts.finaleFraction ?? 0.8;
  const issues: string[] = [];
  const n = difficulty.length;
  if (n < 2) {
    issues.push(`ramp has ${n} level(s) — need at least 2 to form a curve`);
    return issues;
  }
  const s = rampStats(difficulty);

  // 1. Escalation: the finale should be at or near the hardest point.
  if (difficulty[n - 1] < difficulty[0]) {
    issues.push(`curve descends overall: finale (${difficulty[n - 1]}) is easier than the opener (${difficulty[0]}) — the game gets EASIER`);
  }
  if (s.max > 0 && difficulty[n - 1] < s.max * finaleFraction) {
    issues.push(`finale (${difficulty[n - 1]}) is well below the peak (${s.max}) — the hardest level is buried mid-campaign, so it ends on an anticlimax`);
  }

  // 2. No cliffs: bound the steepest single jump against the average forward step.
  let riseSum = 0;
  let riseCount = 0;
  for (let i = 1; i < n; i++) {
    const step = difficulty[i] - difficulty[i - 1];
    if (step > 0) {
      riseSum += step;
      riseCount++;
    }
  }
  const avgRise = riseCount > 0 ? riseSum / riseCount : 0;
  const jumpCeiling = Math.max(minJumpAllowance, avgRise * maxJumpFactor);
  for (let i = 1; i < n; i++) {
    const step = difficulty[i] - difficulty[i - 1];
    if (step > jumpCeiling) {
      issues.push(`difficulty cliff at level ${i + 1}: jumps ${difficulty[i - 1]}→${difficulty[i]} (+${step}), past the +${jumpCeiling.toFixed(1)} envelope — smooth it with an intermediate level`);
    }
  }

  // 3. Rhythm: forward progress must dominate (dips are fine, a downhill slide isn't).
  if (s.forwardFraction < minForward) {
    issues.push(`only ${(s.forwardFraction * 100).toFixed(0)}% of steps make progress (need ≥ ${(minForward * 100).toFixed(0)}%) — the curve wanders/descends instead of building`);
  }

  // 4. Variety: not a flat line.
  if (s.distinct < minDistinct) {
    issues.push(`only ${s.distinct} distinct difficulty value(s) across ${n} levels (need ≥ ${minDistinct}) — the curve is flat; levels don't actually differ in challenge`);
  }

  return dedupe(issues);
}

/**
 * Assert a difficulty curve is well-shaped (throws with the first issue if not).
 * The campaign-level analogue of `assertSolvable` — one call gates the ramp.
 */
export function assertRamp(difficulty: readonly number[], opts: RampOptions = {}): void {
  const issues = rampIssues(difficulty, opts);
  if (issues.length) {
    throw new Error(`hayao: difficulty ramp is ill-shaped — ${issues[0]}`);
  }
}

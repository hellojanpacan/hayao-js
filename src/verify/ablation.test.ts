import { describe, expect, it } from 'vitest';
import type { Puzzle } from './solver';
import { solve } from './solver';
import {
  ablationIssues,
  assertLoadBearing,
  greedyPolicy,
  optimalPolicy,
  randomPolicy,
  runAblation,
  type AblationExperiment,
} from './ablation';

// ── Fixture: the "Ration corridor" — a minimal scarcity puzzle ────────────────
// A 1-D corridor [0..EXIT]. You start at 0 and must reach EXIT. When `scarce`,
// every step costs 1 fuel and running out kills you (isDead); a single pickup at
// PICKUP refills. When NOT scarce (the ablated twin) fuel never drains and you
// cannot die — the SAME geometry with the ONE coupling (fuel) neutralized.
//
// The coupling is genuinely load-bearing: with scarcity, careless wandering runs
// out of fuel and dies short of the exit; only a deliberate line survives. Remove
// scarcity and any walk stumbles home — skill stops mattering. That is exactly the
// signal the ablation proof exists to detect.

interface RationState {
  pos: number;
  fuel: number;
  got: boolean; // pickup collected?
}
type Dir = 'L' | 'R';

interface RationConfig {
  scarce: boolean;
  /** Include the refuel pickup (omit it to make the scarce corridor unwinnable). */
  pickup?: boolean;
  exit?: number;
  startFuel?: number;
  pickupAt?: number;
  pickupFuel?: number;
}

function rationPuzzle(cfg: RationConfig): Puzzle<RationState, Dir> {
  const exit = cfg.exit ?? 6;
  const startFuel = cfg.startFuel ?? 3;
  const pickupAt = cfg.pickupAt ?? 3;
  const pickupFuel = cfg.pickupFuel ?? 4;
  const hasPickup = cfg.pickup ?? true;
  return {
    initial: () => ({ pos: 0, fuel: startFuel, got: false }),
    moves: () => ['L', 'R'],
    apply: (s, m) => {
      const pos = Math.max(0, Math.min(exit, s.pos + (m === 'R' ? 1 : -1)));
      let fuel = cfg.scarce ? s.fuel - 1 : s.fuel;
      let got = s.got;
      if (hasPickup && pos === pickupAt && !got) {
        if (cfg.scarce) fuel += pickupFuel;
        got = true;
      }
      return { pos, fuel, got };
    },
    isWin: (s) => s.pos === exit,
    isDead: (s) => (cfg.scarce ? s.fuel < 0 : false),
    key: (s) => `${s.pos}:${s.fuel}:${s.got ? 1 : 0}`,
  };
}

const scarce = rationPuzzle({ scarce: true });
const free = rationPuzzle({ scarce: false });

// The canonical experiment: is the fuel coupling load-bearing?
const experiment: AblationExperiment<RationState, Dir> = {
  coupling: 'fuel scarcity',
  coupled: scarce,
  ablated: free,
  skilled: optimalPolicy(),
  lazy: randomPolicy(1234),
};

describe('built-in policies', () => {
  it('optimalPolicy scores 1 on a winnable level and 0 on an unwinnable one', () => {
    expect(optimalPolicy<RationState, Dir>()(scarce)).toBe(1);
    // No pickup + scarce fuel < distance → provably unwinnable.
    const starved = rationPuzzle({ scarce: true, pickup: false });
    expect(solve(starved).solvable).toBe(false);
    expect(optimalPolicy<RationState, Dir>()(starved)).toBe(0);
  });

  it('randomPolicy is deterministic — same seed, same score', () => {
    const a = randomPolicy<RationState, Dir>(999)(scarce);
    const b = randomPolicy<RationState, Dir>(999)(scarce);
    expect(a).toBe(b);
  });

  it('randomPolicy mostly DIES under scarcity but strolls home when fuel is free', () => {
    const lazy = randomPolicy<RationState, Dir>(1234);
    const onScarce = lazy(scarce);
    const onFree = lazy(free);
    expect(onScarce).toBeLessThan(0.35); // careless play rarely survives the ration
    expect(onFree).toBeGreaterThan(0.75); // without scarcity, wandering reaches the exit
  });

  it('greedyPolicy with a distance heuristic beelines to the exit and wins the coupled game', () => {
    const greedy = greedyPolicy<RationState, Dir>((s) => s.pos);
    expect(greedy(scarce)).toBe(1);
  });
});

describe('runAblation — the 2×2', () => {
  it('reports a large skill-gap that collapses under ablation', () => {
    const r = runAblation(experiment);
    expect(r.ok).toBe(true);
    expect(r.coupledGap).toBeGreaterThan(0.5); // tension present WITH the coupling
    expect(r.ablatedGap).toBeLessThan(0.3); // tension gone WITHOUT it
    expect(r.collapse).toBeGreaterThan(0.4); // the coupling carries the tension
  });

  it('collapse is exactly skilledDrop + lazyRise (the identity)', () => {
    const r = runAblation(experiment);
    expect(r.collapse).toBeCloseTo(r.skilledDrop + r.lazyRise, 9);
  });

  it('reads the collapse as scarcity lifted (lazy play catches up)', () => {
    const r = runAblation(experiment);
    expect(r.note).toMatch(/scarcity/i);
    expect(r.lazyRise).toBeGreaterThan(r.skilledDrop); // removing fuel helps the careless most
  });

  it('is fully deterministic — two runs are byte-identical', () => {
    expect(runAblation(experiment)).toEqual(runAblation(experiment));
  });
});

describe('ablationIssues / assertLoadBearing', () => {
  it('passes a genuinely load-bearing coupling', () => {
    expect(ablationIssues(experiment)).toEqual([]);
    expect(() => assertLoadBearing(experiment)).not.toThrow();
    expect(assertLoadBearing(experiment).ok).toBe(true);
  });

  it('REJECTS decoration: a coupling whose ablation leaves the tension intact', () => {
    // The "named" coupling is a decoy — the ablated twin is mechanically identical
    // to the coupled game (the real scarcity is untouched), so the skill-gap
    // survives ablation. The proof must catch that the tension lives elsewhere.
    const decoration: AblationExperiment<RationState, Dir> = {
      coupling: 'decorative flag',
      coupled: scarce,
      ablated: rationPuzzle({ scarce: true }), // same difficulty — nothing was really ablated
      skilled: optimalPolicy(),
      lazy: randomPolicy(1234),
    };
    const issues = ablationIssues(decoration);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.join(' ')).toMatch(/not the source|decoration/i);
    expect(() => assertLoadBearing(decoration)).toThrow(/not proven load-bearing/i);
  });

  it('flags NO TENSION when skilled barely beats lazy even with the coupling', () => {
    // Both variants free → careless play wins everywhere → no skill-gap to localize.
    const flat: AblationExperiment<RationState, Dir> = {
      coupling: 'nominal fuel',
      coupled: free,
      ablated: free,
      skilled: optimalPolicy(),
      lazy: randomPolicy(1234),
    };
    const issues = ablationIssues(flat);
    expect(issues.join(' ')).toMatch(/no tension|not load-bearing/i);
  });

  it('catches SWAPPED labels: a "skilled" policy that loses to "lazy"', () => {
    const inverted: AblationExperiment<RationState, Dir> = {
      ...experiment,
      skilled: randomPolicy(1234), // deliberately mislabeled
      lazy: optimalPolicy(),
    };
    const issues = ablationIssues(inverted);
    expect(issues.join(' ')).toMatch(/loses to lazy|inverted/i);
  });

  it('honors custom thresholds', () => {
    // A demanding collapse threshold the real coupling still clears, and an
    // impossible one it cannot — proving the option is wired, not ignored.
    expect(ablationIssues(experiment, { minCollapse: 0.5 })).toEqual([]);
    expect(ablationIssues(experiment, { minCollapse: 0.99 }).length).toBeGreaterThan(0);
  });

  it('averages across multiple levels without changing the verdict', () => {
    const multi = { ...experiment, levels: [0, 1, 2] };
    const r = runAblation(multi);
    expect(r.levels).toEqual([0, 1, 2]);
    expect(r.ok).toBe(true);
  });
});

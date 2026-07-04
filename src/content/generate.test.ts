import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import type { Puzzle } from '../verify/solver';
import { generateLevels, generateLevelsReport, levelFromSeed, subSeed } from './generate';
import { composeCampaign } from './campaign';

// A minimal genre-agnostic puzzle: reach a random target by +1 steps. The shortest
// solution length equals the target, so the solver's `depth` IS the difficulty —
// which makes band-filtering and ramp behavior easy to assert precisely.
interface CounterState {
  v: number;
  target: number;
}
function counterFactory(rng: Rng): Puzzle<CounterState, 'inc'> {
  const target = rng.intRange(1, 14);
  return {
    initial: () => ({ v: 0, target }),
    moves: () => ['inc'],
    apply: (s) => ({ v: s.v + 1, target: s.target }),
    isWin: (s) => s.v === s.target,
    key: (s) => `${s.v}/${s.target}`,
  };
}

describe('generateLevels', () => {
  it('returns exactly `count` levels, all inside the difficulty band', () => {
    const levels = generateLevels(counterFactory, { count: 5, seed: 7, minDepth: 4, maxDepth: 9 });
    expect(levels).toHaveLength(5);
    for (const l of levels) {
      expect(l.depth).toBeGreaterThanOrEqual(4);
      expect(l.depth).toBeLessThanOrEqual(9);
    }
  });

  it('returns a ramped sequence (non-decreasing difficulty)', () => {
    const levels = generateLevels(counterFactory, { count: 6, seed: 3, minDepth: 2, maxDepth: 14 });
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].depth).toBeGreaterThanOrEqual(levels[i - 1].depth);
    }
  });

  it('is deterministic — same options yield identical seeds', () => {
    const a = generateLevels(counterFactory, { count: 5, seed: 42, minDepth: 3, maxDepth: 10 });
    const b = generateLevels(counterFactory, { count: 5, seed: 42, minDepth: 3, maxDepth: 10 });
    expect(a.map((l) => l.seed)).toEqual(b.map((l) => l.seed));
    expect(a.map((l) => l.depth)).toEqual(b.map((l) => l.depth));
  });

  it('reproduces the exact puzzle from a stored sub-seed', () => {
    const [lvl] = generateLevels(counterFactory, { count: 1, seed: 9, minDepth: 5, maxDepth: 12 });
    const rebuilt = levelFromSeed(counterFactory, lvl.seed);
    expect(rebuilt.initial()).toEqual(lvl.puzzle.initial());
  });

  it('reports incompleteness instead of hanging when the band is impossible', () => {
    // No counter target can need 100+ moves (max target is 14) → unfillable band.
    const report = generateLevelsReport(counterFactory, { count: 3, seed: 1, minDepth: 100, maxAttempts: 200 });
    expect(report.complete).toBe(false);
    expect(report.levels.length).toBeLessThan(3);
    expect(report.attempts).toBeLessThanOrEqual(200);
  });

  it('throws a helpful error from generateLevels when it cannot fill', () => {
    expect(() => generateLevels(counterFactory, { count: 3, seed: 1, minDepth: 100, maxAttempts: 200 })).toThrow(/only \d+\/3 in-band/);
  });

  it('subSeed is stable and varies by index', () => {
    expect(subSeed(1, 0)).toBe(subSeed(1, 0));
    expect(subSeed(1, 0)).not.toBe(subSeed(1, 1));
  });
});

describe('composeCampaign', () => {
  it('stitches acts into an escalating, reproducible campaign with a length estimate', () => {
    const campaign = composeCampaign({
      factory: counterFactory,
      seed: 5,
      minutesPerLevel: 2,
      acts: [
        { name: 'Shallows', count: 4, minDepth: 1, maxDepth: 5 },
        { name: 'Deep', count: 4, minDepth: 6, maxDepth: 10 },
        { name: 'Abyss', count: 4, minDepth: 11, maxDepth: 14 },
      ],
    });
    expect(campaign.levels).toHaveLength(12);
    expect(campaign.acts.map((a) => a.name)).toEqual(['Shallows', 'Deep', 'Abyss']);
    expect(campaign.estMinutes).toBe(24);
    // Act bands ascend, so the last act out-challenges the first.
    const first = campaign.levels[0].depth;
    const last = campaign.levels[campaign.levels.length - 1].depth;
    expect(last).toBeGreaterThan(first);
    // Every level tagged with its act.
    expect(campaign.levels[0].actName).toBe('Shallows');
    expect(campaign.levels[11].actName).toBe('Abyss');
    // Fully reproducible.
    const again = composeCampaign({
      factory: counterFactory,
      seed: 5,
      acts: [
        { name: 'Shallows', count: 4, minDepth: 1, maxDepth: 5 },
        { name: 'Deep', count: 4, minDepth: 6, maxDepth: 10 },
        { name: 'Abyss', count: 4, minDepth: 11, maxDepth: 14 },
      ],
    });
    expect(again.seeds).toEqual(campaign.seeds);
  });
});

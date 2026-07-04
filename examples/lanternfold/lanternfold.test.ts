import { describe, expect, it } from 'vitest';
import { Rng, solve, rampIssues } from '@hayao';
import { toggleAt, isAllLit, makeLanternPuzzle, puzzleFromRecord } from './logic';
import { LANTERN_LEVELS } from './levels';
import { buildLanternCampaign } from './campaign';

describe('lantern toggle', () => {
  it('flips a cell and its plus-neighbours, and is its own inverse', () => {
    const cols = 3, rows = 3;
    const lit = new Array(9).fill(0);
    const once = toggleAt(lit, 4, cols, rows); // centre + 4 neighbours
    expect(once.reduce((a, b) => a + b, 0)).toBe(5);
    const twice = toggleAt(once, 4, cols, rows);
    expect(twice).toEqual(lit); // self-inverse
  });

  it('respects edges (corner tap flips 3 cells)', () => {
    const flipped = toggleAt(new Array(9).fill(0), 0, 3, 3);
    expect(flipped.reduce((a, b) => a + b, 0)).toBe(3);
  });
});

describe('generated puzzle', () => {
  it('is always solvable (scrambled from the solved board)', () => {
    for (let s = 0; s < 40; s++) {
      const p = makeLanternPuzzle(new Rng(500 + s), { cols: 4, rows: 4, scrambleLo: 4, scrambleHi: 14 });
      const r = solve(p, { maxDepth: 22, nodeCap: 300_000 });
      expect(r.solvable).toBe(true);
    }
  });

  it('reproduces the identical board from the same seed', () => {
    const params = { cols: 5, rows: 3, scrambleLo: 8, scrambleHi: 20 };
    const a = makeLanternPuzzle(new Rng(1234), params).initial();
    const b = makeLanternPuzzle(new Rng(1234), params).initial();
    expect(a.lit).toEqual(b.lit);
  });
});

describe('shipped campaign', () => {
  it('is 42 levels of pure data', () => {
    expect(LANTERN_LEVELS.length).toBe(42);
  });

  it('matches a fresh solver compose (no drift)', () => {
    const fresh = buildLanternCampaign();
    expect(fresh.map((l) => l.seed)).toEqual(LANTERN_LEVELS.map((l) => l.seed));
    expect(fresh.map((l) => l.depth)).toEqual(LANTERN_LEVELS.map((l) => l.depth));
  });

  it('every level is winnable at its stated minimum depth', () => {
    for (const rec of LANTERN_LEVELS) {
      const r = solve(puzzleFromRecord(rec), { maxDepth: 22, nodeCap: 300_000 });
      expect(r.solvable).toBe(true);
      expect(r.depth).toBe(rec.depth);
      // Playing the proven path wins.
      let s = puzzleFromRecord(rec).initial();
      const p = puzzleFromRecord(rec);
      for (const m of r.path!) s = p.apply(s, m);
      expect(isAllLit(s.lit)).toBe(true);
    }
  });

  it('has a well-shaped difficulty ramp', () => {
    expect(rampIssues(LANTERN_LEVELS.map((l) => l.depth))).toEqual([]);
  });
});

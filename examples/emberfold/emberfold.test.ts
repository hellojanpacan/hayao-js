import { describe, expect, it } from 'vitest';
import { Rng, solve, rampIssues } from '@hayao';
import { applyMove, isWin, maxTile, makePuzzle, puzzleFromRecord, STONE, type Grid } from './logic';
import { EMBER_LEVELS } from './levels';
import { buildEmberCampaign } from './campaign';

const grid = (cells: number[], cols: number, rows: number, target = 2048): Grid => ({ cols, rows, cells, target });

describe('slide + merge', () => {
  it('fuses equal embers toward the slide direction (2048 rule)', () => {
    // row: [2,2,4,0] slid left → [4,4,0,0]
    const g = grid([2, 2, 4, 0], 4, 1);
    expect(applyMove(g, 'left').cells).toEqual([4, 4, 0, 0]);
    // slid right → [0,0,2,... ] : [2,2,4] merges the two 2s then packs right → [0,0,4,4]
    expect(applyMove(g, 'right').cells).toEqual([0, 0, 4, 4]);
  });

  it('merges each ember at most once per slide', () => {
    // [2,2,2,2] left → [4,4,0,0], not [8,0,0,0]
    expect(applyMove(grid([2, 2, 2, 2], 4, 1), 'left').cells).toEqual([4, 4, 0, 0]);
  });

  it('treats a stone as a fixed partition — tiles never cross it and it never moves', () => {
    // [2, STONE, 2, 2] left: left run [2] stays; right run [2,2] fuses at the stone's right edge
    expect(applyMove(grid([2, STONE, 2, 2], 4, 1), 'left').cells).toEqual([2, STONE, 4, 0]);
    // a stone alone never yields a move
    const s = grid([STONE, 0, 0, 0], 4, 1);
    expect(applyMove(s, 'right')).toBe(s); // same reference = no-op
  });

  it('returns the same reference when nothing moves', () => {
    const g = grid([2, 4, 8, 16], 4, 1);
    expect(applyMove(g, 'left')).toBe(g);
  });
});

describe('generated board', () => {
  it('reproduces the identical board from the same seed', () => {
    const p = { cols: 4, rows: 4, stones: 2, embers: 6, fours: 1, target: 16 };
    const a = makePuzzle(new Rng(1234), p).initial();
    const b = makePuzzle(new Rng(1234), p).initial();
    expect(a.cells).toEqual(b.cells);
  });

  it('deals material that exceeds the target (a solution can exist)', () => {
    const p = { cols: 4, rows: 4, stones: 2, embers: 7, fours: 1, target: 16 };
    const cells = makePuzzle(new Rng(7), p).initial().cells;
    const heat = cells.filter((v) => v > 0).reduce((a, b) => a + b, 0);
    expect(heat).toBeGreaterThanOrEqual(p.target);
  });
});

describe('shipped campaign', () => {
  it('is 40 levels of pure data', () => {
    expect(EMBER_LEVELS.length).toBe(40);
  });

  it('matches a fresh solver compose (no drift)', () => {
    const fresh = buildEmberCampaign();
    expect(fresh.map((l) => l.seed)).toEqual(EMBER_LEVELS.map((l) => l.seed));
    expect(fresh.map((l) => l.depth)).toEqual(EMBER_LEVELS.map((l) => l.depth));
  });

  it('every level is winnable at its stated minimum depth, and the proven line wins', () => {
    for (const rec of EMBER_LEVELS) {
      const p = puzzleFromRecord(rec);
      const r = solve(p, { maxDepth: 30, nodeCap: 300_000 });
      expect(r.solvable).toBe(true);
      expect(r.depth).toBe(rec.depth);
      let s = p.initial();
      for (const m of r.path!) s = p.apply(s, m);
      expect(isWin(s)).toBe(true);
      expect(maxTile(s)).toBeGreaterThanOrEqual(rec.target);
    }
  });

  it('has a well-shaped difficulty ramp', () => {
    expect(rampIssues(EMBER_LEVELS.map((l) => l.depth))).toEqual([]);
  });
});

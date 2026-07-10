import { describe, it, expect } from 'vitest';
import { assertDeterministic, createWorld, solve, type InputLog } from '@hayao';
import {
  allLitMask,
  chainFrom,
  litAfter,
  makePuzzle,
  resolveMask,
  type Level,
} from './logic';
import { generateLevel, paramsForRating } from './generate';
import { expectedScore, updateRating } from './elo';
import { lumenGame } from './game';

// A hand-built board to pin the mechanic: three prisms in row 0 firing east.
// prisms at x=1,2,3 (cells 1,2,3 on a width-5 board), all dir E.
const ROW: Level = {
  width: 5,
  height: 2,
  prisms: [
    { cell: 1, dir: 1 },
    { cell: 2, dir: 1 },
    { cell: 3, dir: 1 },
  ],
  sparks: 1,
  seed: 0,
  rating: 0,
};

describe('chain-fire mechanic', () => {
  it('a spark west of the row lights the whole chain via relays', () => {
    const { mask, waves } = chainFrom(ROW, 0, 0); // spark at cell 0, west of prism 0
    expect(mask).toBe(allLitMask(ROW)); // all three lit
    // Wave 0 lights prism 0; each relay E lights the next → three waves.
    expect(waves.length).toBe(3);
  });

  it('beams into an empty column light nothing', () => {
    // A spark in a column with no prism (cell 9 = x4,y1) fires into empty space.
    expect(resolveMask(ROW, 0, 9)).toBe(0);
  });

  it('final lit set is a pure function of placements (replay matches)', () => {
    const a = litAfter(ROW, [0]);
    const b = chainFrom(ROW, 0, 0).mask;
    expect(a).toBe(b);
  });
});

describe('ordering matters — pass-through-lit is order-sensitive', () => {
  // Prism A at (2,0) fires SOUTH; prism B behind A (same column, further) can only
  // be reached once A is lit AND transparent to a second beam from the north.
  const board: Level = {
    width: 3,
    height: 4,
    prisms: [
      { cell: 1, dir: 2 }, //   (1,0) fires S — call it A
      { cell: 7, dir: 1 }, //   (1,2) fires E — call it B, straight below A
    ],
    sparks: 2,
    seed: 0,
    rating: 0,
  };
  it('is solvable and the solver finds an ordered line', () => {
    const r = solve(makePuzzle(board), { maxDepth: 2, nodeCap: 100_000 });
    expect(r.solvable).toBe(true);
    expect(r.path!.length).toBeGreaterThan(0);
  });
});

describe('generator — every band is solver-proven winnable', () => {
  for (const target of [800, 1150, 1500, 1900]) {
    const params = paramsForRating(target);
    for (let seed = 1; seed <= 4; seed++) {
      it(`band ${target} seed ${seed}`, () => {
        const level = generateLevel(seed * 31 + target, params);
        const r = solve(makePuzzle(level), { maxDepth: level.sparks, nodeCap: 500_000 });
        expect(r.solvable).toBe(true);
        expect(level.sparks).toBe(r.depth); // budget == minimum needed
      });
    }
  }
});

describe('elo rating math', () => {
  it('expected score is 0.5 at equal ratings', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 6);
  });
  it('a win raises and a loss lowers the rating', () => {
    expect(updateRating(1000, 1200, true)).toBeGreaterThan(1000);
    expect(updateRating(1000, 800, false)).toBeLessThan(1000);
  });
  it('never drops below the floor', () => {
    expect(updateRating(100, 2500, false)).toBeGreaterThanOrEqual(100);
  });
});

describe('the game is deterministic', () => {
  it('replays a scripted solve identically', () => {
    const world = createWorld(lumenGame);
    const solution = solve(makePuzzle(world.state.level), { maxDepth: world.state.level.sparks, nodeCap: 500_000 });
    const frames: string[][] = [];
    for (const cell of solution.path ?? []) {
      frames.push([`place:${cell}`]);
      frames.push([]);
    }
    frames.push([]);
    const log: InputLog = { frames };
    expect(() => assertDeterministic(() => createWorld(lumenGame), log)).not.toThrow();
  });
});

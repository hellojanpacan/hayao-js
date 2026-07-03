// Gravewell sim tests: tap semantics per piece, run-slides, hole swallows,
// blocked pushes, budget + fail states, solver proofs (SPEC.md M1–M8).

import { describe, expect, it } from 'vitest';
import { solve, createWorld, checkDeterministic, type InputLog } from '@hayao';
import {
  H,
  LEVELS,
  W,
  applyTap,
  effectiveTaps,
  failReason,
  gravewellPuzzle,
  initialState,
  isWin,
  tightParPuzzle,
  type Cell,
  type GravewellState,
} from './logic';
import { gravewellGame, tapsToFrames } from './game';

const at = (x: number, y: number) => y * W + x;
const mk = (cells: Partial<Record<number, Cell>>, taps = 9): GravewellState => {
  const all: Cell[] = Array.from({ length: W * H }, () => 'empty');
  for (const [i, c] of Object.entries(cells)) all[Number(i)] = c!;
  return { cells: all, tapsLeft: taps, levelIndex: 0 };
};

describe('tap semantics', () => {
  it('M1: tapping an X removes it and consumes a tap', () => {
    const s = mk({ [at(2, 2)]: 'x' }, 3);
    const n = applyTap(s, at(2, 2));
    expect(n.cells[at(2, 2)]).toBe('empty');
    expect(n.tapsLeft).toBe(2);
    expect(isWin(n)).toBe(true);
  });

  it('M2: tapping a neutron star collapses it into a hole in place', () => {
    const s = mk({ [at(1, 1)]: 'star' }, 3);
    const n = applyTap(s, at(1, 1));
    expect(n.cells[at(1, 1)]).toBe('hole');
    expect(isWin(n)).toBe(true); // holes are not pushables
  });

  it('M3: an arrow slides its contiguous run one step into an empty cell', () => {
    const s = mk({ [at(1, 2)]: 'right', [at(2, 2)]: 'blank', [at(3, 2)]: 'blank' });
    const n = applyTap(s, at(1, 2));
    expect(n.cells[at(1, 2)]).toBe('empty');
    expect(n.cells[at(2, 2)]).toBe('right');
    expect(n.cells[at(3, 2)]).toBe('blank');
    expect(n.cells[at(4, 2)]).toBe('blank');
  });

  it('M4: the piece sliding into a hole is swallowed; the hole stays', () => {
    const s = mk({ [at(1, 2)]: 'right', [at(2, 2)]: 'blank', [at(3, 2)]: 'hole' });
    const n = applyTap(s, at(1, 2));
    expect(n.cells[at(2, 2)]).toBe('right');
    expect(n.cells[at(3, 2)]).toBe('hole');
    expect(n.cells.filter((c) => c === 'blank').length).toBe(0);
  });

  it('M5: a run walking off the board is a no-op and does NOT consume a tap', () => {
    const s = mk({ [at(4, 2)]: 'right', [at(5, 2)]: 'blank' }, 3);
    const n = applyTap(s, at(4, 2));
    expect(n).toBe(s);
  });

  it('M5: horizontal pushes are row-bounded (no wrap to the next row)', () => {
    const s = mk({ [at(5, 2)]: 'right' }, 3);
    expect(applyTap(s, at(5, 2))).toBe(s);
    const l = mk({ [at(0, 2)]: 'left' }, 3);
    expect(applyTap(l, at(0, 2))).toBe(l);
  });

  it('blank and hole are not clickable', () => {
    const s = mk({ [at(2, 2)]: 'blank', [at(3, 3)]: 'hole' });
    expect(applyTap(s, at(2, 2))).toBe(s);
    expect(applyTap(s, at(3, 3))).toBe(s);
    expect(effectiveTaps(s)).toEqual([]);
  });
});

describe('fail states (M8)', () => {
  it('out of taps with pushables left', () => {
    const s = mk({ [at(2, 2)]: 'x' }, 0);
    expect(failReason(s)).toBe('out-of-taps');
  });

  it('not clean: no clickables but pushables remain', () => {
    const s = mk({ [at(2, 2)]: 'blank' }, 5);
    expect(failReason(s)).toBe('not-clean');
  });

  it('stuck: clickables exist but none has any effect', () => {
    // A lone right-arrow hard against the right edge: clickable, no effect.
    const s = mk({ [at(5, 2)]: 'right' }, 5);
    expect(failReason(s)).toBe('stuck');
  });

  it('a winnable board has no fail reason', () => {
    expect(failReason(initialState(0))).toBe(null);
  });
});

describe('solver proofs (M6, M7)', () => {
  it('every level is solvable within its tap budget (M6)', () => {
    LEVELS.forEach((lvl, i) => {
      const r = solve(gravewellPuzzle, { level: i, maxDepth: lvl.taps + 1, nodeCap: 2_000_000 });
      expect(r.solvable, `level ${i} "${lvl.name}" solvable`).toBe(true);
      expect(r.depth, `level ${i} "${lvl.name}" fits budget`).toBeLessThanOrEqual(lvl.taps);
    });
  });

  it('every level is UNsolvable with one tap fewer — par is tight (M7)', () => {
    LEVELS.forEach((lvl, i) => {
      const r = solve(tightParPuzzle, { level: i, maxDepth: lvl.taps + 1, nodeCap: 2_000_000 });
      expect(r.solvable, `level ${i} "${lvl.name}" must NEED its full budget`).toBe(false);
    });
  });
});

describe('world integration (M9)', () => {
  it('replaying the level-0 solution through the real game solves it', () => {
    const r = solve(gravewellPuzzle, { level: 0 });
    expect(r.solvable).toBe(true);
    const world = createWorld(gravewellGame);
    const log: InputLog = { frames: tapsToFrames(r.path!) };
    for (const f of log.frames) world.step(f);
    expect(world.probe().solved).toBe(true);
  });

  it('sim is deterministic', () => {
    const r = solve(gravewellPuzzle, { level: 0 });
    const log: InputLog = { frames: tapsToFrames(r.path!) };
    const report = checkDeterministic(() => createWorld(gravewellGame), log);
    expect(report.ok, `diverged at frame ${report.divergedAt}`).toBe(true);
  });

  it('cursor movement is canonical state (M9)', () => {
    const world = createWorld(gravewellGame);
    const before = world.hash();
    world.step(['right']);
    world.step([]);
    expect(world.hash()).not.toBe(before); // moving the cursor IS a state change
  });
});

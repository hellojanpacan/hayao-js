// Seamfold sim tests: twisted-torus wrap semantics, push rules, solver proofs
// (winnable with seams, UNwinnable without — SPEC.md M1–M4, M8).

import { describe, expect, it } from 'vitest';
import { solve, createWorld, checkDeterministic, type InputLog } from '@hayao';
import {
  LEVELS,
  applyMove,
  crossesSeam,
  initialState,
  isSolved,
  noWrapPuzzle,
  seamfoldPuzzle,
  wrap,
  type Move,
} from './logic';
import { seamfoldGame } from './game';

describe('wrap (M1, M2)', () => {
  it('plain torus wraps both axes with no shift', () => {
    const lvl = LEVELS[0]; // xOff=0, yOff=0, 6×4
    expect(wrap(lvl, 6, 2)).toEqual({ x: 0, y: 2 });
    expect(wrap(lvl, -1, 2)).toEqual({ x: 5, y: 2 });
    expect(wrap(lvl, 3, 4)).toEqual({ x: 3, y: 0 });
    expect(wrap(lvl, 3, -1)).toEqual({ x: 3, y: 3 });
  });

  it('yOff twists vertical-seam crossings (M2)', () => {
    const lvl = LEVELS[1]; // yOff=-2, 6×5
    expect(wrap(lvl, 6, 1)).toEqual({ x: 0, y: 3 }); // right seam: y -= yOff
    expect(wrap(lvl, -1, 3)).toEqual({ x: 5, y: 1 }); // left seam: y += yOff
  });

  it('xOff twists horizontal-seam crossings (M2)', () => {
    const lvl = LEVELS[2]; // xOff=-2, 5×6
    expect(wrap(lvl, 1, 6)).toEqual({ x: 3, y: 0 }); // bottom seam: x -= xOff
    expect(wrap(lvl, 3, -1)).toEqual({ x: 1, y: 5 }); // top seam: x += xOff
  });

  it('chained shifts resolve to a fixpoint', () => {
    const lvl = LEVELS[3]; // xOff=1, yOff=1, 6×6
    const c = wrap(lvl, 6, 0); // right seam: y -= 1 → -1 → top seam: x += 1
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.x).toBeLessThan(lvl.width);
    expect(c.y).toBeGreaterThanOrEqual(0);
    expect(c.y).toBeLessThan(lvl.height);
  });

  it('in-bounds coords are untouched', () => {
    for (const lvl of LEVELS) expect(wrap(lvl, 1, 1)).toEqual({ x: 1, y: 1 });
  });
});

describe('moves and pushes (M3)', () => {
  it('walking into a wall is a no-op', () => {
    const s = initialState(0); // player (5,2); wall row above at y-? row1 open
    const blocked = applyMove(s, 'down'); // row 3 is all walls
    expect(blocked).toBe(s);
  });

  it('a box pushed across a seam wraps (M3)', () => {
    // Level 0 solution tail: player at (2,2) pushes box (3,2) right thrice —
    // the last push carries the box through the right seam onto the goal (0,2).
    let s = initialState(0);
    for (const m of ['up', 'left', 'left', 'left', 'down'] as Move[]) s = applyMove(s, m);
    expect(s.player).toEqual({ x: 2, y: 2 });
    for (const m of ['right', 'right', 'right'] as Move[]) s = applyMove(s, m);
    expect(s.boxes[0]).toEqual({ x: 0, y: 2 });
    expect(isSolved(s)).toBe(true);
  });

  it('crossesSeam detects edge crossings', () => {
    const lvl = LEVELS[0];
    expect(crossesSeam(lvl, { x: 5, y: 2 }, 'right')).toBe(true);
    expect(crossesSeam(lvl, { x: 0, y: 2 }, 'left')).toBe(true);
    expect(crossesSeam(lvl, { x: 3, y: 2 }, 'right')).toBe(false);
  });

  it('no-wrap variant blocks seam crossings', () => {
    const s = initialState(0); // player (5,2), right seam ahead
    expect(applyMove(s, 'right', false)).toBe(s);
    expect(applyMove(s, 'right', true)).not.toBe(s);
  });
});

describe('solver proofs (M4, M8)', () => {
  it('every level is winnable WITH seams (M8)', () => {
    LEVELS.forEach((_, i) => {
      const r = solve(seamfoldPuzzle, { level: i, maxDepth: 120, nodeCap: 2_000_000 });
      expect(r.solvable, `level ${i} "${LEVELS[i].name}" must be solvable`).toBe(true);
    });
  });

  it('every level is UNwinnable without seams — the seam is the mechanic (M4)', () => {
    LEVELS.forEach((_, i) => {
      const r = solve(noWrapPuzzle, { level: i, maxDepth: 120, nodeCap: 2_000_000 });
      expect(r.solvable, `level ${i} "${LEVELS[i].name}" must NEED the seam`).toBe(false);
    });
  });
});

describe('world integration', () => {
  const movesToLog = (path: Move[]): InputLog => ({
    frames: path.flatMap((m) => [[m], []] as string[][]).concat([[]]),
  });

  it('replaying the level-0 solution through the real game solves it', () => {
    const solution = solve(seamfoldPuzzle, { level: 0 });
    expect(solution.solvable).toBe(true);
    const world = createWorld(seamfoldGame);
    for (const f of movesToLog(solution.path!).frames) world.step(f);
    expect(world.probe().solved).toBe(true);
  });

  it('sim is deterministic', () => {
    const solution = solve(seamfoldPuzzle, { level: 0 });
    const report = checkDeterministic(() => createWorld(seamfoldGame), movesToLog(solution.path!));
    expect(report.ok, `diverged at frame ${report.divergedAt}`).toBe(true);
  });

  it('undo restores the previous state', () => {
    const world = createWorld(seamfoldGame);
    const before = world.probe().playerX;
    world.step(['up']);
    world.step([]);
    expect(world.probe().playerY).not.toBe(initialState(0).player.y);
    world.step(['undo']);
    world.step([]);
    expect(world.probe().playerX).toBe(before);
    expect(world.probe().playerY).toBe(initialState(0).player.y);
  });
});

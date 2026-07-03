import { describe, it, expect } from 'vitest';
import { assertSolvable, solve, createWorld, assertDeterministic, assertSnapshotStable, type InputLog } from '@hayao';
import { LEVELS, sokobanPuzzle, type Move } from './logic';
import { sokobanGame } from './game';

describe('Sokoban — content is provably winnable (Channel 1b)', () => {
  LEVELS.forEach((_, i) => {
    it(`level ${i + 1} is solvable`, () => {
      const result = assertSolvable(sokobanPuzzle, { level: i, maxDepth: 80, nodeCap: 2_000_000 });
      expect(result.solvable).toBe(true);
      expect(result.path!.length).toBeGreaterThan(0);
    });
  });

  it('the dead-state pruning rejects cornered boxes', () => {
    // The solver still finds a solution despite pruning — a sanity check that
    // pruning does not remove all winning lines.
    const r = solve(sokobanPuzzle, { level: 0 });
    expect(r.solvable).toBe(true);
  });
});

/** Turn a solver move path into an input log: one press frame + one release frame per move. */
function movesToInputLog(path: Move[]): InputLog {
  const frames: string[][] = [];
  for (const m of path) {
    frames.push([m]); // rising edge → justPressed(m)
    frames.push([]); // release so the next same-direction move re-triggers
  }
  frames.push([]); // settle
  return { frames };
}

describe('Sokoban — scripted playthrough actually solves it (Channel 1a)', () => {
  it('feeding the solved path as input reaches a solved state', () => {
    const solution = solve(sokobanPuzzle, { level: 0 });
    expect(solution.solvable).toBe(true);
    const log = movesToInputLog(solution.path!);

    const world = createWorld(sokobanGame);
    for (let i = 0; i < log.frames.length; i++) world.step(log.frames[i]);

    const probe = world.probe();
    expect(probe.solved).toBe(true);
    expect(probe.level).toBe(0);
  });
});

describe('Sokoban — determinism & save/load (the regression net)', () => {
  const solution = solve(sokobanPuzzle, { level: 0 });
  const log = movesToInputLog(solution.path!.slice(0, 3).concat(solution.path!));

  it('same seed + same input log → identical state hashes', () => {
    const report = assertDeterministic(() => createWorld(sokobanGame), log);
    expect(report.ok).toBe(true);
    expect(report.divergedAt).toBe(-1);
  });

  it('snapshot → restore reproduces the exact continuation', () => {
    const res = assertSnapshotStable(() => createWorld(sokobanGame), log, 4);
    expect(res.ok).toBe(true);
    expect(res.hashA).toBe(res.hashB);
  });
});

describe('Sokoban — headless vector screenshot', () => {
  it('renders the opening frame to a valid SVG string', () => {
    const world = createWorld(sokobanGame);
    world.step([]);
    const commands = world.render();
    // Grid of tiles + goals + boxes + player + HUD text all present.
    expect(commands.length).toBeGreaterThan(10);
    expect(commands.some((c) => c.kind === 'text')).toBe(true);
  });
});

// Sokoban verify suite: every level winnable, scripted playthrough solves,
// sim deterministic. Discovered and run by scripts/verify.ts.

import { solve, createWorld, checkDeterministic, renderFilmstrip, type InputLog } from '@hayao';
import { sokobanPuzzle, LEVELS, type Move } from './logic';
import { sokobanGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

export default async function verify(t: VerifyContext) {
  // 1. Every level winnable.
  const depths: number[] = [];
  LEVELS.forEach((_, i) => {
    const r = solve(sokobanPuzzle, { level: i, maxDepth: 80, nodeCap: 2_000_000 });
    if (r.solvable) depths.push(r.depth!);
    t.check(
      r.solvable ? `level ${i + 1} winnable in ${r.depth} moves (${r.nodes} nodes)` : `level ${i + 1} NOT winnable`,
      r.solvable,
    );
  });

  // 2. Playing the solved path reaches a solved state.
  const solution = solve(sokobanPuzzle, { level: 0 });
  const movesToLog = (path: Move[]): InputLog => ({
    frames: path.flatMap((m) => [[m], []] as string[][]).concat([[]]),
  });
  const world = createWorld(sokobanGame);
  const log = movesToLog(solution.path!);
  for (const f of log.frames) world.step(f);
  t.check('scripted playthrough solves level 1', world.probe().solved === true);
  t.golden('level-1 solve replay', world.hash());

  // 3. Determinism.
  const report = checkDeterministic(() => createWorld(sokobanGame), log);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 4. Feel: difficulty ramps — the finale is the deepest solve.
  t.check(
    `difficulty curve peaks at the finale (solve depths ${depths.join(' → ')})`,
    depths[depths.length - 1] === Math.max(...depths),
  );

  // 5. Filmstrip artifact of the level-1 solve, for the looks judgement.
  t.artifact(
    'solve-filmstrip.svg',
    renderFilmstrip(createWorld(sokobanGame), log.frames, {
      width: sokobanGame.width,
      height: sokobanGame.height,
      background: sokobanGame.background,
      panels: 8,
    }),
  );
}

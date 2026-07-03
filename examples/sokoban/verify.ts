// Sokoban verify suite: every level winnable, scripted playthrough solves,
// sim deterministic. Discovered and run by scripts/verify.ts.

import { solve, createWorld, checkDeterministic, type InputLog } from '@hayao';
import { sokobanPuzzle, LEVELS, type Move } from './logic';
import { sokobanGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

export default async function verify(t: VerifyContext) {
  // 1. Every level winnable.
  LEVELS.forEach((_, i) => {
    const r = solve(sokobanPuzzle, { level: i, maxDepth: 80, nodeCap: 2_000_000 });
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

  // 3. Determinism.
  const report = checkDeterministic(() => createWorld(sokobanGame), log);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);
}

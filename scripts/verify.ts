// CI verifier: proves every example's content is winnable and its sim deterministic.
// Exits non-zero on failure so it gates a pipeline. Run: npm run verify

import { solve, createWorld, checkDeterministic, type InputLog } from '../src/index';
import { sokobanPuzzle, LEVELS, type Move } from '../examples/sokoban/logic';
import { sokobanGame } from '../examples/sokoban/game';

let failures = 0;
const ok = (label: string) => console.log(`  ✓ ${label}`);
const fail = (label: string) => {
  console.error(`  ✗ ${label}`);
  failures++;
};

console.log('hayao verify — Sokoban');

// 1. Every level winnable.
LEVELS.forEach((_, i) => {
  const r = solve(sokobanPuzzle, { level: i, maxDepth: 80, nodeCap: 2_000_000 });
  r.solvable ? ok(`level ${i + 1} winnable in ${r.depth} moves (${r.nodes} nodes)`) : fail(`level ${i + 1} NOT winnable`);
});

// 2. Playing the solved path reaches a solved state.
const solution = solve(sokobanPuzzle, { level: 0 });
const movesToLog = (path: Move[]): InputLog => ({
  frames: path.flatMap((m) => [[m], []] as string[][]).concat([[]]),
});
const world = createWorld(sokobanGame);
const log = movesToLog(solution.path!);
for (const f of log.frames) world.step(f);
world.probe().solved ? ok('scripted playthrough solves level 1') : fail('playthrough did not solve level 1');

// 3. Determinism.
const report = checkDeterministic(() => createWorld(sokobanGame), log);
report.ok ? ok('sim is deterministic across runs') : fail(`sim diverged at frame ${report.divergedAt}`);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);

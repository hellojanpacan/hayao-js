// Lumen verify suite: every generated board is solver-proven winnable, a scripted
// drag-drop playthrough reaches a solved+rated state, the sim is deterministic,
// and the difficulty estimate ramps across rating bands. Discovered and run by
// scripts/verify.ts.

import { solve, createWorld, checkDeterministic, renderFilmstrip, type InputLog } from '@hayao';
import { makePuzzle, type Level } from './logic';
import { generateLevel, paramsForRating, type GenParams } from './generate';
import { lumenGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

const BANDS = [800, 1150, 1500, 1900];

function proveBand(t: VerifyContext, targetRating: number): number[] {
  const params: GenParams = paramsForRating(targetRating);
  const ratings: number[] = [];
  for (let seed = 1; seed <= 6; seed++) {
    const level: Level = generateLevel(seed * 101 + targetRating, params);
    const r = solve(makePuzzle(level), { maxDepth: level.sparks, nodeCap: 500_000 });
    t.check(
      r.solvable
        ? `band ${targetRating} seed ${seed}: winnable in ${level.sparks} sparks, rating ${level.rating}`
        : `band ${targetRating} seed ${seed}: NOT winnable`,
      r.solvable,
    );
    ratings.push(level.rating);
  }
  return ratings;
}

export default async function verify(t: VerifyContext) {
  // 1. Every generated board across every band is solver-proven winnable.
  const bandAverages: number[] = [];
  for (const band of BANDS) {
    const ratings = proveBand(t, band);
    bandAverages.push(ratings.reduce((a, b) => a + b, 0) / ratings.length);
  }

  // 2. Difficulty estimate ramps: harder bands average higher ratings.
  const monotonic = bandAverages.every((v, i) => i === 0 || v >= bandAverages[i - 1]);
  t.check(`difficulty ramps across bands (avg ${bandAverages.map((n) => Math.round(n)).join(' → ')})`, monotonic);

  // 3. Scripted drag-drop playthrough solves the served puzzle and banks rating.
  const world = createWorld(lumenGame);
  const startRating = world.probe().rating as number;
  const level = world.state.level;
  const solution = solve(makePuzzle(level), { maxDepth: level.sparks, nodeCap: 500_000 });
  t.check(`served puzzle solvable (${solution.path?.length ?? 0} sparks)`, solution.solvable);

  const frames: string[][] = [];
  for (const cell of solution.path ?? []) {
    frames.push([`place:${cell}`]); // press the placement…
    frames.push([]); //                …then release, so justPressed is an edge.
  }
  frames.push([]);
  const log: InputLog = { frames };
  for (const f of log.frames) world.step(f);

  t.check('scripted playthrough lights every prism', world.probe().won === true);
  t.check('a solved puzzle raises the rating', (world.probe().rating as number) > startRating);
  t.golden('served-solve replay', world.hash());

  // 4. Determinism: the same input log reproduces the same sim exactly.
  const report = checkDeterministic(() => createWorld(lumenGame), log);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 5. Filmstrip artifact of the solve, for the looks judgement.
  t.artifact(
    'solve-filmstrip.svg',
    renderFilmstrip(createWorld(lumenGame), log.frames, {
      width: lumenGame.width,
      height: lumenGame.height,
      background: lumenGame.background,
      panels: 8,
    }),
  );
}

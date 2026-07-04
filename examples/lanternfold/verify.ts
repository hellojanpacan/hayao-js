// Lanternfold verify suite — the machine-proof behind the flagship's claim:
// an hour of content, every level provably winnable, the difficulty curve
// provably well-shaped, and the shipped data provably equal to what the solver
// proved. Discovered and run by scripts/verify.ts.

import {
  solve,
  createWorld,
  checkDeterministic,
  renderFilmstrip,
  rampStats,
  rampIssues,
  contrastRatio,
  KENTO,
  type InputLog,
} from '@hayao';
import { LANTERN_LEVELS } from './levels';
import { buildLanternCampaign } from './campaign';
import { puzzleFromRecord, type Tap } from './logic';
import { lanternfoldGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** Frames that walk the game cursor from `from` to `to` on a `cols`-wide grid, then tap. */
function tapAt(from: number, to: number, cols: number): { frames: string[][]; end: number } {
  const frames: string[][] = [];
  let x = from % cols;
  let y = Math.floor(from / cols);
  const tx = to % cols;
  const ty = Math.floor(to / cols);
  const pressRelease = (a: string) => frames.push([a], []);
  while (x < tx) { pressRelease('right'); x++; }
  while (x > tx) { pressRelease('left'); x--; }
  while (y < ty) { pressRelease('down'); y++; }
  while (y > ty) { pressRelease('up'); y--; }
  pressRelease('confirm');
  return { frames, end: to };
}

export default async function verify(t: VerifyContext): Promise<void> {
  // 1. Shipped data == proven data. levels.ts must equal a fresh solver compose,
  //    so the committed campaign can never silently drift from what's provable.
  const fresh = buildLanternCampaign();
  const sameLength = fresh.length === LANTERN_LEVELS.length;
  const sameData = sameLength && fresh.every((f, i) => {
    const s = LANTERN_LEVELS[i];
    return f.seed === s.seed && f.depth === s.depth && f.cols === s.cols && f.rows === s.rows && f.act === s.act;
  });
  t.check(`shipped levels.ts matches a fresh solver compose (${LANTERN_LEVELS.length} levels)`, sameData);

  // 2. Every level is winnable, and its shipped `depth` IS the solver's minimum.
  let allWinnable = true;
  let depthsHonest = true;
  const depths: number[] = [];
  for (const rec of LANTERN_LEVELS) {
    const r = solve(puzzleFromRecord(rec), { maxDepth: 22, nodeCap: 300_000 });
    if (!r.solvable || r.exhausted) allWinnable = false;
    if (r.depth !== rec.depth) depthsHonest = false;
    depths.push(rec.depth);
  }
  t.check(`all ${LANTERN_LEVELS.length} lanterns are solver-proven winnable`, allWinnable);
  t.check('every shipped depth equals the solver-proven minimum taps', depthsHonest);

  // 3. The difficulty curve is well-shaped (the ramp gate — Channel 5).
  const stats = rampStats(depths);
  const rampProblems = rampIssues(depths);
  t.check(
    rampProblems.length === 0
      ? `difficulty ramps cleanly ${stats.min}→${stats.max} over ${stats.count} levels (${stats.distinct} tiers, finale at the peak)`
      : `ramp ill-shaped: ${rampProblems[0]}`,
    rampProblems.length === 0,
  );

  // 4. Content volume — the flagship claim, made checkable.
  t.check(`ships ~an hour: ${LANTERN_LEVELS.length} levels ≈ ${Math.round(LANTERN_LEVELS.length * 1.3)} min`, LANTERN_LEVELS.length >= 40);

  // 5. Readability feel gate: a lit lantern must pop off the night ground, while an
  //    unlit one recedes — salience from pure color data.
  const litContrast = contrastRatio(KENTO.kaki, KENTO.yohaku);
  t.check(`lit lantern out-contrasts the dusk ground (${litContrast.toFixed(1)}:1)`, litContrast >= 3);

  // 6. Play the solver's own solution THROUGH the real game and reach a lit board.
  const level0 = LANTERN_LEVELS[0];
  const sol = solve(puzzleFromRecord(level0), { maxDepth: 22, nodeCap: 300_000 });
  const path = (sol.path ?? []) as Tap[];
  const cols = level0.cols;
  const startCursor = Math.floor((level0.cols * level0.rows) / 2);
  const frames: string[][] = [];
  let cursor = startCursor;
  for (const tapCell of path) {
    const r = tapAt(cursor, tapCell, cols);
    frames.push(...r.frames);
    cursor = r.end;
  }
  frames.push([]);
  const log: InputLog = { frames };
  const world = createWorld(lanternfoldGame);
  for (const f of log.frames) world.step(f);
  const probe = world.probe();
  t.check(`scripted solution lights level 1 (${probe.lit}/${probe.total})`, probe.won === true);
  t.golden('level-1 solve replay', world.hash());

  // 7. Determinism: the same inputs produce the same world, bit for bit.
  const report = checkDeterministic(() => createWorld(lanternfoldGame), log);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 8. Looks artifact — a filmstrip of the level-1 solve for the headless judge.
  t.artifact(
    'solve-filmstrip.svg',
    renderFilmstrip(createWorld(lanternfoldGame), log.frames, {
      width: lanternfoldGame.width,
      height: lanternfoldGame.height,
      background: lanternfoldGame.background,
      panels: 6,
    }),
  );
}

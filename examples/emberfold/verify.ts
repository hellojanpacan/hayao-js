// Emberfold verify suite — the machine-proof behind a 2048-family puzzle's claim:
// forty dealt boards, every one provably winnable by sliding, the difficulty curve
// provably well-shaped, and the shipped data provably equal to what the solver
// proved. Discovered and run by scripts/verify.ts.

import {
  solve,
  createWorld,
  checkDeterministic,
  renderFilmstrip,
  runFeelGates,
  rampStats,
  rampIssues,
  contrastRatio,
  KENTO,
  type InputLog,
} from '@hayao';
import { EMBER_LEVELS } from './levels';
import { buildEmberCampaign } from './campaign';
import { puzzleFromRecord, isWin, type Move } from './logic';
import { emberfoldGame, feel } from './game';
import type { VerifyContext } from '../../scripts/verify';

const SOLVE = { maxDepth: 30, nodeCap: 300_000 };

/** Turn a solver path (slide directions) into an input log the real game replays. */
const movesToLog = (path: Move[]): InputLog => ({ frames: path.flatMap((m) => [[m], []] as string[][]).concat([[]]) });

export default async function verify(t: VerifyContext): Promise<void> {
  // 1. Shipped data == proven data. levels.ts must equal a fresh solver compose,
  //    so the committed campaign can never silently drift from what's provable.
  const fresh = buildEmberCampaign();
  const sameData =
    fresh.length === EMBER_LEVELS.length &&
    fresh.every((f, i) => {
      const s = EMBER_LEVELS[i];
      return f.seed === s.seed && f.depth === s.depth && f.cols === s.cols && f.rows === s.rows && f.stones === s.stones && f.target === s.target && f.act === s.act;
    });
  t.check(`shipped levels.ts matches a fresh solver compose (${EMBER_LEVELS.length} levels)`, sameData);

  // 2. Every level is winnable, and its shipped `depth` IS the solver's minimum slides.
  let allWinnable = true;
  let depthsHonest = true;
  const depths: number[] = [];
  for (const rec of EMBER_LEVELS) {
    const r = solve(puzzleFromRecord(rec), SOLVE);
    if (!r.solvable || r.exhausted) allWinnable = false;
    if (r.depth !== rec.depth) depthsHonest = false;
    depths.push(rec.depth);
  }
  t.check(`all ${EMBER_LEVELS.length} boards are solver-proven winnable`, allWinnable);
  t.check('every shipped depth equals the solver-proven minimum slides', depthsHonest);

  // 3. The difficulty curve is well-shaped (the ramp gate — Channel 5).
  const stats = rampStats(depths);
  const rampProblems = rampIssues(depths);
  t.check(
    rampProblems.length === 0
      ? `difficulty ramps cleanly ${stats.min}→${stats.max} over ${stats.count} levels (${stats.distinct} tiers, finale at the peak)`
      : `ramp ill-shaped: ${rampProblems[0]}`,
    rampProblems.length === 0,
  );

  // 4. Content volume — the "an hour of puzzles" claim, made checkable.
  t.check(`ships ~an hour: ${EMBER_LEVELS.length} levels ≈ ${Math.round(EMBER_LEVELS.length * 1.4)} min`, EMBER_LEVELS.length >= 36);

  // 5. Readability feel gate: a hot ember must pop off the night forge — salience
  //    from pure color data (amber ember vs the deep-indigo ground).
  const emberContrast = contrastRatio(KENTO.kaki, KENTO.yohaku);
  t.check(`a hot ember out-contrasts the night forge (${emberContrast.toFixed(1)}:1)`, emberContrast >= 3);

  // 6. Feel contract (Channel 4): the declared feedback gate must pass.
  const feelReport = runFeelGates(feel);
  t.check(feelReport.ok ? 'feel contract holds (feedback on ≥2 channels per action)' : `feel gate failed: ${feelReport.sections.flatMap((s) => s.issues)[0]}`, feelReport.ok);

  // 7. Play the solver's own solution THROUGH the real game and reach the target.
  const level0 = EMBER_LEVELS[0];
  const sol = solve(puzzleFromRecord(level0), SOLVE);
  const log = movesToLog((sol.path ?? []) as Move[]);
  const world = createWorld(emberfoldGame);
  for (const f of log.frames) world.step(f);
  const probe = world.probe();
  t.check(`scripted solution fuses level 1 to ${probe.target} (hottest ${probe.best})`, probe.won === true);
  t.golden('level-1 solve replay', world.hash());

  // 8. Determinism: the same inputs produce the same world, bit for bit.
  const report = checkDeterministic(() => createWorld(emberfoldGame), log);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 9. A pure replay of the proven path also wins (logic ⇄ view agree on the outcome).
  {
    const p = puzzleFromRecord(level0);
    let s = p.initial();
    for (const m of (sol.path ?? []) as Move[]) s = p.apply(s, m);
    t.check('pure logic replay of the proven line also wins', isWin(s));
  }

  // 10. Looks artifact — a filmstrip of the level-1 solve for the headless judge.
  t.artifact(
    'solve-filmstrip.svg',
    renderFilmstrip(createWorld(emberfoldGame), log.frames, {
      width: emberfoldGame.width,
      height: emberfoldGame.height,
      background: emberfoldGame.background,
      panels: 6,
    }),
  );
}

// Small Flame verify suite. Proves: the chamber is winnable by a 0-death bot,
// the sim replays deterministically, ONE tank cannot clear the screen (fuel is
// the poem), and the feel floor holds — grace windows, feedback completeness,
// and avatar salience. Discovered and run by scripts/verify.ts.

import {
  createWorld,
  checkDeterministic,
  renderFilmstrip,
  tilemapFromAscii,
  levelIssues,
  forgivenessIssues,
  graceWindowIssues,
  feedbackIssues,
  salienceIssues,
  REGALIA,
  REGALIA_NIGHT,
  type InputLog,
} from '@hayao';
import {
  DEFAULT_FLAME,
  FLAME_NEUTRAL,
  GOAL_POINT,
  LEVEL,
  TILE,
  spawnState,
  stepFlame,
  type Point,
} from './logic';
import { smallFlameGame, feel, FEEDBACK, FEEDBACK_EVENTS } from './game';
import { driveBot } from './bot';
import type { VerifyContext } from '../../scripts/verify';

const DT = 1 / 60;
const cfg = DEFAULT_FLAME;

export default async function verify(t: VerifyContext) {
  // 1. The level data is well-formed (no stray glyphs, spawn/goal not buried).
  const issues = levelIssues(LEVEL);
  t.check(issues.length === 0 ? 'level data is clean' : `level issues: ${issues.join('; ')}`, issues.length === 0);

  // 2. A fuel-aware bot flies the intended line with ZERO deaths.
  const run = driveBot(cfg);
  t.check(
    run.won && run.deaths === 0
      ? `bot reached the lantern 0-death in ${run.ticks} frames, ${Math.round(run.fuelAtWin * 100)}% fuel left`
      : `bot failed: won=${run.won} deaths=${run.deaths} ticks=${run.ticks}`,
    run.won && run.deaths === 0,
  );

  // 3. Replaying the bot's inputs on the REAL game reaches the win state…
  const log: InputLog = { frames: run.frames };
  const world = createWorld(smallFlameGame);
  for (const f of log.frames) world.step(f);
  t.check('scripted flight wins on the real game', world.probe().won === true);
  t.golden('bot-flight replay', world.hash());

  // 4. …and the sim is deterministic across runs.
  const report = checkDeterministic(() => createWorld(smallFlameGame), log);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 5. Fuel is the poem: one full tank, burned straight up in open air, cannot
  //    span the spawn→lantern rise — so refueling is mandatory, not decoration.
  const openMap = tilemapFromAscii(Array.from({ length: 48 }, () => '.'.repeat(8)), TILE);
  const FAR: Point = { x: -9999, y: -9999 };
  const oneTankClimb = (() => {
    const s = spawnState(cfg);
    s.onGround = false;
    s.x = 120;
    s.y = 1600;
    const startY = s.y;
    let minY = s.y;
    let pressed = true;
    for (let i = 0; i < 600 && s.fuel > 0; i++) {
      stepFlame(s, { moveX: 0, thrustHeld: true, thrustPressed: pressed }, DT, openMap, cfg, [], FAR);
      pressed = false;
      minY = Math.min(minY, s.y);
    }
    return startY - minY;
  })();
  const riseNeeded = spawnState(cfg).y - (GOAL_POINT.y - cfg.height / 2);
  t.check(
    oneTankClimb < riseNeeded
      ? `one tank climbs ${Math.round(oneTankClimb)}px < ${Math.round(riseNeeded)}px rise — the tank bites, refuel is required`
      : `one tank climbs ${Math.round(oneTankClimb)}px ≥ ${Math.round(riseNeeded)}px rise — fuel does NOT bite (false depth)`,
    oneTankClimb < riseNeeded,
  );
  // …but a tank must still be a MEANINGFUL burn, not a token puff.
  t.check(`one tank is a meaningful burn (${Math.round(oneTankClimb)}px ≥ 250px)`, oneTankClimb >= 250);

  // 6. Grace floor (static): coyote + buffer + corner-nudge all above the floor.
  const forg = forgivenessIssues(feel.forgiveness!);
  t.check(forg.length === 0 ? 'forgiveness floor met (coyote + buffer + corner nudge)' : forg.join('; '), forg.length === 0);

  // 7. Coyote behaves as an EXACT window: a pop still fires up to the last coyote
  //    frame after leaving a ledge, and is refused one frame past it.
  const acceptsCoyote = (delayFrames: number): boolean => {
    const s = spawnState(cfg);
    s.onGround = false; // just walked off a ledge — coyote is armed
    s.x = 120;
    s.y = 200;
    for (let i = 0; i < delayFrames; i++) stepFlame(s, FLAME_NEUTRAL, DT, openMap, cfg, [], FAR);
    const ev = stepFlame(s, { moveX: 0, thrustHeld: true, thrustPressed: true }, DT, openMap, cfg, [], FAR);
    return ev.popped;
  };
  let coyoteW = -1;
  for (let d = 0; d <= 12; d++) if (acceptsCoyote(d)) coyoteW = d;
  t.check(`coyote window is a real, usable ${coyoteW + 1}-frame grace (≥ 3)`, coyoteW >= 2);
  const graceIssues = graceWindowIssues('coyote', coyoteW, acceptsCoyote);
  t.check(graceIssues.length === 0 ? 'coyote is a contiguous window with an exact edge' : graceIssues.join('; '), graceIssues.length === 0);

  // 8. Feedback completeness: every significant event answers on ≥ 2 senses.
  const fb = feedbackIssues(FEEDBACK, FEEDBACK_EVENTS);
  t.check(fb.length === 0 ? 'every event answers on ≥ 2 senses, juice bounded' : fb.join('; '), fb.length === 0);

  // 9. Readability: the flame out-contrasts the night and the scenery.
  const rw = createWorld(smallFlameGame);
  for (let i = 0; i < 40; i++) rw.step(i < 30 ? ['thrust', 'right'] : []);
  const sal = salienceIssues(rw.render(), REGALIA.gold, REGALIA_NIGHT.bg);
  t.check(sal.length === 0 ? 'the flame is the most salient thing on screen' : sal.join('; '), sal.length === 0);

  // 10. A filmstrip of the whole flight, for the looks judgement.
  t.artifact(
    'flight-filmstrip.svg',
    renderFilmstrip(createWorld(smallFlameGame), log.frames, {
      width: smallFlameGame.width,
      height: smallFlameGame.height,
      background: smallFlameGame.background,
      panels: 8,
    }),
  );
}

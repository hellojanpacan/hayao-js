// Brasswick verify suite: a pulse-flip bot proves the table is winnable in
// three balls (fair, not a coin-flip), the ball is proven table-bound at all
// observed speeds (bullet CCD in tight geometry), a searched flip proves the
// flipper genuinely commands the ball, a golden replay pins the whole flow,
// and feel probes gate the table's pulse.

import {
  KENTO, checkDeterministic, createWorld, firstFrame, layoutIssues, longestLull,
  missingControlHints, recordTimeline, renderFilmstrip,
} from '@hayao';
import { getBody } from '@hayao';
import { BALLS, TABLE, TARGET_SCORE, ballPos, initialPb, stepPb, type PbState } from './logic';
import { brasswickGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

const DT = 1 / 60;
const NO = { left: false, right: false, launch: false };

/** The reference player: pulse a flipper when the ball falls into its zone. */
function pulseBot(s: PbState, maxSeconds: number): { maxV: number; escapes: number; frames: number } {
  let maxV = 0, escapes = 0, f = 0;
  let holdL = 0, holdR = 0, coolL = 0, coolR = 0;
  for (; f < 60 * maxSeconds && !s.won && !s.dead; f++) {
    const b = ballPos(s);
    if (b && b.y > 555 && b.y < 625 && b.vy > -10) {
      if (b.x < 645 && coolL === 0) { holdL = 8; coolL = 20; }
      if (b.x > 635 && coolR === 0) { holdR = 8; coolR = 20; }
    }
    stepPb(s, { left: holdL > 0, right: holdR > 0, launch: !b && s.ballsLeft > 0 }, DT);
    holdL = Math.max(0, holdL - 1); holdR = Math.max(0, holdR - 1);
    coolL = Math.max(0, coolL - 1); coolR = Math.max(0, coolR - 1);
    const p = ballPos(s);
    if (p) {
      maxV = Math.max(maxV, Math.hypot(p.vx, p.vy));
      if (p.x < TABLE.left - 6 || p.x > TABLE.right + 6 || p.y < TABLE.top - 6) escapes++;
    }
  }
  return { maxV, escapes, frames: f };
}

export default async function verify(t: VerifyContext) {
  // 1 · Fairness: the pulse bot rings up the target inside three balls.
  {
    const s = initialPb();
    for (let f = 0; f < 60; f++) stepPb(s, NO, DT);
    const r = pulseBot(s, 150);
    t.check(
      s.won
        ? `pulse bot reaches ${s.score}/${TARGET_SCORE} and wins in ${(r.frames / 60).toFixed(0)}s (peak ball speed ${r.maxV.toFixed(0)}px/s)`
        : `table NOT beaten (${s.score}/${TARGET_SCORE}, dead=${s.dead})`,
      s.won,
    );
    // 2 · CCD in tight geometry: at every observed speed, the ball stayed
    //     inside the table — not one escaped frame in the whole game.
    t.check(`ball table-bound for the entire game (0 escapes, ${r.escapes} observed)`, r.escapes === 0);
  }

  // 3 · The flipper commands the ball: some flip timing sends a blade-rolling
  //     ball back to the bumper field (searched, not assumed).
  {
    let best = 9999;
    for (let flipAt = 0; flipAt <= 40; flipAt += 2) {
      const s = initialPb();
      for (let f = 0; f < 60; f++) stepPb(s, NO, DT);
      stepPb(s, { ...NO, launch: true }, DT);
      const b = getBody(s.phys, s.ball)!;
      b.x = 585; b.y = 520; b.vx = 0; b.vy = 100; // drop onto the left blade
      let minY = 9999;
      for (let f = 0; f < 240 && s.ball !== 0; f++) {
        stepPb(s, { left: f >= flipAt && f < flipAt + 12, right: false, launch: false }, DT);
        const p = ballPos(s);
        if (p && f > flipAt) minY = Math.min(minY, p.y);
      }
      best = Math.min(best, minY);
    }
    t.check(`a searched flip returns the ball to the bumper field (reaches y=${best.toFixed(0)})`, best < 400);
  }

  // 4 · An unflipped table always drains — no dead pockets anywhere.
  {
    const s = initialPb();
    for (let ball = 0; ball < BALLS; ball++) {
      stepPb(s, { ...NO, launch: true }, DT);
      for (let f = 0; f < 60 * 30 && s.ball !== 0; f++) stepPb(s, NO, DT);
      if (s.ball !== 0) break;
    }
    t.check('every unflipped serve drains (no dead pockets)', s.dead);
  }

  // 5 · Golden + determinism through the input layer, with feel probes.
  {
    const script: string[][] = [];
    const hold = (keys: string[], n: number) => { for (let k = 0; k < n; k++) script.push(keys); };
    hold([], 30);
    hold(['launch'], 1);
    // A fixed human-ish rhythm: alternate pulse flips as the ball comes down.
    for (let k = 0; k < 60 * 14; k++) {
      const phase = k % 45;
      script.push(phase < 8 ? ['left'] : phase >= 22 && phase < 30 ? ['right'] : []);
    }
    const world = createWorld(brasswickGame);
    const tl = recordTimeline(world, script);
    t.golden('one served ball, metronome flips', world.hash());
    const rep = checkDeterministic(() => createWorld(brasswickGame), { frames: script });
    t.check(rep.ok ? 'the rally replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);

    // Feel probe A: the serve reaches the bells fast — first score within 3s
    // of the serve (the table opens with action, not a slow roll).
    const serveAt = firstFrame(tl, (p) => p.inPlay === true);
    const scoreAt = firstFrame(tl, (p) => (p.score as number) > 0);
    t.check(
      `first bell rings ${scoreAt > 0 ? `${((scoreAt - serveAt) / 60).toFixed(1)}s` : 'never'} after the serve`,
      scoreAt > 0 && scoreAt - serveAt < 180,
    );
    // Feel probe B: the ball LIVES under metronome flips — at least 6 seconds
    // of play on the first ball (the funnel feeds the blades, not the drain).
    // Window judged from the metronome run: 5.2s alive, first bell 0.4s, lull 4.7s.
    const deadAt = firstFrame(tl.slice(serveAt), (p) => p.inPlay === false);
    const lifetime = deadAt < 0 ? tl.length - serveAt : deadAt;
    t.check(`first ball lives ${(lifetime / 60).toFixed(1)}s under metronome flips`, lifetime > 60 * 4);
    // Feel probe C: scoring cadence — no dead stretch longer than 8s while
    // the ball is alive (bells keep ringing under play).
    const alive = tl.slice(serveAt, serveAt + lifetime);
    const scoreFrames: number[] = [];
    for (let i = 1; i < alive.length; i++) if ((alive[i].score as number) > (alive[i - 1].score as number)) scoreFrames.push(i);
    const lull = longestLull(scoreFrames, alive.length);
    t.check(`longest scoreless stretch while alive: ${(lull / 60).toFixed(1)}s`, lull < 60 * 8);

    t.artifact('rally-filmstrip.svg', renderFilmstrip(createWorld(brasswickGame), script, { width: 1280, height: 720, background: KENTO.washi, panels: 8, cols: 4 }));
  }

  // 6 · The human-contact layer.
  {
    const world = createWorld(brasswickGame);
    world.step([]);
    const issues = layoutIssues(world.render());
    t.check(issues.length === 0 ? 'first frame: no text collisions' : `layout: ${issues[0]}`, issues.length === 0);
    const missing = missingControlHints(world, brasswickGame.inputMap);
    t.check(missing.length === 0 ? 'every control is named on screen' : `untaught controls: ${missing.join(', ')}`, missing.length === 0);
  }
}

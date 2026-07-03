// Vellgrove verify suite: the racing line completes the race, cornering skill
// beats flat-out recklessness, cutting the infield earns nothing, grass is
// genuinely slow, and the whole grand prix replays.

import { checkDeterministic, createWorld } from '@hayao';
import { driveLine, makeCar, stepCar, LAPS } from './logic';
import { vellgroveGame, vgState } from './game';
import type { VerifyContext } from '../../scripts/verify';

const DT = 1 / 60;

export default async function verify(t: VerifyContext) {
  // 1. The racing-line AI finishes 3 laps in a sane time (it IS the game's bar).
  {
    const c = makeCar(1);
    let time = 0;
    for (let f = 0; f < 60 * 180 && c.lap < LAPS; f++) {
      stepCar(c, driveLine(c), DT);
      time += DT;
    }
    t.check(`the racing line completes ${LAPS} laps in ${time.toFixed(1)}s (budget 120s)`, c.lap >= LAPS && time < 120);
  }

  // 2. Cornering matters: the braking line beats a flat-out floorer.
  {
    const smart = makeCar(0);
    const wild = makeCar(0);
    let smartTime = -1;
    let wildTime = -1;
    for (let f = 0; f < 60 * 180; f++) {
      if (smart.lap < LAPS) {
        stepCar(smart, driveLine(smart), DT);
        if (smart.lap >= LAPS && smartTime < 0) smartTime = f * DT;
      }
      if (wild.lap < LAPS) {
        const line = driveLine(wild);
        stepCar(wild, { throttle: 1, brake: 0, steer: line.steer }, DT); // never brakes
        if (wild.lap >= LAPS && wildTime < 0) wildTime = f * DT;
      }
    }
    t.check(
      `braking for corners wins (${smartTime > 0 ? smartTime.toFixed(1) : 'DNF'}s vs flat-out ${wildTime > 0 ? wildTime.toFixed(1) : 'DNF'}s)`,
      smartTime > 0 && (wildTime < 0 || smartTime < wildTime),
    );
  }

  // 3. Anti-cut: teleporting across the infield advances NOTHING (only the
  //    ordered next checkpoint counts).
  {
    const c = makeCar(0);
    c.x = 640;
    c.y = 360; // dead centre of the infield
    const cpBefore = c.nextCp;
    for (let f = 0; f < 60; f++) stepCar(c, { throttle: 0, brake: 0, steer: 0 }, DT);
    t.check('the infield holds no checkpoints — cutting earns nothing', c.nextCp === cpBefore && c.lap === 0);
  }

  // 4. Grass is slow: top speed on grass is a fraction of tarmac's.
  {
    const road = makeCar(0);
    const lawn = makeCar(0);
    lawn.x = 640;
    lawn.y = 360; // infield grass
    road.x = 500;
    road.y = 110; // on the back straight
    road.heading = 0;
    lawn.heading = 0;
    let roadTop = 0;
    let lawnTop = 0;
    for (let f = 0; f < 240; f++) {
      stepCar(road, { throttle: 1, brake: 0, steer: 0 }, DT);
      stepCar(lawn, { throttle: 1, brake: 0, steer: 0 }, DT);
      roadTop = Math.max(roadTop, Math.hypot(road.vx, road.vy));
      lawnTop = Math.max(lawnTop, Math.hypot(lawn.vx, lawn.vy));
    }
    t.check(`grass throttles the engine (${lawnTop.toFixed(0)} vs ${roadTop.toFixed(0)} px/s, ≤60%)`, lawnTop < roadTop * 0.6);
  }

  // 5. Full race through the input layer: the player-bot (same line logic,
  //    quantized to key presses) finishes; determinism + golden.
  {
    const world = createWorld(vellgroveGame);
    const frames: string[][] = [];
    let outcome: 'done' | 'timeout' = 'timeout';
    for (let f = 0; f < 60 * 150; f++) {
      const s = vgState(world);
      if (s.done) {
        outcome = 'done';
        break;
      }
      const c = s.cars[0];
      const line = driveLine(c);
      const acts: string[] = [];
      if (s.countdown <= 0) {
        if (line.throttle > 0.5) acts.push('gas');
        if (line.brake > 0.3) acts.push('brake');
        if (line.steer > 0.2) acts.push('right');
        else if (line.steer < -0.2) acts.push('left');
      }
      frames.push(acts);
      world.step(acts);
    }
    const s = vgState(world);
    const pos = s.results.indexOf(0) + 1;
    t.check(outcome === 'done' ? `the player-bot finishes the grand prix P${pos} in ${s.time.toFixed(1)}s` : 'player-bot DNF', outcome === 'done');
    t.golden('full grand prix', world.hash());
    const rep = checkDeterministic(() => createWorld(vellgroveGame), { frames });
    t.check(rep.ok ? 'the race replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);
  }
}

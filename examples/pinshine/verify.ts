// Pinshine verify suite: an aim-searching sharpshooter clears every orange
// peg inside the ball budget (the board is fair), swept collision never lets
// even an absurdly fast ball tunnel, restitution never adds energy, and a
// full rack replays.

import { checkDeterministic, createWorld } from '@hayao';
import { initialPs, stepPs, sweptCircleHit, BALL_R, PEG_R, type PsState } from './logic';
import { pinshineGame, psState } from './game';
import type { VerifyContext } from '../../scripts/verify';

const DT = 1 / 60;

/** Simulate one full shot at a fixed aim on a cloned state; return oranges lit. */
function shotValue(s: PsState, aim: number): number {
  const clone = structuredClone(s);
  clone.aim = aim;
  stepPs(clone, { aimDir: 0, launch: true }, DT);
  for (let f = 0; f < 60 * 20 && clone.ball; f++) stepPs(clone, { aimDir: 0, launch: false }, DT);
  const before = s.pegs.filter((p) => p.orange).length;
  const after = clone.pegs.filter((p) => p.orange).length;
  return (before - after) * 100 + (s.pegs.length - clone.pegs.length);
}

export default async function verify(t: VerifyContext) {
  // 1. The sharpshooter: search 49 aims per shot, fire the best.
  const s = initialPs();
  let shots = 0;
  while (!s.won && !s.dead && shots < 20) {
    let bestAim = 0;
    let bestVal = -1;
    for (let i = 0; i <= 48; i++) {
      const aim = -1.2 + (2.4 * i) / 48;
      const v = shotValue(s, aim);
      if (v > bestVal) {
        bestVal = v;
        bestAim = aim;
      }
    }
    s.aim = bestAim;
    stepPs(s, { aimDir: 0, launch: true }, DT);
    shots++;
    for (let f = 0; f < 60 * 20 && s.ball; f++) stepPs(s, { aimDir: 0, launch: false }, DT);
  }
  t.check(
    s.won ? `sharpshooter clears every orange in ${shots} shots (score ${s.score}, ${s.caught} saves)` : `board NOT cleared (${s.pegs.filter((p) => p.orange).length} oranges left after ${shots} shots)`,
    s.won,
  );

  // 2. CCD proof: a 40× overspeed ball aimed dead-centre at a peg still hits.
  {
    const t0 = sweptCircleHit(0, 0, 24000, 0, 300, 0, BALL_R + PEG_R, DT);
    t.check(`swept collision catches a 24,000px/s ball dead-on (t=${t0?.toFixed(5)})`, t0 !== null);
    const graze = sweptCircleHit(0, 0, 24000, 0, 300, BALL_R + PEG_R + 1, BALL_R + PEG_R, DT);
    t.check('…and correctly misses a 1px-outside graze', graze === null);
  }

  // 3. Energy honesty: with restitution < 1, flight speed never exceeds the
  //    launch speed by more than one gravity step.
  {
    const w = initialPs();
    w.aim = 0.35;
    stepPs(w, { aimDir: 0, launch: true }, DT);
    let maxSpeed = 0;
    let prevSpeed = Infinity;
    let gained = false;
    for (let f = 0; f < 60 * 15 && w.ball; f++) {
      const b = w.ball;
      const sp = Math.hypot(b.vx, b.vy);
      maxSpeed = Math.max(maxSpeed, sp);
      // Speed may grow from gravity while falling, but a BOUNCE must not add
      // energy: compare against pre-impact speed + one frame of gravity.
      if (sp > prevSpeed + 12 && b.vy < 0) gained = true; // rising faster than before
      prevSpeed = sp;
      stepPs(w, { aimDir: 0, launch: false }, DT);
    }
    t.check(`bounces never add energy (peak flight speed ${maxSpeed.toFixed(0)}px/s)`, !gained);
  }

  // 4. Determinism + golden via the input layer.
  const world = createWorld(pinshineGame);
  const frames: string[][] = [];
  const drive = (a: string[]) => {
    frames.push(a);
    world.step(a);
  };
  for (let i = 0; i < 20; i++) drive(['right']);
  drive(['launch']);
  for (let f = 0; f < 60 * 12; f++) drive([]);
  t.golden('one aimed shot', world.hash());
  const rep = checkDeterministic(() => createWorld(pinshineGame), { frames });
  t.check(rep.ok ? 'the rack replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);
  void psState;
}

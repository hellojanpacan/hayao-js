// Veilstep verify suite: the heist is possible without a single alarm, the
// stealth systems are REAL (open ground gets you spotted, bushes never do,
// noise turns heads), and it all replays deterministically.

import { checkDeterministic, createPlanBot, createWorld, steer2D } from '@hayao';
import { initialVs, stepVs } from './logic';
import { veilstepGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

interface GuardView {
  x: number;
  y: number;
  fx: number;
  fy: number;
  state: string;
  dir: number;
}
interface P {
  x: number;
  y: number;
  idol: boolean;
  won: boolean;
  alarms: number;
  guards: GuardView[];
}

type Step = { kind: 'walk'; x: number; y: number } | { kind: 'waitFn'; fn: (p: P) => boolean };

/** The heist: thread the gaps while each band's guard walks away. */
const HEIST: Step[] = [
  // Bottom band → wall-B gap (x 224) once the bottom guard is far right.
  { kind: 'waitFn', fn: (p) => p.guards[2].x > 620 && p.guards[2].fx > 0 },
  { kind: 'walk', x: 224, y: 560 },
  { kind: 'walk', x: 224, y: 400 },
  // Mid band → cross east under wall A while the mid guard heads left/west.
  { kind: 'waitFn', fn: (p) => p.guards[1].x < 500 && p.guards[1].fx < 0 },
  { kind: 'walk', x: 1056, y: 400 },
  // Up through wall-A gap once the top guard is far into its leftward leg —
  // the window must cover grab AND descent: waiting at the idol is exposed.
  { kind: 'waitFn', fn: (p) => p.guards[0].x < 520 && p.guards[0].fx < 0 },
  { kind: 'walk', x: 1056, y: 170 },
  { kind: 'walk', x: 1168, y: 80 }, // the idol — no dawdling…
  { kind: 'walk', x: 1056, y: 170 },
  { kind: 'walk', x: 1056, y: 400 }, // …down into the alcove bush (safe landing)
  // Wait hidden for a combined window — mid + bottom guards both heading east
  // (their 260px cones can't touch the western corridor for the whole exfil) —
  // then run the entire way home in one continuous move.
  { kind: 'waitFn', fn: (p) => p.guards[1].x > 800 && p.guards[1].fx > 0 && p.guards[2].x > 620 && p.guards[2].fx > 0 },
  { kind: 'walk', x: 224, y: 400 },
  { kind: 'walk', x: 224, y: 560 },
  { kind: 'walk', x: 112, y: 624 }, // home
];

export default async function verify(t: VerifyContext) {
  // 1. Full heist, zero alarms.
  const world = createWorld(veilstepGame);
  const bot = createPlanBot<Step, P>(HEIST, {
    walk(step, p, out, ctx) {
      if (step.kind !== 'walk') return;
      steer2D(p.x, p.y, step.x, step.y, out);
      if (Math.abs(p.x - step.x) <= 10 && Math.abs(p.y - step.y) <= 10) ctx.next();
    },
    waitFn(step, p, _out, ctx) {
      if (step.kind === 'waitFn' && step.fn(p)) ctx.next();
    },
  });
  const log: string[][] = [];
  let frames = -1;
  for (let f = 0; f < 14400; f++) {
    const p = world.probe() as unknown as P;
    if (p.won) {
      frames = f;
      break;
    }
    const a = bot(p);
    log.push(a);
    world.step(a);
  }
  const alarms = (world.probe() as { alarms: number }).alarms;
  t.check(
    frames >= 0 && alarms === 0 ? `full heist: idol stolen and exfiltrated in ${(frames / 60).toFixed(1)}s, 0 alarms` : `heist ${frames < 0 ? 'DID NOT finish' : `raised ${alarms} alarm(s)`}`,
    frames >= 0 && alarms === 0,
  );
  t.golden('full heist', world.hash());

  // 2. Negative: standing in the open in a patrol lane → spotted quickly.
  {
    const s = initialVs();
    s.x = 640;
    s.y = 336; // mid band, in guard 1's lane — NOT in the bush at (640,336)? it IS the bush. use open ground:
    s.x = 480;
    let spotted = false;
    let tSpot = 0;
    for (let f = 0; f < 1800 && !spotted; f++) {
      spotted = stepVs(s, { moveX: 0, moveY: 0, sprint: false }, 1 / 60).spotted;
      tSpot = f / 60;
    }
    t.check(`standing exposed in a patrol lane is punished (spotted after ${tSpot.toFixed(1)}s)`, spotted && tSpot < 15);
  }

  // 3. Negative: waiting INSIDE a bush through a full patrol loop → never spotted.
  {
    const s = initialVs();
    s.x = 640;
    s.y = 336; // the mid-band bush — directly in the patrol lane
    let spotted = false;
    for (let f = 0; f < 2400; f++) if (stepVs(s, { moveX: 0, moveY: 0, sprint: false }, 1 / 60).spotted) spotted = true;
    t.check('a bush in the patrol lane conceals through a full loop', !spotted);
  }

  // 4. Noise: sprinting near a guard flips it to investigate.
  {
    const s = initialVs();
    s.x = 640;
    s.y = 500; // bottom band, off the lane
    let investigated = false;
    for (let f = 0; f < 600 && !investigated; f++) {
      stepVs(s, { moveX: 1, moveY: 0, sprint: true }, 1 / 60);
      investigated = s.guards[2].state === 'investigate';
    }
    t.check('sprint noise turns the nearest guard to investigate', investigated);
  }

  // 5. Determinism over the heist log.
  const rep = checkDeterministic(() => createWorld(veilstepGame), { frames: log.slice(0, 7200) });
  t.check(rep.ok ? 'stealth sim is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

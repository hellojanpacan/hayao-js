// Rookspire verify suite: an aim-searching siege bot proves every castle
// falls within its stone budget (winnability + difficulty meter in one), the
// full-power shot cannot tunnel a plank (bullet CCD), settled castles sleep
// (the demolition perf story), a golden replay pins the whole flow, and feel
// probes gate collapse pacing.

import { checkDeterministic, createWorld, layoutIssues, missingControlHints, recordTimeline, renderFilmstrip, firstFrame } from '@hayao';
import { LEVEL_COUNT, LEVEL_SHOTS, idolsLeft, initialRk, stepRk, type RkState } from './logic';
import { rookspireGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

const DT = 1 / 60;
const NO_INPUT = { aimDir: 0, powerDir: 0, launch: false };

/** Fire one shot at (aim, power) on a clone; score damage after 4s. Partial
 * credit for structural displacement gives the greedy bot a gradient toward
 * multi-stage demolitions (break the roof this stone, smash the rook next). */
function shotValue(s: RkState, aim: number, power: number): number {
  const before = new Map(s.phys.bodies.map((b) => [b.id, { x: b.x, y: b.y }]));
  const c = structuredClone(s);
  c.aim = aim;
  c.power = power;
  stepRk(c, { ...NO_INPUT, launch: true }, DT);
  const proj = c.proj;
  for (let f = 0; f < 240; f++) stepRk(c, NO_INPUT, DT);
  let displaced = 0;
  for (const b of c.phys.bodies) {
    if (b.kind !== 'dynamic' || b.id === proj) continue;
    const b0 = before.get(b.id);
    if (b0) displaced += Math.min(120, Math.hypot(b.x - b0.x, b.y - b0.y));
  }
  return (idolsLeft(s) - idolsLeft(c)) * 5000 + (c.score - s.score) * 2 + displaced;
}

/** Greedy siege bot: search an aim×power grid per shot, fire the best. */
function siege(level: number): { won: boolean; shotsUsed: number; s: RkState } {
  const s = initialRk(level);
  for (let f = 0; f < 120; f++) stepRk(s, NO_INPUT, DT); // let the castle settle
  let shotsUsed = 0;
  while (!s.won && !s.dead && s.shotsLeft > 0) {
    let best = { aim: -0.5, power: 0.6, v: -Infinity };
    for (let ai = 0; ai < 11; ai++) {
      const aim = -1.1 + (1.15 * ai) / 10;
      for (const power of [0.35, 0.65, 1]) {
        const v = shotValue(s, aim, power);
        if (v > best.v) best = { aim, power, v };
      }
    }
    s.aim = best.aim;
    s.power = best.power;
    stepRk(s, { ...NO_INPUT, launch: true }, DT);
    shotsUsed++;
    for (let f = 0; f < 600 && s.proj !== 0; f++) stepRk(s, NO_INPUT, DT);
    for (let f = 0; f < 90 && !s.won; f++) stepRk(s, NO_INPUT, DT); // late topples count
  }
  return { won: s.won, shotsUsed, s };
}

export default async function verify(t: VerifyContext) {
  // 1 · Winnability: the siege bot razes every castle within budget.
  for (let level = 0; level < LEVEL_COUNT; level++) {
    const r = siege(level);
    t.check(
      r.won
        ? `castle ${level} falls in ${r.shotsUsed}/${LEVEL_SHOTS[level]} stones (score ${r.s.score})`
        : `castle ${level} did NOT fall (${idolsLeft(r.s)} rooks left after ${r.shotsUsed} stones)`,
      r.won,
    );
  }

  // 2 · CCD: a full-power flat shot strikes the tower — never tunnels it.
  {
    const s = initialRk(0);
    for (let f = 0; f < 120; f++) stepRk(s, NO_INPUT, DT);
    s.aim = -0.05; // flat at the tower's midsection
    s.power = 1;
    stepRk(s, { ...NO_INPUT, launch: true }, DT);
    let struck = false;
    for (let f = 0; f < 90; f++) {
      const ev = stepRk(s, NO_INPUT, DT);
      if (ev.thud > 20) struck = true;
    }
    const boxesMoved = s.phys.bodies.some((b) => b.kind === 'dynamic' && b.shape.kind === 'poly' && Math.abs(b.x - 900) > 30);
    t.check(`full-power flat shot strikes the tower (CCD, boxes scattered: ${boxesMoved})`, struck && boxesMoved);
  }

  // 3 · The demolition perf story: a settled castle sleeps to zero awake.
  {
    const s = initialRk(2);
    for (let f = 0; f < 400; f++) stepRk(s, NO_INPUT, DT);
    const awake = s.phys.bodies.filter((b) => b.kind === 'dynamic' && !b.sleeping).length;
    t.check(`the Hanging Keep settles to sleep (${awake} awake of ${s.phys.bodies.length} bodies)`, awake === 0);
    // …and a step over the sleeping castle is near-free.
    const t0 = performance.now();
    for (let f = 0; f < 120; f++) stepRk(s, NO_INPUT, DT);
    const avg = (performance.now() - t0) / 120;
    t.check(`sleeping-castle step averages ${avg.toFixed(3)}ms (< 0.5ms budget)`, avg < 0.5);
  }

  // 4 · Live-collapse perf: mid-demolition step stays under budget.
  {
    const s = initialRk(2);
    for (let f = 0; f < 120; f++) stepRk(s, NO_INPUT, DT);
    s.aim = -0.35; s.power = 1;
    stepRk(s, { ...NO_INPUT, launch: true }, DT);
    const t0 = performance.now();
    for (let f = 0; f < 180; f++) stepRk(s, NO_INPUT, DT);
    const avg = (performance.now() - t0) / 180;
    t.check(`mid-collapse step averages ${avg.toFixed(3)}ms (< 2.5ms budget)`, avg < 2.5);
  }

  // 5 · Golden + determinism through the real input layer, with feel probes.
  {
    const script: string[][] = [];
    const hold = (keys: string[], n: number) => { for (let k = 0; k < n; k++) script.push(keys); };
    hold([], 120);            // castle settles
    hold(['down'], 36);       // flat body shot — collapse the tower under the rook
    hold(['right'], 26);      // full draw
    hold(['launch'], 1);
    hold([], 420);            // flight + collapse
    const world = createWorld(rookspireGame);
    const tl = recordTimeline(world, script);
    t.golden('one aimed stone', world.hash());
    const rep = checkDeterministic(() => createWorld(rookspireGame), { frames: script });
    t.check(rep.ok ? 'the siege replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);

    // Feel probe A: the collapse reads as a real event — bodies WAKE when the
    // stone lands (awake count spikes above the settled baseline).
    const launchAt = firstFrame(tl, (p) => p.inFlight === true);
    const peakAwake = Math.max(...tl.slice(launchAt).map((p) => p.awake as number));
    t.check(`impact wakes the castle (peak ${peakAwake} awake bodies after launch)`, peakAwake >= 3);

    // Feel probe B: the dust settles — the world goes quiet again within 7s
    // of the launch (sleep reclaims the scene; no perpetual jitter).
    const quietAt = firstFrame(tl.slice(launchAt + 60), (p) => (p.awake as number) === 0);
    t.check(`the dust settles ${quietAt >= 0 ? `${((quietAt + 60) / 60).toFixed(1)}s` : 'NEVER'} after launch`, quietAt >= 0 && quietAt + 60 < 420);

    t.artifact('siege-filmstrip.svg', renderFilmstrip(createWorld(rookspireGame), script, { width: 1280, height: 720, background: '#e9e0c9', panels: 8, cols: 4 }));
  }

  // 6 · The human-contact layer: text never collides, controls are taught.
  {
    const world = createWorld(rookspireGame);
    world.step([]);
    const issues = layoutIssues(world.render());
    t.check(issues.length === 0 ? 'first frame: no text collisions' : `layout: ${issues[0]}`, issues.length === 0);
    const missing = missingControlHints(world, rookspireGame.inputMap);
    t.check(missing.length === 0 ? 'every control is named on screen' : `untaught controls: ${missing.join(', ')}`, missing.length === 0);
  }
}

// Lumen Forge verify suite: the genre's truth is its pacing curve, so the
// gate IS a balance simulation. A greedy bot (click 5/s, always buy the
// cheapest affordable tier) must hit era milestones inside tuned windows, the
// unlock cadence must ramp without dead stretches, and buys must replay
// deterministically through the input-action path.

import { checkDeterministic, createWorld, type World } from '@hayao';
import { canBuy, cost, production, unlockedCount, TIERS } from './logic';
import { lfState, lumenForgeGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** Greedy playthrough; returns per-tier first-purchase times (sim seconds). */
function greedyRun(world: World, minutes: number): { firstBuy: number[]; log: string[][]; prodSamples: number[] } {
  const frames = minutes * 60 * 60;
  const firstBuy = TIERS.map(() => -1);
  const log: string[][] = [];
  const prodSamples: number[] = [];
  for (let f = 0; f < frames; f++) {
    const s = lfState(world);
    const actions: string[] = [];
    if (f % 12 === 0) actions.push('forge'); // 5 clicks/sec
    // Buy the cheapest affordable visible tier (one per frame is plenty).
    let best = -1;
    for (let i = 0; i < unlockedCount(s); i++) if (canBuy(s, i) && (best === -1 || cost(s, i) < cost(s, best))) best = i;
    if (best >= 0) {
      actions.push(`buy-${best}`);
      if (firstBuy[best] < 0) firstBuy[best] = f / 60;
    }
    log.push(actions);
    world.step(actions);
    if (f % 600 === 0) prodSamples.push(production(lfState(world)));
  }
  return { firstBuy, log, prodSamples };
}

export default async function verify(t: VerifyContext) {
  const world = createWorld(lumenForgeGame);
  const { firstBuy, log, prodSamples } = greedyRun(world, 12);

  // 1. Era milestones (tuned windows; retuning that breaks pacing fails here).
  const windows: [number, number][] = [
    [0, 30], // lantern within 30s
    [10, 120], // firefly
    [45, 300], // glow-wheel within 5 min
    [120, 480], // star-kiln within 8 min
    [240, 720], // dawn engine within 12 min
  ];
  firstBuy.forEach((at, i) => {
    const [lo, hi] = windows[i];
    const ok = at >= 0 && at >= lo && at <= hi;
    t.check(`${TIERS[i].name} first bought at ${at < 0 ? 'NEVER' : `${at.toFixed(0)}s`} (window ${lo}–${hi}s)`, ok);
  });

  // 2. Production strictly grows era over era (no stalls).
  const monotone = prodSamples.every((p, i) => i === 0 || p >= prodSamples[i - 1]);
  t.check('production is monotonically non-decreasing across the run', monotone);

  // 3. Unlock cadence: each later unlock takes longer (tension ramps) but never
  //    more than ~5× the previous gap (no dead stretches).
  const gaps: number[] = [];
  for (let i = 1; i < firstBuy.length; i++) if (firstBuy[i] > 0 && firstBuy[i - 1] > 0) gaps.push(firstBuy[i] - firstBuy[i - 1]);
  const ramps = gaps.every((g, i) => i === 0 || g > gaps[i - 1] * 0.6);
  const noDesert = gaps.every((g, i) => i === 0 || g < Math.max(60, gaps[i - 1] * 5));
  t.check(`unlock gaps ramp without deserts (${gaps.map((g) => g.toFixed(0) + 's').join(' → ')})`, ramps && noDesert);

  // 4. No softlock: clicking alone affords the first lantern inside 60s.
  const w2 = createWorld(lumenForgeGame);
  let bought = -1;
  for (let f = 0; f < 3600 && bought < 0; f++) {
    const acts = f % 12 === 0 ? ['forge'] : [];
    if (canBuy(lfState(w2), 0)) bought = f / 60;
    w2.step(acts);
  }
  t.check(`clicking alone affords a lantern in ${bought.toFixed(0)}s`, bought >= 0 && bought <= 60);

  // 5. Determinism through the action path (clicks included).
  const rep = checkDeterministic(() => createWorld(lumenForgeGame), { frames: log.slice(0, 7200) });
  t.check(rep.ok ? 'economy is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

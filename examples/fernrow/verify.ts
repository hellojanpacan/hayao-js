// Fernrow verify suite: a diligent farmer bot wins the year, crop rules are
// honest (no water = no growth; seasons wither), the energy budget truly
// bounds a day, reinvestment beats hoarding, and the year replays.

import { checkDeterministic, createWorld, renderFilmstrip } from '@hayao';
import { initialFr, pidx, seasonOf, stepFr, CROPS, ENERGY_PER_DAY, GOAL_COINS, SEASON_CROP, YEAR_DAYS, type FrAction, type FrState } from './logic';
import { fernrowGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** Diligent farmer: work a plot budget each day — till, plant, water, harvest. */
function farmYear(plotBudget: number, log?: FrAction[]): FrState {
  const s = initialFr();
  const act = (a: FrAction) => {
    stepFr(s, a);
    log?.push(a);
  };
  const goto = (x: number, y: number) => {
    while (s.x < x) act('right');
    while (s.x > x) act('left');
    while (s.y < y) act('down');
    while (s.y > y) act('up');
  };
  const plotAt = (i: number) => ({ x: i % 10, y: (i / 10) | 0 });
  for (let day = 1; day <= YEAR_DAYS && !s.won; day++) {
    const season = seasonOf(s.day);
    const cropId = SEASON_CROP[season];
    for (let i = 0; i < plotBudget && s.energy > 2; i++) {
      const { x, y } = plotAt(i);
      goto(x, y);
      const plot = s.plots[pidx(x, y)];
      if (plot.crop && plot.grown >= CROPS[plot.crop].growDays) act('harvest');
      const p2 = s.plots[pidx(x, y)];
      // Only sow what can mature: nights left this season must cover growDays.
      const seasonDay = ((s.day - 1) % 4) + 1;
      const nightsLeft = 5 - seasonDay;
      if (cropId && !p2.crop && s.coins >= CROPS[cropId].seedCost && CROPS[cropId].growDays <= nightsLeft) {
        if (!p2.tilled) act('till');
        act('plant');
      }
      if (s.plots[pidx(x, y)].crop) act('water');
    }
    if (!s.won) act('sleep');
  }
  return s;
}

export default async function verify(t: VerifyContext) {
  // 1. A diligent year wins.
  const log: FrAction[] = [];
  const end = farmYear(8, log);
  t.check(
    end.won ? `diligent farmer reaches ${GOAL_COINS} coins (day ${Math.min(end.day, YEAR_DAYS)}, ${end.harvested} harvests, ${end.coins} coins)` : `farmer FELL SHORT: ${end.coins}/${GOAL_COINS}`,
    end.won,
  );

  // 2. Crop honesty: unwatered crops do not grow; seasons wither strangers.
  {
    const s = initialFr();
    stepFr(s, 'till');
    stepFr(s, 'plant');
    stepFr(s, 'sleep'); // NOT watered
    t.check('an unwatered crop does not grow overnight', s.plots[pidx(4, 3)].grown === 0);
    stepFr(s, 'water');
    stepFr(s, 'sleep');
    t.check('a watered crop grows overnight', s.plots[pidx(4, 3)].grown === 1);
    // Roll unwatered into summer (day 5): the unripe spring turnip withers.
    while (seasonOf(s.day) === 'spring') stepFr(s, 'sleep');
    t.check('season change withers out-of-season unripe crops', s.plots[pidx(4, 3)].crop === null);
  }

  // 3. Energy truly bounds a day: no sequence exceeds ENERGY_PER_DAY actions.
  {
    const s = initialFr();
    let spent = 0;
    for (let i = 0; i < 200; i++) {
      const before = s.energy;
      stepFr(s, i % 2 === 0 ? 'till' : 'water');
      if (s.energy < before) spent++;
      if (i % 2 === 0) stepFr(s, 'right'); // new plot to till
      if (s.x === 9) {
        stepFr(s, 'down');
        for (let k = 0; k < 9; k++) stepFr(s, 'left');
      }
    }
    t.check(`the day is energy-bounded (${spent} ≤ ${ENERGY_PER_DAY} paid actions)`, spent <= ENERGY_PER_DAY);
  }

  // 4. Compounding: farming more plots (reinvesting coins) beats farming few.
  {
    const big = farmYear(8);
    const small = farmYear(2);
    t.check(`reinvestment compounds (8 plots → ${big.coins} vs 2 plots → ${small.coins})`, big.coins > small.coins);
  }

  // 5. Determinism + golden over the winning year.
  const world = createWorld(fernrowGame);
  const frames: string[][] = [];
  for (const a of log) {
    frames.push([a], []);
    world.step([a]);
    world.step([]);
  }
  t.golden('diligent year', world.hash());
  const rep = checkDeterministic(() => createWorld(fernrowGame), { frames });
  t.check(rep.ok ? 'the year replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);

  // 6. Filmstrip of the year, for the looks judgement (does the farm read?).
  t.artifact('year-filmstrip.svg', renderFilmstrip(createWorld(fernrowGame), frames, { width: 1280, height: 720, background: fernrowGame.background, panels: 8 }));
}

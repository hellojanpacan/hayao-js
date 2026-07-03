import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { initialFr, pidx, seasonOf, stepFr, CROPS, START_COINS, YEAR_DAYS } from './logic';
import { fernrowGame, frState } from './game';

describe('calendar', () => {
  it('seasons advance every 4 days across a 16-day year', () => {
    expect(seasonOf(1)).toBe('spring');
    expect(seasonOf(4)).toBe('spring');
    expect(seasonOf(5)).toBe('summer');
    expect(seasonOf(9)).toBe('autumn');
    expect(seasonOf(YEAR_DAYS)).toBe('winter');
  });
});

describe('farming', () => {
  it('till → plant spends seed cost; planting needs tilled ground', () => {
    const s = initialFr();
    stepFr(s, 'plant');
    expect(s.plots[pidx(4, 3)].crop).toBeNull(); // not tilled yet
    stepFr(s, 'till');
    stepFr(s, 'plant');
    expect(s.plots[pidx(4, 3)].crop).toBe('turnip');
    expect(s.coins).toBe(START_COINS - CROPS.turnip.seedCost);
  });

  it('full turnip lifecycle: 2 watered nights, harvest pays out', () => {
    const s = initialFr();
    stepFr(s, 'till');
    stepFr(s, 'plant');
    for (let d = 0; d < 2; d++) {
      stepFr(s, 'water');
      stepFr(s, 'sleep');
    }
    const coins = s.coins;
    stepFr(s, 'harvest');
    expect(s.coins).toBe(coins + CROPS.turnip.sellPrice);
    expect(s.harvested).toBe(1);
  });

  it('watering only works on planted, dry plots', () => {
    const s = initialFr();
    const e0 = s.energy;
    stepFr(s, 'water');
    expect(s.energy).toBe(e0); // nothing to water — no energy spent
  });
});

describe('game wiring', () => {
  it('actions flow through input edges', () => {
    const world = createWorld(fernrowGame);
    world.step(['till']);
    world.step([]);
    world.step(['plant']);
    expect(frState(world).plots[pidx(4, 3)].crop).toBe('turnip');
  });
});

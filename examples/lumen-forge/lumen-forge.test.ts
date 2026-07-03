import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { buy, cost, forge, initialEconomy, production, tick, unlockedCount, TIERS } from './logic';
import { lfState, lumenForgeGame } from './game';

describe('economy math', () => {
  it('cost curve is exponential in owned count', () => {
    const s = initialEconomy();
    const c0 = cost(s, 0);
    s.owned[0] = 10;
    expect(cost(s, 0)).toBeGreaterThan(c0 * Math.pow(TIERS[0].costRate, 9));
  });

  it('buy spends and increments; refuses when broke', () => {
    const s = initialEconomy();
    expect(buy(s, 0)).toBe(false);
    s.motes = cost(s, 0);
    expect(buy(s, 0)).toBe(true);
    expect(s.owned[0]).toBe(1);
    expect(s.motes).toBe(0);
  });

  it('tick produces, forge clicks, unlocks reveal by lifetime total', () => {
    const s = initialEconomy();
    forge(s);
    expect(s.motes).toBe(1);
    s.owned[1] = 2;
    tick(s, 4);
    expect(production(s)).toBe(TIERS[1].prod * 2);
    expect(s.total).toBeCloseTo(1 + TIERS[1].prod * 8); // 41 ≥ firefly unlock (40)
    expect(unlockedCount(s)).toBeGreaterThanOrEqual(2);
    // Spending never re-locks tiers (unlocks track lifetime total).
    s.motes = 0;
    expect(unlockedCount(s)).toBeGreaterThanOrEqual(2);
  });
});

describe('game wiring', () => {
  it('forge and buy actions flow through input into world.state', () => {
    const world = createWorld(lumenForgeGame);
    for (let i = 0; i < TIERS[0].baseCost; i++) {
      world.step(['forge']);
      world.step([]); // release so justPressed re-arms
    }
    expect(lfState(world).motes).toBeGreaterThanOrEqual(TIERS[0].baseCost);
    world.step(['buy-0']);
    expect(lfState(world).owned[0]).toBe(1);
  });
});

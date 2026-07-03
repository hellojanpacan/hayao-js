import { describe, expect, it } from 'vitest';
import { Rng, createWorld } from '@hayao';
import { initialTs, stepTs, CARDS, P_TUNE, STARTER_DECK } from './logic';
import { thornspireGame, tsState } from './game';

const idle = { play: -1, endTurn: false, pick: -1, proceed: false };

describe('cards & energy', () => {
  it('playing a card spends energy, moves it to discard, and refuses over-cost', () => {
    const rng = new Rng(2);
    const s = initialTs();
    stepTs(s, { ...idle, proceed: true }, rng);
    const f = s.fight!;
    expect(f.hand.length).toBe(P_TUNE.draw);
    const e0 = f.energy;
    stepTs(s, { ...idle, play: 0 }, rng);
    expect(f.energy).toBeLessThan(e0);
    // Burn energy down, then try an unaffordable card.
    while (f.energy > 0 && f.hand.some((id) => CARDS[id].cost <= f.energy)) {
      const i = f.hand.findIndex((id) => CARDS[id].cost <= f.energy);
      stepTs(s, { ...idle, play: i }, rng);
      if (!s.fight) return; // foe died — fine
    }
    const before = f.hand.length;
    stepTs(s, { ...idle, play: 0 }, rng);
    expect(f.hand.length).toBe(before); // refused
  });

  it('block absorbs the telegraphed hit; leftover damage bleeds through', () => {
    const rng = new Rng(2);
    const s = initialTs();
    stepTs(s, { ...idle, proceed: true }, rng);
    const f = s.fight!;
    f.hand = ['defend', 'strike', 'strike', 'strike', 'strike'];
    stepTs(s, { ...idle, play: 0 }, rng); // +5 block vs slime's 7 attack
    const hp0 = s.hp;
    stepTs(s, { ...idle, endTurn: true }, rng);
    expect(hp0 - s.hp).toBe(2);
  });

  it('vulnerable amplifies damage by 50%', () => {
    const rng = new Rng(2);
    const s = initialTs();
    stepTs(s, { ...idle, proceed: true }, rng);
    const f = s.fight!;
    f.energy = 3;
    f.hand = ['bash', 'strike', 'defend', 'defend', 'defend'];
    const hp0 = f.foeHp;
    stepTs(s, { ...idle, play: 0 }, rng); // bash: 8 + vuln
    stepTs(s, { ...idle, play: 0 }, rng); // strike under vuln: 9
    expect(hp0 - f.foeHp).toBe(8 + 9);
  });

  it('deck cycles: discard reshuffles into the draw pile', () => {
    const rng = new Rng(2);
    const s = initialTs();
    stepTs(s, { ...idle, proceed: true }, rng);
    for (let turn = 0; turn < 4 && s.fight; turn++) stepTs(s, { ...idle, endTurn: true }, rng);
    if (s.fight) expect(s.fight.hand.length).toBe(P_TUNE.draw);
    expect(STARTER_DECK.length).toBe(10);
  });
});

describe('game wiring', () => {
  it('proceed starts the first fight via input actions', () => {
    const world = createWorld(thornspireGame, 1);
    world.step(['proceed']);
    expect(tsState(world).fight).not.toBeNull();
  });
});

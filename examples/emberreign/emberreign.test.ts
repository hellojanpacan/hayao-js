import { describe, expect, it } from 'vitest';
import { Rng, createWorld } from '@hayao';
import { choose, eligible, initialEr, DECK, METERS } from './logic';
import { emberreignGame, erState } from './game';

describe('deck', () => {
  it('has unique ids and both choices on every card', () => {
    const ids = new Set(DECK.map((c) => c.id));
    expect(ids.size).toBe(DECK.length);
    for (const c of DECK) {
      expect(c.left.label.length).toBeGreaterThan(0);
      expect(c.right.label.length).toBeGreaterThan(0);
    }
  });

  it('arc cards stay hidden until their flag is set', () => {
    const s = initialEr();
    expect(eligible(s).some((c) => c.id === 'plot-close')).toBe(false);
    s.flags.push('plot-known');
    expect(eligible(s).some((c) => c.id === 'plot-close')).toBe(true);
  });
});

describe('choices', () => {
  it('applies effects, clamps meters, advances the season', () => {
    const rng = new Rng(1);
    const s = initialEr();
    s.cardId = 'taxes';
    choose(s, 'left', rng);
    expect(s.meters.coffers).toBe(64);
    expect(s.meters.folk).toBe(40);
    expect(s.season).toBe(1);
    expect(s.cardId).not.toBeNull();
  });

  it('a meter at the ditch ends the reign with its own doom', () => {
    const rng = new Rng(1);
    const s = initialEr();
    s.meters.folk = 6;
    s.cardId = 'plague';
    choose(s, 'right', rng); // folk -12 → 0
    expect(s.dead).toBe(true);
    expect(s.ending).toBe('folk-0');
  });

  it('flags set and clear through the arc', () => {
    const rng = new Rng(1);
    const s = initialEr();
    s.cardId = 'whisper';
    choose(s, 'left', rng);
    expect(s.flags).toContain('plot-known');
    expect(s.used).toContain('whisper');
  });
});

describe('game wiring', () => {
  it('left/right flow through input actions', () => {
    const world = createWorld(emberreignGame, 2);
    const before = { ...erState(world).meters };
    world.step(['left']);
    const after = erState(world).meters;
    expect(METERS.some((m) => after[m] !== before[m])).toBe(true);
    expect(erState(world).season).toBe(1);
  });
});

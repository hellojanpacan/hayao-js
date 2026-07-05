import { describe, it, expect } from 'vitest';
import { knob, resolveTuning, type TuningSpec } from './tuning';
import { createWorld, defineGame } from './game';
import { Node } from '../scene/node';
import { Sprite } from '../scene/nodes';
import type { World } from '../world';

const SPEC: TuningSpec = {
  knobs: [
    knob.num('jumpVelocity', { default: 640, min: 200, max: 1200, step: 10, group: 'jump' }),
    knob.num('gravity', { default: 2100, min: 500, max: 4000 }),
    knob.color('skyColor', { default: '#dcecf4' }),
    knob.enumOf('mode', { default: 'calm', options: ['calm', 'storm'] }),
  ],
};

describe('resolveTuning', () => {
  it('returns declared defaults with no overrides', () => {
    expect(resolveTuning(SPEC)).toEqual({ jumpVelocity: 640, gravity: 2100, skyColor: '#dcecf4', mode: 'calm' });
  });

  it('returns {} for an undeclared spec', () => {
    expect(resolveTuning(undefined, { jumpVelocity: 999 })).toEqual({});
  });

  it('applies overrides only for declared keys', () => {
    const v = resolveTuning(SPEC, { gravity: 3000, smuggled: 1 });
    expect(v.gravity).toBe(3000);
    expect('smuggled' in v).toBe(false);
  });

  it('clamps numbers to [min, max] and drops non-finite values', () => {
    expect(resolveTuning(SPEC, { jumpVelocity: 9999 }).jumpVelocity).toBe(1200);
    expect(resolveTuning(SPEC, { jumpVelocity: 1 }).jumpVelocity).toBe(200);
    expect(resolveTuning(SPEC, { jumpVelocity: NaN }).jumpVelocity).toBe(640);
  });

  it('validates enum values against options', () => {
    expect(resolveTuning(SPEC, { mode: 'storm' }).mode).toBe('storm');
    expect(resolveTuning(SPEC, { mode: 'hurricane' }).mode).toBe('calm');
  });
});

// A minimal game whose sim consumes a knob, for hash/snapshot coverage.
class FallingBody extends Sprite {
  protected override onProcess(dt: number): void {
    const w = this.world as World;
    w.state.vy = (w.state.vy as number) + w.tune<number>('gravity') * dt;
    w.state.y = (w.state.y as number) + (w.state.vy as number) * dt;
    this.pos = { x: 0, y: w.state.y as number };
  }
}

const tunedGame = defineGame({
  title: 'Tuned',
  tuning: SPEC,
  build: (world: World) => {
    const root = new Node({ name: 'root' });
    root.addChild(new FallingBody({ name: 'body', shape: { kind: 'circle', radius: 8 }, fill: '#000' }));
    world.state.vy = 0;
    world.state.y = 0;
    return root;
  },
});

describe('world.tune', () => {
  it('reads declared defaults', () => {
    const w = createWorld(tunedGame);
    expect(w.tune('jumpVelocity')).toBe(640);
    expect(w.tune<string>('mode')).toBe('calm');
  });

  it('throws on an undeclared key', () => {
    const w = createWorld(tunedGame);
    expect(() => w.tune('typoKnob')).toThrow(/no such knob/);
  });

  it('legacy numeric seed override still works', () => {
    const w = createWorld(tunedGame, 42);
    expect(w.tune('gravity')).toBe(2100);
  });
});

describe('tuning determinism', () => {
  const run = (tuning?: Record<string, number | string>) => {
    const w = createWorld(tunedGame, { tuning });
    for (let i = 0; i < 30; i++) w.step([]);
    return w;
  };

  it('an override changes the hash; an override equal to the default does not', () => {
    const base = run().hash();
    expect(run({ gravity: 3000 }).hash()).not.toBe(base);
    expect(run({ gravity: 2100 }).hash()).toBe(base);
  });

  it('same tuning replays to the same hash', () => {
    expect(run({ gravity: 2600 }).hash()).toBe(run({ gravity: 2600 }).hash());
  });

  it('snapshot/restore round-trips tuning values', () => {
    const w = run({ gravity: 2600 });
    const snap = w.snapshot();
    const w2 = createWorld(tunedGame);
    w2.restore(snap);
    expect(w2.tune('gravity')).toBe(2600);
    expect(w2.hash()).toBe(w.hash());
  });

  it('rebuild-with-carryover: knob change mid-play preserves state and applies the new value', () => {
    const w = run({ gravity: 2600 });
    const yBefore = w.state.y as number;
    const snap = w.snapshot();
    snap.tuning!.gravity = 3000; // the Studio knob-change flow
    const w2 = createWorld(tunedGame, { tuning: { gravity: 3000 } });
    w2.restore(snap);
    expect(w2.state.y).toBe(yBefore); // carried over, not restarted
    expect(w2.tune('gravity')).toBe(3000);
    w2.step([]);
    expect(w2.frame).toBe(31); // clock carried over too
  });
});

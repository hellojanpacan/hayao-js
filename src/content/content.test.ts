import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { World } from '../world';
import {
  availableUpgrades,
  initDirector,
  pollDirector,
  type DirectorState,
  type UpgradeDef,
  type WaveDef,
} from './dsl';

// ── SpawnDirector ───────────────────────────────────────────────
describe('SpawnDirector', () => {
  const waves: WaveDef[] = [
    { time: 0, spawn: 'bat', count: 2 }, // one-shot at t=0
    { time: 1, spawn: 'rat', every: 1, end: 4 }, // t=1,2,3
    { time: 10, spawn: 'boss' }, // late one-shot
  ];

  it('fires one-shots and repeats on schedule, nothing early', () => {
    const st = initDirector(waves);
    expect(pollDirector(waves, st, 0)).toEqual([{ spawn: 'bat', count: 2, wave: 0 }]);
    expect(pollDirector(waves, st, 0.5)).toEqual([]); // bat already fired
    expect(pollDirector(waves, st, 1)).toEqual([{ spawn: 'rat', count: 1, wave: 1 }]);
    expect(pollDirector(waves, st, 2)).toEqual([{ spawn: 'rat', count: 1, wave: 1 }]);
    expect(pollDirector(waves, st, 3)).toEqual([{ spawn: 'rat', count: 1, wave: 1 }]);
    expect(pollDirector(waves, st, 5)).toEqual([]); // repeat ended at t<4
    expect(pollDirector(waves, st, 10)).toEqual([{ spawn: 'boss', count: 1, wave: 2 }]);
  });

  it('catches up multiple repeats straddled by one poll (post-restore safe)', () => {
    const st = initDirector(waves);
    // Jump straight to t=3.5: rat should fire for t=1,2,3 all at once, plus bat.
    const events = pollDirector(waves, st, 3.5);
    expect(events).toEqual([
      { spawn: 'bat', count: 2, wave: 0 },
      { spawn: 'rat', count: 1, wave: 1 },
      { spawn: 'rat', count: 1, wave: 1 },
      { spawn: 'rat', count: 1, wave: 1 },
    ]);
  });

  it('rolls a weighted spawn set via world.rng, deterministically', () => {
    const wtWaves: WaveDef[] = [
      { time: 0, spawn: [{ value: 'a', weight: 1 }, { value: 'b', weight: 3 }], every: 1, end: 6 },
    ];
    const run = () => {
      const rng = new Rng(42);
      const st = initDirector(wtWaves);
      const out: string[] = [];
      for (let t = 0; t < 6; t++) for (const e of pollDirector(wtWaves, st, t, rng)) out.push(e.spawn);
      return out;
    };
    expect(run()).toEqual(run()); // same seed → same rolls
    expect(run().every((s) => s === 'a' || s === 'b')).toBe(true);
  });

  it('throws if a weighted wave is polled without an rng', () => {
    const wtWaves: WaveDef[] = [{ time: 0, spawn: [{ value: 'a', weight: 1 }] }];
    const st = initDirector(wtWaves);
    expect(() => pollDirector(wtWaves, st, 0)).toThrow();
  });

  it('director state survives a world snapshot/restore round-trip', () => {
    const world = new World({ seed: 1 });
    const st = initDirector(waves);
    world.state = { director: st as unknown as Record<string, unknown> };
    pollDirector(waves, (world.state as { director: DirectorState }).director, 0);
    const hashBefore = world.hash();
    const snap = world.snapshot();
    world.restore(snap);
    expect(world.hash()).toBe(hashBefore);
    // Continuing from the restored cursor does not re-fire the t=0 bat.
    const after = pollDirector(waves, (world.state as { director: DirectorState }).director, 0.5);
    expect(after).toEqual([]);
  });
});

// ── Upgrade / evolution trees ───────────────────────────────────
describe('availableUpgrades', () => {
  const defs: UpgradeDef[] = [
    { id: 'whip' },
    { id: 'bible' },
    { id: 'holy-wand', requires: ['whip', 'bible'] }, // evolution
    { id: 'shield', maxStacks: 3 }, // repeatable
  ];

  it('gates evolutions behind owned prerequisites', () => {
    expect(availableUpgrades(defs, []).map((d) => d.id)).toEqual(['whip', 'bible', 'shield']);
    expect(availableUpgrades(defs, ['whip']).map((d) => d.id)).toEqual(['bible', 'shield']);
    expect(availableUpgrades(defs, ['whip', 'bible']).map((d) => d.id)).toEqual(['holy-wand', 'shield']);
  });

  it('respects maxStacks for repeatable upgrades', () => {
    expect(availableUpgrades(defs, ['shield', 'shield']).map((d) => d.id)).toContain('shield');
    expect(availableUpgrades(defs, ['shield', 'shield', 'shield']).map((d) => d.id)).not.toContain('shield');
  });

  it('offers a non-repeatable upgrade only until owned once', () => {
    expect(availableUpgrades(defs, ['whip']).map((d) => d.id)).not.toContain('whip');
  });
});

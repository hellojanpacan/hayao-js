import { describe, expect, it } from 'vitest';
import { Rng, createWorld } from '@hayao';
import { computeFov, genFloor, idx, initialHd, stepHd, M_TUNE } from './logic';
import { hdState, hollowdeepGame } from './game';

describe('procgen', () => {
  it('carves rooms, entry and stairs on open floor', () => {
    const f = genFloor(new Rng(3), 0);
    expect(f.rooms.length).toBeGreaterThanOrEqual(5);
    expect(f.cells[idx(f.entry.x, f.entry.y)]).toBe(0);
    expect(f.cells[idx(f.stairs.x, f.stairs.y)]).toBe(0);
    expect(f.monsters.length).toBeGreaterThan(0);
  });
});

describe('turn sim', () => {
  it('FOV: walls occlude; explored persists after leaving', () => {
    const rng = new Rng(5);
    const s = initialHd(rng);
    computeFov(s);
    const visCount = s.visible.filter(Boolean).length;
    expect(visCount).toBeGreaterThan(4);
    // Somewhere outside FOV radius must be dark.
    expect(s.visible.every(Boolean)).toBe(false);
    const exploredBefore = s.explored[0].filter(Boolean).length;
    stepHd(s, 'wait', rng);
    expect(s.explored[0].filter(Boolean).length).toBeGreaterThanOrEqual(exploredBefore);
  });

  it('bump combat kills a rat in ceil(hp/atk) turns and takes a turn each swing', () => {
    const rng = new Rng(5);
    const s = initialHd(rng);
    const f = s.floors[0];
    f.monsters = [{ kind: 'rat', x: s.x + 1, y: s.y, hp: M_TUNE.rat.hp, phase: 0 }];
    const swings = Math.ceil(M_TUNE.rat.hp / s.atk);
    for (let i = 0; i < swings; i++) stepHd(s, 'right', rng);
    expect(f.monsters.length).toBe(0);
    expect(s.kills).toBe(1);
  });

  it('quaffing heals and consumes a potion', () => {
    const rng = new Rng(5);
    const s = initialHd(rng);
    s.hp = 5;
    const p0 = s.potions;
    stepHd(s, 'quaff', rng);
    expect(s.hp).toBeGreaterThan(5);
    expect(s.potions).toBe(p0 - 1);
  });
});

describe('game wiring', () => {
  it('one input edge = one turn; holding a key does not repeat', () => {
    const world = createWorld(hollowdeepGame, 1);
    const t0 = hdState(world).turns;
    world.step(['wait']);
    world.step(['wait']); // held — no new edge
    world.step([]);
    world.step(['wait']);
    expect(hdState(world).turns).toBe(t0 + 2);
  });
});

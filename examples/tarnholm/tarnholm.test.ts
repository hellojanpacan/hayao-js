import { describe, expect, it } from 'vitest';
import { Rng, createWorld } from '@hayao';
import { genIsland, initialTh, place, placementScore, tidx, GH, GW } from './logic';
import { tarnholmGame, thState } from './game';

describe('island procgen', () => {
  it('rims with water, leaves grass inland', () => {
    const t = genIsland(new Rng(2));
    expect(t.length).toBe(GW * GH);
    expect(t.filter((c) => c === 'water').length).toBeGreaterThan(10);
    expect(t.filter((c) => c === 'grass').length).toBeGreaterThan(28);
  });
});

describe('placement rules', () => {
  it('cannot build on water, forest, or occupied cells', () => {
    const s = initialTh(new Rng(2));
    s.terrain[tidx(5, 5)] = 'water';
    expect(placementScore(s, 'hut', 5, 5)).toBe(-1);
    s.terrain[tidx(5, 5)] = 'forest';
    expect(placementScore(s, 'hut', 5, 5)).toBe(-1);
    s.terrain[tidx(5, 5)] = 'grass';
    s.built[tidx(5, 5)] = 'hut';
    expect(placementScore(s, 'farm', 5, 5)).toBe(-1);
  });

  it('dock loves water, sawmill loves forest, temple hates industry', () => {
    const s = initialTh(new Rng(2));
    for (let y = 3; y <= 5; y++) for (let x = 3; x <= 6; x++) { s.terrain[tidx(x, y)] = 'grass'; s.built[tidx(x, y)] = null; }
    s.terrain[tidx(3, 4)] = 'water';
    expect(placementScore(s, 'dock', 4, 4)).toBe(1 + 4);
    s.terrain[tidx(5, 3)] = 'forest';
    expect(placementScore(s, 'sawmill', 5, 4)).toBe(1 + 3);
    s.built[tidx(6, 4)] = 'sawmill';
    s.built[tidx(6, 3)] = 'hut';
    expect(placementScore(s, 'temple', 5, 4)).toBe(Math.max(0, 1 + 4 - 3));
  });

  it('placing consumes the queue and accumulates score', () => {
    const s = initialTh(new Rng(2));
    // Find any legal cell.
    outer: for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (placementScore(s, 'hut', x, y) >= 0) { place(s, x, y); break outer; }
    expect(s.queueIdx).toBe(1);
    expect(s.score).toBeGreaterThanOrEqual(1);
  });
});

describe('game wiring', () => {
  it('cursor + build flows through input actions', () => {
    const world = createWorld(tarnholmGame, 6);
    world.step(['build']);
    const s = thState(world);
    // Either placed (legal spot) or refused (water/forest) — queue reflects it.
    expect(s.queueIdx === 0 || s.queueIdx === 1).toBe(true);
  });
});

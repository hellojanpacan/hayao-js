import { describe, expect, it } from 'vitest';
import { SpatialHash } from './spatialHash';
import { Particles, PARTICLE_PRESETS, Shaker } from '../scene/particles';

describe('SpatialHash', () => {
  it('finds overlapping items and only those', () => {
    const h = new SpatialHash<string>(64);
    h.insert('a', { x: 10, y: 10, w: 20, h: 20 });
    h.insert('b', { x: 500, y: 500, w: 20, h: 20 });
    h.insert('c', { x: 25, y: 25, w: 20, h: 20 });
    expect(h.query({ x: 0, y: 0, w: 40, h: 40 })).toEqual(['a', 'c']);
    expect(h.query({ x: 490, y: 490, w: 20, h: 20 })).toEqual(['b']);
    expect(h.query({ x: 490, y: 490, w: 10, h: 10 })).toEqual([]); // edge-touch ≠ overlap
    expect(h.query({ x: 200, y: 200, w: 10, h: 10 })).toEqual([]);
  });

  it('deduplicates items spanning cells; queryCircle respects radius', () => {
    const h = new SpatialHash<string>(32);
    h.insert('big', { x: 0, y: 0, w: 200, h: 200 });
    expect(h.query({ x: 0, y: 0, w: 200, h: 200 })).toEqual(['big']);
    h.insert('far', { x: 300, y: 0, w: 10, h: 10 });
    expect(h.queryCircle(250, 5, 20)).toEqual([]);
    expect(h.queryCircle(295, 5, 20)).toEqual(['far']);
  });

  it('is deterministic: same inserts → same query order', () => {
    const build = () => {
      const h = new SpatialHash<number>(50);
      for (let i = 0; i < 100; i++) h.insert(i, { x: (i * 37) % 400, y: (i * 61) % 400, w: 30, h: 30 });
      return h.query({ x: 0, y: 0, w: 400, h: 400 });
    };
    expect(build()).toEqual(build());
  });

  it('handles 5k entities with fast rebuild+queries', () => {
    const h = new SpatialHash<number>(64);
    const t0 = performance.now();
    for (let step = 0; step < 10; step++) {
      h.clear();
      for (let i = 0; i < 5000; i++) h.insert(i, { x: (i * 97 + step * 13) % 2000, y: (i * 71) % 2000, w: 16, h: 16 });
      for (let q = 0; q < 500; q++) h.query({ x: (q * 41) % 2000, y: (q * 89) % 2000, w: 64, h: 64 });
    }
    const ms = performance.now() - t0;
    // 10 sim steps of 5k inserts + 500 queries each; generous CI budget.
    expect(ms).toBeLessThan(500);
  });
});

describe('juice kit', () => {
  it('particles live, move, and die; never enter serialization', () => {
    const p = new Particles({ seed: 42 });
    p.burst(20, { x: 0, y: 0 }, PARTICLE_PRESETS.burst());
    expect(p.liveCount).toBe(20);
    for (let i = 0; i < 120; i++) p['onProcess'](1 / 60);
    expect(p.liveCount).toBe(0);
    expect(p.cosmetic).toBe(true);
  });

  it('shaker decays to rest', () => {
    const s = new Shaker({ seed: 1 });
    s.addTrauma(1);
    s['onProcess'](1 / 60);
    expect(Math.abs(s.pos.x) + Math.abs(s.pos.y)).toBeGreaterThan(0);
    for (let i = 0; i < 90; i++) s['onProcess'](1 / 60);
    expect(s.pos.x).toBe(0);
    expect(s.pos.y).toBe(0);
  });
});

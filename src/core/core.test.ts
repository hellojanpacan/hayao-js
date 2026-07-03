import { describe, it, expect } from 'vitest';
import { Rng, hashString } from './rng';
import { hashValue } from './hash';
import { Clock } from './clock';
import { composeTransform, invertTransform, makeTransform, applyTransform, IDENTITY } from './math';

describe('Rng', () => {
  it('is deterministic for a given seed', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    const seqA = Array.from({ length: 20 }, () => a.float());
    const seqB = Array.from({ length: 20 }, () => b.float());
    expect(seqA).toEqual(seqB);
  });

  it('produces different streams for different seeds', () => {
    expect(new Rng(1).float()).not.toEqual(new Rng(2).float());
  });

  it('floats stay in [0,1)', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.float();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int(n) is roughly uniform', () => {
    const r = new Rng(99);
    const counts = new Array(6).fill(0);
    for (let i = 0; i < 60000; i++) counts[r.int(6)]++;
    for (const c of counts) expect(c).toBeGreaterThan(9000);
  });

  it('split yields reproducible independent streams', () => {
    const parent1 = new Rng(5);
    const parent2 = new Rng(5);
    const c1 = parent1.split(3).float();
    const c2 = parent2.split(3).float();
    expect(c1).toEqual(c2);
  });

  it('getState/setState round-trips', () => {
    const r = new Rng(42);
    for (let i = 0; i < 5; i++) r.float();
    const s = r.getState();
    const next = r.float();
    r.setState(s);
    expect(r.float()).toEqual(next);
  });

  it('hashString is stable and order-sensitive', () => {
    expect(hashString('hello')).toEqual(hashString('hello'));
    expect(hashString('ab')).not.toEqual(hashString('ba'));
  });
});

describe('hashValue', () => {
  it('is independent of object key order', () => {
    expect(hashValue({ a: 1, b: 2 })).toEqual(hashValue({ b: 2, a: 1 }));
  });
  it('distinguishes different values and array order', () => {
    expect(hashValue([1, 2, 3])).not.toEqual(hashValue([3, 2, 1]));
    expect(hashValue({ x: 0 })).not.toEqual(hashValue({ x: 1 }));
  });
  it('collapses -0 and 0', () => {
    expect(hashValue(-0)).toEqual(hashValue(0));
  });
  it('treats an undefined-valued key as absent (JSON-stable, survives save round-trip)', () => {
    expect(hashValue({ a: 1, b: undefined })).toEqual(hashValue({ a: 1 }));
    expect(hashValue({ paint: { fill: undefined } })).toEqual(hashValue({ paint: {} }));
  });
});

describe('Clock', () => {
  it('accumulates real ms into whole fixed steps', () => {
    const c = new Clock({ hz: 60 });
    expect(c.advance(16)).toBe(0); // < 16.67
    expect(c.advance(16)).toBe(1); // 32 total → 1 step, remainder carried
    expect(c.advance(100)).toBe(6);
  });
  it('clamps a huge frame to avoid a spiral of death', () => {
    const c = new Clock({ hz: 60, maxFrameMs: 250 });
    expect(c.advance(100000)).toBeLessThanOrEqual(16);
  });
});

describe('Transforms', () => {
  it('compose then invert returns identity mapping', () => {
    const t = makeTransform({ x: 10, y: -5 }, 0.7, { x: 2, y: 3 });
    const back = composeTransform(invertTransform(t), t);
    const p = { x: 4, y: 9 };
    const mapped = applyTransform(back, p);
    expect(mapped.x).toBeCloseTo(p.x, 6);
    expect(mapped.y).toBeCloseTo(p.y, 6);
  });
  it('identity leaves points unchanged', () => {
    expect(applyTransform(IDENTITY, { x: 3, y: 7 })).toEqual({ x: 3, y: 7 });
  });
});

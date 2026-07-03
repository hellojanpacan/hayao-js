import { describe, expect, it } from 'vitest';
import { dsin, dcos, datan, datan2, dexp2, dhypot, dlog, dlog10, dlog2 } from './dmath';
import { Rng } from './rng';

// Deterministic sample points via the seeded Rng — no Math.random in tests.
function samples(count: number, lo: number, hi: number): number[] {
  const rng = new Rng(42);
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(rng.range(lo, hi));
  return out;
}

describe('dmath: deterministic transcendentals', () => {
  it('dsin/dcos match Math within 1e-12 across game-scale angles', () => {
    for (const x of [...samples(500, -1000, 1000), 0, 1, -1, Math.PI, -Math.PI, Math.PI / 2, 12345.678]) {
      expect(Math.abs(dsin(x) - Math.sin(x))).toBeLessThan(1e-12);
      expect(Math.abs(dcos(x) - Math.cos(x))).toBeLessThan(1e-12);
    }
  });

  it('dsin/dcos hold the Pythagorean identity', () => {
    for (const x of samples(200, -50, 50)) {
      const s = dsin(x);
      const c = dcos(x);
      expect(Math.abs(s * s + c * c - 1)).toBeLessThan(1e-14);
    }
  });

  it('dsin is odd, dcos is even (bit-exact)', () => {
    for (const x of samples(100, 0, 100)) {
      expect(dsin(-x)).toBe(-dsin(x));
      expect(dcos(-x)).toBe(dcos(x));
    }
  });

  it('datan matches Math.atan within 1e-14', () => {
    for (const x of [...samples(300, -100, 100), 0, 0.4375, 0.6875, 1.1875, 2.4375, 1e-10, 1e20, -1e20]) {
      expect(Math.abs(datan(x) - Math.atan(x))).toBeLessThan(1e-14);
    }
  });

  it('datan2 matches Math.atan2 in all quadrants', () => {
    const vals = [...samples(60, -10, 10), 0, 1, -1, 0.5, -3];
    for (const y of vals) {
      for (const x of vals) {
        expect(Math.abs(datan2(y, x) - Math.atan2(y, x))).toBeLessThan(1e-13);
      }
    }
  });

  it('dexp2 matches 2^x within 1e-13 relative and is exact on integers', () => {
    expect(dexp2(0)).toBe(1);
    expect(dexp2(10)).toBe(1024);
    expect(dexp2(-3)).toBe(0.125);
    for (const x of samples(200, -30, 30)) {
      const exact = Math.pow(2, x);
      expect(Math.abs(dexp2(x) - exact) / exact).toBeLessThan(1e-13);
    }
  });

  it('dhypot matches sqrt of the sum of squares', () => {
    expect(dhypot(3, 4)).toBe(5);
    for (const x of samples(100, -1000, 1000)) {
      expect(dhypot(x, 2 * x)).toBe(Math.sqrt(x * x + 4 * x * x));
    }
  });

  it('dlog/dlog10/dlog2 match Math within 1e-14 relative', () => {
    for (const x of [...samples(300, 1e-6, 1e6), 1, 2, 10, Math.E, 0.5, 1e-300, 1e300, 5e-324]) {
      const tol = Math.max(Math.abs(Math.log(x)), 1) * 1e-14;
      expect(Math.abs(dlog(x) - Math.log(x))).toBeLessThan(tol);
      expect(Math.abs(dlog10(x) - Math.log10(x))).toBeLessThan(tol);
      expect(Math.abs(dlog2(x) - Math.log2(x))).toBeLessThan(tol * 2);
    }
    expect(dlog(0)).toBe(-Infinity);
    expect(dlog(-1)).toBeNaN();
    expect(dlog(1)).toBe(0);
  });

  it('handles non-finite input without lying', () => {
    expect(dsin(NaN)).toBeNaN();
    expect(dcos(Infinity)).toBeNaN();
    expect(datan(Infinity)).toBeCloseTo(Math.PI / 2, 15);
    expect(dexp2(2000)).toBe(Infinity);
    expect(dexp2(-2000)).toBe(0);
  });
});

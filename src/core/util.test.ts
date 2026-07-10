// The small parity utilities: wrap / distanceWrap / angleDelta / lerpAngle /
// oscillate / formatTime. All deterministic — safe inside the sim.

import { describe, expect, it } from 'vitest';
import { TAU, angleDelta, distanceWrap, formatTime, lerpAngle, oscillate, wrap } from './math';

describe('wrap', () => {
  it('wraps into [lo, hi)', () => {
    expect(wrap(5, 0, 4)).toBe(1);
    expect(wrap(-1, 0, 4)).toBe(3);
    expect(wrap(4, 0, 4)).toBe(0);
    expect(wrap(2, 0, 4)).toBe(2);
  });
  it('handles a shifted range', () => {
    expect(wrap(11, 10, 14)).toBe(11);
    expect(wrap(9, 10, 14)).toBe(13);
  });
  it('degenerate range collapses to lo', () => {
    expect(wrap(7, 3, 3)).toBe(3);
  });
});

describe('distanceWrap', () => {
  it('takes the short way around', () => {
    // On a 100-wide torus, 95 → 5 is +10, not -90.
    expect(distanceWrap(95, 5, 100)).toBe(10);
    expect(distanceWrap(5, 95, 100)).toBe(-10);
    expect(distanceWrap(10, 30, 100)).toBe(20);
  });
  it('exact half wraps to the negative end of the range', () => {
    expect(distanceWrap(0, 50, 100)).toBe(-50);
  });
});

describe('angleDelta / lerpAngle', () => {
  it('takes the short arc across the seam', () => {
    const a = 0.9 * TAU;
    const b = 0.1 * TAU;
    expect(angleDelta(a, b)).toBeCloseTo(0.2 * TAU, 12);
    expect(angleDelta(b, a)).toBeCloseTo(-0.2 * TAU, 12);
  });
  it('lerpAngle never spins the long way', () => {
    const a = 0.95 * TAU;
    const b = 0.05 * TAU;
    const mid = lerpAngle(a, b, 0.5);
    // Midpoint sits on the seam (0 mod τ), not at half a turn away.
    expect(wrap(mid, 0, TAU)).toBeCloseTo(0, 6);
    expect(lerpAngle(1, 1, 0.5)).toBeCloseTo(1, 12);
  });
});

describe('oscillate', () => {
  it('sine and triangle cross zero rising at t=0; square starts high, saw low', () => {
    expect(Math.abs(oscillate(0, 1, 'sine'))).toBeLessThanOrEqual(1e-9);
    expect(Math.abs(oscillate(0, 1, 'triangle'))).toBeLessThanOrEqual(1e-9);
    expect(oscillate(0, 1, 'square')).toBe(1);
    expect(oscillate(0, 1, 'saw')).toBe(-1);
    for (const wave of ['sine', 'triangle', 'square'] as const) {
      expect(oscillate(0.1, 1, wave)).toBeGreaterThan(0);
    }
    expect(oscillate(0.25)).toBeCloseTo(1, 9); // sine peak
    expect(oscillate(0.25, 1, 'triangle')).toBeCloseTo(1, 12);
    expect(oscillate(0.25, 1, 'square')).toBe(1);
    expect(oscillate(0.75, 1, 'square')).toBe(-1);
  });
  it('stays in [-1, 1] and repeats with the period', () => {
    for (const wave of ['sine', 'triangle', 'square', 'saw'] as const) {
      for (let i = 0; i < 40; i++) {
        const v = oscillate(i * 0.173, 2.5, wave);
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(oscillate(0.3, 2, wave)).toBeCloseTo(oscillate(0.8, 2, wave), 9);
    }
  });
  it('frequency scales the period', () => {
    expect(oscillate(0.125, 2)).toBeCloseTo(1, 9); // 2 Hz peaks at t=1/8
  });
});

describe('formatTime', () => {
  it('formats minutes:seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(727)).toBe('12:07');
    expect(formatTime(59.9)).toBe('0:59'); // floors, never rounds up to 0:60
  });
  it('adds hours past 3600s', () => {
    expect(formatTime(3753)).toBe('1:02:33');
  });
  it('clamps garbage to 0:00', () => {
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(Number.NaN)).toBe('0:00');
  });
});

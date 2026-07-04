import { describe, expect, it } from 'vitest';
import { rampIssues, rampStats, assertRamp } from './ramp';

describe('rampIssues', () => {
  it('passes a well-shaped rising curve', () => {
    expect(rampIssues([2, 3, 4, 5, 6, 8])).toEqual([]);
  });

  it('allows small breather dips as long as progress dominates', () => {
    expect(rampIssues([2, 3, 3, 4, 3, 5, 6, 7])).toEqual([]);
  });

  it('flags a flat line (no variety)', () => {
    const issues = rampIssues([5, 5, 5, 5, 5]);
    expect(issues.join(' ')).toMatch(/distinct|flat/i);
  });

  it('flags a difficulty cliff', () => {
    const issues = rampIssues([1, 2, 3, 20, 21]);
    expect(issues.join(' ')).toMatch(/cliff/i);
  });

  it('flags a curve that descends overall', () => {
    const issues = rampIssues([9, 7, 5, 3, 1]);
    expect(issues.join(' ')).toMatch(/descend|easier/i);
  });

  it('flags a buried finale (peak in the middle)', () => {
    const issues = rampIssues([2, 4, 10, 5, 4]);
    expect(issues.join(' ')).toMatch(/finale|peak|anticlimax/i);
  });

  it('needs at least two levels', () => {
    expect(rampIssues([5]).join(' ')).toMatch(/at least 2/);
  });
});

describe('rampStats', () => {
  it('summarizes the curve', () => {
    const s = rampStats([2, 4, 3, 6]);
    expect(s.count).toBe(4);
    expect(s.min).toBe(2);
    expect(s.max).toBe(6);
    expect(s.distinct).toBe(4);
    expect(s.maxJump).toBe(3); // 3→6
    // steps: +2,-1,+3 → 2 of 3 forward
    expect(s.forwardFraction).toBeCloseTo(2 / 3, 5);
  });
});

describe('assertRamp', () => {
  it('throws on an ill-shaped ramp', () => {
    expect(() => assertRamp([5, 5, 5, 5])).toThrow(/ill-shaped/);
  });
  it('is silent on a good ramp', () => {
    expect(() => assertRamp([2, 3, 4, 5, 7])).not.toThrow();
  });
});

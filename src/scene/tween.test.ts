import { describe, it, expect } from 'vitest';
import { lerpDamp, spring, springStep, makeReach } from '@hayao';

describe('lerpDamp — framerate-independent exponential smoothing', () => {
  it('converges toward the target', () => {
    let x = 0;
    for (let i = 0; i < 200; i++) x = lerpDamp(x, 100, 8, 1 / 60);
    expect(x).toBeGreaterThan(99.9);
    expect(x).toBeLessThanOrEqual(100);
  });

  it('reaches the same place whether dt is one big step or many small ones', () => {
    const lambda = 6;
    const total = 0.5;
    // One coarse step.
    const coarse = lerpDamp(0, 100, lambda, total);
    // Many fine steps summing to the same real time.
    let fine = 0;
    const n = 30;
    for (let i = 0; i < n; i++) fine = lerpDamp(fine, 100, lambda, total / n);
    expect(fine).toBeCloseTo(coarse, 2);
  });

  it('is bit-deterministic across identical runs', () => {
    const run = () => {
      let x = 3;
      const out: number[] = [];
      for (let i = 0; i < 50; i++) {
        x = lerpDamp(x, -7, 5, 1 / 60);
        out.push(x);
      }
      return out;
    };
    expect(run()).toEqual(run());
  });
});

describe('spring — critically damped follow', () => {
  it('approaches the target with no overshoot', () => {
    const s = spring(0);
    let maxSeen = 0;
    for (let i = 0; i < 400; i++) {
      springStep(s, 100, 20, 1 / 60);
      maxSeen = Math.max(maxSeen, s.value);
    }
    expect(s.value).toBeCloseTo(100, 1);
    // Critical damping ⇒ it never passes the target.
    expect(maxSeen).toBeLessThanOrEqual(100.0001);
  });

  it('makeReach settles roughly within its settle time', () => {
    const reach = makeReach(0, 0.25);
    let v = 0;
    // ~0.25s of 60Hz steps ≈ 15 frames.
    for (let i = 0; i < 15; i++) v = reach(100, 1 / 60);
    expect(v).toBeGreaterThan(90); // most of the way there
    for (let i = 0; i < 60; i++) v = reach(100, 1 / 60);
    expect(v).toBeCloseTo(100, 1);
  });

  it('is deterministic for the same target/dt sequence', () => {
    const run = () => {
      const s = spring(5);
      const out: number[] = [];
      for (let i = 0; i < 40; i++) out.push(springStep(s, 50, 12, 1 / 60).value);
      return out;
    };
    expect(run()).toEqual(run());
  });
});

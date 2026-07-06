import { describe, it, expect } from 'vitest';
import { Blend1D, Blend2D, blendIssues, mixPose, samplePose, type Pose } from './blend';
import type { ClipDef } from './clip';

// Two single-channel clips of DIFFERENT length that both drive the same channel,
// so normalized-phase sync (foot-lock) is observable.
const idle: ClipDef = { duration: 2, loop: 'loop', tracks: [{ target: 'root', channel: 'x', keys: [{ t: 0, v: 0 }, { t: 2, v: 100 }] }] };
const run: ClipDef = { duration: 0.5, loop: 'loop', tracks: [{ target: 'root', channel: 'x', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 400 }] }] };

describe('mixPose', () => {
  it('linearly interpolates matching keys', () => {
    const a: Pose = { 'root/x': 0, 'root/y': 10 };
    const b: Pose = { 'root/x': 100, 'root/y': 10 };
    expect(mixPose(a, b, 0.25)).toEqual({ 'root/x': 25, 'root/y': 10 });
  });
  it('passes through keys present in only one pose', () => {
    const a: Pose = { 'root/x': 0 };
    const b: Pose = { 'root/y': 50 };
    expect(mixPose(a, b, 0.5)).toEqual({ 'root/x': 0, 'root/y': 50 });
  });
  it('reuses the out buffer (clears stale keys)', () => {
    const out: Pose = { stale: 999 };
    mixPose({ a: 1 }, { a: 3 }, 0.5, out);
    expect(out).toEqual({ a: 2 });
    expect('stale' in out).toBe(false);
  });
});

describe('samplePose — normalized phase', () => {
  it('samples at phase*duration so different-length clips stay in step', () => {
    // At phase 0.5 both clips are halfway through their own loop.
    expect(samplePose(idle, 0.5)['root/x']).toBeCloseTo(50, 10);
    expect(samplePose(run, 0.5)['root/x']).toBeCloseTo(200, 10);
  });
});

describe('Blend1D', () => {
  const space = new Blend1D([
    { clip: idle, x: 0 },
    { clip: run, x: 10 },
  ]);
  it('is anchor-exact at sample positions', () => {
    // At param 0 → pure idle; at 10 → pure run. Same phase → foot-lock.
    expect(space.sample(0, 0.5)['root/x']).toBeCloseTo(50, 10);
    expect(space.sample(10, 0.5)['root/x']).toBeCloseTo(200, 10);
  });
  it('mixes neighbors by normalized distance', () => {
    // param 5 = halfway → mean of the two poses at the same phase.
    expect(space.sample(5, 0.5)['root/x']).toBeCloseTo((50 + 200) / 2, 10);
  });
  it('clamps outside the range to the end clips', () => {
    expect(space.sample(-99, 0.25)['root/x']).toBeCloseTo(samplePose(idle, 0.25)['root/x'], 10);
    expect(space.sample(99, 0.25)['root/x']).toBeCloseTo(samplePose(run, 0.25)['root/x'], 10);
  });
  it('weights sum to 1', () => {
    const w = space.weights(3);
    expect(w.reduce((s, e) => s + e.weight, 0)).toBeCloseTo(1, 12);
  });
});

describe('Blend2D', () => {
  const a: ClipDef = { duration: 1, loop: 'loop', tracks: [{ target: 'root', channel: 'x', keys: [{ t: 0, v: 0 }, { t: 1, v: 0 }] }] };
  const b: ClipDef = { duration: 1, loop: 'loop', tracks: [{ target: 'root', channel: 'x', keys: [{ t: 0, v: 100 }, { t: 1, v: 100 }] }] };
  const c: ClipDef = { duration: 1, loop: 'loop', tracks: [{ target: 'root', channel: 'x', keys: [{ t: 0, v: 200 }, { t: 1, v: 200 }] }] };
  const space = new Blend2D([
    { clip: a, x: 0, y: 0 },
    { clip: b, x: 1, y: 0 },
    { clip: c, x: 0, y: 1 },
  ]);
  it('is anchor-exact at each sample vertex', () => {
    expect(space.sample(0, 0, 0)['root/x']).toBeCloseTo(0, 8);
    expect(space.sample(1, 0, 0)['root/x']).toBeCloseTo(100, 8);
    expect(space.sample(0, 1, 0)['root/x']).toBeCloseTo(200, 8);
  });
  it('barycentric blend at the centroid', () => {
    const v = space.sample(1 / 3, 1 / 3, 0)['root/x'];
    expect(v).toBeCloseTo((0 + 100 + 200) / 3, 6);
  });
  it('clamps + renormalizes for a point outside the triangle', () => {
    const w = space.weights(-5, -5);
    expect(w.reduce((s, e) => s + e.weight, 0)).toBeCloseTo(1, 10);
    for (const e of w) expect(e.weight).toBeGreaterThanOrEqual(0);
  });
});

describe('blendIssues', () => {
  it('is clean for a valid space', () => {
    expect(blendIssues([{ clip: idle, x: 0 }, { clip: run, x: 1 }])).toEqual([]);
  });
  it('flags empty spaces, duplicate positions, non-finite coords', () => {
    expect(blendIssues([])).toContain('blend space has no samples');
    const dup = blendIssues([{ clip: idle, x: 0 }, { clip: run, x: 0 }]);
    expect(dup.some((i) => i.includes('duplicates'))).toBe(true);
    const nan = blendIssues([{ clip: idle, x: NaN }]);
    expect(nan.some((i) => i.includes('not finite'))).toBe(true);
  });
});

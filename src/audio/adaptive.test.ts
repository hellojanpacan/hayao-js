import { describe, it, expect } from 'vitest';
import {
  evalCurve,
  distanceGain,
  panFromOffset,
  spatialMix,
  layerGains,
  duckGain,
  type MusicLayer,
} from './adaptive';

describe('RTPC curve', () => {
  const curve = [
    { x: 0, y: 1 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 0 },
  ];
  it('clamps outside the range and interpolates within', () => {
    expect(evalCurve(curve, -1)).toBe(1);
    expect(evalCurve(curve, 2)).toBe(0);
    expect(evalCurve(curve, 0.25)).toBeCloseTo(0.75, 5);
    expect(evalCurve(curve, 0.75)).toBeCloseTo(0.25, 5);
  });
  it('sorts unsorted breakpoints', () => {
    const unsorted = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
    expect(evalCurve(unsorted, 0.5)).toBeCloseTo(0.5, 5);
  });
  it('empty curve → 0', () => {
    expect(evalCurve([], 0.5)).toBe(0);
  });
});

describe('distance attenuation (Web Audio parity)', () => {
  it('is full volume at the reference distance', () => {
    expect(distanceGain('linear', 1, 1, 100, 1)).toBeCloseTo(1, 5);
    expect(distanceGain('inverse', 1, 1, 100, 1)).toBeCloseTo(1, 5);
    expect(distanceGain('exponential', 1, 1, 100, 1)).toBeCloseTo(1, 5);
  });
  it('linear reaches the floor at maxDistance', () => {
    expect(distanceGain('linear', 100, 1, 100, 1)).toBeCloseTo(0, 5);
  });
  it('exponential halves per doubling at rolloff 1', () => {
    expect(distanceGain('exponential', 2, 1, 1000, 1)).toBeCloseTo(0.5, 4);
    expect(distanceGain('exponential', 4, 1, 1000, 1)).toBeCloseTo(0.25, 4);
  });
  it('is monotonically decreasing with distance', () => {
    const a = distanceGain('inverse', 5, 1, 1000, 1);
    const b = distanceGain('inverse', 50, 1, 1000, 1);
    expect(b).toBeLessThan(a);
  });
});

describe('spatial mix', () => {
  it('pan follows horizontal offset sign', () => {
    expect(panFromOffset(-500, 400)).toBe(-1);
    expect(panFromOffset(500, 400)).toBe(1);
    expect(panFromOffset(0)).toBe(0);
  });
  it('goes inaudible beyond hearing range', () => {
    expect(spatialMix(700, 0, 600).audible).toBe(false);
    const near = spatialMix(100, 0, 600);
    expect(near.audible).toBe(true);
    expect(near.gain).toBeGreaterThan(0);
    expect(near.pan).toBeGreaterThan(0); // source to the right
  });
});

describe('vertical layering', () => {
  const layers: MusicLayer[] = [
    { name: 'ambient', fadeIn: 0, full: 0 },
    { name: 'drums', fadeIn: 0.3, full: 0.5 },
    { name: 'brass', fadeIn: 0.7, full: 0.9 },
  ];
  it('thickens texture with intensity', () => {
    const calm = layerGains(layers, 0.1);
    expect(calm.ambient).toBe(1);
    expect(calm.drums).toBe(0);
    expect(calm.brass).toBe(0);
    const combat = layerGains(layers, 1);
    expect(combat.drums).toBe(1);
    expect(combat.brass).toBe(1);
    const mid = layerGains(layers, 0.4);
    expect(mid.drums).toBeCloseTo(0.5, 5); // halfway through its fade
    expect(mid.brass).toBe(0);
  });
});

describe('ducking', () => {
  it('drops the ducked bus when active, unity otherwise', () => {
    expect(duckGain(false)).toBeCloseTo(1, 5);
    expect(duckGain(true, -6)).toBeCloseTo(0.5, 2);
    expect(duckGain(true, -12)).toBeCloseTo(0.25, 2);
  });
});

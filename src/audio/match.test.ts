import { describe, it, expect } from 'vitest';
import { featureDistance, matchReport } from './match';
import type { AudioFeatures } from './analysis';

const base: AudioFeatures = {
  durationSec: 8,
  rms: 0.2,
  peakDb: -1,
  centroidHz: 2500,
  zcr: 1200,
  onsetDensity: 6,
  tempoBpm: 120,
};

describe('feature matching', () => {
  it('identical features → zero distance, close match', () => {
    const r = featureDistance(base, { ...base });
    expect(r.distance).toBeCloseTo(0, 6);
    expect(r.headline).toBe('close match');
  });

  it('names the direction of the biggest miss', () => {
    const slow = featureDistance(base, { ...base, tempoBpm: 80 });
    expect(slow.headline).toContain('too slow');
    const dark = featureDistance(base, { ...base, centroidHz: 800 });
    expect(dark.deltas[0].note).toContain('too dark');
    const loud = featureDistance(base, { ...base, rms: 0.45 });
    expect(loud.deltas[0].note).toContain('too loud');
  });

  it('distance grows with mismatch', () => {
    const near = featureDistance(base, { ...base, tempoBpm: 125 }).distance;
    const far = featureDistance(base, { ...base, tempoBpm: 180 }).distance;
    expect(far).toBeGreaterThan(near);
  });

  it('handles silent (-Infinity peakDb) candidates without NaN', () => {
    const silent: AudioFeatures = { ...base, rms: 0, peakDb: -Infinity };
    const r = featureDistance(base, silent);
    expect(Number.isFinite(r.distance)).toBe(true);
  });

  it('matchReport lists the offending features', () => {
    const rep = matchReport(base, { ...base, tempoBpm: 70, centroidHz: 900 });
    expect(rep).toContain('too slow');
    expect(rep).toContain('too dark');
  });
});

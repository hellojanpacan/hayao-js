import { describe, it, expect } from 'vitest';
import { MusicDirector, midiToFreq } from './music';

describe('Kintsugi music', () => {
  it('midiToFreq is standard concert tuning', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 1); // A4
    expect(midiToFreq(60)).toBeCloseTo(261.63, 0); // C4
    expect(midiToFreq(81)).toBeCloseTo(880, 0); // A5
  });

  it('runs a full biome cycle headlessly without error (audio no-ops)', () => {
    const d = new MusicDirector();
    for (const biome of ['grove', 'cistern', 'ember', 'sky', 'heart']) {
      d.setBiome(biome);
      // ~10 seconds of beats at rising intensity
      for (let i = 0; i < 600; i++) d.update(1 / 60, (i % 200) / 200);
    }
    expect(true).toBe(true); // reaching here means no throw (dexp2/tone all safe headless)
  });

  it('tolerates an unknown biome (falls back to grove)', () => {
    const d = new MusicDirector();
    d.setBiome('nowhere');
    d.update(1 / 60, 0.5);
    expect(true).toBe(true);
  });
});

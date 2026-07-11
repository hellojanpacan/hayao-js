import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import { renderSound, type SoundSpec } from './synth';
import { signalHash } from './pcm';
import { spectralCentroid, peakAmp, rms } from './analysis';

describe('renderSound', () => {
  it('is deterministic — same spec yields byte-identical samples', () => {
    const spec: SoundSpec = { freq: 330, wave: 'square', noise: 0.4, sustain: 0.1 };
    expect(signalHash(renderSound(spec))).toBe(signalHash(renderSound(spec)));
  });

  it('respects an injected rng for reproducible noise', () => {
    const spec: SoundSpec = { wave: 'noise', sustain: 0.05 };
    const a = renderSound(spec, { rng: new Rng(7) });
    const b = renderSound(spec, { rng: new Rng(7) });
    const c = renderSound(spec, { rng: new Rng(8) });
    expect(signalHash(a)).toBe(signalHash(b));
    expect(signalHash(a)).not.toBe(signalHash(c));
  });

  it('different specs produce different sounds', () => {
    const base = signalHash(renderSound({ freq: 220 }));
    expect(signalHash(renderSound({ freq: 440 }))).not.toBe(base);
    expect(signalHash(renderSound({ freq: 220, wave: 'saw' }))).not.toBe(base);
  });

  it('duration follows the ADSR envelope', () => {
    const sig = renderSound({ attack: 0.1, decay: 0, sustain: 0.2, release: 0.1 });
    const sec = sig.length / 44100;
    expect(sec).toBeGreaterThan(0.4);
    expect(sec).toBeLessThan(0.45);
  });

  it('a sine at 440Hz centers its spectrum near 440', () => {
    const sig = renderSound({ freq: 440, wave: 'sine', attack: 0.01, sustain: 0.4, release: 0.05 });
    expect(spectralCentroid(sig)).toBeGreaterThan(380);
    expect(spectralCentroid(sig)).toBeLessThan(700);
  });

  it('higher base frequency raises the spectral centroid', () => {
    const low = renderSound({ freq: 220, wave: 'sine', sustain: 0.3 });
    const high = renderSound({ freq: 1760, wave: 'sine', sustain: 0.3 });
    expect(spectralCentroid(high)).toBeGreaterThan(spectralCentroid(low));
  });

  it('volume scales the peak', () => {
    const quiet = peakAmp(renderSound({ freq: 220, volume: 0.2, sustain: 0.2 }));
    const loud = peakAmp(renderSound({ freq: 220, volume: 0.8, sustain: 0.2 }));
    expect(loud).toBeGreaterThan(quiet);
  });

  it('highpass rejects lows monotonically (regression: coefficient was inverted)', () => {
    // A 60Hz sine: a higher highpass cutoff must leave LESS of it, not more.
    const lowCut = rms(renderSound({ freq: 60, wave: 'sine', sustain: 0.4, highpass: 200 }));
    const highCut = rms(renderSound({ freq: 60, wave: 'sine', sustain: 0.4, highpass: 4000 }));
    expect(highCut).toBeLessThan(lowCut);
  });

  it('envCurve 0 is bit-identical to omitting it (backward compatible)', () => {
    const base: SoundSpec = { freq: 330, decay: 0.4, sustainLevel: 0.2, release: 0.3, sustain: 0.1 };
    expect(signalHash(renderSound(base))).toBe(signalHash(renderSound({ ...base, envCurve: 0 })));
  });

  it('envCurve front-loads the decay — more energy early, less late', () => {
    // A note that decays to silence: linear vs exponential. The exponential
    // curve should drop faster, so its second half is quieter relative to its
    // first half than the linear one.
    const spec: SoundSpec = { freq: 220, wave: 'triangle', attack: 0.002, decay: 0.6, sustainLevel: 0, release: 0.01, sustain: 0 };
    const frontBias = (sig: Float32Array) => {
      const half = Math.floor(sig.length / 2);
      return rms(sig.subarray(0, half)) / (rms(sig.subarray(half)) + 1e-9);
    };
    const lin = renderSound(spec);
    const exp = renderSound({ ...spec, envCurve: 4 });
    expect(signalHash(exp)).not.toBe(signalHash(lin));
    expect(frontBias(exp)).toBeGreaterThan(frontBias(lin));
  });

  it('envCurve stays deterministic', () => {
    const spec: SoundSpec = { freq: 440, decay: 0.5, sustainLevel: 0.1, release: 0.4, envCurve: 3 };
    expect(signalHash(renderSound(spec))).toBe(signalHash(renderSound(spec)));
  });

  it('filterEnv 0 is bit-identical to omitting it (backward compatible)', () => {
    const base: SoundSpec = { freq: 220, wave: 'saw', sustain: 0.3, lowpass: 1800 };
    expect(signalHash(renderSound(base))).toBe(signalHash(renderSound({ ...base, filterEnv: 0 })));
  });

  it('a positive filterEnv brightens the attack then closes down', () => {
    // Bright-attack pluck: cutoff starts high and settles to the base, so the
    // note's first half is brighter than its second — and brighter up front than
    // the static-filter version.
    const spec: SoundSpec = { freq: 220, wave: 'saw', attack: 0.002, decay: 0, sustain: 0.5, release: 0.05, lowpass: 1200 };
    const swept = renderSound({ ...spec, filterEnv: 2.5, filterEnvTime: 0.15 });
    const stat = renderSound(spec);
    expect(signalHash(swept)).not.toBe(signalHash(stat));
    const firstHalf = (s: Float32Array) => spectralCentroid(s.subarray(0, Math.floor(s.length / 2)));
    expect(firstHalf(swept)).toBeGreaterThan(firstHalf(stat)); // brighter onset
    const secondHalf = (s: Float32Array) => spectralCentroid(s.subarray(Math.floor(s.length / 2)));
    expect(firstHalf(swept)).toBeGreaterThan(secondHalf(swept)); // then closes
  });

  it('filterEnv stays deterministic', () => {
    const spec: SoundSpec = { freq: 330, wave: 'saw', sustain: 0.4, lowpass: 1500, filterEnv: -2, filterEnvTime: 0.2 };
    expect(signalHash(renderSound(spec))).toBe(signalHash(renderSound(spec)));
  });

  it('deep FM stays finite and in-range (regression: freq could go negative)', () => {
    const sig = renderSound({ freq: 200, wave: 'sine', fm: 800, fmFreq: 40, sustain: 0.2 });
    for (let i = 0; i < sig.length; i++) {
      expect(Number.isFinite(sig[i])).toBe(true);
      expect(Math.abs(sig[i])).toBeLessThanOrEqual(1.001);
    }
  });
});

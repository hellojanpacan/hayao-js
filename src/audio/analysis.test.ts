import { describe, it, expect } from 'vitest';
import { dbfs, rms, zcr, fft, spectralCentroid, estimateTempo } from './analysis';

const SR = 44100;

function sine(freq: number, sec: number, sr = SR): Float32Array {
  const n = Math.round(sec * sr);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.sin((2 * Math.PI * freq * i) / sr);
  return out;
}

describe('analysis', () => {
  it('dbfs maps amplitude to decibels', () => {
    expect(dbfs(1)).toBeCloseTo(0, 4);
    expect(dbfs(0.5)).toBeCloseTo(-6.02, 1);
    expect(dbfs(0)).toBe(-Infinity);
  });

  it('rms of a full-scale sine is ~0.707', () => {
    expect(rms(sine(440, 0.2))).toBeCloseTo(Math.SQRT1_2, 2);
  });

  it('zcr tracks frequency: 2 crossings per cycle', () => {
    // a 100Hz sine over 1s has ~200 zero crossings
    expect(zcr(sine(100, 1))).toBeGreaterThan(180);
    expect(zcr(sine(100, 1))).toBeLessThan(220);
  });

  it('fft of a delta is a flat spectrum', () => {
    const re = new Float32Array(8);
    const im = new Float32Array(8);
    re[0] = 1;
    fft(re, im);
    for (let k = 0; k < 8; k++) {
      expect(Math.hypot(re[k], im[k])).toBeCloseTo(1, 5);
    }
  });

  it('spectralCentroid locates a pure tone', () => {
    expect(spectralCentroid(sine(1000, 0.5))).toBeCloseTo(1000, -2); // within ~50Hz
    // brighter tone → higher centroid
    expect(spectralCentroid(sine(3000, 0.5))).toBeGreaterThan(spectralCentroid(sine(500, 0.5)));
  });

  it('estimateTempo recovers a click train BPM', () => {
    // clicks every 0.5s = 120 BPM, over 4s
    const sr = SR;
    const sig = new Float32Array(4 * sr);
    for (let beat = 0; beat < 8; beat++) {
      const at = Math.round(beat * 0.5 * sr);
      for (let i = 0; i < 400 && at + i < sig.length; i++) {
        sig[at + i] = Math.sin((2 * Math.PI * 800 * i) / sr) * (1 - i / 400);
      }
    }
    const bpm = estimateTempo(sig);
    expect(bpm).toBeGreaterThan(108);
    expect(bpm).toBeLessThan(132);
  });
});

import { describe, it, expect } from 'vitest';
import {
  SAMPLE_RATE,
  createStereo,
  panGains,
  mixMono,
  peak,
  softClip,
  normalize,
  encodeWav,
  signalHash,
} from './pcm';

describe('pcm buffer', () => {
  it('allocates the right number of frames', () => {
    const b = createStereo(1, SAMPLE_RATE);
    expect(b.left.length).toBe(SAMPLE_RATE);
    expect(b.right.length).toBe(SAMPLE_RATE);
  });

  it('equal-power pan: center is -3dB both sides, hard edges are one-sided', () => {
    const c = panGains(0);
    expect(c.l).toBeCloseTo(Math.SQRT1_2, 4);
    expect(c.r).toBeCloseTo(Math.SQRT1_2, 4);
    const l = panGains(-1);
    expect(l.l).toBeCloseTo(1, 4);
    expect(l.r).toBeCloseTo(0, 4);
    const r = panGains(1);
    expect(r.l).toBeCloseTo(0, 4);
    expect(r.r).toBeCloseTo(1, 4);
  });

  it('mixMono is additive and range-safe', () => {
    const bus = createStereo(0.001); // ~44 frames
    const sig = new Float32Array([1, 1, 1]);
    mixMono(bus, sig, 0, 1, 0); // center
    expect(bus.left[0]).toBeCloseTo(Math.SQRT1_2, 4);
    expect(bus.right[0]).toBeCloseTo(Math.SQRT1_2, 4);
    // out-of-range start is clipped, not an error
    mixMono(bus, sig, bus.left.length + 10, 1, 0);
    mixMono(bus, sig, -100, 1, 0);
    expect(peak(bus)).toBeLessThanOrEqual(1);
  });

  it('softClip is bounded and passes small signals nearly unchanged', () => {
    expect(softClip(0)).toBeCloseTo(0, 6);
    expect(softClip(0.1)).toBeCloseTo(0.0995, 3); // ~unity slope at origin
    expect(softClip(5)).toBeLessThan(1);
    expect(softClip(-5)).toBeGreaterThan(-1);
    expect(softClip(1000)).toBeLessThan(1); // asymptote, never exceeds ±1
  });

  it('normalize brings peak to target', () => {
    const bus = createStereo(0.001);
    bus.left.fill(0.2);
    bus.right.fill(0.1);
    normalize(bus, 0.9);
    expect(peak(bus)).toBeCloseTo(0.9, 3);
  });

  it('encodeWav writes a valid RIFF/WAVE header of the right size', () => {
    const bus = createStereo(0.01); // 441 frames
    const wav = encodeWav(bus);
    const str = (o: number, len: number) =>
      String.fromCharCode(...Array.from(wav.slice(o, o + len)));
    expect(str(0, 4)).toBe('RIFF');
    expect(str(8, 4)).toBe('WAVE');
    expect(str(36, 4)).toBe('data');
    expect(wav.length).toBe(44 + 441 * 4);
  });

  it('signalHash is deterministic and content-sensitive', () => {
    const a = new Float32Array([0.1, -0.2, 0.3]);
    const b = new Float32Array([0.1, -0.2, 0.3]);
    const c = new Float32Array([0.1, -0.2, 0.31]);
    expect(signalHash(a)).toBe(signalHash(b));
    expect(signalHash(a)).not.toBe(signalHash(c));
  });
});

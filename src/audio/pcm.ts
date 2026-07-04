// Headless PCM substrate. Pure, deterministic, zero-dependency: a score renders
// to Float32 sample buffers in plain Node — so audio becomes hashable and
// verifiable like every other Hayao subsystem, not a browser-only black box.
// All transcendental math routes through dmath (dsin/dcos/dexp2) so a rendered
// buffer is bit-identical on every JS engine.

import { clamp } from '../core/math';
import { dsin, dcos } from '../core/dmath';

/** Canonical render rate. 44.1 kHz — CD quality, ubiquitous. */
export const SAMPLE_RATE = 44100;

/** A mono signal: Float32 samples, nominally in [-1, 1], at some sample rate. */
export type Samples = Float32Array;

/** A stereo buffer: two channels sharing one sample rate. The mix target. */
export interface StereoBuffer {
  sampleRate: number;
  left: Float32Array;
  right: Float32Array;
}

/** Allocate a silent stereo buffer of the given duration. */
export function createStereo(durationSec: number, sampleRate = SAMPLE_RATE): StereoBuffer {
  const n = Math.max(0, Math.round(durationSec * sampleRate));
  return { sampleRate, left: new Float32Array(n), right: new Float32Array(n) };
}

/** Frame count (samples per channel). */
export function stereoFrames(buf: StereoBuffer): number {
  return buf.left.length;
}

/** Duration in seconds. */
export function stereoDuration(buf: StereoBuffer): number {
  return buf.left.length / buf.sampleRate;
}

/**
 * Equal-power pan law. pan ∈ [-1, 1]: -1 = hard left, 0 = center, +1 = hard
 * right. Uses a quarter-sine curve so total power is constant across the sweep
 * (a linear pan would dip −3 dB in the middle).
 */
export function panGains(pan: number): { l: number; r: number } {
  const p = (clamp(pan, -1, 1) + 1) * 0.5; // 0..1
  const a = p * (Math.PI / 2); // 0..π/2
  return { l: dcos(a), r: dsin(a) };
}

/**
 * Mix a mono signal into a stereo bus at a start sample, with gain and pan.
 * Additive — many voices accumulate into one bus. Samples outside the bus are
 * clipped away (no reallocation), so callers size the bus for the whole score.
 */
export function mixMono(bus: StereoBuffer, sig: Samples, startSample: number, gain = 1, pan = 0): void {
  const { l, r } = panGains(pan);
  const gl = gain * l;
  const gr = gain * r;
  const N = bus.left.length;
  const start = Math.round(startSample);
  for (let i = 0; i < sig.length; i++) {
    const j = start + i;
    if (j < 0) continue;
    if (j >= N) break;
    const s = sig[i];
    bus.left[j] += s * gl;
    bus.right[j] += s * gr;
  }
}

/** Largest absolute sample across both channels — the true peak. */
export function peak(buf: StereoBuffer): number {
  let p = 0;
  const { left, right } = buf;
  for (let i = 0; i < left.length; i++) {
    const a = left[i] < 0 ? -left[i] : left[i];
    if (a > p) p = a;
    const b = right[i] < 0 ? -right[i] : right[i];
    if (b > p) p = b;
  }
  return p;
}

/**
 * Transparent soft-clip. Unity slope at the origin (quiet signals pass through
 * untouched) and asymptotes to ±1, so it tames peaks without hard-clipping and
 * without boosting quiet material. Only sqrt — stays deterministic.
 */
export function softClip(x: number): number {
  return x / Math.sqrt(1 + x * x);
}

/** Soft-clip a whole buffer in place. Tames additive overshoot on a busy mix. */
export function softClipInPlace(buf: StereoBuffer): void {
  const { left, right } = buf;
  for (let i = 0; i < left.length; i++) {
    left[i] = softClip(left[i]);
    right[i] = softClip(right[i]);
  }
}

/** Scale a buffer in place so its peak sits at `target` (default −1 dBFS-ish). */
export function normalize(buf: StereoBuffer, target = 0.89): void {
  const p = peak(buf);
  if (p < 1e-9) return;
  const g = target / p;
  const { left, right } = buf;
  for (let i = 0; i < left.length; i++) {
    left[i] *= g;
    right[i] *= g;
  }
}

/**
 * Encode a stereo buffer as a 16-bit PCM WAV (RIFF) byte array — a real,
 * playable artifact a human (or a golden-file test) can keep. Zero-dependency.
 */
export function encodeWav(buf: StereoBuffer): Uint8Array {
  const { left, right, sampleRate } = buf;
  const n = left.length;
  const channels = 2;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataLen = n * blockAlign;
  const out = new Uint8Array(44 + dataLen);
  const dv = new DataView(out.buffer);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, 'RIFF');
  dv.setUint32(4, 36 + dataLen, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  dv.setUint32(16, 16, true); // PCM fmt chunk size
  dv.setUint16(20, 1, true); // PCM
  dv.setUint16(22, channels, true);
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * blockAlign, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, 16, true); // bits per sample
  str(36, 'data');
  dv.setUint32(40, dataLen, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    let sl = clamp(left[i], -1, 1);
    let sr = clamp(right[i], -1, 1);
    dv.setInt16(off, (sl < 0 ? sl * 0x8000 : sl * 0x7fff) | 0, true);
    dv.setInt16(off + 2, (sr < 0 ? sr * 0x8000 : sr * 0x7fff) | 0, true);
    off += 4;
  }
  return out;
}

/**
 * Deterministic 32-bit fingerprint of a signal — samples quantized to 16-bit
 * then FNV-1a hashed. Lets a test pin "this synth produces exactly this sound"
 * without storing the whole buffer, and detect any DSP regression.
 */
export function signalHash(sig: Samples): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < sig.length; i++) {
    const q = (clamp(sig[i], -1, 1) * 32767) | 0;
    h ^= q & 0xff;
    h = Math.imul(h, 16777619);
    h ^= (q >> 8) & 0xff;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Audio analysis — the numeric "ear" a headless judge listens with. Pure,
// deterministic feature extraction over a Float32 signal: loudness, peak,
// zero-crossing rate, and a spectrum via an in-house radix-2 FFT (twiddles from
// dmath, so results are bit-identical across engines). This is to a rendered
// track what world.probe() is to a sim — the thing tests assert on.

import { dsin, dcos, dlog10 } from '../core/dmath';
import { TAU } from '../core/math';
import { SAMPLE_RATE, type Samples } from './pcm';

/** Amplitude ratio → decibels full-scale. Silence maps to -Infinity. */
export function dbfs(amp: number): number {
  const a = amp < 0 ? -amp : amp;
  if (a < 1e-12) return -Infinity;
  return 20 * dlog10(a);
}

/** Root-mean-square level of a signal. */
export function rms(sig: Samples): number {
  if (sig.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < sig.length; i++) sum += sig[i] * sig[i];
  return Math.sqrt(sum / sig.length);
}

/** Peak absolute sample. */
export function peakAmp(sig: Samples): number {
  let p = 0;
  for (let i = 0; i < sig.length; i++) {
    const a = sig[i] < 0 ? -sig[i] : sig[i];
    if (a > p) p = a;
  }
  return p;
}

/** Zero crossings per second — a rough "noisiness / brightness" proxy. */
export function zcr(sig: Samples, sampleRate = SAMPLE_RATE): number {
  if (sig.length < 2) return 0;
  let crossings = 0;
  for (let i = 1; i < sig.length; i++) {
    if ((sig[i - 1] < 0 && sig[i] >= 0) || (sig[i - 1] >= 0 && sig[i] < 0)) crossings++;
  }
  return (crossings * sampleRate) / sig.length;
}

/** Largest power of two ≤ n (n ≥ 1). */
function prevPow2(n: number): number {
  let p = 1;
  while (p * 2 <= n) p *= 2;
  return p;
}

/**
 * In-place iterative radix-2 Cooley–Tukey FFT. `re`/`im` length must be a power
 * of two. Deterministic: twiddle factors come from dcos/dsin.
 */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  // bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -TAU / len;
    const wr = dcos(ang);
    const wi = dsin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = cr * re[b] - ci * im[b];
        const ti = cr * im[b] + ci * re[b];
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/** Hann-windowed magnitude spectrum of a frame (length rounded down to pow2). */
export function magnitudeSpectrum(frame: Samples): Float32Array {
  const n = prevPow2(frame.length);
  if (n < 2) return new Float32Array(0); // too short for a spectrum (avoids /0 Hann)
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const w = 0.5 - 0.5 * dcos((TAU * i) / (n - 1)); // Hann
    re[i] = frame[i] * w;
  }
  fft(re, im);
  const half = n >> 1;
  const mag = new Float32Array(half);
  for (let i = 0; i < half; i++) mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
  return mag;
}

/**
 * Spectral centroid (Hz) — the "center of mass" of the spectrum, a robust
 * brightness measure. Averaged over Hann frames across the whole signal.
 */
export function spectralCentroid(sig: Samples, sampleRate = SAMPLE_RATE): number {
  const frameSize = 2048;
  if (sig.length < 64) return 0;
  const hop = frameSize;
  let weighted = 0;
  let total = 0;
  for (let start = 0; start + 64 <= sig.length; start += hop) {
    const frame = sig.subarray(start, Math.min(start + frameSize, sig.length));
    const mag = magnitudeSpectrum(frame);
    const binHz = sampleRate / (mag.length * 2);
    for (let k = 0; k < mag.length; k++) {
      weighted += k * binHz * mag[k];
      total += mag[k];
    }
  }
  return total < 1e-9 ? 0 : weighted / total;
}

/**
 * Spectral flux onset envelope: per-frame sum of positive magnitude increases.
 * Peaks mark note onsets — the basis for tempo/onset-density features.
 */
export function fluxEnvelope(sig: Samples, frameSize = 1024, hop = 512): Float32Array {
  const frames: number[] = [];
  let prev: Float32Array | null = null;
  for (let start = 0; start + frameSize <= sig.length; start += hop) {
    const mag = magnitudeSpectrum(sig.subarray(start, start + frameSize));
    let flux = 0;
    if (prev) {
      const m = Math.min(mag.length, prev.length);
      for (let k = 0; k < m; k++) {
        const d = mag[k] - prev[k];
        if (d > 0) flux += d;
      }
    }
    frames.push(flux);
    prev = mag;
  }
  return Float32Array.from(frames);
}

/** Onsets per second — busy/percussive vs sparse/sustained. */
export function onsetDensity(sig: Samples, sampleRate = SAMPLE_RATE): number {
  const hop = 512;
  const env = fluxEnvelope(sig, 1024, hop);
  if (env.length < 3) return 0;
  let mean = 0;
  for (let i = 0; i < env.length; i++) mean += env[i];
  mean /= env.length;
  const thresh = mean * 1.5;
  let onsets = 0;
  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] > thresh && env[i] >= env[i - 1] && env[i] > env[i + 1]) onsets++;
  }
  const durSec = sig.length / sampleRate;
  return durSec < 1e-6 ? 0 : onsets / durSec;
}

/**
 * Estimate tempo (BPM) by autocorrelating the flux onset envelope and picking
 * the strongest lag in the 60–200 BPM band. Returns 0 if indeterminate.
 */
export function estimateTempo(sig: Samples, sampleRate = SAMPLE_RATE): number {
  const hop = 512;
  const env = fluxEnvelope(sig, 1024, hop);
  if (env.length < 8) return 0;
  const envRate = sampleRate / hop; // frames per second
  // ceil/floor chosen so the lag range stays INSIDE the 60–200 BPM band.
  const minLag = Math.max(1, Math.ceil((envRate * 60) / 200)); // 200 BPM
  const maxLag = Math.min(env.length - 1, Math.floor((envRate * 60) / 60)); // 60 BPM
  let bestLag = 0;
  let best = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = lag; i < env.length; i++) sum += env[i] * env[i - lag];
    // Normalize by the overlap count, else short lags (fast tempi) win on term
    // count alone, biasing the estimate high.
    sum /= env.length - lag;
    if (sum > best) {
      best = sum;
      bestLag = lag;
    }
  }
  if (bestLag === 0) return 0;
  return (60 * envRate) / bestLag;
}

/** A compact numeric fingerprint of a signal — the audio-filmstrip's assertions. */
export interface AudioFeatures {
  durationSec: number;
  rms: number;
  peakDb: number;
  centroidHz: number;
  zcr: number;
  onsetDensity: number;
  tempoBpm: number;
}

/** Extract the full feature vector used by verification. */
export function features(sig: Samples, sampleRate = SAMPLE_RATE): AudioFeatures {
  return {
    durationSec: sig.length / sampleRate,
    rms: rms(sig),
    peakDb: dbfs(peakAmp(sig)),
    centroidHz: spectralCentroid(sig, sampleRate),
    zcr: zcr(sig, sampleRate),
    onsetDensity: onsetDensity(sig, sampleRate),
    tempoBpm: estimateTempo(sig, sampleRate),
  };
}

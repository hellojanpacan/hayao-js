// SFX synthesis — sound as data. A SoundSpec is a plain, named object (ZzFX's
// 20-knob vocabulary + jsfxr's filters, but with musical units: slides and
// jumps in semitones, not raw per-sample deltas) that renders to a mono Float32
// buffer by pure arithmetic. No Web Audio, no files. Deterministic: the only
// randomness is the noise source, which draws from a seeded Rng, so the same
// spec always yields the same samples — hashable and verifiable in Node.

import { TAU } from '../core/math';
import { dsin, dexp2, dpow } from '../core/dmath';
import { Rng } from '../core/rng';
import { SAMPLE_RATE, type Samples } from './pcm';

export type Wave = 'sine' | 'triangle' | 'saw' | 'square' | 'noise';

/**
 * A one-shot sound, fully described by data. Every field is optional; omitted
 * fields take musical defaults. Times are seconds, pitch offsets are semitones,
 * depths are 0..1 unless noted.
 */
export interface SoundSpec {
  /** Base pitch in Hz. */
  freq?: number;
  /** Oscillator shape. */
  wave?: Wave;
  /** Square/pulse duty cycle 0..1 (square only). */
  duty?: number;

  // ── amplitude envelope (ADSR), seconds ──
  attack?: number;
  decay?: number;
  sustain?: number; // hold time at sustainLevel
  release?: number;
  sustainLevel?: number; // 0..1 level after decay
  /** Percussive volume spike at onset (jsfxr "punch"), 0..1. */
  punch?: number;
  /** Overall output gain. */
  volume?: number;

  // ── pitch dynamics ──
  slide?: number; // glide over the whole sound, semitones
  slideAccel?: number; // extra glide applied quadratically, semitones
  pitchJump?: number; // one-shot shift, semitones
  pitchJumpTime?: number; // when the jump fires, seconds
  vibrato?: number; // depth, semitones
  vibratoFreq?: number; // Hz
  /**
   * Pitch-envelope repeat period, seconds (ZzFX `repeatTime`). Every `repeat`
   * seconds the slide/slideAccel/pitchJump progression resets to its start
   * while the amplitude envelope keeps going — the classic ZzFX stutter/trill.
   * 0 or absent = off (bit-identical to the pre-`repeat` renderer).
   */
  repeat?: number;

  // ── timbre / character ──
  /** Second detuned oscillator, cents (0 = off). Adds unison warmth/chorus. */
  detune?: number;
  /** Sub-oscillator: a sine one octave down, mixed at this level 0..1. Adds weight. */
  sub?: number;
  noise?: number; // 0..1 blend of white noise into the tone
  shapeCurve?: number; // waveshape exponent; >1 hardens, <1 softens
  fm?: number; // frequency-modulation depth, Hz
  fmFreq?: number; // FM rate, Hz
  tremolo?: number; // amplitude LFO depth 0..1
  tremoloFreq?: number; // Hz
  bitCrush?: number; // sample-and-hold every N samples (0 = off)

  // ── filters (one-pole), Hz cutoff (0 = bypass) ──
  lowpass?: number;
  highpass?: number;

  // ── echo ──
  delay?: number; // echo time, seconds
  delayFeedback?: number; // 0..1
}

interface Resolved {
  freq: number;
  wave: Wave;
  duty: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  sustainLevel: number;
  punch: number;
  volume: number;
  slide: number;
  slideAccel: number;
  pitchJump: number;
  pitchJumpTime: number;
  vibrato: number;
  vibratoFreq: number;
  repeat: number;
  detune: number;
  sub: number;
  noise: number;
  shapeCurve: number;
  fm: number;
  fmFreq: number;
  tremolo: number;
  tremoloFreq: number;
  bitCrush: number;
  lowpass: number;
  highpass: number;
  delay: number;
  delayFeedback: number;
}

function resolve(s: SoundSpec): Resolved {
  return {
    freq: s.freq ?? 220,
    wave: s.wave ?? 'sine',
    duty: s.duty ?? 0.5,
    attack: Math.max(0, s.attack ?? 0.005),
    decay: Math.max(0, s.decay ?? 0),
    sustain: Math.max(0, s.sustain ?? 0.08),
    release: Math.max(0, s.release ?? 0.1),
    sustainLevel: s.sustainLevel ?? 1,
    punch: s.punch ?? 0,
    volume: s.volume ?? 0.5,
    slide: s.slide ?? 0,
    slideAccel: s.slideAccel ?? 0,
    pitchJump: s.pitchJump ?? 0,
    pitchJumpTime: s.pitchJumpTime ?? 0,
    vibrato: s.vibrato ?? 0,
    vibratoFreq: s.vibratoFreq ?? 6,
    repeat: Math.max(0, s.repeat ?? 0),
    detune: s.detune ?? 0,
    sub: Math.max(0, s.sub ?? 0),
    noise: s.noise ?? 0,
    shapeCurve: Math.max(0.01, s.shapeCurve ?? 1),
    fm: s.fm ?? 0,
    fmFreq: s.fmFreq ?? 0,
    tremolo: s.tremolo ?? 0,
    tremoloFreq: s.tremoloFreq ?? 8,
    bitCrush: Math.max(0, Math.floor(s.bitCrush ?? 0)),
    lowpass: s.lowpass ?? 0,
    highpass: s.highpass ?? 0,
    delay: Math.max(0, s.delay ?? 0),
    delayFeedback: Math.min(0.95, Math.max(0, s.delayFeedback ?? 0)),
  };
}

/** semitone offset → frequency multiplier. */
function semis(n: number): number {
  return dexp2(n / 12);
}

/** Evaluate a waveform at phase p ∈ [0,1). */
function waveAt(wave: Wave, p: number, duty: number, rng: Rng): number {
  switch (wave) {
    case 'sine':
      return dsin(TAU * p);
    case 'saw':
      return 2 * p - 1;
    case 'square':
      return p < duty ? 1 : -1;
    case 'triangle': {
      const t = p < 0.5 ? p * 2 : 2 - p * 2; // 0..1..0
      return t * 2 - 1;
    }
    case 'noise':
      return rng.float() * 2 - 1;
  }
}

/**
 * Render a SoundSpec to a mono signal. Pure and deterministic: pass a seeded
 * `rng` for reproducible noise (defaults to a fixed seed so bare specs are
 * still bit-stable). The returned buffer is normalized only by `volume`, so a
 * caller can mix many at chosen gains.
 */
export function renderSound(spec: SoundSpec, opts: { rng?: Rng; sampleRate?: number } = {}): Samples {
  const r = resolve(spec);
  const sr = opts.sampleRate ?? SAMPLE_RATE;
  const rng = opts.rng ?? new Rng(0x5eed);

  const body = r.attack + r.decay + r.sustain + r.release;
  const tail = r.delay > 0 ? r.delay * 6 : 0; // let echoes ring out
  const totalSec = body + tail + 0.01;
  const n = Math.max(1, Math.round(totalSec * sr));
  const out = new Float32Array(n);

  const dt = 1 / sr;
  let phase = 0;
  let phase2 = 0; // detuned 2nd oscillator
  let phaseSub = 0; // sub-octave oscillator
  const detuneMul = r.detune !== 0 ? semis(r.detune / 100) : 1; // cents → ratio
  let held = 0; // bitcrush sample-and-hold
  // one-pole filter state
  let lpY = 0;
  let hpY = 0;
  let hpXPrev = 0;
  const lpA = r.lowpass > 0 ? cutoffCoeff(r.lowpass, sr) : 1;
  // HP (leaky DC-blocker y = R·(y + x − xPrev)) needs R→1 at a LOW cutoff and
  // R→0 at a HIGH cutoff — the inverse of the LP coefficient.
  const hpA = r.highpass > 0 ? 1 - cutoffCoeff(r.highpass, sr) : 0;
  const nyquist = sr * 0.5;

  for (let i = 0; i < n; i++) {
    const t = i * dt;

    // amplitude envelope (linear ADSR) with punch and tremolo
    let env = adsr(t, r);
    if (r.punch > 0) env *= 1 + r.punch * Math.max(0, 1 - t / Math.max(1e-4, r.attack + r.decay));
    if (r.tremolo > 0) env *= 1 - r.tremolo * 0.5 * (1 - dsin(TAU * r.tremoloFreq * t));

    // instantaneous frequency: base × slide × jump × vibrato, with optional FM.
    // `repeat` (ZzFX repeatTime) resets the PITCH-envelope clock every period
    // while `t` (amplitude, vibrato, tremolo) runs on; when off, pt === t so
    // the arithmetic below is bit-identical to the pre-`repeat` renderer.
    const pt = r.repeat > 0 ? t - Math.floor(t / r.repeat) * r.repeat : t;
    const prog = body > 0 ? pt / body : 0;
    let f = r.freq * semis(r.slide * prog + r.slideAccel * prog * prog);
    if (r.pitchJump !== 0 && pt >= r.pitchJumpTime) f *= semis(r.pitchJump);
    if (r.vibrato > 0) f *= semis(r.vibrato * dsin(TAU * r.vibratoFreq * t));
    if (r.fm > 0) f += r.fm * dsin(TAU * r.fmFreq * t);
    // Clamp instantaneous frequency to [0, Nyquist]: deep FM/slide can otherwise
    // drive it negative (mirroring through DC) or past Nyquist (aliasing).
    if (f < 0) f = 0;
    else if (f > nyquist) f = nyquist;

    phase += f * dt;
    phase -= Math.floor(phase); // wrap to [0,1)

    // oscillator (with optional detuned 2nd osc + sub for warmth/weight)
    let s = waveAt(r.wave, phase, r.duty, rng);
    if (r.detune !== 0) {
      phase2 += f * detuneMul * dt;
      phase2 -= Math.floor(phase2);
      s = (s + waveAt(r.wave, phase2, r.duty, rng)) * 0.5;
    }
    if (r.sub > 0) {
      phaseSub += f * 0.5 * dt;
      phaseSub -= Math.floor(phaseSub);
      s = s * (1 - r.sub * 0.5) + dsin(TAU * phaseSub) * r.sub;
    }
    // noise blend
    if (r.noise > 0) s = s * (1 - r.noise) + (rng.float() * 2 - 1) * r.noise;

    // waveshaping (sign-preserving power)
    if (r.shapeCurve !== 1) s = (s < 0 ? -1 : 1) * dpow(s < 0 ? -s : s, r.shapeCurve);

    s *= env * r.volume;

    // bitcrush: hold the last emitted value for N samples
    if (r.bitCrush > 0) {
      if (i % r.bitCrush === 0) held = s;
      s = held;
    }

    out[i] = s;
  }

  // filters (post, so cutoff is stable across the whole sound)
  if (r.lowpass > 0) {
    for (let i = 0; i < n; i++) {
      lpY += lpA * (out[i] - lpY);
      out[i] = lpY;
    }
  }
  if (r.highpass > 0) {
    for (let i = 0; i < n; i++) {
      hpY = hpA * (hpY + out[i] - hpXPrev);
      hpXPrev = out[i];
      out[i] = hpY;
    }
  }

  // feedback delay (echo)
  if (r.delay > 0) {
    const d = Math.max(1, Math.round(r.delay * sr));
    for (let i = d; i < n; i++) out[i] += out[i - d] * r.delayFeedback;
  }

  return out;
}

/** One-pole cutoff coefficient for a given cutoff frequency. */
function cutoffCoeff(fc: number, sr: number): number {
  const x = TAU * fc * (1 / sr);
  return x / (x + 1);
}

/** Linear ADSR envelope value at time t. */
function adsr(t: number, r: Resolved): number {
  const a = r.attack;
  const d = r.decay;
  const s = r.sustain;
  const rel = r.release;
  if (t < a) return a > 0 ? t / a : 1;
  if (t < a + d) return d > 0 ? 1 + (r.sustainLevel - 1) * ((t - a) / d) : r.sustainLevel;
  if (t < a + d + s) return r.sustainLevel;
  const rt = t - a - d - s;
  if (rt < rel) return rel > 0 ? r.sustainLevel * (1 - rt / rel) : 0;
  return 0;
}

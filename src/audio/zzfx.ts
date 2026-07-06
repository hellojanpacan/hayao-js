// ZzFX bridge — convert a positional ZzFX parameter array (the 20-knob
// `zzfx(...)` call you copy out of the ZzFX sound designer) into a named,
// unit-sane hayao SoundSpec. This is a PORTING seam: paste the array, get a
// spec, keep hayao's deterministic renderer — no second AudioContext, no
// bundled zzfx. The conversions below encode the unit mismatches found while
// recreating js13k games (docs/TRIAGE-2026-07-recreations.md, ninja-cat 2.x):
//
//   • slide       ZzFX slides in semitones/SECOND; hayao's `slide` is total
//                 semitones over the whole body → slide × bodyDuration.
//   • deltaSlide  slide acceleration (semitones/s²) → hayao's quadratic
//                 `slideAccel` term ≈ deltaSlide × body² / 2.
//   • pitchJump   an absolute Hz ADDEND in ZzFX; hayao jumps in semitones →
//                 12·log2((freq + jump) / freq).
//   • filter      one signed knob: positive = lowpass cutoff Hz, negative =
//                 highpass cutoff Hz.
//   • shape       index → wave name (3, "tan", has no hayao equivalent and
//                 approximates to a hard-shaped square).
//   • randomness  DROPPED: hayao specs are deterministic by design — the same
//                 spec must hash to the same samples. Warned once.
//   • modulation  approximated as vibrato (pitch LFO at |modulation| Hz);
//                 ZzFX's FM feedback shape has no exact match. Warned once.
//   • repeatTime  → SoundSpec `repeat` (the pitch envelope resets each period
//                 while the amplitude envelope runs on — see synth.ts).
//
// Parameters with no faithful mapping warn once per parameter name (not per
// call), then approximate — a port should sound close first, exact later.

import { dlog2 } from '../core/dmath';
import type { SoundSpec, Wave } from './synth';

/** ZzFX shape index → hayao wave. Index 3 ("tan") is approximated. */
const SHAPES: readonly Wave[] = ['sine', 'triangle', 'saw', 'square', 'noise'];

/** Warn once per parameter name, ever — ports call this per-sfx in a loop. */
const warned = new Set<string>();
function warnOnce(param: string, msg: string): void {
  if (warned.has(param)) return;
  warned.add(param);
  console.warn(`[hayao] specFromZzfx: ${param} ${msg}`);
}

/** Test hook: clear the warn-once memory. */
export function resetZzfxWarnings(): void {
  warned.clear();
}

/**
 * Convert a positional ZzFX parameter array to a hayao SoundSpec.
 * Argument order (defaults in parens) is ZzFX's `zzfx(...)` signature:
 * volume(1), randomness(.05), frequency(220), attack(0), sustain(0),
 * release(.1), shape(0), shapeCurve(1), slide(0), deltaSlide(0), pitchJump(0),
 * pitchJumpTime(0), repeatTime(0), noise(0), modulation(0), bitCrush(0),
 * delay(0), sustainVolume(1), decay(0), tremolo(0), filter(0).
 * Holes/undefined take the ZzFX defaults, so `[,,1675,,.06,.24,1,1.82,,,837,.06]`
 * pastes straight in.
 */
export function specFromZzfx(p: readonly (number | undefined)[]): SoundSpec {
  const volume = p[0] ?? 1;
  const randomness = p[1] ?? 0.05;
  const frequency = p[2] ?? 220;
  const attack = p[3] ?? 0;
  const sustain = p[4] ?? 0;
  const release = p[5] ?? 0.1;
  const shape = p[6] ?? 0;
  const shapeCurve = p[7] ?? 1;
  const slide = p[8] ?? 0;
  const deltaSlide = p[9] ?? 0;
  const pitchJump = p[10] ?? 0;
  const pitchJumpTime = p[11] ?? 0;
  const repeatTime = p[12] ?? 0;
  const noise = p[13] ?? 0;
  const modulation = p[14] ?? 0;
  const bitCrush = p[15] ?? 0;
  const delay = p[16] ?? 0;
  const sustainVolume = p[17] ?? 1;
  const decay = p[18] ?? 0;
  const tremolo = p[19] ?? 0;
  const filter = p[20] ?? 0;

  // Both envelopes are attack→decay→sustain→release in seconds; the pitch
  // conversions below normalize per-second ZzFX rates over this body.
  const body = attack + decay + sustain + release;

  const spec: SoundSpec = {
    freq: frequency,
    volume,
    attack,
    decay,
    sustain,
    release,
    sustainLevel: sustainVolume,
  };

  // Wave shape.
  const shapeIdx = Math.max(0, Math.min(SHAPES.length - 1, Math.round(shape)));
  spec.wave = SHAPES[shapeIdx];
  if (Math.round(shape) === 3) warnOnce('shape=3 (tan)', 'has no hayao wave; approximated as a hard square.');
  if (shapeCurve !== 1) spec.shapeCurve = shapeCurve;

  // Randomness: hayao specs are deterministic — same spec, same samples, same
  // hash. Per-play detune would break golden audio verification. Dropped.
  if (randomness !== 0) warnOnce('randomness', 'is dropped: hayao specs are deterministic (same spec → same samples).');

  // Pitch dynamics (see header for the unit derivations).
  if (slide !== 0) spec.slide = slide * body;
  if (deltaSlide !== 0) spec.slideAccel = (deltaSlide * body * body) / 2;
  if (pitchJump !== 0) {
    const target = frequency + pitchJump;
    if (target > 0 && frequency > 0) {
      spec.pitchJump = 12 * dlog2(target / frequency);
      spec.pitchJumpTime = pitchJumpTime;
    } else {
      warnOnce('pitchJump', 'would drive frequency to ≤ 0 Hz; dropped.');
    }
  }
  if (repeatTime > 0) spec.repeat = repeatTime;

  // Timbre.
  if (noise !== 0) spec.noise = Math.max(0, Math.min(1, noise));
  if (modulation !== 0) {
    // ZzFX FM-feedback has no exact hayao analogue; a pitch LFO at the same
    // rate lands in the same perceptual family (warble/ring).
    warnOnce('modulation', 'is approximated as vibrato (pitch LFO at |modulation| Hz).');
    spec.vibrato = 0.6;
    spec.vibratoFreq = Math.abs(modulation);
  }
  // ZzFX holds every bitCrush×100 samples; hayao's knob is the sample count.
  if (bitCrush > 0) spec.bitCrush = Math.max(1, Math.round(bitCrush * 100));
  if (tremolo !== 0) spec.tremolo = Math.max(0, Math.min(1, tremolo));

  // Echo: ZzFX mixes one delayed copy at half gain; a feedback delay at 0.5
  // starts identically and rings out — close enough not to warn.
  if (delay > 0) {
    spec.delay = delay;
    spec.delayFeedback = 0.5;
  }

  // Filter: one signed Hz knob → the matching one-pole.
  if (filter > 0) spec.lowpass = filter;
  else if (filter < 0) spec.highpass = -filter;

  return spec;
}

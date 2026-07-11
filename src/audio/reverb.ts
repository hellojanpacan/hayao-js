// Reverb — a deterministic Freeverb (Schroeder/Moorer: parallel comb filters
// into series allpass filters). Dry synth voices sound cheap; a little room
// makes pads, pianos and strings bloom. Pure integer-delay-line arithmetic, so
// it's bit-stable and headless like everything else. Applied to a whole mix.

import { clamp } from '../core/math';
import type { StereoBuffer } from './pcm';

// Freeverb's tuned delay lengths (in samples @44.1kHz). Mutually prime-ish so
// the comb resonances don't pile onto the same frequencies.
const COMB_TUNING = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASS_TUNING = [556, 441, 341, 225];
const STEREO_SPREAD = 23; // right-channel delay offset for width
const FIXED_GAIN = 0.015;

class Comb {
  private buf: Float32Array;
  private idx = 0;
  private store = 0;
  constructor(size: number, private feedback: number, private damp: number) {
    this.buf = new Float32Array(Math.max(1, size));
  }
  process(x: number): number {
    const y = this.buf[this.idx];
    this.store = y * (1 - this.damp) + this.store * this.damp;
    this.buf[this.idx] = x + this.store * this.feedback;
    this.idx = (this.idx + 1) % this.buf.length;
    return y;
  }
}

class Allpass {
  private buf: Float32Array;
  private idx = 0;
  constructor(size: number, private feedback = 0.5) {
    this.buf = new Float32Array(Math.max(1, size));
  }
  process(x: number): number {
    const bufout = this.buf[this.idx];
    const y = -x + bufout;
    this.buf[this.idx] = x + bufout * this.feedback;
    this.idx = (this.idx + 1) % this.buf.length;
    return y;
  }
}

export interface ReverbOptions {
  /** Wet/dry mix 0..1 (default 0.25). */
  wet?: number;
  /** Tail length / feedback 0..1 — bigger = longer, more cathedral (default 0.7). */
  roomSize?: number;
  /** High-frequency damping 0..1 — bigger = darker tail (default 0.5). */
  damp?: number;
}

function bank(sr: number, feedback: number, damp: number, spread: number): { combs: Comb[]; aps: Allpass[] } {
  const scale = sr / 44100;
  const combs = COMB_TUNING.map((t) => new Comb(Math.round((t + spread) * scale), feedback, damp));
  const aps = ALLPASS_TUNING.map((t) => new Allpass(Math.round((t + spread) * scale), 0.5));
  return { combs, aps };
}

/**
 * Apply reverb to a stereo buffer in place. A mono send (the L/R sum) feeds two
 * slightly offset comb/allpass banks to produce a stereo tail, mixed back with
 * the dry signal. Deterministic — pure delay-line arithmetic.
 */
export function applyReverb(buf: StereoBuffer, opts: ReverbOptions = {}): void {
  const it = reverbSteps(buf, opts);
  while (!it.next().done) {
    /* drain synchronously */
  }
}

/**
 * Reverb as a cooperative generator: identical output to {@link applyReverb},
 * but it `yield`s every `window` samples so a long render can hand control back
 * to the host between windows. Reverb is the heaviest master pass (24 delay-line
 * ops per sample), so windowing it is what keeps a cued render off a frame.
 */
export function* reverbSteps(buf: StereoBuffer, opts: ReverbOptions = {}, window = 8192): Generator<void, void, void> {
  const wet = clamp(opts.wet ?? 0.25, 0, 1);
  const room = clamp(opts.roomSize ?? 0.7, 0, 1);
  const damp = clamp(opts.damp ?? 0.5, 0, 1) * 0.4;
  const feedback = 0.7 + room * 0.28; // 0.7..0.98
  const sr = buf.sampleRate;

  const L = bank(sr, feedback, damp, 0);
  const R = bank(sr, feedback, damp, STEREO_SPREAD);
  const n = buf.left.length;
  const win = Math.max(1, window);

  for (let i = 0; i < n; i++) {
    const send = (buf.left[i] + buf.right[i]) * FIXED_GAIN;
    let wl = 0;
    for (const c of L.combs) wl += c.process(send);
    for (const a of L.aps) wl = a.process(wl);
    let wr = 0;
    for (const c of R.combs) wr += c.process(send);
    for (const a of R.aps) wr = a.process(wr);
    buf.left[i] = buf.left[i] * (1 - wet) + wl * wet;
    buf.right[i] = buf.right[i] * (1 - wet) + wr * wet;
    if ((i + 1) % win === 0) yield; // window boundary — a cooperative pause point
  }
}

/**
 * Reverb SEND — the mixing-desk model. Compute a wet tail from a `send` buffer
 * (the sum of each track's signal at its own send level) and ADD it into the
 * `dry` mix. One shared room, fed at per-track amounts: a bass can stay bone-dry
 * and tight while a lead blooms into the space — depth that a single whole-mix
 * reverb can't give (there, everything shares one wet/dry). Here `wet` is the
 * return level of the send bus. Deterministic — the same delay-line arithmetic
 * as `applyReverb`, just reading a send bus instead of the mix itself.
 */
export function applyReverbSend(dry: StereoBuffer, send: StereoBuffer, opts: ReverbOptions = {}): void {
  const it = reverbSendSteps(dry, send, opts);
  while (!it.next().done) {
    /* drain synchronously */
  }
}

/**
 * The send reverb as a cooperative generator (same relationship {@link
 * reverbSteps} has to {@link applyReverb}): identical output to {@link
 * applyReverbSend}, yielding every `window` samples so a long cued render can
 * hand control back to the host between windows.
 */
export function* reverbSendSteps(dry: StereoBuffer, send: StereoBuffer, opts: ReverbOptions = {}, window = 8192): Generator<void, void, void> {
  const ret = clamp(opts.wet ?? 0.25, 0, 1);
  const room = clamp(opts.roomSize ?? 0.7, 0, 1);
  const damp = clamp(opts.damp ?? 0.5, 0, 1) * 0.4;
  const feedback = 0.7 + room * 0.28;
  const sr = dry.sampleRate;

  const L = bank(sr, feedback, damp, 0);
  const R = bank(sr, feedback, damp, STEREO_SPREAD);
  const n = dry.left.length;
  const win = Math.max(1, window);

  for (let i = 0; i < n; i++) {
    const s = (send.left[i] + send.right[i]) * FIXED_GAIN;
    let wl = 0;
    for (const c of L.combs) wl += c.process(s);
    for (const a of L.aps) wl = a.process(wl);
    let wr = 0;
    for (const c of R.combs) wr += c.process(s);
    for (const a of R.aps) wr = a.process(wr);
    dry.left[i] += wl * ret;
    dry.right[i] += wr * ret;
    if ((i + 1) % win === 0) yield;
  }
}

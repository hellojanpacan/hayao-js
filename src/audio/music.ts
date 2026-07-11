// Music composition as data. A Song is a plain, LLM-authorable object: tracks,
// each an Instrument (a SoundSpec voice template) plus reusable patterns of
// {pitch, beats, vel} notes sequenced by index (the ZzFXM/tracker model, but
// with named fields and TinyMusic-style note payloads). renderSong mixes it all
// down to a StereoBuffer through the SAME deterministic synth core as SFX — no
// Web Audio, no files, fully headless and hashable.

import { Rng } from '../core/rng';
import { TAU } from '../core/math';
import { dexp, dexp2, dpow } from '../core/dmath';
import { renderSound, type SoundSpec } from './synth';
import { pitchToFreq } from './theory';
import { reverbSteps, reverbSendSteps, type ReverbOptions } from './reverb';
import { createStereo, mixMono, normalize, softClipInPlace, type StereoBuffer, SAMPLE_RATE } from './pcm';

/** A voice: everything a SoundSpec has except pitch, which each note supplies. */
export type Instrument = Omit<SoundSpec, 'freq'>;

export type Pitch = string | number;

/** One note (or chord, or rest) in a pattern. */
export interface Note {
  /** A pitch, a chord (array of pitches), or null for a rest. */
  pitch: Pitch | Pitch[] | null;
  /** Duration in beats. */
  beats: number;
  /** Velocity 0..1 (default 1). */
  vel?: number;
}

/** A monophonic-per-note lane: an instrument playing sequenced patterns. */
export interface Track {
  name?: string;
  instrument: Instrument;
  /** Reusable note patterns, referenced by index in `sequence`. */
  patterns: Note[][];
  /** Order in which patterns play. */
  sequence: number[];
  /** Track mix level (default 0.7). */
  gain?: number;
  /** Stereo position -1..1 (default 0). */
  pan?: number;
  /**
   * Reverb send 0..1 — how much of this track feeds the shared reverb bus (the
   * mixing-desk model). When ANY track sets this, `song.reverb` switches from a
   * whole-mix room to a send bus: the dry mix stays dry and only the sends
   * bloom, so e.g. a bass can be bone-dry and a lead washed in space. Omit on
   * every track (the default) to keep the classic whole-mix reverb.
   */
  reverbSend?: number;
}

export interface Song {
  bpm: number;
  tracks: Track[];
  /** Concert-A reference (default 440). */
  a4?: number;
  /** Tail seconds appended so release/echo tails ring out (default 2). */
  tailSec?: number;
  /** Room reverb applied to the whole mix (space + glue). */
  reverb?: ReverbOptions;
  /** Swing 0..1 — delays off-beat 8th notes for a shuffled feel (jazz/lofi). */
  swing?: number;
  /** Humanize 0..1 — small seeded timing/velocity jitter so it doesn't feel robotic. */
  humanize?: number;
  /**
   * Velocity→brightness 0..1 — how much a soft note darkens (like a real
   * instrument: harder = brighter). Scales each voice's lowpass by velocity.
   * Default 0.5. This is what turns a velocity map into actual phrasing.
   */
  velBrightness?: number;
  /**
   * Sidechain "pump": a beat-synced ducking of the whole mix — the breathing
   * signature of electronic music. depth 0..1, beatsPerCycle sets the pulse
   * (default 1 = every beat).
   */
  sidechain?: { depth?: number; beatsPerCycle?: number };
  /**
   * Master bus (a light mastering pass): `lowCut` tucks boomy sub/bass, and
   * `presence`/`air` lift high-mid clarity and top-end sparkle. `compress`
   * (0..1) applies a gentle glue compressor with makeup gain — evens dynamics
   * and lifts perceived loudness (esp. sparse ballads). Each field 0..1.
   */
  master?: { lowCut?: number; presence?: number; air?: number; compress?: number };
}

/** Knobs for {@link stepPattern}. */
export interface StepGridOptions {
  /** Beats per step (default 0.25 — a 16th note). */
  stepBeats?: number;
  /** Velocity for `X` accents (default 1). */
  accentVel?: number;
  /** Velocity for `x` hits (default 0.7). */
  hitVel?: number;
}

/**
 * Author a drum/percussion lane as the tracker-style STEP GRID a drummer
 * actually thinks in, instead of a hand-built `Note[]` of hits and rests. Each
 * character is one step of `stepBeats` beats; consecutive rests coalesce into a
 * single rest note. Pure and deterministic — same string, same notes.
 *
 * Symbols:
 * - `X` — accent (velocity `accentVel`, default 1)
 * - `x` — normal hit (velocity `hitVel`, default 0.7)
 * - `1`–`9` — graded velocity `d/9` (so `2` ≈ a ghost note, `9` ≈ a hard hit)
 * - `.` `-` `_` `0` — a rest step
 * - `|` and whitespace — ignored, so you can bar-group for readability
 *
 * Every hit plays the same `pitch` (drum voices are one-note). Example — a funk
 * backbeat with ghost notes: `stepPattern('..2.X..23...X.2.', 'D4')`.
 */
export function stepPattern(grid: string, pitch: Pitch, opts: StepGridOptions = {}): Note[] {
  const stepBeats = opts.stepBeats ?? 0.25;
  const accentVel = opts.accentVel ?? 1;
  const hitVel = opts.hitVel ?? 0.7;
  const out: Note[] = [];
  let restBeats = 0;
  const flushRest = (): void => {
    if (restBeats > 0) {
      out.push({ pitch: null, beats: restBeats });
      restBeats = 0;
    }
  };
  for (const ch of grid) {
    if (ch === '|' || ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') continue;
    let vel: number | null;
    if (ch === 'X') vel = accentVel;
    else if (ch === 'x') vel = hitVel;
    else if (ch >= '1' && ch <= '9') vel = (ch.charCodeAt(0) - 48) / 9;
    else vel = null; // '.', '-', '_', '0', or any other glyph → rest
    if (vel === null) {
      restBeats += stepBeats;
    } else {
      flushRest();
      out.push({ pitch, beats: stepBeats, vel });
    }
  }
  flushRest();
  return out;
}

function patternBeats(pattern: Note[]): number {
  let b = 0;
  for (const n of pattern) b += n.beats;
  return b;
}

function trackBeats(track: Track): number {
  let b = 0;
  for (const idx of track.sequence) b += patternBeats(track.patterns[idx] ?? []);
  return b;
}

/** Total musical length of a song in beats (the longest track). */
export function songBeats(song: Song): number {
  let max = 0;
  for (const t of song.tracks) max = Math.max(max, trackBeats(t));
  return max;
}

/** Song duration in seconds, excluding the ring-out tail. */
export function songDuration(song: Song): number {
  return (songBeats(song) * 60) / song.bpm;
}

/** Options shared by the sync and cooperative renderers. */
export interface RenderSongOptions {
  sampleRate?: number;
  normalizePeak?: number;
}

/** Extra knob for the cooperative renderer: yield to the event loop after this
 * many synthesis units (notes/passes). Lower = smoother host, slightly slower. */
export interface RenderSongAsyncOptions extends RenderSongOptions {
  yieldEvery?: number;
}

/**
 * Render a Song to a stereo buffer. Deterministic: a per-track seeded Rng feeds
 * any noise voices, so the same Song always produces the same mix. Notes are
 * synthesized via renderSound with the track's instrument, the note's pitch and
 * velocity, and a sustain sized to the note's beat length.
 *
 * SYNCHRONOUS and CPU-bound — a full soundtrack cue is a multi-second block on a
 * phone. Fine headlessly (tests, offline analysis) and off any interactive
 * frame, but NEVER call it during a step/render. To start music in a running
 * game, pre-render off the hot path with {@link renderSongAsync} (or
 * `AudioBus.prepareSong`) and play the prepared buffer.
 */
export function renderSong(song: Song, opts: RenderSongOptions = {}): StereoBuffer {
  const it = renderSongSteps(song, opts);
  let step = it.next();
  while (!step.done) step = it.next();
  return step.value;
}

/**
 * Cooperative render: identical output to {@link renderSong} — same generator
 * drives both — but it yields to the event loop between synthesis units, so it
 * never blocks the main thread for more than a work batch. This is the path a
 * running game uses to build a cue without a visible hitch (input and rendering
 * keep flowing while it works). Deterministic; the yielding never touches output.
 */
export async function renderSongAsync(song: Song, opts: RenderSongAsyncOptions = {}): Promise<StereoBuffer> {
  const batch = Math.max(1, Math.floor(opts.yieldEvery ?? 1));
  const it = renderSongSteps(song, opts);
  let units = 0;
  let step = it.next();
  while (!step.done) {
    if (++units % batch === 0) await yieldToScheduler();
    step = it.next();
  }
  return step.value;
}

/**
 * The single source of truth for a render, expressed as a generator so the sync
 * and async drivers share one code path (byte-identical output). It `yield`s
 * once per synthesized note and once per master-bus pass — the coarse units a
 * cooperative driver pauses on.
 */
function* renderSongSteps(song: Song, opts: RenderSongOptions): Generator<void, StereoBuffer, void> {
  const sr = opts.sampleRate ?? SAMPLE_RATE;
  const a4 = song.a4 ?? 440;
  const secPerBeat = 60 / song.bpm;
  const tail = song.tailSec ?? 2;
  const durSec = songDuration(song) + tail;
  const bus = createStereo(durSec, sr);

  const swing = Math.max(0, Math.min(1, song.swing ?? 0));
  const humanize = Math.max(0, Math.min(1, song.humanize ?? 0));
  const velBright = Math.max(0, Math.min(1, song.velBrightness ?? 0.5));

  // Per-track reverb sends (mixing-desk model): if any track opts in, we build a
  // parallel send bus and bloom only that, leaving the dry mix dry. Otherwise
  // sendBus stays null and reverb is the classic whole-mix pass (bit-identical).
  const useSends = song.tracks.some((t) => t.reverbSend !== undefined);
  const sendBus = useSends ? createStereo(durSec, sr) : null;

  for (let ti = 0; ti < song.tracks.length; ti++) {
    const track = song.tracks[ti];
    const gain = track.gain ?? 0.7;
    const pan = track.pan ?? 0;
    const send = Math.max(0, Math.min(1, track.reverbSend ?? 0));
    const rng = new Rng(0x50c1a1 ^ (ti + 1) * 0x9e3779b9);
    let beat = 0;
    for (const idx of track.sequence) {
      const pattern = track.patterns[idx];
      if (!pattern) continue;
      for (const note of pattern) {
        if (note.pitch !== null && note.pitch !== undefined) {
          // Swing: push off-beat 8ths later (straight 8ths → shuffled feel).
          // A note on an odd 8th (the "and") slides toward the triplet grid.
          const eighth = Math.round(beat * 2);
          const onOff8 = Math.abs(beat * 2 - eighth) < 1e-4 && eighth % 2 === 1;
          const swingBeat = onOff8 ? beat + swing * 0.2 : beat;
          // Humanize: tiny seeded timing (±ms) and velocity nudges so it breathes.
          const timeJitter = humanize > 0 ? rng.range(-1, 1) * humanize * 0.012 : 0;
          const startSample = Math.round((swingBeat * secPerBeat + timeJitter) * sr);
          const noteSec = note.beats * secPerBeat;
          const velJitter = humanize > 0 ? rng.range(-1, 1) * humanize * 0.12 : 0;
          const vel = Math.max(0.05, Math.min(1, (note.vel ?? 1) + velJitter));
          const pitches = Array.isArray(note.pitch) ? note.pitch : [note.pitch];
          const attack = track.instrument.attack ?? 0.005;
          const decay = track.instrument.decay ?? 0;
          const sustain = Math.max(0.01, noteSec - attack - decay);
          // Velocity → brightness: soft notes get a lower cutoff, so a velocity
          // map reads as dynamics/timbre, not just loudness.
          const baseLp = track.instrument.lowpass;
          const lp = baseLp && velBright > 0 ? baseLp * (1 - velBright * (1 - vel)) : baseLp;
          for (const p of pitches) {
            const spec: SoundSpec = {
              ...track.instrument,
              freq: pitchToFreq(p, a4),
              sustain,
              volume: (track.instrument.volume ?? 0.5) * vel,
              ...(lp !== undefined ? { lowpass: lp } : {}),
            };
            const sig = renderSound(spec, { rng, sampleRate: sr });
            const at = Math.max(0, startSample);
            mixMono(bus, sig, at, gain, pan);
            if (sendBus && send > 0) mixMono(sendBus, sig, at, gain * send, pan);
          }
          yield; // one synthesized note = one cooperative work unit
        }
        beat += note.beats;
      }
    }
  }

  if (song.sidechain) {
    const depth = Math.max(0, Math.min(1, song.sidechain.depth ?? 0.5));
    const cycleSec = (song.sidechain.beatsPerCycle ?? 1) * secPerBeat;
    yield* pumpSteps(bus, cycleSec, depth);
  }
  if (song.reverb) {
    if (sendBus) yield* reverbSendSteps(bus, sendBus, song.reverb, RENDER_WINDOW);
    else yield* reverbSteps(bus, song.reverb, RENDER_WINDOW);
  }
  if (song.master) yield* masterEqSteps(bus, song.master);
  if (song.master?.compress) yield* compressorSteps(bus, song.master.compress);
  softClipInPlace(bus);
  normalize(bus, opts.normalizePeak ?? 0.89);
  return bus;
}

/** Samples processed per cooperative window in the per-sample master passes.
 * Sized so one window is a small fraction of a frame even on a phone. */
const RENDER_WINDOW = 8192;

/**
 * Hand control back to the host so input and rendering can run between render
 * batches. Prefers a MessageChannel macrotask (not clamped like setTimeout, and
 * it lets the browser paint), then setTimeout, then a microtask as a last resort.
 * Never affects render output — only when the work happens.
 */
function yieldToScheduler(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof MessageChannel !== 'undefined') {
      const ch = new MessageChannel();
      ch.port1.onmessage = () => {
        ch.port1.close();
        resolve();
      };
      ch.port2.postMessage(0);
    } else if (typeof setTimeout !== 'undefined') {
      setTimeout(resolve, 0);
    } else {
      queueMicrotask(resolve);
    }
  });
}

/**
 * Gentle glue compressor with auto makeup. A feed-forward peak follower drives
 * a soft-knee gain reduction; `amount` (0..1) scales how hard it works. Evens
 * out dynamics and lifts perceived loudness — the mastering move that keeps a
 * sparse ballad from sounding weak next to a dense funk cut. Deterministic.
 */
function* compressorSteps(bus: StereoBuffer, amount: number): Generator<void, void, void> {
  const amt = Math.max(0, Math.min(1, amount));
  const sr = bus.sampleRate;
  const threshold = dbToLin(-20); // dB → linear
  const ratio = 2 + amt * 3; // 2:1 … 5:1
  const aAtt = dexp(-1 / (sr * 0.005)); // 5 ms attack
  const aRel = dexp(-1 / (sr * 0.15)); // 150 ms release
  const makeup = dbToLin(amt * 6); // up to +6 dB makeup
  let env = 0;
  const L = bus.left;
  const R = bus.right;
  for (let i = 0; i < L.length; i++) {
    const x = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    const coeff = x > env ? aAtt : aRel;
    env = coeff * env + (1 - coeff) * x;
    let gain = 1;
    if (env > threshold) {
      // soft-knee-ish: compress the amount over threshold by the ratio
      const over = env / threshold;
      const compressed = threshold * dpow(over, 1 / ratio);
      gain = compressed / env;
    }
    const g = gain * makeup;
    L[i] *= g;
    R[i] *= g;
    if ((i + 1) % RENDER_WINDOW === 0) yield;
  }
}

/** dB → linear amplitude (2^(dB/6.0206)); Math.pow is banned in src. */
function dbToLin(db: number): number {
  return dexp2(db / 6.020599913);
}

/**
 * A light master-EQ pass: tuck lows and lift presence/air so a warm, lowpassed
 * synth mix doesn't turn boomy and the melody stays clear. Built from one-pole
 * shelves (subtract a lowpassed copy for the cut, add highpassed copies for the
 * lifts). Deterministic — pure per-sample arithmetic.
 */
function* masterEqSteps(bus: StereoBuffer, m: { lowCut?: number; presence?: number; air?: number }): Generator<void, void, void> {
  const sr = bus.sampleRate;
  const lowCut = Math.max(0, m.lowCut ?? 0);
  const presence = Math.max(0, m.presence ?? 0);
  const air = Math.max(0, m.air ?? 0);
  const coeff = (fc: number) => {
    const x = TAU * fc * (1 / sr);
    return x / (x + 1);
  };
  const aLow = coeff(240); // tuck the boomy region below ~240 Hz
  const aPres = 1 - coeff(3200); // presence band above ~3.2 kHz
  const aAir = 1 - coeff(9000); // air above ~9 kHz
  for (const ch of [bus.left, bus.right]) {
    let lp = 0;
    let hpP = 0;
    let hpPx = 0;
    let hpA = 0;
    let hpAx = 0;
    for (let i = 0; i < ch.length; i++) {
      const x = ch[i];
      lp += aLow * (x - lp);
      hpP = aPres * (hpP + x - hpPx);
      hpPx = x;
      hpA = aAir * (hpA + x - hpAx);
      hpAx = x;
      ch[i] = x - lowCut * lp + presence * hpP + air * hpA;
      if ((i + 1) % RENDER_WINDOW === 0) yield; // suspension preserves the filter state
    }
  }
}

/**
 * Apply a beat-synced ducking envelope (sidechain pump): the gain dips at each
 * cycle start and recovers over the cycle. Deterministic — a pure function of
 * sample index. The classic "four-on-the-floor breathing" without a compressor.
 */
function* pumpSteps(bus: StereoBuffer, cycleSec: number, depth: number): Generator<void, void, void> {
  const sr = bus.sampleRate;
  const period = Math.max(1, cycleSec * sr);
  for (let i = 0; i < bus.left.length; i++) {
    const frac = (i % period) / period; // 0 at the beat → 1 at the next
    const recover = 1 - frac;
    const duck = 1 - depth * recover * recover; // sharp dip, quick recover
    bus.left[i] *= duck;
    bus.right[i] *= duck;
    if ((i + 1) % RENDER_WINDOW === 0) yield;
  }
}

/**
 * A small library of ready-to-use instrument voices. These are the "adopt a
 * timbre" defaults so a composer starts from something musical, then tweaks.
 */
export const INSTRUMENTS: Record<string, Instrument> = {
  // ── melodic ──
  lead: { wave: 'square', duty: 0.5, attack: 0.008, release: 0.08, volume: 0.4, lowpass: 4000, detune: 6 },
  pluck: { wave: 'triangle', attack: 0.002, decay: 0.06, sustainLevel: 0.3, release: 0.12, volume: 0.42 },
  pad: { wave: 'saw', attack: 0.12, release: 0.5, volume: 0.26, lowpass: 2200, vibrato: 0.08, vibratoFreq: 4, detune: 14 },
  bell: { wave: 'sine', attack: 0.002, decay: 0.3, sustainLevel: 0.2, release: 0.5, volume: 0.4, fm: 3, fmFreq: 220 },
  // piano-ish: bright mallet attack, harmonic decay to a low sustain
  piano: { wave: 'triangle', attack: 0.002, decay: 0.5, sustainLevel: 0.12, release: 0.35, volume: 0.42, lowpass: 3600, detune: 4 },
  // electric piano / Rhodes: FM tine bark + long bloom
  rhodes: { wave: 'sine', attack: 0.003, decay: 0.45, sustainLevel: 0.35, release: 0.4, volume: 0.4, fm: 2.2, fmFreq: 440, detune: 5 },
  // string ensemble: detuned saws, slow bow, gentle vibrato
  strings: { wave: 'saw', attack: 0.16, decay: 0.2, sustainLevel: 0.85, release: 0.6, volume: 0.24, lowpass: 2600, detune: 16, vibrato: 0.07, vibratoFreq: 5 },
  // brass: bright saw with a punchy front
  brass: { wave: 'saw', attack: 0.04, decay: 0.1, sustainLevel: 0.8, release: 0.16, volume: 0.3, lowpass: 3200, detune: 8, punch: 0.3 },
  // organ: sine with sub weight and drawbar-ish steadiness
  organ: { wave: 'sine', attack: 0.006, release: 0.05, sustainLevel: 1, volume: 0.32, sub: 0.5, detune: 3 },
  // choir "aah": soft, wide, slow
  choir: { wave: 'triangle', attack: 0.28, release: 0.9, sustainLevel: 0.9, volume: 0.22, lowpass: 2000, detune: 20, vibrato: 0.1, vibratoFreq: 4.5 },
  glocken: { wave: 'sine', attack: 0.001, decay: 0.6, sustainLevel: 0, release: 0.4, volume: 0.34, fm: 4, fmFreq: 1600 },
  // ── jazz / funk voices ──
  // vibraphone: soft FM bell, slow bloom, gentle tremolo (motor)
  vibraphone: { wave: 'sine', attack: 0.002, decay: 0.5, sustainLevel: 0.25, release: 0.7, volume: 0.4, fm: 2, fmFreq: 880, tremolo: 0.25, tremoloFreq: 5 },
  // clavinet: bright, percussive, funky — square with a fast pluck
  clav: { wave: 'square', duty: 0.35, attack: 0.001, decay: 0.08, sustainLevel: 0.25, release: 0.08, volume: 0.32, lowpass: 3800, detune: 4 },
  // upright/electric bass: round, short, a little sub
  uprightBass: { wave: 'triangle', attack: 0.004, decay: 0.12, sustainLevel: 0.5, release: 0.1, volume: 0.5, lowpass: 1100, sub: 0.35 },
  // muted trumpet: reedy saw, filtered, a touch of vibrato
  mutedTrumpet: { wave: 'saw', attack: 0.03, decay: 0.08, sustainLevel: 0.75, release: 0.14, volume: 0.3, lowpass: 2600, detune: 4, vibrato: 0.09, vibratoFreq: 6 },
  // jazz guitar: warm triangle pluck
  jazzGuitar: { wave: 'triangle', attack: 0.004, decay: 0.35, sustainLevel: 0.2, release: 0.25, volume: 0.34, lowpass: 2400, detune: 5 },
  // horn section stab: brighter, punchier brass
  horns: { wave: 'saw', attack: 0.02, decay: 0.08, sustainLevel: 0.7, release: 0.12, volume: 0.3, lowpass: 3600, detune: 10, punch: 0.4 },
  // ── bass ──
  bass: { wave: 'saw', attack: 0.006, release: 0.06, volume: 0.5, lowpass: 900, detune: 6, sub: 0.3 },
  // smooth fingered electric bass (neo-soul / silky funk): a round TRIANGLE, not
  // a buzzy saw, kept dark (low lowpass) so it's all fundamental and no synth
  // fizz; a soft attack (no plucky click), a high sustain and long release so
  // notes flow legato into each other, and a little sub for warm weight.
  smoothBass: { wave: 'triangle', attack: 0.014, decay: 0.2, sustainLevel: 0.72, release: 0.2, volume: 0.5, lowpass: 820, sub: 0.34, detune: 2 },
  subBass: { wave: 'sine', attack: 0.004, release: 0.08, volume: 0.6, lowpass: 400, sub: 0.5, punch: 0.2 },
  // ── drums ──
  kick: { wave: 'sine', attack: 0.001, decay: 0.06, sustainLevel: 0, release: 0.08, slide: -24, volume: 0.7, sub: 0.3 },
  snare: { wave: 'noise', attack: 0.001, decay: 0.05, sustainLevel: 0.2, release: 0.12, highpass: 1200, volume: 0.5 },
  // A REAL snare is two layers — play both tracks on the same steps and it stops
  // sounding like filtered noise and starts sounding like a struck drum:
  //   snareBody — the head/shell being hit: a pitched triangle with a hard
  //   transient and a fast downward "thwack". Tune it around G3–D4 (the drum's
  //   fundamental); the pitch drop is what your ear reads as a drumhead.
  snareBody: { wave: 'triangle', attack: 0.001, decay: 0.085, sustainLevel: 0, release: 0.05, slide: -4, punch: 0.45, noise: 0.12, highpass: 140, lowpass: 3400, volume: 0.5 },
  //   snareWires — the snare wires buzzing against the bottom head: a bright,
  //   short noise tail layered on top. Pitch is irrelevant (it's noise).
  snareWires: { wave: 'noise', attack: 0.001, decay: 0.06, sustainLevel: 0.16, release: 0.13, highpass: 2200, lowpass: 9000, volume: 0.34 },
  hat: { wave: 'noise', attack: 0.001, release: 0.04, highpass: 6000, volume: 0.28 },
  rimshot: { wave: 'noise', attack: 0.001, release: 0.03, highpass: 3000, lowpass: 7000, volume: 0.3 },
  // ride cymbal: a clear "ping" with a short decaying wash — body, not sizzle
  ride: { wave: 'noise', attack: 0.001, decay: 0.1, sustainLevel: 0.14, release: 0.32, volume: 0.2, highpass: 1600, lowpass: 7000 },
};

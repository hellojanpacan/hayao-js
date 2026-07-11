// Procedural audio bus. Code-as-sound: zzfx-style tone synthesis + an ambient
// pad, no audio files. A no-op when there's no AudioContext (Node/headless), so
// automated runs are silent by construction (a narrow-js invariant).
//
// The bus also plays the data-driven engine: renderSound (SoundSpec → samples)
// and renderSong (Song → stereo mix) are pure and deterministic; here they're
// rendered at the live context's sample rate and pushed through the SFX/music
// buses as AudioBuffers, so the same specs that verify headlessly also sound.

import { renderSound, type SoundSpec } from './synth';
import { renderSongAsync, songDuration, type Song } from './music';
import { SAMPLE_RATE } from './pcm';
import { midiToFreq } from './theory';
import { barPhase, nextBarBoundary } from './loopdeck';

export interface Volumes {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

const DEFAULT_VOLUMES: Volumes = { master: 0.7, music: 0.6, sfx: 0.8, muted: false };

/** A playing sample instance (see AudioBus.playSample). */
export interface SampleHandle {
  /** Fade out over `fadeSec` (default: cut immediately) and end the instance. */
  stop(fadeSec?: number): void;
  /** Ramp this instance's own gain (independent of bus volumes). */
  setGain(v: number, rampSec?: number): void;
  /** False once ended or stopped. */
  playing: boolean;
}

/**
 * A song rendered to raw stereo samples, ready to play cheaply and repeatedly.
 * Rendering is the expensive part (see `renderSong`); a PreparedSong pays it
 * ONCE — off the hot path — so state swaps and restarts just re-wire a buffer.
 * Pure data: it can be built headlessly (before the AudioContext is unlocked),
 * so a game can pre-render every cue at load and never render during play.
 */
export interface PreparedSong {
  readonly left: Float32Array;
  readonly right: Float32Array;
  readonly sampleRate: number;
  /** Musical body length (excl. ring-out tail) — the loop point for seamless looping. */
  readonly loopEndSec: number;
}

/** A playing song instance (see AudioBus.playSong / playPrepared). */
export interface SongHandle {
  /** Fade out over `fadeSec` (default: cut immediately) and end the instance. */
  stop(fadeSec?: number): void;
  /** False once ended, stopped, or (for playSong) before playback has begun. */
  playing: boolean;
  /**
   * Resolves once the song is rendered and playback has started — or earlier if
   * the handle was stopped first. `playPrepared` resolves immediately; `playSong`
   * resolves after its off-thread render. Await it only if you need that timing.
   */
  readonly ready: Promise<void>;
}

/** One stem handed to {@link AudioBus.startLoopDeck}: an id + its pre-rendered loop. */
export interface PreparedStem {
  id: string;
  prepared: PreparedSong;
  /**
   * Playback mix level for this stem (default 1). renderSong normalizes every
   * render to full scale, so a stem rendered ALONE loses its place in the
   * ensemble balance — this gain puts it back (author it with the stem).
   */
  gain?: number;
}

/**
 * A live LoopDeck (see src/audio/loopdeck.ts for the pure half). All stems
 * loop phase-locked from one shared start; `setStem` raises/lowers a stem's
 * gain on the NEXT BAR BOUNDARY so every join lands in the pocket.
 */
export interface LoopDeckHandle {
  /**
   * Wake or sleep a stem. The change is scheduled for the next bar boundary;
   * returns the deck-elapsed time (seconds) it will land at, or null for an
   * unknown id / stopped deck. Toggling an already-pending stem re-targets it.
   */
  setStem(id: string, on: boolean): number | null;
  /** True if the stem is audible or scheduled to become audible. */
  stemOn(id: string): boolean;
  /** Position in the current bar 0..1 — the animation/UI sync signal. */
  phase(): number;
  /** Deck-elapsed seconds since the shared start instant. */
  elapsed(): number;
  /** Seconds in one bar (the toggle grid). */
  readonly secPerBar: number;
  /** Fade everything out and release the sources. */
  stop(fadeSec?: number): void;
  playing: boolean;
}

/** A single zzfx-ish tone spec. */
export interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  /** Stereo position -1 (left) … 1 (right) — the spatial-audio hook. */
  pan?: number;
}

export class AudioBus {
  private _ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private vol: Volumes = { ...DEFAULT_VOLUMES };
  private padOn = false;

  /**
   * The live AudioContext (null until `start()` unlocks audio). External
   * synths being ported in (bundled ZzFX/ZzFXM, hand-rolled Web Audio) should
   * create their sources ON this context — never their own — so they inherit
   * the autoplay unlock the user gesture already paid for.
   */
  get ctx(): AudioContext | null {
    return this._ctx;
  }
  /**
   * The SFX mix bus (null until `start()`). Connect external one-shot sources
   * here instead of `ctx.destination` so master/sfx volume and mute apply.
   */
  get sfxBus(): AudioNode | null {
    return this.sfxGain;
  }
  /**
   * The music mix bus (null until `start()`). Connect external music sources
   * (e.g. a ZzFXM-rendered buffer) here so master/music volume and mute apply.
   */
  get musicBus(): AudioNode | null {
    return this.musicGain;
  }

  get available(): boolean {
    return typeof globalThis.AudioContext !== 'undefined' || 'webkitAudioContext' in globalThis;
  }
  get started(): boolean {
    return !!this._ctx;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  start(): void {
    if (this._ctx) {
      void this._ctx.resume();
      return;
    }
    if (!this.available) return;
    const Ctx =
      globalThis.AudioContext ||
      (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this._ctx = new Ctx();
    this.master = this._ctx.createGain();
    this.musicGain = this._ctx.createGain();
    this.sfxGain = this._ctx.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this._ctx.destination);
    this.applyVolumes();
  }

  setVolumes(v: Partial<Volumes>): void {
    this.vol = { ...this.vol, ...v };
    this.applyVolumes();
  }
  getVolumes(): Volumes {
    return { ...this.vol };
  }

  private applyVolumes(): void {
    if (!this._ctx || !this.master || !this.musicGain || !this.sfxGain) return;
    const t = this._ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.muted ? 0 : this.vol.master, t, 0.04);
    this.musicGain.gain.setTargetAtTime(this.vol.music * 0.5, t, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.vol.sfx, t, 0.04);
  }

  /** Play a single tone (no-op if audio unstarted). */
  tone(spec: Tone): void {
    if (!this._ctx || !this.sfxGain) return;
    const { freq, duration, type = 'sine', gain = 0.2, delay = 0, pan } = spec;
    const t = this._ctx.currentTime + delay;
    const osc = this._ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this._ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    if (pan !== undefined && typeof this._ctx.createStereoPanner === 'function') {
      const p = this._ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p);
      p.connect(this.sfxGain);
    } else {
      g.connect(this.sfxGain);
    }
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  /**
   * A positional cue: gain falls with distance, pan follows the horizontal
   * offset. dx/dist in design-space px; hearing range sets the falloff.
   */
  spatial(freq: number, dx: number, dist: number, hearing = 600, duration = 0.18, type: OscillatorType = 'sawtooth'): void {
    if (dist > hearing) return;
    const near = 1 - dist / hearing;
    this.tone({ freq, duration, type, gain: 0.04 + near * near * 0.3, pan: Math.max(-1, Math.min(1, dx / (hearing * 0.6))) });
  }

  /** Play a sequence of tones as an arpeggio/chord. */
  play(tones: Tone[]): void {
    for (const t of tones) this.tone(t);
  }

  /**
   * Play a data-defined SoundSpec through the SFX bus. The spec is rendered to
   * samples (deterministically, at the context rate) and played as an
   * AudioBuffer — the same SoundSpec that a verify suite proves headlessly.
   * No-op without an AudioContext.
   */
  playSpec(spec: SoundSpec, opts: { pan?: number; gain?: number; when?: number } = {}): void {
    if (!this._ctx || !this.sfxGain) return;
    const sig = renderSound(spec, { sampleRate: this._ctx.sampleRate });
    const buf = this._ctx.createBuffer(1, sig.length, this._ctx.sampleRate);
    buf.copyToChannel(new Float32Array(sig), 0);
    const src = this._ctx.createBufferSource();
    src.buffer = buf;
    const g = this._ctx.createGain();
    g.gain.value = opts.gain ?? 1;
    src.connect(g);
    if (opts.pan !== undefined && typeof this._ctx.createStereoPanner === 'function') {
      const p = this._ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      g.connect(p);
      p.connect(this.sfxGain);
    } else {
      g.connect(this.sfxGain);
    }
    src.start(this._ctx.currentTime + (opts.when ?? 0));
  }

  /**
   * Render a Song to raw stereo samples OFF the hot path (cooperative,
   * event-loop-yielding) and return a reusable {@link PreparedSong}. This is
   * where the multi-second synthesis cost is paid — once — so `playPrepared` is
   * cheap and re-loopable. Works headlessly: no AudioContext is required to
   * render, so a game can `await audio.prepareSong(cue)` at load and hold the
   * result. Rendered at the live context's rate when started (else 44.1 kHz; a
   * rate mismatch is resampled transparently at playback).
   */
  async prepareSong(song: Song, opts: { sampleRate?: number; yieldEvery?: number } = {}): Promise<PreparedSong> {
    const sampleRate = opts.sampleRate ?? this._ctx?.sampleRate ?? SAMPLE_RATE;
    const mix = await renderSongAsync(song, { sampleRate, yieldEvery: opts.yieldEvery });
    return { left: mix.left, right: mix.right, sampleRate, loopEndSec: songDuration(song) };
  }

  /**
   * Play an already-rendered {@link PreparedSong} on the music bus. Cheap (just
   * wires a buffer source — no synthesis) and re-callable, so looping swaps and
   * restarts never re-render. `loop` repeats the musical body (excluding the
   * ring-out tail). No-op without an AudioContext.
   */
  playPrepared(prepared: PreparedSong, opts: { loop?: boolean; gain?: number } = {}): SongHandle {
    if (!this._ctx || !this.musicGain) return deadSong();
    const ctx = this._ctx;
    const buf = ctx.createBuffer(2, prepared.left.length, prepared.sampleRate);
    buf.copyToChannel(new Float32Array(prepared.left), 0);
    buf.copyToChannel(new Float32Array(prepared.right), 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (opts.loop) {
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = prepared.loopEndSec; // loop the body, not the tail
    }
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 1;
    src.connect(g);
    g.connect(this.musicGain);
    src.start();
    const handle: SongHandle = {
      playing: true,
      ready: Promise.resolve(),
      stop(fadeSec = 0) {
        if (!handle.playing) return;
        handle.playing = false;
        try {
          if (fadeSec > 0) {
            g.gain.setTargetAtTime(0, ctx.currentTime, fadeSec / 3);
            src.stop(ctx.currentTime + fadeSec + 0.1);
          } else src.stop();
        } catch {
          /* already stopped */
        }
      },
    };
    src.onended = () => (handle.playing = false);
    return handle;
  }

  /**
   * Play a Song on the music bus WITHOUT blocking. Returns a handle immediately;
   * the render runs off the hot path (see {@link prepareSong}) and playback
   * begins when it's ready. `stop()` works before or after that — if you stop
   * early, playback never starts. `handle.ready` resolves once it's playing.
   *
   * For music that starts on a state swap (menu → play) or restarts often,
   * prefer `prepareSong` at load + `playPrepared` on the swap: same non-blocking
   * guarantee, and zero re-render. No-op without an AudioContext.
   */
  playSong(song: Song, opts: { loop?: boolean; gain?: number; yieldEvery?: number } = {}): SongHandle {
    let stopped = false;
    let inner: SongHandle | null = null;
    let pendingFade: number | null = null;
    const ready = this.prepareSong(song, { yieldEvery: opts.yieldEvery }).then((prepared) => {
      if (stopped) return;
      inner = this.playPrepared(prepared, { loop: opts.loop, gain: opts.gain });
      if (pendingFade !== null) inner.stop(pendingFade);
    });
    return {
      get playing() {
        return inner ? inner.playing : !stopped;
      },
      ready,
      stop(fadeSec = 0) {
        stopped = true;
        if (inner) inner.stop(fadeSec);
        else pendingFade = fadeSec;
      },
    };
  }

  /**
   * Start a LoopDeck: every prepared stem becomes a looping source on the
   * music bus, all started at the SAME context instant (phase-locked), each
   * behind its own gain — silent until woken. `setStem(id, true)` schedules
   * the gain rise on the next bar boundary; sleeping schedules the fall the
   * same way, so the mix only ever changes on downbeats. Stems must come from
   * a deck that passed `lintDeck` (equal-tempo, bar-multiple, divisor-length
   * loops) — this method trusts, it does not re-check.
   *
   * No-op without an AudioContext (returns a dead handle) — playback is a
   * cosmetic observer, never sim state.
   */
  startLoopDeck(stems: PreparedStem[], opts: { secPerBar: number; gain?: number; rampSec?: number }): LoopDeckHandle {
    const deadDeck: LoopDeckHandle = {
      setStem: () => null,
      stemOn: () => false,
      phase: () => 0,
      elapsed: () => 0,
      secPerBar: opts.secPerBar,
      stop() {},
      playing: false,
    };
    if (!this._ctx || !this.musicGain) return deadDeck;
    const ctx = this._ctx;
    const stemGain = opts.gain ?? 1;
    // A short ramp centred on the boundary reads as a musical join, not a click.
    const ramp = Math.max(0.005, opts.rampSec ?? 0.03);
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(this.musicGain);
    const voices = new Map<string, { src: AudioBufferSourceNode; g: GainNode; on: boolean; level: number }>();
    // Start slightly in the future so every source begins at the same instant.
    const t0 = ctx.currentTime + 0.06;
    for (const stem of stems) {
      // No defensive copies: PreparedSong channels are already Float32Arrays,
      // and a deck of many stems makes the duplicate allocation real memory.
      const buf = ctx.createBuffer(2, stem.prepared.left.length, stem.prepared.sampleRate);
      buf.copyToChannel(stem.prepared.left as Float32Array<ArrayBuffer>, 0);
      buf.copyToChannel(stem.prepared.right as Float32Array<ArrayBuffer>, 1);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = stem.prepared.loopEndSec; // loop the body, not the tail
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g);
      g.connect(master);
      src.start(t0);
      voices.set(stem.id, { src, g, on: false, level: (stem.gain ?? 1) * stemGain });
    }
    const handle: LoopDeckHandle = {
      playing: true,
      secPerBar: opts.secPerBar,
      elapsed: () => Math.max(0, ctx.currentTime - t0),
      phase: () => barPhase(Math.max(0, ctx.currentTime - t0), opts.secPerBar),
      setStem(id, on) {
        const v = voices.get(id);
        if (!v || !handle.playing) return null;
        v.on = on;
        const at = nextBarBoundary(Math.max(0, ctx.currentTime - t0), opts.secPerBar);
        const when = Math.max(ctx.currentTime, t0 + at);
        v.g.gain.cancelScheduledValues(when);
        v.g.gain.setValueAtTime(v.g.gain.value, when);
        v.g.gain.linearRampToValueAtTime(on ? v.level : 0, when + ramp);
        return at;
      },
      stemOn: (id) => voices.get(id)?.on ?? false,
      stop(fadeSec = 0) {
        if (!handle.playing) return;
        handle.playing = false;
        const t = ctx.currentTime;
        try {
          if (fadeSec > 0) master.gain.setTargetAtTime(0, t, fadeSec / 3);
          for (const v of voices.values()) v.src.stop(t + fadeSec + 0.1);
        } catch {
          /* already stopped */
        }
      },
    };
    return handle;
  }

  // ── Sample playback (recorded audio files) ─────────────────────
  // Synthesis-first stays the doctrine — specs verify headlessly, files don't —
  // but "play this one recorded sting" shouldn't require resynthesis. Samples
  // route through the same sfx/music buses, so volumes and mute still apply.

  private sampleCache = new Map<string, Promise<AudioBuffer | null>>();

  /**
   * Fetch + decode an audio file (mp3/ogg/wav) into an AudioBuffer, cached by
   * URL. Requires a started bus (user gesture); resolves null on any failure —
   * a missing asset must never crash a game. Headless: always null.
   */
  loadSample(url: string): Promise<AudioBuffer | null> {
    if (!this._ctx) return Promise.resolve(null);
    let p = this.sampleCache.get(url);
    if (!p) {
      p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status}`))))
        .then((ab) => this._ctx!.decodeAudioData(ab))
        .catch(() => null);
      this.sampleCache.set(url, p);
    }
    return p;
  }

  /**
   * Play a decoded sample. Returns a live handle: `stop(fadeSec)` fades out and
   * ends it, `setGain(v, rampSec)` adjusts it mid-flight — the per-instance
   * controls one-shot tones don't need but loops and stingers do.
   */
  playSample(buf: AudioBuffer, opts: { gain?: number; pan?: number; loop?: boolean; when?: number; music?: boolean } = {}): SampleHandle {
    const dead: SampleHandle = { stop() {}, setGain() {}, playing: false };
    const bus = opts.music ? this.musicGain : this.sfxGain;
    if (!this._ctx || !bus) return dead;
    const ctx = this._ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = opts.loop ?? false;
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 1;
    src.connect(g);
    if (opts.pan !== undefined && typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      g.connect(p);
      p.connect(bus);
    } else {
      g.connect(bus);
    }
    src.start(ctx.currentTime + (opts.when ?? 0));
    const handle: SampleHandle = {
      playing: true,
      stop(fadeSec = 0) {
        if (!handle.playing) return;
        handle.playing = false;
        try {
          if (fadeSec > 0) {
            g.gain.setTargetAtTime(0, ctx.currentTime, fadeSec / 3);
            src.stop(ctx.currentTime + fadeSec + 0.1);
          } else src.stop();
        } catch {
          /* already stopped */
        }
      },
      setGain(v: number, rampSec = 0.02) {
        g.gain.setTargetAtTime(v, ctx.currentTime, Math.max(0.001, rampSec / 3));
      },
    };
    src.onended = () => (handle.playing = false);
    return handle;
  }

  /** Convenience SFX. */
  blip(freq = 520): void {
    this.tone({ freq, duration: 0.06, type: 'sine', gain: 0.18 });
  }
  chime(): void {
    [523.25, 659.25, 783.99].forEach((f, i) => this.tone({ freq: f, duration: 0.9 - i * 0.15, type: 'sine', gain: 0.15, delay: i * 0.04 }));
  }
  /** The signature cold-open cue — the pane announcing "you are somewhere now" (see BOOT_CHIME). */
  bootChime(): void {
    for (const t of bootChimeScore()) this.tone(t);
  }
  success(): void {
    [392, 493.88, 587.33, 783.99].forEach((f, i) => this.tone({ freq: f, duration: 0.4, type: 'triangle', gain: 0.15, delay: i * 0.08 }));
  }
  thud(): void {
    this.tone({ freq: 130, duration: 0.14, type: 'sine', gain: 0.22 });
  }

  /** Start a soft evolving ambient pad on the music bus. */
  startAmbient(root = 110, voices = [1, 1.5, 2, 2.5]): void {
    if (!this._ctx || !this.musicGain || this.padOn) return;
    this.padOn = true;
    const filter = this._ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(this.musicGain);
    const bus = this._ctx.createGain();
    bus.gain.value = 0;
    bus.connect(filter);
    for (const mult of voices) {
      const osc = this._ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = root * mult;
      const g = this._ctx.createGain();
      g.gain.value = 0.1 / voices.length;
      osc.connect(g);
      g.connect(bus);
      osc.start();
    }
    bus.gain.setTargetAtTime(0.9, this._ctx.currentTime, 3);
  }
}

// ── Boot chime ─────────────────────────────────────────────────────────────
// The signature "the pane just woke" gesture — cheap identity, high charm. The
// "Warm" voicing: a soft C-major-pentatonic climb dropped an octave (E3 G3 A3
// C4), four pure sine voices panning left→right onto a gently held landing. No
// bass bed, no ringing bell — just the warm rising sparkle. Deterministic by
// construction (fixed pitches/timings, no rng) and built from theory helpers so
// a test can assert the score never drifts; silent until the bus is started.
const BOOT_CHIME: ReadonlyArray<{ midi: number; type: OscillatorType; delay: number; duration: number; gain: number; pan: number }> = [
  { midi: 52, type: 'sine', delay: 0.0, duration: 0.6, gain: 0.12, pan: -0.28 }, //  E3
  { midi: 55, type: 'sine', delay: 0.09, duration: 0.6, gain: 0.12, pan: -0.1 }, //  G3
  { midi: 57, type: 'sine', delay: 0.18, duration: 0.65, gain: 0.12, pan: 0.1 }, //  A3
  { midi: 60, type: 'sine', delay: 0.27, duration: 1.05, gain: 0.12, pan: 0.28 }, // C4 — soft landing
];

/** A no-op song handle for headless/unstarted buses (already ended, nothing to stop). */
function deadSong(): SongHandle {
  return { stop() {}, playing: false, ready: Promise.resolve() };
}

/** The boot chime as a pure, deterministic list of tones (a4 defaults to 440). */
export function bootChimeScore(a4 = 440): Tone[] {
  return BOOT_CHIME.map((v) => ({ freq: midiToFreq(v.midi, a4), duration: v.duration, type: v.type, gain: v.gain, delay: v.delay, pan: v.pan }));
}

/** Shared default bus. */
export const audio = new AudioBus();

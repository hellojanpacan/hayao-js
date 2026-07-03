// Procedural audio bus. Code-as-sound: zzfx-style tone synthesis + an ambient
// pad, no audio files. A no-op when there's no AudioContext (Node/headless), so
// automated runs are silent by construction (a narrow-js invariant).

export interface Volumes {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

const DEFAULT_VOLUMES: Volumes = { master: 0.7, music: 0.6, sfx: 0.8, muted: false };

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
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private vol: Volumes = { ...DEFAULT_VOLUMES };
  private padOn = false;

  get available(): boolean {
    return typeof globalThis.AudioContext !== 'undefined' || 'webkitAudioContext' in globalThis;
  }
  get started(): boolean {
    return !!this.ctx;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    if (!this.available) return;
    const Ctx =
      globalThis.AudioContext ||
      (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);
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
    if (!this.ctx || !this.master || !this.musicGain || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.muted ? 0 : this.vol.master, t, 0.04);
    this.musicGain.gain.setTargetAtTime(this.vol.music * 0.5, t, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.vol.sfx, t, 0.04);
  }

  /** Play a single tone (no-op if audio unstarted). */
  tone(spec: Tone): void {
    if (!this.ctx || !this.sfxGain) return;
    const { freq, duration, type = 'sine', gain = 0.2, delay = 0, pan } = spec;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    if (pan !== undefined && typeof this.ctx.createStereoPanner === 'function') {
      const p = this.ctx.createStereoPanner();
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

  /** Convenience SFX. */
  blip(freq = 520): void {
    this.tone({ freq, duration: 0.06, type: 'sine', gain: 0.18 });
  }
  chime(): void {
    [523.25, 659.25, 783.99].forEach((f, i) => this.tone({ freq: f, duration: 0.9 - i * 0.15, type: 'sine', gain: 0.15, delay: i * 0.04 }));
  }
  success(): void {
    [392, 493.88, 587.33, 783.99].forEach((f, i) => this.tone({ freq: f, duration: 0.4, type: 'triangle', gain: 0.15, delay: i * 0.08 }));
  }
  thud(): void {
    this.tone({ freq: 130, duration: 0.14, type: 'sine', gain: 0.22 });
  }

  /** Start a soft evolving ambient pad on the music bus. */
  startAmbient(root = 110, voices = [1, 1.5, 2, 2.5]): void {
    if (!this.ctx || !this.musicGain || this.padOn) return;
    this.padOn = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(this.musicGain);
    const bus = this.ctx.createGain();
    bus.gain.value = 0;
    bus.connect(filter);
    for (const mult of voices) {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = root * mult;
      const g = this.ctx.createGain();
      g.gain.value = 0.1 / voices.length;
      osc.connect(g);
      g.connect(bus);
      osc.start();
    }
    bus.gain.setTargetAtTime(0.9, this.ctx.currentTime, 3);
  }
}

/** Shared default bus. */
export const audio = new AudioBus();

// Dynamic music — a small adaptive score director built on the audio bus's
// oscillator tones. Each biome has a key + mood; a beat clock lays down a low
// pad, a bassline, and a melody drawn from the scale, and a THREAT intensity
// (0..1, from combat proximity) fades in percussion, lifts the tempo, and darkens
// the melody. Purely a browser-side listener: `audio.tone` no-ops headlessly, and
// the director only READS sim state, so determinism is untouched.
//
// (When the engine's full Song/renderSong music engine lands on main, this can be
// re-expressed as data; the adaptive-intensity contract stays the same.)

import { audio, dexp2 } from '@hayao';

const midiToFreq = (m: number): number => 440 * dexp2((m - 69) / 12);

interface BiomeMusic {
  root: number; // MIDI root
  scale: number[]; // semitone offsets
  melody: number[]; // scale-degree pattern (indices into scale, +7 = octave up)
  wave: OscillatorType;
}

const MINOR_PENT = [0, 3, 5, 7, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const MAJOR_PENT = [0, 2, 4, 7, 9];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

const MUSIC: Record<string, BiomeMusic> = {
  grove: { root: 45, scale: MINOR_PENT, melody: [0, 2, 1, 3, 2, 4, 3, 2], wave: 'triangle' }, // A — calm
  cistern: { root: 38, scale: DORIAN, melody: [0, 3, 2, 5, 4, 2, 3, 1], wave: 'sine' }, // D dorian — watery
  ember: { root: 40, scale: PHRYGIAN, melody: [0, 1, 3, 1, 4, 3, 1, 0], wave: 'sawtooth' }, // E phrygian — tense
  sky: { root: 55, scale: MAJOR_PENT, melody: [4, 2, 3, 4, 2, 1, 2, 0], wave: 'triangle' }, // G — airy, high
  heart: { root: 36, scale: MINOR, melody: [0, 2, 4, 3, 5, 4, 2, 0], wave: 'sine' }, // C minor — deep
};

/** Advances a per-biome score, adapting to a 0..1 threat intensity. */
export class MusicDirector {
  private m: BiomeMusic = MUSIC.grove;
  private clock = 0;
  private beat = 0;
  private intensity = 0;

  setBiome(biome: string): void {
    this.m = MUSIC[biome] ?? MUSIC.grove;
    this.beat = 0;
    this.clock = 0;
  }

  /** Call each frame with the smoothed threat intensity (0..1). */
  update(dt: number, targetIntensity: number): void {
    this.intensity += (Math.max(0, Math.min(1, targetIntensity)) - this.intensity) * Math.min(1, dt * 1.5);
    const bpm = 66 + this.intensity * 34;
    const beatDur = 60 / bpm;
    this.clock += dt;
    while (this.clock >= beatDur) {
      this.clock -= beatDur;
      this.playBeat(this.beat, beatDur);
      this.beat = (this.beat + 1) % 8;
    }
  }

  private note(midi: number, dur: number, gain: number, wave: OscillatorType, pan = 0, delay = 0): void {
    audio.tone({ freq: midiToFreq(midi), duration: dur, type: wave, gain, delay, pan });
  }

  private degree(i: number): number {
    const s = this.m.scale;
    const oct = Math.floor(i / s.length);
    const idx = ((i % s.length) + s.length) % s.length;
    return this.m.root + s[idx] + 12 * oct;
  }

  private playBeat(beat: number, beatDur: number): void {
    const inten = this.intensity;
    // pad chord every 4 beats: root + fifth + octave, long and soft
    if (beat % 4 === 0) {
      const r = this.m.root - 12;
      this.note(r, beatDur * 4.2, 0.05 + inten * 0.02, 'triangle', -0.2);
      this.note(r + this.m.scale[Math.min(2, this.m.scale.length - 1)], beatDur * 4.2, 0.04, 'triangle', 0.2);
      this.note(r + 12, beatDur * 4.0, 0.03, 'sine');
    }
    // bassline on the strong beats
    if (beat % 2 === 0) this.note(this.m.root - 12, beatDur * 1.4, 0.08 + inten * 0.03, 'triangle', 0, 0.0);
    // melody — one note per beat, brighter when calm, lower when threatened
    const deg = this.m.melody[beat % this.m.melody.length];
    const shade = inten > 0.5 ? -2 : 0; // darken under threat
    this.note(this.degree(deg) + 12 + shade, beatDur * 0.9, 0.05 + inten * 0.02, this.m.wave, (beat % 2 ? 0.25 : -0.25));
    // threat percussion: a low pulse every beat + an offbeat tick
    if (inten > 0.15) {
      this.note(this.m.root - 24, 0.09, 0.06 * inten, 'sine');
      if (inten > 0.5 && beat % 2 === 1) this.note(this.m.root + 24, 0.04, 0.03 * inten, 'square', 0.4);
    }
  }
}

export { midiToFreq };

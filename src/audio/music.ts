// Music composition as data. A Song is a plain, LLM-authorable object: tracks,
// each an Instrument (a SoundSpec voice template) plus reusable patterns of
// {pitch, beats, vel} notes sequenced by index (the ZzFXM/tracker model, but
// with named fields and TinyMusic-style note payloads). renderSong mixes it all
// down to a StereoBuffer through the SAME deterministic synth core as SFX — no
// Web Audio, no files, fully headless and hashable.

import { Rng } from '../core/rng';
import { renderSound, type SoundSpec } from './synth';
import { pitchToFreq } from './theory';
import { applyReverb, type ReverbOptions } from './reverb';
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

/**
 * Render a Song to a stereo buffer. Deterministic: a per-track seeded Rng feeds
 * any noise voices, so the same Song always produces the same mix. Notes are
 * synthesized via renderSound with the track's instrument, the note's pitch and
 * velocity, and a sustain sized to the note's beat length.
 */
export function renderSong(song: Song, opts: { sampleRate?: number; normalizePeak?: number } = {}): StereoBuffer {
  const sr = opts.sampleRate ?? SAMPLE_RATE;
  const a4 = song.a4 ?? 440;
  const secPerBeat = 60 / song.bpm;
  const tail = song.tailSec ?? 2;
  const durSec = songDuration(song) + tail;
  const bus = createStereo(durSec, sr);

  song.tracks.forEach((track, ti) => {
    const gain = track.gain ?? 0.7;
    const pan = track.pan ?? 0;
    const rng = new Rng(0x50c1a1 ^ (ti + 1) * 0x9e3779b9);
    let beat = 0;
    for (const idx of track.sequence) {
      const pattern = track.patterns[idx];
      if (!pattern) continue;
      for (const note of pattern) {
        if (note.pitch !== null && note.pitch !== undefined) {
          const startSample = Math.round(beat * secPerBeat * sr);
          const noteSec = note.beats * secPerBeat;
          const vel = note.vel ?? 1;
          const pitches = Array.isArray(note.pitch) ? note.pitch : [note.pitch];
          const attack = track.instrument.attack ?? 0.005;
          const decay = track.instrument.decay ?? 0;
          const sustain = Math.max(0.01, noteSec - attack - decay);
          for (const p of pitches) {
            const spec: SoundSpec = {
              ...track.instrument,
              freq: pitchToFreq(p, a4),
              sustain,
              volume: (track.instrument.volume ?? 0.5) * vel,
            };
            const sig = renderSound(spec, { rng, sampleRate: sr });
            mixMono(bus, sig, startSample, gain, pan);
          }
        }
        beat += note.beats;
      }
    }
  });

  softClipInPlace(bus);
  normalize(bus, opts.normalizePeak ?? 0.89);
  return bus;
}

/**
 * A small library of ready-to-use instrument voices. These are the "adopt a
 * timbre" defaults so a composer starts from something musical, then tweaks.
 */
export const INSTRUMENTS: Record<string, Instrument> = {
  lead: { wave: 'square', duty: 0.5, attack: 0.008, release: 0.08, volume: 0.4, lowpass: 4000 },
  pluck: { wave: 'triangle', attack: 0.002, decay: 0.06, sustainLevel: 0.3, release: 0.12, volume: 0.42 },
  bass: { wave: 'saw', attack: 0.006, release: 0.06, volume: 0.5, lowpass: 900 },
  pad: { wave: 'saw', attack: 0.12, release: 0.5, volume: 0.28, lowpass: 2200, vibrato: 0.1, vibratoFreq: 4 },
  bell: { wave: 'sine', attack: 0.002, decay: 0.3, sustainLevel: 0.2, release: 0.5, volume: 0.4, fm: 3, fmFreq: 220 },
  kick: { wave: 'sine', attack: 0.001, decay: 0.06, sustainLevel: 0, release: 0.08, slide: -24, volume: 0.7 },
  snare: { wave: 'noise', attack: 0.001, decay: 0.05, sustainLevel: 0.2, release: 0.12, highpass: 1200, volume: 0.5 },
  hat: { wave: 'noise', attack: 0.001, release: 0.04, highpass: 6000, volume: 0.28 },
};

// Music theory as pure data — the deterministic "oracle" a composer (human or
// LLM) leans on so it never has to invent harmony from scratch. Note↔MIDI↔freq,
// scales, diatonic chords, and roman-numeral progressions. A hand-rolled subset
// of tonal.js: zero dependencies, all pure, freq via dmath so it's bit-stable.

import { dexp2 } from '../core/dmath';

const NAMES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, Fb: 4, 'E#': 5,
  F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11, Cb: 11, 'B#': 0,
};
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Parse scientific pitch notation ("C4", "F#3", "Bb5", "A4") to a MIDI number.
 * Middle C (C4) = 60, A4 = 69. Throws on malformed input so bad authoring is
 * caught, not silently mis-sounded.
 */
export function noteToMidi(name: string): number {
  const m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(name.trim());
  if (!m) throw new Error(`bad note name: ${JSON.stringify(name)}`);
  const letter = m[1].toUpperCase();
  const pc = NAMES[letter + (m[2] || '')];
  if (pc === undefined) throw new Error(`bad note name: ${JSON.stringify(name)}`);
  const octave = parseInt(m[3], 10);
  return pc + (octave + 1) * 12;
}

/** MIDI number → name in sharps, e.g. 60 → "C4". */
export function midiToName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return SHARP_NAMES[pc] + octave;
}

/** MIDI number → frequency in Hz (A4 = a4, default 440). Deterministic. */
export function midiToFreq(midi: number, a4 = 440): number {
  return a4 * dexp2((midi - 69) / 12);
}

/** Convenience: pitch name or MIDI number → Hz. */
export function pitchToFreq(pitch: string | number, a4 = 440): number {
  return midiToFreq(typeof pitch === 'number' ? pitch : noteToMidi(pitch), a4);
}

/** Scale (mode) interval tables in semitones from the tonic. */
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10], // natural minor / aeolian
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
} as const;

export type ScaleName = keyof typeof SCALES;

/**
 * Scale degrees as MIDI numbers spanning `octaves` starting at `tonic`.
 * e.g. scaleMidis(noteToMidi('C4'), 'major', 2) → C4 D4 E4 … up two octaves.
 */
export function scaleMidis(tonic: number, mode: ScaleName = 'major', octaves = 1): number[] {
  const steps = SCALES[mode];
  const out: number[] = [];
  for (let o = 0; o < octaves; o++) for (const s of steps) out.push(tonic + o * 12 + s);
  out.push(tonic + octaves * 12); // include the top octave
  return out;
}

/** Pitch classes (0–11) of a scale — for in-key checks. */
export function scalePitchClasses(tonic: number, mode: ScaleName = 'major'): Set<number> {
  const pc = ((tonic % 12) + 12) % 12;
  return new Set(SCALES[mode].map((s) => (pc + s) % 12));
}

/**
 * Build a diatonic chord by stacking thirds on a scale degree. `degree` is
 * 0-based (0 = I/i). Returns MIDI numbers. `size` 3 = triad, 4 = seventh.
 * Because it stacks the actual scale, chord quality (maj/min/dim) falls out of
 * the mode automatically — no quality table to get wrong.
 */
export function diatonicChord(tonic: number, mode: ScaleName, degree: number, size = 3): number[] {
  const deg = ((degree % 7) + 7) % 7;
  const scale = scaleMidis(tonic, mode, 3); // enough headroom for stacked thirds
  const notes: number[] = [];
  for (let i = 0; i < size; i++) notes.push(scale[deg + i * 2]);
  return notes;
}

const ROMAN: Record<string, number> = {
  i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6,
};

/**
 * Realize a roman-numeral progression in a key to concrete chords (arrays of
 * MIDI notes). Case-insensitive on the numeral; a trailing "7" adds a seventh.
 * e.g. progression(noteToMidi('C4'),'major',['I','V','vi','IV']).
 */
export function progression(tonic: number, mode: ScaleName, romans: string[]): number[][] {
  return romans.map((r) => {
    const mt = /^([iv]+|[IV]+)(7)?/i.exec(r.trim());
    if (!mt) throw new Error(`bad roman numeral: ${JSON.stringify(r)}`);
    const degree = ROMAN[mt[1].toLowerCase()];
    if (degree === undefined) throw new Error(`bad roman numeral: ${JSON.stringify(r)}`);
    return diatonicChord(tonic, mode, degree, mt[2] ? 4 : 3);
  });
}

/** Transpose a set of MIDI notes by semitones. */
export function transpose(notes: number[], semitones: number): number[] {
  return notes.map((n) => n + semitones);
}

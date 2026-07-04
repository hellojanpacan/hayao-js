// Jazz harmony vocabulary — chord symbols → notes. This is what lets a composer
// write real changes ("Cm9 | F13 | Bbmaj7 | Ebmaj7#11 | Dm7b5 G7alt Cm6") instead
// of only diatonic triads. Pure and deterministic: a chord is a set of MIDI
// numbers derived from a root + a quality table + optional slash bass.

import { noteToMidi } from './theory';

/** Quality → chromatic intervals (semitones) from the root. Covers the common
 * jazz vocabulary; author with these exact quality strings so typos throw. */
const QUALITIES: Record<string, number[]> = {
  '': [0, 4, 7], maj: [0, 4, 7], M: [0, 4, 7],
  m: [0, 3, 7], min: [0, 3, 7], '-': [0, 3, 7],
  dim: [0, 3, 6], aug: [0, 4, 8], '+': [0, 4, 8],
  // sixths
  '6': [0, 4, 7, 9], m6: [0, 3, 7, 9], '-6': [0, 3, 7, 9],
  '69': [0, 4, 7, 9, 14], '6/9': [0, 4, 7, 9, 14],
  // major sevenths
  maj7: [0, 4, 7, 11], M7: [0, 4, 7, 11], maj9: [0, 4, 7, 11, 14],
  'maj7#11': [0, 4, 7, 11, 18], maj13: [0, 4, 7, 11, 14, 21],
  // dominants
  '7': [0, 4, 7, 10], '9': [0, 4, 7, 10, 14], '11': [0, 7, 10, 14, 17], '13': [0, 4, 7, 10, 14, 21],
  '7b9': [0, 4, 7, 10, 13], '7#9': [0, 4, 7, 10, 15], '7#11': [0, 4, 7, 10, 18],
  '7b13': [0, 4, 7, 10, 20], '7b5': [0, 4, 6, 10], '7#5': [0, 4, 8, 10],
  '13b9': [0, 4, 7, 10, 13, 21], '13#11': [0, 4, 7, 10, 18, 21], '9#11': [0, 4, 7, 10, 14, 18],
  '7alt': [0, 4, 10, 13, 20], // 3, b7, b9, b13 — one alteration family, fifth omitted
  // minor sevenths
  m7: [0, 3, 7, 10], min7: [0, 3, 7, 10], '-7': [0, 3, 7, 10],
  m9: [0, 3, 7, 10, 14], m11: [0, 3, 7, 10, 14, 17], m13: [0, 3, 7, 10, 14, 21],
  m7b5: [0, 3, 6, 10], ø: [0, 3, 6, 10], ø7: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9], mMaj7: [0, 3, 7, 11], 'm(maj7)': [0, 3, 7, 11], mMaj9: [0, 3, 7, 11, 14],
  // suspensions & added
  sus4: [0, 5, 7], sus2: [0, 2, 7], '7sus4': [0, 5, 7, 10], '9sus4': [0, 5, 7, 10, 14],
  add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14],
};

/**
 * Parse a chord symbol to MIDI notes at the given octave (default 4). Supports
 * a slash bass ("C/E", "Dm7/G"). Throws on an unknown quality so authoring
 * mistakes surface instead of sounding wrong.
 */
export function chordNotes(symbol: string, octave = 4): number[] {
  const sym = symbol.trim();
  const slash = sym.split('/');
  const head = slash[0];
  const m = /^([A-Ga-g][#b]?)(.*)$/.exec(head);
  if (!m) throw new Error(`bad chord symbol: ${JSON.stringify(symbol)}`);
  const rootName = m[1][0].toUpperCase() + (m[1][1] ?? '');
  const quality = m[2];
  const ints = QUALITIES[quality];
  if (!ints) throw new Error(`unknown chord quality ${JSON.stringify(quality)} in ${JSON.stringify(symbol)}`);
  const root = noteToMidi(rootName + octave);
  const notes = ints.map((i) => root + i);
  if (slash.length === 2) {
    // place the bass note below the chord
    const bm = /^([A-Ga-g][#b]?)$/.exec(slash[1].trim());
    if (bm) {
      const bassName = bm[1][0].toUpperCase() + (bm[1][1] ?? '');
      let bass = noteToMidi(bassName + (octave - 1));
      while (bass >= notes[0]) bass -= 12;
      notes.unshift(bass);
    }
  }
  return notes;
}

/**
 * Rootless voicing: drop the root (the bass covers it) and keep the colour
 * tones (3rd, 7th, extensions) in a tight register — the authentic sound of
 * jazz-piano/Rhodes comping. Optionally recenter near `targetMidi`.
 */
export function rootless(chord: number[], targetMidi?: number): number[] {
  const body = chord.slice(1); // drop the lowest (root/bass)
  if (targetMidi === undefined || body.length === 0) return body;
  const center = body.reduce((a, b) => a + b, 0) / body.length;
  const shift = Math.round((targetMidi - center) / 12) * 12;
  return body.map((n) => n + shift).sort((a, b) => a - b);
}

/**
 * Resolve a whole progression of chord symbols to note sets. Convenience for
 * writing changes as a string array: chordChanges(['Dm7','G7','Cmaj7']).
 */
export function chordChanges(symbols: string[], octave = 4): number[][] {
  return symbols.map((s) => chordNotes(s, octave));
}

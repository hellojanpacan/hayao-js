// "Neon Precinct" — an original jazz-funk album: the soundtrack to an imaginary
// neo-noir detective game. You work the night beat in a rain-slicked retro-
// future city; each cue scores a scene. The tracks share an instrument palette
// (Rhodes, upright bass, muted trumpet, vibraphone, clav, horns), an extended/
// altered jazz harmonic language, and a recurring four-note motif that opens the
// main theme and returns — resolved — in the closer.
//
// This is authored music, not a generator: real changes, written melodies, and
// opinionated arrangement. It reuses the engine's chord vocabulary, comping and
// walking-bass helpers, and the mastering chain.

import { INSTRUMENTS, type Song, type Note, type Track } from './music';
import { chordNotes, rootless } from './chord';
import { noteToMidi } from './theory';

const n = (pitch: Note['pitch'], beats: number, vel = 1): Note => ({ pitch, beats, vel });
const rest = (beats: number): Note => ({ pitch: null, beats });

// ── shared arrangement helpers ─────────────────────────────────────

/** Walking bass: four quarter notes per bar — root, a chord tone, a chord tone,
 * then a chromatic approach note leaning into the NEXT bar's root. */
function walk(changes: string[], oct = 2): Note[][] {
  return changes.map((sym, i) => {
    const c = chordNotes(sym, oct);
    const root = c[0];
    const third = c[1] ?? root + 3;
    const fifth = c[2] ?? root + 7;
    const nextRoot = chordNotes(changes[(i + 1) % changes.length], oct)[0];
    const approach = nextRoot + (root <= nextRoot ? -1 : 1);
    return [n(root, 1, 0.92), n(third, 1, 0.72), n(fifth, 1, 0.78), n(approach, 1, 0.7)];
  });
}

/** Rootless comping: one voicing per bar, hit with a syncopated Charleston
 * figure (on 1 and the "and" of 2). `target` recenters the voicing. */
function comp(changes: string[], oct = 4, target = 'F4', vel = 0.66): Note[][] {
  const t = noteToMidi(target);
  return changes.map((sym, i) => {
    const v = rootless(chordNotes(sym, oct), t);
    // alternate two comp rhythms so the groove breathes instead of looping:
    // a Charleston (1, & of 2) and a pushed answer (& of 2, & of 3).
    return i % 2 === 0
      ? [n(v, 1, vel), rest(0.5), n(v, 0.5, vel * 0.8), rest(2)]
      : [rest(1.5), n(v, 0.5, vel * 0.85), rest(1), n(v, 0.5, vel * 0.7), rest(0.5)];
  });
}

/** Sustained-pad comping (for ballads): hold the voicing across the bar. */
function pad(changes: string[], oct = 4, target = 'F4', vel = 0.6): Note[][] {
  const t = noteToMidi(target);
  return changes.map((sym) => [n(rootless(chordNotes(sym, oct), t), 4, vel)]);
}

/** The jazz ride "spang-a-lang": ding, ding-a, ding, ding-a per bar. The off-8ths
 * get swung by renderSong. */
const rideBar = (): Note[] => [
  n('C6', 1, 0.55), n('C6', 0.5, 0.35), n('C6', 0.5, 0.5),
  n('C6', 1, 0.55), n('C6', 0.5, 0.35), n('C6', 0.5, 0.5),
];
/** Hi-hat foot on 2 and 4. */
const hatFoot = (): Note[] => [rest(1), n('C6', 1, 0.5), rest(1), n('C6', 1, 0.5)];

function ride(gain = 0.42, bars = 8): Track {
  return { name: 'ride', instrument: INSTRUMENTS.ride, gain, pan: 0.12, patterns: [rideBar()], sequence: Array(bars).fill(0) };
}
function hats(gain = 0.4, bars = 8): Track {
  return { name: 'hat', instrument: { ...INSTRUMENTS.hat, highpass: 5000, volume: 0.2 }, gain, pan: -0.1, patterns: [hatFoot()], sequence: Array(bars).fill(0) };
}

export interface AlbumTrack {
  id: string;
  title: string;
  intent: string;
  make: () => Song;
}

// ── 1. Neon Precinct (main theme) ──────────────────────────────────
// Confident medium funk in Bb minor. A swaggering, syncopated head over a hip
// groove. The four-note motif (F–Gb–Bb–Ab, the ♭5/♭6 colour of the city) is the
// album's signature.
const MOTIF = ['F5', 'Gb5', 'Bb5', 'Ab5'];
function neonPrecinct(): Song {
  const A = ['Bbm9', 'Bbm9', 'Ebm9', 'Ab13', 'Dbmaj7', 'Gm7b5', 'C7alt', 'Fm7'];
  const bassOct = 2;
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.uprightBass, volume: 0.5 }, gain: 0.7,
    patterns: [
      // a funky riff for the vamp bars, walking for the turnaround
      [n('Bb1', 0.75, 0.95), n('Bb1', 0.25, 0.5), rest(0.5), n('Db2', 0.5, 0.7), n('F2', 0.5, 0.75), n('Ab1', 0.5, 0.6), n('Bb1', 1, 0.7)],
      ...walk(A.slice(2), bassOct),
    ],
    sequence: [0, 0, 1, 2, 3, 4, 5, 6],
  };
  const rhodes: Track = {
    name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.32 }, gain: 0.6, pan: -0.18,
    patterns: comp(A, 4, 'Ab4', 0.62),
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const lead: Track = {
    name: 'trumpet', instrument: { ...INSTRUMENTS.mutedTrumpet, volume: 0.34 }, gain: 0.62, pan: 0.14,
    patterns: [
      // the motif, stated and answered
      [n(MOTIF[0], 0.5, 0.85), n(MOTIF[1], 0.5, 0.7), n(MOTIF[2], 1, 0.9), n(MOTIF[3], 0.5, 0.75), rest(1.5)],
      [n('F5', 0.5, 0.8), n('Db5', 0.5, 0.7), n('Bb4', 1.5, 0.85), rest(1.5)],
      // the motif restated a 4th down (C–Db–F–Eb) — the hook recurs
      [n('C5', 0.5, 0.85), n('Db5', 0.5, 0.72), n('F5', 1, 0.9), n('Eb5', 0.5, 0.75), rest(1.5)],
      [n('Db5', 1, 0.8), n('C5', 0.5, 0.7), n('Bb4', 0.5, 0.7), n('Ab4', 2, 0.72)],
      [n('Db5', 0.5, 0.8), n('F5', 0.5, 0.8), n('Ab5', 1.5, 0.85), n('Gb5', 1.5, 0.75)],
      [n('D5', 1, 0.8), n('F5', 1, 0.8), n('Ab5', 1, 0.85), rest(1)], // Gm7b5
      [n('E5', 0.5, 0.85), n('Eb5', 0.5, 0.8), n('Db5', 1, 0.8), n('C5', 2, 0.78)], // C7alt tension
      [n('F5', 1, 0.85), n('Ab5', 1, 0.8), n('C6', 2, 0.9)], // Fm7 landing
    ],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const kick: Track = { name: 'kick', instrument: { ...INSTRUMENTS.kick, volume: 0.5 }, gain: 0.6, patterns: [[n('Bb1', 1, 0.8), rest(1.5), n('Bb1', 0.5, 0.55), rest(1)]], sequence: Array(8).fill(0) };
  const snare: Track = { name: 'snare', instrument: { ...INSTRUMENTS.snare, volume: 0.3, highpass: 1000 }, gain: 0.5, patterns: [[rest(1), n('D4', 1, 0.7), rest(1), n('D4', 1, 0.75)]], sequence: Array(8).fill(0) };
  return {
    bpm: 100, tracks: [bass, rhodes, lead, kick, snare, ride(0.42), hats(0.35)],
    swing: 0.6, humanize: 0.32, velBrightness: 0.6,
    reverb: { wet: 0.17, roomSize: 0.6, damp: 0.5 }, master: { lowCut: 0.24, presence: 0.14, air: 0.04, compress: 0.45 },
  };
}

// ── 2. Rain on the Avenue (ballad) ─────────────────────────────────
// A smoky, slow torch ballad in Eb. Muted trumpet over Rhodes and brushes; a lot
// of room. Late-night, melancholic, cool.
function rainOnTheAvenue(): Song {
  const A = ['Ebmaj7', 'Cm7', 'Fm7', 'Bb13', 'Gm7', 'C7b9', 'Fm7', 'Bb7alt'];
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.uprightBass, volume: 0.54, release: 0.2 }, gain: 0.74,
    patterns: A.map((sym) => { const r = chordNotes(sym, 2)[0]; return [n(r, 2, 0.85), n(r + 7, 1, 0.6), n(r + 12, 1, 0.55)]; }),
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const rhodes: Track = {
    name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.34, release: 0.6 }, gain: 0.62, pan: -0.15,
    patterns: pad(A, 4, 'G4', 0.62),
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const lead: Track = {
    name: 'trumpet', instrument: { ...INSTRUMENTS.mutedTrumpet, volume: 0.36, attack: 0.05, vibrato: 0.11 }, gain: 0.62, pan: 0.12,
    patterns: [
      [rest(1), n('G4', 1.5, 0.7), n('Bb4', 1, 0.75), n('G4', 0.5, 0.6)], // Ebmaj7
      [n('Eb4', 2, 0.7), n('G4', 1, 0.65), rest(1)], // Cm7
      [rest(0.5), n('Ab4', 1.5, 0.72), n('C5', 1, 0.75), n('Ab4', 1, 0.62)], // Fm7
      [n('D5', 2.5, 0.78), n('Bb4', 1.5, 0.65)], // Bb13
      [n('Bb4', 1.5, 0.7), n('G4', 1, 0.65), n('D5', 1.5, 0.72)], // Gm7
      [n('Db5', 2, 0.75), n('C5', 1, 0.68), n('Bb4', 1, 0.62)], // C7b9
      [n('Ab4', 2, 0.72), n('F4', 1, 0.62), rest(1)], // Fm7
      [n('Ab4', 1, 0.72), n('Db5', 1, 0.7), n('D5', 2, 0.72)], // Bb7alt → lands on D (Ebmaj7's 7th)
    ],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const brush: Track = { name: 'brush', instrument: { ...INSTRUMENTS.snare, volume: 0.12, highpass: 1500, release: 0.16 }, gain: 0.4, patterns: [[rest(1), n('D4', 1, 0.4), rest(1), n('D4', 1, 0.45)]], sequence: Array(8).fill(0) };
  return {
    bpm: 62, tracks: [bass, rhodes, lead, brush, ride(0.24)],
    swing: 0.5, humanize: 0.4, velBrightness: 0.6,
    reverb: { wet: 0.34, roomSize: 0.85, damp: 0.55 }, master: { lowCut: 0.24, presence: 0.16, air: 0.05, compress: 0.65 },
  };
}

// ── 3. Stakeout (cool tension) ─────────────────────────────────────
// Minimal, nervous cool-jazz in C minor. Walking bass under a sparse vibraphone
// motif; quiet, unresolved, watchful.
function stakeout(): Song {
  const A = ['Cm9', 'Cm9', 'Fm9', 'Dm7b5', 'G7alt', 'Cm9', 'Ab13', 'G7alt'];
  const bass: Track = { name: 'bass', instrument: { ...INSTRUMENTS.uprightBass, volume: 0.48 }, gain: 0.68, patterns: walk(A, 2), sequence: [0, 1, 2, 3, 4, 5, 6, 7] };
  const vibe: Track = {
    name: 'vibes', instrument: { ...INSTRUMENTS.vibraphone, volume: 0.34 }, gain: 0.6, pan: 0.1,
    patterns: [
      [n('G4', 1, 0.7), rest(1), n('Eb5', 1, 0.65), rest(1)],
      [rest(2), n('D5', 1, 0.68), n('C5', 1, 0.6)],
      [n('Ab4', 1, 0.7), rest(1.5), n('F5', 1.5, 0.6)],
      [n('F4', 1, 0.7), n('Ab4', 1, 0.6), rest(2)], // Dm7b5
      [rest(1), n('B4', 1, 0.72), n('Ab4', 1, 0.6), n('F4', 1, 0.55)], // G7alt
      [n('Eb5', 2, 0.68), n('C5', 2, 0.6)],
      [n('C5', 1, 0.7), n('Gb5', 1, 0.68), rest(2)], // Ab13 colour
      [n('B4', 1, 0.7), n('Db5', 1, 0.62), n('Ab4', 2, 0.58)], // G7alt — left hanging on the b9, unresolved
    ],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const comping: Track = { name: 'guitar', instrument: { ...INSTRUMENTS.jazzGuitar, volume: 0.22 }, gain: 0.5, pan: -0.2, patterns: comp(A, 4, 'Eb4', 0.5), sequence: [0, 1, 2, 3, 4, 5, 6, 7] };
  return {
    bpm: 96, tracks: [bass, comping, vibe, ride(0.3), hats(0.28)],
    swing: 0.62, humanize: 0.34, velBrightness: 0.6,
    reverb: { wet: 0.22, roomSize: 0.65, damp: 0.5 }, master: { lowCut: 0.24, presence: 0.13, air: 0.04, compress: 0.45 },
  };
}

// ── 4. The Chase (driving funk) ────────────────────────────────────
// Fast, aggressive F-minor funk. A clav riff, horn stabs, busy drums, a hard
// sidechain pump. The action cue.
function theChase(): Song {
  // changes: | Fm7 | Fm7 | Bbm7 | C7#9 | (horns spell them below)
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.bass, volume: 0.52, lowpass: 1000, sub: 0.35 }, gain: 0.75,
    patterns: [
      [n('F1', 0.5, 0.95), n('F1', 0.5, 0.6), rest(0.5), n('F1', 0.5, 0.7), n('Ab1', 0.5, 0.7), n('C2', 0.5, 0.7), n('F1', 0.5, 0.65), n('Eb2', 0.5, 0.7)],
      [n('Bb1', 0.5, 0.9), n('Bb1', 0.5, 0.6), rest(0.5), n('Bb1', 0.5, 0.7), n('Db2', 0.5, 0.7), n('F2', 0.5, 0.7), n('Bb1', 1, 0.65)],
      [n('C2', 0.5, 0.9), n('C2', 0.5, 0.6), n('Eb2', 0.5, 0.7), n('D2', 0.5, 0.7), n('C2', 0.5, 0.7), n('Bb1', 0.5, 0.7), n('G1', 1, 0.7)],
    ],
    sequence: [0, 0, 1, 2],
  };
  const clav: Track = {
    name: 'clav', instrument: { ...INSTRUMENTS.clav, volume: 0.3, lowpass: 2700 }, gain: 0.55, pan: -0.16,
    patterns: [
      [n('F4', 0.25, 0.8), rest(0.25), n('Ab4', 0.25, 0.6), rest(0.25), n('F4', 0.25, 0.7), n('C5', 0.25, 0.6), rest(0.5), n('Eb5', 0.5, 0.7), rest(1)],
      [n('Bb3', 0.25, 0.8), rest(0.25), n('Db4', 0.25, 0.6), rest(0.25), n('F4', 0.5, 0.7), rest(0.5), n('Bb4', 0.5, 0.65), rest(1)],
      [n('C4', 0.25, 0.8), n('Eb4', 0.25, 0.6), n('G4', 0.5, 0.7), rest(0.5), n('C5', 0.5, 0.7), n('Bb4', 0.5, 0.65), rest(1)],
    ],
    sequence: [0, 0, 1, 2],
  };
  const hstab = (sym: string) => rootless(chordNotes(sym, 4), noteToMidi('C5'));
  const horns: Track = {
    name: 'horns', instrument: { ...INSTRUMENTS.horns, volume: 0.26 }, gain: 0.55, pan: 0.15,
    patterns: [
      // punchy: hit the & of 2 and an & of 4 pickup that drives into the next bar
      [rest(1.5), n(hstab('Fm7'), 0.5, 0.8), rest(1.5), n(hstab('Fm7'), 0.5, 0.9)],
      [rest(1.5), n(hstab('Fm7'), 0.5, 0.8), rest(1.5), n(hstab('Bbm7'), 0.5, 0.9)],
      [rest(2), n(hstab('Bbm7'), 0.5, 0.82), rest(1), n(hstab('Bbm7'), 0.5, 0.88)],
      [n(hstab('C7#9'), 0.5, 0.92), rest(1), n(hstab('C7#9'), 0.5, 0.82), rest(1), n(hstab('C7#9'), 0.5, 0.9)],
    ],
    sequence: [0, 1, 2, 3],
  };
  const kick: Track = { name: 'kick', instrument: INSTRUMENTS.kick, gain: 0.85, patterns: [[n('F1', 1, 0.95), n('F1', 0.5, 0.6), rest(0.5), n('F1', 0.5, 0.7), rest(0.5), n('F1', 1, 0.8)]], sequence: Array(4).fill(0) };
  const snare: Track = { name: 'snare', instrument: { ...INSTRUMENTS.snare, volume: 0.42 }, gain: 0.6, patterns: [[rest(1), n('D4', 1, 0.85), rest(1), n('D4', 1, 0.9)]], sequence: Array(4).fill(0) };
  const hat: Track = { name: 'hat', instrument: { ...INSTRUMENTS.hat, volume: 0.18, highpass: 5000, lowpass: 9000 }, gain: 0.38, pan: 0.1, patterns: [[n('C6', 0.5, 0.6), n('C6', 0.5, 0.35)]], sequence: Array(8).fill(0) };
  return {
    bpm: 128, tracks: [kick, bass, clav, horns, snare, hat],
    humanize: 0.14, velBrightness: 0.55,
    sidechain: { depth: 0.5, beatsPerCycle: 1 },
    reverb: { wet: 0.12, roomSize: 0.5, damp: 0.5 }, master: { lowCut: 0.3, presence: 0.16, air: 0.05, compress: 0.4 },
  };
}

// ── 5. Smoke & Mirrors (slinky noir) ───────────────────────────────
// Half-time, sultry, ambiguous. Ab tonal centre with altered colours. Vibraphone
// and muted trumpet trade a slinky line over a laid-back groove.
function smokeAndMirrors(): Song {
  const A = ['Abmaj7#11', 'Db9', 'Bbm7', 'Eb7alt', 'Cm7', 'F7b9', 'Bbm7', 'Eb13'];
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.uprightBass, volume: 0.5, sub: 0.4 }, gain: 0.72,
    patterns: A.map((sym, i) => {
      const r = chordNotes(sym, 2)[0];
      const nextR = chordNotes(A[(i + 1) % A.length], 2)[0];
      const approach = nextR + (r <= nextR ? -1 : 1); // chromatic lead-in to the next root
      return [n(r, 1.5, 0.9), rest(0.5), n(r + 7, 1, 0.62), n(approach, 1, 0.62)];
    }),
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const rhodes: Track = { name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.28 }, gain: 0.55, pan: -0.18, patterns: comp(A, 4, 'Ab4', 0.6), sequence: [0, 1, 2, 3, 4, 5, 6, 7] };
  const vibe: Track = {
    name: 'vibes', instrument: { ...INSTRUMENTS.vibraphone, volume: 0.3 }, gain: 0.55, pan: 0.18,
    patterns: [
      [rest(1), n('C5', 1, 0.7), n('D5', 1, 0.65), n('Eb5', 1, 0.62)], // maj7#11 colour (D=#11)
      [n('F5', 2, 0.7), n('Eb5', 1, 0.62), n('C5', 1, 0.58)],
      [n('Db5', 1.5, 0.7), n('F5', 1.5, 0.65), n('Ab5', 1, 0.62)],
      [n('G5', 1, 0.72), n('Gb5', 1, 0.66), n('Db5', 2, 0.6)], // Eb7alt
      [rest(1), n('Eb5', 1.5, 0.68), n('G5', 1.5, 0.62)],
      [n('Ab5', 1, 0.72), n('Gb5', 1, 0.66), n('F5', 2, 0.6)], // F7b9
      [n('Db5', 2, 0.68), n('Bb4', 2, 0.6)],
      [n('C5', 1, 0.7), n('G5', 1, 0.66), n('Eb5', 2, 0.6)],
    ],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const kick: Track = { name: 'kick', instrument: { ...INSTRUMENTS.kick, volume: 0.55 }, gain: 0.62, patterns: [[n('Ab1', 1, 0.85), rest(2), n('Ab1', 0.5, 0.55), rest(0.5)]], sequence: Array(8).fill(0) };
  const snare: Track = { name: 'snare', instrument: { ...INSTRUMENTS.rimshot, volume: 0.22 }, gain: 0.5, patterns: [[rest(2), n('D4', 1, 0.7), rest(1)]], sequence: Array(8).fill(0) };
  return {
    bpm: 84, tracks: [bass, rhodes, vibe, kick, snare, ride(0.28), hats(0.24)],
    swing: 0.56, humanize: 0.3, velBrightness: 0.62,
    reverb: { wet: 0.26, roomSize: 0.72, damp: 0.55 }, master: { lowCut: 0.24, presence: 0.14, air: 0.04, compress: 0.45 },
  };
}

// ── 6. Last Call (warm closer) ─────────────────────────────────────
// Bittersweet resolution in C major. A ii–V–I that finally lands, reprising the
// main-theme motif transposed and resolved. Rhodes-led, warm, the credits roll.
function lastCall(): Song {
  const A = ['Dm7', 'G13', 'Cmaj9', 'A7b9', 'Dm7', 'G7', 'Cmaj9', 'Cmaj9'];
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.uprightBass, volume: 0.5 }, gain: 0.66,
    patterns: walk(A, 2), sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const rhodes: Track = { name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.32, release: 0.5 }, gain: 0.6, pan: -0.14, patterns: comp(A, 4, 'E4', 0.6), sequence: [0, 1, 2, 3, 4, 5, 6, 7] };
  const lead: Track = {
    name: 'trumpet', instrument: { ...INSTRUMENTS.mutedTrumpet, volume: 0.36, vibrato: 0.1 }, gain: 0.62, pan: 0.12,
    patterns: [
      [rest(1), n('A4', 1, 0.72), n('C5', 1, 0.75), n('D5', 1, 0.7)], // Dm7
      [n('B4', 2, 0.75), n('G4', 1, 0.65), n('F4', 1, 0.6)], // G13
      [n('E5', 2, 0.78), n('G4', 1, 0.62), n('E4', 1, 0.6)], // Cmaj9 — arrival
      [n('C5', 1, 0.72), n('Bb4', 1, 0.68), n('A4', 1, 0.65), n('D5', 1, 0.62)], // A7b9 → resolves A up to D (into Dm7)
      // the motif reprised in C major, resolved (was F–Gb–Bb–Ab; now G–A–C–B → resolves up)
      [n('G4', 0.5, 0.78), n('A4', 0.5, 0.72), n('C5', 1, 0.82), n('B4', 0.5, 0.7), rest(1.5)],
      [n('D5', 1, 0.75), n('B4', 1, 0.68), n('G4', 2, 0.62)], // G7
      [n('E5', 2, 0.8), n('C5', 2, 0.72)], // Cmaj9
      [n('E4', 4, 0.6)], // long resolved tonic
    ],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const brush: Track = { name: 'brush', instrument: { ...INSTRUMENTS.snare, volume: 0.12, highpass: 1500, release: 0.15 }, gain: 0.42, patterns: [[rest(1), n('D4', 1, 0.42), rest(1), n('D4', 1, 0.46)]], sequence: Array(8).fill(0) };
  return {
    bpm: 76, tracks: [bass, rhodes, lead, brush, ride(0.26)],
    swing: 0.56, humanize: 0.36, velBrightness: 0.6,
    reverb: { wet: 0.3, roomSize: 0.8, damp: 0.5 }, master: { lowCut: 0.38, presence: 0.28, air: 0.09, compress: 0.65 },
  };
}

/** The album. */
export const ALBUM = {
  title: 'Neon Precinct',
  subtitle: 'Original Soundtrack',
  concept:
    'The score to an imaginary neo-noir detective game. You work the night beat in a rain-slicked ' +
    'retro-future city — jazz-funk with a noir heart. Six cues, one motif, a long night.',
  tracks: [
    { id: 'neon-precinct', title: 'Neon Precinct', intent: 'Main theme — swaggering medium funk, the city announcing itself.', make: neonPrecinct },
    { id: 'rain-avenue', title: 'Rain on the Avenue', intent: 'A smoky, slow torch ballad. Muted trumpet in the rain.', make: rainOnTheAvenue },
    { id: 'stakeout', title: 'Stakeout', intent: 'Minimal, nervous cool-jazz. Watching, waiting, unresolved.', make: stakeout },
    { id: 'the-chase', title: 'The Chase', intent: 'Driving F-minor funk — clav, horn stabs, a hard pulse.', make: theChase },
    { id: 'smoke-mirrors', title: 'Smoke & Mirrors', intent: 'Slinky half-time noir; altered colours, nothing as it seems.', make: smokeAndMirrors },
    { id: 'last-call', title: 'Last Call', intent: 'The warm closer — a ii–V–I that finally lands, the motif resolved.', make: lastCall },
  ] as AlbumTrack[],
};

/** Look up an album track by id. */
export function albumTrack(id: string): AlbumTrack | undefined {
  return ALBUM.tracks.find((t) => t.id === id);
}

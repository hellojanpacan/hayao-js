// Genre songbook — hand-composed reference tracks that show the composition
// engine across styles: minimal electronic, lo-fi, melancholic piano, epic
// orchestral, and jazz-funk. Each is plain data built with the theory helpers
// (so it stays in-key, diatonic, and voice-led) and renders through renderSong.
// These are both a demo and a fixture: the AI loop can measure them and try to
// beat them. Revised after a producer critique — voice-leading, real swing,
// velocity→brightness, sidechain pump, darker lo-fi, expressive piano space.

import { INSTRUMENTS, type Song, type Note, type Track } from './music';
import { progression, voiceLead, openVoicing, scaleMidis, noteToMidi } from './theory';

const n = (pitch: Note['pitch'], beats: number, vel = 1): Note => ({ pitch, beats, vel });
const rest = (beats: number): Note => ({ pitch: null, beats });

/** Arpeggiate a chord (MIDI notes) into `steps` notes of `beatsEach`, cycling up. */
function arp(chord: number[], steps: number, beatsEach: number, vel = 0.9): Note[] {
  const out: Note[] = [];
  for (let i = 0; i < steps; i++) out.push(n(chord[i % chord.length] + Math.floor(i / chord.length) * 12, beatsEach, vel));
  return out;
}

/** Four-on-the-floor kick pattern of `beats` quarter-note hits. */
function fourOnFloor(pitch: string, beats: number, vel = 1): Note[] {
  return Array.from({ length: beats }, () => n(pitch, 1, vel));
}

export interface GenreTrack {
  id: string;
  name: string;
  description: string;
  make: () => Song;
}

// ── 1. Minimal bass-driven electronic ─────────────────────────────
// A-minor drive, i–VI–III–VII, pulsing sub, four-on-the-floor, sidechain pump,
// a filtered pluck and a real lead hook with a non-chord tone.
function minimalElectronic(): Song {
  const chords = progression(noteToMidi('A3'), 'minor', ['i', 'VI', 'III', 'VII']);
  const roots = chords.map((c) => c[0] - 12);
  const bass: Track = {
    name: 'sub', instrument: INSTRUMENTS.subBass, gain: 0.6,
    patterns: roots.map((r) => [n(r, 0.5, 1), n(r, 0.5, 0.6), n(r, 0.5, 0.85), n(r, 0.5, 0.6), n(r, 0.5, 1), n(r, 0.5, 0.6), n(r, 0.5, 0.85), n(r, 0.5, 0.7)]),
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const kick: Track = { name: 'kick', instrument: INSTRUMENTS.kick, gain: 0.82, patterns: [fourOnFloor('A1', 4)], sequence: Array(8).fill(0) };
  const hat: Track = {
    name: 'hat', instrument: INSTRUMENTS.hat, gain: 0.42, pan: 0.15,
    patterns: [[rest(0.5), n('A6', 0.5, 0.7), rest(0.5), n('A6', 0.5, 0.5)]],
    sequence: Array(16).fill(0),
  };
  const pluck: Track = {
    name: 'pluck', instrument: { ...INSTRUMENTS.pluck, release: 0.16, lowpass: 2400 }, gain: 0.62, pan: -0.2,
    patterns: chords.map((c) => arp([c[0], c[1], c[2]], 4, 1, 0.7)),
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const lead: Track = {
    name: 'lead', instrument: { ...INSTRUMENTS.lead, detune: 8, lowpass: 2800 }, gain: 0.52, pan: 0.1,
    patterns: [
      // a singable hook: 5th, b7 (passing tone), root, then a held 3rd
      [n(chords[0][2] + 12, 0.75), n(chords[0][2] + 14, 0.25), n(chords[0][0] + 12, 1), n(chords[0][1] + 12, 2)],
      [n(chords[1][2] + 12, 1), n(chords[1][1] + 12, 0.5), n(chords[1][2] + 12, 0.5), n(chords[1][0] + 24, 2)],
      [n(chords[2][2] + 12, 0.75), n(chords[2][1] + 12, 0.25), n(chords[2][0] + 12, 1), n(chords[2][2] + 12, 2)],
      [n(chords[3][0] + 24, 1), n(chords[3][2] + 12, 0.5), n(chords[3][1] + 12, 0.5), n(chords[3][0] + 12, 2)],
    ],
    sequence: [0, 1, 2, 3],
  };
  return {
    bpm: 126, tracks: [kick, bass, hat, pluck, lead],
    reverb: { wet: 0.15, roomSize: 0.6, damp: 0.5 }, humanize: 0.05,
    sidechain: { depth: 0.55, beatsPerCycle: 1 },
    master: { lowCut: 0.35, presence: 0.2, air: 0.08 },
  };
}

// ── 2. Easygoing lo-fi ─────────────────────────────────────────────
// Swung, dusty jazz sevenths (Fmaj7–Em7–Dm7–Cmaj7), voice-led + opened, warm
// bass, brushed drums, a dull filtered hat, and a bed of vinyl crackle.
function lofi(): Song {
  const key = noteToMidi('C4');
  const chords = voiceLead(progression(key, 'major', ['IV7', 'iii7', 'ii7', 'I7']).map(openVoicing));
  const bassRoots = chords.map((c) => c[0] - 12);
  const rhodes: Track = {
    name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.42, lowpass: 2600, fm: 1.6 }, gain: 0.66, pan: -0.1,
    patterns: chords.map((c) => [n(c.map((x) => x), 3.5, 0.75), rest(0.5)]),
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.bass, lowpass: 650, sub: 0.28 }, gain: 0.72, pan: 0.05,
    patterns: bassRoots.map((r) => [n(r, 1.5, 0.9), rest(0.5), n(r + 7, 1, 0.7), n(r + 5, 1, 0.6)]),
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const kick: Track = { name: 'kick', instrument: { ...INSTRUMENTS.kick, volume: 0.75 }, gain: 0.82, patterns: [[n('C2', 1, 0.9), rest(1), n('C2', 0.5, 0.6), rest(0.5), n('C2', 0.5, 0.4), rest(0.5)]], sequence: Array(8).fill(0) };
  const snare: Track = { name: 'snare', instrument: { ...INSTRUMENTS.rimshot, volume: 0.24, lowpass: 4000 }, gain: 0.6, patterns: [[rest(1), n('C4', 1, 0.7), rest(1), n('C4', 1, 0.7)]], sequence: Array(8).fill(0) };
  const hat: Track = { name: 'hat', instrument: { ...INSTRUMENTS.hat, volume: 0.14, highpass: 2500, lowpass: 6000 }, gain: 0.45, pan: 0.2, patterns: [[n('C6', 0.5, 0.5), n('C6', 0.5, 0.3)]], sequence: Array(16).fill(0) };
  // a whisper of vinyl warmth — much subtler than before (was too much hiss)
  const vinyl: Track = { name: 'vinyl', instrument: { wave: 'noise', attack: 0.5, release: 0.5, sustainLevel: 1, volume: 0.022, lowpass: 2800, highpass: 400 }, gain: 0.3, patterns: [[n('C4', 16, 1)]], sequence: [0] };
  const keys: Track = {
    name: 'keys', instrument: { ...INSTRUMENTS.piano, volume: 0.3, lowpass: 2800 }, gain: 0.48, pan: 0.15,
    patterns: [
      [n(chords[0][2] + 12, 1, 0.7), rest(1), n(chords[0][1] + 12, 0.5, 0.55), n(chords[0][2] + 12, 0.5, 0.5), rest(1)],
      [rest(0.5), n(chords[1][2] + 12, 1, 0.7), rest(0.5), n(chords[1][1] + 12, 2, 0.55)],
      [n(chords[2][2] + 12, 1.5, 0.7), n(chords[2][1] + 12, 0.5, 0.5), rest(2)],
      [rest(1), n(chords[3][2] + 12, 1, 0.7), n(chords[3][1] + 12, 1, 0.55), rest(1)],
    ],
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  return {
    bpm: 78, tracks: [vinyl, rhodes, bass, kick, snare, hat, keys],
    swing: 0.75, humanize: 0.4, velBrightness: 0.7, reverb: { wet: 0.24, roomSize: 0.7, damp: 0.65 },
    master: { lowCut: 0.26, presence: 0.22, air: 0.05 }, // keep it dusty but clear the mud
  };
}

// ── 3. Sad & melancholic piano ─────────────────────────────────────
// Slow A-minor, sparse voice-led piano with rests + rubato, string bed, big room.
function melancholicPiano(): Song {
  const key = noteToMidi('A3');
  const chords = voiceLead(progression(key, 'minor', ['i', 'VI', 'III', 'VII']));
  // sparser, varied arpeggios with rests — space is the expression
  const figs = [
    (c: number[]) => [n(c[0], 1, 0.85), n(c[2], 1, 0.55), rest(2)],
    (c: number[]) => [n(c[2], 1.5, 0.8), rest(0.5), n(c[1], 2, 0.5)],
    (c: number[]) => [rest(1), n(c[1] + 12, 1.5, 0.7), rest(1.5)],
    (c: number[]) => [n(c[0], 2, 0.8), n(c[2], 1, 0.55), rest(1)],
  ];
  const piano: Track = {
    name: 'piano', instrument: { ...INSTRUMENTS.piano, volume: 0.46 }, gain: 0.78, pan: -0.05,
    patterns: chords.map((c, i) => figs[i % figs.length](c)),
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const strings: Track = {
    name: 'strings', instrument: { ...INSTRUMENTS.strings, attack: 0.4 }, gain: 0.5, pan: 0.1,
    patterns: chords.map((c) => [n(c.map((x) => x - 12), 4, 0.65)]),
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const sub: Track = {
    name: 'sub', instrument: { ...INSTRUMENTS.subBass, volume: 0.4, attack: 0.03 }, gain: 0.55,
    patterns: chords.map((c) => [n(c[0] - 24, 4, 0.6)]),
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const melody: Track = {
    name: 'melody', instrument: { ...INSTRUMENTS.piano, volume: 0.4, lowpass: 3000 }, gain: 0.5, pan: 0.12,
    patterns: [
      [rest(2), n(chords[0][2] + 12, 1, 0.75), n(chords[0][1] + 12, 1, 0.55)],
      [n(chords[1][2] + 12, 2, 0.8), n(chords[1][1] + 12, 1, 0.55), rest(1)],
      [rest(1.5), n(chords[2][2] + 12, 1.5, 0.75), n(chords[2][1] + 12, 1, 0.55)],
      [n(chords[3][1] + 12, 1.5, 0.7), n(chords[3][0] + 12, 2.5, 0.6)], // VII → resolve down to tonic feel
    ],
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  return { bpm: 66, tracks: [sub, strings, piano, melody], humanize: 0.5, velBrightness: 0.75, reverb: { wet: 0.38, roomSize: 0.86, damp: 0.55 }, master: { lowCut: 0.4, presence: 0.28, air: 0.12 } };
}

// ── 4. Epic & uplifting orchestral ─────────────────────────────────
// Driving D-minor with a lift, voice-led. Strings arpeggiate, brass carries an
// actual stepwise THEME on top, choir + glockenspiel crown it, timpani drives.
function epicOrchestral(): Song {
  const key = noteToMidi('D3');
  const all = voiceLead(progression(key, 'minor', ['i', 'VI', 'III', 'VII', 'VI', 'VII', 'i', 'i']));
  const scale = scaleMidis(noteToMidi('D4'), 'minor', 3);
  const deg = (i: number) => scale[((i % scale.length) + scale.length) % scale.length];
  const strings: Track = {
    name: 'strings', instrument: { ...INSTRUMENTS.strings, volume: 0.24 }, gain: 0.7, pan: -0.15,
    patterns: all.map((c) => arp([c[0], c[1], c[2], c[0] + 12], 8, 0.5, 0.75)),
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  // a real soaring theme (scale-step melody), one bar each
  const themeBars: Note[][] = [
    [n(deg(0), 2, 0.9), n(deg(1), 1, 0.8), n(deg(2), 1, 0.85)],
    [n(deg(4), 3, 0.95), n(deg(2), 1, 0.8)],
    [n(deg(1), 2, 0.85), n(deg(0), 1, 0.8), n(deg(1), 1, 0.8)],
    [n(deg(4), 2, 0.9), n(deg(5), 2, 0.95)],
    [n(deg(5), 2, 0.95), n(deg(4), 1, 0.85), n(deg(2), 1, 0.8)],
    [n(deg(4), 2, 0.9), n(deg(6), 2, 0.95)],
    [n(deg(7), 3, 1), n(deg(6), 1, 0.85)],
    [n(deg(7), 4, 1)],
  ];
  const restBar: Note[] = [rest(4)];
  const brass: Track = {
    name: 'brass', instrument: { ...INSTRUMENTS.brass, volume: 0.32 }, gain: 0.62, pan: 0.15,
    // enters at bar 3 — a two-bar build before the theme lands (payoff > static)
    patterns: [restBar, ...themeBars], sequence: [0, 0, 1, 2, 3, 4, 5, 6],
  };
  const choir: Track = {
    name: 'choir', instrument: { ...INSTRUMENTS.choir, volume: 0.18 }, gain: 0.5, pan: 0.05,
    patterns: all.map((c) => [n([c[2] + 12, c[0] + 24], 4, 0.6)]),
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const timp: Track = {
    name: 'timpani', instrument: { ...INSTRUMENTS.kick, decay: 0.14, release: 0.25, slide: -12, volume: 0.85, sub: 0.5 }, gain: 0.82,
    patterns: [[n('D2', 1, 1), n('D2', 1, 0.6), n('D2', 0.5, 0.85), n('D2', 0.5, 0.6), n('D2', 1, 0.9)]],
    sequence: Array(8).fill(0),
  };
  const glock: Track = {
    name: 'glocken', instrument: INSTRUMENTS.glocken, gain: 0.32, pan: 0.25,
    // sparkles in only from bar 3, with the theme
    patterns: [restBar, ...all.map((c) => [rest(1), n(c[2] + 24, 1, 0.55), rest(1), n(c[1] + 24, 1, 0.5)])],
    sequence: [0, 0, 3, 4, 5, 6, 7, 8],
  };
  return { bpm: 88, tracks: [timp, strings, brass, choir, glock], humanize: 0.14, velBrightness: 0.5, reverb: { wet: 0.32, roomSize: 0.9, damp: 0.4 }, master: { lowCut: 0.4, presence: 0.32, air: 0.14 } };
}

// ── 5. Jazzy & funky ───────────────────────────────────────────────
// Swung ii–V–I–vi in C with 7ths, a real walking bass that approaches the next
// root chromatically, syncopated Rhodes comps, brass stabs, a swung ride.
function jazzFunk(): Song {
  const key = noteToMidi('C4');
  const chords = progression(key, 'major', ['ii7', 'V7', 'I7', 'vi7']);
  const voiced = voiceLead(chords.map(openVoicing));
  // walking bass: root, chord 3rd, chord 5th, then chromatic approach to next root
  const bassPats = chords.map((c, i) => {
    const next = chords[(i + 1) % chords.length][0] - 24;
    const root = c[0] - 24;
    const third = c[1] - 24;
    const fifth = c[2] - 24;
    const approach = next + (root < next ? -1 : 1); // lean into the next root
    return [n(root, 1, 0.95), n(third, 1, 0.75), n(fifth, 1, 0.8), n(approach, 1, 0.7)];
  });
  const bass: Track = { name: 'bass', instrument: { ...INSTRUMENTS.bass, lowpass: 1000, sub: 0.35, release: 0.12 }, gain: 0.74, patterns: bassPats, sequence: [0, 1, 2, 3, 0, 1, 2, 3] };
  const rhodes: Track = {
    name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.3 }, gain: 0.62, pan: -0.15,
    patterns: voiced.map((c) => [rest(0.5), n(c.map((x) => x), 0.75, 0.7), rest(0.75), n(c.map((x) => x), 0.5, 0.55), rest(1.5)]),
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const stab: Track = {
    name: 'brass', instrument: { ...INSTRUMENTS.brass, release: 0.1, volume: 0.24 }, gain: 0.55, pan: 0.2,
    patterns: [
      [rest(2), n(voiced[0].map((x) => x + 12), 0.5, 0.85), rest(1.5)],
      [rest(3), n(voiced[1].map((x) => x + 12), 0.5, 0.85), rest(0.5)],
      [n(voiced[2].map((x) => x + 12), 0.5, 0.8), rest(3.5)],
      [rest(2.5), n(voiced[3].map((x) => x + 12), 0.5, 0.8), rest(1)],
    ],
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const ride: Track = { name: 'ride', instrument: { ...INSTRUMENTS.hat, volume: 0.13, highpass: 3000, lowpass: 9000, release: 0.08 }, gain: 0.5, pan: 0.1, patterns: [[n('C6', 0.5, 0.6), n('C6', 0.5, 0.35), n('C6', 0.5, 0.5), n('C6', 0.5, 0.35)]], sequence: Array(16).fill(0) };
  const snare: Track = { name: 'snare', instrument: { ...INSTRUMENTS.snare, volume: 0.28, highpass: 900 }, gain: 0.5, patterns: [[rest(1), n('D4', 1, 0.6), rest(1), n('D4', 1, 0.7)]], sequence: Array(8).fill(0) };
  const kick: Track = { name: 'kick', instrument: { ...INSTRUMENTS.kick, volume: 0.55 }, gain: 0.62, patterns: [[n('C2', 1, 0.85), rest(1.5), n('C2', 0.5, 0.6), rest(1)]], sequence: Array(8).fill(0) };
  return { bpm: 116, tracks: [bass, rhodes, stab, kick, snare, ride], swing: 0.66, humanize: 0.35, velBrightness: 0.6, reverb: { wet: 0.16, roomSize: 0.55, damp: 0.5 }, master: { lowCut: 0.5, presence: 0.18, air: 0.07 } };
}

/** The genre songbook — the demo set. */
export const GENRES: GenreTrack[] = [
  { id: 'electronic', name: 'Minimal Electronic', description: 'Bass-driven four-on-the-floor in A minor — pulsing sidechained sub, offbeat hats, a synth hook.', make: minimalElectronic },
  { id: 'lofi', name: 'Lo-fi Beats', description: 'Swung, dusty jazz sevenths on a Rhodes with warm bass, brushed drums and vinyl crackle.', make: lofi },
  { id: 'piano', name: 'Melancholic Piano', description: 'Slow, sad A-minor piano with space and rubato over a string bed in a big room.', make: melancholicPiano },
  { id: 'orchestral', name: 'Epic Orchestral', description: 'Uplifting D-minor with a soaring brass theme, arpeggiated strings, choir, timpani and glockenspiel.', make: epicOrchestral },
  { id: 'jazzfunk', name: 'Jazz Funk', description: 'Swung ii–V–I with a walking bass that chromatically approaches each chord, Rhodes comping and brass stabs.', make: jazzFunk },
];

/** Look up a genre by id. */
export function genre(id: string): GenreTrack | undefined {
  return GENRES.find((g) => g.id === id);
}

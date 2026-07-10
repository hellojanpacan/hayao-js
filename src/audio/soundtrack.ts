// "Palace Hours" — an original jazz-funk soundtrack for a game, engineered as
// BACKGROUND. Neon Precinct (see album.ts) is a listening record, mixed front-
// and-centre. This is the opposite job: music that scores play without competing
// with it. Every choice here defends one constraint — leave a pocket for SFX.
//
// The game it scores: a light, stylish caper set in a gilded Regalia court — you
// move through halls lifting trinkets on a timer. Four looping cues, one per game
// state (title / explore / tension / reward), sharing a palette (Rhodes, upright
// bass, vibraphone, clav, muted trumpet) and a three-note "coin" motif.
//
// ── How it leaves room for SFX (the design, not a slogan) ──────────────────
// SFX in this engine are bright, transient one-shots — the coin (988 Hz square),
// blip (sine), laser (saw sweep), pickup — living 1–5 kHz with sharp attacks.
// Background music must vacate that neighbourhood on two axes:
//   1. SPECTRAL pocket — voices are lowpassed low and the master barely lifts
//      presence/air, so the mix's energy sits under ~2.6 kHz. The high band stays
//      open for an SFX transient to cut through. (Proven: centroid gate.)
//   2. DYNAMIC pocket — arrangements stay sparse (rests are where an SFX sits)
//      and the master isn't brickwalled, so a healthy crest factor leaves peak
//      headroom for a one-shot to poke above the bed. (Proven: crest gate.)
// The lead is motific, never a continuous solo — the single biggest lever, since
// a busy melody in the mids is exactly what buries game sound. See soundtrack.test.

import { INSTRUMENTS, type Song, type Note, type Track } from './music';
import { chordNotes, rootless } from './chord';
import { noteToMidi } from './theory';
import type { GenreProfile } from './quality';

const n = (pitch: Note['pitch'], beats: number, vel = 1): Note => ({ pitch, beats, vel });
const rest = (beats: number): Note => ({ pitch: null, beats });

// ── shared arrangement helpers (tuned sparse, for a bed) ───────────────────

/** Two-feel bass: root on 1, a chord tone on 3, a chromatic approach lifting into
 * the next bar's root. Half as busy as a walking line — it grooves and breathes. */
function twoFeel(changes: string[], oct = 2): Note[][] {
  return changes.map((sym, i) => {
    const c = chordNotes(sym, oct);
    const root = c[0];
    const fifth = c[2] ?? root + 7;
    const nextRoot = chordNotes(changes[(i + 1) % changes.length], oct)[0];
    const approach = nextRoot + (root <= nextRoot ? -1 : 1);
    return [n(root, 1.5, 0.9), rest(0.5), n(fifth, 1, 0.62), n(approach, 1, 0.6)];
  });
}

/** Full walking bass — for the tension cue, where a driving four wants forward
 * motion (still round and lowpassed, so it stays under the SFX band). */
function walk(changes: string[], oct = 2): Note[][] {
  return changes.map((sym, i) => {
    const c = chordNotes(sym, oct);
    const root = c[0];
    const third = c[1] ?? root + 3;
    const fifth = c[2] ?? root + 7;
    const nextRoot = chordNotes(changes[(i + 1) % changes.length], oct)[0];
    const approach = nextRoot + (root <= nextRoot ? -1 : 1);
    return [n(root, 1, 0.9), n(third, 1, 0.68), n(fifth, 1, 0.72), n(approach, 1, 0.64)];
  });
}

/** Rootless Rhodes comping, hit on a lazy Charleston (1 and the "and" of 2) with
 * a whole bar of rest after — the rests are deliberate: that silence is a seat
 * for an SFX. `target` recenters the voicing so it stays mid, never shrill. */
function comp(changes: string[], oct = 4, target = 'F4', vel = 0.58): Note[][] {
  const t = noteToMidi(target);
  return changes.map((sym, i) => {
    const v = rootless(chordNotes(sym, oct), t);
    return i % 2 === 0
      ? [n(v, 1, vel), rest(0.5), n(v, 0.5, vel * 0.75), rest(2)]
      : [rest(1.5), n(v, 0.5, vel * 0.8), rest(2)];
  });
}

/** Sustained pad comping — hold the voicing, felt not heard (title/reward). */
function pad(changes: string[], oct = 4, target = 'F4', vel = 0.5): Note[][] {
  const t = noteToMidi(target);
  return changes.map((sym) => [n(rootless(chordNotes(sym, oct), t), 4, vel)]);
}

/** A soft jazz ride, kept quiet and rolled off up top so it doesn't mask hats-y
 * SFX. The off-8ths get swung by renderSong. */
function ride(gain = 0.34, bars = 8): Track {
  return {
    name: 'ride',
    instrument: { ...INSTRUMENTS.ride, volume: 0.15, highpass: 1600, lowpass: 6500, release: 0.24 },
    gain, pan: 0.12,
    patterns: [[n('C6', 1, 0.5), n('C6', 0.5, 0.3), n('C6', 0.5, 0.42), n('C6', 1, 0.5), n('C6', 0.5, 0.3), n('C6', 0.5, 0.42)]],
    sequence: Array(bars).fill(0),
  };
}

/** Brushed backbeat — a felt pulse on 2 and 4, low in the mix. */
function brush(gain = 0.4, bars = 8): Track {
  return {
    name: 'brush',
    instrument: { ...INSTRUMENTS.snare, volume: 0.13, highpass: 1400, lowpass: 5200, release: 0.14 },
    gain,
    patterns: [[rest(1), n('D4', 1, 0.5), rest(1), n('D4', 1, 0.55)]],
    sequence: Array(bars).fill(0),
  };
}

/** A whisper of room warmth — the lounge patina, very low so it never hisses
 * into the SFX band. */
function room(gain = 0.28, bars = 8): Track {
  return {
    name: 'room',
    instrument: { wave: 'noise', attack: 0.7, release: 0.7, sustainLevel: 1, volume: 0.024, lowpass: 2400, highpass: 300 },
    gain,
    patterns: [[n('C4', bars * 4, 1)]],
    sequence: [0],
  };
}

export interface SoundtrackCue {
  id: string;
  /** The game state this cue underscores. */
  state: 'title' | 'explore' | 'tension' | 'reward';
  title: string;
  intent: string;
  make: () => Song;
}

// The "coin" motif — a bright, resolving three-note gold figure (sol–la–do). It
// opens the title cue, hides inside the explore bed, and lands, resolved, on
// reward. Vibraphone carries it (Gold = the reward voice in the Regalia map).
// Stated here in F; transposed per cue.

// ── 1. Foyer (title / menu) ────────────────────────────────────────────────
// A warm, unhurried welcome. Medium swing in F major with a 6/9 sheen. Rhodes
// vamps, the upright walks a two-feel, the vibes state the coin motif and leave.
// Inviting, but it steps back the instant play starts.
function foyer(): Song {
  const A = ['F6/9', 'Dm9', 'Gm9', 'C13', 'Am7', 'Dm9', 'Gm9', 'C7alt'];
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.uprightBass, volume: 0.46, lowpass: 900 }, gain: 0.66,
    patterns: twoFeel(A, 2), sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const rhodes: Track = {
    name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.28, lowpass: 2200 }, gain: 0.56, pan: -0.16,
    patterns: comp(A, 4, 'F4', 0.56), sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const vibe: Track = {
    name: 'vibes', instrument: { ...INSTRUMENTS.vibraphone, volume: 0.3, lowpass: 2600 }, gain: 0.56, pan: 0.16,
    patterns: [
      // the coin motif: C5–D5–F5 (sol–la–do), stated then left to ring
      [n('C5', 0.5, 0.7), n('D5', 0.5, 0.62), n('F5', 1.5, 0.72), rest(1.5)],
      [rest(2), n('A4', 1, 0.6), n('C5', 1, 0.58)],
      [n('Bb4', 1, 0.66), n('D5', 1, 0.6), rest(2)],
      [rest(1.5), n('E5', 1, 0.62), n('C5', 1.5, 0.58)], // C13 colour
      [n('C5', 1, 0.64), rest(3)],
      [rest(2), n('A4', 1, 0.6), n('D5', 1, 0.58)],
      [n('Bb4', 1.5, 0.64), rest(2.5)],
      [n('Ab4', 1, 0.62), n('B4', 1, 0.58), rest(2)], // C7alt tension, unresolved into the loop
    ],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  return {
    bpm: 92, tracks: [room(0.26), bass, rhodes, vibe, brush(0.36), ride(0.3)],
    swing: 0.58, humanize: 0.34, velBrightness: 0.55,
    reverb: { wet: 0.24, roomSize: 0.7, damp: 0.6 },
    master: { lowCut: 0.28, presence: 0.08, air: 0.02, compress: 0.35 },
  };
}

// ── 2. The Long Gallery (explore / main loop) ──────────────────────────────
// The core bed — the cue that plays for minutes while the player works. Cool,
// minimal C-minor lounge. Upright groove + sparse Rhodes stabs + soft ride, and
// deliberately NO lead melody: the whole midrange is left vacant for footsteps,
// pickups, and blips. This is the "space for SFX" showcase.
function longGallery(): Song {
  const A = ['Cm9', 'Cm9', 'Fm9', 'Fm9', 'Dm7b5', 'G7alt', 'Cm9', 'Ab6/9'];
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.uprightBass, volume: 0.48, lowpass: 850 }, gain: 0.68,
    patterns: twoFeel(A, 2), sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const rhodes: Track = {
    name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.24, lowpass: 2000 }, gain: 0.5, pan: -0.18,
    patterns: comp(A, 4, 'Eb4', 0.5), sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  // one vibe note per two bars — a glint, not a tune. Hides fragments of the motif.
  const vibe: Track = {
    name: 'vibes', instrument: { ...INSTRUMENTS.vibraphone, volume: 0.24, lowpass: 2400 }, gain: 0.46, pan: 0.18,
    patterns: [
      [rest(2), n('G4', 1.5, 0.55), rest(0.5)],
      [rest(4)],
      [n('Ab4', 1, 0.52), rest(3)],
      [rest(4)],
      [rest(2), n('F4', 1, 0.55), n('Ab4', 1, 0.5)],
      [rest(4)],
      [rest(1.5), n('Eb4', 1.5, 0.55), rest(1)],
      [rest(4)],
    ],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  return {
    bpm: 86, tracks: [room(0.3), bass, rhodes, vibe, brush(0.32), ride(0.26)],
    swing: 0.6, humanize: 0.36, velBrightness: 0.55,
    reverb: { wet: 0.22, roomSize: 0.66, damp: 0.6 },
    master: { lowCut: 0.3, presence: 0.06, air: 0.015, compress: 0.3 },
  };
}

// ── 3. Quickening (tension / timer) ────────────────────────────────────────
// The clock is running. F-minor funk with a clav riff and a full walking bass —
// urgency and forward motion — but still a bed: no shrieking lead, the top stays
// rolled off, and a gentle pump gives it a pulse without brickwalling. Alarm SFX
// still cut clean over it.
function quickening(): Song {
  const A = ['Fm9', 'Fm9', 'Bbm9', 'Bbm9', 'Dbmaj7', 'C7alt', 'Fm9', 'C7alt'];
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.bass, volume: 0.4, lowpass: 950, sub: 0.24, release: 0.08 }, gain: 0.58,
    patterns: walk(A, 2), sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const clav: Track = {
    name: 'clav', instrument: { ...INSTRUMENTS.clav, volume: 0.2, lowpass: 2400 }, gain: 0.44, pan: -0.16,
    patterns: [
      [n('F4', 0.25, 0.72), rest(0.25), n('Ab4', 0.25, 0.55), rest(0.75), n('C5', 0.5, 0.6), rest(1.5)],
      [n('F4', 0.25, 0.7), rest(0.5), n('Eb4', 0.25, 0.55), rest(0.5), n('C4', 0.5, 0.58), rest(1.5)],
      [n('Bb3', 0.25, 0.72), rest(0.25), n('Db4', 0.25, 0.55), rest(0.75), n('F4', 0.5, 0.6), rest(1.5)],
      [n('Bb3', 0.25, 0.7), rest(0.5), n('Ab4', 0.25, 0.55), rest(0.5), n('F4', 0.5, 0.58), rest(1.5)],
    ],
    sequence: [0, 1, 2, 3, 0, 1, 2, 3],
  };
  const kick: Track = {
    name: 'kick', instrument: { ...INSTRUMENTS.kick, volume: 0.44 }, gain: 0.52,
    patterns: [[n('F1', 1, 0.78), rest(1.5), n('F1', 0.5, 0.5), rest(1)]],
    sequence: Array(8).fill(0),
  };
  const snare: Track = {
    name: 'snare', instrument: { ...INSTRUMENTS.snare, volume: 0.22, highpass: 1000, lowpass: 5500 }, gain: 0.44,
    patterns: [[rest(1), n('D4', 1, 0.56), rest(1), n('D4', 1, 0.6)]], sequence: Array(8).fill(0),
  };
  const hat: Track = {
    name: 'hat', instrument: { ...INSTRUMENTS.hat, volume: 0.1, highpass: 4200, lowpass: 8000 }, gain: 0.26, pan: 0.1,
    patterns: [[rest(0.5), n('C6', 0.5, 0.42), rest(0.5), n('C6', 0.5, 0.3)]], sequence: Array(16).fill(0),
  };
  return {
    bpm: 112, tracks: [bass, clav, kick, snare, hat],
    swing: 0.5, humanize: 0.2, velBrightness: 0.55,
    sidechain: { depth: 0.2, beatsPerCycle: 1 },
    reverb: { wet: 0.12, roomSize: 0.5, damp: 0.55 },
    master: { lowCut: 0.32, presence: 0.1, air: 0.03, compress: 0.2 },
  };
}

// ── 4. Bright Coin (reward / clear) ────────────────────────────────────────
// A short, warm loop that lands the coin motif — resolved, in major — when the
// player pockets the prize. Vibes-forward (Gold, the reward voice), quick and
// loopable so it can underscore a results screen. Still leaves the very top open
// for the coin/chime SFX that plays on the beat.
function brightCoin(): Song {
  const A = ['Fmaj9', 'Dm9', 'Gm9', 'C13', 'Fmaj9', 'A7b9', 'Dm9', 'G13'];
  const bass: Track = {
    name: 'bass', instrument: { ...INSTRUMENTS.uprightBass, volume: 0.46, lowpass: 950 }, gain: 0.64,
    patterns: twoFeel(A, 2), sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const rhodes: Track = {
    name: 'rhodes', instrument: { ...INSTRUMENTS.rhodes, volume: 0.28, lowpass: 2200, release: 0.5 }, gain: 0.54, pan: -0.14,
    patterns: pad(A, 4, 'A4', 0.5), sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  const vibe: Track = {
    name: 'vibes', instrument: { ...INSTRUMENTS.vibraphone, volume: 0.3, lowpass: 2700 }, gain: 0.58, pan: 0.16,
    patterns: [
      // the coin motif resolved up to the tonic: C–D–F–A (sol–la–do–mi), landing
      [n('C5', 0.5, 0.72), n('D5', 0.5, 0.66), n('F5', 1, 0.78), n('A5', 1, 0.72), rest(1)],
      [n('A4', 1, 0.62), n('D5', 1, 0.6), rest(2)],
      [n('Bb4', 1, 0.64), n('D5', 1, 0.6), n('G5', 1.5, 0.62), rest(0.5)],
      [n('E5', 1.5, 0.66), n('C5', 1.5, 0.6), rest(1)], // C13
      [n('C5', 0.5, 0.7), n('F5', 1, 0.74), n('A5', 1.5, 0.7), rest(1)], // reprise, higher
      [n('C5', 1, 0.62), n('Bb4', 1, 0.58), n('A4', 2, 0.56)], // A7b9 colour
      [n('A4', 1, 0.62), n('F5', 1, 0.6), rest(2)],
      [n('B4', 1, 0.62), n('D5', 1, 0.58), n('F5', 2, 0.6)], // G13 → loops back to Fmaj9
    ],
    sequence: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  return {
    bpm: 104, tracks: [room(0.24), bass, rhodes, vibe, brush(0.34), ride(0.28)],
    swing: 0.56, humanize: 0.3, velBrightness: 0.55,
    reverb: { wet: 0.22, roomSize: 0.68, damp: 0.55 },
    master: { lowCut: 0.28, presence: 0.1, air: 0.03, compress: 0.4 },
  };
}

/**
 * A scoring target for BACKGROUND game music — a distinct job from a listening
 * mix, so it gets its own window, not jazzfunk's. Darker (top left open),
 * quieter (it's a bed), and more dynamic (headroom for SFX). This is the honest
 * gate: "professional quality *for underscore*," proven, not asserted.
 */
export const BACKGROUND_PROFILE: GenreProfile = {
  tempo: [80, 118],
  centroid: [1100, 2600],
  onsets: [3, 13],
  rms: [0.08, 0.18],
  crestDb: [10, 22],
  width: [0.03, 0.6],
  maxMud: 0.48,
};

/** The soundtrack. */
export const SOUNDTRACK = {
  title: 'Palace Hours',
  subtitle: 'Original Game Soundtrack',
  concept:
    'The underscore to a light, stylish caper in a gilded Regalia court — you slip through halls ' +
    'lifting trinkets on a timer. Funky, jazzy lounge that scores the play and gets out of the way: ' +
    'four looping cues, one motif, a pocket kept open for every coin, blip and footstep.',
  /** The engineering promise this score is built to keep — measured in the tests. */
  designNote:
    'Background-first: voices lowpassed low and a near-flat master keep the mix under ~2.6 kHz ' +
    '(the high band stays open for bright SFX), and sparse, un-brickwalled arrangements preserve ' +
    'crest-factor headroom so a one-shot pops over the bed. The lead is motific, never a solo.',
  cues: [
    { id: 'foyer', state: 'title', title: 'Foyer', intent: 'Title / menu — a warm, unhurried welcome that steps back the moment play starts.', make: foyer },
    { id: 'long-gallery', state: 'explore', title: 'The Long Gallery', intent: 'Explore loop — cool minimal lounge with no lead at all; the midrange is the SFX’s.', make: longGallery },
    { id: 'quickening', state: 'tension', title: 'Quickening', intent: 'Tension / timer — a driving clav funk that pushes without ever shouting.', make: quickening },
    { id: 'bright-coin', state: 'reward', title: 'Bright Coin', intent: 'Reward / clear — the coin motif landing, resolved, in major. Short and loopable.', make: brightCoin },
  ] as SoundtrackCue[],
};

/** Look up a cue by id. */
export function soundtrackCue(id: string): SoundtrackCue | undefined {
  return SOUNDTRACK.cues.find((c) => c.id === id);
}

/** Look up the cue for a game state. */
export function cueForState(state: SoundtrackCue['state']): SoundtrackCue | undefined {
  return SOUNDTRACK.cues.find((c) => c.state === state);
}

// "Hayabox" — the consort in a box. A Creaksbox-style loop toy: six courtiers,
// one per Regalia job, each holding a short loop of the same eight-bar cycle.
// Wake any subset and it grooves, because every choice below defends ONE
// invariant: ALL melodic material lives in A minor pentatonic (A C D E G).
// With no semitone anywhere in the pitch pool, no combination of stems can
// produce a clash — "any subset harmonizes" is a property of the data, not a
// hope. lintDeck proves the clock side (equal tempo, whole bars, divisor
// lengths); hayabox.test.ts proves key, structure, and the rendered mix.
//
// The implied changes (all subsets of the pentatonic pool):
//   Am7 · Am7 · C · C · Dsus2 · Dsus2 · Am7 · Am7
// Bass roots A A C C D D A A — an eight-bar breath: home, lift, home.
//
// Each courtier has two MOODS (alternate stems for the same seat — swap, not
// stack). Every stem is exactly 32 beats at 96 bpm and carries a `mix` level:
// renderSong normalizes each render to full scale, so ensemble balance is
// restored at playback via PreparedStem.gain (see audio.ts).

import { INSTRUMENTS, stepPattern, type Instrument, type Note, type Song, type Track } from './music';
import type { DeckSpec, LoopStem } from './loopdeck';

const n = (pitch: Note['pitch'], beats: number, vel = 1): Note => ({ pitch, beats, vel });
const rest = (beats: number): Note => ({ pitch: null, beats });

export const HAYABOX_BPM = 96;
export const HAYABOX_BEATS_PER_BAR = 4;
export const HAYABOX_BARS = 8;
const LOOP_BEATS = HAYABOX_BEATS_PER_BAR * HAYABOX_BARS; // 32

/** The whole pitch pool — A minor pentatonic. The no-clash guarantee. */
export const HAYABOX_SCALE: ReadonlyArray<string> = ['A', 'C', 'D', 'E', 'G'];

/** Feel shared by every stem — identical grid, so swung 8ths interlock. */
const FEEL: Pick<Song, 'bpm' | 'swing' | 'humanize'> = { bpm: HAYABOX_BPM, swing: 0.1, humanize: 0.05 };

function stem(tracks: Track[]): Song {
  return { ...FEEL, tracks };
}

// ── voices (soft synthesis: sine / triangle / noise, warm and rounded) ─────

const VOICE = {
  /** The Herald — bright pentatonic lead; pluck that closes down. */
  herald: { wave: 'triangle', attack: 0.004, decay: 0.3, sustainLevel: 0.35, release: 0.3, volume: 0.42, lowpass: 3400, detune: 5, envCurve: 2.2, filterEnv: 1.2, filterEnvTime: 0.12 } as Instrument,
  /** The Chancellor — round sub bass, bone dry. */
  chancellor: { ...INSTRUMENTS.uprightBass, lowpass: 900, sub: 0.45, release: 0.14 } as Instrument,
  /** The Gardener — glassy arpeggio droplets. */
  gardener: { wave: 'triangle', attack: 0.002, decay: 0.16, sustainLevel: 0.15, release: 0.22, volume: 0.36, lowpass: 4200, detune: 4, envCurve: 2.6 } as Instrument,
  /** The Consoler — a pad that blooms open from dark. */
  consoler: { wave: 'triangle', attack: 0.35, release: 0.9, sustainLevel: 0.9, volume: 0.2, lowpass: 1900, detune: 14, vibrato: 0.06, vibratoFreq: 4.2, filterEnv: -1.4, filterEnvTime: 0.9 } as Instrument,
  /** The Forester — warm mid counter-voice, guitar-ish. */
  forester: { ...INSTRUMENTS.jazzGuitar, volume: 0.34, lowpass: 2200 } as Instrument,
} as const;

// ── stems ──────────────────────────────────────────────────────────────────

function heraldCall(): Song {
  return stem([
    {
      name: 'herald',
      instrument: VOICE.herald,
      gain: 0.7,
      pan: 0.12,
      patterns: [
        // call (bars 1–4)
        [n('E5', 1, 0.9), n('G5', 0.5, 0.7), n('A5', 1.5, 0.85), rest(1), rest(1.5), n('G5', 0.5, 0.7), n('E5', 1, 0.8), n('D5', 1, 0.7), n('C5', 1.5, 0.8), n('D5', 0.5, 0.65), n('E5', 2, 0.85), rest(2), n('A4', 0.5, 0.6), n('C5', 0.5, 0.7), n('D5', 1, 0.75)],
        // answer (bars 5–8)
        [n('E5', 1, 0.9), n('D5', 0.5, 0.7), n('C5', 1.5, 0.8), rest(1), rest(1), n('A4', 1, 0.7), n('C5', 1, 0.75), n('D5', 1, 0.7), n('E5', 1.5, 0.85), n('G5', 0.5, 0.7), n('A5', 2, 0.9), rest(2.5), n('G5', 0.5, 0.6), n('E5', 1, 0.7)],
      ],
      sequence: [0, 1],
    },
  ]);
}

function heraldLace(): Song {
  // The ornamented mood: tighter turns, still all rests where others speak.
  return stem([
    {
      name: 'herald',
      instrument: { ...VOICE.herald, volume: 0.38 },
      gain: 0.66,
      pan: 0.12,
      patterns: [
        [n('A5', 0.5, 0.85), n('G5', 0.5, 0.7), n('E5', 0.5, 0.75), n('D5', 0.5, 0.65), n('E5', 1.5, 0.8), rest(0.5), rest(1), n('C5', 0.5, 0.65), n('D5', 0.5, 0.7), n('E5', 0.5, 0.75), n('G5', 0.5, 0.7), n('A5', 1, 0.85), rest(3), n('G5', 0.5, 0.6), n('A5', 0.5, 0.7), n('C6', 1.5, 0.85), n('A5', 0.5, 0.65), n('G5', 1, 0.7), rest(1)],
        [rest(1), n('E5', 0.5, 0.7), n('D5', 0.5, 0.65), n('C5', 1, 0.75), n('A4', 1, 0.7), n('D5', 0.5, 0.7), n('E5', 0.5, 0.75), n('D5', 0.5, 0.65), n('C5', 0.5, 0.6), n('D5', 2, 0.8), rest(2), n('E5', 0.5, 0.7), n('G5', 0.5, 0.75), n('A5', 1, 0.85), rest(1.5), n('G5', 0.5, 0.6), n('E5', 2, 0.75)],
      ],
      sequence: [0, 1],
    },
  ]);
}

/** Bass bar: root held long, a breath, then the pentatonic fifth up. */
function groundBar(root: string, up: string): Note[] {
  return [n(root, 2.5, 0.9), rest(0.5), n(up, 1, 0.62)];
}

function chancellorGround(): Song {
  return stem([
    {
      name: 'chancellor',
      instrument: VOICE.chancellor,
      gain: 0.9,
      patterns: [groundBar('A2', 'E3'), groundBar('C3', 'G3'), groundBar('D3', 'A3'), [n('A2', 2.5, 0.9), rest(0.5), n('G2', 1, 0.6)]],
      sequence: [0, 0, 1, 1, 2, 2, 0, 3],
    },
  ]);
}

function chancellorStroll(): Song {
  // Two-feel walk — approach tones stay INSIDE the pentatonic pool.
  const bar = (a: string, b: string, c: string, d: string): Note[] => [n(a, 1.5, 0.9), rest(0.5), n(b, 1, 0.65), n(c, 0.5, 0.6), n(d, 0.5, 0.62)];
  return stem([
    {
      name: 'chancellor',
      instrument: VOICE.chancellor,
      gain: 0.9,
      patterns: [bar('A2', 'E3', 'D3', 'C3'), bar('C3', 'G3', 'E3', 'D3'), bar('D3', 'A3', 'G3', 'E3'), bar('A2', 'E3', 'G2', 'A2')],
      sequence: [0, 0, 1, 1, 2, 2, 0, 3],
    },
  ]);
}

function chancellorSilk(): Song {
  // OUR silky smoothBass — a round, dark, fingered voice playing long LEGATO
  // notes. It still walks the court's A A C C D D A A roots (so it locks with
  // the ensemble's changes), but glides between pentatonic neighbours and reaches
  // the octave over the D bars — a softer, more melodic mood for the bass seat.
  const silk: Instrument = { ...INSTRUMENTS.smoothBass, sub: 0.12, lowpass: 1200 };
  const barA: Note[] = [n('A2', 1.5, 0.9), n('C3', 0.5, 0.66), n('A2', 1, 0.85), n('E3', 0.5, 0.66), n('D3', 0.5, 0.7)];
  const barC: Note[] = [n('C3', 1.5, 0.9), n('E3', 0.5, 0.66), n('C3', 1, 0.85), n('G3', 0.5, 0.66), n('E3', 0.5, 0.7)];
  const barD: Note[] = [n('D3', 1, 0.9), n('E3', 0.5, 0.72), n('G3', 0.5, 0.74), n('A3', 1, 0.82), n('G3', 0.5, 0.7), n('E3', 0.5, 0.68)];
  const barTurn: Note[] = [n('A2', 1, 0.9), n('E3', 0.5, 0.72), n('D3', 0.5, 0.72), n('C3', 0.5, 0.7), n('D3', 0.5, 0.72), n('E3', 0.5, 0.74), n('G3', 0.5, 0.78)];
  return stem([
    { name: 'chancellor', instrument: silk, gain: 0.88, patterns: [barA, barC, barD, barTurn], sequence: [0, 0, 1, 1, 2, 2, 0, 3] },
  ]);
}

function gardenerRain(): Song {
  const run = (ps: string[]): Note[] => ps.map((p, i) => n(p, 0.5, i % 2 === 0 ? 0.7 : 0.5));
  return stem([
    {
      name: 'gardener',
      instrument: VOICE.gardener,
      gain: 0.55,
      pan: -0.22,
      patterns: [
        run(['A4', 'C5', 'E5', 'G5', 'A5', 'G5', 'E5', 'C5']), // Am7
        run(['G4', 'C5', 'E5', 'G5', 'E5', 'C5', 'G4', 'E5']), // C
        run(['A4', 'D5', 'E5', 'A5', 'E5', 'D5', 'A4', 'E5']), // Dsus
      ],
      sequence: [0, 0, 1, 1, 2, 2, 0, 0],
    },
  ]);
}

function gardenerBloom(): Song {
  // Sparse high sparkles — quarter droplets instead of the full rain.
  return stem([
    {
      name: 'gardener',
      instrument: { ...VOICE.gardener, release: 0.5, volume: 0.32 },
      gain: 0.5,
      pan: -0.22,
      patterns: [
        [n('E5', 1, 0.6), rest(1), n('A5', 1, 0.7), n('G5', 1, 0.5)],
        [n('G5', 1, 0.6), rest(1), n('C6', 1, 0.65), n('G5', 1, 0.45)],
        [n('A5', 1, 0.6), rest(1), n('D6', 1, 0.65), n('E5', 1, 0.5)],
      ],
      sequence: [0, 0, 1, 1, 2, 2, 0, 0],
    },
  ]);
}

function consolerHold(): Song {
  return stem([
    {
      name: 'consoler',
      instrument: VOICE.consoler,
      gain: 0.5,
      patterns: [
        [n(['A3', 'C4', 'E4', 'G4'], 8, 0.8)], // Am7
        [n(['C4', 'E4', 'G4'], 8, 0.75)], // C
        [n(['D4', 'E4', 'A4'], 8, 0.78)], // Dsus2
      ],
      sequence: [0, 1, 2, 0],
    },
  ]);
}

function consolerSwell(): Song {
  // Quartal swells that breathe every two beats — more motion, same warmth.
  return stem([
    {
      name: 'consoler',
      instrument: { ...VOICE.consoler, attack: 0.18, release: 0.6 },
      gain: 0.48,
      patterns: [
        [n(['A3', 'D4', 'G4'], 2, 0.75), n(['C4', 'E4', 'A4'], 2, 0.7)],
        [n(['C4', 'G4', 'C5'], 2, 0.72), n(['E4', 'G4', 'C5'], 2, 0.66)],
        [n(['D4', 'A4', 'D5'], 2, 0.72), n(['E4', 'A4', 'D5'], 2, 0.66)],
      ],
      sequence: [0, 0, 1, 1, 2, 2, 0, 0],
    },
  ]);
}

// The Fool's kit — OUR kick and snare (this is the drum work we built, ported
// into the box). A REAL layered snare (a pitched body + a wire-rattle noise
// layer) instead of the old rimshot, every pitch inside the pentatonic pool
// (kick A, snare body C, wires A — noise ignores pitch, but the DATA stays
// in-key so the "zero out-of-key notes" proof holds even for the drums).
const FOOL_KICK: Instrument = { ...INSTRUMENTS.kick, volume: 0.6, punch: 0.35, sub: 0.24 };

/** Build the kick + layered-snare tracks from step grids (drummer's grid form). */
function foolKit(kickGrids: string[], kickSeq: number[], snareGrids: string[], snareSeq: number[]): Track[] {
  return [
    { name: 'kick', instrument: FOOL_KICK, gain: 0.82, patterns: kickGrids.map((g) => stepPattern(g, 'A2')), sequence: kickSeq },
    { name: 'snare-body', instrument: { ...INSTRUMENTS.snareBody }, gain: 0.7, patterns: snareGrids.map((g) => stepPattern(g, 'C4')), sequence: snareSeq },
    { name: 'snare-wires', instrument: { ...INSTRUMENTS.snareWires }, gain: 0.54, patterns: snareGrids.map((g) => stepPattern(g, 'A4')), sequence: snareSeq },
  ];
}

function foolBackbeat(): Song {
  // The developed eight-bar groove: kick on 1/3/&3, snare on the 2-and-4
  // backbeat, ghost-note fills turning the four-bar corners, a bar-8 turnaround.
  return stem(
    foolKit(
      ['X... .... X.X. ....', 'X... .... ..X. ....', 'X... .... X.X. X.XX'],
      [0, 1, 0, 1, 0, 1, 0, 2],
      ['.... X... .... X...', '.... X..2 .... X..2', '.... X... ..2. X.23', '.... X..2 2.2. X234'],
      [0, 1, 0, 2, 0, 1, 0, 3],
    ),
  );
}

function foolBreak(): Song {
  // The same seat leaning in: a driving syncopated kick and ghost-note "talk"
  // on the snare, with a fill every four bars.
  return stem(
    foolKit(
      ['X..X ..X. X.X. ..X.', 'X..X ..X. X.X. X.XX'],
      [0, 0, 0, 1, 0, 0, 0, 1],
      ['..2. X.2. ..2. X.2.', '..2. X.2. 2.2. X234'],
      [0, 0, 0, 1, 0, 0, 0, 1],
    ),
  );
}

function foresterPath(): Song {
  return stem([
    {
      name: 'forester',
      instrument: VOICE.forester,
      gain: 0.55,
      pan: -0.1,
      patterns: [
        [rest(0.5), n('E4', 1, 0.7), n('G4', 0.5, 0.55), n('A4', 1.5, 0.7), rest(0.5), rest(1), n('G4', 1, 0.6), n('E4', 1, 0.65), n('D4', 1, 0.6), n('E4', 2.5, 0.7), rest(1.5), rest(2), n('C4', 0.5, 0.5), n('D4', 0.5, 0.6), n('E4', 1, 0.65)],
        [rest(0.5), n('G4', 1, 0.7), n('A4', 0.5, 0.55), n('G4', 1.5, 0.65), rest(0.5), rest(1), n('E4', 1, 0.62), n('D4', 1, 0.6), n('C4', 1, 0.58), n('A3', 2.5, 0.68), rest(1.5), rest(2.5), n('D4', 0.5, 0.55), n('E4', 1, 0.62)],
      ],
      sequence: [0, 1],
    },
  ]);
}

function foresterDusk(): Song {
  // Long held dyads under everything — the forest floor.
  return stem([
    {
      name: 'forester',
      instrument: { ...VOICE.forester, attack: 0.2, release: 0.8, sustainLevel: 0.8, volume: 0.26, vibrato: 0.05, vibratoFreq: 4 },
      gain: 0.5,
      pan: -0.1,
      patterns: [
        [n(['A3', 'E4'], 8, 0.7)],
        [n(['G3', 'E4'], 8, 0.66)],
        [n(['D4', 'A4'], 8, 0.68)],
      ],
      sequence: [0, 1, 2, 0],
    },
  ]);
}

// ── the court ──────────────────────────────────────────────────────────────

export interface HayaboxMood {
  id: string;
  name: string;
  /** One-line character of this mood, shown in the UI. */
  note: string;
  make: () => Song;
  /** Playback mix level (→ PreparedStem.gain). */
  mix: number;
}

export interface HayaboxCourtier {
  id: string;
  name: string;
  /** The Regalia job this voice answers to. */
  job: 'gold' | 'ink' | 'green' | 'blue' | 'rose' | 'bark';
  /** Musical seat in the ensemble. */
  seat: string;
  blurb: string;
  moods: HayaboxMood[];
}

export const HAYABOX: {
  title: string;
  subtitle: string;
  concept: string;
  bpm: number;
  beatsPerBar: number;
  bars: number;
  courtiers: HayaboxCourtier[];
} = {
  title: 'Hayabox',
  subtitle: 'the consort in a box',
  concept:
    'Six courtiers, six loops of the same eight bars. Wake any of them and the joins land on the next downbeat; every note in the room is A minor pentatonic, so no combination can clash. No audio files — every voice is synthesised from the data in this module.',
  bpm: HAYABOX_BPM,
  beatsPerBar: HAYABOX_BEATS_PER_BAR,
  bars: HAYABOX_BARS,
  courtiers: [
    {
      id: 'herald',
      name: 'The Herald',
      job: 'gold',
      seat: 'lead',
      blurb: 'Carries the tune. Speaks in calls and answers, and leaves the silences where the others live.',
      moods: [
        { id: 'call', name: 'Call', note: 'the plain proclamation', make: heraldCall, mix: 0.7 },
        { id: 'lace', name: 'Lace', note: 'the same news, ornamented', make: heraldLace, mix: 0.66 },
      ],
    },
    {
      id: 'chancellor',
      name: 'The Chancellor',
      job: 'ink',
      seat: 'bass',
      blurb: 'Holds the floor. Root and fifth bone dry, a two-feel walk, or a silky legato line — everything else stands on this.',
      moods: [
        { id: 'ground', name: 'Ground', note: 'long roots, few words', make: chancellorGround, mix: 0.95 },
        { id: 'stroll', name: 'Stroll', note: 'a two-feel walk through the halls', make: chancellorStroll, mix: 0.95 },
        { id: 'silk', name: 'Silk', note: 'a smooth, legato fingered bass', make: chancellorSilk, mix: 0.9 },
      ],
    },
    {
      id: 'gardener',
      name: 'The Gardener',
      job: 'green',
      seat: 'texture',
      blurb: 'Waters everything. Eighth-note droplets cycling the chord of the bar.',
      moods: [
        { id: 'rain', name: 'Rain', note: 'steady droplets on the leaves', make: gardenerRain, mix: 0.55 },
        { id: 'bloom', name: 'Bloom', note: 'sparse sparkles, higher up', make: gardenerBloom, mix: 0.5 },
      ],
    },
    {
      id: 'consoler',
      name: 'The Consoler',
      job: 'blue',
      seat: 'pad',
      blurb: 'Warms the room. Chords that open slowly from dark to light.',
      moods: [
        { id: 'hold', name: 'Hold', note: 'one breath per two bars', make: consolerHold, mix: 0.5 },
        { id: 'swell', name: 'Swell', note: 'quartal swells, breathing faster', make: consolerSwell, mix: 0.48 },
      ],
    },
    {
      id: 'fool',
      name: 'The Fool',
      job: 'rose',
      seat: 'drums',
      blurb: 'Keeps the pulse honest. Kick and a real layered snare — a straight backbeat, or a busier break.',
      moods: [
        { id: 'backbeat', name: 'Backbeat', note: 'kick and a real snare, straight', make: foolBackbeat, mix: 0.75 },
        { id: 'break', name: 'Break', note: 'busier — a driving kick, ghost snares', make: foolBreak, mix: 0.75 },
      ],
    },
    {
      id: 'forester',
      name: 'The Forester',
      job: 'bark',
      seat: 'counter',
      blurb: 'Answers from the middle register — the voice between the bass and the tune.',
      moods: [
        { id: 'path', name: 'Path', note: 'a walking counter-melody', make: foresterPath, mix: 0.55 },
        { id: 'dusk', name: 'Dusk', note: 'held dyads, the forest floor', make: foresterDusk, mix: 0.5 },
      ],
    },
  ],
};

/**
 * Build the deck for a chosen mood per courtier (default: each courtier's
 * first mood). Feed the result to `lintDeck`, then prepare each stem's Song
 * and hand the loops to `AudioBus.startLoopDeck`.
 */
export function hayaboxDeck(moodByCourtier: Record<string, string> = {}): DeckSpec {
  const stems: LoopStem[] = HAYABOX.courtiers.map((c) => {
    const want = moodByCourtier[c.id];
    const mood = c.moods.find((m) => m.id === want) ?? c.moods[0];
    return { id: c.id, song: mood.make() };
  });
  return { bpm: HAYABOX_BPM, beatsPerBar: HAYABOX_BEATS_PER_BAR, stems };
}

/**
 * The whole court as ONE Song — every chosen stem's tracks merged, with each
 * track's gain scaled by its mood's mix level. This is the headless proof
 * surface: render it, `assertAudio` it, quality-score it — the "all awake"
 * mix is verified without a browser.
 */
export function hayaboxTutti(moodByCourtier: Record<string, string> = {}): Song {
  const tracks: Track[] = [];
  for (const c of HAYABOX.courtiers) {
    const want = moodByCourtier[c.id];
    const mood = c.moods.find((m) => m.id === want) ?? c.moods[0];
    for (const t of mood.make().tracks) {
      tracks.push({ ...t, name: `${c.id}:${t.name ?? 'voice'}`, gain: (t.gain ?? 0.7) * mood.mix });
    }
  }
  return { ...FEEL, tracks };
}

/** Every stem's loop length is the same 32 beats — handy for UI/progress math. */
export function hayaboxLoopBeats(): number {
  return LOOP_BEATS;
}

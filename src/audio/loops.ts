// Drum-loop library — hand-authored, first-class rhythm assets, the percussive
// cousin of the GENRES songbook. Each loop is plain data built with the
// `stepPattern` grid helper so the groove reads at a glance, and each renders
// through the SAME deterministic synth core as everything else (headless,
// hashable, quality-scored). A loop is both a listenable deliverable and a
// fixture the AI loop can measure and try to beat.

import { INSTRUMENTS, stepPattern, type Song, type Track, type Note } from './music';

// note builder for hand-authoring a melodic lane (the bass), where each step
// carries its own pitch and so can't use the single-pitch step grid.
const n = (pitch: Note['pitch'], beats: number, vel = 1): Note => ({ pitch, beats, vel });

/** A named drum loop for the library — id, human copy, and a builder. */
export interface DrumLoop {
  id: string;
  name: string;
  description: string;
  /** The nearest genre profile to score its mix against. */
  profile: string;
  make: () => Song;
}

// ── Kick, snare & bass — a developed 8-bar funk groove ─────────────────
// An eight-bar phrase with a real arc, not a two-bar loop stamped four times.
// The form is AABA': the core establishes (1–2), a fill turns the four-bar
// corner (bar 4), the bass climbs to its octave for a two-bar lift (5–6), then
// it returns and a turnaround fill leads back to the top (7–8). Kick, snare and
// bass only — no hats. Straight time, faintly humanized — polished, never busy.
//
// Everything is 16 steps = one bar of 16th notes. `X` accent · `x` hit ·
// digits `1`–`9` graded ghost velocity · `.` rest · `|` groups the beats.
function kickSnareGroove(): Song {
  // ── kick: steady core + a bar-8 turnaround pickup ──
  const kickCore = stepPattern('X... .... X.X. ....', 'C2'); // 1, 3, & of 3
  const kickThin = stepPattern('X... .... ..X. ....', 'C2'); // 1, & of 3
  const kickTurn = stepPattern('X... .... X.X. X.XX', 'C2'); // + a pickup into the top
  const kick: Track = {
    name: 'kick',
    instrument: { ...INSTRUMENTS.kick, volume: 0.72, punch: 0.35, sub: 0.24 },
    gain: 0.9,
    patterns: [kickCore, kickThin, kickTurn],
    //          1     2     3     4     5     6     7     8
    sequence: [0, 1, 0, 1, 0, 1, 0, 2],
  };

  // ── snare: backbeat, growing ghost-note "talk", fills at bars 4 and 8 ──
  // The snare is a struck DRUM in two layers (a pitched body + wire noise),
  // hit together on the same grid. Ghosts (the low digits) stay subtle so the
  // fills develop the groove without turning it busy.
  const snareGrids = [
    '.... X... .... X...', // 0 · plain backbeat
    '.... X..2 .... X..2', // 1 · backbeat + soft ghosts (the funk "talk")
    '.... X... ..2. X.23', // 2 · a small fill turning the 4-bar corner
    '.... X..2 2.2. X234', // 3 · a bigger turnaround fill into the loop top
  ];
  const snareSeq = [0, 1, 0, 2, 0, 1, 0, 3];
  const snareBody: Track = {
    name: 'snare-body',
    instrument: { ...INSTRUMENTS.snareBody },
    gain: 0.78,
    patterns: snareGrids.map((g) => stepPattern(g, 'C4')), // ~262 Hz — a tight snare, not a tom
    sequence: snareSeq,
  };
  const snareWires: Track = {
    name: 'snare-wires',
    instrument: { ...INSTRUMENTS.snareWires },
    gain: 0.6, // lifted so the snare's air cuts over the warm bass
    patterns: snareGrids.map((g) => stepPattern(g, 'D4')), // noise — pitch irrelevant
    sequence: snareSeq,
  };

  // ── bass: silky-smooth E-minor pentatonic (E G A B D), DEVELOPING ──
  // Long legato notes, roots locked to the kick on beats 1 and 3. Bars 1–4 sit
  // in the core (A/B); bars 5–6 climb to the octave E3 for a lift (C/D); bar 8
  // walks back down to the root as a turnaround. The round triangle voice (dark,
  // soft attack) is what makes it silk, not buzz.
  const bassCore: Note[] = [
    n('E2', 1.5, 0.9),  // 1  · long, warm root — holds through the 2 backbeat
    n('G2', 0.5, 0.66), // &2 · a soft lift to the b3
    n('E2', 1, 0.85),   // 3  · settle back on the root, with the kick
    n('B2', 0.5, 0.66), // &3 · the 5th, gliding up
    n('A2', 0.5, 0.7),  // 4  · ease down to the 4th
  ];
  const bassTurn: Note[] = [
    n('E2', 1.5, 0.9),  // 1  · the root again, held
    n('G2', 0.5, 0.66), // &2 · b3
    n('E2', 1, 0.85),   // 3  · root, with the kick
    n('D3', 1, 0.74),   // &3 · the b7 up top — a long, silky note
  ];
  const bassLiftA: Note[] = [
    n('E2', 1, 0.9),    // 1  · root
    n('B2', 0.5, 0.72), // &1 · up to the 5th
    n('D3', 0.5, 0.74), // 2  · the b7
    n('E3', 1, 0.82),   // 3  · reach the OCTAVE, with the kick — the lift
    n('D3', 0.5, 0.7),  // &3 · ease back down
    n('B2', 0.5, 0.68), // 4  · the 5th
  ];
  const bassLiftB: Note[] = [
    n('E2', 1, 0.9),    // 1  · root
    n('G2', 0.5, 0.7),  // &1 · b3
    n('A2', 0.5, 0.72), // 2  · 4th — a walk up…
    n('B2', 1, 0.76),   // 3  · …to the 5th, with the kick
    n('D3', 0.5, 0.74), // &3 · b7
    n('E3', 0.5, 0.8),  // 4  · top the octave
  ];
  const bassWalk: Note[] = [
    n('E2', 1, 0.9),    // 1  · root
    n('B2', 0.5, 0.72), // &1
    n('A2', 0.5, 0.72), // 2   a descending…
    n('G2', 0.5, 0.7),  // &2  …turnaround walk…
    n('A2', 0.5, 0.72), // 3   …that lands back…
    n('B2', 0.5, 0.74), // &3
    n('D3', 0.5, 0.78), // 4   …ready to fall to the root at the top
  ];
  const bass: Track = {
    name: 'bass',
    // the smooth fingered voice, trimmed of sub and opened up (lowpass ~1200) so
    // the long legato notes carry warm FINGER harmonics rather than dumping
    // everything into 41 Hz sub. A triangle stays mellow even opened up.
    instrument: { ...INSTRUMENTS.smoothBass, sub: 0.08, lowpass: 1200 },
    gain: 0.46,
    patterns: [bassCore, bassTurn, bassLiftA, bassLiftB, bassWalk],
    //          1     2     3     4     5     6     7     8
    sequence: [0, 1, 0, 1, 2, 3, 0, 4],
  };

  return {
    bpm: 100,
    tracks: [kick, snareBody, snareWires, bass],
    tailSec: 1.5,
    // straight time — no swing. Just a whisper of humanize so it isn't sterile.
    humanize: 0.06,
    velBrightness: 0.5,
    // keep it punchy and dry: a small room to glue, not to wash
    reverb: { wet: 0.1, roomSize: 0.4, damp: 0.6 },
    // glue the kit for loudness, a touch of presence for the snare snap, and
    // tuck the shared boom so kick and bass don't pile up.
    master: { lowCut: 0.4, presence: 0.14, compress: 0.5 },
  };
}

/** The drum-loop library — the rhythm songbook. */
export const LOOPS: DrumLoop[] = [
  {
    id: 'kick-snare',
    name: 'Kick, Snare & Bass',
    description:
      'A developed eight-bar funk groove (AABA′) — kick and snare only, no hats. The backbeat grows ghost-note fills while a silky, legato E-minor bass climbs to its octave for a two-bar lift before a turnaround walks back to the top.',
    profile: 'beat',
    make: kickSnareGroove,
  },
];

/** Look up a loop by id. */
export function loop(id: string): DrumLoop | undefined {
  return LOOPS.find((l) => l.id === id);
}

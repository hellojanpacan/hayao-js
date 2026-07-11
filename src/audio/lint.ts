// The music linter — a deterministic rule-checker for Songs. This is to music
// what assertSolvable is to a puzzle: a machine proof that authored output is
// well-formed and musically sane, run BEFORE anyone listens. The LLM-music
// literature is unanimous that a rule-based gate (not an LLM "judge", which
// reward-hacks) is what keeps generated music in-key and structured. Pure and
// deterministic, so it slots into the verify harness like every other check.

import { noteToMidi, scalePitchClasses, type ScaleName } from './theory';
import { songDuration, type Song, type Note, type Pitch } from './music';
import { SAMPLE_RATE } from './pcm';

export interface MusicLintResult {
  ok: boolean;
  /** Hard failures: malformed data that would render wrong or crash. */
  errors: string[];
  /** Musical smells: renders fine, but likely not what was intended. */
  warnings: string[];
}

function pitchToMidiSafe(p: Pitch): number | null {
  try {
    return typeof p === 'number' ? p : noteToMidi(p);
  } catch {
    return null;
  }
}

function eachPitch(note: Note): Pitch[] {
  if (note.pitch === null || note.pitch === undefined) return [];
  return Array.isArray(note.pitch) ? note.pitch : [note.pitch];
}

export interface LintOptions {
  /** If given, flag notes outside this key/mode as out-of-key warnings. */
  key?: { tonic: Pitch; mode: ScaleName };
  /** Max fraction of out-of-key notes tolerated before it's an error (default 1 = never). */
  maxOutOfKey?: number;
}

/**
 * Lint a Song. Errors block (bad bpm, empty tracks, unparseable pitches, bad
 * pattern indices, non-positive durations, out-of-MIDI-range pitches). Warnings
 * flag musical smells (out-of-key notes, no structural repetition).
 */
export function lintSong(song: Song, opts: LintOptions = {}): MusicLintResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!(song.bpm > 0) || song.bpm < 20 || song.bpm > 400) {
    errors.push(`bpm ${song.bpm} out of sane range [20,400]`);
  }
  if (!song.tracks || song.tracks.length === 0) errors.push('song has no tracks');

  const inKey = opts.key ? scalePitchClasses(pitchToMidiSafe(opts.key.tonic) ?? 0, opts.key.mode) : null;
  let totalNotes = 0;
  let outOfKey = 0;
  const patternUse = new Map<string, number>();

  song.tracks.forEach((track, ti) => {
    const label = track.name ?? `track ${ti}`;
    if (!track.patterns || track.patterns.length === 0) errors.push(`${label}: no patterns`);
    if (!track.sequence || track.sequence.length === 0) errors.push(`${label}: empty sequence`);
    if (track.pan !== undefined && (track.pan < -1 || track.pan > 1)) {
      errors.push(`${label}: pan ${track.pan} out of [-1,1]`);
    }
    for (const idx of track.sequence ?? []) {
      if (idx < 0 || idx >= (track.patterns?.length ?? 0)) {
        errors.push(`${label}: sequence references missing pattern ${idx}`);
        continue;
      }
      const key = `${ti}:${idx}`;
      patternUse.set(key, (patternUse.get(key) ?? 0) + 1);
      for (const note of track.patterns[idx]) {
        if (!(note.beats > 0)) errors.push(`${label}: note with non-positive beats ${note.beats}`);
        if (note.vel !== undefined && (note.vel < 0 || note.vel > 1)) {
          errors.push(`${label}: velocity ${note.vel} out of [0,1]`);
        }
        for (const p of eachPitch(note)) {
          const midi = pitchToMidiSafe(p);
          if (midi === null) {
            errors.push(`${label}: unparseable pitch ${JSON.stringify(p)}`);
            continue;
          }
          if (midi < 0 || midi > 127) errors.push(`${label}: pitch ${p} outside MIDI 0..127`);
          totalNotes++;
          if (inKey && !inKey.has(((midi % 12) + 12) % 12)) outOfKey++;
        }
      }
    }
  });

  if (inKey && totalNotes > 0) {
    const frac = outOfKey / totalNotes;
    const limit = opts.maxOutOfKey ?? 1;
    const msg = `${outOfKey}/${totalNotes} notes (${Math.round(frac * 100)}%) out of key`;
    if (frac > limit) errors.push(msg);
    else if (outOfKey > 0) warnings.push(msg);
  }

  // Structure: if nothing repeats, the piece has no form — a smell, not an error.
  const anyReuse = [...patternUse.values()].some((c) => c > 1);
  if (!anyReuse && song.tracks.length > 0) {
    warnings.push('no pattern is reused — piece may lack structure/repetition');
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** A proxy for a song's synchronous render cost (see {@link songRenderCost}). */
export interface SongRenderCost {
  /** renderSound calls (one per voice per note; chords count each pitch). */
  voices: number;
  /** Musical length in seconds (excl. tail). */
  seconds: number;
  /** Per-sample post-processing work: frames × master-bus passes. */
  sampleOps: number;
  /**
   * True when rendering this song synchronously is likely to blow a frame
   * budget and hitch a running game — the signal to pre-render it off the hot
   * path (`renderSongAsync` / `AudioBus.prepareSong`) instead of `renderSong`
   * inline. A deterministic heuristic (no wall-clock), tuned to the real cost.
   */
  blockingRisk: boolean;
}

/**
 * Estimate the cost of rendering a Song on the main thread. Not milliseconds — a
 * portable, deterministic proxy that scales with the two real drivers of
 * renderSong's cost: the number of voices to synthesize and the per-sample
 * master passes. Use it as a gate ("this cue is too heavy to render inline —
 * prepare it") the way the analysis gates guard the mix. This is the check that
 * would have caught the "playSong freezes the game" bug before a player did.
 */
export function songRenderCost(song: Song, opts: { sampleRate?: number } = {}): SongRenderCost {
  const sr = opts.sampleRate ?? SAMPLE_RATE;
  let voices = 0;
  for (const track of song.tracks ?? []) {
    for (const idx of track.sequence ?? []) {
      const pattern = track.patterns?.[idx];
      if (!pattern) continue;
      for (const note of pattern) voices += eachPitch(note).length;
    }
  }
  const seconds = songDuration(song);
  const frames = Math.max(0, Math.round(seconds * sr));
  const passes = 1 + (song.sidechain ? 1 : 0) + (song.reverb ? 1 : 0) + (song.master ? 1 : 0) + (song.master?.compress ? 1 : 0);
  const sampleOps = frames * passes;
  // ~a handful of frames' worth of work at 60fps on a mid device. Voices dominate
  // (each synthesizes an envelope-shaped buffer); the sample passes add the tail.
  const blockingRisk = voices > 120 || sampleOps > 40_000_000;
  return { voices, seconds, sampleOps, blockingRisk };
}

/**
 * Check that a roman-numeral progression resolves to tonic — a real cadence,
 * not a phrase left hanging. Accepts an ending on I/i, or a V(7)→I/i cadence.
 */
export function cadenceResolves(romans: string[]): boolean {
  if (romans.length === 0) return false;
  const norm = (r: string) => r.trim().toLowerCase().replace(/7$/, '');
  const last = norm(romans[romans.length - 1]);
  return last === 'i';
}

// LoopDeck — vertical-layer loop playback as data (the Creaksbox/Incredibox
// model). A deck is a set of STEMS: short Songs of identical bpm and identical
// bar-multiple length. All stems play as phase-locked loops from one shared
// start instant; "waking" a stem just raises its gain ON THE NEXT BAR BOUNDARY,
// so any combination the player toggles stays in the pocket by construction.
//
// This file is the PURE half: deck validation and the bar clock — plain math,
// fully testable headlessly. The playback half (looping sources + per-stem
// gains on the music bus) is `AudioBus.startLoopDeck` in audio.ts; like all
// playback it is a cosmetic observer and a no-op without an AudioContext.

import { songBeats, type Song } from './music';

/** One layer of a deck: a named stem and the Song that renders its loop. */
export interface LoopStem {
  id: string;
  song: Song;
}

/** A deck of phase-locked stems. */
export interface DeckSpec {
  /** Shared tempo — every stem's Song must agree. */
  bpm: number;
  /** Beats per bar for the toggle grid (default 4). */
  beatsPerBar?: number;
  stems: LoopStem[];
}

/** Seconds in one bar at this tempo/meter. */
export function secondsPerBar(bpm: number, beatsPerBar = 4): number {
  return (60 / bpm) * beatsPerBar;
}

/**
 * Position inside the current bar, 0..1 — the UI/animation sync signal
 * (`elapsedSec` is time since the deck's shared start instant).
 */
export function barPhase(elapsedSec: number, secPerBar: number): number {
  if (secPerBar <= 0) return 0;
  const p = (elapsedSec / secPerBar) % 1;
  return p < 0 ? p + 1 : p;
}

/**
 * The next bar boundary at or after `elapsedSec`, in deck-elapsed seconds.
 * An instant already ON a boundary (within `epsilon`) returns that boundary —
 * a toggle landed exactly on the downbeat joins now, not a bar late.
 */
export function nextBarBoundary(elapsedSec: number, secPerBar: number, epsilon = 1e-6): number {
  if (secPerBar <= 0) return elapsedSec;
  const bars = elapsedSec / secPerBar;
  const down = Math.floor(bars + epsilon);
  return (Math.abs(bars - down) <= epsilon ? down : down + 1) * secPerBar;
}

/**
 * Deck validation — the rule-checker that makes "any subset grooves" a proven
 * property instead of a hope. Returns human-readable problems (empty = valid):
 * every stem shares the deck bpm, is a whole number of bars long, and stem
 * lengths divide the longest stem so independent loops re-align every cycle.
 * Run alongside `lintSong` per stem (key/structure stay lintSong's job).
 */
export function lintDeck(deck: DeckSpec): string[] {
  const problems: string[] = [];
  const beatsPerBar = deck.beatsPerBar ?? 4;
  if (deck.bpm <= 0) problems.push(`deck bpm must be positive (got ${deck.bpm})`);
  if (beatsPerBar <= 0) problems.push(`beatsPerBar must be positive (got ${beatsPerBar})`);
  if (deck.stems.length === 0) problems.push('deck has no stems');
  const seen = new Set<string>();
  let maxBeats = 0;
  for (const stem of deck.stems) {
    if (seen.has(stem.id)) problems.push(`duplicate stem id "${stem.id}"`);
    seen.add(stem.id);
    if (stem.song.bpm !== deck.bpm) {
      problems.push(`stem "${stem.id}" bpm ${stem.song.bpm} != deck bpm ${deck.bpm}`);
    }
    const beats = songBeats(stem.song);
    if (beats <= 0) {
      problems.push(`stem "${stem.id}" is empty (0 beats)`);
      continue;
    }
    if (!Number.isInteger(beats / beatsPerBar)) {
      problems.push(`stem "${stem.id}" is ${beats} beats — not a whole number of ${beatsPerBar}-beat bars`);
    }
    maxBeats = Math.max(maxBeats, beats);
  }
  for (const stem of deck.stems) {
    const beats = songBeats(stem.song);
    if (beats > 0 && maxBeats % beats !== 0) {
      problems.push(`stem "${stem.id}" (${beats} beats) does not divide the longest stem (${maxBeats} beats) — loops would drift apart`);
    }
  }
  return problems;
}

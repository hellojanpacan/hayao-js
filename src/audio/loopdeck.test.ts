import { describe, it, expect } from 'vitest';
import { secondsPerBar, barPhase, nextBarBoundary, lintDeck, type DeckSpec } from './loopdeck';
import type { Song } from './music';

function stemSong(beats: number, bpm = 96): Song {
  return {
    bpm,
    tracks: [
      {
        instrument: { wave: 'sine' },
        patterns: [[{ pitch: 'A3', beats }]],
        sequence: [0],
      },
    ],
  };
}

describe('bar clock', () => {
  it('secondsPerBar: 4/4 at 96bpm is 2.5s', () => {
    expect(secondsPerBar(96, 4)).toBeCloseTo(2.5, 10);
  });

  it('barPhase wraps 0..1', () => {
    expect(barPhase(0, 2.5)).toBe(0);
    expect(barPhase(1.25, 2.5)).toBeCloseTo(0.5);
    expect(barPhase(6.25, 2.5)).toBeCloseTo(0.5);
    expect(barPhase(0, 0)).toBe(0); // degenerate: no crash
  });

  it('nextBarBoundary quantizes up, but an on-the-line instant joins now', () => {
    expect(nextBarBoundary(0, 2.5)).toBe(0);
    expect(nextBarBoundary(0.01, 2.5)).toBeCloseTo(2.5);
    expect(nextBarBoundary(2.4999999, 2.5)).toBeCloseTo(2.5);
    expect(nextBarBoundary(2.5, 2.5)).toBeCloseTo(2.5); // exactly on the downbeat
    expect(nextBarBoundary(2.5000001, 2.5)).toBeCloseTo(2.5); // within epsilon
    expect(nextBarBoundary(3, 2.5)).toBeCloseTo(5);
  });
});

describe('lintDeck', () => {
  it('accepts a valid deck (equal-length, bar-multiple stems)', () => {
    const deck: DeckSpec = {
      bpm: 96,
      beatsPerBar: 4,
      stems: [
        { id: 'a', song: stemSong(32) },
        { id: 'b', song: stemSong(32) },
        { id: 'half', song: stemSong(16) }, // divides the longest — fine
      ],
    };
    expect(lintDeck(deck)).toEqual([]);
  });

  it('rejects tempo mismatch, partial bars, non-divisor lengths, dup ids, empties', () => {
    const deck: DeckSpec = {
      bpm: 96,
      stems: [
        { id: 'a', song: stemSong(32) },
        { id: 'a', song: stemSong(32) }, // duplicate id
        { id: 'slow', song: stemSong(32, 90) }, // wrong bpm
        { id: 'ragged', song: stemSong(30) }, // 7.5 bars
        { id: 'thirds', song: stemSong(12) }, // whole bars but 32 % 12 != 0
        { id: 'void', song: stemSong(0) }, // empty
      ],
    };
    const problems = lintDeck(deck);
    expect(problems.some((p) => p.includes('duplicate stem id "a"'))).toBe(true);
    expect(problems.some((p) => p.includes('"slow" bpm 90'))).toBe(true);
    expect(problems.some((p) => p.includes('"ragged"') && p.includes('whole number'))).toBe(true);
    expect(problems.some((p) => p.includes('"thirds"') && p.includes('drift'))).toBe(true);
    expect(problems.some((p) => p.includes('"void" is empty'))).toBe(true);
  });

  it('flags an empty deck', () => {
    expect(lintDeck({ bpm: 96, stems: [] })).toContain('deck has no stems');
  });
});

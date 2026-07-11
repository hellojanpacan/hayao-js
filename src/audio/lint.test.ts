import { describe, it, expect } from 'vitest';
import { lintSong, cadenceResolves, songRenderCost } from './lint';
import type { Song } from './music';
import { INSTRUMENTS } from './music';
import { SOUNDTRACK } from './soundtrack';

function ok(): Song {
  return {
    bpm: 120,
    tracks: [
      {
        name: 'lead',
        instrument: INSTRUMENTS.lead,
        patterns: [
          [{ pitch: 'C4', beats: 1 }, { pitch: 'E4', beats: 1 }, { pitch: 'G4', beats: 2 }],
        ],
        sequence: [0, 0], // reused → has structure
      },
    ],
  };
}

describe('music linter', () => {
  it('passes a well-formed, in-key, structured song', () => {
    const r = lintSong(ok(), { key: { tonic: 'C4', mode: 'major' } });
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it('errors on out-of-range bpm', () => {
    const s = ok();
    s.bpm = 5;
    expect(lintSong(s).ok).toBe(false);
  });

  it('errors on an unparseable pitch', () => {
    const s = ok();
    s.tracks[0].patterns[0][0].pitch = 'H9';
    const r = lintSong(s);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toContain('unparseable');
  });

  it('errors on a sequence pointing at a missing pattern', () => {
    const s = ok();
    s.tracks[0].sequence = [0, 5];
    expect(lintSong(s).ok).toBe(false);
  });

  it('errors on non-positive note duration', () => {
    const s = ok();
    s.tracks[0].patterns[0][0].beats = 0;
    expect(lintSong(s).ok).toBe(false);
  });

  it('warns (not errors) on a few out-of-key notes', () => {
    const s = ok();
    s.tracks[0].patterns[0].push({ pitch: 'C#4', beats: 1 }); // not in C major
    const r = lintSong(s, { key: { tonic: 'C4', mode: 'major' } });
    expect(r.ok).toBe(true);
    expect(r.warnings.join(' ')).toContain('out of key');
  });

  it('errors when out-of-key exceeds the tolerance', () => {
    const s = ok();
    s.tracks[0].patterns[0] = [{ pitch: 'C#4', beats: 1 }, { pitch: 'F#4', beats: 1 }];
    const r = lintSong(s, { key: { tonic: 'C4', mode: 'major' }, maxOutOfKey: 0.2 });
    expect(r.ok).toBe(false);
  });

  it('warns when no pattern is reused (no structure)', () => {
    const s = ok();
    s.tracks[0].sequence = [0]; // played once, no repetition
    const r = lintSong(s);
    expect(r.warnings.join(' ')).toContain('structure');
  });

  it('cadenceResolves detects tonic resolution', () => {
    expect(cadenceResolves(['I', 'V', 'vi', 'IV', 'I'])).toBe(true);
    expect(cadenceResolves(['i', 'iv', 'V7', 'i'])).toBe(true);
    expect(cadenceResolves(['I', 'V'])).toBe(false);
  });
});

describe('songRenderCost (real-time-safety gate)', () => {
  it('counts voices across the sequence, chords included', () => {
    const s: Song = {
      bpm: 120,
      tracks: [
        {
          instrument: INSTRUMENTS.lead,
          patterns: [[{ pitch: ['C4', 'E4', 'G4'], beats: 1 }, { pitch: 'D4', beats: 1 }]], // 3 + 1 = 4 voices
          sequence: [0, 0], // played twice → 8
        },
      ],
    };
    expect(songRenderCost(s).voices).toBe(8);
  });

  it('clears a tiny cue but flags a full soundtrack cue as a blocking risk', () => {
    const tiny = songRenderCost(ok());
    expect(tiny.blockingRisk).toBe(false);

    // The very cue whose synchronous render froze games (issue #104) must trip the gate.
    const foyer = SOUNDTRACK.cues.find((c) => c.state === 'title')!.make();
    const cost = songRenderCost(foyer);
    expect(cost.voices).toBeGreaterThan(120);
    expect(cost.blockingRisk).toBe(true);
  });
});

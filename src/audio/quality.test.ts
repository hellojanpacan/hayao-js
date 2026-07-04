import { describe, it, expect } from 'vitest';
import { GENRES } from './genres';
import { renderSong, INSTRUMENTS, type Song } from './music';
import { scoreTrack, stereoWidth, GENRE_PROFILES } from './quality';
import { createStereo } from './pcm';

describe('quality scorer', () => {
  it('scores every genre track as high quality (≥ 85)', () => {
    for (const g of GENRES) {
      const q = scoreTrack(renderSong(g.make()), GENRE_PROFILES[g.id]);
      expect(q.score, `${g.name}: ${q.notes.join('; ')}`).toBeGreaterThanOrEqual(85);
    }
  });

  it('has teeth — a boomy, mono, one-note drone scores poorly', () => {
    // a deliberately bad "mix": just a loud sub drone, no highs, no width, no motion
    const bad: Song = {
      bpm: 120,
      tracks: [{ instrument: { ...INSTRUMENTS.subBass, lowpass: 200 }, patterns: [[{ pitch: 'C1', beats: 8 }]], sequence: [0] }],
      tailSec: 0.2,
    };
    const q = scoreTrack(renderSong(bad), GENRE_PROFILES.electronic);
    expect(q.score).toBeLessThan(60);
    // it should specifically flag the problems
    expect(q.notes.join(' ')).toMatch(/lowEnd|brightness|width/);
  });

  it('a clipped/silent buffer is caught', () => {
    const silent = createStereo(1);
    expect(scoreTrack(silent, GENRE_PROFILES.piano).score).toBeLessThan(70);
  });

  it('stereoWidth is ~0 for mono and larger for a panned mix', () => {
    const mono = createStereo(0.1);
    mono.left.fill(0.3);
    mono.right.fill(0.3);
    expect(stereoWidth(mono)).toBeLessThan(0.01);
    const wide = createStereo(0.1);
    for (let i = 0; i < wide.left.length; i++) {
      const s = i % 2 ? 0.2 : -0.2;
      wide.left[i] = 0.3 + s; // common (mid) part + differing (side) part
      wide.right[i] = 0.3 - s;
    }
    expect(stereoWidth(wide)).toBeGreaterThan(0.5);
  });
});

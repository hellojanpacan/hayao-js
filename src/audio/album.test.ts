import { describe, it, expect } from 'vitest';
import { ALBUM, albumTrack } from './album';
import { renderSong } from './music';
import { lintSong } from './lint';
import { signalHash, peak } from './pcm';
import { scoreTrack, GENRE_PROFILES } from './quality';
import { chordNotes } from './chord';

// the album spans 62–128 bpm; widen the jazz-funk tempo band for scoring
const PROFILE = { ...GENRE_PROFILES.jazzfunk, tempo: [55, 135] as [number, number] };

describe('Neon Precinct (album)', () => {
  it('has six titled, intentioned tracks', () => {
    expect(ALBUM.title).toBe('Neon Precinct');
    expect(ALBUM.tracks.length).toBe(6);
    for (const t of ALBUM.tracks) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.intent.length).toBeGreaterThan(0);
    }
    expect(albumTrack('last-call')?.title).toBe('Last Call');
  });

  it('the 7alt voicing is a clean altered dominant (3, b7, b9, b13 — no min/maj 3rd clash)', () => {
    const g = chordNotes('G7alt', 4);
    const root = g[0];
    const ivals = g.map((m) => m - root);
    expect(ivals).toContain(4); // major 3rd
    expect(ivals).not.toContain(3); // no minor 3rd stacked against it
    expect(ivals).not.toContain(15); // no #9 (the old clash)
    expect(ivals).toContain(13); // b9
    expect(ivals).toContain(20); // b13
  });

  for (const t of ALBUM.tracks) {
    describe(t.title, () => {
      const song = t.make();
      it('lints clean and renders deterministically without clipping', () => {
        const lint = lintSong(song);
        expect(lint.ok, lint.errors.join('; ')).toBe(true);
        const a = renderSong(song);
        const b = renderSong(song);
        expect(signalHash(a.left)).toBe(signalHash(b.left));
        expect(peak(a)).toBeLessThanOrEqual(0.9 + 1e-3);
      });
      it('scores as professional quality (≥ 90)', () => {
        const q = scoreTrack(renderSong(song), PROFILE);
        expect(q.score, `${t.title}: ${q.notes.join('; ')}`).toBeGreaterThanOrEqual(90);
      });
    });
  }

  it('the whole album averages high quality (≥ 93)', () => {
    const scores = ALBUM.tracks.map((t) => scoreTrack(renderSong(t.make()), PROFILE).score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avg).toBeGreaterThanOrEqual(93);
  });
});

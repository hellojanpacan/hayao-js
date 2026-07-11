// Hayabox proofs — the "any subset grooves" claim, made mechanical:
//   1. clock: lintDeck passes for every mood combination (equal tempo, whole
//      bars, divisor lengths → phase-lock holds forever);
//   2. key: every stem lints clean against A minor pentatonic with ZERO
//      out-of-key notes — no semitone in the pool, so no combination clashes;
//   3. sound: each stem renders non-silent with headroom, and the tutti (all
//      six awake) renders as a healthy mix — asserted on features, headless.

import { describe, it, expect } from 'vitest';
import { HAYABOX, HAYABOX_BPM, hayaboxDeck, hayaboxTutti, hayaboxLoopBeats } from './hayabox';
import { lintDeck } from './loopdeck';
import { lintSong } from './lint';
import { renderSong, songBeats } from './music';
import { signalHash } from './pcm';
import { assertAudio } from '../verify/audioFilmstrip';

// Rendered at the engine default rate — assertAudio's feature clock assumes it.
describe('Hayabox deck', () => {
  it('has six courtiers, each with at least two moods (swap, not stack)', () => {
    expect(HAYABOX.courtiers).toHaveLength(6);
    for (const c of HAYABOX.courtiers) expect(c.moods.length).toBeGreaterThanOrEqual(2);
  });

  it('lintDeck passes for the default and the all-alternate mood decks', () => {
    expect(lintDeck(hayaboxDeck())).toEqual([]);
    const alts = Object.fromEntries(HAYABOX.courtiers.map((c) => [c.id, c.moods[1].id]));
    expect(lintDeck(hayaboxDeck(alts))).toEqual([]);
  });

  it('every stem is exactly the shared loop length at the shared tempo', () => {
    for (const c of HAYABOX.courtiers) {
      for (const m of c.moods) {
        const song = m.make();
        expect(song.bpm).toBe(HAYABOX_BPM);
        expect(songBeats(song), `${c.id}/${m.id}`).toBe(hayaboxLoopBeats());
      }
    }
  });

  it('every stem lints clean in A minor pentatonic — zero out-of-key notes', () => {
    for (const c of HAYABOX.courtiers) {
      for (const m of c.moods) {
        const res = lintSong(m.make(), { key: { tonic: 'A3', mode: 'minorPentatonic' }, maxOutOfKey: 0 });
        expect(res.errors, `${c.id}/${m.id}: ${res.errors.join('; ')}`).toEqual([]);
        const offKey = res.warnings.filter((w) => w.includes('out-of-key'));
        expect(offKey, `${c.id}/${m.id}: ${offKey.join('; ')}`).toEqual([]);
      }
    }
  });

  it('every stem renders audible with headroom', () => {
    for (const c of HAYABOX.courtiers) {
      for (const m of c.moods) {
        const buf = renderSong(m.make());
        const a = assertAudio(buf, { minRms: 0.02, maxPeakDb: -0.5, minDurationSec: 19 });
        expect(a.ok, `${c.id}/${m.id}: ${a.failures.join('; ')}`).toBe(true);
      }
    }
  });

  it('the tutti — all six awake — renders as one healthy mix', () => {
    const buf = renderSong(hayaboxTutti());
    const a = assertAudio(buf, { minRms: 0.05, maxPeakDb: -0.5, minDurationSec: 19, maxDurationSec: 25 });
    expect(a.ok, a.failures.join('; ')).toBe(true);
  });

  it('stems are deterministic — same data, same samples', () => {
    const song = HAYABOX.courtiers[0].moods[0].make();
    const h1 = signalHash(renderSong(song).left);
    const h2 = signalHash(renderSong(song).left);
    expect(h1).toBe(h2);
  });
});

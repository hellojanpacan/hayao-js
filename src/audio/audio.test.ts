import { describe, it, expect } from 'vitest';
import { AudioBus, bootChimeScore } from './audio';

// The boot chime is a signature identity cue: its score must stay stable and
// stay on the pentatonic. These lock the "sound" so a stray edit can't silently
// drift the pane's cold-open.
describe('boot chime', () => {
  it('is a deterministic four-voice score', () => {
    const a = bootChimeScore();
    const b = bootChimeScore();
    expect(a).toHaveLength(4);
    expect(a).toEqual(b); // no rng, no clock — same every call
  });

  it('stays on the C-major pentatonic (pitch classes C D E G A)', () => {
    const PENTA = new Set([0, 2, 4, 7, 9]); // C D E G A
    for (const t of bootChimeScore()) {
      const midi = Math.round(69 + 12 * Math.log2(t.freq / 440));
      expect(PENTA.has(((midi % 12) + 12) % 12)).toBe(true);
    }
  });

  it('keeps every voice soft and inside a ~1.5s window', () => {
    for (const t of bootChimeScore()) {
      expect(t.gain).toBeGreaterThan(0);
      expect(t.gain).toBeLessThanOrEqual(0.2);
      expect((t.delay ?? 0) + t.duration).toBeLessThanOrEqual(1.5);
    }
  });

  it('is a no-op on an unstarted (headless) bus', () => {
    const bus = new AudioBus(); // never start()ed → no AudioContext
    expect(() => bus.bootChime()).not.toThrow();
  });
});

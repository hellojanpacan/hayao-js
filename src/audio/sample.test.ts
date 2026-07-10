// Sample playback: headless no-op guarantees (the browser path needs a real
// AudioContext — covered by manual/preview checks, like the rest of the bus).

import { describe, expect, it } from 'vitest';
import { AudioBus } from './audio';

describe('AudioBus sample playback (headless)', () => {
  it('loadSample resolves null without an AudioContext', async () => {
    const bus = new AudioBus();
    await expect(bus.loadSample('/sfx/sting.ogg')).resolves.toBeNull();
  });

  it('playSample returns a dead handle without an AudioContext', () => {
    const bus = new AudioBus();
    const h = bus.playSample({} as AudioBuffer);
    expect(h.playing).toBe(false);
    expect(() => {
      h.stop(0.5);
      h.setGain(0.2);
    }).not.toThrow();
  });
});

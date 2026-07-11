// Runway's first sound sketches — the wry-doom register in three cues.
// Iteration log:
//   v1: bright coin chime + a low burn tick + a falling two-note sting for the
//       down round. Soft synthesis only (sine/triangle), per the house audio
//       direction; nothing sampled, nothing loaded.
// Radiates: a ticking economy you can HEAR thinning — the money as a heartbeat.

import { defineAtom } from '@hayao';

export const sounds = defineAtom({
  kind: 'audio',
  title: 'Money Noises',
  radiates: 'a ticking economy you can hear thinning',
  cues: [
    {
      name: 'Coin',
      note: 'cash lands — a warm two-tone chime',
      play: (bus) => {
        bus.tone({ freq: 660, duration: 0.09, type: 'sine', gain: 0.16 });
        bus.tone({ freq: 990, duration: 0.14, type: 'sine', gain: 0.12, delay: 0.06 });
      },
    },
    {
      name: 'Burn tick',
      note: 'the runway drains — dry, low, patient',
      play: (bus) => {
        bus.tone({ freq: 150, duration: 0.05, type: 'triangle', gain: 0.14 });
      },
    },
    {
      name: 'Down round',
      note: 'hype meets reality — two notes, falling',
      play: (bus) => {
        bus.tone({ freq: 392, duration: 0.22, type: 'triangle', gain: 0.15 });
        bus.tone({ freq: 262, duration: 0.34, type: 'triangle', gain: 0.15, delay: 0.18 });
      },
    },
  ],
});

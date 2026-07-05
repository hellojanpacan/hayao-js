// A/B variants for Studio playtests: pick with ?variant=<name>, or compare two
// side by side in the Studio. Tuning-only variants hot-toggle mid-play.
import type { Variant } from '@hayao';

export const variants: Record<string, Variant> = {
  floaty: {
    label: 'Floaty — lower gravity, gentler jump',
    tuning: { gravity: 1600, jumpVelocity: 560 },
  },
  snappy: {
    label: 'Snappy — heavy fall, fast run',
    tuning: { gravity: 2800, jumpVelocity: 720, runSpeed: 360 },
  },
};

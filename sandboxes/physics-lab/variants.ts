// A/B variants for the physics gym: ?variant=<name> or the Studio's compare view.
import type { Variant } from '@hayao';

export const variants: Record<string, Variant> = {
  bouncy: {
    label: 'Bouncy castle — high restitution',
    tuning: { restitution: 0.85, friction: 0.2 },
  },
  moon: {
    label: 'Moon — sixth gravity',
    tuning: { gravity: 150 },
  },
};

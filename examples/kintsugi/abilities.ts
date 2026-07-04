// How the five golden abilities change the Mender's movement envelope. The base
// Mender (no seams mended) can only run and make a single ground jump; each
// recovered ability adds exactly one traversal power. Because gates are proven
// by simulating the movement envelope (jumpHeight/jumpDistance/dashJumpDistance)
// WITH vs WITHOUT an ability, this mapping IS the gate contract — keep it honest.

import { DEFAULT_PLATFORMER, type PlatformerConfig } from '@hayao';
import { ABIL, type AbilityId } from './world';

/** The base Mender: a single ground jump, no air-jump, no dash, no wall powers. */
export const BASE_CFG: PlatformerConfig = {
  ...DEFAULT_PLATFORMER,
  width: 20,
  height: 30,
  runSpeed: 300,
  jumpVelocity: 600,
  gravity: 2200,
  maxFall: 640,
  airJumps: 0,
  dashCharges: 0,
  // wall powers OFF until Wallmend: no slide, no wall-jump.
  wallSlideMaxFall: 640,
  wallJumpVelX: 0,
  wallJumpVelY: 0,
};

/** The movement config for a given set of held abilities. */
export function configFor(abilities: Iterable<AbilityId | string>): PlatformerConfig {
  const has = new Set(abilities);
  const c: PlatformerConfig = { ...BASE_CFG };
  if (has.has(ABIL.step)) c.airJumps = 1; // Goldstep — double jump
  if (has.has(ABIL.rush)) c.dashCharges = 1; // Goldrush — one dash, refilled on land
  if (has.has(ABIL.mend)) {
    // Wallmend — cling + kick off shattered walls
    c.wallSlideMaxFall = 150;
    c.wallJumpVelX = 360;
    c.wallJumpVelY = 620;
  }
  if (has.has(ABIL.wing)) {
    // Goldwing — a feather-fall glide: slower descent + real air control
    c.maxFall = 300;
    c.airAccel = 3400;
    c.airFriction = 200;
  }
  // Emberlight (burst) is a world gate (shatters light-seals), not a movement power.
  return c;
}

/** Starting dash charges for a config (so a fresh state matches its abilities). */
export const dashChargesFor = (cfg: PlatformerConfig): number => cfg.dashCharges;

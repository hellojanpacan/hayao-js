// A deterministic waypoint climber: walk toward the next ledge, and when it sits
// above us within a jump's reach, launch. Releasing jump between hops (only press
// on a rising edge) keeps the variable-height jump honest. Used by the test and
// verify suites to prove the ascent is climbable 0-death.

import { WAYPOINTS, TILE_PX } from './logic';

export interface UpdriftProbe {
  px: number;
  py: number;
  onGround: boolean;
  won: boolean;
  dead: boolean;
}

/** Stateful per-run bot: `makeUpdriftBot().next(probe)` → actions for this frame. */
export function makeUpdriftBot() {
  let wp = 0;
  let hold = 0; // frames left to HOLD jump — a tap triggers the variable-height cut
  return {
    next(p: UpdriftProbe): string[] {
      const actions: string[] = [];
      if (p.won || p.dead) return actions;
      const target = WAYPOINTS[Math.min(wp, WAYPOINTS.length - 1)];
      const tx = (target.x + 0.5) * TILE_PX;
      const ty = (target.y + 0.5) * TILE_PX;
      const dx = tx - p.px;

      // Advance once we're standing on (or at the height of) the current target.
      const arrived = p.onGround && Math.abs(dx) < TILE_PX * 1.2 && Math.abs(p.py - ty) < TILE_PX * 1.2;
      if (arrived && wp < WAYPOINTS.length - 1) {
        wp++;
        hold = 0;
        return this.next(p); // re-aim at the new target this same frame
      }

      // Steer horizontally toward the target — but once airborne and nearly over
      // it, COAST so we settle onto the ledge instead of drifting past it.
      const airborneAndClose = !p.onGround && Math.abs(dx) <= TILE_PX * 0.8;
      if (!airborneAndClose) {
        if (dx > 5) actions.push('right');
        else if (dx < -5) actions.push('left');
      }

      // Launch when grounded and the (overlapping) ledge above is within an easy
      // hop; then HOLD jump for the full variable-height rise (a tap gets cut to
      // 40% and never reaches the ledge). Release once grounded again.
      const needUp = ty < p.py - TILE_PX * 0.5;
      const inLaunchWindow = Math.abs(dx) <= TILE_PX * 2.6;
      if (p.onGround && needUp && inLaunchWindow) hold = 11;
      else if (p.onGround) hold = 0; // landed without wanting to jump: stop holding
      if (hold > 0) {
        actions.push('jump');
        hold--;
      }
      return actions;
    },
  };
}

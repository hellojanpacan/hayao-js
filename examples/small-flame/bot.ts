// A fuel-aware waypoint climber. It proves the chamber is winnable 0-death: it
// rises toward each rest ledge, lingers to refill the tank, then pushes to the
// next — and finally floats up into the lantern. Because the view samples the
// SAME stepFlame with the same inputs, the action log this bot records replays
// bit-identically against the real game (winnability + determinism in verify).

import {
  DEFAULT_FLAME,
  EMBER_POINTS,
  GOAL_POINT,
  MAP,
  REST_POINTS,
  spawnState,
  stepFlame,
  type FlameConfig,
  type FlameState,
  type Point,
} from './logic';

const DT = 1 / 60;

export interface BotRun {
  frames: string[][];
  won: boolean;
  fuelAtWin: number;
  deaths: number;
  ticks: number;
}

/** Fly the intended line, recording per-frame actions. */
export function driveBot(cfg: FlameConfig = DEFAULT_FLAME, maxFrames = 3000): BotRun {
  const s: FlameState = spawnState(cfg);
  const waypoints: Point[] = [...REST_POINTS, GOAL_POINT];
  const frames: string[][] = [];
  let wi = 0;
  let waiting = false; // lingering on a ledge to refuel
  let prevThrust = false;
  let deaths = 0;

  const centre = (st: FlameState): Point => ({ x: st.x + cfg.width / 2, y: st.y + cfg.height / 2 });

  for (let f = 0; f < maxFrames && !s.won; f++) {
    const target = waypoints[Math.min(wi, waypoints.length - 1)];
    const isGoal = wi >= REST_POINTS.length;
    const c = centre(s);
    // The center height we want to rest at for a ledge (feet on the surface).
    const targetY = isGoal ? target.y : target.y - cfg.height / 2;

    const actions: string[] = [];
    const atLedge = !isGoal && s.onGround && Math.abs(c.x - target.x) < 28 && Math.abs(c.y - targetY) < 24;
    if (waiting) {
      // Sit still and refuel; leave once the tank is nearly full.
      if (s.fuel >= 0.92) {
        waiting = false;
        wi++;
      }
    } else if (atLedge) {
      // Settled onto the rest ledge — start refueling (idle this frame).
      waiting = true;
    } else {
      const dxT = target.x - c.x;
      if (Math.abs(dxT) > 6) actions.push(dxT > 0 ? 'right' : 'left');
      // Drift-then-climb: line up UNDER the target holding altitude, then rise
      // straight up into it. An L-shaped line keeps clear of the off-lane thorns
      // (rising diagonally cuts the corner into a stalactite). The +10px settle
      // band stops the climb AT the ledge so it doesn't overshoot into a thorn.
      const aligned = Math.abs(dxT) < 20;
      if (aligned) {
        // Feather the ascent — thrust only while below the ledge AND not already
        // rising fast, so the flame arrives gently instead of rocketing up through
        // the one-way ledge. This is the game's core skill, demonstrated.
        if (c.y > targetY + 8 && s.vy > -120) actions.push('thrust');
      } else if (s.vy > 0) {
        actions.push('thrust'); // arrest the fall to stay level while traversing
      }
    }

    const thrustHeld = actions.includes('thrust');
    const ev = stepFlame(
      s,
      { moveX: (actions.includes('right') ? 1 : 0) - (actions.includes('left') ? 1 : 0), thrustHeld, thrustPressed: thrustHeld && !prevThrust },
      DT,
      MAP,
      cfg,
      EMBER_POINTS,
      GOAL_POINT,
    );
    prevThrust = thrustHeld;
    frames.push(actions);

    if (ev.died) {
      deaths++;
      break; // a death means the line clipped a thorn — verify should fail and prompt a fix
    }
  }

  // A trailing empty frame so a replay releases the last-held actions.
  frames.push([]);
  return { frames, won: s.won, fuelAtWin: s.fuel, deaths, ticks: s.ticks };
}

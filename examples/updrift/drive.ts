// Shared climb driver: run the waypoint bot against the REAL game (via world.step,
// so jump/dash edges come from InputState exactly as in the browser) and return the
// input log plus the outcome. Used by both the test suite and the verify suite.

import type { World } from '@hayao';
import { makeUpdriftBot, type UpdriftProbe } from './bot';

export interface ClimbResult {
  log: string[][];
  won: boolean;
  deaths: number;
  frames: number;
}

export function runClimb(world: World, maxFrames = 3000): ClimbResult {
  const bot = makeUpdriftBot();
  const log: string[][] = [];
  let frames = 0;
  for (; frames < maxFrames; frames++) {
    const p = world.probe() as unknown as UpdriftProbe;
    if (p.won || p.dead) break;
    const a = bot.next(p);
    log.push(a);
    world.step(a);
  }
  const end = world.probe() as { won: boolean; deaths: number };
  return { log, won: end.won, deaths: end.deaths, frames };
}

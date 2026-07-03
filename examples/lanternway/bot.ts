// A trivial greedy bot: press toward the shrine each frame. Used by the test
// and verify suites to drive a full crossing and prove the world scrolls.

import { GOAL } from './logic';

export interface LwProbe {
  px: number;
  py: number;
  won: boolean;
}

/** Actions to hold this frame to head for the goal. */
export function bearerBot(p: LwProbe): string[] {
  const a: string[] = [];
  if (p.px < GOAL.x - 4) a.push('right');
  else if (p.px > GOAL.x + 4) a.push('left');
  if (p.py < GOAL.y - 4) a.push('down');
  else if (p.py > GOAL.y + 4) a.push('up');
  return a;
}

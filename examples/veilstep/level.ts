// Veilstep — one 40×22 stealth level: three horizontal bands split by walls
// with offset gaps. Steal the idol from the far top corner, exfiltrate to the
// entry. Guards and bushes are metadata (patrols need waypoints, not ASCII).

export const LEVEL_ROWS: string[] = [
  '#'.repeat(40),
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(35) + 'I' + '  ' + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#'.repeat(32) + '  ' + '#'.repeat(6), // wall A — gap at cols 32-33
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#'.repeat(6) + '  ' + '#'.repeat(32), // wall B — gap at cols 6-7
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#' + ' '.repeat(38) + '#',
  '#  @' + ' '.repeat(35) + '#',
  '#' + ' '.repeat(38) + '#',
  '#'.repeat(40),
];

export interface GuardDef {
  /** Patrol endpoints (walks back and forth, pausing at each end). */
  ax: number;
  ay: number;
  bx: number;
  by: number;
  speed: number;
}

/** Top / mid / bottom band patrols. */
export const GUARDS: GuardDef[] = [
  { ax: 200, ay: 112, bx: 1100, by: 112, speed: 92 }, // 0 · top band (idol)
  { ax: 150, ay: 336, bx: 1100, by: 336, speed: 102 }, // 1 · mid band
  { ax: 300, ay: 576, bx: 1150, by: 576, speed: 82 }, // 2 · bottom band (entry)
];

/** Hiding bushes (hide radius 40). The alcove under the wall-A arch is what
 * makes the idol run FAIR: without a safe landing after the descent, all three
 * patrol phases would need to align at once. */
export const BUSHES = [
  { x: 320, y: 112 },
  { x: 640, y: 336 },
  { x: 800, y: 576 },
  { x: 1056, y: 400 },
];

export const BUSH_RADIUS = 42;
export const VISION = { fov: (72 * Math.PI) / 180, range: 260 };
export const DETECT = { fill: 0.6, drain: 0.9 }; // seconds to spot / to calm
export const SPEEDS = { sneak: 175, sprint: 305 };
export const NOISE_RADIUS = 210;
export const PAUSE_AT_ENDS = 1.0;

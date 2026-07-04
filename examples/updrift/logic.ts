// Updrift — pure sim for the golden platformer reference. No scene/render imports:
// the level is DATA (built through @hayao's level format), the character is the
// engine's kinematic controller, and every feel moment is a declared event. The
// view (game.ts) is a replaceable skin over this.
//
// The ascent is a SWITCHBACK generated from the movement envelope, never eyeballed
// (FUN law 3): each ledge sits within one jump's rise and reach of the last, so
// `platformerReachable` proves the climb and a waypoint bot clears it 0-death.

import {
  defineLevel,
  levelToTilemap,
  tileCenter,
  DEFAULT_PLATFORMER,
  createPlatformerState,
  stepPlatformer,
  jumpHeight,
  jumpDistance,
  type LevelData,
  type PlatformerConfig,
  type PlatformerState,
  type PlatformerEvents,
  type PadInput,
  type TilemapData,
  type Cell,
  type FeedbackContract,
} from '@hayao';

// ── Tuning ──────────────────────────────────────────────────────────────────
export const TILE_PX = 32;
// Slightly floatier than the default so the ascent reads as a graceful glide, and
// the generous grace windows sail through the forgiveness gate.
export const CONFIG: PlatformerConfig = {
  ...DEFAULT_PLATFORMER,
  runSpeed: 300,
  jumpVelocity: 640,
  gravity: 2100,
  coyoteTime: 0.11,
  jumpBuffer: 0.13,
  dashCharges: 1,
  dashSpeed: 600,
  dashTime: 0.14,
};

// The envelope IS the level-design constraint. Round DOWN to stay inside it.
const RISE_TILES = Math.floor(jumpHeight(CONFIG) / TILE_PX); // ≈ 2
const REACH_TILES = Math.floor(jumpDistance(CONFIG) / TILE_PX); // ≈ 5
export const ENVELOPE = { jumpTiles: RISE_TILES, runTiles: REACH_TILES };

// ── Level generation (switchback staircase, as data) ────────────────────────
const COLS = 26;
const ROWS = 42;
const LEDGE_W = 6;
const STEP_UP = 2; // ≤ RISE_TILES
const STEP_X = 3; // < LEDGE_W, so consecutive ledges OVERLAP — the bot (and player)
// can hop nearly straight up onto the next ledge instead of a precise gap-clearing arc

/** Ordered ledge anchors (left tile of each platform), bottom → top. */
function switchback(): Cell[] {
  const ledges: Cell[] = [];
  let x = 6; // offset from the spawn so the first hop is diagonal, not a ceiling bonk
  let y = ROWS - 3; // first ledge a comfortable two tiles above the floor
  let dir = 1;
  while (y >= 4) {
    ledges.push({ x, y });
    let nx = x + dir * STEP_X;
    if (nx < 2 || nx > COLS - 1 - LEDGE_W) {
      dir = -dir; // hit a wall: turn the switchback and keep climbing in place
      nx = x + dir * STEP_X;
    }
    x = Math.max(2, Math.min(COLS - 1 - LEDGE_W, nx));
    y -= STEP_UP;
  }
  return ledges;
}

const LEDGES = switchback();

/** Paint the generated geometry into ASCII rows, then hand them to the format. */
function buildRows(): string[] {
  const grid: string[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => '.'));
  const put = (tx: number, ty: number, ch: string): void => {
    if (ty >= 0 && ty < ROWS && tx >= 0 && tx < COLS) grid[ty][tx] = ch;
  };
  // Frame: side walls + floor.
  for (let y = 0; y < ROWS; y++) { put(0, y, '#'); put(COLS - 1, y, '#'); }
  for (let x = 0; x < COLS; x++) put(x, ROWS - 1, '#');
  // Ledges are ONE-WAY platforms: you rise up through them and land on top, so an
  // ascent never means ramming a solid ledge's side face — the key to a climb that
  // reads as graceful and that a waypoint bot can clear without frame-perfect arcs.
  LEDGES.forEach((l) => {
    for (let dx = 0; dx < LEDGE_W; dx++) put(l.x + dx, l.y, '-');
  });
  const summit = LEDGES[LEDGES.length - 1];
  put(summit.x + 1, summit.y - 1, 'G'); // goal shrine one tile above the top ledge
  put(2, ROWS - 2, 'S'); // spawn on the floor, left side
  // A flare-guarded alcove far from the climb (right of the floor) — a real
  // telegraphed hazard the ascent never needs to touch, plus a bonus crystal.
  put(COLS - 5, ROWS - 2, 'o'); // crystal
  put(COLS - 4, ROWS - 2, 'F'); // flare hazard marker
  return grid.map((r) => r.join(''));
}

export const LEVEL: LevelData = defineLevel({ name: 'updrift', tileSize: TILE_PX, rows: buildRows(), legend: { o: 'crystal', F: 'flare' } });
export const MAP: TilemapData = levelToTilemap(LEVEL);
export const WORLD = { w: COLS * TILE_PX, h: ROWS * TILE_PX };

/** Ledge-center waypoints the bot climbs, bottom → summit, then the goal itself. */
export const WAYPOINTS: Cell[] = [
  ...LEDGES.map((l) => ({ x: l.x + 1, y: l.y })),
  { x: LEVEL.goal.x, y: LEVEL.goal.y },
];

export const SPAWN_PX = tileCenter(LEVEL.spawn.x, LEVEL.spawn.y, TILE_PX);
export const GOAL_PX = tileCenter(LEVEL.goal.x, LEVEL.goal.y, TILE_PX);

// ── Sim ─────────────────────────────────────────────────────────────────────

/** Fresh controller state at the spawn foothold (feet on the floor tile). */
export function createUpdriftState(): PlatformerState {
  const s = createPlatformerState(SPAWN_PX.x - CONFIG.width / 2, SPAWN_PX.y - CONFIG.height / 2);
  s.y = (LEVEL.spawn.y + 1) * TILE_PX - CONFIG.height; // rest feet on the floor's top edge
  return s;
}

/** Advance one fixed step; returns the feel events the view turns into juice. */
export function stepUpdrift(s: PlatformerState, pad: PadInput, dt: number): PlatformerEvents {
  return stepPlatformer(s, pad, dt, MAP, CONFIG);
}

/**
 * Build a PadInput from action strings, deriving jump/dash as rising EDGES against
 * the previous frame's actions. Headless bot drivers (test/verify) use this so a
 * held jump doesn't re-buffer into an auto-bounce on landing; the browser reads the
 * same edges from `world.input.justPressed`.
 */
export function padFrom(actions: readonly string[], prev: readonly string[]): PadInput {
  const has = (a: string, set: readonly string[]): boolean => set.includes(a);
  return {
    moveX: has('right', actions) ? 1 : has('left', actions) ? -1 : 0,
    moveY: has('down', actions) ? 1 : has('up', actions) ? -1 : 0,
    jumpHeld: has('jump', actions),
    jumpPressed: has('jump', actions) && !has('jump', prev),
    dashPressed: has('dash', actions) && !has('dash', prev),
  };
}

/** Center of the body's collision box in world px. */
export const bodyCenter = (s: PlatformerState): Cell => ({ x: s.x + CONFIG.width / 2, y: s.y + CONFIG.height / 2 });

/** Reached the summit shrine? (body center within a tile of the goal center). */
export function reachedGoal(s: PlatformerState): boolean {
  const c = bodyCenter(s);
  return Math.abs(c.x - GOAL_PX.x) <= TILE_PX && Math.abs(c.y - GOAL_PX.y) <= TILE_PX;
}

// ── The flare: a telegraphed periodic hazard (exercises the telegraph gate) ──
export const FLARE = {
  cell: { x: COLS - 4, y: ROWS - 2 } as Cell,
  period: 2.0, // seconds
  telegraphStart: 0.7,
  activeStart: 1.3,
  activeEnd: 1.6,
};

/** The flare's phase at a given sim time — pure, so replays and the gate agree. */
export function flarePhase(time: number): { telegraphing: boolean; active: boolean } {
  const t = time % FLARE.period;
  return {
    telegraphing: t >= FLARE.telegraphStart && t < FLARE.activeStart,
    active: t >= FLARE.activeStart && t < FLARE.activeEnd,
  };
}

// ── Feedback contract (audited by the feedback-completeness gate) ────────────
// Every significant moment answers on ≥2 senses within the frame, juice bounded.
export const FEEDBACK: FeedbackContract = {
  jump: { channels: ['audio', 'visual'] }, // sfx + dust puff
  land: { channels: ['audio', 'visual', 'haptic'], shake: 0.12 }, // sfx + dust + small shake
  dash: { channels: ['audio', 'visual'], shake: 0.1 }, // sfx + streak burst
  collect: { channels: ['audio', 'visual'] }, // sfx + sparkle
  summit: { channels: ['audio', 'visual', 'haptic'], shake: 0.3 }, // fanfare + burst + shake
  death: { channels: ['audio', 'visual', 'haptic'], shake: 0.5, hitstopFrames: 6 },
};
export const FEEDBACK_EVENTS = ['jump', 'land', 'dash', 'collect', 'summit', 'death'] as const;

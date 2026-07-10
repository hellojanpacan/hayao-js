// Meadowhop — the pure sim for a one-screen platformer prototype. Geometry is
// DATA (an ASCII room proven reachable before any node is built); movement is the
// engine's `stepPlatformer` controller. Nothing here imports the scene — it's all
// plain, deterministic state you can pump in Node, exactly like updrift/logic.ts.
//
// The room is 32×18 tiles at 40px = the full 1280×720 design space, so it fits on
// one static screen with NO camera (world space == screen space). A 2-up / 3-across
// staircase climbs left→right to the goal star; the jump envelope clears 2 tiles,
// so `platformerReachable` proves it (see verify.ts / the test).

import {
  defineLevel,
  levelToTilemap,
  tileCenter,
  createPlatformerState,
  stepPlatformer,
  DEFAULT_PLATFORMER,
  jumpHeight,
  jumpDistance,
  PAD_NEUTRAL,
  type LevelData,
  type TilemapData,
  type PlatformerState,
  type PlatformerConfig,
  type PadInput,
} from '@hayao';

/** Tile edge in px. 32 cols × 18 rows × 40 = 1280 × 720 exactly. */
export const TILE_PX = 40;

// Room legend: '#' solid · '^' hazard · 'S' spawn · 'G' goal · 'o' coin.
// Side walls + floor enclose the room (and give a surface to wall-slide on).
const ROWS: string[] = [
  '#..............................#', // 0
  '#..............................#', // 1
  '#..............................#', // 2
  '#..............................#', // 3
  '#..............................#', // 4
  '#..............................#', // 5
  '#..............................#', // 6
  '#..............................#', // 7
  '#..............................#', // 8
  '#...................Go.........#', // 9  goal + a coin beside it
  '#..................####........#', // 10 platform 3 (goal ledge)
  '#..............o...............#', // 11 coin above platform 2
  '#............####..............#', // 12 platform 2
  '#........o.....................#', // 13 coin above platform 1
  '#......####....................#', // 14 platform 1
  '#.S..o................o...^^...#', // 15 spawn, ground coins, spikes (right)
  '################################', // 16 floor
  '################################', // 17 floor
];

export const LEVEL: LevelData = defineLevel({ name: 'meadowhop', tileSize: TILE_PX, rows: ROWS, legend: { o: 'coin' } });
export const MAP: TilemapData = levelToTilemap(LEVEL);

/** A roomy, forgiving jump — plenty of margin to land a 2-tile-high ledge. */
export const CONFIG: PlatformerConfig = { ...DEFAULT_PLATFORMER, width: 28, height: 64, runSpeed: 320, jumpVelocity: 700 };

// Reachability envelope, derived from the config (never eyeballed).
export const JUMP_TILES = Math.floor(jumpHeight(CONFIG) / TILE_PX);
export const RUN_TILES = Math.floor(jumpDistance(CONFIG) / TILE_PX);

const FLOOR_TOP_Y = (LEVEL.spawn.y + 1) * TILE_PX; // top surface of the floor under the spawn

/** A fresh controller state standing on the floor at the spawn tile. */
export function createMeadowState(): PlatformerState {
  const x = (LEVEL.spawn.x + 0.5) * TILE_PX - CONFIG.width / 2;
  const y = FLOOR_TOP_Y - CONFIG.height;
  return createPlatformerState(x, y);
}

export interface Coin {
  x: number;
  y: number;
}
export const COINS: Coin[] = LEVEL.entities.filter((e) => e.kind === 'coin').map((e) => ({ x: e.x, y: e.y }));

export const GOAL_PX = tileCenter(LEVEL.goal.x, LEVEL.goal.y, TILE_PX);
export const SPAWN_PX = tileCenter(LEVEL.spawn.x, LEVEL.spawn.y, TILE_PX);

const GOAL_RECT = { x: LEVEL.goal.x * TILE_PX, y: LEVEL.goal.y * TILE_PX, w: TILE_PX, h: TILE_PX };

/** True when the player's collision box overlaps the goal tile. */
export function reachedGoal(pc: PlatformerState): boolean {
  return pc.x < GOAL_RECT.x + GOAL_RECT.w && pc.x + CONFIG.width > GOAL_RECT.x && pc.y < GOAL_RECT.y + GOAL_RECT.h && pc.y + CONFIG.height > GOAL_RECT.y;
}

const COLLECT_R = 26;
const COLLECT_R2 = COLLECT_R * COLLECT_R;
/** How long the death pose plays before the hero re-materializes. */
export const DEATH_DELAY = 1.05;

/** Per-step feel signals, mirrored so the view (and probe timeline) can react. */
export interface MeadowFx {
  jumped: boolean;
  landed: boolean;
  died: boolean;
  collect: boolean;
  spawned: boolean;
  won: boolean;
}
const freshFx = (): MeadowFx => ({ jumped: false, landed: false, died: false, collect: false, spawned: false, won: false });

/** The whole canonical (hashed) game state. */
export interface MeadowState {
  pc: PlatformerState;
  collected: boolean[];
  won: boolean;
  deaths: number;
  deathTimer: number;
  fx: MeadowFx;
}

export function freshMeadowState(): MeadowState {
  return { pc: createMeadowState(), collected: COINS.map(() => false), won: false, deaths: 0, deathTimer: 0, fx: freshFx() };
}

export const collectedCount = (s: MeadowState): number => s.collected.reduce((n, c) => n + (c ? 1 : 0), 0);

/**
 * Advance one fixed step. Mutates `s`. Handles the death→respawn beat internally:
 * on a hazard hit the body freezes for DEATH_DELAY (the death pose plays), then
 * re-materializes at the spawn (flagging `fx.spawned` so the view plays 'spawn').
 */
export function stepMeadow(s: MeadowState, pad: PadInput, dt: number): void {
  s.fx = freshFx();

  if (s.pc.dead) {
    s.deathTimer -= dt;
    if (s.deathTimer <= 0) {
      s.pc = createMeadowState();
      s.fx.spawned = true;
    }
    return;
  }

  const ev = stepPlatformer(s.pc, s.won ? PAD_NEUTRAL : pad, dt, MAP, CONFIG);
  s.fx.jumped = ev.jumped;
  s.fx.landed = ev.landed;

  if (ev.died) {
    s.deaths += 1;
    s.deathTimer = DEATH_DELAY;
    s.fx.died = true;
    return;
  }

  const cx = s.pc.x + CONFIG.width / 2;
  const cy = s.pc.y + CONFIG.height / 2;
  for (let i = 0; i < COINS.length; i++) {
    if (s.collected[i]) continue;
    const dx = cx - COINS[i].x;
    const dy = cy - COINS[i].y;
    if (dx * dx + dy * dy < COLLECT_R2) {
      s.collected[i] = true;
      s.fx.collect = true;
    }
  }

  if (!s.won && reachedGoal(s.pc)) {
    s.won = true;
    s.fx.won = true;
  }
}

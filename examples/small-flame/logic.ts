// Small Flame — the pure simulation. No scene/render imports: plain data in,
// plain data out, deterministic, unit-testable by pumping frames in Node.
//
// The whole game is ONE verb: a jetpack you FEATHER. Hold thrust to burn fuel
// and rise; release to fall under a soft, floaty gravity. Fuel drains while you
// thrust and refills when you rest on a surface (or brush an ember). A full tank
// does NOT clear the screen for free — the line up is a fuel economy you ration.
//
// This mirrors the SHAPE of the engine's platformer grace canon (coyote time,
// input buffering, ceiling corner-correction) but its one verb is continuous,
// fuel-metered thrust rather than a binary jump/dash — so it is its own module
// rather than a call into `stepPlatformer`.

import {
  defineLevel,
  levelToTilemap,
  moveRect,
  rectBlocked,
  type LevelData,
  type TilemapData,
} from '@hayao';

// ── Config: the movement envelope ────────────────────────────────────────────
// Meditative feel = SOFT gravity, a GENTLE thrust cap, momentum that survives
// flight. Tuned for 40px tiles at 60Hz in the 1280×720 design space.

export interface FlameConfig {
  /** Collision box (px). */
  width: number;
  height: number;
  /** Horizontal drift. airFriction stays LOW so inherited momentum survives. */
  runSpeed: number;
  groundAccel: number;
  groundFriction: number;
  airAccel: number;
  airFriction: number;
  /** Soft downward pull (px/s²) and terminal fall speed. */
  gravity: number;
  maxFall: number;
  /** Upward acceleration while thrusting (px/s²) — must exceed gravity to rise. */
  thrustAccel: number;
  /** Cap on rise speed (px/s) — a gentle ceiling so flight is controllable, not a rocket. */
  thrustMaxUp: number;
  /** Seconds to ramp thrust 0→full when the burn begins — the graceful, non-jerky lift. */
  thrustRamp: number;
  /** Crisp upward impulse on a grounded/coyote press (px/s) — the satisfying "pop" off a ledge. */
  popVelocity: number;
  /** Fuel spent by one pop. */
  popCost: number;
  /** Fuel tank size (canonical 1.0). */
  fuelMax: number;
  /** Fuel spent per second of sustained thrust. */
  drainPerSec: number;
  /** Fuel regained per second while resting on a surface. */
  refillPerSec: number;
  /** Fuel restored by brushing an ember. */
  emberRefill: number;
  /** Fuel fraction below which the tank is "low" (warning band). */
  warnBand: number;
  /** Grace windows (seconds). */
  coyoteTime: number;
  thrustBuffer: number;
  /** Max px nudged sideways to slip past a ceiling corner while rising. */
  cornerNudge: number;
}

export const DEFAULT_FLAME: FlameConfig = {
  width: 24,
  height: 30,
  runSpeed: 230,
  groundAccel: 2600,
  groundFriction: 3000,
  airAccel: 1500,
  airFriction: 170,
  gravity: 900,
  maxFall: 430,
  thrustAccel: 2250,
  thrustMaxUp: 300,
  thrustRamp: 0.07,
  popVelocity: 250,
  popCost: 0.05,
  fuelMax: 1,
  drainPerSec: 0.6,
  refillPerSec: 1.5,
  emberRefill: 0.55,
  warnBand: 0.22,
  coyoteTime: 0.1, // 6 frames @60Hz
  thrustBuffer: 0.12, // ~7 frames
  cornerNudge: 10,
};

// ── State: plain serializable data → lives in a hashed node prop ──────────────

export interface FlameState {
  x: number; // top-left of collision box
  y: number;
  vx: number;
  vy: number;
  facing: number; // -1 | 1
  onGround: boolean;
  coyote: number; // s of coyote left
  buffer: number; // s of thrust-press buffered
  ramp: number; // s of continuous thrust so far (for the soft ramp)
  fuel: number; // 0..fuelMax
  /** One flag per level ember, true once brushed. Fixed length → hash-stable. */
  emberTaken: boolean[];
  dead: boolean;
  won: boolean;
  /** Sim frames elapsed until the win (medal tiebreak); frozen once won. */
  ticks: number;
}

/** Per-step intent, sampled from ACTIONS by the view (never raw keys). */
export interface FlameInput {
  moveX: number; // -1 | 0 | 1
  thrustHeld: boolean;
  thrustPressed: boolean; // rising edge — a held thrust must not re-pop
}

export const FLAME_NEUTRAL: FlameInput = { moveX: 0, thrustHeld: false, thrustPressed: false };

/** Feel events emitted by a step — hooks for SFX / particles. */
export interface FlameEvents {
  popped: boolean;
  thrusting: boolean;
  landed: boolean;
  refueled: boolean; // brushed an ember this step
  emberIndex: number; // which ember, or -1
  emptied: boolean; // tank ran dry this step while trying to thrust
  reachedGoal: boolean;
  died: boolean;
}

/** A refuel/goal point in design-space px (center). */
export interface Point {
  x: number;
  y: number;
}

const approach = (v: number, target: number, delta: number): number =>
  v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);

const overlaps = (s: FlameState, cfg: FlameConfig, p: Point, r: number): boolean => {
  const cx = s.x + cfg.width / 2;
  const cy = s.y + cfg.height / 2;
  return Math.abs(cx - p.x) <= r + cfg.width / 2 && Math.abs(cy - p.y) <= r + cfg.height / 2;
};

/**
 * Advance the flame one fixed step. Mutates `s`; returns feel events. Pure over
 * (state, input, map, config, embers, goal) — no engine/scene coupling.
 */
export function stepFlame(
  s: FlameState,
  input: FlameInput,
  dt: number,
  map: TilemapData,
  cfg: FlameConfig,
  embers: Point[],
  goal: Point,
): FlameEvents {
  const ev: FlameEvents = { popped: false, thrusting: false, landed: false, refueled: false, emberIndex: -1, emptied: false, reachedGoal: false, died: false };
  if (s.dead || s.won) return ev;
  s.ticks++;
  const wasGround = s.onGround;

  // ── Timers ──
  s.coyote = Math.max(0, s.coyote - dt);
  s.buffer = Math.max(0, s.buffer - dt);
  if (input.thrustPressed) s.buffer = cfg.thrustBuffer;

  // ── Horizontal intent (momentum-preserving) ──
  const target = input.moveX * cfg.runSpeed;
  const accel = s.onGround
    ? input.moveX !== 0
      ? cfg.groundAccel
      : cfg.groundFriction
    : input.moveX !== 0
      ? cfg.airAccel
      : cfg.airFriction;
  s.vx = approach(s.vx, target, accel * dt);
  if (input.moveX !== 0) s.facing = input.moveX > 0 ? 1 : -1;

  // ── Gravity (always, soft) ──
  if (!s.onGround) s.vy = Math.min(s.vy + cfg.gravity * dt, cfg.maxFall);

  // ── The pop: a crisp launch off ground/coyote, gated on fuel ──
  if (s.buffer > 0 && (s.onGround || s.coyote > 0) && s.fuel > 0) {
    s.vy = -cfg.popVelocity;
    s.fuel = Math.max(0, s.fuel - cfg.popCost);
    s.onGround = false;
    s.coyote = 0;
    s.buffer = 0;
    ev.popped = true;
  }

  // ── Sustained thrust: the feathered burn ──
  if (input.thrustHeld && s.fuel > 0) {
    s.ramp = Math.min(cfg.thrustRamp, s.ramp + dt);
    const factor = s.ramp / cfg.thrustRamp; // 0→1 ease-in
    s.vy -= cfg.thrustAccel * factor * dt;
    if (s.vy < -cfg.thrustMaxUp) s.vy = -cfg.thrustMaxUp; // gentle rise cap
    s.fuel = Math.max(0, s.fuel - cfg.drainPerSec * dt);
    s.onGround = false;
    ev.thrusting = true;
    if (s.fuel === 0) ev.emptied = true;
  } else {
    s.ramp = 0;
  }

  // ── Move-and-collide against tiles ──
  const dx = s.vx * dt;
  const dy = s.vy * dt;
  let res = moveRect(map, { x: s.x, y: s.y, w: cfg.width, h: cfg.height }, dx, dy);

  // ── Ceiling corner-correction: bonked a ledge edge while rising → slip sideways ──
  if (res.onCeiling && s.vy < 0) {
    const slip = cornerSlipX(map, res.x, res.y, cfg.width, cfg.height, dy, cfg.cornerNudge);
    if (slip !== null) {
      res = moveRect(map, { x: slip, y: res.y, w: cfg.width, h: cfg.height }, 0, dy);
      res.x = slip;
    }
  }

  s.x = res.x;
  s.y = res.y;
  if (res.hitY && s.vy > 0) s.vy = 0;
  if (res.onCeiling) s.vy = Math.max(s.vy, 0);
  if (res.hitX) s.vx = 0;
  s.onGround = res.onFloor;

  // ── Rest = refuel; coyote refreshed on the ground ──
  if (s.onGround) {
    s.coyote = cfg.coyoteTime;
    s.fuel = Math.min(cfg.fuelMax, s.fuel + cfg.refillPerSec * dt);
    if (s.vy > 0) s.vy = 0;
    if (!wasGround) ev.landed = true;
  }

  // ── Embers: the only airborne refuel — brush one to top the tank up ──
  for (let i = 0; i < embers.length; i++) {
    if (s.emberTaken[i]) continue;
    if (overlaps(s, cfg, embers[i], 14)) {
      s.emberTaken[i] = true;
      s.fuel = Math.min(cfg.fuelMax, s.fuel + cfg.emberRefill);
      ev.refueled = true;
      ev.emberIndex = i;
    }
  }

  // ── Hazard / goal ──
  if (res.hazard) {
    s.dead = true;
    ev.died = true;
  } else if (overlaps(s, cfg, goal, 18)) {
    s.won = true;
    ev.reachedGoal = true;
  }
  return ev;
}

/** Try shifting x by up to ±nudge so a rect moving by dy is unblocked. Smaller shift wins. */
function cornerSlipX(map: TilemapData, x: number, y: number, w: number, h: number, dy: number, nudge: number): number | null {
  for (let n = 1; n <= nudge; n++) {
    for (const dir of [1, -1]) {
      const nx = x + dir * n;
      if (!rectBlocked(map, nx, y + dy, w, h) && !rectBlocked(map, nx, y, w, h)) return nx;
    }
  }
  return null;
}

// ── The single-screen chamber, authored as provable DATA ─────────────────────
// A still night shaft. Rest on the one-way ledges (they refuel you); thread the
// thorns; brush the embers on the flowing line; reach the lantern at the top.
// Reserved ASCII: S spawn · G goal · # solid · - one-way · ^ hazard · o ember.

export const TILE = 40;
const COLS = 32;
const ROWS = 18;

interface Span {
  row: number;
  c0: number;
  c1: number;
}

// One-way rest ledges (foothold + refuel), a gentle staircase bottom→top with a
// clear diagonal lane between each — land to refill, then push to the next.
const LEDGES: Span[] = [
  { row: 13, c0: 4, c1: 9 },
  { row: 10, c0: 9, c1: 14 },
  { row: 7, c0: 15, c1: 20 },
  { row: 4, c0: 11, c1: 16 },
];

// Thorn stalactites — set in the OPEN gaps (never directly above a rest ledge,
// never in a climb column), so a lazy drift is punished but the flowing staircase
// line stays clean. Every ledge keeps ≥2 rows of clear air above it.
const THORNS: Span[] = [
  { row: 15, c0: 11, c1: 13 },
  { row: 11, c0: 16, c1: 18 },
  { row: 5, c0: 8, c1: 10 },
];

// Embers (airborne refuel) strung along the graceful line — brushing them is the
// stylish, fuel-efficient route to a gold medal.
const EMBERS: Array<{ col: number; row: number }> = [
  { col: 9, row: 11 },
  { col: 14, row: 8 },
  { col: 15, row: 5 },
  { col: 12, row: 3 },
];

const SPAWN = { col: 5, row: 16 };
const GOAL = { col: 12, row: 2 };

function buildRows(): string[] {
  const grid: string[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => '.'));
  // Border walls + floor + ceiling.
  for (let x = 0; x < COLS; x++) {
    grid[0][x] = '#';
    grid[ROWS - 1][x] = '#';
  }
  for (let y = 0; y < ROWS; y++) {
    grid[y][0] = '#';
    grid[y][COLS - 1] = '#';
  }
  const paint = (spans: Span[], ch: string) => {
    for (const s of spans) for (let x = s.c0; x <= s.c1; x++) grid[s.row][x] = ch;
  };
  paint(LEDGES, '-');
  paint(THORNS, '^');
  for (const e of EMBERS) grid[e.row][e.col] = 'o';
  grid[SPAWN.row][SPAWN.col] = 'S';
  grid[GOAL.row][GOAL.col] = 'G';
  return grid.map((r) => r.join(''));
}

export const LEVEL: LevelData = defineLevel({
  name: 'nightshaft',
  tileSize: TILE,
  rows: buildRows(),
  legend: { o: 'ember' },
});

export const MAP: TilemapData = levelToTilemap(LEVEL);

/** Ember centers (design-space px), in level order. */
export const EMBER_POINTS: Point[] = LEVEL.entities.filter((e) => e.kind === 'ember').map((e) => ({ x: e.x, y: e.y }));

/** The lantern's center in design-space px. */
export const GOAL_POINT: Point = { x: (LEVEL.goal.x + 0.5) * TILE, y: (LEVEL.goal.y + 0.5) * TILE };

/** Rest-ledge landing points (top surface center), sorted bottom→top — the bot's climb path. */
export const REST_POINTS: Point[] = [...LEDGES]
  .sort((a, b) => b.row - a.row)
  .map((s) => ({ x: ((s.c0 + s.c1) / 2 + 0.5) * TILE, y: s.row * TILE }));

/** The flame's spawn — top-left of the collision box, feet on the spawn tile's floor. */
export function spawnState(cfg: FlameConfig = DEFAULT_FLAME): FlameState {
  const cx = (SPAWN.col + 0.5) * TILE;
  const feetY = (SPAWN.row + 1) * TILE; // rest on the tile below the marker
  return {
    x: cx - cfg.width / 2,
    y: feetY - cfg.height,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    coyote: cfg.coyoteTime,
    buffer: 0,
    ramp: 0,
    fuel: cfg.fuelMax,
    emberTaken: EMBER_POINTS.map(() => false),
    dead: false,
    won: false,
    ticks: 0,
  };
}

// ── Medal ladder: fuel remaining at the lantern is the mastery score ──────────
export type Medal = 'gold' | 'silver' | 'bronze';

export function medalFor(fuelRemaining: number): Medal {
  if (fuelRemaining >= 0.45) return 'gold';
  if (fuelRemaining >= 0.2) return 'silver';
  return 'bronze';
}

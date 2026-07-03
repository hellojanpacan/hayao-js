// PlatformerController: a state-of-the-art 2D kinematic character controller.
// Pure and deterministic — plain-data state, stepped at the fixed timestep, no
// engine imports beyond physics/math — so every game-feel feature below is
// unit-testable in Node by pumping frames.
//
// Implements the modern platforming canon:
//   coyote time · jump buffering · variable jump height · halved-gravity apex
//   jump corner correction · dash (8-way) · dash corner correction
//   wall slide + wall jump · moving-platform carry + lift momentum storage
//   one-way platforms + drop-through

import { dhypot } from '../core/dmath';
import { moveRect, rectBlocked, type SolidRect } from './aabb';
import type { TilemapData } from './tilemap';

export interface PlatformerConfig {
  width: number;
  height: number;
  /** Ground run speed (px/s) and accelerations (px/s²). */
  runSpeed: number;
  groundAccel: number;
  groundFriction: number;
  airAccel: number;
  /**
   * Horizontal decel with no input while airborne (px/s²). Keep LOW: inherited
   * momentum (lift jumps, wall kicks) must survive flight to feel right.
   */
  airFriction: number;
  /** Gravity (px/s²), terminal fall speed, and the apex modifier. */
  gravity: number;
  maxFall: number;
  /** |vy| below this counts as the jump apex… */
  apexThreshold: number;
  /** …where gravity is multiplied by this while jump is held (the floaty peak). */
  apexGravityMult: number;
  /** Initial jump velocity (px/s, upward) and early-release cut multiplier. */
  jumpVelocity: number;
  jumpCutMult: number;
  /** Grace timers (seconds). */
  coyoteTime: number;
  jumpBuffer: number;
  /** Max px the body is nudged sideways to slip past a ceiling corner when jumping. */
  jumpCornerNudge: number;
  /** Max px the body is nudged vertically to slip past a corner while dashing. */
  dashCornerNudge: number;
  /** Mid-air jumps (0 = none, 1 = double jump…), refilled on landing/wall. */
  airJumps: number;
  /** Air-jump velocity as a fraction of jumpVelocity. */
  airJumpMult: number;
  /** Dash: speed (px/s), duration (s), cooldown (s), charges refilled on landing. */
  dashSpeed: number;
  dashTime: number;
  dashCooldown: number;
  dashCharges: number;
  /** Wall interaction. */
  wallSlideMaxFall: number;
  wallJumpVelX: number;
  wallJumpVelY: number;
  /** Seconds after a wall jump during which input can't cancel the outward velocity. */
  wallJumpLock: number;
}

/** Tuned for 32px tiles at 60Hz in the 1280×720 design space. */
export const DEFAULT_PLATFORMER: PlatformerConfig = {
  width: 22,
  height: 28,
  runSpeed: 340,
  groundAccel: 3800,
  groundFriction: 4200,
  airAccel: 2600,
  airFriction: 260,
  gravity: 2300,
  maxFall: 660,
  apexThreshold: 60,
  apexGravityMult: 0.5,
  jumpVelocity: 650,
  jumpCutMult: 0.4,
  coyoteTime: 0.1,
  jumpBuffer: 0.12,
  jumpCornerNudge: 10,
  dashCornerNudge: 12,
  airJumps: 0,
  airJumpMult: 0.92,
  dashSpeed: 640,
  dashTime: 0.14,
  dashCooldown: 0.25,
  dashCharges: 1,
  wallSlideMaxFall: 150,
  wallJumpVelX: 360,
  wallJumpVelY: 600,
  wallJumpLock: 0.13,
};

/** Per-step intent, sampled from actions by the game (never raw keys). */
export interface PadInput {
  moveX: number; // -1 | 0 | 1
  moveY: number; // -1 (up) | 0 | 1 (down)
  jumpHeld: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
}

export const PAD_NEUTRAL: PadInput = { moveX: 0, moveY: 0, jumpHeld: false, jumpPressed: false, dashPressed: false };

/** A moving platform: its current rect, plus its velocity this step (px/s). */
export interface Platform extends SolidRect {
  vx: number;
  vy: number;
}

/** Plain serializable controller state — put it in `world.state` so it hashes. */
export interface PlatformerState {
  x: number; // top-left of the collision box
  y: number;
  vx: number;
  vy: number;
  facing: number; // -1 | 1
  onGround: boolean;
  onWall: number; // -1 touching left wall, 1 right, 0 none
  coyote: number;
  buffer: number;
  jumping: boolean; // rising from a jump (variable-height window)
  wallLock: number;
  airJumpsLeft: number;
  dashing: number; // time left in current dash
  dashCd: number;
  dashesLeft: number;
  dashVx: number;
  dashVy: number;
  /** Velocity inherited from the platform we stand on (lift momentum storage). */
  carryVx: number;
  carryVy: number;
  dead: boolean;
}

export function createPlatformerState(x: number, y: number): PlatformerState {
  return { x, y, vx: 0, vy: 0, facing: 1, onGround: false, onWall: 0, coyote: 0, buffer: 0, jumping: false, wallLock: 0, airJumpsLeft: 0, dashing: 0, dashCd: 0, dashesLeft: 1, dashVx: 0, dashVy: 0, carryVx: 0, carryVy: 0, dead: false };
}

/** Feel events emitted by a step — hooks for SFX / particles / screen shake. */
export interface PlatformerEvents {
  jumped: boolean;
  wallJumped: boolean;
  airJumped: boolean;
  dashed: boolean;
  landed: boolean;
  died: boolean;
}

const approach = (v: number, target: number, delta: number): number => (v < target ? Math.min(v + delta, target) : Math.max(v - delta, target));

/**
 * Advance the controller one fixed step. Mutates `s`; returns feel events.
 * `platforms` should already be at their post-move positions for this step,
 * with `vx/vy` set to their velocity, so the body is carried exactly.
 */
export function stepPlatformer(s: PlatformerState, input: PadInput, dt: number, map: TilemapData, cfg: PlatformerConfig = DEFAULT_PLATFORMER, platforms: Platform[] = []): PlatformerEvents {
  const ev: PlatformerEvents = { jumped: false, wallJumped: false, airJumped: false, dashed: false, landed: false, died: false };
  if (s.dead) return ev;
  const wasGrounded = s.onGround;

  // ── Timers ──
  s.coyote = Math.max(0, s.coyote - dt);
  s.buffer = Math.max(0, s.buffer - dt);
  s.wallLock = Math.max(0, s.wallLock - dt);
  s.dashCd = Math.max(0, s.dashCd - dt);
  if (input.jumpPressed) s.buffer = cfg.jumpBuffer;

  // ── Dash start ──
  if (input.dashPressed && s.dashing <= 0 && s.dashCd <= 0 && s.dashesLeft > 0) {
    let dx = input.moveX;
    let dy = input.moveY;
    if (dx === 0 && dy === 0) dx = s.facing;
    const inv = 1 / dhypot(dx, dy);
    s.dashing = cfg.dashTime;
    s.dashCd = cfg.dashCooldown;
    s.dashesLeft--;
    s.dashVx = dx * inv * cfg.dashSpeed;
    s.dashVy = dy * inv * cfg.dashSpeed;
    s.jumping = false;
    ev.dashed = true;
  }

  // ── Horizontal intent ──
  if (s.dashing > 0) {
    s.vx = s.dashVx;
    s.vy = s.dashVy;
    s.dashing -= dt;
  } else if (s.wallLock <= 0) {
    const target = input.moveX * cfg.runSpeed;
    const accel = s.onGround ? (input.moveX !== 0 ? cfg.groundAccel : cfg.groundFriction) : input.moveX !== 0 ? cfg.airAccel : cfg.airFriction;
    s.vx = approach(s.vx, target, accel * dt);
    if (input.moveX !== 0) s.facing = input.moveX > 0 ? 1 : -1;
  }

  // ── Gravity (skipped while dashing) ──
  if (s.dashing <= 0 && !s.onGround) {
    let g = cfg.gravity;
    if (Math.abs(s.vy) < cfg.apexThreshold && input.jumpHeld && s.jumping) g *= cfg.apexGravityMult; // halved-gravity peak
    s.vy = Math.min(s.vy + g * dt, cfg.maxFall);
    if (s.onWall !== 0 && s.vy > cfg.wallSlideMaxFall && input.moveX === s.onWall) s.vy = cfg.wallSlideMaxFall; // wall slide
  }

  // ── Variable jump height: release cuts upward velocity ──
  if (s.jumping && !input.jumpHeld && s.vy < 0) {
    s.vy *= cfg.jumpCutMult;
    s.jumping = false;
  }

  // ── Jump (buffered + coyote) / wall jump ──
  if (s.buffer > 0 && s.dashing <= 0) {
    if (s.onGround || s.coyote > 0) {
      s.vy = -cfg.jumpVelocity;
      // Lift momentum storage: keep the platform's motion.
      s.vx += s.carryVx;
      if (s.carryVy < 0) s.vy += s.carryVy;
      s.jumping = true;
      s.buffer = 0;
      s.coyote = 0;
      s.onGround = false;
      ev.jumped = true;
    } else if (s.onWall !== 0 && cfg.wallJumpVelY > 0) {
      s.vx = -s.onWall * cfg.wallJumpVelX;
      s.vy = -cfg.wallJumpVelY;
      s.facing = -s.onWall;
      s.jumping = true;
      s.buffer = 0;
      s.wallLock = cfg.wallJumpLock;
      ev.wallJumped = true;
      ev.jumped = true;
    } else if (s.airJumpsLeft > 0) {
      s.vy = -cfg.jumpVelocity * cfg.airJumpMult;
      s.airJumpsLeft--;
      s.jumping = true;
      s.buffer = 0;
      ev.jumped = true;
      ev.airJumped = true;
    }
  }

  // ── Move-and-collide, with platform carry ──
  // Holding down passes through one-ways — INCLUDING while already falling,
  // or the body re-lands on the platform lip one frame after leaving it.
  const dropThrough = input.moveY > 0 && s.buffer <= 0;
  let dx = s.vx * dt + s.carryVx * dt * (s.onGround ? 1 : 0);
  let dy = s.vy * dt + Math.max(0, s.carryVy) * dt * (s.onGround ? 1 : 0);
  let res = moveRect(map, { x: s.x, y: s.y, w: cfg.width, h: cfg.height }, dx, dy, { solids: platforms, dropThrough });

  // ── Jump corner correction: bonked a ceiling edge while rising → nudge sideways ──
  if (res.onCeiling && s.vy < 0 && s.dashing <= 0) {
    const slip = cornerSlipX(map, platforms, res.x, res.y, cfg.width, cfg.height, dy, cfg.jumpCornerNudge);
    if (slip !== null) {
      res = moveRect(map, { x: slip, y: res.y, w: cfg.width, h: cfg.height }, 0, dy, { solids: platforms, dropThrough });
      res.x = slip;
    }
  }

  // ── Dash corner correction: clipped a wall edge while dashing → nudge vertically ──
  if (res.hitX && s.dashing > 0 && Math.abs(s.dashVy) < 1) {
    const slip = cornerSlipY(map, platforms, res.x, res.y, cfg.width, cfg.height, dx, cfg.dashCornerNudge);
    if (slip !== null) {
      res = moveRect(map, { x: res.x, y: slip, w: cfg.width, h: cfg.height }, dx, 0, { solids: platforms, dropThrough });
      res.y = slip;
    }
  }

  s.x = res.x;
  s.y = res.y;
  if (res.hitY && s.vy > 0) s.vy = 0;
  if (res.onCeiling) {
    s.vy = Math.max(s.vy, 0);
    s.jumping = false;
  }
  if (res.hitX && s.dashing <= 0) s.vx = 0;
  s.onWall = res.onWallLeft ? -1 : res.onWallRight ? 1 : wallTouch(map, platforms, s.x, s.y, cfg.width, cfg.height);
  s.onGround = res.onFloor;

  // ── Ground bookkeeping: coyote, dash refill, landing, lift momentum ──
  if (s.onGround) {
    s.coyote = cfg.coyoteTime;
    s.dashesLeft = cfg.dashCharges;
    s.airJumpsLeft = cfg.airJumps;
    if (!wasGrounded) ev.landed = true;
    if (res.floorSolid >= 0) {
      const p = platforms[res.floorSolid];
      s.carryVx = p.vx;
      s.carryVy = p.vy;
      // Ride the platform exactly: snap feet to its top.
      s.y = p.y - cfg.height;
    } else {
      s.carryVx = 0;
      s.carryVy = 0;
    }
    if (s.vy > 0) s.vy = 0;
    s.jumping = false;
  } else if (wasGrounded && s.carryVy !== 0) {
    // Walked off a lift: keep stored momentum until landing or jumping.
  }

  if (res.hazard) {
    s.dead = true;
    ev.died = true;
  }
  return ev;
}

// ── Movement envelope: derive level geometry from the config, never guess ──
// Conservative closed-form bounds (they ignore the apex-gravity bonus, so the
// real controller always reaches at least this far). Author levels against
// these — "it looks jumpable" is how unwinnable geometry ships.

/** Max rise of a full jump (px). */
export function jumpHeight(cfg: PlatformerConfig = DEFAULT_PLATFORMER): number {
  return (cfg.jumpVelocity * cfg.jumpVelocity) / (2 * cfg.gravity);
}

/** Full-jump airtime returning to takeoff height (s). */
export function jumpAirtime(cfg: PlatformerConfig = DEFAULT_PLATFORMER): number {
  return (2 * cfg.jumpVelocity) / cfg.gravity;
}

/** Max horizontal gap clearable by a running jump (px, flat-to-flat). */
export function jumpDistance(cfg: PlatformerConfig = DEFAULT_PLATFORMER): number {
  return cfg.runSpeed * jumpAirtime(cfg);
}

/** Max gap clearable by jump + one apex dash (px, flat-to-flat, horizontal dash). */
export function dashJumpDistance(cfg: PlatformerConfig = DEFAULT_PLATFORMER): number {
  return jumpDistance(cfg) + (cfg.dashSpeed - cfg.runSpeed) * cfg.dashTime;
}

/** Try shifting x by up to ±nudge so a rect moving by dy is unblocked. Prefers the smaller shift. */
function cornerSlipX(map: TilemapData, solids: SolidRect[], x: number, y: number, w: number, h: number, dy: number, nudge: number): number | null {
  for (let n = 1; n <= nudge; n++) {
    for (const dir of [1, -1]) {
      const nx = x + dir * n;
      if (!rectBlocked(map, nx, y + dy, w, h, solids) && !rectBlocked(map, nx, y, w, h, solids)) return nx;
    }
  }
  return null;
}

/** Try shifting y by up to ±nudge so a rect moving by dx is unblocked. */
function cornerSlipY(map: TilemapData, solids: SolidRect[], x: number, y: number, w: number, h: number, dx: number, nudge: number): number | null {
  for (let n = 1; n <= nudge; n++) {
    for (const dir of [-1, 1]) {
      const ny = y + dir * n;
      if (!rectBlocked(map, x + dx, ny, w, h, solids) && !rectBlocked(map, x, ny, w, h, solids)) return ny;
    }
  }
  return null;
}

/** Which wall (if any) is the body pressed against? (1px probes) */
function wallTouch(map: TilemapData, solids: SolidRect[], x: number, y: number, w: number, h: number): number {
  if (rectBlocked(map, x + 1, y, w, h, solids)) return 1;
  if (rectBlocked(map, x - 1, y, w, h, solids)) return -1;
  return 0;
}

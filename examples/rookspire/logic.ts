// Rookspire sim — pure module. A demolition slingshot: castles of wood and
// stone built from RIGID BODIES (the new dynamics engine), rook idols that
// shatter under hard impacts or when they touch the earth, and a heavy shot
// with bullet CCD so full-power launches never tunnel through a plank.
// The whole physics world is plain data inside this state — hash, snapshot,
// and the aim-searching verify bot all come free.

import {
  addBody, addDistanceJoint, createRigidWorld, dcos, dsin, getBody,
  polygonBox, removeBody, rigidStep, type RigidWorld,
} from '@hayao';

export const W = 1280;
export const H = 704;
export const GROUND_Y = 620;
export const SLING = { x: 110, y: 430 };
export const SHOT_R = 14;
/** Contact impulse above which a rook idol shatters (a direct, violent hit). */
export const SMASH_IMPULSE = 60;
/** Launch speed range across the power bar. */
export const SPEED_MIN = 500;
export const SPEED_MAX = 1400;

export interface RkIdol {
  id: number;      // rigid body id (0 once destroyed)
  alive: boolean;
}

export interface RkState {
  level: number;
  phys: RigidWorld;
  idols: RkIdol[];
  shotsLeft: number;
  aim: number;       // radians; 0 = right, negative = up
  power: number;     // 0..1
  proj: number;      // body id of the shot in flight (0 = none)
  shotTimer: number; // frames since launch
  grace: number;     // settle frames after the last shot before defeat
  score: number;
  won: boolean;
  dead: boolean;
}

export interface RkInput {
  aimDir: number;    // -1 raise, +1 lower
  powerDir: number;  // -1 soften, +1 harden
  launch: boolean;
}

export interface RkEvents {
  launched: boolean;
  smashed: number;   // idols destroyed this step
  grounded: number;  // idols that touched the earth this step
  thud: number;      // loudest structural impulse this step
  won: boolean;
  died: boolean;
}

export const LEVEL_COUNT = 3;
export const LEVEL_NAMES = ['The Lone Perch', 'Twin Rooks', 'The Hanging Keep'];
export const LEVEL_SHOTS = [3, 4, 5];

const WOOD = { density: 1, friction: 0.6, restitution: 0.05 };
const STONE = { density: 2.2, friction: 0.7, restitution: 0.02 };

/** A castle piece; the view reads shape+material back from the body list. */
function box(rw: RigidWorld, x: number, y: number, w: number, h: number, mat = WOOD): number {
  return addBody(rw, { shape: polygonBox(w, h), x, y, ...mat });
}

function idol(rw: RigidWorld, x: number, y: number, linDamp = 0): number {
  return addBody(rw, { shape: { kind: 'circle', r: 16 }, x, y, density: 0.8, friction: 0.5, restitution: 0.1, linDamp });
}

/** Build a level into a fresh physics world; returns the idol body ids. */
function buildLevel(rw: RigidWorld, level: number): number[] {
  // The earth and the sling cliff.
  addBody(rw, { kind: 'static', shape: polygonBox(W * 2, 80), x: W / 2, y: GROUND_Y + 40, friction: 0.8 });
  addBody(rw, { kind: 'static', shape: polygonBox(180, 150), x: 110, y: GROUND_Y - 75, friction: 0.8 });

  if (level === 0) {
    // The Lone Perch: one idol on a three-box tower. Teach the arc.
    const bx = 900;
    box(rw, bx, GROUND_Y - 20, 40, 40);
    box(rw, bx, GROUND_Y - 60, 40, 40);
    box(rw, bx, GROUND_Y - 100, 40, 40);
    return [idol(rw, bx, GROUND_Y - 136)];
  }
  if (level === 1) {
    // Twin Rooks: two towers joined by a plank lintel; idols on both perches.
    const ids: number[] = [];
    for (const bx of [820, 1060]) {
      box(rw, bx, GROUND_Y - 20, 40, 40, STONE);
      box(rw, bx, GROUND_Y - 60, 40, 40);
      box(rw, bx, GROUND_Y - 100, 40, 40);
    }
    box(rw, 940, GROUND_Y - 128, 300, 16); // the lintel
    ids.push(idol(rw, 820, GROUND_Y - 160));
    ids.push(idol(rw, 1060, GROUND_Y - 160));
    ids.push(idol(rw, 940, GROUND_Y - 152)); // the middle rook rides the plank
    return ids;
  }
  // The Hanging Keep: a walled alcove hiding an idol, and one swinging from a
  // rope off the keep's arm — joints under demolition load.
  const ids: number[] = [];
  const kx = 950;
  // Alcove: floor slab, two stone walls, a roof plank, idol inside.
  box(rw, kx, GROUND_Y - 14, 200, 28, STONE);
  box(rw, kx - 80, GROUND_Y - 68, 32, 80, STONE);
  box(rw, kx + 80, GROUND_Y - 68, 32, 80, STONE);
  box(rw, kx, GROUND_Y - 122, 220, 20);
  ids.push(idol(rw, kx, GROUND_Y - 48));
  // Tower beside it with an arm; a rook hangs from the arm on a rope.
  box(rw, kx - 220, GROUND_Y - 30, 44, 60, STONE);
  box(rw, kx - 220, GROUND_Y - 90, 44, 60, STONE);
  const arm = box(rw, kx - 150, GROUND_Y - 132, 180, 18);
  const hang = idol(rw, kx - 100, GROUND_Y - 60, 0.6); // air drag — a hanging rook sways to rest
  addDistanceJoint(rw, { a: arm, b: hang, ax: 50, ay: 0, length: 62, rope: true });
  ids.push(hang);
  return ids;
}

export function initialRk(level = 0): RkState {
  const phys = createRigidWorld({ gravityY: 900 });
  const idolIds = buildLevel(phys, level);
  return {
    level,
    phys,
    idols: idolIds.map((id) => ({ id, alive: true })),
    shotsLeft: LEVEL_SHOTS[level],
    aim: -0.55,
    power: 0.65,
    proj: 0,
    shotTimer: 0,
    grace: 0,
    score: 0,
    won: false,
    dead: false,
  };
}

/** Advance one fixed step. Mutates `s`; returns events for fx/audio. */
export function stepRk(s: RkState, input: RkInput, dt: number): RkEvents {
  const ev: RkEvents = { launched: false, smashed: 0, grounded: 0, thud: 0, won: false, died: false };
  if (s.won || s.dead) {
    // Terminal, but the dust still settles — the collapse finishes playing
    // out behind the end screen, and sleep reclaims the world.
    rigidStep(s.phys, dt);
    for (const b of [...s.phys.bodies]) {
      if (b.kind === 'dynamic' && (b.x < -200 || b.x > W + 200 || b.y > H + 200)) removeBody(s.phys, b.id);
    }
    if (s.proj !== 0) { s.shotTimer++; if (s.shotTimer > 420) s.proj = 0; }
    return ev;
  }

  // Aiming (only between shots — one stone in the air at a time).
  if (s.proj === 0) {
    s.aim = Math.min(0.15, Math.max(-1.35, s.aim + input.aimDir * 0.9 * dt));
    s.power = Math.min(1, Math.max(0, s.power + input.powerDir * 0.8 * dt));
    if (input.launch && s.shotsLeft > 0) {
      const speed = SPEED_MIN + (SPEED_MAX - SPEED_MIN) * s.power;
      s.proj = addBody(s.phys, {
        shape: { kind: 'circle', r: SHOT_R },
        x: SLING.x, y: SLING.y,
        vx: dcos(s.aim) * speed, vy: dsin(s.aim) * speed,
        density: 3, friction: 0.5, restitution: 0.25,
        linDamp: 0.12, angDamp: 2, // plow, don't roll — a spent stone stops
        bullet: true,
      });
      s.shotsLeft--;
      s.shotTimer = 0;
      ev.launched = true;
    }
  }

  // The world always keeps settling, shot in flight or not.
  const contacts = rigidStep(s.phys, dt);

  // Idol destruction — a violent contact, from any body.
  for (const c of contacts) {
    if (c.sensor) continue;
    if (c.impulse > ev.thud) ev.thud = c.impulse;
    if (c.impulse < SMASH_IMPULSE) continue;
    for (const rook of s.idols) {
      if (rook.alive && (c.a === rook.id || c.b === rook.id)) {
        rook.alive = false;
        removeBody(s.phys, rook.id);
        rook.id = 0;
        ev.smashed++;
        s.score += 500;
      }
    }
  }
  // …or touching the earth (below the perch line).
  for (const rook of s.idols) {
    if (!rook.alive) continue;
    const b = getBody(s.phys, rook.id);
    if (!b) { rook.alive = false; rook.id = 0; continue; }
    if (b.y > GROUND_Y - 24) {
      rook.alive = false;
      removeBody(s.phys, rook.id);
      rook.id = 0;
      ev.grounded++;
      s.score += 300;
    }
  }

  // Rubble culling: anything that tumbles out of the field is gone for good
  // (an off-screen roller must not hold the world awake forever).
  for (const b of [...s.phys.bodies]) {
    if (b.kind !== 'dynamic') continue;
    if (b.x < -200 || b.x > W + 200 || b.y > H + 200) {
      if (b.id === s.proj) s.proj = 0;
      removeBody(s.phys, b.id);
    }
  }

  // Shot lifecycle: the stone stays as rubble; the SHOT ends when it sleeps,
  // leaves the field, or has flown long enough.
  if (s.proj !== 0) {
    s.shotTimer++;
    const p = getBody(s.phys, s.proj);
    const gone = !p || p.x < -100 || p.x > W + 100 || p.y > H + 100;
    if (gone || p!.sleeping || s.shotTimer > 420) {
      if (gone && p) removeBody(s.phys, s.proj);
      s.proj = 0;
    }
  }

  // Win / lose.
  if (s.idols.every((r) => !r.alive)) {
    s.won = true;
    s.score += s.shotsLeft * 200;
    ev.won = true;
    return ev;
  }
  if (s.shotsLeft === 0 && s.proj === 0) {
    s.grace++;
    if (s.grace > 150) {
      s.dead = true;
      ev.died = true;
    }
  } else {
    s.grace = 0;
  }
  return ev;
}

/** Ballistic aim preview points (no drag — matches the launch integrator). */
export function aimArc(s: RkState, n = 10): { x: number; y: number }[] {
  const speed = SPEED_MIN + (SPEED_MAX - SPEED_MIN) * s.power;
  let px = SLING.x, py = SLING.y;
  let vx = dcos(s.aim) * speed, vy = dsin(s.aim) * speed;
  const out: { x: number; y: number }[] = [];
  const step = 0.05;
  for (let i = 0; i < n; i++) {
    px += vx * step;
    py += vy * step;
    vy += 900 * step;
    out.push({ x: px, y: py });
  }
  return out;
}

export function idolsLeft(s: RkState): number {
  return s.idols.filter((r) => r.alive).length;
}

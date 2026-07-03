// Veilstep stealth sim — pure module. Guard patrols, vision cones (engine
// raycast), a detection meter with fill/drain, bush concealment, sprint noise,
// and the heist objective. Alarm = reset, counted.

import { inVisionCone, moveRect, tilemapFromAscii, asciiEntities, type TilemapData, type Vec2, dhypot } from '@hayao';
import { BUSHES, BUSH_RADIUS, DETECT, GUARDS, LEVEL_ROWS, NOISE_RADIUS, PAUSE_AT_ENDS, SPEEDS, VISION } from './level';

export const TILE_SIZE = 32;

export interface Guard {
  x: number;
  y: number;
  fx: number;
  fy: number;
  /** patrol | pause | investigate */
  state: string;
  t: number;
  /** Patrol progress: heading to b (1) or a (-1). */
  dir: number;
  ix: number; // investigate target
  iy: number;
}

export interface VsState {
  x: number;
  y: number;
  idol: boolean;
  won: boolean;
  alarms: number;
  meter: number;
  guards: Guard[];
  [key: string]: unknown;
}

let _map: TilemapData | null = null;
let _spawn: Vec2 | null = null;
let _idol: Vec2 | null = null;
export function levelMap(): TilemapData {
  if (!_map) {
    _map = tilemapFromAscii(LEVEL_ROWS, TILE_SIZE);
    const ents = asciiEntities(LEVEL_ROWS, TILE_SIZE);
    _spawn = ents.find((e) => e.char === '@')!;
    _idol = ents.find((e) => e.char === 'I')!;
  }
  return _map;
}
export const spawnPoint = (): Vec2 => (levelMap(), { x: _spawn!.x, y: _spawn!.y });
export const idolPoint = (): Vec2 => (levelMap(), { x: _idol!.x, y: _idol!.y });

export function initialVs(): VsState {
  const s = spawnPoint();
  return {
    x: s.x,
    y: s.y,
    idol: false,
    won: false,
    alarms: 0,
    meter: 0,
    guards: GUARDS.map((g) => ({ x: g.ax, y: g.ay, fx: 1, fy: 0, state: 'patrol', t: 0, dir: 1, ix: 0, iy: 0 })),
  };
}

export interface VsInput {
  moveX: number;
  moveY: number;
  sprint: boolean;
}

export interface VsEvents {
  spotted: boolean; // alarm fired
  grabbed: boolean;
  won: boolean;
  noise: boolean;
}

export const isHidden = (s: VsState): boolean => BUSHES.some((b) => dhypot(s.x - b.x, s.y - b.y) < BUSH_RADIUS);

export function stepVs(s: VsState, input: VsInput, dt: number): VsEvents {
  const ev: VsEvents = { spotted: false, grabbed: false, won: false, noise: false };
  if (s.won) return ev;
  const map = levelMap();

  // ── Player ──
  const il = dhypot(input.moveX, input.moveY) || 1;
  const speed = input.sprint ? SPEEDS.sprint : SPEEDS.sneak;
  const res = moveRect(map, { x: s.x - 10, y: s.y - 10, w: 20, h: 20 }, (input.moveX / il) * speed * dt, (input.moveY / il) * speed * dt);
  s.x = res.x + 10;
  s.y = res.y + 10;

  // Sprinting is loud: nearby guards turn and investigate.
  const moving = input.moveX !== 0 || input.moveY !== 0;
  if (input.sprint && moving) {
    ev.noise = true;
    for (const g of s.guards) {
      if (dhypot(g.x - s.x, g.y - s.y) < NOISE_RADIUS) {
        g.state = 'investigate';
        g.t = 0;
        g.ix = s.x;
        g.iy = s.y;
        const d = dhypot(s.x - g.x, s.y - g.y) || 1;
        g.fx = (s.x - g.x) / d;
        g.fy = (s.y - g.y) / d;
      }
    }
  }

  // ── Guards ──
  const hidden = isHidden(s);
  let seen = false;
  s.guards.forEach((g, gi) => {
    const def = GUARDS[gi];
    g.t += dt;
    if (g.state === 'patrol') {
      const tx = g.dir > 0 ? def.bx : def.ax;
      const ty = g.dir > 0 ? def.by : def.ay;
      const dx = tx - g.x;
      const dy = ty - g.y;
      const d = dhypot(dx, dy);
      if (d < 4) {
        g.state = 'pause';
        g.t = 0;
      } else {
        g.x += (dx / d) * def.speed * dt;
        g.y += (dy / d) * def.speed * dt;
        g.fx = dx / d;
        g.fy = dy / d;
      }
    } else if (g.state === 'pause') {
      if (g.t >= PAUSE_AT_ENDS) {
        g.dir *= -1;
        g.state = 'patrol';
      } else if (g.t > PAUSE_AT_ENDS / 2) {
        // Turn toward the return leg early (scans behind before walking).
        const tx = g.dir > 0 ? def.ax : def.bx;
        const ty = g.dir > 0 ? def.ay : def.by;
        const d = dhypot(tx - g.x, ty - g.y) || 1;
        g.fx = (tx - g.x) / d;
        g.fy = (ty - g.y) / d;
      }
    } else if (g.state === 'investigate') {
      const dx = g.ix - g.x;
      const dy = g.iy - g.y;
      const d = dhypot(dx, dy);
      if (d > 6) {
        g.x += (dx / d) * def.speed * 1.3 * dt;
        g.y += (dy / d) * def.speed * 1.3 * dt;
        g.fx = dx / d;
        g.fy = dy / d;
      } else if (g.t > 2.2) {
        g.state = 'patrol';
      }
    }
    if (!hidden && inVisionCone(map, g.x, g.y, g.fx, g.fy, VISION.fov, VISION.range, s.x, s.y)) seen = true;
  });

  // ── Detection meter ──
  s.meter = seen ? Math.min(1, s.meter + dt / DETECT.fill) : Math.max(0, s.meter - dt / DETECT.drain);
  if (s.meter >= 1) {
    ev.spotted = true;
    s.alarms++;
    const sp = spawnPoint();
    s.x = sp.x;
    s.y = sp.y;
    s.idol = false;
    s.meter = 0;
    s.guards = initialVs().guards;
    return ev;
  }

  // ── Objective ──
  const idol = idolPoint();
  if (!s.idol && dhypot(s.x - idol.x, s.y - idol.y) < 28) {
    s.idol = true;
    ev.grabbed = true;
  }
  const sp = spawnPoint();
  if (s.idol && dhypot(s.x - sp.x, s.y - sp.y) < 30) {
    s.won = true;
    ev.won = true;
  }
  return ev;
}

export { GUARDS, BUSHES, BUSH_RADIUS, VISION };

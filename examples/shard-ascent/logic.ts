// Pure level logic: parse ASCII into collision + entities, and compute moving
// platform positions as a pure function of sim time. No scene imports — this
// module is the canonical truth the view renders and the verifier drives.

import { tilemapFromAscii, asciiEntities, type TilemapData, type Platform, type Vec2 } from '@hayao';
import { LEVELS, type LevelDef, type MoverDef } from './levels';

export const TILE_SIZE = 32;

export interface ParsedLevel {
  def: LevelDef;
  map: TilemapData;
  /** Spawn point (tile center). */
  spawn: Vec2;
  shard: Vec2 | null;
  exit: Vec2;
}

export function parseLevel(index: number): ParsedLevel {
  const def = LEVELS[index];
  const map = tilemapFromAscii(def.rows, TILE_SIZE);
  const ents = asciiEntities(def.rows, TILE_SIZE);
  const find = (c: string) => ents.find((e) => e.char === c);
  const spawn = find('@');
  const exit = find('E');
  if (!spawn || !exit) throw new Error(`level ${index}: missing @ or E marker`);
  const shard = find('*');
  return { def, map, spawn: { x: spawn.x, y: spawn.y }, shard: shard ? { x: shard.x, y: shard.y } : null, exit: { x: exit.x, y: exit.y } };
}

/** Ping-pong x position of a mover at sim time t (pure, deterministic). */
export function moverX(m: MoverDef, t: number): number {
  const span = m.x1 - m.x0;
  if (span <= 0) return m.x0;
  const period = (2 * span) / m.speed;
  const phase = t - Math.floor(t / period) * period;
  const d = phase * m.speed;
  return m.x0 + (d <= span ? d : 2 * span - d);
}

/** All platforms of a level at time t, with per-step velocities for carry. */
export function platformsAt(index: number, t: number, dt: number): Platform[] {
  return LEVELS[index].movers.map((m) => {
    const x = moverX(m, t);
    const prev = moverX(m, Math.max(0, t - dt));
    return { x, y: m.y, w: m.w, h: m.h, vx: dt > 0 ? (x - prev) / dt : 0, vy: 0 };
  });
}

/** Circle-ish pickup test between the player box center and a point. */
export function nearPoint(px: number, py: number, p: Vec2, radius = 30): boolean {
  const dx = px - p.x;
  const dy = py - p.y;
  return dx * dx + dy * dy <= radius * radius;
}

export { LEVELS };

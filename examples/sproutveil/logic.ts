// Pure world logic: room parsing, border transitions, and the ability system.

import { tilemapFromAscii, asciiEntities, type TilemapData, type Vec2, DEFAULT_PLATFORMER, type PlatformerConfig } from '@hayao';
import { ROOMS } from './rooms';

export const TILE_SIZE = 32;
export const ROOM_W = 40 * TILE_SIZE;
export const ROOM_H = 22 * TILE_SIZE;

export type Ability = 'dj' | 'dash';

export interface ParsedRoom {
  name: string;
  map: TilemapData;
  spawn: Vec2 | null;
  pickups: { ability: Ability; at: Vec2 }[];
  heart: Vec2 | null;
}

const cache: ParsedRoom[] = [];

export function parseRoom(index: number): ParsedRoom {
  if (cache[index]) return cache[index];
  const def = ROOMS[index];
  const map = tilemapFromAscii(def.rows, TILE_SIZE);
  const ents = asciiEntities(def.rows, TILE_SIZE);
  const find = (c: string) => ents.find((e) => e.char === c) ?? null;
  const spawn = find('@');
  const heart = find('H');
  const pickups: ParsedRoom['pickups'] = [];
  const j = find('J');
  const d = find('D');
  if (j) pickups.push({ ability: 'dj', at: { x: j.x, y: j.y } });
  if (d) pickups.push({ ability: 'dash', at: { x: d.x, y: d.y } });
  cache[index] = { name: def.name, map, spawn: spawn && { x: spawn.x, y: spawn.y }, pickups, heart: heart && { x: heart.x, y: heart.y } };
  return cache[index];
}

export interface Transition {
  room: number;
  x: number;
  y: number;
}

/**
 * If a body center (x, y) is crossing an open border, return the target room
 * and reposition. Thresholds sit just INSIDE the border: the tilemap reads
 * out-of-bounds as solid (rooms are sealed by construction), so a body in an
 * opening is clamped at the boundary and its center can never actually exit —
 * it must transition a few px early. Up-transitions land beside the Atrium hole.
 */
export function transition(room: number, x: number, y: number): Transition | null {
  const exits = ROOMS[room].exits;
  if (x < 16 && exits.left !== undefined) return { room: exits.left, x: ROOM_W - 30, y };
  if (x > ROOM_W - 16 && exits.right !== undefined) return { room: exits.right, x: 30, y };
  if (y > ROOM_H - 20 && exits.down !== undefined) return { room: exits.down, x, y: 26 }; // past the up-threshold or it ping-pongs
  if (y < 20 && exits.up !== undefined) return { room: exits.up, x: 348, y: ROOM_H - 128 };
  return null;
}

/** The controller config for a set of held abilities (wall jump is not in this game). */
export function configFor(abilities: Ability[]): PlatformerConfig {
  return {
    ...DEFAULT_PLATFORMER,
    wallJumpVelX: 0,
    wallJumpVelY: 0,
    airJumps: abilities.includes('dj') ? 1 : 0,
  };
}

export { ROOMS };

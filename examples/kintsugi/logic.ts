// Kintsugi — the pure simulation. All canonical state lives in `KgState` (goes in
// world.state, so it hashes and saves); the scene tree is a view of it. Movement
// is the engine's `stepPlatformer` under an ability-derived config; room seams,
// pickups, hazards, death/respawn, and save shrines are layered on top. Combat is
// wired through `combat.ts`. No scene/render imports — this is the game's truth.

import {
  stepPlatformer,
  createPlatformerState,
  tilemapFromAscii,
  asciiEntities,
  type PlatformerState,
  type PadInput,
  type TilemapData,
} from '@hayao';
import { KINTSUGI_WORLD, ABIL } from './world';
import { configFor } from './abilities';
import { roomSpec, roomRows, entryFor, MARK_PICKUPS, RW, RH, TS, type Dir } from './rooms';

const OPPOSITE: Record<Dir, Dir> = { left: 'right', right: 'left', up: 'down', down: 'up' };

export interface SavePoint {
  region: string;
  x: number;
  y: number;
}

export interface KgState {
  region: string;
  p: PlatformerState;
  /** Ability ids held (subset of ABIL values). */
  abilities: string[];
  /** World-graph pickup ids collected. */
  taken: string[];
  hp: number;
  maxHp: number;
  deaths: number;
  save: SavePoint;
  /** Set true when a save shrine was just touched (for a view flourish). */
  savedFlash: number;
  won: boolean;
}

export const START_HP = 4;

// Pure memo: region id → collision tilemap (geometry is a pure function of id).
const mapCache = new Map<string, TilemapData>();
export function mapFor(region: string): TilemapData {
  let m = mapCache.get(region);
  if (!m) {
    const rows = roomRows(region);
    if (!rows) throw new Error(`kintsugi: no geometry for region "${region}"`);
    m = tilemapFromAscii(rows, TS);
    mapCache.set(region, m);
  }
  return m;
}

/** Uncollected pickup markers in a region: world position + world-graph pickup id. */
export function pickupsIn(region: string, taken: readonly string[]): { x: number; y: number; id: string; char: string }[] {
  const rows = roomRows(region);
  if (!rows) return [];
  const out: { x: number; y: number; id: string; char: string }[] = [];
  for (const e of asciiEntities(rows, TS)) {
    const id = MARK_PICKUPS[e.char];
    if (id && !taken.includes(id)) out.push({ x: e.x, y: e.y, id, char: e.char });
  }
  return out;
}

/** The save-shrine tile (marker 'K') world position in a region, if any. */
function shrineIn(region: string): { x: number; y: number } | null {
  const rows = roomRows(region);
  if (!rows) return null;
  for (const e of asciiEntities(rows, TS)) if (e.char === 'K') return { x: e.x, y: e.y };
  return null;
}

function grantOf(pickupId: string): string {
  return KINTSUGI_WORLD.pickups.find((p) => p.id === pickupId)?.grants ?? '';
}

export function initialState(): KgState {
  const spec = roomSpec(KINTSUGI_WORLD.start)!;
  const e = entryFor(spec, 'left');
  const p = createPlatformerState(e.x * TS, (RH - 4) * TS);
  const shr = shrineIn(KINTSUGI_WORLD.start);
  return {
    region: KINTSUGI_WORLD.start,
    p,
    abilities: [],
    taken: [],
    hp: START_HP,
    maxHp: START_HP,
    deaths: 0,
    save: { region: KINTSUGI_WORLD.start, x: shr ? shr.x : p.x, y: shr ? shr.y - TS : p.y },
    savedFlash: 0,
    won: false,
  };
}

export interface KgEvents {
  transitioned: boolean;
  picked: string | null;
  saved: boolean;
  died: boolean;
  jumped: boolean;
  dashed: boolean;
  landed: boolean;
}

const NO_EV: KgEvents = { transitioned: false, picked: null, saved: false, died: false, jumped: false, dashed: false, landed: false };

const overlaps = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

/** Advance the Mender one fixed step. Mutates `s`; returns events for the view. */
export function stepKintsugi(s: KgState, pad: PadInput, dt: number): KgEvents {
  if (s.won) return { ...NO_EV };
  const ev: KgEvents = { ...NO_EV };
  const cfg = configFor(s.abilities);
  const map = mapFor(s.region);

  const pe = stepPlatformer(s.p, pad, dt, map, cfg);
  ev.jumped = pe.jumped || pe.airJumped || pe.wallJumped;
  ev.dashed = pe.dashed;
  ev.landed = pe.landed;
  if (s.savedFlash > 0) s.savedFlash = Math.max(0, s.savedFlash - dt);

  // Death (hazard / fell out): lose a heart and return to the last shrine.
  if (s.p.dead || pe.died) {
    s.deaths += 1;
    s.hp = s.maxHp;
    s.region = s.save.region;
    const sp = roomSpec(s.region)!;
    const back = createPlatformerState(s.save.x, s.save.y);
    s.p = back;
    void sp;
    ev.died = true;
    return ev;
  }

  const w = cfg.width;
  const h = cfg.height;

  // Save shrine: standing on it records the checkpoint + heals.
  const shr = shrineIn(s.region);
  if (shr && overlaps(s.p.x, s.p.y, w, h, shr.x - 8, shr.y - TS, TS + 16, TS * 2)) {
    if (s.save.region !== s.region || Math.abs(s.save.x - s.p.x) > TS) ev.saved = true;
    s.save = { region: s.region, x: s.p.x, y: s.p.y };
    s.hp = s.maxHp;
    if (ev.saved) s.savedFlash = 1.2;
  }

  // Pickups: walking over a marker collects it.
  for (const pk of pickupsIn(s.region, s.taken)) {
    if (overlaps(s.p.x, s.p.y, w, h, pk.x - 6, pk.y - 6, TS + 12, TS + 12)) {
      s.taken = [...s.taken, pk.id];
      const g = grantOf(pk.id);
      if (g && !g.startsWith('shard:') && !s.abilities.includes(g)) s.abilities = [...s.abilities, g];
      ev.picked = pk.id;
      break;
    }
  }

  // Room seams: crossing an opening near a border moves to the neighbour.
  const cx = s.p.x + w / 2;
  const cy = s.p.y + h / 2;
  const spec = roomSpec(s.region)!;
  const INSET = TS * 0.9;
  let dir: Dir | null = null;
  if (spec.exits.left && cx < INSET) dir = 'left';
  else if (spec.exits.right && cx > RW * TS - INSET) dir = 'right';
  else if (spec.exits.up && cy < INSET) dir = 'up';
  else if (spec.exits.down && cy > RH * TS - INSET) dir = 'down';
  if (dir) {
    const target = spec.exits[dir]!;
    if (roomSpec(target)) {
      const nspec = roomSpec(target)!;
      const entry = entryFor(nspec, OPPOSITE[dir]);
      s.region = target;
      s.p.x = entry.x * TS;
      s.p.y = entry.y * TS;
      // keep vertical momentum through vertical seams; damp horizontal
      s.p.vx *= 0.3;
      ev.transitioned = true;
    }
  }

  if (s.region === KINTSUGI_WORLD.goal) s.won = true;
  return ev;
}

/** Pull the pad intent from action states (game wires this to the input map). */
export function padFrom(input: { isDown(a: string): boolean; justPressed(a: string): boolean }): PadInput {
  return {
    moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
    moveY: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
    jumpHeld: input.isDown('jump'),
    jumpPressed: input.justPressed('jump'),
    dashPressed: input.justPressed('dash'),
  };
}

export { ABIL };

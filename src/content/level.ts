// Levels as DATA, not code. A LevelData is a plain-JSON description of a stage —
// ASCII terrain, a spawn, a goal, and legend-tagged entities — that an agent can
// emit, diff, and (crucially) PROVE before a single node is built. This is the
// artifact the "core vs. recipes" split turns on: geometry lives in data a solver
// can bite on, not in imperative build() calls only a human can eyeball.
//
// Two proofs ship with the format:
//   • levelReachable       — 4/8-neighbour flood connectivity (top-down/roguelike).
//   • platformerReachable   — foothold + jump-arc reachability (a real "can you
//                             actually climb to the goal?" proof for platformers).
// Both run on the data alone — the FUN.md "procgen connectivity gate FIRST, before
// any numeric tuning" made checkable for hand-authored stages too.
//
// Reserved ASCII: 'S' spawn · 'G' goal · '#' solid · '-' one-way · '^' hazard ·
// '.'/' ' empty. Any other char is an entity if it appears in `legend`.

import { tilemapFromAscii, TILE, type TilemapData } from '../physics/tilemap';
import { floodFill, type Cell, type Passable } from '../logic/graph';

export interface LevelEntity {
  /** Entity kind, resolved from the legend (e.g. 'crystal', 'gust'). */
  kind: string;
  /** Tile coordinates. */
  tx: number;
  ty: number;
  /** Center of the tile in design-space px. */
  x: number;
  y: number;
}

/** The authored input: rows + a legend. Everything else is derived. */
export interface LevelSpec {
  name: string;
  /** Tile edge in px (default 32). */
  tileSize?: number;
  /** ASCII rows, top to bottom. Ragged rows are padded with empty on the right. */
  rows: string[];
  /** Non-terrain marker char → entity kind. 'S'/'G' are reserved and need no legend. */
  legend?: Record<string, string>;
}

/** The resolved, validated level — plain JSON, safe to hash/snapshot/diff. */
export interface LevelData extends Required<Omit<LevelSpec, 'legend'>> {
  legend: Record<string, string>;
  cols: number;
  rowCount: number;
  spawn: Cell;
  goal: Cell;
  entities: LevelEntity[];
}

const TERRAIN = new Set(['#', '-', '^', '.', ' ']);
const isSolid = (id: number): boolean => id === TILE.SOLID;
const isHazard = (id: number): boolean => id === TILE.HAZARD;

/** Center of a tile in design-space px. */
export const tileCenter = (tx: number, ty: number, tileSize: number): { x: number; y: number } => ({
  x: (tx + 0.5) * tileSize,
  y: (ty + 0.5) * tileSize,
});

/**
 * Resolve a LevelSpec into a full LevelData: find the spawn/goal markers, extract
 * legend entities, and record dimensions. Throws only on the two structural sins
 * that make a level meaningless (no spawn, no goal); everything else is surfaced
 * as a soft issue by `levelIssues` so an agent can see ALL problems at once.
 */
export function defineLevel(spec: LevelSpec): LevelData {
  const tileSize = spec.tileSize ?? 32;
  const legend = spec.legend ?? {};
  const rows = spec.rows;
  const cols = Math.max(0, ...rows.map((r) => r.length));
  let spawn: Cell | null = null;
  let goal: Cell | null = null;
  const entities: LevelEntity[] = [];
  rows.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++) {
      const ch = row[tx];
      if (ch === 'S') spawn = { x: tx, y: ty };
      else if (ch === 'G') goal = { x: tx, y: ty };
      else if (ch in legend) {
        const c = tileCenter(tx, ty, tileSize);
        entities.push({ kind: legend[ch], tx, ty, x: c.x, y: c.y });
      }
    }
  });
  if (!spawn) throw new Error(`level "${spec.name}": no spawn marker 'S'`);
  if (!goal) throw new Error(`level "${spec.name}": no goal marker 'G'`);
  return { name: spec.name, tileSize, rows, legend, cols, rowCount: rows.length, spawn, goal, entities };
}

/**
 * Validate a level's data. Returns human-readable issues (empty = clean), in the
 * layoutIssues idiom. Catches unknown glyphs, spawn/goal buried in solid, and
 * markers off the map — the authoring mistakes that produce a broken stage.
 */
export function levelIssues(data: LevelData): string[] {
  const issues: string[] = [];
  const map = levelToTilemap(data);
  const at = (c: Cell): number => map.tiles[c.y * map.cols + c.x] ?? TILE.EMPTY;
  data.rows.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++) {
      const ch = row[tx];
      if (ch === 'S' || ch === 'G' || TERRAIN.has(ch) || ch in data.legend) continue;
      issues.push(`unknown glyph '${ch}' at (${tx},${ty}) — add it to the legend or use terrain '#/-/^/.'`);
    }
  });
  if (isSolid(at(data.spawn))) issues.push(`spawn (${data.spawn.x},${data.spawn.y}) is inside a solid tile`);
  if (isSolid(at(data.goal))) issues.push(`goal (${data.goal.x},${data.goal.y}) is inside a solid tile`);
  return [...new Set(issues)];
}

/** Build the collision tilemap from the level's terrain (markers → empty). */
export function levelToTilemap(data: LevelData): TilemapData {
  return tilemapFromAscii(data.rows, data.tileSize);
}

export interface ReachReport {
  ok: boolean;
  /** Labels of things the spawn cannot reach ('goal', or 'entity@tx,ty'). */
  unreachable: string[];
  /** Count of reachable cells/footholds (search size). */
  reached: number;
}

/**
 * Generic connectivity proof: flood-fill non-solid cells from the spawn and check
 * the goal (and every entity) is reachable. Right for top-down / roguelike stages
 * where movement is grid-walking. `passable` defaults to "not a solid tile".
 */
export function levelReachable(data: LevelData, opts: { passable?: Passable; diagonal?: boolean } = {}): ReachReport {
  const map = levelToTilemap(data);
  const tileAt = (x: number, y: number): number => map.tiles[y * map.cols + x] ?? TILE.EMPTY;
  const passable = opts.passable ?? ((x: number, y: number) => !isSolid(tileAt(x, y)));
  const reached = floodFill(data.spawn, passable, { cols: map.cols, rows: map.rows, diagonal: opts.diagonal });
  const seen = new Set(reached.map((c) => `${c.x},${c.y}`));
  const unreachable: string[] = [];
  if (!seen.has(`${data.goal.x},${data.goal.y}`)) unreachable.push('goal');
  for (const e of data.entities) if (!seen.has(`${e.tx},${e.ty}`)) unreachable.push(`entity@${e.tx},${e.ty}`);
  return { ok: unreachable.length === 0, unreachable, reached: reached.length };
}

export interface PlatformerReachOptions {
  /** Max tiles the body can rise in one jump (derive from jumpHeight / tileSize). */
  jumpTiles: number;
  /** Max horizontal tiles cleared in a jump (derive from jumpDistance / tileSize). */
  runTiles: number;
}

/**
 * Platformer reachability: build the graph of FOOTHOLDS (a non-solid, non-hazard
 * cell with solid/one-way ground directly below) and connect two footholds when a
 * jump arc can carry the body between them — up to `jumpTiles` of rise, any drop,
 * within `runTiles` horizontally. Then BFS from the spawn's foothold and confirm
 * the goal's foothold is reachable. This is the honest "can you actually climb it?"
 * proof a flat flood-fill can't give — it respects gravity and jump limits.
 */
export function platformerReachable(data: LevelData, opts: PlatformerReachOptions): ReachReport {
  const map = levelToTilemap(data);
  const { cols, rows } = map;
  const tileAt = (x: number, y: number): number => (x < 0 || y < 0 || x >= cols || y >= rows ? TILE.SOLID : map.tiles[y * cols + x]);
  const grounded = (x: number, y: number): boolean => {
    const below = tileAt(x, y + 1);
    return below === TILE.SOLID || below === TILE.ONEWAY;
  };
  const isFoothold = (x: number, y: number): boolean => !isSolid(tileAt(x, y)) && !isHazard(tileAt(x, y)) && grounded(x, y);

  // Spawn falls to the foothold at or below its marker (you drop onto the ground).
  const snapDown = (c: Cell): Cell | null => {
    for (let y = c.y; y < rows; y++) if (isFoothold(c.x, y)) return { x: c.x, y };
    return null;
  };
  const start = snapDown(data.spawn);
  if (!start) return { ok: false, unreachable: ['goal'], reached: 0 };

  // A jump arc connects footholds within runTiles horizontally and jumpTiles of
  // RISE (any fall is allowed — gravity is free). Same test decides "can I touch
  // a target cell from this foothold", so a floating goal keeps its height cost.
  const reachesArc = (from: Cell, to: Cell): boolean => Math.abs(to.x - from.x) <= opts.runTiles && from.y - to.y <= opts.jumpTiles;

  const footholds: Cell[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (isFoothold(x, y)) footholds.push({ x, y });
  const key = (c: Cell): string => `${c.x},${c.y}`;
  const seen = new Set<string>([key(start)]);
  const frontier: Cell[] = [start];
  while (frontier.length) {
    const cur = frontier.shift()!;
    for (const f of footholds) {
      const k = key(f);
      if (!seen.has(k) && reachesArc(cur, f)) {
        seen.add(k);
        frontier.push(f);
      }
    }
  }
  // Goal is touched if its cell is a reached foothold OR sits within a jump arc of
  // one — a marooned goal five tiles above every foothold is correctly unreachable.
  const reachedCells = [...seen].map((s) => { const [x, y] = s.split(',').map(Number); return { x, y }; });
  const goalTouched = !isSolid(tileAt(data.goal.x, data.goal.y)) && (seen.has(key(data.goal)) || reachedCells.some((f) => reachesArc(f, data.goal)));
  const unreachable: string[] = goalTouched ? [] : ['goal'];
  return { ok: unreachable.length === 0, unreachable, reached: seen.size };
}

export interface LevelChange {
  kind: 'tile' | 'entity+' | 'entity-' | 'spawn' | 'goal';
  detail: string;
}

/**
 * Structural diff between two levels — the primitive that makes data-authored
 * stages iterable: change three tiles, see exactly three changes, not a whole
 * rewritten build() function. Compares terrain cell-by-cell, entities by position,
 * and the spawn/goal markers.
 */
export function diffLevels(a: LevelData, b: LevelData): LevelChange[] {
  const out: LevelChange[] = [];
  const rows = Math.max(a.rowCount, b.rowCount);
  const cols = Math.max(a.cols, b.cols);
  const cellOf = (d: LevelData, x: number, y: number): string => d.rows[y]?.[x] ?? ' ';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ca = cellOf(a, x, y);
      const cb = cellOf(b, x, y);
      if (ca !== cb) out.push({ kind: 'tile', detail: `(${x},${y}) '${ca}' → '${cb}'` });
    }
  }
  const eKey = (e: LevelEntity): string => `${e.kind}@${e.tx},${e.ty}`;
  const aE = new Set(a.entities.map(eKey));
  const bE = new Set(b.entities.map(eKey));
  for (const e of b.entities) if (!aE.has(eKey(e))) out.push({ kind: 'entity+', detail: eKey(e) });
  for (const e of a.entities) if (!bE.has(eKey(e))) out.push({ kind: 'entity-', detail: eKey(e) });
  if (a.spawn.x !== b.spawn.x || a.spawn.y !== b.spawn.y) out.push({ kind: 'spawn', detail: `(${a.spawn.x},${a.spawn.y}) → (${b.spawn.x},${b.spawn.y})` });
  if (a.goal.x !== b.goal.x || a.goal.y !== b.goal.y) out.push({ kind: 'goal', detail: `(${a.goal.x},${a.goal.y}) → (${b.goal.x},${b.goal.y})` });
  return out;
}

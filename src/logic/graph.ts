// Graph search: BFS, flood-fill, connected-components, and grid A*/Dijkstra.
// Pairs with `physics/tilemap.ts` (enemy nav, region/cluster detection, unit
// routing) but works over any adjacency function too.
//
// DETERMINISM: neighbours are visited in a fixed order, the frontier is an
// array (BFS) or a binary heap tie-broken by a monotonic insertion counter
// (A*/Dijkstra), and grids are scanned row-major. `cameFrom`/`cost` maps are
// only ever read by key — never iterated to drive logic — so no Set/Map
// ordering hazard reaches `world.hash()`. No RNG, no wall-clock; fully pure.

import { TILE, tileAt, type TilemapData } from '../physics/tilemap';

// ── generic graph search over an adjacency function ─────────────────

/** Neighbours of a node, in deterministic order. */
export type Neighbours<N> = (node: N) => N[];
/** Stable string identity for a node (visited-set + path keys). */
export type NodeKey<N> = (node: N) => string;

export interface BfsResult<N> {
  /** Nodes in expansion order (breadth-first). */
  order: N[];
  /** key → the node it was first reached from (for path reconstruction). */
  cameFrom: Map<string, N>;
  /** key → steps from the start (start = 0). */
  dist: Map<string, number>;
}

/**
 * Breadth-first search from `start`. Explores the whole reachable component
 * unless `goal` short-circuits it. `maxNodes` caps work on huge/open graphs.
 */
export function bfs<N>(
  start: N,
  neighbours: Neighbours<N>,
  key: NodeKey<N>,
  opts: { goal?: (n: N) => boolean; maxNodes?: number } = {},
): BfsResult<N> {
  const maxNodes = opts.maxNodes ?? 1_000_000;
  const order: N[] = [];
  const cameFrom = new Map<string, N>();
  const dist = new Map<string, number>();
  const startKey = key(start);
  dist.set(startKey, 0);
  let frontier: N[] = [start];
  order.push(start);
  if (opts.goal?.(start)) return { order, cameFrom, dist };

  let expanded = 0;
  while (frontier.length > 0 && expanded < maxNodes) {
    const next: N[] = [];
    for (const node of frontier) {
      const d = dist.get(key(node)) ?? 0;
      for (const nb of neighbours(node)) {
        const k = key(nb);
        if (dist.has(k)) continue;
        dist.set(k, d + 1);
        cameFrom.set(k, node);
        order.push(nb);
        expanded++;
        if (opts.goal?.(nb)) return { order, cameFrom, dist };
        next.push(nb);
      }
    }
    frontier = next;
  }
  return { order, cameFrom, dist };
}

/** Reconstruct the path start→goal from a `cameFrom` map, or [] if unreachable. */
export function reconstructPath<N>(cameFrom: Map<string, N>, key: NodeKey<N>, start: N, goal: N): N[] {
  const path: N[] = [goal];
  let cur = goal;
  const startKey = key(start);
  while (key(cur) !== startKey) {
    const prev = cameFrom.get(key(cur));
    if (prev === undefined) return []; // goal not connected to start
    cur = prev;
    path.push(cur);
  }
  path.reverse();
  return path;
}

// ── weighted search: Dijkstra / A* over an adjacency function ───────

/** A neighbour with the step cost to reach it (must be ≥ 0). */
export interface WeightedEdge<N> {
  node: N;
  cost: number;
}
export type WeightedNeighbours<N> = (node: N) => WeightedEdge<N>[];

/**
 * A* (Dijkstra when `heuristic` is omitted/zero) over a weighted adjacency
 * function. Returns the least-cost path start→goal (inclusive) or null.
 * Tie-broken by insertion order via a monotonic counter → identical path on
 * every engine.
 */
export function astar<N>(
  start: N,
  isGoal: (n: N) => boolean,
  neighbours: WeightedNeighbours<N>,
  key: NodeKey<N>,
  opts: { heuristic?: (n: N) => number; maxNodes?: number } = {},
): { path: N[]; cost: number } | null {
  const h = opts.heuristic ?? (() => 0);
  const maxNodes = opts.maxNodes ?? 1_000_000;
  const cameFrom = new Map<string, N>();
  const gScore = new Map<string, number>();
  const heap = new MinHeap<N>();
  const startKey = key(start);
  gScore.set(startKey, 0);
  heap.push(start, h(start));

  let expanded = 0;
  while (heap.size > 0 && expanded < maxNodes) {
    const { item: cur, priority: f } = heap.pop();
    const ck = key(cur);
    const g = gScore.get(ck) ?? Infinity;
    // Stale heap entry (a cheaper path superseded it): f encodes g+h at push time.
    if (f > g + h(cur) + 1e-9) continue;
    if (isGoal(cur)) return { path: rebuild(cameFrom, key, cur), cost: g };
    expanded++;
    for (const edge of neighbours(cur)) {
      const nk = key(edge.node);
      const tentative = g + edge.cost;
      if (tentative < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, tentative);
        cameFrom.set(nk, cur);
        heap.push(edge.node, tentative + h(edge.node));
      }
    }
  }
  return null;
}

function rebuild<N>(cameFrom: Map<string, N>, key: NodeKey<N>, goal: N): N[] {
  const path: N[] = [goal];
  let cur = goal;
  let prev = cameFrom.get(key(cur));
  while (prev !== undefined) {
    cur = prev;
    path.push(cur);
    prev = cameFrom.get(key(cur));
  }
  path.reverse();
  return path;
}

/**
 * Binary min-heap keyed on a numeric priority, tie-broken by insertion sequence
 * so equal-priority items pop in push order — the source of A*'s determinism.
 */
class MinHeap<T> {
  private items: T[] = [];
  private prio: number[] = [];
  private seq: number[] = [];
  private counter = 0;

  get size(): number {
    return this.items.length;
  }

  push(item: T, priority: number): void {
    this.items.push(item);
    this.prio.push(priority);
    this.seq.push(this.counter++);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): { item: T; priority: number } {
    const item = this.items[0];
    const priority = this.prio[0];
    const last = this.items.length - 1;
    this.swap(0, last);
    this.items.pop();
    this.prio.pop();
    this.seq.pop();
    if (this.items.length > 0) this.bubbleDown(0);
    return { item, priority };
  }

  /** true if a is strictly higher priority (lower value, then earlier seq). */
  private less(a: number, b: number): boolean {
    return this.prio[a] < this.prio[b] || (this.prio[a] === this.prio[b] && this.seq[a] < this.seq[b]);
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(i, parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.items.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < n && this.less(l, smallest)) smallest = l;
      if (r < n && this.less(r, smallest)) smallest = r;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(a: number, b: number): void {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.prio[a], this.prio[b]] = [this.prio[b], this.prio[a]];
    [this.seq[a], this.seq[b]] = [this.seq[b], this.seq[a]];
  }
}

// ── grid conveniences (row-major, tilemap-friendly) ─────────────────

export interface Cell {
  x: number;
  y: number;
}

/** 4-neighbour offsets (N, E, S, W), in a fixed order. */
export const NEIGHBORS_4: readonly Cell[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];
/** 8-neighbour offsets (orthogonals then diagonals), in a fixed order. */
export const NEIGHBORS_8: readonly Cell[] = [
  ...NEIGHBORS_4,
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

/** Is a cell walkable? Called for in-bounds cells only. */
export type Passable = (x: number, y: number) => boolean;

const cellKey = (c: Cell): string => `${c.x},${c.y}`;

function gridNeighbours(passable: Passable, cols: number, rows: number, diagonal: boolean): Neighbours<Cell> {
  const offsets = diagonal ? NEIGHBORS_8 : NEIGHBORS_4;
  return (c: Cell) => {
    const out: Cell[] = [];
    for (const o of offsets) {
      const x = c.x + o.x;
      const y = c.y + o.y;
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      if (!passable(x, y)) continue;
      out.push({ x, y });
    }
    return out;
  };
}

/**
 * Flood-fill from a seed cell over `passable`, returning every reachable cell
 * in breadth-first (deterministic) order. The classic bucket-fill / region-grab.
 */
export function floodFill(
  start: Cell,
  passable: Passable,
  opts: { cols: number; rows: number; diagonal?: boolean },
): Cell[] {
  if (!passable(start.x, start.y)) return [];
  const nb = gridNeighbours(passable, opts.cols, opts.rows, opts.diagonal ?? false);
  return bfs(start, nb, cellKey).order;
}

export interface Components {
  /** Row-major label per cell: -1 for impassable, else a component id ≥ 0. */
  labels: number[];
  /** Cells of each component, indexed by id, each in row-major order. */
  cells: Cell[][];
}

/**
 * Label connected regions of passable cells. Scans row-major and flood-fills
 * each unlabeled passable cell, so component ids are assigned deterministically
 * (top-left region first). Region/cluster detection for match-3, territory, etc.
 */
export function connectedComponents(cols: number, rows: number, passable: Passable, diagonal = false): Components {
  const labels = new Array<number>(cols * rows).fill(-1);
  const cells: Cell[][] = [];
  const offsets = diagonal ? NEIGHBORS_8 : NEIGHBORS_4;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (labels[y * cols + x] !== -1 || !passable(x, y)) continue;
      const id = cells.length;
      const region: Cell[] = [];
      // Iterative BFS with an in-place label as the visited marker.
      let frontier: Cell[] = [{ x, y }];
      labels[y * cols + x] = id;
      while (frontier.length > 0) {
        const next: Cell[] = [];
        for (const c of frontier) {
          region.push(c);
          for (const o of offsets) {
            const nx = c.x + o.x;
            const ny = c.y + o.y;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const idx = ny * cols + nx;
            if (labels[idx] !== -1 || !passable(nx, ny)) continue;
            labels[idx] = id;
            next.push({ x: nx, y: ny });
          }
        }
        frontier = next;
      }
      cells.push(region);
    }
  }
  return { labels, cells };
}

/**
 * Grid A* / Dijkstra. Returns the least-cost cell path start→goal (inclusive)
 * or null if unreachable. Default step cost is 1 (orthogonal) / √2 (diagonal);
 * pass `cost(x,y)` to weight terrain. Heuristic defaults to Manhattan (4-dir)
 * or octile (8-dir) — admissible, integer-stable, so paths reproduce exactly.
 */
export function astarGrid(
  start: Cell,
  goal: Cell,
  passable: Passable,
  opts: { cols: number; rows: number; diagonal?: boolean; cost?: (x: number, y: number) => number; maxNodes?: number },
): Cell[] | null {
  const diagonal = opts.diagonal ?? false;
  const offsets = diagonal ? NEIGHBORS_8 : NEIGHBORS_4;
  const stepCost = opts.cost ?? (() => 1);
  const SQRT2 = 1.4142135623730951;

  const neighbours: WeightedNeighbours<Cell> = (c) => {
    const out: WeightedEdge<Cell>[] = [];
    for (const o of offsets) {
      const x = c.x + o.x;
      const y = c.y + o.y;
      if (x < 0 || y < 0 || x >= opts.cols || y >= opts.rows) continue;
      if (!passable(x, y)) continue;
      const diag = o.x !== 0 && o.y !== 0;
      out.push({ node: { x, y }, cost: stepCost(x, y) * (diag ? SQRT2 : 1) });
    }
    return out;
  };

  const heuristic = (c: Cell): number => {
    const dx = Math.abs(c.x - goal.x);
    const dy = Math.abs(c.y - goal.y);
    if (!diagonal) return dx + dy; // Manhattan
    const lo = Math.min(dx, dy);
    return dx + dy - (2 - SQRT2) * lo; // octile
  };

  if (!passable(goal.x, goal.y)) return null;
  const result = astar(start, (c) => c.x === goal.x && c.y === goal.y, neighbours, cellKey, {
    heuristic,
    maxNodes: opts.maxNodes,
  });
  return result ? result.path : null;
}

/** Build a `Passable` from a tilemap: everything but SOLID/out-of-bounds walks. */
export function passableFromTilemap(map: TilemapData): Passable {
  return (x, y) => tileAt(map, x, y) !== TILE.SOLID;
}

// World-graph progression — the verifiable spine of a metroidvania. A world is
// REGIONS connected by ABILITY-GATED edges, with PICKUPS that grant abilities.
// The insight: progression IS a Puzzle. State = (region, pickups taken); a move
// is "traverse a gated edge" or "collect a pickup here". So the engine's BFS
// `solve()` proves a completion order EXISTS (no circular gating), and — because
// abilities are monotonic (never lost) — enumerating the reachable state graph
// proves NO SOFTLOCK (no reachable state from which the goal becomes unreachable,
// the only remaining hazard once one-way drops are in play).
//
// Pure data + pure functions, no engine/scene imports beyond the solver contract.
// Deterministic: every iteration is over sorted arrays / insertion order.

import { solve, type Puzzle, type SolveResult } from '../verify/solver';

/** A place in the world (a room or a named area). */
export interface WorldRegion {
  id: string;
  name?: string;
  biome?: string;
}

/** A traversal between two regions, gated behind abilities. Bidirectional unless `oneWay`. */
export interface WorldEdge {
  from: string;
  to: string;
  /** Ability ids ALL required to pass. Empty/undefined = open. */
  requires?: string[];
  /** If true, only `from → to` (a drop you can't climb back up). */
  oneWay?: boolean;
}

/** A collectible that grants an ability, located in a region. */
export interface WorldPickup {
  id: string;
  region: string;
  /** Ability id this pickup grants. */
  grants: string;
}

/** The whole world as pure data. */
export interface WorldGraphDef {
  regions: WorldRegion[];
  edges: WorldEdge[];
  pickups: WorldPickup[];
  /** Starting region id. */
  start: string;
  /** Goal region id (the "heart" — where a minimal completion ends). */
  goal: string;
}

// ── progression as a Puzzle ─────────────────────────────────────────

/** A progression state: where you are + which pickups you've taken (sorted). */
export interface ProgressState {
  region: string;
  taken: string[];
}

export type ProgressMove =
  | { kind: 'move'; to: string }
  | { kind: 'take'; pickup: string };

/** 'complete' = reach the goal; 'full' = reach the goal with 100% pickups. */
export type CompletionMode = 'complete' | 'full';

/** Ability ids granted by a set of taken pickup ids. */
export function abilitiesOf(world: WorldGraphDef, taken: readonly string[]): Set<string> {
  const byId = new Map(world.pickups.map((p) => [p.id, p.grants]));
  const out = new Set<string>();
  for (const t of taken) {
    const g = byId.get(t);
    if (g) out.add(g);
  }
  return out;
}

function canTraverse(edge: WorldEdge, abilities: Set<string>): boolean {
  return (edge.requires ?? []).every((a) => abilities.has(a));
}

/** Regions reachable from `region` by one edge, given the current abilities. */
function stepRegions(world: WorldGraphDef, region: string, abilities: Set<string>): string[] {
  const out: string[] = [];
  for (const e of world.edges) {
    if (e.from === region && canTraverse(e, abilities)) out.push(e.to);
    else if (!e.oneWay && e.to === region && canTraverse(e, abilities)) out.push(e.from);
  }
  return out;
}

/** Build the progression Puzzle for `solve()` to prove. */
export function progressionPuzzle(
  world: WorldGraphDef,
  mode: CompletionMode = 'complete',
): Puzzle<ProgressState, ProgressMove> {
  const pickupsHere = (region: string): WorldPickup[] => world.pickups.filter((p) => p.region === region);
  const totalPickups = world.pickups.length;

  return {
    initial: () => ({ region: world.start, taken: [] }),
    moves: (s) => {
      const abilities = abilitiesOf(world, s.taken);
      const out: ProgressMove[] = [];
      // Collect any uncollected pickup in this region first (stable order).
      for (const p of pickupsHere(s.region)) {
        if (!s.taken.includes(p.id)) out.push({ kind: 'take', pickup: p.id });
      }
      // Then traversals (deterministic: edge order → dedup).
      const seen = new Set<string>();
      for (const to of stepRegions(world, s.region, abilities)) {
        if (!seen.has(to)) {
          seen.add(to);
          out.push({ kind: 'move', to });
        }
      }
      return out;
    },
    apply: (s, m) => {
      if (m.kind === 'move') return { region: m.to, taken: s.taken };
      const taken = [...s.taken, m.pickup].sort();
      return { region: s.region, taken };
    },
    isWin: (s) =>
      s.region === world.goal && (mode === 'complete' || s.taken.length === totalPickups),
    key: (s) => `${s.region}|${s.taken.join(',')}`,
  };
}

const SOLVE_OPTS = { maxDepth: 2000, nodeCap: 5_000_000 };

/** Prove a minimal completion (reach the goal) exists. */
export function proveCompletable(world: WorldGraphDef): SolveResult<ProgressMove> {
  return solve(progressionPuzzle(world, 'complete'), SOLVE_OPTS);
}

/** Prove a 100% completion (all pickups + reach the goal) exists. */
export function proveFullCompletion(world: WorldGraphDef): SolveResult<ProgressMove> {
  return solve(progressionPuzzle(world, 'full'), SOLVE_OPTS);
}

// ── reachability + softlock analysis ────────────────────────────────

/** Regions reachable from the start with a FIXED ability set (no collecting). */
export function reachableRegions(world: WorldGraphDef, abilities: Iterable<string>): string[] {
  const abil = new Set(abilities);
  const seen = new Set<string>([world.start]);
  const frontier = [world.start];
  while (frontier.length) {
    const r = frontier.shift()!;
    for (const to of stepRegions(world, r, abil)) {
      if (!seen.has(to)) {
        seen.add(to);
        frontier.push(to);
      }
    }
  }
  return [...seen];
}

export interface SoftlockReport {
  ok: boolean;
  /** Reachable states (as keys) from which the goal can never be reached. */
  deadEnds: string[];
  /** How many progression states are reachable from the start (a size proxy). */
  statesExplored: number;
}

/**
 * Prove no softlock: enumerate every reachable progression state and confirm the
 * goal stays reachable from each. Only one-way edges can create a dead end;
 * with all-bidirectional edges a completable world is softlock-free by
 * construction, but this checks it directly regardless.
 */
export function findSoftlocks(world: WorldGraphDef, mode: CompletionMode = 'complete'): SoftlockReport {
  const puzzle = progressionPuzzle(world, mode);
  const start = puzzle.initial();
  const startKey = puzzle.key(start);

  // Forward BFS: enumerate reachable states + their successor edges.
  const states = new Map<string, ProgressState>([[startKey, start]]);
  const succ = new Map<string, string[]>();
  const winKeys = new Set<string>();
  const queue = [start];
  if (puzzle.isWin(start)) winKeys.add(startKey);
  while (queue.length) {
    const s = queue.shift()!;
    const sk = puzzle.key(s);
    const outs: string[] = [];
    for (const mv of puzzle.moves(s)) {
      const ns = puzzle.apply(s, mv);
      const nk = puzzle.key(ns);
      outs.push(nk);
      if (!states.has(nk)) {
        states.set(nk, ns);
        if (puzzle.isWin(ns)) winKeys.add(nk);
        queue.push(ns);
      }
    }
    succ.set(sk, outs);
  }

  // Backward reachability from winning states over the successor edges.
  const pred = new Map<string, string[]>();
  for (const [from, tos] of succ) {
    for (const to of tos) {
      (pred.get(to) ?? pred.set(to, []).get(to)!).push(from);
    }
  }
  const canWin = new Set<string>(winKeys);
  const back = [...winKeys];
  while (back.length) {
    const k = back.shift()!;
    for (const p of pred.get(k) ?? []) {
      if (!canWin.has(p)) {
        canWin.add(p);
        back.push(p);
      }
    }
  }

  const deadEnds = [...states.keys()].filter((k) => !canWin.has(k)).sort();
  return { ok: deadEnds.length === 0, deadEnds, statesExplored: states.size };
}

// ── authoring hygiene ───────────────────────────────────────────────

/** Structural problems a solver can't express (dangling ids, dupes, isolation). */
export function validateWorld(world: WorldGraphDef): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const r of world.regions) {
    if (ids.has(r.id)) issues.push(`duplicate region id "${r.id}"`);
    ids.add(r.id);
  }
  const known = (id: string): boolean => ids.has(id);
  if (!known(world.start)) issues.push(`start region "${world.start}" is not defined`);
  if (!known(world.goal)) issues.push(`goal region "${world.goal}" is not defined`);
  for (const e of world.edges) {
    if (!known(e.from)) issues.push(`edge references unknown region "${e.from}"`);
    if (!known(e.to)) issues.push(`edge references unknown region "${e.to}"`);
  }
  const pids = new Set<string>();
  for (const p of world.pickups) {
    if (pids.has(p.id)) issues.push(`duplicate pickup id "${p.id}"`);
    pids.add(p.id);
    if (!known(p.region)) issues.push(`pickup "${p.id}" is in unknown region "${p.region}"`);
  }
  // Every region should be reachable once you hold every ability.
  const allAbilities = world.pickups.map((p) => p.grants);
  const reachable = new Set(reachableRegions(world, allAbilities));
  for (const r of world.regions) {
    if (!reachable.has(r.id)) issues.push(`region "${r.id}" is unreachable even with every ability`);
  }
  return issues;
}

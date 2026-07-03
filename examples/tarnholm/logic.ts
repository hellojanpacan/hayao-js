// Tarnholm placement sim — pure module. Islanders' one idea: every building
// scores by what it stands beside. A fixed queue of buildings, a procgen
// island, and a score target — placement order and adjacency ARE the game.

import type { Rng } from '@hayao';

export const GW = 14;
export const GH = 10;
export const TARGET = 150;

export type Terrain = 'water' | 'grass' | 'forest';
export type BuildingKind = 'hut' | 'farm' | 'sawmill' | 'dock' | 'temple';

export const BUILDINGS: Record<BuildingKind, { name: string; blurb: string }> = {
  hut: { name: 'Hut', blurb: '+3 per adjacent hut' },
  farm: { name: 'Farm', blurb: '+2 per adjacent open grass' },
  sawmill: { name: 'Sawmill', blurb: '+3 per adjacent forest' },
  dock: { name: 'Dock', blurb: '+4 per adjacent water' },
  temple: { name: 'Temple', blurb: '+4 per adjacent hut, -3 per adjacent industry' },
};

/** The build queue: enough synergy potential to beat TARGET, if placed well. */
export const QUEUE: BuildingKind[] = ['hut', 'hut', 'farm', 'hut', 'dock', 'sawmill', 'farm', 'hut', 'temple', 'dock', 'sawmill', 'hut', 'farm', 'temple', 'hut', 'dock', 'sawmill', 'temple'];

export interface ThState {
  terrain: Terrain[];
  built: (BuildingKind | null)[];
  queueIdx: number;
  score: number;
  cursor: { x: number; y: number };
  lastGain: number;
  won: boolean;
  done: boolean;
  [key: string]: unknown;
}

export const tidx = (x: number, y: number): number => y * GW + x;

/** Procgen island: water rim + blobs, forest patches, grassy heart. */
export function genIsland(rng: Rng): Terrain[] {
  for (let attempt = 0; attempt < 60; attempt++) {
    const t: Terrain[] = new Array(GW * GH).fill('grass');
    for (let y = 0; y < GH; y++)
      for (let x = 0; x < GW; x++) {
        const edge = Math.min(x, y, GW - 1 - x, GH - 1 - y);
        const w = edge === 0 ? 0.85 : edge === 1 ? 0.3 : 0.05;
        if (rng.chance(w)) t[tidx(x, y)] = 'water';
      }
    // Forest patches on land.
    for (let p = 0; p < 5; p++) {
      const cx = 2 + rng.int(GW - 4);
      const cy = 2 + rng.int(GH - 4);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const i = tidx(cx + dx, cy + dy);
          if (t[i] === 'grass' && rng.chance(0.7)) t[i] = 'forest';
        }
    }
    const buildable = t.filter((c) => c === 'grass').length;
    if (buildable >= QUEUE.length + 10) return t; // room to breathe
  }
  throw new Error('tarnholm: island generation failed');
}

export function initialTh(rng: Rng): ThState {
  return { terrain: genIsland(rng), built: new Array(GW * GH).fill(null), queueIdx: 0, score: 0, cursor: { x: 7, y: 5 }, lastGain: 0, won: false, done: false };
}

export const currentBuilding = (s: ThState): BuildingKind | null => (s.queueIdx < QUEUE.length ? QUEUE[s.queueIdx] : null);

const DIRS8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] as const;

/** The whole game: what would this building score here? (-1 = illegal spot) */
export function placementScore(s: ThState, kind: BuildingKind, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= GW || y >= GH) return -1;
  const i = tidx(x, y);
  if (s.terrain[i] !== 'grass' || s.built[i]) return -1;
  let score = 1; // every roof is worth something
  for (const [dx, dy] of DIRS8) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
    const n = tidx(nx, ny);
    const terrain = s.terrain[n];
    const built = s.built[n];
    switch (kind) {
      case 'hut':
        if (built === 'hut') score += 3;
        break;
      case 'farm':
        if (terrain === 'grass' && !built) score += 2;
        break;
      case 'sawmill':
        if (terrain === 'forest') score += 3;
        break;
      case 'dock':
        if (terrain === 'water') score += 4;
        break;
      case 'temple':
        if (built === 'hut') score += 4;
        if (built === 'sawmill' || built === 'dock') score -= 3;
        break;
    }
  }
  return Math.max(0, score);
}

export interface ThEvents {
  placed: BuildingKind | null;
  gain: number;
  won: boolean;
  done: boolean;
}

export function place(s: ThState, x: number, y: number): ThEvents {
  const ev: ThEvents = { placed: null, gain: 0, won: false, done: false };
  const kind = currentBuilding(s);
  if (!kind || s.won || s.done) return ev;
  const gain = placementScore(s, kind, x, y);
  if (gain < 0) return ev;
  s.built[tidx(x, y)] = kind;
  s.score += gain;
  s.lastGain = gain;
  s.queueIdx++;
  ev.placed = kind;
  ev.gain = gain;
  if (s.score >= TARGET) {
    s.won = true;
    ev.won = true;
  } else if (!currentBuilding(s)) {
    s.done = true;
    ev.done = true;
  }
  return ev;
}

/** Greedy placer: the best-scoring legal cell for the current building. */
export function bestPlacement(s: ThState): { x: number; y: number; gain: number } | null {
  const kind = currentBuilding(s);
  if (!kind) return null;
  let best: { x: number; y: number; gain: number } | null = null;
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      const g = placementScore(s, kind, x, y);
      if (g >= 0 && (!best || g > best.gain)) best = { x, y, gain: g };
    }
  return best;
}

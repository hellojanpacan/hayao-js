// Rootward tower-defense sim — pure module. A waypoint path, three tower
// types forming a rock-paper-scissors counter system, scripted wave
// compositions, and a bounty economy. The genre's truth is wave balance and
// counter-play, both proven in verify.ts.

import { dhypot } from '@hayao';
export interface Vec {
  x: number;
  y: number;
}

/** The lane: an S-curve from the west gate to the east warren. */
export const PATH: Vec[] = [
  { x: -20, y: 150 },
  { x: 1000, y: 150 },
  { x: 1000, y: 380 },
  { x: 280, y: 380 },
  { x: 280, y: 600 },
  { x: 1300, y: 600 },
];

/** Cumulative distance to each waypoint. */
export const PATH_LEN: number[] = PATH.reduce<number[]>((acc, p, i) => {
  if (i === 0) return [0];
  const q = PATH[i - 1];
  acc.push(acc[i - 1] + dhypot(p.x - q.x, p.y - q.y));
  return acc;
}, []);
export const TOTAL_LEN = PATH_LEN[PATH_LEN.length - 1];

export function pointAt(dist: number): Vec {
  if (dist <= 0) return PATH[0];
  for (let i = 1; i < PATH.length; i++) {
    if (dist <= PATH_LEN[i]) {
      const t = (dist - PATH_LEN[i - 1]) / (PATH_LEN[i] - PATH_LEN[i - 1]);
      return { x: PATH[i - 1].x + (PATH[i].x - PATH[i - 1].x) * t, y: PATH[i - 1].y + (PATH[i].y - PATH[i - 1].y) * t };
    }
  }
  return PATH[PATH.length - 1];
}

/** Build pads flanking the lane. */
export const PADS: Vec[] = [
  { x: 200, y: 60 }, { x: 520, y: 60 }, { x: 840, y: 60 },
  { x: 320, y: 260 }, { x: 640, y: 260 }, { x: 900, y: 265 },
  { x: 1090, y: 265 }, { x: 170, y: 480 }, { x: 400, y: 490 },
  { x: 640, y: 480 }, { x: 900, y: 490 }, { x: 1120, y: 480 },
];

export type TowerKind = 'arrow' | 'frost' | 'cannon';
export const TOWERS: Record<TowerKind, { cost: number; range: number; rate: number; dmg: number; splash?: number; slow?: number }> = {
  arrow: { cost: 100, range: 195, rate: 2.4, dmg: 6 },
  frost: { cost: 120, range: 175, rate: 1.0, dmg: 1, slow: 0.45 },
  cannon: { cost: 190, range: 185, rate: 0.85, dmg: 26, splash: 70 },
};

export type EnemyKind = 'runner' | 'grunt' | 'tank';
export const ENEMIES: Record<EnemyKind, { hp: number; speed: number; bounty: number; /** damage multiplier vs arrow shots */ arrowResist?: number }> = {
  runner: { hp: 18, speed: 130, bounty: 6 },
  grunt: { hp: 55, speed: 78, bounty: 10 },
  tank: { hp: 500, speed: 46, bounty: 40, arrowResist: 0.12 },
};

/** Wave = groups of (kind, count, spacing s). */
export interface WaveGroup {
  kind: EnemyKind;
  count: number;
  spacing: number;
}
export const WAVES: WaveGroup[][] = [
  [{ kind: 'grunt', count: 6, spacing: 1.1 }],
  [{ kind: 'runner', count: 12, spacing: 0.7 }],
  [{ kind: 'grunt', count: 8, spacing: 0.9 }, { kind: 'runner', count: 6, spacing: 0.6 }],
  [{ kind: 'tank', count: 1, spacing: 3.0 }],
  [{ kind: 'runner', count: 16, spacing: 0.5 }],
  [{ kind: 'grunt', count: 10, spacing: 0.8 }, { kind: 'tank', count: 1, spacing: 2.6 }],
  [{ kind: 'runner', count: 12, spacing: 0.45 }, { kind: 'grunt', count: 8, spacing: 0.8 }],
  [{ kind: 'tank', count: 3, spacing: 2.2 }],
  [{ kind: 'runner', count: 16, spacing: 0.4 }, { kind: 'tank', count: 2, spacing: 2.4 }],
  [{ kind: 'grunt', count: 14, spacing: 0.6 }, { kind: 'tank', count: 3, spacing: 2.0 }, { kind: 'runner', count: 10, spacing: 0.4 }],
];

export const START_GOLD = 330;
export const LIVES = 10;
export const WAVE_GAP = 4; // seconds between waves (auto)

export interface Foe {
  kind: EnemyKind;
  dist: number;
  hp: number;
  slowT: number;
}

export interface Tower {
  pad: number;
  kind: TowerKind;
  cd: number;
}

export interface RwState {
  gold: number;
  lives: number;
  wave: number; // current wave index (or -1 before first)
  waveT: number; // time since wave start
  betweenT: number; // countdown to next wave when field is clear
  spawnQueue: { kind: EnemyKind; at: number }[];
  foes: Foe[];
  towers: Tower[];
  cursor: number; // selected pad
  leaked: number;
  kills: number;
  won: boolean;
  dead: boolean;
  [key: string]: unknown;
}

export function initialRw(): RwState {
  return { gold: START_GOLD, lives: LIVES, wave: -1, waveT: 0, betweenT: 1.5, spawnQueue: [], foes: [], towers: [], cursor: 0, leaked: 0, kills: 0, won: false, dead: false };
}

export interface RwInput {
  cursorMove: number; // -1/+1 pad cursor (justPressed)
  build: TowerKind | null;
  startWave: boolean;
}

export interface RwEvents {
  built: boolean;
  leak: boolean;
  kill: boolean;
  waveStart: boolean;
  won: boolean;
  died: boolean;
}

function queueWave(s: RwState, w: number): void {
  s.wave = w;
  s.waveT = 0;
  let t = 0;
  s.spawnQueue = [];
  for (const g of WAVES[w]) {
    for (let i = 0; i < g.count; i++) {
      s.spawnQueue.push({ kind: g.kind, at: t });
      t += g.spacing;
    }
    t += 1.2;
  }
}

export function stepRw(s: RwState, input: RwInput, dt: number): RwEvents {
  const ev: RwEvents = { built: false, leak: false, kill: false, waveStart: false, won: false, died: false };
  if (s.won || s.dead) return ev;

  // ── Build controls ──
  if (input.cursorMove !== 0) s.cursor = (s.cursor + input.cursorMove + PADS.length) % PADS.length;
  if (input.build) {
    const def = TOWERS[input.build];
    const free = !s.towers.some((t) => t.pad === s.cursor);
    if (free && s.gold >= def.cost) {
      s.gold -= def.cost;
      s.towers.push({ pad: s.cursor, kind: input.build, cd: 0 });
      ev.built = true;
    }
  }

  // ── Wave scheduling ──
  const fieldClear = s.foes.length === 0 && s.spawnQueue.length === 0;
  if (fieldClear) {
    if (s.wave >= WAVES.length - 1 && s.wave >= 0) {
      s.won = true;
      ev.won = true;
      return ev;
    }
    s.betweenT -= dt;
    if (input.startWave || s.betweenT <= 0) {
      queueWave(s, s.wave + 1);
      s.betweenT = WAVE_GAP;
      ev.waveStart = true;
    }
  } else {
    s.waveT += dt;
    // Spawns due.
    while (s.spawnQueue.length && s.spawnQueue[0].at <= s.waveT) {
      const q = s.spawnQueue.shift()!;
      s.foes.push({ kind: q.kind, dist: 0, hp: ENEMIES[q.kind].hp, slowT: 0 });
    }
  }

  // ── Foes march ──
  let fw = 0;
  for (const f of s.foes) {
    f.slowT = Math.max(0, f.slowT - dt);
    const slow = f.slowT > 0 ? 1 - 0.45 : 1;
    f.dist += ENEMIES[f.kind].speed * slow * dt;
    if (f.dist >= TOTAL_LEN) {
      s.lives--;
      s.leaked++;
      ev.leak = true;
      if (s.lives <= 0) {
        s.dead = true;
        ev.died = true;
        return ev;
      }
      continue;
    }
    s.foes[fw++] = f;
  }
  s.foes.length = fw;

  // ── Towers fire (first-in-path targeting) ──
  for (const t of s.towers) {
    t.cd -= dt;
    if (t.cd > 0) continue;
    const def = TOWERS[t.kind];
    const pad = PADS[t.pad];
    let target: Foe | null = null;
    for (const f of s.foes) {
      const p = pointAt(f.dist);
      if ((p.x - pad.x) * (p.x - pad.x) + (p.y - pad.y) * (p.y - pad.y) > def.range * def.range) continue;
      if (!target || f.dist > target.dist) target = f;
    }
    if (!target) continue;
    t.cd = 1 / def.rate;
    if (t.kind === 'frost') {
      // Aura pulse: slow everything in range.
      for (const f of s.foes) {
        const p = pointAt(f.dist);
        if ((p.x - pad.x) * (p.x - pad.x) + (p.y - pad.y) * (p.y - pad.y) <= def.range * def.range) {
          f.slowT = 1.2;
          f.hp -= def.dmg;
        }
      }
    } else if (t.kind === 'cannon') {
      const tp = pointAt(target.dist);
      for (const f of s.foes) {
        const p = pointAt(f.dist);
        if ((p.x - tp.x) * (p.x - tp.x) + (p.y - tp.y) * (p.y - tp.y) <= def.splash! * def.splash!) f.hp -= def.dmg;
      }
    } else {
      const resist = ENEMIES[target.kind].arrowResist ?? 1;
      target.hp -= def.dmg * (target.kind === 'tank' ? resist : 1);
    }
  }

  // ── Deaths + bounty ──
  let kw = 0;
  for (const f of s.foes) {
    if (f.hp <= 0) {
      s.gold += ENEMIES[f.kind].bounty;
      s.kills++;
      ev.kill = true;
      continue;
    }
    s.foes[kw++] = f;
  }
  s.foes.length = kw;
  return ev;
}

/** Total hp of a wave (difficulty telemetry). */
export const waveHp = (w: WaveGroup[]): number => w.reduce((sum, g) => sum + ENEMIES[g.kind].hp * g.count, 0);

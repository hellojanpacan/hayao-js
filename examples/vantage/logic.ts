// Vantage tactics sim — pure module. Into the Breach's covenant: perfect
// information. Bugs telegraph directional attacks a full turn ahead; player
// mechs move + act to kill, block, or PUSH bugs so the telegraphed blow lands
// somewhere harmless. Protect the greenhouses for five turns.

export const GRID = 8;

export type MechKind = 'bruiser' | 'artillery' | 'ranger';
export const MECHS: Record<MechKind, { hp: number; move: number; dmg: number; ranged: boolean }> = {
  bruiser: { hp: 6, move: 3, dmg: 2, ranged: false },
  artillery: { hp: 4, move: 2, dmg: 1, ranged: true },
  ranger: { hp: 5, move: 4, dmg: 2, ranged: false },
};

export interface Mech {
  kind: MechKind;
  x: number;
  y: number;
  hp: number;
  moved: boolean;
  acted: boolean;
}

export interface Bug {
  x: number;
  y: number;
  hp: number;
  /** Telegraphed attack direction (unit step) or null while it repositions. */
  dir: { x: number; y: number } | null;
}

export interface Building {
  x: number;
  y: number;
  hp: number;
}

export interface VtState {
  turn: number; // 1..TURNS
  phase: 'player' | 'resolved'; // resolved = between turns (view pause)
  mechs: Mech[];
  bugs: Bug[];
  buildings: Building[];
  selected: number;
  cursor: { x: number; y: number };
  /** Move mode when the selected mech hasn't moved; act mode otherwise. */
  spawnScript: { turn: number; x: number; y: number }[];
  won: boolean;
  dead: boolean;
  perfect: boolean;
  [key: string]: unknown;
}

export const TURNS = 5;
export const BUG_TUNE = { hp: 3, dmg: 2 };

/** Scenario: greenhouses north, mechs mid, bugs boil up from the south rim. */
export function initialVt(): VtState {
  return {
    turn: 1,
    phase: 'player',
    mechs: [
      { kind: 'bruiser', x: 2, y: 4, hp: MECHS.bruiser.hp, moved: false, acted: false },
      { kind: 'artillery', x: 4, y: 5, hp: MECHS.artillery.hp, moved: false, acted: false },
      { kind: 'ranger', x: 5, y: 4, hp: MECHS.ranger.hp, moved: false, acted: false },
    ],
    bugs: [
      { x: 2, y: 6, hp: BUG_TUNE.hp, dir: { x: 0, y: -1 } },
      { x: 5, y: 7, hp: BUG_TUNE.hp, dir: null },
    ],
    buildings: [
      { x: 1, y: 0, hp: 2 },
      { x: 4, y: 0, hp: 2 },
      { x: 6, y: 0, hp: 2 },
    ],
    selected: 0,
    cursor: { x: 2, y: 4 },
    spawnScript: [
      { turn: 2, x: 1, y: 7 },
      { turn: 2, x: 6, y: 7 },
      { turn: 3, x: 3, y: 7 },
      { turn: 4, x: 5, y: 7 },
    ],
    won: false,
    dead: false,
    perfect: false,
  };
}

const inGrid = (x: number, y: number) => x >= 0 && y >= 0 && x < GRID && y < GRID;

export function occupant(s: VtState, x: number, y: number): { kind: 'mech' | 'bug' | 'building'; i: number } | null {
  const mi = s.mechs.findIndex((m) => m.hp > 0 && m.x === x && m.y === y);
  if (mi >= 0) return { kind: 'mech', i: mi };
  const bi = s.bugs.findIndex((b) => b.hp > 0 && b.x === x && b.y === y);
  if (bi >= 0) return { kind: 'bug', i: bi };
  const gi = s.buildings.findIndex((g) => g.hp > 0 && g.x === x && g.y === y);
  if (gi >= 0) return { kind: 'building', i: gi };
  return null;
}

/**
 * Push whatever stands at (x,y) one tile along (dx,dy). Blocked pushes bump:
 * +1 damage to the pushee and to the blocker if it's a unit.
 */
export function push(s: VtState, x: number, y: number, dx: number, dy: number): void {
  const who = occupant(s, x, y);
  if (!who || who.kind === 'building') return;
  const nx = x + dx;
  const ny = y + dy;
  const unit = who.kind === 'mech' ? s.mechs[who.i] : s.bugs[who.i];
  if (!inGrid(nx, ny)) {
    unit.hp -= 1; // slammed into the rim
    return;
  }
  const blocker = occupant(s, nx, ny);
  if (blocker) {
    unit.hp -= 1;
    if (blocker.kind === 'mech') s.mechs[blocker.i].hp -= 1;
    else if (blocker.kind === 'bug') s.bugs[blocker.i].hp -= 1;
    else s.buildings[blocker.i].hp -= 1;
    return;
  }
  unit.x = nx;
  unit.y = ny;
}

/** BFS movement range (blocked by any occupant). */
export function canMoveTo(s: VtState, mech: Mech, tx: number, ty: number): boolean {
  if (!inGrid(tx, ty) || occupant(s, tx, ty)) return false;
  const range = MECHS[mech.kind].move;
  const seen = new Set<number>([mech.y * GRID + mech.x]);
  let frontier = [[mech.x, mech.y]];
  for (let d = 0; d < range; d++) {
    const next: number[][] = [];
    for (const [cx, cy] of frontier)
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + ox;
        const ny = cy + oy;
        const key = ny * GRID + nx;
        if (!inGrid(nx, ny) || seen.has(key) || occupant(s, nx, ny)) continue;
        if (nx === tx && ny === ty) return true;
        seen.add(key);
        next.push([nx, ny]);
      }
    frontier = next;
  }
  return false;
}

export interface VtEvents {
  moved: boolean;
  attacked: boolean;
  bugKilled: boolean;
  buildingHit: boolean;
  turnResolved: boolean;
  won: boolean;
  died: boolean;
}

export type VtCmd =
  | { kind: 'select'; mech: number }
  | { kind: 'cursor'; x: number; y: number }
  | { kind: 'move' } // selected mech → cursor
  | { kind: 'attack' } // selected mech attacks toward/at cursor
  | { kind: 'endTurn' };

export function stepVt(s: VtState, cmd: VtCmd): VtEvents {
  const ev: VtEvents = { moved: false, attacked: false, bugKilled: false, buildingHit: false, turnResolved: false, won: false, died: false };
  if (s.won || s.dead) return ev;

  if (cmd.kind === 'select') {
    if (cmd.mech >= 0 && cmd.mech < s.mechs.length && s.mechs[cmd.mech].hp > 0) {
      s.selected = cmd.mech;
      s.cursor = { x: s.mechs[cmd.mech].x, y: s.mechs[cmd.mech].y };
    }
    return ev;
  }
  if (cmd.kind === 'cursor') {
    s.cursor = { x: Math.min(GRID - 1, Math.max(0, cmd.x)), y: Math.min(GRID - 1, Math.max(0, cmd.y)) };
    return ev;
  }

  const mech = s.mechs[s.selected];
  if (cmd.kind === 'move' && mech.hp > 0 && !mech.moved && canMoveTo(s, mech, s.cursor.x, s.cursor.y)) {
    mech.x = s.cursor.x;
    mech.y = s.cursor.y;
    mech.moved = true;
    ev.moved = true;
    return ev;
  }

  if (cmd.kind === 'attack' && mech.hp > 0 && !mech.acted) {
    const def = MECHS[mech.kind];
    const dx = Math.sign(s.cursor.x - mech.x);
    const dy = Math.sign(s.cursor.y - mech.y);
    const straight = (s.cursor.x === mech.x) !== (s.cursor.y === mech.y);
    if (!straight) return ev;
    let tx = -1;
    let ty = -1;
    if (def.ranged) {
      // Artillery lobs at the cursor tile itself (any distance, same line).
      tx = s.cursor.x;
      ty = s.cursor.y;
    } else {
      tx = mech.x + dx;
      ty = mech.y + dy;
      if (!inGrid(tx, ty)) return ev;
    }
    const who = occupant(s, tx, ty);
    mech.acted = true;
    ev.attacked = true;
    if (who?.kind === 'bug') {
      s.bugs[who.i].hp -= def.dmg;
      if (s.bugs[who.i].hp <= 0) ev.bugKilled = true;
    } else if (who?.kind === 'mech') s.mechs[who.i].hp -= def.dmg;
    else if (who?.kind === 'building') s.buildings[who.i].hp -= def.dmg;
    // Every mech weapon pushes away from the attack origin.
    push(s, tx, ty, dx, dy);
    s.bugs = s.bugs.filter((b) => b.hp > 0);
    return ev;
  }

  if (cmd.kind === 'endTurn') {
    // ── Bugs resolve telegraphs EXACTLY as shown ──
    for (const b of s.bugs) {
      if (!b.dir) continue;
      const tx = b.x + b.dir.x;
      const ty = b.y + b.dir.y;
      const who = inGrid(tx, ty) ? occupant(s, tx, ty) : null;
      if (who?.kind === 'building') {
        s.buildings[who.i].hp -= BUG_TUNE.dmg;
        ev.buildingHit = true;
      } else if (who?.kind === 'mech') s.mechs[who.i].hp -= BUG_TUNE.dmg;
      else if (who?.kind === 'bug') s.bugs[who.i].hp -= BUG_TUNE.dmg;
      b.dir = null;
    }
    s.bugs = s.bugs.filter((b) => b.hp > 0);
    s.buildings = s.buildings.filter((g) => g.hp > 0);
    s.mechs.forEach((m) => {
      if (m.hp < 0) m.hp = 0;
    });

    // ── Loss/win checks ──
    if (s.buildings.length === 0 || s.mechs.every((m) => m.hp <= 0)) {
      s.dead = true;
      ev.died = true;
      return ev;
    }
    if (s.turn >= TURNS) {
      s.won = true;
      s.perfect = s.buildings.length === 3 && s.buildings.every((g) => g.hp === 2);
      ev.won = true;
      ev.turnResolved = true;
      return ev;
    }

    // ── New turn: spawns, bug movement + fresh telegraphs ──
    s.turn++;
    for (const sp of s.spawnScript)
      if (sp.turn === s.turn && !occupant(s, sp.x, sp.y)) s.bugs.push({ x: sp.x, y: sp.y, hp: BUG_TUNE.hp, dir: null });
    for (const b of s.bugs) {
      // March two tiles toward the nearest standing building, then telegraph
      // (slow bugs never threaten inside five turns — proven by the
      // do-nothing baseline in verify).
      for (let stepN = 0; stepN < 2; stepN++) {
        const target = s.buildings.reduce((best, g) => (Math.abs(g.x - b.x) + Math.abs(g.y - b.y) < Math.abs(best.x - b.x) + Math.abs(best.y - b.y) ? g : best));
        if (Math.abs(target.x - b.x) + Math.abs(target.y - b.y) <= 1) break; // in striking range
        const dx = Math.sign(target.x - b.x);
        const dy = Math.sign(target.y - b.y);
        const tryMoves = Math.abs(target.y - b.y) >= Math.abs(target.x - b.x) ? [[0, dy], [dx, 0]] : [[dx, 0], [0, dy]];
        for (const [mx, my] of tryMoves) {
          if ((mx || my) && inGrid(b.x + mx, b.y + my) && !occupant(s, b.x + mx, b.y + my)) {
            b.x += mx;
            b.y += my;
            break;
          }
        }
      }
      // Telegraph toward the (possibly new) nearest target.
      const tgt = s.buildings.reduce((best, g) => (Math.abs(g.x - b.x) + Math.abs(g.y - b.y) < Math.abs(best.x - b.x) + Math.abs(best.y - b.y) ? g : best));
      const adx = Math.sign(tgt.x - b.x);
      const ady = Math.sign(tgt.y - b.y);
      b.dir = Math.abs(tgt.y - b.y) >= Math.abs(tgt.x - b.x) ? { x: 0, y: ady || -1 } : { x: adx || 0, y: 0 };
    }
    s.mechs.forEach((m) => {
      m.moved = false;
      m.acted = false;
    });
    ev.turnResolved = true;
  }
  return ev;
}

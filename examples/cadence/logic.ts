// Cadence Hollow rhythm sim — pure module. The campaign's determinism riddle,
// answered: THE BEAT IS SIM TIME. 120 BPM = exactly 30 fixed frames per beat;
// an input is on-beat if its frame lands inside ±4 frames of a beat line; the
// music is an OBSERVER that plays what the sim's beat counter says. No audio
// clock ever touches the simulation.

export const FRAMES_PER_BEAT = 30; // 120 BPM at 60Hz
export const BEAT_WINDOW = 4; // ±frames (~67ms) that count as "on the beat"

export const GRID_W = 15;
export const GRID_H = 9;

/** The hollow: a fixed chamber (rhythm is the star, not procgen). */
export const CHAMBER: string[] = [
  '###############',
  '#@      #     #',
  '# ## ##   ### #',
  '#    s  #  z  #',
  '# ## # ## ##  #',
  '#  z c        #',
  '# ## # ## # ###',
  '#    s    z  E#',
  '###############',
];

export interface Foe {
  kind: 'slime' | 'zombie';
  x: number;
  y: number;
  hp: number;
  /** zombies shuffle-step on even beats; slimes hop every 2nd beat in place. */
  dirX: number;
}

export interface CdState {
  x: number;
  y: number;
  hp: number;
  combo: number;
  bestCombo: number;
  kills: number;
  /** Beat index of the last accepted player action (one action per beat). */
  lastActBeat: number;
  foes: Foe[];
  coins: number;
  won: boolean;
  dead: boolean;
  [key: string]: unknown;
}

export const cidx = (x: number, y: number): number => y * GRID_W + x;
export const wallAt = (x: number, y: number): boolean => (CHAMBER[y]?.[x] ?? '#') === '#';

export function initialCd(): CdState {
  const s: CdState = { x: 0, y: 0, hp: 5, combo: 0, bestCombo: 0, kills: 0, lastActBeat: -1, foes: [], coins: 0, won: false, dead: false };
  CHAMBER.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === '@') {
        s.x = x;
        s.y = y;
      } else if (c === 's') s.foes.push({ kind: 'slime', x, y, hp: 2, dirX: 1 });
      else if (c === 'z') s.foes.push({ kind: 'zombie', x, y, hp: 3, dirX: 1 });
      else if (c === 'c') s.coins++; // decorative goal seasoning
    }
  });
  return s;
}

export const beatOf = (frame: number): number => Math.round(frame / FRAMES_PER_BEAT);
export const onBeat = (frame: number): boolean => {
  const nearest = beatOf(frame) * FRAMES_PER_BEAT;
  return Math.abs(frame - nearest) <= BEAT_WINDOW;
};

export type CdMove = 'left' | 'right' | 'up' | 'down';

export interface CdEvents {
  moved: boolean;
  offBeat: boolean; // rejected — rhythm broken
  fought: boolean;
  killed: boolean;
  hurt: boolean;
  beatAdvanced: boolean;
  won: boolean;
  died: boolean;
}

/**
 * Called on a player input edge at a given sim frame. Movement is legal only
 * inside the beat window, once per beat. Off-beat inputs break the combo.
 */
export function tryMove(s: CdState, move: CdMove, frame: number): CdEvents {
  const ev: CdEvents = { moved: false, offBeat: false, fought: false, killed: false, hurt: false, beatAdvanced: false, won: false, died: false };
  if (s.won || s.dead) return ev;
  const beat = beatOf(frame);
  if (!onBeat(frame) || beat === s.lastActBeat) {
    ev.offBeat = true;
    s.combo = 0;
    return ev;
  }
  s.lastActBeat = beat;
  const d = move === 'left' ? [-1, 0] : move === 'right' ? [1, 0] : move === 'up' ? [0, -1] : [0, 1];
  const nx = s.x + d[0];
  const ny = s.y + d[1];
  const foe = s.foes.find((f) => f.x === nx && f.y === ny && f.hp > 0);
  if (foe) {
    foe.hp -= 1 + (s.combo >= 8 ? 1 : 0); // hot combos hit harder
    ev.fought = true;
    if (foe.hp <= 0) {
      s.kills++;
      ev.killed = true;
    }
  } else if (!wallAt(nx, ny)) {
    s.x = nx;
    s.y = ny;
    ev.moved = true;
    if (CHAMBER[ny][nx] === 'E') {
      s.won = true;
      ev.won = true;
    }
  }
  s.foes = s.foes.filter((f) => f.hp > 0);
  s.combo++;
  s.bestCombo = Math.max(s.bestCombo, s.combo);
  return ev;
}

/**
 * Advance the world one BEAT (the game calls this exactly when the sim frame
 * crosses a beat line): foes act in lockstep with the music.
 */
export function beatTick(s: CdState, beat: number): CdEvents {
  const ev: CdEvents = { moved: false, offBeat: false, fought: false, killed: false, hurt: false, beatAdvanced: true, won: false, died: false };
  if (s.won || s.dead) return ev;
  for (const f of s.foes) {
    if (f.kind === 'zombie') {
      // Shuffles horizontally every beat, turns at walls; bites if adjacent.
      const adj = Math.abs(f.x - s.x) + Math.abs(f.y - s.y) === 1;
      if (adj) {
        s.hp--;
        ev.hurt = true;
        continue;
      }
      if (wallAt(f.x + f.dirX, f.y) || s.foes.some((o) => o !== f && o.x === f.x + f.dirX && o.y === f.y)) f.dirX *= -1;
      else if (!(f.x + f.dirX === s.x && f.y === s.y)) f.x += f.dirX;
    } else if (beat % 2 === 0) {
      // Slimes lunge at the player every other beat when in reach.
      const dx = s.x - f.x;
      const dy = s.y - f.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) {
        s.hp--;
        ev.hurt = true;
      } else if (Math.abs(dx) + Math.abs(dy) <= 3) {
        const step = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
        if (!wallAt(f.x + step[0], f.y + step[1]) && !(f.x + step[0] === s.x && f.y + step[1] === s.y) && !s.foes.some((o) => o !== f && o.x === f.x + step[0] && o.y === f.y + step[1]))
          (f.x += step[0]), (f.y += step[1]);
      }
    }
  }
  if (s.hp <= 0) {
    s.dead = true;
    ev.died = true;
  }
  return ev;
}

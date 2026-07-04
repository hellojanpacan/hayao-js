// Kinfall co-op sim — pure module. Two players share ONE world on a closing
// storm ring: a surviv.io duo distilled to keyboard co-op. The soul is the
// down-and-revive loop — when a partner drops they bleed out unless the other
// crawls over and hauls them up. Fixed iteration order (p1 then p2, then the
// enemy/bullet arrays), all randomness through the passed Rng, no wall clock:
// a netplay-grade deterministic transition just like Fernclash, but the two
// bodies COOPERATE against a shared horde instead of duelling.

import { SpatialHash, type Rng, type TilemapData, tilemapFromAscii, moveRect, dhypot, dcos, dsin, datan2, tileAtPoint, TILE } from '@hayao';

export type Pid = 'p1' | 'p2';
export const PIDS: readonly Pid[] = ['p1', 'p2'];

export const TILE_SIZE = 40;
export const ARENA_W = 1280;
export const ARENA_H = 720;
export const CENTER = { x: ARENA_W / 2, y: ARENA_H / 2 };

// Open field ringed by wall, with four scattered cover blocks (surviv crates
// of stone). The playfield is 32×18 tiles; cover never blocks the centre where
// the final storm ring closes.
export const ARENA_ROWS: string[] = (() => {
  const cols = ARENA_W / TILE_SIZE; // 32
  const rows = ARENA_H / TILE_SIZE; // 18
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row = Array(cols).fill(' ');
    if (r === 0 || r === rows - 1) row.fill('#');
    row[0] = '#';
    row[cols - 1] = '#';
    grid.push(row);
  }
  // Cover clusters (2×2) away from the centre, symmetric so neither player is
  // favoured.
  for (const [cx, cy] of [[7, 4], [24, 4], [7, 13], [24, 13]] as const) {
    grid[cy][cx] = '#';
    grid[cy][cx + 1] = '#';
    grid[cy + 1][cx] = '#';
    grid[cy + 1][cx + 1] = '#';
  }
  return grid.map((r) => r.join(''));
})();

let _map: TilemapData | null = null;
export const arenaMap = (): TilemapData => (_map ??= tilemapFromAscii(ARENA_ROWS, TILE_SIZE));

export const WIN_AT = 100; // survive 100 sim-seconds = the extraction lifts off
export const CAP_ALIVE = 300;

export const P_TUNE = {
  speed: 248,
  crawlSpeed: 108, // downed players crawl slowly toward help
  maxHp: 8,
  radius: 14,
  iframes: 0.85,
  reviveHp: 5, // hp restored when hauled up
  reviveRange: 60,
  reviveTime: 2.0, // seconds a partner must hold interact to revive
  bleedout: 15, // seconds a downed player survives without a revive
  openRange: 52,
  openTime: 0.7,
};

// Loot tiers. Opening a crate raises a player's weapon to the crate's tier.
export interface Weapon {
  label: string;
  glyph: string;
  fireRate: number; // shots per second while fire is held
  dmg: number;
  pellets: number;
  spread: number; // radians of half-arc for multi-pellet guns
  speed: number;
  life: number;
}
export const WEAPONS: readonly Weapon[] = [
  { label: 'Pistol', glyph: '•', fireRate: 4.5, dmg: 2, pellets: 1, spread: 0, speed: 560, life: 0.95 },
  { label: 'SMG', glyph: '···', fireRate: 9.0, dmg: 1.5, pellets: 1, spread: 0.06, speed: 620, life: 0.85 },
  { label: 'Scatter', glyph: '≡', fireRate: 1.8, dmg: 1.8, pellets: 5, spread: 0.32, speed: 540, life: 0.5 },
  { label: 'Rifle', glyph: '✶', fireRate: 5.0, dmg: 3.2, pellets: 1, spread: 0, speed: 780, life: 1.3 },
];

export const E_TUNE = {
  swarmer: { hp: 2, speed: 96, dmg: 1, radius: 13 },
  brute: { hp: 10, speed: 52, dmg: 2, radius: 22 },
} as const;
export type EKind = keyof typeof E_TUNE;

// A calm looting window opens the match (surviv's early game), then the horde
// ramps quadratically once the storm starts moving.
export const SPAWN_GRACE = 7;
export const spawnRate = (t: number): number => (t < SPAWN_GRACE ? 0 : 0.5 + ((t - SPAWN_GRACE) * (t - SPAWN_GRACE)) / 950);
export const bruteShare = (t: number): number => Math.min(0.35, t / 260);

// The storm: a ring centred on the arena that shrinks through holds. Standing
// outside costs hp/sec — the pressure that squeezes the pair together and
// forbids camping the rim. Piecewise-linear through these keyframes.
const STORM_KEYS: readonly { at: number; r: number }[] = [
  { at: 0, r: 700 },
  { at: 20, r: 700 },
  { at: 30, r: 470 },
  { at: 46, r: 470 },
  { at: 56, r: 320 },
  { at: 70, r: 320 },
  { at: 80, r: 190 },
  { at: 92, r: 130 },
];
export const STORM_DPS = 4;
export function stormRadius(t: number): number {
  if (t <= STORM_KEYS[0].at) return STORM_KEYS[0].r;
  const last = STORM_KEYS[STORM_KEYS.length - 1];
  if (t >= last.at) return last.r;
  for (let i = 1; i < STORM_KEYS.length; i++) {
    const a = STORM_KEYS[i - 1];
    const b = STORM_KEYS[i];
    if (t <= b.at) return a.r + ((b.r - a.r) * (t - a.at)) / (b.at - a.at);
  }
  return last.r;
}

export interface Player {
  x: number;
  y: number;
  hp: number;
  dirX: number;
  dirY: number;
  fireCd: number;
  iframes: number;
  weapon: number; // index into WEAPONS
  downed: boolean;
  dead: boolean;
  bleed: number; // seconds of bleedout remaining while downed
  reviveProg: number; // accrued revive time (filled by the partner)
  interactProg: number; // accrued crate-open time
  revives: number; // lifetime count of partners hauled up
}

export interface Enemy {
  x: number;
  y: number;
  hp: number;
  kind: EKind;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  dmg: number;
  who: Pid;
}

export interface Crate {
  x: number;
  y: number;
  tier: number;
  opened: boolean;
}

export interface KinState {
  players: Record<Pid, Player>;
  enemies: Enemy[];
  bullets: Bullet[];
  crates: Crate[];
  time: number;
  spawnAcc: number;
  kills: number;
  phase: 'play' | 'won' | 'lost';
  [key: string]: unknown;
}

export interface PInput {
  moveX: number;
  moveY: number;
  fire: boolean;
  interact: boolean;
}

export interface KinEvents {
  fired: boolean;
  kill: boolean;
  hurt: boolean;
  down: Pid | null;
  revive: Pid | null;
  loot: Pid | null;
  won: boolean;
  lost: boolean;
}

const START: Record<Pid, { x: number; y: number }> = {
  p1: { x: CENTER.x - 70, y: CENTER.y },
  p2: { x: CENTER.x + 70, y: CENTER.y },
};

function makePlayer(pid: Pid): Player {
  const s = START[pid];
  return { x: s.x, y: s.y, hp: P_TUNE.maxHp, dirX: pid === 'p1' ? -1 : 1, dirY: 0, fireCd: 0, iframes: 0, weapon: 0, downed: false, dead: false, bleed: 0, reviveProg: 0, interactProg: 0, revives: 0 };
}

// Six crates in a symmetric ring between the start and the mid storm — the
// loot run that pulls players outward before the ring forces them back in.
function makeCrates(): Crate[] {
  // All on open ground, clear of the four cover clusters (tile bands x∈[280,360]
  // ∪ [960,1040], y∈[160,240] ∪ [520,600]) so every crate is actually reachable.
  return [
    { x: 480, y: 260, tier: 1, opened: false },
    { x: 800, y: 260, tier: 1, opened: false },
    { x: 480, y: 460, tier: 2, opened: false },
    { x: 800, y: 460, tier: 2, opened: false },
    { x: 640, y: 175, tier: 3, opened: false },
    { x: 640, y: 545, tier: 3, opened: false },
  ];
}

export function initialKin(): KinState {
  return {
    players: { p1: makePlayer('p1'), p2: makePlayer('p2') },
    enemies: [],
    bullets: [],
    crates: makeCrates(),
    time: 0,
    spawnAcc: 0,
    kills: 0,
    phase: 'play',
  };
}

export function partnerOf(pid: Pid): Pid {
  return pid === 'p1' ? 'p2' : 'p1';
}

/** A standing (alive, not downed) player — the only kind enemies target. */
function standing(p: Player): boolean {
  return !p.downed && !p.dead;
}

/** Advance the co-op night one fixed step. Mutates `s`; returns the events. */
export function stepKin(s: KinState, inputs: Record<Pid, PInput>, dt: number, rng: Rng): KinEvents {
  const ev: KinEvents = { fired: false, kill: false, hurt: false, down: null, revive: null, loot: null, won: false, lost: false };
  if (s.phase !== 'play') return ev;
  s.time += dt;
  const map = arenaMap();
  const radius = stormRadius(s.time);

  // ── Players: movement, storm bleed, fire, interact ──
  for (const pid of PIDS) {
    const p = s.players[pid];
    if (p.dead) continue;
    p.iframes = Math.max(0, p.iframes - dt);
    p.fireCd = Math.max(0, p.fireCd - dt);
    const inp = inputs[pid];

    // Move (crawl if downed). Facing tracks the last non-zero steer.
    const il = dhypot(inp.moveX, inp.moveY);
    const spd = p.downed ? P_TUNE.crawlSpeed : P_TUNE.speed;
    if (il > 0) {
      p.dirX = inp.moveX / il;
      p.dirY = inp.moveY / il;
      const r = P_TUNE.radius;
      const res = moveRect(map, { x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 }, (inp.moveX / il) * spd * dt, (inp.moveY / il) * spd * dt);
      p.x = res.x + r;
      p.y = res.y + r;
    }

    // Storm bleed — ignores i-frames; this is the inescapable pressure.
    if (dhypot(p.x - CENTER.x, p.y - CENTER.y) > radius) {
      p.hp -= STORM_DPS * dt;
      if (p.hp <= 0 && !p.downed) knockDown(p, ev, pid);
    }

    if (p.downed) {
      p.bleed -= dt;
      if (p.bleed <= 0) {
        p.dead = true;
        p.downed = false;
      }
      continue; // downed players can't shoot or loot
    }

    // Fire (auto-repeat while held, gated by fire rate). Keyboard-only aim:
    // lock onto the nearest enemy so the gun is usable with 8-way movement;
    // fall back to the facing direction when the field is clear.
    if (inp.fire && p.fireCd <= 0) {
      const w = WEAPONS[p.weapon];
      let aimX = p.dirX;
      let aimY = p.dirY;
      let bd = Infinity;
      for (const e of s.enemies) {
        const d = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
        if (d < bd) {
          bd = d;
          aimX = e.x - p.x;
          aimY = e.y - p.y;
        }
      }
      const baseA = datan2(aimY, aimX);
      for (let k = 0; k < w.pellets; k++) {
        const a = baseA + (w.pellets === 1 ? 0 : (k / (w.pellets - 1) - 0.5) * 2 * w.spread);
        s.bullets.push({ x: p.x + p.dirX * (P_TUNE.radius + 4), y: p.y + p.dirY * (P_TUNE.radius + 4), vx: dcos(a) * w.speed, vy: dsin(a) * w.speed, life: w.life, dmg: w.dmg, who: pid });
      }
      p.fireCd = 1 / w.fireRate;
      ev.fired = true;
    }

    // Interact: revive a downed partner first, else open a crate. Holding the
    // key fills a progress bar; releasing (or leaving range) resets it.
    if (inp.interact) {
      const mate = s.players[partnerOf(pid)];
      if (mate.downed && dhypot(p.x - mate.x, p.y - mate.y) <= P_TUNE.reviveRange) {
        mate.reviveProg += dt;
        if (mate.reviveProg >= P_TUNE.reviveTime) {
          mate.downed = false;
          mate.hp = P_TUNE.reviveHp;
          mate.reviveProg = 0;
          mate.bleed = 0;
          p.revives += 1;
          ev.revive = partnerOf(pid);
        }
      } else {
        // Open the nearest unopened crate in range.
        let target = -1;
        let bd = P_TUNE.openRange * P_TUNE.openRange;
        for (let i = 0; i < s.crates.length; i++) {
          const c = s.crates[i];
          if (c.opened) continue;
          const d = (c.x - p.x) * (c.x - p.x) + (c.y - p.y) * (c.y - p.y);
          if (d < bd) {
            bd = d;
            target = i;
          }
        }
        if (target >= 0) {
          p.interactProg += dt;
          if (p.interactProg >= P_TUNE.openTime) {
            s.crates[target].opened = true;
            p.weapon = Math.max(p.weapon, s.crates[target].tier);
            p.interactProg = 0;
            ev.loot = pid;
          }
        } else {
          p.interactProg = 0;
        }
      }
    } else {
      p.interactProg = 0;
      const mate = s.players[partnerOf(pid)];
      if (mate.downed) mate.reviveProg = Math.max(0, mate.reviveProg - dt * 2); // decay if the reviver steps away
    }
  }

  // ── Spawns (arena edge, quadratic ramp) ──
  s.spawnAcc += spawnRate(s.time) * dt;
  while (s.spawnAcc >= 1 && s.enemies.length < CAP_ALIVE) {
    s.spawnAcc -= 1;
    const side = rng.int(4);
    const along = rng.float();
    const x = side === 0 ? 48 : side === 1 ? ARENA_W - 48 : 60 + along * (ARENA_W - 120);
    const y = side < 2 ? 60 + along * (ARENA_H - 120) : side === 2 ? 48 : ARENA_H - 48;
    const kind: EKind = rng.chance(bruteShare(s.time)) ? 'brute' : 'swarmer';
    s.enemies.push({ x, y, hp: E_TUNE[kind].hp, kind });
  }

  // ── Broad phase over enemies ──
  const hash = new SpatialHash<number>(64);
  s.enemies.forEach((e, i) => {
    const er = E_TUNE[e.kind].radius;
    hash.insert(i, { x: e.x - er, y: e.y - er, w: er * 2, h: er * 2 });
  });

  // ── Bullets: integrate, despawn on wall/edge, hit via hash ──
  let bw = 0;
  for (const b of s.bullets) {
    b.life -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.life <= 0 || b.x < 8 || b.x > ARENA_W - 8 || b.y < 8 || b.y > ARENA_H - 8) continue;
    if (tileAtPoint(map, b.x, b.y) === TILE.SOLID) continue;
    let hit = false;
    for (const i of hash.queryCircle(b.x, b.y, 5)) {
      const e = s.enemies[i];
      if (e.hp <= 0) continue;
      e.hp -= b.dmg;
      hit = true;
      if (e.hp <= 0) {
        s.kills++;
        ev.kill = true;
      }
      break;
    }
    if (!hit) s.bullets[bw++] = b;
  }
  s.bullets.length = bw;

  // ── Enemies: chase the nearest STANDING player, soft-separate, touch-damage ──
  const targets = PIDS.filter((pid) => standing(s.players[pid]));
  for (let i = 0; i < s.enemies.length; i++) {
    const e = s.enemies[i];
    if (e.hp <= 0) continue;
    const T = E_TUNE[e.kind];
    // Nearest standing player (deterministic PIDS order breaks ties).
    let tx = CENTER.x;
    let ty = CENTER.y;
    let bd = Infinity;
    for (const pid of targets) {
      const p = s.players[pid];
      const d = (p.x - e.x) * (p.x - e.x) + (p.y - e.y) * (p.y - e.y);
      if (d < bd) {
        bd = d;
        tx = p.x;
        ty = p.y;
      }
    }
    const dx = tx - e.x;
    const dy = ty - e.y;
    const d = dhypot(dx, dy) || 1;
    let mx = (dx / d) * T.speed;
    let my = (dy / d) * T.speed;
    for (const j of hash.queryCircle(e.x, e.y, T.radius + 8)) {
      if (j === i || s.enemies[j].hp <= 0) continue;
      const ox = e.x - s.enemies[j].x;
      const oy = e.y - s.enemies[j].y;
      const od = dhypot(ox, oy) || 1;
      mx += (ox / od) * 46;
      my += (oy / od) * 46;
      break;
    }
    e.x = Math.min(ARENA_W - 44, Math.max(44, e.x + mx * dt));
    e.y = Math.min(ARENA_H - 44, Math.max(44, e.y + my * dt));
    // Touch damage to standing players only (downed are already at zero).
    for (const pid of targets) {
      const p = s.players[pid];
      if (dhypot(p.x - e.x, p.y - e.y) < T.radius + P_TUNE.radius && p.iframes <= 0) {
        p.hp -= T.dmg;
        p.iframes = P_TUNE.iframes;
        ev.hurt = true;
        if (p.hp <= 0 && !p.downed) knockDown(p, ev, pid);
      }
    }
  }
  s.enemies = s.enemies.filter((e) => e.hp > 0);

  // ── Win / loss ──
  const bothDead = PIDS.every((pid) => s.players[pid].dead);
  if (bothDead) {
    s.phase = 'lost';
    ev.lost = true;
  } else if (s.time >= WIN_AT) {
    s.phase = 'won';
    ev.won = true;
  }
  return ev;
}

function knockDown(p: Player, ev: KinEvents, pid: Pid): void {
  p.downed = true;
  p.hp = 0;
  p.bleed = P_TUNE.bleedout;
  p.reviveProg = 0;
  p.interactProg = 0;
  ev.down = pid;
}

// ── Co-op bot policy — the verify pilot and a decent practice partner. ──
// Priorities: revive a downed mate, escape the storm, grab an early crate,
// then orbit-and-fire the horde while keeping clear of the nearest enemy.
export function coopInput(s: KinState, me: Pid): PInput {
  const p = s.players[me];
  const mate = s.players[partnerOf(me)];
  const out: PInput = { moveX: 0, moveY: 0, fire: false, interact: false };
  if (p.dead) return out;
  const radius = stormRadius(s.time);
  const distC = dhypot(p.x - CENTER.x, p.y - CENTER.y);

  // Downed: crawl toward the standing partner to shorten the revive.
  if (p.downed) {
    if (standing(mate)) steerTo(out, p, mate.x, mate.y);
    else steerTo(out, p, CENTER.x, CENTER.y);
    return out;
  }

  // 1. Revive a downed mate (highest priority).
  if (mate.downed) {
    const d = dhypot(p.x - mate.x, p.y - mate.y);
    if (d <= P_TUNE.reviveRange - 6) {
      out.interact = true; // in range — hold to revive
    } else {
      steerTo(out, p, mate.x, mate.y);
    }
    return out;
  }

  // 2. Escape the storm if caught outside (with a safety margin).
  if (distC > radius - 40) {
    steerTo(out, p, CENTER.x, CENTER.y);
    // Fire while retreating if something is close.
    aimFire(s, p, out);
    return out;
  }

  // 3. Early loot: grab in-zone crates until armed up. Each bot prefers crates
  // on its own half so both players arm rather than fighting over one crate.
  if (p.weapon < 3 && s.time < 60) {
    const mySide = me === 'p1' ? -1 : 1; // p1 favours left, p2 right
    let target = -1;
    let bd = Infinity;
    for (let i = 0; i < s.crates.length; i++) {
      const c = s.crates[i];
      if (c.opened || c.tier <= p.weapon) continue;
      if (dhypot(c.x - CENTER.x, c.y - CENTER.y) > radius - 30) continue;
      const sideBias = Math.sign(c.x - CENTER.x) === mySide ? 0 : 90000; // penalise the far side
      const d = (c.x - p.x) * (c.x - p.x) + (c.y - p.y) * (c.y - p.y) + sideBias;
      if (d < bd) {
        bd = d;
        target = i;
      }
    }
    if (target >= 0) {
      const c = s.crates[target];
      // Only commit to opening when no enemy is breathing down our neck.
      let nd = Infinity;
      for (const e of s.enemies) nd = Math.min(nd, (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y));
      const clear = nd > 150 * 150;
      const atCrate = dhypot(p.x - c.x, p.y - c.y) <= P_TUNE.openRange - 6;
      if (atCrate && clear) out.interact = true;
      else if (!atCrate) steerTo(out, p, c.x, c.y);
      aimFire(s, p, out);
      if (clear || !atCrate) return out;
      // Not clear at the crate — fall through to kiting instead of standing.
    }
  }

  // 4. Orbit the horde: circle-strafe around the nearest enemy, keep inside the
  // ring, and hold fire (the gun auto-aims).
  let nx = 0;
  let ny = 0;
  let nd = Infinity;
  for (const e of s.enemies) {
    const d = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
    if (d < nd) {
      nd = d;
      nx = e.x;
      ny = e.y;
    }
  }
  if (nd < 190 * 190) {
    // Away from the threat + a perpendicular strafe, biased gently inward.
    const ax = p.x - nx;
    const ay = p.y - ny;
    const toCx = CENTER.x - p.x;
    const toCy = CENTER.y - p.y;
    steerVec(out, ax * 1.5 - ay * 0.7 + toCx * 0.35, ay * 1.5 + ax * 0.7 + toCy * 0.35);
  } else if (distC > radius * 0.5) {
    steerTo(out, p, CENTER.x, CENTER.y); // drift inward when safe
  }
  aimFire(s, p, out);
  return out;
}

function aimFire(s: KinState, p: Player, out: PInput): void {
  // The gun auto-aims in the sim, so the bot just holds fire when any enemy is
  // within a sensible engagement range.
  let nd = Infinity;
  for (const e of s.enemies) {
    const d = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
    if (d < nd) nd = d;
  }
  if (nd < 520 * 520) out.fire = true;
}

function steerTo(out: PInput, p: Player, tx: number, ty: number): void {
  steerVec(out, tx - p.x, ty - p.y);
}
function steerVec(out: PInput, dx: number, dy: number): void {
  out.moveX = Math.abs(dx) > 8 ? Math.sign(dx) : 0;
  out.moveY = Math.abs(dy) > 8 ? Math.sign(dy) : 0;
}

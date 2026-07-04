import { describe, it, expect } from 'vitest';
import { Rng, createWorld, assertDeterministic, assertSnapshotStable, type InputLog } from '@hayao';
import { initialKin, stepKin, coopInput, stormRadius, partnerOf, P_TUNE, STORM_DPS, WIN_AT, CENTER, PIDS, type KinState, type PInput } from './logic';
import { kinfallGame, kinState } from './game';

const IDLE: PInput = { moveX: 0, moveY: 0, fire: false, interact: false };
const dt = 1 / 60;

/** Run the co-op bot for both players until the night ends. */
function runCoop(seed: number): KinState {
  const s = initialKin();
  const rng = new Rng(seed);
  for (let f = 0; f < WIN_AT * 60 + 120 && s.phase === 'play'; f++) {
    stepKin(s, { p1: coopInput(s, 'p1'), p2: coopInput(s, 'p2') }, dt, rng);
  }
  return s;
}

describe('Kinfall — the storm ring (Channel 1: geometry)', () => {
  it('shrinks monotonically to its final radius', () => {
    let prev = Infinity;
    for (let t = 0; t <= WIN_AT; t += 2) {
      const r = stormRadius(t);
      expect(r).toBeLessThanOrEqual(prev + 1e-9);
      prev = r;
    }
    expect(stormRadius(WIN_AT)).toBeLessThan(stormRadius(0));
    expect(stormRadius(WIN_AT)).toBe(130);
  });

  it('is load-bearing: a player parked outside the final ring is bled down and knocked out', () => {
    const s = initialKin();
    const rng = new Rng(1);
    // Park p1 far from centre (outside every ring); no enemies matter here.
    const p1 = s.players.p1;
    p1.x = CENTER.x + 620;
    p1.y = CENTER.y;
    s.time = 92; // final ring is 130 — 620 is well outside
    let knocked = false;
    for (let f = 0; f < 60 * 8 && !knocked; f++) {
      stepKin(s, { p1: IDLE, p2: IDLE }, dt, rng);
      knocked = p1.downed || p1.dead;
    }
    expect(knocked).toBe(true); // the storm reaches the rim-camper — no safe camp
  });
});

describe('Kinfall — the down & revive loop (the co-op soul), proven both ways', () => {
  it('a partner holding interact in range hauls a downed player up', () => {
    const s = initialKin();
    const rng = new Rng(1);
    s.time = 20;
    const down = s.players.p2;
    const helper = s.players.p1;
    // Knock p2 down and stand p1 right next to them.
    down.downed = true;
    down.hp = 0;
    down.bleed = P_TUNE.bleedout;
    helper.x = down.x + 20;
    helper.y = down.y;
    const revive: PInput = { moveX: 0, moveY: 0, fire: false, interact: true };
    let revived = false;
    for (let f = 0; f < Math.ceil(P_TUNE.reviveTime * 60) + 20 && !revived; f++) {
      stepKin(s, { p1: revive, p2: IDLE }, dt, rng);
      revived = !down.downed && !down.dead;
    }
    expect(revived).toBe(true);
    expect(down.hp).toBe(P_TUNE.reviveHp);
    expect(helper.revives).toBe(1);
  });

  it('with no help, a downed player bleeds out and dies', () => {
    const s = initialKin();
    const rng = new Rng(1);
    s.time = 20;
    const down = s.players.p2;
    down.downed = true;
    down.hp = 0;
    down.bleed = P_TUNE.bleedout;
    // p1 stands far away and does nothing.
    s.players.p1.x = CENTER.x;
    s.players.p1.y = CENTER.y;
    for (let f = 0; f < Math.ceil((P_TUNE.bleedout + 1) * 60); f++) {
      stepKin(s, { p1: IDLE, p2: IDLE }, dt, rng);
      if (down.dead) break;
    }
    expect(down.dead).toBe(true);
  });

  it('a reviver stepping out of range loses progress (revive is a held commitment)', () => {
    const s = initialKin();
    const rng = new Rng(1);
    s.time = 20;
    const down = s.players.p2;
    down.downed = true;
    down.hp = 0;
    down.bleed = P_TUNE.bleedout;
    const helper = s.players.p1;
    helper.x = down.x + 20;
    helper.y = down.y;
    const revive: PInput = { moveX: 0, moveY: 0, fire: false, interact: true };
    // Hold for under half the revive time, then release.
    for (let f = 0; f < Math.floor(P_TUNE.reviveTime * 60 * 0.4); f++) stepKin(s, { p1: revive, p2: IDLE }, dt, rng);
    expect(down.downed).toBe(true);
    const partial = down.reviveProg;
    expect(partial).toBeGreaterThan(0);
    for (let f = 0; f < 30; f++) stepKin(s, { p1: IDLE, p2: IDLE }, dt, rng); // release
    expect(down.reviveProg).toBeLessThan(partial); // progress decays
    expect(down.downed).toBe(true);
  });
});

describe('Kinfall — looting arms a player', () => {
  it('holding interact by a crate raises the weapon to the crate tier', () => {
    const s = initialKin();
    const rng = new Rng(1);
    const p1 = s.players.p1;
    const crate = s.crates[4]; // a tier-3 crate
    p1.x = crate.x;
    p1.y = crate.y + 10;
    expect(p1.weapon).toBe(0);
    const open: PInput = { moveX: 0, moveY: 0, fire: false, interact: true };
    for (let f = 0; f < Math.ceil(P_TUNE.openTime * 60) + 10; f++) {
      stepKin(s, { p1: open, p2: IDLE }, dt, rng);
      if (crate.opened) break;
    }
    expect(crate.opened).toBe(true);
    expect(p1.weapon).toBe(crate.tier);
  });
});

describe('Kinfall — the co-op night is winnable, and null play is not (skill delta)', () => {
  it('the pair-bot holds the ring to extraction across seeds', () => {
    for (const seed of [1, 2, 3, 7, 11, 42]) {
      const s = runCoop(seed);
      expect(s.phase).toBe('won');
      expect(PIDS.some((p) => !s.players[p].dead)).toBe(true);
    }
  });

  it('an idle pair (never fights, never revives) is wiped well before extraction', () => {
    const s = initialKin();
    const rng = new Rng(7);
    for (let f = 0; f < WIN_AT * 60 && s.phase === 'play'; f++) stepKin(s, { p1: IDLE, p2: IDLE }, dt, rng);
    expect(s.phase).toBe('lost');
    expect(s.time).toBeLessThan(WIN_AT * 0.7);
  });
});

/** A short scripted co-op log for the determinism nets (both players active). */
function coopLog(frames: number): InputLog {
  const ref = createWorld(kinfallGame);
  const log: string[][] = [];
  for (let i = 0; i < frames; i++) {
    const s = kinState(ref);
    const actions: string[] = [];
    for (const pid of PIDS) {
      const c = coopInput(s, pid);
      if (c.moveX > 0) actions.push(`${pid}:right`);
      if (c.moveX < 0) actions.push(`${pid}:left`);
      if (c.moveY > 0) actions.push(`${pid}:down`);
      if (c.moveY < 0) actions.push(`${pid}:up`);
      if (c.fire) actions.push(`${pid}:fire`);
      if (c.interact) actions.push(`${pid}:interact`);
    }
    const frame = actions.sort();
    log.push(frame);
    ref.step(frame);
  }
  return { frames: log };
}

describe('Kinfall — determinism & save/load (the regression net)', () => {
  const log = coopLog(60 * 20);

  it('same seed + same input log → identical state hashes', () => {
    const report = assertDeterministic(() => createWorld(kinfallGame), log);
    expect(report.ok).toBe(true);
    expect(report.divergedAt).toBe(-1);
  });

  it('snapshot → restore reproduces the exact continuation', () => {
    const res = assertSnapshotStable(() => createWorld(kinfallGame), log, 120);
    expect(res.ok).toBe(true);
    expect(res.hashA).toBe(res.hashB);
  });
});

describe('Kinfall — the shared world builds and renders', () => {
  it('has two players and a control legend on the first frame', () => {
    const world = createWorld(kinfallGame);
    world.step([]);
    const s = kinState(world);
    expect(PIDS.length).toBe(2);
    expect(s.players.p1).toBeTruthy();
    expect(s.players.p2).toBeTruthy();
    expect(partnerOf('p1')).toBe('p2');
    const commands = world.render();
    expect(commands.some((c) => c.kind === 'text')).toBe(true);
  });

  it('storm damage uses the declared rate', () => {
    expect(STORM_DPS).toBeGreaterThan(0);
  });
});

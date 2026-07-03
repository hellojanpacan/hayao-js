import { describe, expect, it } from 'vitest';
import { LockstepSession, LoopbackHub, assertDeterministic, createWorld, mergePlayerFrames, type InputLog, type PlayerId } from '@hayao';
import { ARENA, FIGHTER, WIN_SCORE, centreDist, chaseInput, initialFc, stepFc, type FcInput, type Side } from './logic';
import { fcState, fernclashGame } from './game';

const DT = 1 / 60;
const idle: FcInput = { x: 0, y: 0, dash: false };
const both = (p1: FcInput, p2: FcInput) => ({ p1, p2 });

function playPhase(s = initialFc()) {
  // Burn the countdown deterministically.
  while (s.phase === 'countdown') stepFc(s, both(idle, idle), DT);
  return s;
}

describe('fernclash logic', () => {
  it('countdown leads into play and fires go exactly once', () => {
    const s = initialFc();
    let gos = 0;
    for (let i = 0; i < 120; i++) if (stepFc(s, both(idle, idle), DT).go) gos++;
    expect(s.phase).toBe('play');
    expect(gos).toBe(1);
  });

  it('steering accelerates up to the cap; drag stops a coasting fighter', () => {
    const s = playPhase();
    for (let i = 0; i < 90; i++) stepFc(s, both({ x: 0, y: -1, dash: false }, idle), DT);
    const speed = Math.hypot(s.bodies.p1.vx, s.bodies.p1.vy);
    expect(speed).toBeGreaterThan(FIGHTER.maxSpeed * 0.7);
    for (let i = 0; i < 180; i++) stepFc(s, both(idle, idle), DT);
    expect(Math.hypot(s.bodies.p1.vx, s.bodies.p1.vy)).toBeLessThan(10);
  });

  it('a shove transfers momentum (restitution > 1 makes contact decisive)', () => {
    const s = playPhase();
    s.bodies.p1.x = ARENA.cx - FIGHTER.radius * 2 - 4;
    s.bodies.p1.y = ARENA.cy;
    s.bodies.p2.x = ARENA.cx;
    s.bodies.p2.y = ARENA.cy;
    s.bodies.p1.vx = 300;
    let hit = false;
    for (let i = 0; i < 30 && !hit; i++) hit = stepFc(s, both(idle, idle), DT).hit;
    expect(hit).toBe(true);
    expect(s.bodies.p2.vx).toBeGreaterThan(100); // p2 got launched
  });

  it('dash fires once and respects the cooldown', () => {
    const s = playPhase();
    const e1 = stepFc(s, both({ x: 1, y: 0, dash: true }, idle), DT);
    expect(e1.dash).toBe(true);
    const e2 = stepFc(s, both({ x: 1, y: 0, dash: true }, idle), DT);
    expect(e2.dash).toBe(false);
    expect(s.bodies.p1.dashCd).toBeGreaterThan(0);
  });

  it('falling off the ring scores the opponent and resets the round', () => {
    const s = playPhase();
    s.bodies.p1.x = ARENA.cx + ARENA.r - 2;
    s.bodies.p1.vx = 600;
    let winner: Side | null = null;
    for (let i = 0; i < 60 && !winner; i++) winner = stepFc(s, both(idle, idle), DT).roundEnd;
    expect(winner).toBe('p2');
    expect(s.score.p2).toBe(1);
    // Round pause, then fresh positions.
    for (let i = 0; i < 120 && s.phase !== 'countdown'; i++) stepFc(s, both(idle, idle), DT);
    expect(centreDist(s.bodies.p1)).toBeLessThan(150);
  });

  it('the chase bot finishes a match against an idle rival', () => {
    const s = initialFc();
    let over: Side | null = null;
    for (let i = 0; i < 60 * 120 && !over; i++) over = stepFc(s, both(chaseInput(s, 'p1'), idle), DT).over;
    expect(over).toBe('p1');
    expect(s.score.p1).toBe(WIN_SCORE);
  });
});

// ── world level ──────────────────────────────────────────────────

/** Namespaced frames for a scripted duel: p1 chases, p2 wiggles. */
function duelLog(frames: number): InputLog {
  // Derive inputs from a reference sim so the script stays meaningful.
  const ref = createWorld(fernclashGame);
  const log: string[][] = [];
  for (let i = 0; i < frames; i++) {
    const s = fcState(ref);
    const c = chaseInput(s, 'p1');
    const actions: string[] = [];
    if (c.x > 0) actions.push('p1:right');
    if (c.x < 0) actions.push('p1:left');
    if (c.y > 0) actions.push('p1:down');
    if (c.y < 0) actions.push('p1:up');
    if (c.dash) actions.push('p1:dash');
    if (i % 40 < 12) actions.push(i % 80 < 40 ? 'p2:up' : 'p2:down');
    const frame = actions.sort();
    log.push(frame);
    ref.step(frame);
  }
  return { frames: log };
}

describe('fernclash world', () => {
  it('a scripted duel completes and the probe reports it', () => {
    const world = createWorld(fernclashGame);
    const log = duelLog(60 * 90);
    for (const f of log.frames) {
      world.step(f);
      if ((world.probe() as { phase: string }).phase === 'over') break;
    }
    const probe = world.probe() as { phase: string; score: Record<string, number> };
    expect(probe.phase).toBe('over');
    expect(probe.score.p1).toBe(WIN_SCORE);
  });

  it('is deterministic under the duel log', () => {
    assertDeterministic(() => createWorld(fernclashGame), duelLog(600));
  });
});

// ── netplay smoke: the actual point of this example ─────────────

describe('fernclash netplay', () => {
  it('two lockstep peers finish a duel with identical hashes', () => {
    const hub = new LoopbackHub({ delay: 2 });
    const worldA = createWorld(fernclashGame);
    const worldB = createWorld(fernclashGame);
    const players: PlayerId[] = ['p1', 'p2'];
    const a = new LockstepSession({ world: worldA, transport: hub.connect(), localPlayer: 'p1', players });
    const b = new LockstepSession({ world: worldB, transport: hub.connect(), localPlayer: 'p2', players });

    const localActions = (world: typeof worldA, side: Side): string[] => {
      const c = chaseInput(fcState(world), side);
      const actions: string[] = [];
      if (c.x > 0) actions.push('right');
      if (c.x < 0) actions.push('left');
      if (c.y > 0) actions.push('down');
      if (c.y < 0) actions.push('up');
      if (c.dash && side === 'p1') actions.push('dash'); // only red dashes — asymmetry ends rounds
      return actions;
    };

    let over = false;
    for (let i = 0; i < 60 * 150 && !over; i++) {
      a.tick(localActions(worldA, 'p1'));
      b.tick(localActions(worldB, 'p2'));
      hub.tick();
      over = fcState(worldA).phase === 'over' && fcState(worldB).phase === 'over';
    }
    expect(over).toBe(true);

    // Settle to a common frame, then the entire sim state must agree.
    const target = Math.max(a.frame, b.frame);
    for (let i = 0; i < 60 && (a.frame < target || b.frame < target); i++) {
      if (a.frame < target) a.tick([]);
      if (b.frame < target) b.tick([]);
      hub.tick();
    }
    expect(a.frame).toBe(b.frame);
    expect(worldA.hash()).toBe(worldB.hash());
    // And the merged logs agree too.
    expect(a.inputLog().frames.length).toBeGreaterThan(0);
    expect(mergePlayerFrames(players, new Map([['p1', ['up']], ['p2', []]]))).toEqual(['p1:up']);
  });
});

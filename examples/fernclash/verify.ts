// Fernclash verify suite: the duel completes under a bot, the sim is
// deterministic and golden-pinned, and — the reason this example exists —
// two networked lockstep peers finish a full match with identical state
// hashes over a lossy, laggy loopback network.

import {
  LockstepSession,
  LoopbackHub,
  checkDeterministic,
  createWorld,
  renderFilmstrip,
  type InputLog,
  type World,
} from '@hayao';
import { WIN_SCORE, chaseInput, initialFc, stepFc, type Side } from './logic';
import { fcState, fernclashGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

function chaseActions(world: World, side: Side, prefix: string): string[] {
  const c = chaseInput(fcState(world), side);
  const a: string[] = [];
  if (c.x > 0) a.push(`${prefix}right`);
  if (c.x < 0) a.push(`${prefix}left`);
  if (c.y > 0) a.push(`${prefix}down`);
  if (c.y < 0) a.push(`${prefix}up`);
  if (c.dash) a.push(`${prefix}dash`);
  return a;
}

/** Scripted duel: p1 chases and dashes, p2 orbits. Returns the input log. */
function duelLog(maxFrames: number): InputLog {
  const ref = createWorld(fernclashGame);
  const frames: string[][] = [];
  for (let i = 0; i < maxFrames; i++) {
    const actions = chaseActions(ref, 'p1', 'p1:');
    if (i % 50 < 14) actions.push(i % 100 < 50 ? 'p2:up' : 'p2:down');
    const frame = actions.sort();
    frames.push(frame);
    ref.step(frame);
    if (fcState(ref).phase === 'over') break;
  }
  return { frames };
}

export default async function verify(t: VerifyContext) {
  // 1. Pure sim: the chase bot beats an idle rival — the win loop is closed.
  {
    const s = initialFc();
    let over: Side | null = null;
    let frames = 0;
    for (; frames < 60 * 120 && !over; frames++) {
      over = stepFc(s, { p1: chaseInput(s, 'p1'), p2: { x: 0, y: 0, dash: false } }, 1 / 60).over;
    }
    t.check(
      over === 'p1' ? `bot duel won ${s.score.p1}–${s.score.p2} in ${(frames / 60).toFixed(1)}s` : 'bot duel never finished',
      over === 'p1' && s.score.p1 === WIN_SCORE,
    );
  }

  // 2. World: the scripted duel completes; the replay hash is golden-pinned.
  const log = duelLog(60 * 150);
  const world = createWorld(fernclashGame);
  for (const f of log.frames) world.step(f);
  const endProbe = world.probe() as { phase: string; score: Record<string, number> };
  t.check(`scripted duel reaches game over (${endProbe.score.p1}–${endProbe.score.p2})`, endProbe.phase === 'over');
  t.golden('full duel replay', world.hash());

  // 3. Determinism under the duel log.
  const report = checkDeterministic(() => createWorld(fernclashGame), log);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 4. NETPLAY: two peers, laggy + lossy loopback, full match, equal hashes.
  {
    const hub = new LoopbackHub({ delay: 3, dropEvery: 6 });
    const worldA = createWorld(fernclashGame);
    const worldB = createWorld(fernclashGame);
    const a = new LockstepSession({ world: worldA, transport: hub.connect(), localPlayer: 'p1', players: ['p1', 'p2'] });
    const b = new LockstepSession({ world: worldB, transport: hub.connect(), localPlayer: 'p2', players: ['p1', 'p2'] });
    let over = false;
    let spins = 0;
    for (; spins < 60 * 200 && !over; spins++) {
      a.tick(chaseActions(worldA, 'p1', ''));
      b.tick(spins % 50 < 14 ? [spins % 100 < 50 ? 'up' : 'down'] : []);
      hub.tick();
      over = fcState(worldA).phase === 'over' && fcState(worldB).phase === 'over';
    }
    const target = Math.max(a.frame, b.frame);
    for (let i = 0; i < 120 && (a.frame < target || b.frame < target); i++) {
      if (a.frame < target) a.tick([]);
      if (b.frame < target) b.tick([]);
      hub.tick();
    }
    t.check(`netplay duel finishes over a lossy network (${spins} spins, ${a.stalls} stalls)`, over);
    t.check(
      worldA.hash() === worldB.hash()
        ? `netplay peers agree bit-for-bit at frame ${a.frame}`
        : `NETPLAY DESYNC: ${worldA.hash()} vs ${worldB.hash()}`,
      worldA.hash() === worldB.hash(),
    );
  }

  // 5. Filmstrip artifact for the looks judgement.
  t.artifact(
    'duel-filmstrip.svg',
    renderFilmstrip(createWorld(fernclashGame), log.frames, {
      width: fernclashGame.width,
      height: fernclashGame.height,
      background: fernclashGame.background,
      panels: 8,
    }),
  );
}

// Sproutveil verify suite. A metroidvania's truth is its GATES: the whole run
// must be beatable with the intended ability order, and each gate must be
// impassable without its ability — proven here by simulating the best possible
// ungated maneuver against the real room geometry (an upper bound the movement
// envelope can't give, since apex gravity extends real jumps beyond it).

import { checkDeterministic, createWorld, createPlatformerState, stepPlatformer, PAD_NEUTRAL } from '@hayao';
import { configFor, parseRoom } from './logic';
import { createBot, FULL_RUN, type BotProbe } from './bot';
import { sproutveilGame, svState } from './game';
import type { VerifyContext } from '../../scripts/verify';

const DT = 1 / 60;

export default async function verify(t: VerifyContext) {
  // 1. Full run: Atrium → seed → boots → climb → dash gap → Heart, 0 deaths.
  const world = createWorld(sproutveilGame);
  const bot = createBot(FULL_RUN);
  const log: string[][] = [];
  let frames = -1;
  for (let f = 0; f < 7200; f++) {
    const p = world.probe() as unknown as BotProbe;
    if (p.won) {
      frames = f;
      break;
    }
    const a = bot(p);
    log.push(a);
    world.step(a);
  }
  const deaths = (world.probe() as { deaths: number }).deaths;
  t.check(
    frames >= 0 && deaths === 0 ? `full run reaches the Heart in ${(frames / 60).toFixed(1)}s, 0 deaths` : `full run ${frames < 0 ? 'DID NOT finish' : `finished with ${deaths} death(s)`}`,
    frames >= 0 && deaths === 0,
  );
  t.golden('full run', world.hash());

  // 2. Negative gate proof — Shaft ledge1 (top y=480) without the double jump:
  // best single jump from the floor below, sim-measured true maximum.
  {
    const room = parseRoom(1);
    const cfg = configFor([]); // no abilities
    const s = createPlatformerState(368 - 11, 608 - 28);
    s.onGround = true;
    let minY = s.y;
    stepPlatformer(s, { ...PAD_NEUTRAL, jumpPressed: true, jumpHeld: true }, DT, room.map, cfg);
    for (let i = 0; i < 120 && !s.onGround; i++) {
      stepPlatformer(s, { ...PAD_NEUTRAL, jumpHeld: true }, DT, room.map, cfg);
      minY = Math.min(minY, s.y);
    }
    const feetApex = minY + 28;
    t.check(`Shaft gate holds: best ungated jump apex (feet y=${feetApex.toFixed(0)}) never tops ledge1 (y=480)`, feetApex > 480);
  }

  // 3. Negative gate proof — Crown gap (x 704-864) with DJ but no dash: run at
  // full speed off the edge under the low ceiling, DJ at every chance.
  {
    const room = parseRoom(3);
    const cfg = configFor(['dj']);
    const s = createPlatformerState(500 - 11, 416 - 28);
    s.onGround = true;
    s.airJumpsLeft = 1;
    let djUsed = false;
    let died = false;
    let crossed = false;
    for (let i = 0; i < 300; i++) {
      const dj = !s.onGround && !djUsed && s.vy > -60;
      if (dj) djUsed = true;
      const ev = stepPlatformer(s, { ...PAD_NEUTRAL, moveX: 1, jumpHeld: true, jumpPressed: s.onGround || dj }, DT, room.map, cfg);
      if (s.onGround) djUsed = false;
      if (ev.died) {
        died = true;
        break;
      }
      if (s.x + 11 > 864 && s.y + 28 <= 416 + 4) {
        crossed = true;
        break;
      }
    }
    t.check(`Crown gate holds: DJ-only sprint ${died ? 'dies in the gap' : crossed ? 'CROSSES (gate broken!)' : 'never crosses'}`, !crossed);
  }

  // 4. Save/load: snapshot mid-run, mutate, restore → hash identical.
  {
    const w = createWorld(sproutveilGame);
    for (let f = 0; f < 120; f++) w.step(f % 3 ? ['right'] : ['right', 'jump']);
    const snap = w.snapshot();
    const h0 = w.hash();
    for (let f = 0; f < 60; f++) w.step(['left']);
    w.restore(snap);
    t.check('snapshot/restore round-trips to an identical state hash', w.hash() === h0);
  }

  // 5. Determinism over the full winning input log.
  const rep = checkDeterministic(() => createWorld(sproutveilGame), { frames: log });
  t.check(rep.ok ? 'sim is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);

  // Design telemetry.
  const s = svState(world);
  t.ok(`design note: abilities collected in order [${s.abilities.join(', ')}]`);
}

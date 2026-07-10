// Meadowhop verify — a lean, honest correctness spine for a prototype: the room
// is well-formed and provably climbable AS DATA, the controls actually respond,
// and the sim is deterministic. (The full Channel-4 feel suite lives in updrift;
// this is deliberately minimal — it's a controls/animation test rig.)

import { platformerReachable, levelIssues, type PadInput } from '@hayao';
import { LEVEL, JUMP_TILES, RUN_TILES, COINS, TILE_PX, freshMeadowState, stepMeadow, collectedCount } from './logic';
import type { VerifyContext } from '../../scripts/verify';

const hold = (moveX: number, jump = false): PadInput => ({ moveX, moveY: 0, jumpHeld: jump, jumpPressed: jump, dashPressed: false });

export default async function verify(t: VerifyContext) {
  // 1 — geometry as data: well-formed, and every coin + the goal is reachable
  //     within the jump envelope derived from the config.
  const li = levelIssues(LEVEL);
  t.check(li.length === 0 ? 'room data is well-formed' : `room: ${li[0]}`, li.length === 0);
  const reach = platformerReachable(LEVEL, { jumpTiles: JUMP_TILES, runTiles: RUN_TILES });
  t.check(
    reach.ok ? `goal + all ${COINS.length} coins reachable (${reach.reached} footholds · jump ${JUMP_TILES}↑ ${RUN_TILES}→)` : `unreachable: ${reach.unreachable.join(', ')}`,
    reach.ok,
  );

  // 2 — controls respond: holding right moves the hero and sweeps up a ground coin.
  const run = freshMeadowState();
  const x0 = run.pc.x;
  for (let f = 0; f < 80; f++) stepMeadow(run, hold(1), 1 / 60);
  t.check(run.pc.x > x0 + TILE_PX ? `→ ran ${Math.round(run.pc.x - x0)}px right` : 'right input did not move the hero', run.pc.x > x0 + TILE_PX);
  t.check(collectedCount(run) >= 1 ? 'running swept up a coin' : 'no coin collected while running', collectedCount(run) >= 1);

  // 3 — jump lifts the hero off the ground (rising = vy < 0).
  const jmp = freshMeadowState();
  let lifted = false;
  for (let f = 0; f < 12; f++) {
    stepMeadow(jmp, hold(0, true), 1 / 60);
    if (!jmp.pc.onGround && jmp.pc.vy < 0) lifted = true;
  }
  t.check(lifted ? 'jump lifts the hero off the ground' : 'jump never left the ground', lifted);

  // 4 — determinism: identical inputs → identical state.
  const a = freshMeadowState();
  const b = freshMeadowState();
  const seq = [hold(1), hold(1, true), hold(1, true), hold(-1), hold(0)];
  for (let f = 0; f < 150; f++) {
    const p = seq[f % seq.length];
    stepMeadow(a, p, 1 / 60);
    stepMeadow(b, p, 1 / 60);
  }
  const same = JSON.stringify(a.pc) === JSON.stringify(b.pc);
  t.check(same ? 'sim is deterministic (identical inputs → identical state)' : 'sim diverged on identical inputs', same);
}

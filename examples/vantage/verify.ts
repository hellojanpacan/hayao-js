// Vantage verify suite: a 1-ply greedy defender holds the greenhouses, the
// push-redirect mechanic is proven (the genre's soul), telegraphs are honest,
// doing nothing loses (threat is real), and the battle replays.

import { checkDeterministic, createWorld } from '@hayao';
import { canMoveTo, initialVt, occupant, push, stepVt, MECHS, type VtCmd, type VtState } from './logic';
import { vantageGame, vtState } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** Score a state from the defender's perspective (pending telegraphs resolved hypothetically). */
function score(s: VtState): number {
  let sc = 0;
  sc += s.buildings.reduce((a, g) => a + g.hp * 60, 0);
  sc -= s.bugs.length * 25;
  sc -= s.bugs.reduce((a, b) => a + b.hp * 5, 0);
  sc += s.mechs.reduce((a, m) => a + m.hp * 4, 0);
  for (const b of s.bugs) {
    if (!b.dir) continue;
    const who = occupant(s, b.x + b.dir.x, b.y + b.dir.y);
    if (who?.kind === 'building') sc -= 90;
    else if (who?.kind === 'mech') sc -= 10;
    else if (who?.kind === 'bug') sc += 12;
  }
  // Bugs closer to the north row are scarier.
  sc += s.bugs.reduce((a, b) => a + b.y, 0) * 2;
  return sc;
}

/** All command sequences a mech might take this activation: (move?) + (attack?). */
function mechOptions(s: VtState, mi: number): VtCmd[][] {
  const mech = s.mechs[mi];
  if (mech.hp <= 0) return [[]];
  const moves: { x: number; y: number }[] = [{ x: mech.x, y: mech.y }];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (canMove(s, mi, x, y)) moves.push({ x, y });
  const opts: VtCmd[][] = [];
  for (const mv of moves) {
    const base: VtCmd[] = mv.x === mech.x && mv.y === mech.y ? [] : [{ kind: 'cursor', x: mv.x, y: mv.y }, { kind: 'move' }];
    opts.push([...base]); // move only
    // Attack in each direction / artillery lobs along lines.
    const def = MECHS[mech.kind];
    if (def.ranged) {
      for (let d = 1; d < 8; d++)
        for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) {
          const tx = mv.x + ox;
          const ty = mv.y + oy;
          if (tx < 0 || ty < 0 || tx >= 8 || ty >= 8) continue;
          opts.push([...base, { kind: 'cursor', x: tx, y: ty }, { kind: 'attack' }]);
        }
    } else {
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const tx = mv.x + ox;
        const ty = mv.y + oy;
        if (tx < 0 || ty < 0 || tx >= 8 || ty >= 8) continue;
        opts.push([...base, { kind: 'cursor', x: tx, y: ty }, { kind: 'attack' }]);
      }
    }
  }
  return opts;
}

const canMove = (s: VtState, mi: number, x: number, y: number) => canMoveTo(s, s.mechs[mi], x, y);

/** Greedy defence: per mech, apply the best-scoring option on a cloned state. */
function defend(log?: VtCmd[]): VtState {
  const s = initialVt();
  for (let turn = 0; turn < 6 && !s.won && !s.dead; turn++) {
    for (let mi = 0; mi < s.mechs.length; mi++) {
      stepVt(s, { kind: 'select', mech: mi });
      log?.push({ kind: 'select', mech: mi });
      let best: VtCmd[] = [];
      let bestScore = -Infinity;
      for (const opt of mechOptions(s, mi)) {
        const clone = structuredClone(s);
        for (const cmd of opt) stepVt(clone, cmd);
        const sc = score(clone);
        if (sc > bestScore) {
          bestScore = sc;
          best = opt;
        }
      }
      for (const cmd of best) {
        stepVt(s, cmd);
        log?.push(cmd);
      }
    }
    stepVt(s, { kind: 'endTurn' });
    log?.push({ kind: 'endTurn' });
  }
  return s;
}

export default async function verify(t: VerifyContext) {
  // 1. The greedy defender holds the line.
  const end = defend();
  t.check(
    end.won ? `greedy defender survives all 5 turns with ${end.buildings.length}/3 greenhouses${end.perfect ? ' — PERFECT' : ''}` : 'defender LOST the vantage',
    end.won && end.buildings.length >= 2,
  );

  // 2. Push-redirect proof: a telegraphed blow lands where the bug was pushed
  //    FROM, not where the building is — pushing rewrites the future.
  {
    const s = initialVt();
    s.bugs = [{ x: 4, y: 1, hp: 3, dir: { x: 0, y: -1 } }]; // aiming at building (4,0)
    const hpBefore = s.buildings[1].hp;
    push(s, 4, 1, 1, 0); // shove it east
    stepVt(s, { kind: 'endTurn' });
    t.check('push redirects a telegraphed attack away from its target', s.buildings[1] && s.buildings[1].hp === hpBefore);
  }

  // 3. Bump damage: pushing into the rim or a blocker hurts.
  {
    const s = initialVt();
    s.bugs = [{ x: 0, y: 3, hp: 3, dir: null }];
    push(s, 0, 3, -1, 0); // into the west rim
    t.check('a blocked push bumps for 1 damage', s.bugs[0].hp === 2);
    s.bugs = [
      { x: 3, y: 3, hp: 3, dir: null },
      { x: 4, y: 3, hp: 3, dir: null },
    ];
    push(s, 3, 3, 1, 0);
    t.check('pushing into another unit bumps BOTH', s.bugs[0].hp === 2 && s.bugs[1].hp === 2);
  }

  // 4. Threat is real: a do-nothing defence loses greenhouses.
  {
    const s = initialVt();
    for (let i = 0; i < 6 && !s.dead && !s.won; i++) stepVt(s, { kind: 'endTurn' });
    const lost = s.dead || s.buildings.length < 3 || s.buildings.some((g) => g.hp < 2);
    t.check(`ignoring the bugs costs greenhouses (${s.dead ? 'all lost' : `${s.buildings.length}/3 left`})`, lost);
  }

  // 5. Determinism + golden over the greedy defence, driven via input actions.
  const cmds: VtCmd[] = [];
  defend(cmds);
  // Replay the command list directly against a fresh world's state and pin
  // the end-state hash (commands are the sim's own deterministic interface).
  const world = createWorld(vantageGame);
  for (const c of cmds) stepVt(vtState(world), c);
  world.step([]); // one tick so the frame counter moves
  t.golden('greedy defence end-state', world.hash());
  const rep = checkDeterministic(() => {
    const w = createWorld(vantageGame);
    for (const c of cmds) stepVt(vtState(w), c);
    return w;
  }, { frames: [[], []] });
  t.check(rep.ok ? 'defence replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

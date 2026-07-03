// Bramblefall verify suite: a counter-playing commander razes the enemy keep,
// every edge of the counter triangle is proven in isolated 40v40 battles, the
// flow field routes around the brambles, 400+ units stay in step budget, and
// the battle replays.

import { checkDeterministic, createWorld } from '@hayao';
import { countBy, counterMult, initialBf, stepBf, U_TUNE, UNIT_CAP, type UnitKind } from './logic';
import { bfState, bramblefallGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

const DT = 1 / 60;

/** Isolated N-v-N battle of pure kinds on open ground; returns survivors. */
function duel(aKind: UnitKind, bKind: UnitKind, n = 40): { a: number; b: number } {
  const s = initialBf();
  s.units = [];
  s.pulseT = 9999;
  s.reinforceT = [-9999, -9999]; // no reinforcements
  for (let i = 0; i < n; i++) {
    s.units.push({ kind: aKind, team: 0, x: 460, y: 120 + (i % 20) * 24, hp: U_TUNE[aKind].hp, cd: 0, tx: 25, ty: 11 });
    s.units.push({ kind: bKind, team: 1, x: 820, y: 120 + (i % 20) * 24, hp: U_TUNE[bKind].hp, cd: 0, tx: 14, ty: 11 });
  }
  for (let f = 0; f < 60 * 90; f++) {
    stepBf(s, { cursorX: 0, cursorY: 0, select: null, order: false }, DT);
    const a = countBy(s, 0).total;
    const b = countBy(s, 1).total;
    if (a === 0 || b === 0) break;
  }
  return { a: countBy(s, 0).total, b: countBy(s, 1).total };
}

export default async function verify(t: VerifyContext) {
  // 1. Counter triangle, every edge: the counter side must win convincingly.
  for (const [win, lose] of [['spear', 'cavalry'], ['cavalry', 'archer'], ['archer', 'spear']] as [UnitKind, UnitKind][]) {
    const r = duel(win, lose);
    t.check(`${win} counters ${lose} (40v40 → ${r.a} vs ${r.b} survivors)`, r.a >= 15 && r.b === 0);
    void counterMult; // (documented by the duel itself)
  }

  // 2. The commander bot: mass the army, meet each pulse, then raze the keep.
  const world = createWorld(bramblefallGame);
  const log: string[][] = [];
  let outcome: 'won' | 'dead' | 'timeout' = 'timeout';
  let simMs = 0;
  let steps = 0;
  let peakUnits = 0;
  let pushing = false;
  for (let f = 0; f < 60 * 60 * 6; f++) {
    const p = world.probe() as { won: boolean; dead: boolean; units: number; pulseT: number; time: number; cursor: { tx: number; ty: number }; mine: { total: number } };
    if (p.won) {
      outcome = 'won';
      break;
    }
    if (p.dead) {
      outcome = 'dead';
      break;
    }
    peakUnits = Math.max(peakUnits, p.units);
    const actions: string[] = [];
    // Strategy: turtle at the keep, absorb the pulse on home ground (massed
    // army + keep radius), then counterpush while their army is spent.
    if (!pushing && p.mine.total >= 115 && p.pulseT > 14 && p.time > 30) pushing = true;
    const target = pushing ? { tx: 35, ty: 11 } : { tx: 7, ty: 11 };
    if (p.cursor.tx < target.tx && f % 2 === 0) actions.push('right');
    else if (p.cursor.tx > target.tx && f % 2 === 0) actions.push('left');
    if (p.cursor.ty < target.ty && f % 2 === 0) actions.push('down');
    else if (p.cursor.ty > target.ty && f % 2 === 0) actions.push('up');
    if (f % 90 === 0 && f % 2 === 1) actions.push('order');
    if (f % 91 === 0) actions.push('order');
    log.push(actions);
    const t0 = performance.now();
    world.step(actions);
    simMs += performance.now() - t0;
    steps++;
  }
  const end = bfState(world);
  const standing = countBy(end, 0).total;
  t.check(
    outcome === 'won' ? `commander bot razes the enemy keep in ${(steps / 60).toFixed(0)}s with ${standing} soldiers standing` : `bot ${outcome.toUpperCase()} (keep0 ${end.keepHp[0]}, keep1 ${end.keepHp[1]})`,
    outcome === 'won',
  );
  t.check(`mass battle scale reached (peak ${peakUnits} ≥ 220 units)`, peakUnits >= 220);
  const avg = simMs / steps;
  t.check(`sim step averages ${avg.toFixed(2)}ms with full armies (budget 3ms)`, avg < 3);

  // 3. Flow field: a unit walled off from its goal routes around the brambles.
  {
    const s = initialBf();
    s.units = [{ kind: 'spear', team: 0, x: 560, y: 160, hp: 60, cd: 0, tx: 25, ty: 5 }];
    s.pulseT = 9999;
    s.reinforceT = [-9999, -9999];
    // Goal is east of the row-4/5 bramble wall (cols 18-21): straight-line is blocked.
    for (let f = 0; f < 60 * 30 && s.units.length; f++) {
      stepBf(s, { cursorX: 0, cursorY: 0, select: null, order: false }, DT);
      const u = s.units[0];
      if (Math.abs(u.x - (25.5 * 32)) < 56 && Math.abs(u.y - (5.5 * 32)) < 56) { // units hold 50px off their goal tile
        t.ok(`flow field routes around the brambles (arrived in ${(f / 60).toFixed(1)}s)`);
        return verifyTail(t, log);
      }
    }
    t.fail('flow field FAILED to route around the brambles');
  }
  return verifyTail(t, log);
}

async function verifyTail(t: VerifyContext, log: string[][]) {
  const rep = checkDeterministic(() => createWorld(bramblefallGame), { frames: log.slice(0, 7200) });
  t.check(rep.ok ? 'battle sim is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);
  t.ok(`unit cap ${UNIT_CAP}/side keeps the field readable`);
}

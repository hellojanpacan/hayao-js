// Thornspire verify suite: the climb is winnable-but-tense (win-rate window
// across seeds), DRAFTING MATTERS (a drafting bot beats a never-draft bot —
// the genre's core loop proven), intents resolve exactly as telegraphed, and
// a run replays hash-identically.

import { checkDeterministic, createWorld, layoutIssues, missingControlHints, Rng } from '@hayao';
import { currentIntent, initialTs, stepTs, CARDS, type TsState } from './logic';
import { thornspireGame, tsState, TS_INPUT_MAP } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** Greedy pilot: kill if lethal in hand, block incoming attacks, spend energy. */
function pilotMove(s: TsState, draftStrategy: 'draft' | 'skip'): { play: number; endTurn: boolean; pick: number; proceed: boolean } {
  if (s.draft) {
    if (draftStrategy === 'skip') return { play: -1, endTurn: false, pick: 3, proceed: false };
    // Draft priority: damage-per-cost, brace as a fallback.
    let best = 0;
    let bestScore = -1;
    s.draft.forEach((id, i) => {
      const c = CARDS[id];
      const score = ((c.dmg ?? 0) * (c.hits ?? 1) + (c.block ?? 0) * 0.6 + (c.draw ?? 0) * 3 + (c.vuln ?? 0) * 3) / c.cost;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    return { play: -1, endTurn: false, pick: best, proceed: false };
  }
  if (!s.fight) return { play: -1, endTurn: false, pick: -1, proceed: true };
  const f = s.fight;
  const intent = currentIntent(s)!;
  const incoming = intent.kind === 'attack' ? intent.value * (f.charged ? 2 : 1) : 0;
  const playable = f.hand.map((id, i) => ({ c: CARDS[id], i })).filter(({ c }) => c.cost <= f.energy);
  if (playable.length === 0) return { play: -1, endTurn: true, pick: -1, proceed: false };
  // Lethal first.
  const vulnMult = f.foeVuln > 0 ? 1.5 : 1;
  const lethal = playable.find(({ c }) => c.dmg && Math.floor(c.dmg * vulnMult) * (c.hits ?? 1) >= f.foeHp + f.foeBlock);
  if (lethal) return { play: lethal.i, endTurn: false, pick: -1, proceed: false };
  // Block up to the incoming hit, then attack (vuln setup preferred).
  if (incoming > f.block) {
    const blocker = playable.filter(({ c }) => c.block).sort((a, b) => (b.c.block ?? 0) - (a.c.block ?? 0))[0];
    if (blocker) return { play: blocker.i, endTurn: false, pick: -1, proceed: false };
  }
  const attacker = playable
    .filter(({ c }) => c.dmg)
    .sort((a, b) => (b.c.vuln ?? 0) - (a.c.vuln ?? 0) || (b.c.dmg ?? 0) * (b.c.hits ?? 1) - (a.c.dmg ?? 0) * (a.c.hits ?? 1))[0];
  if (attacker) return { play: attacker.i, endTurn: false, pick: -1, proceed: false };
  return { play: -1, endTurn: true, pick: -1, proceed: false };
}

/** Run one full climb headlessly; returns the end state. */
function runClimb(seed: number, strategy: 'draft' | 'skip', log?: string[][]): TsState {
  const world = createWorld(thornspireGame, seed);
  for (let i = 0; i < 4000; i++) {
    const s = tsState(world);
    if (s.won || s.dead) break;
    const mv = pilotMove(s, strategy);
    const actions: string[] = [];
    if (mv.play >= 0) actions.push(`play-${mv.play}`);
    else if (mv.pick >= 0) actions.push(mv.pick === 3 ? 'skip' : `pick-${mv.pick}`);
    else if (mv.endTurn) actions.push('end');
    else if (mv.proceed) actions.push('proceed');
    log?.push(actions, []);
    world.step(actions);
    world.step([]);
  }
  return tsState(world);
}

export default async function verify(t: VerifyContext) {
  // 1. Winnable-but-tense: drafting pilot wins most (not all) of 20 seeds.
  let wins = 0;
  for (let seed = 1; seed <= 20; seed++) if (runClimb(seed, 'draft').won) wins++;
  t.check(`drafting pilot wins ${wins}/20 seeds (target window 11–19: winnable but tense)`, wins >= 11 && wins <= 19);

  // 2. The core loop matters: never-drafting wins strictly less.
  let skipWins = 0;
  for (let seed = 1; seed <= 20; seed++) if (runClimb(seed, 'skip').won) skipWins++;
  t.check(`drafting beats the starter deck (${wins} vs ${skipWins} wins) — progression is real`, wins > skipWins);

  // 3. Intent honesty: the resolved damage always equals the telegraph.
  {
    const rng = new Rng(3);
    const s = initialTs();
    stepTs(s, { play: -1, endTurn: false, pick: -1, proceed: true }, rng);
    let honest = true;
    for (let turn = 0; turn < 30 && s.fight && !s.dead; turn++) {
      const intent = currentIntent(s)!;
      const expected = intent.kind === 'attack' ? Math.max(0, intent.value * (s.fight.charged ? 2 : 1) - s.fight.block) : 0;
      const hpBefore = s.hp;
      stepTs(s, { play: -1, endTurn: true, pick: -1, proceed: false }, rng);
      if (intent.kind === 'attack' && hpBefore - s.hp !== expected) honest = false;
    }
    t.check('intents resolve exactly as telegraphed (30 turns audited)', honest);
  }

  // 4. Readability on the title AND battle screens (the human-contact layer).
  {
    const w = createWorld(thornspireGame, 1);
    w.step([]);
    const title = layoutIssues(w.render());
    const unhinted = missingControlHints(w, TS_INPUT_MAP);
    w.step(['proceed']);
    w.step([]);
    const battle = layoutIssues(w.render());
    const all = [...title, ...battle];
    t.check(all.length === 0 ? 'layout lint: title + battle screens clean' : `layout lint: ${all[0]}`, all.length === 0);
    t.check(unhinted.length === 0 ? 'every control is explained on screen' : `unhinted: ${unhinted.join(', ')}`, unhinted.length === 0);
  }

  // 5. Determinism + golden over a full winning run.
  const log: string[][] = [];
  const end = runClimb(1, 'draft', log);
  t.check(`seed-1 reference run ${end.won ? 'wins' : 'LOSES'} (${end.fightsWon} fights, ${end.hp} hp left)`, end.won);
  const world = createWorld(thornspireGame, 1);
  for (const f of log) world.step(f);
  t.golden('seed-1 draft climb', world.hash());
  const rep = checkDeterministic(() => createWorld(thornspireGame, 1), { frames: log });
  t.check(rep.ok ? 'run replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

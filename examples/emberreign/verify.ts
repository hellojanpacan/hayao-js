// Emberreign verify suite: the reign is survivable by balanced judgement
// across many seeds, recklessness falls early (decisions matter), the content
// lints clean (every card double-edged, every arc terminating), all eight
// dooms fire their own ending, and a reign replays.

import { Rng, checkDeterministic, createWorld } from '@hayao';
import { choose, drawCard, eligible, initialEr, DECK, DOOMS, METERS, YEARS_TO_WIN, type ErState } from './logic';
import { emberreignGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** Balanced regent: pick the side that keeps the worst meter furthest from the ditches. */
function reign(seed: number, policy: 'balanced' | 'always-left'): ErState {
  const rng = new Rng(seed);
  const s = initialEr();
  drawCard(s, rng);
  for (let turn = 0; turn < YEARS_TO_WIN * 4 + 8 && !s.won && !s.dead; turn++) {
    let side: 'left' | 'right' = 'left';
    if (policy === 'balanced') {
      const card = DECK.find((c) => c.id === s.cardId)!;
      const danger = (fx: Record<string, number | string[] | undefined>) => {
        let worst = 0;
        for (const m of METERS) {
          const v = Math.max(0, Math.min(100, s.meters[m] + ((fx[m] as number) ?? 0)));
          worst = Math.max(worst, Math.abs(v - 50));
        }
        return worst;
      };
      side = danger(card.left.fx as never) <= danger(card.right.fx as never) ? 'left' : 'right';
    }
    choose(s, side, rng);
  }
  return s;
}

export default async function verify(t: VerifyContext) {
  // 1. Balanced judgement survives most reigns.
  let wins = 0;
  for (let seed = 1; seed <= 20; seed++) if (reign(seed, 'balanced').won) wins++;
  t.check(`the balanced regent survives ${wins}/20 reigns (floor 13)`, wins >= 13);

  // 2. Recklessness falls: always-left dies young on most seeds.
  let leftWins = 0;
  let leftSeasons = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const end = reign(seed, 'always-left');
    if (end.won) leftWins++;
    leftSeasons += end.season;
  }
  t.check(`always-left falls early (${leftWins}/20 wins, avg reign ${(leftSeasons / 20).toFixed(0)} seasons) — judgement matters`, leftWins < wins && leftWins <= 8);

  // 3. Content lint: every card double-edged (options differ), effects bounded,
  //    arc flags all resolvable (every needs-flag is set somewhere).
  {
    let flawed = 0;
    const settable = new Set<string>();
    for (const c of DECK) for (const fx of [c.left.fx, c.right.fx]) (fx.set ?? []).forEach((f) => settable.add(f));
    for (const c of DECK) {
      if (JSON.stringify(c.left.fx) === JSON.stringify(c.right.fx)) flawed++;
      for (const fx of [c.left.fx, c.right.fx]) for (const m of METERS) if (Math.abs((fx[m] as number) ?? 0) > 20) flawed++;
      if (c.needs && !settable.has(c.needs)) flawed++;
    }
    t.check(`content lints clean: ${DECK.length} cards double-edged, bounded, arcs resolvable (${flawed} flaws)`, flawed === 0);
  }

  // 4. Every doom fires its own ending.
  {
    let bad = 0;
    for (const m of METERS) {
      for (const edge of [0, 100]) {
        const rng = new Rng(3);
        const s = initialEr();
        drawCard(s, rng);
        s.meters[m] = edge === 0 ? 4 : 96;
        // Push the meter over with a synthetic nudge via repeated choices.
        for (let i = 0; i < 30 && !s.dead && !s.won; i++) {
          const card = DECK.find((c) => c.id === s.cardId)!;
          const dir = (fx: Record<string, unknown>) => ((fx[m] as number) ?? 0) * (edge === 0 ? -1 : 1);
          choose(s, dir(card.left.fx as never) >= dir(card.right.fx as never) ? 'left' : 'right', rng);
        }
        if (!s.dead || s.ending !== `${m}-${edge}`) bad++;
        if (s.ending && !DOOMS[s.ending]) bad++;
      }
    }
    t.check(`all 8 dooms reachable and correctly attributed (${bad} misfires)`, bad === 0);
  }

  // 5. The plot arc terminates both ways.
  {
    const rng = new Rng(5);
    const s = initialEr();
    s.flags = ['plot-ignored'];
    s.cardId = 'plot-springs';
    choose(s, 'left', rng);
    t.check('the ignored plot springs and clears its flag', !s.flags.includes('plot-ignored'));
    t.check('eligible() never re-offers spent once-cards', !eligible({ ...initialEr(), used: ['whisper'] } as ErState).some((c) => c.id === 'whisper'));
  }

  // 6. Determinism + golden through the input layer.
  const world = createWorld(emberreignGame, 2);
  const frames: string[][] = [];
  for (let i = 0; i < 20; i++) {
    const a = i % 3 === 0 ? 'left' : 'right';
    frames.push([a], []);
    world.step([a]);
    world.step([]);
  }
  t.golden('twenty seasons', world.hash());
  const rep = checkDeterministic(() => createWorld(emberreignGame, 2), { frames });
  t.check(rep.ok ? 'the reign replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

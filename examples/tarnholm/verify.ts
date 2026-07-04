// Tarnholm verify suite: islands are always buildable, the target is
// reachable by good play, adjacency IS the game (greedy beats random by a
// wide margin), scoring rules are honest, and a session replays.

import { Rng, checkDeterministic, createWorld, renderFilmstrip } from '@hayao';
import { bestPlacement, currentBuilding, genIsland, initialTh, place, placementScore, QUEUE, TARGET, tidx } from './logic';
import { tarnholmGame, thState } from './game';
import type { VerifyContext } from '../../scripts/verify';

function greedyGame(seed: number): { score: number; won: boolean } {
  const s = initialTh(new Rng(seed));
  while (currentBuilding(s) && !s.won) {
    const b = bestPlacement(s);
    if (!b) break;
    place(s, b.x, b.y);
  }
  return { score: s.score, won: s.won };
}

function randomGame(seed: number): { score: number } {
  const rng = new Rng(seed + 999);
  const s = initialTh(new Rng(seed));
  while (currentBuilding(s) && !s.won) {
    // Random legal cell.
    const legal: { x: number; y: number }[] = [];
    for (let y = 0; y < 10; y++) for (let x = 0; x < 14; x++) if (placementScore(s, currentBuilding(s)!, x, y) >= 0) legal.push({ x, y });
    if (!legal.length) break;
    const c = legal[rng.int(legal.length)];
    place(s, c.x, c.y);
  }
  return { score: s.score };
}

export default async function verify(t: VerifyContext) {
  // 1. Island fairness across 50 seeds: enough grass to place the full queue.
  let cramped = 0;
  for (let seed = 1; seed <= 50; seed++) {
    const terr = genIsland(new Rng(seed));
    if (terr.filter((c) => c === 'grass').length < QUEUE.length + 10) cramped++;
  }
  t.check(`50 islands leave room for the whole build queue (${cramped} cramped)`, cramped === 0);

  // 2. The target is reachable by good play on most islands.
  let wins = 0;
  const scores: number[] = [];
  for (let seed = 1; seed <= 20; seed++) {
    const g = greedyGame(seed);
    scores.push(g.score);
    if (g.won) wins++;
  }
  t.check(`greedy placer reaches ${TARGET} renown on ${wins}/20 islands (floor 14)`, wins >= 14);

  // 3. Adjacency IS the game: greedy beats random placement decisively.
  let greedySum = 0;
  let randomSum = 0;
  for (let seed = 1; seed <= 10; seed++) {
    greedySum += greedyGame(seed).score;
    randomSum += randomGame(seed).score;
  }
  t.check(`placement skill matters (greedy avg ${(greedySum / 10).toFixed(0)} vs random avg ${(randomSum / 10).toFixed(0)}, ≥1.5×)`, greedySum > randomSum * 1.5);

  // 4. Scoring honesty: a hut ring scores exactly by its neighbours.
  {
    const s = initialTh(new Rng(4));
    // Clear a known 3×3 of grass for the audit.
    for (let y = 4; y <= 6; y++) for (let x = 6; x <= 8; x++) s.terrain[tidx(x, y)] = 'grass';
    s.queueIdx = 0;
    place(s, 7, 5); // first hut: no neighbours → the base +1
    t.check('a lone hut scores its base point', s.lastGain === 1);
    s.built[tidx(6, 5)] = null; // (ensure clean sides)
    QUEUE[s.queueIdx] === 'hut'; // queue[1] is a hut
    place(s, 6, 5); // beside one hut → 1 + 3
    t.check(`a second hut scores base + adjacency (${s.lastGain} = 4)`, s.lastGain === 4);
  }

  // 5. Determinism + golden over a scripted session.
  const world = createWorld(tarnholmGame, 6);
  const frames: string[][] = [];
  const drive = (a: string) => {
    frames.push([a], []);
    world.step([a]);
    world.step([]);
  };
  // Place a few buildings wherever the cursor lands after set walks.
  for (const mv of ['build', 'right', 'build', 'down', 'build', 'right', 'right', 'build', 'up', 'build']) drive(mv);
  t.golden('scripted settlement', world.hash());
  const rep = checkDeterministic(() => createWorld(tarnholmGame, 6), { frames });
  t.check(rep.ok ? 'the settlement replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);

  // 6. Filmstrip of a greedy settlement, for the looks judgement (does the
  //    island map read?). The cosmetic art is a pure projection of state.
  {
    const w = createWorld(tarnholmGame, 6);
    const log: string[][] = [];
    const press = (a: string) => { log.push([a]); w.step([a]); log.push([]); w.step([]); };
    for (let n = 0; n < QUEUE.length; n++) {
      const s = thState(w);
      if (s.won || s.done) break;
      const b = bestPlacement(s);
      if (!b) break;
      while (s.cursor.x < b.x) press('right');
      while (s.cursor.x > b.x) press('left');
      while (s.cursor.y < b.y) press('down');
      while (s.cursor.y > b.y) press('up');
      press('build');
    }
    t.artifact('settlement-filmstrip.svg', renderFilmstrip(createWorld(tarnholmGame, 6), log, { width: 1280, height: 720, background: tarnholmGame.background, panels: 8 }));
  }
}

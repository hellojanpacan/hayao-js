// Hollowdeep verify suite: procgen connectivity proven across 50 seeds
// (entry→stairs and every item reachable), seeded layouts reproduce exactly,
// a full-knowledge explorer bot proves runs are winnable, and turns replay.

import { Rng, checkDeterministic, createWorld, layoutIssues, missingControlHints } from '@hayao';
import { floorHash, genFloor, idx, reachable, COLS, ROWS, FLOORS, type Floor, type HdState } from './logic';
import { hdState, hollowdeepGame, HD_INPUT_MAP } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** BFS next-step from (fx,fy) toward (tx,ty); null if unreachable/arrived. */
function bfsStep(f: Floor, fx: number, fy: number, tx: number, ty: number): 'left' | 'right' | 'up' | 'down' | null {
  if (fx === tx && fy === ty) return null;
  const prev = new Int32Array(COLS * ROWS).fill(-1);
  const start = idx(fx, fy);
  prev[start] = start;
  const q = [start];
  const goal = idx(tx, ty);
  for (let head = 0; head < q.length && prev[goal] === -1; head++) {
    const cur = q[head];
    const cx = cur % COLS;
    const cy = (cur / COLS) | 0;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + ox;
      const ny = cy + oy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const ni = idx(nx, ny);
      if (prev[ni] !== -1 || f.cells[ni] === 1) continue;
      prev[ni] = cur;
      q.push(ni);
    }
  }
  if (prev[goal] === -1) return null;
  let cur = goal;
  while (prev[cur] !== start) cur = prev[cur];
  const dx = (cur % COLS) - fx;
  const dy = ((cur / COLS) | 0) - fy;
  return dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
}

/** Full-knowledge explorer: quaff when hurt, grab loot, head for the stairs. */
function explore(seed: number, log?: string[][]): HdState {
  const world = createWorld(hollowdeepGame, seed);
  for (let turn = 0; turn < 900; turn++) {
    const s = hdState(world);
    if (s.won || s.dead) break;
    const f = s.floors[s.depth];
    let mv: string;
    if (s.hp <= 10 && s.potions > 0) mv = 'quaff';
    else {
      // Priority: sword → nearest potion (if hurt or hoarding < 2) → stairs.
      let target = f.stairs;
      if (f.sword) target = f.sword;
      else if (f.potions.length && s.potions < 2) {
        target = f.potions.reduce((best, p) => (Math.abs(p.x - s.x) + Math.abs(p.y - s.y) < Math.abs(best.x - s.x) + Math.abs(best.y - s.y) ? p : best));
      }
      // Attack an adjacent monster rather than walking around it.
      const adj = f.monsters.find((m) => Math.abs(m.x - s.x) + Math.abs(m.y - s.y) === 1);
      if (adj) mv = adj.x > s.x ? 'right' : adj.x < s.x ? 'left' : adj.y > s.y ? 'down' : 'up';
      else mv = bfsStep(f, s.x, s.y, target.x, target.y) ?? 'wait';
    }
    log?.push([mv], []);
    world.step([mv]);
    world.step([]);
  }
  return hdState(world);
}

export default async function verify(t: VerifyContext) {
  // 1. Connectivity across 50 seeds × 3 floors: stairs + every item reachable.
  let broken = 0;
  for (let seed = 1; seed <= 50; seed++) {
    const rng = new Rng(seed);
    for (let d = 0; d < FLOORS; d++) {
      const f = genFloor(rng, d);
      if (!reachable(f, f.entry.x, f.entry.y, f.stairs.x, f.stairs.y)) broken++;
      for (const p of f.potions) if (!reachable(f, f.entry.x, f.entry.y, p.x, p.y)) broken++;
      if (f.sword && !reachable(f, f.entry.x, f.entry.y, f.sword.x, f.sword.y)) broken++;
    }
  }
  t.check(`procgen connectivity: 50 seeds × 3 floors, stairs + all loot reachable (${broken} broken)`, broken === 0);

  // 2. Seeded reproducibility: same seed → identical layout; new seed → new dungeon.
  {
    const a = new Rng(7);
    const b = new Rng(7);
    const c = new Rng(8);
    const ha = floorHash(genFloor(a, 0));
    t.check('same seed regenerates the identical floor', ha === floorHash(genFloor(b, 0)));
    t.check('a different seed digs a different hollow', ha !== floorHash(genFloor(c, 0)));
  }

  // 3. Winnability: the explorer bot claims the amulet on the default seed…
  const log: string[][] = [];
  const run = explore(1, log);
  t.check(
    run.won ? `explorer bot claims the amulet on seed 1 (${run.turns} turns, ${run.kills} slain, hp ${run.hp} left)` : `bot ${run.dead ? 'DIED' : 'stalled'} on seed 1 at floor ${run.depth + 1}`,
    run.won,
  );

  // …and on most seeds (procgen difficulty is fair, not just connected).
  let wins = 0;
  for (let seed = 2; seed <= 11; seed++) if (explore(seed).won) wins++;
  t.check(`explorer bot wins ${wins}/10 random seeds (fairness floor: 6)`, wins >= 6);

  // 4. Readability: legend + glyph HUD + controls, verified on screen.
  {
    const w = createWorld(hollowdeepGame, 1);
    w.step(['wait']);
    const issues = layoutIssues(w.render());
    t.check(issues.length === 0 ? 'layout lint: dungeon screen clean' : `layout lint: ${issues[0]}`, issues.length === 0);
    const unhinted = missingControlHints(w, HD_INPUT_MAP);
    t.check(unhinted.length === 0 ? 'every control is explained on screen' : `unhinted: ${unhinted.join(', ')}`, unhinted.length === 0);
  }

  // 5. Determinism over the winning run's turn log.
  const rep = checkDeterministic(() => createWorld(hollowdeepGame, 1), { frames: log });
  t.check(rep.ok ? 'dungeon sim is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

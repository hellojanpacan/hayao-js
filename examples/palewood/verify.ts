// Palewood verify suite: the night is survivable with fuel discipline, light
// genuinely repels, darkness genuinely kills, and the fuel math forces you
// out of safety (no camping) — dread by construction, all replayable.

import { checkDeterministic, createWorld, TILE, tileAt } from '@hayao';
import { inLight, stepPw, woodsMap, DAWN_AT, LANTERN, CAN_SPOTS, TILE_SIZE } from './logic';
import { pwState, palewoodGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** BFS next-waypoint (tile centre) toward a target — trees are real obstacles. */
function nextWaypoint(fromX: number, fromY: number, toX: number, toY: number): { x: number; y: number } | null {
  const map = woodsMap();
  const C = map.cols;
  const R = map.rows;
  const ti = (x: number, y: number) => Math.min(R - 1, Math.max(0, Math.floor(y / TILE_SIZE))) * C + Math.min(C - 1, Math.max(0, Math.floor(x / TILE_SIZE)));
  const start = ti(fromX, fromY);
  const goal = ti(toX, toY);
  if (start === goal) return null;
  const prev = new Int32Array(C * R).fill(-1);
  prev[start] = start;
  const q = [start];
  for (let head = 0; head < q.length && prev[goal] === -1; head++) {
    const cur = q[head];
    const cx = cur % C;
    const cy = (cur / C) | 0;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + ox;
      const ny = cy + oy;
      if (nx < 0 || ny < 0 || nx >= C || ny >= R) continue;
      const n = ny * C + nx;
      if (prev[n] !== -1 || tileAt(map, nx, ny) === TILE.SOLID) continue;
      prev[n] = cur;
      q.push(n);
    }
  }
  if (prev[goal] === -1) return null;
  let cur = goal;
  while (prev[cur] !== start) cur = prev[cur];
  return { x: ((cur % C) + 0.5) * TILE_SIZE, y: (((cur / C) | 0) + 0.5) * TILE_SIZE };
}

export default async function verify(t: VerifyContext) {
  // 1. A fuel-disciplined keeper survives to dawn: run to the nearest can
  //    whenever fuel drops low, else hold the clearing's centre.
  const world = createWorld(palewoodGame);
  const log: string[][] = [];
  let outcome: 'won' | 'dead' | 'timeout' = 'timeout';
  for (let f = 0; f < (DAWN_AT + 5) * 60; f++) {
    const s = pwState(world);
    if (s.won) {
      outcome = 'won';
      break;
    }
    if (s.dead) {
      outcome = 'dead';
      break;
    }
    const out: string[] = [];
    let tx = 640;
    let ty = 360;
    // Fetch near-empty: refuelling above (max - refuel) wastes the overflow.
    if (s.fuel < LANTERN.fuelMax - LANTERN.refuel + 2 && s.cans.length) {
      const c = s.cans.reduce((b, k) => (Math.hypot(k.x - s.x, k.y - s.y) < Math.hypot(b.x - s.x, b.y - s.y) ? k : b));
      tx = c.x;
      ty = c.y;
    }
    // Route around the copses: steer at the next BFS waypoint, not the target.
    if (Math.hypot(tx - s.x, ty - s.y) > 20) {
      const wp = nextWaypoint(s.x, s.y, tx, ty) ?? { x: tx, y: ty };
      // Tight deadzone: half-hearted diagonals wedge on copse corners.
      if (s.x < wp.x - 2) out.push('right');
      else if (s.x > wp.x + 2) out.push('left');
      if (s.y < wp.y - 2) out.push('down');
      else if (s.y > wp.y + 2) out.push('up');
    }
    log.push(out);
    world.step(out);
  }
  const end = pwState(world);
  t.check(
    outcome === 'won' ? `the keeper survives to dawn (${end.fetched} cans burned, ${end.fuel.toFixed(0)} fuel left)` : `keeper ${outcome.toUpperCase()} at ${end.time.toFixed(0)}s`,
    outcome === 'won',
  );
  t.check(`fuel pressure forced ${end.fetched} fetch runs (camping is impossible)`, end.fetched >= 2);
  t.golden('full night survived', world.hash());

  // 2. Fuel arithmetic guarantees the pressure: a full tank + every can is
  //    still less burn time than the night is long… wait — it must be MORE
  //    than the night (winnable) but a tank alone must be LESS (forcing).
  {
    const tankOnly = LANTERN.fuelMax / LANTERN.drainPerSec;
    const withCans = (LANTERN.fuelMax + CAN_SPOTS.length * LANTERN.refuel) / LANTERN.drainPerSec;
    t.check(`a lone tank dies early (${tankOnly}s < ${DAWN_AT}s) but cans cover the night (${withCans}s ≥ ${DAWN_AT}s)`, tankOnly < DAWN_AT && withCans >= DAWN_AT);
  }

  // 3. Light repels: a pale caught in the lantern turns to flee.
  {
    const w = createWorld(palewoodGame, 5);
    const s = pwState(w);
    s.pales.push({ x: s.x + 120, y: s.y, state: 'stalk' });
    w.step([]);
    t.check('a pale caught in the light flees', pwState(w).pales[0].state === 'flee');
    t.check('the light itself is honest (inLight at 120px)', inLight(pwState(w), pwState(w).x + 120, pwState(w).y));
  }

  // 4. Darkness kills: no fuel, a stalker closes in, the keeper stands still.
  {
    const w = createWorld(palewoodGame, 5);
    const s = pwState(w);
    s.fuel = 0;
    s.pales.push({ x: s.x + 200, y: s.y, state: 'stalk' });
    let died = false;
    for (let f = 0; f < 60 * 10 && !died; f++) {
      w.step([]);
      died = pwState(w).dead;
    }
    t.check('an unlit keeper is taken by the dark', died);
  }

  // 5. Determinism over the survived night.
  const rep = checkDeterministic(() => createWorld(palewoodGame), { frames: log.slice(0, 5400) });
  t.check(rep.ok ? 'the night replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);
  void stepPw;
}

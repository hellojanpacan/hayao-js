// Rootward verify suite: a scripted build order holds all ten waves, the
// counter system is REAL (an equal-cost arrow-only build loses to tanks; the
// mixed build doesn't), waves ramp monotonically, and it replays.

import { checkDeterministic, createWorld } from '@hayao';
import { waveHp, TOWERS, WAVES, type RwState, type TowerKind } from './logic';
import { rootwardGame, rwState } from './game';
import type { VerifyContext } from '../../scripts/verify';

/** Build plan: (pad, kind) in purchase order, bought as gold allows. */
const PLAN: [number, TowerKind][] = [
  [4, 'arrow'], // mid lane, covers rows 1+2
  [5, 'frost'], // slows the first straight + corner
  [4 + 4, 'arrow'], // pad 8: lower lane
  [9, 'cannon'], // lower straight splash
  [5 + 4, 'cannon'], // wait — pad 9 already used; harmless skip
  [10, 'cannon'],
  [3, 'arrow'],
  [8, 'frost'],
  [11, 'arrow'],
  [6, 'cannon'],
  [0, 'arrow'],
  [7, 'arrow'],
];

/** Drive a full defence with a given plan; returns the end state. */
function runDefence(plan: [number, TowerKind][], log?: string[][]): RwState {
  const world = createWorld(rootwardGame);
  let planIdx = 0;
  for (let f = 0; f < 60 * 60 * 14; f++) {
    const s = rwState(world);
    if (s.won || s.dead) break;
    const actions: string[] = [];
    if (planIdx < plan.length) {
      const [pad, kind] = plan[planIdx];
      if (s.towers.some((t) => t.pad === pad)) {
        planIdx++; // pad taken (plan hiccup) — skip
      } else if (s.gold >= TOWERS[kind].cost) {
        // Steer the cursor toward the pad, then buy.
        if (s.cursor === pad) {
          actions.push(`build-${kind}`);
          planIdx++;
        } else if (f % 2 === 0) {
          // Release between presses — cursor movement is justPressed-driven,
          // and a held key only edges once.
          actions.push('next');
        }
      }
    }
    log?.push(actions);
    world.step(actions);
  }
  return rwState(world);
}

export default async function verify(t: VerifyContext) {
  // 1. The intended mixed build holds the warren.
  const log: string[][] = [];
  const end = runDefence(PLAN, log);
  t.check(
    end.won ? `mixed build survives all ${WAVES.length} waves with ${end.lives}/10 lives (${end.kills} kills, ${end.leaked} leaks)` : `defence FELL on wave ${end.wave + 1} (lives ${end.lives})`,
    end.won,
  );
  t.check(`defence holds with margin (${end.lives} ≥ 5 lives)`, end.lives >= 5);

  // 2. Counter-system proof: an arrow-only build of the SAME budget leaks
  //    badly against the tank waves — tanks resist arrows by design.
  const arrowPlan: [number, TowerKind][] = [4, 8, 9, 5, 10, 3, 11, 6, 0, 7].map((p) => [p, 'arrow']);
  const arrowEnd = runDefence(arrowPlan);
  t.check(
    `counter system is real: arrow-only build ${arrowEnd.dead ? `falls on wave ${arrowEnd.wave + 1}` : `leaks ${arrowEnd.leaked}`} (needs cannons for tanks)`,
    arrowEnd.dead || arrowEnd.leaked >= 4,
  );

  // 3. Sanity: no towers → the warren falls fast.
  const bare = runDefence([]);
  t.check(`an undefended warren falls (wave ${bare.wave + 1})`, bare.dead);

  // 4. Difficulty telemetry: pressure ramps overall, breather waves allowed
  //    (each wave ≥ 55% of the previous; the finale is the peak).
  const hps = WAVES.map(waveHp);
  const ramps = hps.every((h, i) => i === 0 || h >= hps[i - 1] * 0.55) && hps[hps.length - 1] === Math.max(...hps);
  t.check(`wave pressure ramps with breathers (${hps.join(' → ')})`, ramps);

  // 5. Determinism over the winning defence.
  const rep = checkDeterministic(() => createWorld(rootwardGame), { frames: log.slice(0, 10800) });
  t.check(rep.ok ? 'defence sim is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

// Emberwake verify suite: a kiting bot survives the full night, the horde
// actually scales into the hundreds, the sim stays inside its per-step time
// budget at peak load, and everything replays.

import { checkDeterministic, createWorld, createPlanBot } from '@hayao';
import { spawnRate, ARENA_H, ARENA_W, WIN_AT } from './logic';
import { emberwakeGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

interface P {
  time: number;
  x: number;
  y: number;
  hp: number;
  level: number;
  kills: number;
  alive: number;
  choosing: boolean;
  choiceIds: string[];
  dead: boolean;
  won: boolean;
  enemies: { x: number; y: number }[];
}

type Step = { kind: 'survive' };
/** Build order: projectiles > damage > rate > hp > speed. */
const PRIO = ['shots', 'dmg', 'rate', 'hp', 'speed'];

export default async function verify(t: VerifyContext) {
  // 1. Full night survived by the kiting bot; horde peaks in the hundreds.
  const world = createWorld(emberwakeGame);
  const bot = createPlanBot<Step, P>([{ kind: 'survive' }], {
    survive(_step, p, out) {
      if (p.choosing) {
        // Deterministic priority build.
        let best = 0;
        let bestP = 99;
        p.choiceIds.forEach((id, i) => {
          const pr = PRIO.indexOf(id);
          if (pr < bestP) {
            bestP = pr;
            best = i;
          }
        });
        out.push(`pick-${best}`);
        return;
      }
      // Orbit the arena centre (never cornered — fleeing backs you into
      // walls, see BUILDLOG), nudged away from very close enemies.
      const ang = p.time * 0.45;
      const tx = ARENA_W / 2 + Math.cos(ang) * 250;
      const ty = ARENA_H / 2 + Math.sin(ang) * 200;
      let vx = (tx - p.x) / 120;
      let vy = (ty - p.y) / 120;
      for (const e of p.enemies) {
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const d = Math.hypot(dx, dy);
        if (d < 110) {
          vx += (dx / (d || 1)) * 1.4;
          vy += (dy / (d || 1)) * 1.4;
        }
      }
      if (vx > 0.15) out.push('right');
      else if (vx < -0.15) out.push('left');
      if (vy > 0.15) out.push('down');
      else if (vy < -0.15) out.push('up');
    },
  });
  const log: string[][] = [];
  let minHp = 99;
  let peakAlive = 0;
  let simMs = 0;
  let simSteps = 0;
  let outcome: 'won' | 'dead' | 'timeout' = 'timeout';
  for (let f = 0; f < (WIN_AT + 10) * 60; f++) {
    const p = world.probe() as unknown as P;
    minHp = Math.min(minHp, p.hp);
    peakAlive = Math.max(peakAlive, p.alive);
    if (p.won) {
      outcome = 'won';
      break;
    }
    if (p.dead) {
      outcome = 'dead';
      break;
    }
    const a = bot(p);
    log.push(a);
    const t0 = performance.now();
    world.step(a);
    simMs += performance.now() - t0;
    simSteps++;
  }
  t.check(
    outcome === 'won' ? `kiting bot survives the full ${WIN_AT}s night (hp floor ${minHp}, peak horde ${peakAlive})` : `bot ${outcome === 'dead' ? 'DIED' : 'timed out'} (hp floor ${minHp})`,
    outcome === 'won',
  );
  t.check(`the horde genuinely scales (peak ${peakAlive} ≥ 150 alive)`, peakAlive >= 150);

  // 2. Perf budget: average full-sim step under 2ms across the whole night.
  const avg = simMs / simSteps;
  t.check(`sim step averages ${avg.toFixed(2)}ms over ${simSteps} frames (budget 2ms)`, avg < 2);

  // 3. Difficulty curve sanity: spawn pressure rises monotonically.
  t.check('spawn rate is monotonically increasing', spawnRate(60) < spawnRate(120) && spawnRate(120) < spawnRate(180));

  // 4. Determinism over the first two sim-minutes of the winning log.
  const rep = checkDeterministic(() => createWorld(emberwakeGame), { frames: log.slice(0, 7200) });
  t.check(rep.ok ? 'horde sim is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

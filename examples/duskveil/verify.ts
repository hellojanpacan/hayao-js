// Duskveil verify suite: a predictive dodge bot clears all three phases (the
// fairness proof — if a lookahead dodger can't survive a pattern, humans
// can't), density reaches true bullet-hell counts, the sim holds its step
// budget at peak, and the fight replays.

import { checkDeterministic, createWorld, layoutIssues, missingControlHints } from '@hayao';
import { dvState, duskveilGame, DV_INPUT_MAP } from './game';
import { P_TUNE, W, H } from './logic';
import type { VerifyContext } from '../../scripts/verify';

/** Candidate moves: 8 directions + hold, as action arrays. */
const MOVES: string[][] = [[], ['left'], ['right'], ['up'], ['down'], ['left', 'up'], ['left', 'down'], ['right', 'up'], ['right', 'down']];
const HORIZON = 26; // frames of linear bullet prediction
const DT = 1 / 60;

export default async function verify(t: VerifyContext) {
  const world = createWorld(duskveilGame);
  const log: string[][] = [];
  let peakBullets = 0;
  let simMs = 0;
  let steps = 0;
  let outcome: 'won' | 'dead' | 'timeout' = 'timeout';

  for (let f = 0; f < 150 * 60; f++) {
    const s = dvState(world);
    if (s.won) {
      outcome = 'won';
      break;
    }
    if (s.dead) {
      outcome = 'dead';
      break;
    }
    peakBullets = Math.max(peakBullets, s.bullets.length);

    // Consider only bullets that can threaten within the horizon.
    const near = s.bullets.filter((b) => (b.x - s.x) * (b.x - s.x) + (b.y - s.y) * (b.y - s.y) < 340 * 340);
    let bestMove: string[] = [];
    let bestScore = -Infinity;
    for (const mv of MOVES) {
      const mx = (mv.includes('right') ? 1 : 0) - (mv.includes('left') ? 1 : 0);
      const my = (mv.includes('down') ? 1 : 0) - (mv.includes('up') ? 1 : 0);
      const il = Math.hypot(mx, my) || 1;
      let px = s.x;
      let py = s.y;
      let minD = Infinity;
      for (let h = 1; h <= HORIZON; h++) {
        px = Math.min(W - 24, Math.max(24, px + (mx / il) * P_TUNE.speed * DT));
        py = Math.min(H - 24, Math.max(24, py + (my / il) * P_TUNE.speed * DT));
        for (const b of near) {
          const bx = b.x + b.vx * DT * h;
          const by = b.y + b.vy * DT * h;
          const d = Math.hypot(bx - px, by - py);
          if (d < minD) minD = d;
        }
      }
      // Prefer clearance, then staying under where the boss WILL be when the
      // shots arrive (lead its sway ~0.8s). Clearance saturates at 70px.
      const lead = W / 2 + Math.sin((s.time + 0.8) * 0.42) * 330;
      const clearance = Math.min(minD, 70);
      const uptime = -Math.abs(px - lead) / 300;
      const posture = -Math.abs(py - (H - 150)) / 260;
      const score = clearance * 1.0 + uptime * 16 + posture * 7;
      if (score > bestScore) {
        bestScore = score;
        bestMove = mv;
      }
    }
    log.push(bestMove);
    const t0 = performance.now();
    world.step(bestMove);
    simMs += performance.now() - t0;
    steps++;
  }

  const s = dvState(world);
  t.check(
    outcome === 'won' ? `dodge bot lifts the veil in ${(steps / 60).toFixed(1)}s using ${s.deaths}/${P_TUNE.lives} deaths (graze ${s.graze})` : `bot ${outcome.toUpperCase()} at phase ${s.phase + 1} (deaths ${s.deaths})`,
    outcome === 'won',
  );
  t.check(`patterns are survivable with margin (deaths ${s.deaths} ≤ 2)`, s.deaths <= 2);
  t.check(`true bullet-hell density (peak ${peakBullets} ≥ 350 live bullets)`, peakBullets >= 350);
  t.golden('full fight', world.hash());
  const avg = simMs / steps;
  t.check(`sim step averages ${avg.toFixed(2)}ms at peak density (budget 2.5ms)`, avg < 2.5);

  // Readability: the veil must introduce itself (the win line pays off the
  // boss named in the HUD) and the controls must be on screen.
  {
    const w3 = createWorld(duskveilGame);
    w3.step([]);
    const issues = layoutIssues(w3.render());
    t.check(issues.length === 0 ? 'layout lint: fight screen clean' : `layout lint: ${issues[0]}`, issues.length === 0);
    const blob = w3.render().filter((c) => c.kind === 'text').map((c) => (c as { text: string }).text.toLowerCase()).join(' ');
    t.check('the boss is NAMED on screen (the ending pays it off)', blob.includes('duskveil'));
    const unhinted = missingControlHints(w3, DV_INPUT_MAP);
    t.check(unhinted.length === 0 ? 'every control is explained on screen' : `unhinted: ${unhinted.join(', ')}`, unhinted.length === 0);
  }

  // 5. No safe camp: a ship parked at the bottom rim must still be reachable
  //    by the aimed patterns (the fan tracks the player wherever they hide).
  {
    const w2 = createWorld(duskveilGame);
    const s2 = dvState(w2);
    for (let f = 0; f < 60 * 15 && s2.deaths === 0; f++) w2.step(f % 2 ? ['down'] : ['down', 'right']);
    t.check(`camping the bottom rim is punished (hit after ${(dvState(w2).time).toFixed(1)}s parked)`, dvState(w2).deaths >= 1);
  }

  // Determinism across the first minute of the fight.
  const rep = checkDeterministic(() => createWorld(duskveilGame), { frames: log.slice(0, 3600) });
  t.check(rep.ok ? 'bullet sim is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

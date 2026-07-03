// Cadence Hollow verify suite: a beat-perfect dancer reaches the door, the
// timing window is honest to the frame, off-beat play is punished, foes are
// beat-quantized, and the whole dance replays — proving rhythm and
// determinism coexist when THE BEAT IS SIM TIME.

import { checkDeterministic, createWorld } from '@hayao';
import { beatTick, initialCd, onBeat, tryMove, BEAT_WINDOW, FRAMES_PER_BEAT } from './logic';
import { cadenceGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

interface P {
  frame: number;
  x: number;
  y: number;
  hp: number;
  combo: number;
  bestCombo: number;
  kills: number;
  foes: { kind: string; x: number; y: number }[];
  won: boolean;
  dead: boolean;
}

export default async function verify(t: VerifyContext) {
  // 1. A beat-perfect dancer (greedy pathing, acting exactly on beat lines)
  //    reaches the gold door alive.
  const world = createWorld(cadenceGame);
  const log: string[][] = [];
  let outcome: 'won' | 'dead' | 'timeout' = 'timeout';
  for (let f = 0; f < FRAMES_PER_BEAT * 400; f++) {
    const p = world.probe() as unknown as P;
    if (p.won) {
      outcome = 'won';
      break;
    }
    if (p.dead) {
      outcome = 'dead';
      break;
    }
    const actions: string[] = [];
    if (f % FRAMES_PER_BEAT === 0) {
      // Dance step: fight an adjacent foe, else greedy-step toward the exit
      // (13,7), dodging into open cells.
      const adj = p.foes.find((foe) => Math.abs(foe.x - p.x) + Math.abs(foe.y - p.y) === 1);
      let mv: string;
      if (adj) mv = adj.x > p.x ? 'right' : adj.x < p.x ? 'left' : adj.y > p.y ? 'down' : 'up';
      else mv = bfsMove(p.x, p.y) ?? 'right';
      actions.push(mv);
    }
    log.push(actions);
    world.step(actions);
  }
  const end = world.probe() as unknown as P;
  t.check(
    outcome === 'won' ? `the dancer reaches the door (best combo ${end.bestCombo}, ${end.kills} slain, hp ${end.hp})` : `dancer ${outcome.toUpperCase()} at (${end.x},${end.y})`,
    outcome === 'won',
  );
  t.check(`beat-perfect play sustains a combo (best ${end.bestCombo} ≥ 10)`, end.bestCombo >= 10);
  t.golden('beat-perfect run', world.hash());

  // 2. Window honesty, frame-exact: ±BEAT_WINDOW accepted, one frame more refused.
  {
    const okEdge = FRAMES_PER_BEAT * 4 + BEAT_WINDOW;
    const badEdge = FRAMES_PER_BEAT * 4 + BEAT_WINDOW + 1;
    const a = initialCd();
    const evA = tryMove(a, 'right', okEdge);
    const b = initialCd();
    const evB = tryMove(b, 'right', badEdge);
    t.check(`the window is honest to the frame (+${BEAT_WINDOW} accepted, +${BEAT_WINDOW + 1} refused)`, (evA.moved || evA.fought) && evB.offBeat);
    t.check('an off-beat press breaks the combo', b.combo === 0);
    t.check('window honesty: onBeat() agrees', onBeat(okEdge) && !onBeat(badEdge));
  }

  // 3. One action per beat: hammering inside one window moves once.
  {
    const s = initialCd();
    tryMove(s, 'right', FRAMES_PER_BEAT * 2);
    const x1 = s.x;
    const ev = tryMove(s, 'right', FRAMES_PER_BEAT * 2 + 2);
    t.check('a second press in the same beat is refused', ev.offBeat && s.x === x1);
  }

  // 4. Foes are beat-quantized: they move on beatTick and NEVER between.
  {
    const s = initialCd();
    const before = JSON.stringify(s.foes);
    // No beatTick called — foes must be frozen regardless of tryMove churn.
    tryMove(s, 'down', FRAMES_PER_BEAT * 6);
    t.check('foes hold still between beats', JSON.stringify(s.foes) === before);
    beatTick(s, 1);
    t.check('foes act on the beat', JSON.stringify(s.foes) !== before);
  }

  // 5. Determinism over the winning dance.
  const rep = checkDeterministic(() => createWorld(cadenceGame), { frames: log });
  t.check(rep.ok ? 'the dance replays deterministically' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}

// BFS step toward the gold door — the dancer knows the chamber by heart.
import { CHAMBER } from './logic';
function bfsMove(fx: number, fy: number): string | null {
  const W = 15;
  const H = 9;
  const wall = (x: number, y: number) => (CHAMBER[y]?.[x] ?? '#') === '#';
  const goal = 7 * W + 13;
  const start = fy * W + fx;
  if (start === goal) return null;
  const prev = new Int32Array(W * H).fill(-1);
  prev[start] = start;
  const q = [start];
  for (let h = 0; h < q.length && prev[goal] === -1; h++) {
    const cur = q[h];
    const cx = cur % W;
    const cy = (cur / W) | 0;
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + ox;
      const ny = cy + oy;
      const n = ny * W + nx;
      if (wall(nx, ny) || prev[n] !== -1) continue;
      prev[n] = cur;
      q.push(n);
    }
  }
  if (prev[goal] === -1) return null;
  let cur = goal;
  while (prev[cur] !== start) cur = prev[cur];
  const dx = (cur % W) - fx;
  const dy = ((cur / W) | 0) - fy;
  return dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
}

// Driftlight verify suite: the lantern crosses a river far larger than the
// screen (proving scroll), a line-tracking pilot survives the flame economy to
// the dawn sea, the run is deterministic despite a fully cosmetic gradient/glow/
// parallax view, and the first screen teaches its controls. The filmstrip is the
// looks artifact — the whole point of this example is that it reads beautifully.

import {
  checkDeterministic,
  createWorld,
  recordTimeline,
  series,
  layoutIssues,
  missingControlHints,
  renderFilmstrip,
  type World,
} from '@hayao';
import { driftlightGame, DL_INPUT_MAP } from './game';
import { SEA_X } from './logic';
import { driftBot, type DlProbe } from './bot';
import type { VerifyContext } from '../../scripts/verify';

const MAX_FRAMES = 3000;

function drift(world: World): string[][] {
  const log: string[][] = [];
  for (let f = 0; f < MAX_FRAMES; f++) {
    const p = world.probe() as unknown as DlProbe;
    if (p.won || p.lost) break;
    const a = driftBot(p);
    log.push(a);
    world.step(a);
  }
  return log;
}

export default async function verify(t: VerifyContext) {
  // 1. The drift completes with the flame alive.
  const world = createWorld(driftlightGame);
  const log = drift(world);
  const end = world.probe() as unknown as DlProbe & { flame: number; progress: number; gathered: number };
  t.check(
    end.won ? `reached the sea in ${log.length} frames (${(log.length / 60).toFixed(1)}s), flame ${Math.round(end.flame * 100)}%` : `never reached the sea (${end.progress}%, flame ${Math.round(end.flame * 100)}%)`,
    end.won,
  );
  t.golden('full drift', world.hash());

  // 2. The river genuinely scrolls (world ≫ viewport).
  t.check(
    SEA_X > driftlightGame.width * 3 ? `the sea is ${Math.round(SEA_X)}px downstream (> 3 screens)` : `the course is too short (${Math.round(SEA_X)}px)`,
    SEA_X > driftlightGame.width * 3,
  );

  // 3. Feel — progress advances monotonically (auto-drift never stalls).
  const tl = recordTimeline(createWorld(driftlightGame), log);
  const prog = series(tl, 'progress') as number[];
  let monotonic = true;
  for (let i = 1; i < prog.length; i++) if (prog[i] < prog[i - 1]) monotonic = false;
  t.check(monotonic ? `progress climbs monotonically 0→${prog[prog.length - 1]}%` : 'progress went backwards — drift stalled', monotonic);

  // 4. Feel — the flame economy has real tension: it dips well below full but
  // the tracked line survives. (Windows read off the judged run.)
  const flame = series(tl, 'flame') as number[];
  const minFlame = Math.min(...flame);
  const tense = minFlame < 0.55; // it got genuinely low at least once
  const survived = minFlame > 0; // ...but never went out on the good line
  t.check(tense ? `flame dipped to ${Math.round(minFlame * 100)}% — the economy bites` : `flame never dropped (min ${Math.round(minFlame * 100)}%) — no tension`, tense);
  t.check(survived ? 'the tracked line keeps the flame alive throughout' : 'the tracked line still died — course unfair', survived);

  // 5. Feel — fireflies are actually gathered along the way.
  const got = series(tl, 'gathered') as number[];
  const gatheredCount = got[got.length - 1];
  t.check(gatheredCount >= 6 ? `${gatheredCount} fireflies gathered on the safe line` : `only ${gatheredCount} fireflies gathered — lights off the line`, gatheredCount >= 6);

  // 6. Determinism across the whole drift (the cosmetic view must not diverge).
  const rep = checkDeterministic(() => createWorld(driftlightGame), { frames: log });
  t.check(rep.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${rep.divergedAt}`, rep.ok);

  // 7. Human-contact layer on the first screen.
  const w0 = createWorld(driftlightGame);
  w0.step([]);
  const issues = layoutIssues(w0.render());
  t.check(issues.length === 0 ? 'layout lint: no text collisions on the first screen' : `layout lint: ${issues[0]}`, issues.length === 0);
  const unhinted = missingControlHints(w0, DL_INPUT_MAP);
  t.check(unhinted.length === 0 ? 'every control is explained on screen' : `unhinted actions: ${unhinted.join(', ')}`, unhinted.length === 0);

  // 8. Filmstrip of the drift, for the looks judgement (does the art read?).
  t.artifact(
    'drift-filmstrip.svg',
    renderFilmstrip(createWorld(driftlightGame), log, {
      width: driftlightGame.width,
      height: driftlightGame.height,
      background: driftlightGame.background,
      panels: 8,
    }),
  );
}

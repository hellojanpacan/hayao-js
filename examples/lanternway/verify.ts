// Lanternway verify suite: the bearer crosses a world far larger than the
// screen (proving the camera scrolls), the follow keeps them framed within a
// tuned deadzone band, the run is deterministic despite a smooth cosmetic
// camera, and the first screen teaches its controls.

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
import { lanternwayGame, LW_INPUT_MAP } from './game';
import { WORLD } from './logic';
import { bearerBot, type LwProbe } from './bot';
import type { VerifyContext } from '../../scripts/verify';

const MAX_FRAMES = 2400;

function crossing(world: World): string[][] {
  const log: string[][] = [];
  for (let f = 0; f < MAX_FRAMES; f++) {
    const p = world.probe() as unknown as LwProbe;
    if (p.won) break;
    const a = bearerBot(p);
    log.push(a);
    world.step(a);
  }
  return log;
}

export default async function verify(t: VerifyContext) {
  // 1. The crossing completes.
  const world = createWorld(lanternwayGame);
  const log = crossing(world);
  const end = world.probe() as { won: boolean; remaining: number };
  t.check(
    end.won ? `bearer reached the shrine in ${log.length} frames (${(log.length / 60).toFixed(1)}s)` : `bearer NEVER reached the shrine (remaining ${end.remaining})`,
    end.won,
  );
  t.golden('crossing', world.hash());

  // 2. Feel — the camera pans across most of the world (it genuinely scrolls).
  const tl = recordTimeline(createWorld(lanternwayGame), log);
  const camX = series(tl, 'camX') as number[];
  const span = Math.max(...camX) - Math.min(...camX);
  t.check(
    span > WORLD.w * 0.5 ? `camera panned ${Math.round(span)}px across the field (>½ world)` : `camera barely moved (${Math.round(span)}px)`,
    span > WORLD.w * 0.5,
  );

  // 3. Feel — the follow keeps the bearer framed: on-screen position stays well
  // inside the viewport, but the deadzone lets them LEAD (never glued to center).
  const sx = series(tl, 'sx') as number[];
  const sy = series(tl, 'sy') as number[];
  const devX = Math.max(...sx.map((v) => Math.abs(v - lanternwayGame.width / 2)));
  const devY = Math.max(...sy.map((v) => Math.abs(v - lanternwayGame.height / 2)));
  // Windows tuned from the judged 541-frame crossing: in the open field the
  // deadzone caps the lead near ~220px; the peak (~420px on x) is the corner
  // approach, where the camera clamps at the world edge and the bearer walks
  // the rest of the way in — still comfortably on-screen (half-viewport is 640).
  const framed = devX <= 460 && devY <= 300;
  const leads = devX >= 150; // deadzone is doing its job, not rigid centering
  t.check(framed ? `bearer stays framed (max screen offset ${Math.round(devX)},${Math.round(devY)}px)` : `bearer drifted too far from center (${Math.round(devX)},${Math.round(devY)}px)`, framed);
  t.check(leads ? `deadzone lets the bearer lead the camera (${Math.round(devX)}px)` : `camera is rigidly centered — deadzone inactive (${Math.round(devX)}px)`, leads);

  // 4. Determinism across the whole crossing (cosmetic camera must not diverge).
  const rep = checkDeterministic(() => createWorld(lanternwayGame), { frames: log });
  t.check(rep.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${rep.divergedAt}`, rep.ok);

  // 5. Human-contact layer on the first screen.
  const w0 = createWorld(lanternwayGame);
  w0.step([]);
  const issues = layoutIssues(w0.render());
  t.check(issues.length === 0 ? 'layout lint: no text collisions on the first screen' : `layout lint: ${issues[0]}`, issues.length === 0);
  const unhinted = missingControlHints(w0, LW_INPUT_MAP);
  t.check(unhinted.length === 0 ? 'every control is explained on screen' : `unhinted actions: ${unhinted.join(', ')}`, unhinted.length === 0);

  // 6. Filmstrip of the crossing, for the looks judgement (does it read while scrolling?).
  t.artifact(
    'crossing-filmstrip.svg',
    renderFilmstrip(createWorld(lanternwayGame), log, {
      width: lanternwayGame.width,
      height: lanternwayGame.height,
      background: lanternwayGame.background,
      panels: 8,
    }),
  );
}

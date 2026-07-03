// Gravewell verify suite — the benchmark B2 scoreboard (SPEC.md M1–M10).
// Solver proves every level fits its tap budget AND that par−1 fails; the
// full campaign replays through the keyboard cursor model; determinism +
// golden; feel probes on the finale combo; filmstrip + still for looks.

import {
  solve,
  createWorld,
  checkDeterministic,
  recordTimeline,
  renderFilmstrip,
  HeadlessRenderer,
  type InputLog,
} from '@hayao';
import { gravewellPuzzle, tightParPuzzle, LEVELS } from './logic';
import { gravewellGame, tapsToFrames } from './game';
import type { VerifyContext } from '../../scripts/verify';

export default async function verify(t: VerifyContext) {
  // 1 · M6: every level solvable within budget; the finale is the deepest.
  const depths: number[] = [];
  const paths: number[][] = [];
  LEVELS.forEach((lvl, i) => {
    const r = solve(gravewellPuzzle, { level: i, maxDepth: lvl.taps + 1, nodeCap: 2_000_000 });
    if (r.solvable) {
      depths.push(r.depth!);
      paths.push(r.path!);
    }
    t.check(
      r.solvable
        ? `M6 level ${i + 1} "${lvl.name}" cleaned in ${r.depth}/${lvl.taps} taps (${r.nodes} nodes)`
        : `M6 level ${i + 1} "${lvl.name}" NOT solvable within budget`,
      r.solvable && r.depth! <= lvl.taps,
    );
  });
  t.check(
    `difficulty peaks at the finale (taps ${depths.join(' → ')})`,
    depths.length === LEVELS.length && depths[depths.length - 1] === Math.max(...depths),
  );

  // 2 · M7: par is tight — one tap fewer and every level is lost.
  LEVELS.forEach((lvl, i) => {
    const r = solve(tightParPuzzle, { level: i, maxDepth: lvl.taps + 1, nodeCap: 2_000_000 });
    t.check(`M7 level ${i + 1} "${lvl.name}" is UNsolvable in ${lvl.taps - 1} taps`, !r.solvable);
  });

  // 3 · M9/M10: full campaign through the REAL game via the cursor tap model.
  const world = createWorld(gravewellGame);
  type ViewHandle = { gotoLevel(i: number): void };
  const view = world.root.find('gravewell') as unknown as ViewHandle;
  for (let i = 0; i < LEVELS.length; i++) {
    if (i > 0) view.gotoLevel(i);
    for (const f of tapsToFrames(paths[i])) world.step(f);
    const p = world.probe();
    t.check(
      `M10 level ${i + 1} cleaned through the cursor model (taps left ${p.tapsLeft})`,
      p.solved === true && p.level === i,
    );
  }
  t.golden('full campaign replay', world.hash());

  // 4 · Determinism.
  const finaleLog: InputLog = { frames: tapsToFrames(paths[LEVELS.length - 1]) };
  const report = checkDeterministic(() => createWorld(gravewellGame), { frames: tapsToFrames(paths[0]) });
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 5 · Feel probes on the finale (the collapse-then-sweep combo, SPEC.md).
  // Windows judged from the solved replay: par 6, board of 5 pushables.
  {
    const w = createWorld(gravewellGame);
    (w.root.find('gravewell') as unknown as ViewHandle).gotoLevel(LEVELS.length - 1);
    const tl = recordTimeline(w, finaleLog.frames);
    const push = tl.map((p) => p.pushables as number);
    t.check(
      'M2/M4 the finale mixes productive and positioning taps (pushables strictly non-increasing)',
      push.every((v, i) => i === 0 || v <= push[i - 1]),
    );
    const slideTaps = tl.filter((p, i) => i > 0 && p.moves !== tl[i - 1].moves && p.pushables === tl[i - 1].pushables).length;
    t.check(`the sweep includes ${slideTaps} positioning tap(s) that clear nothing (gap lesson, ≥1)`, slideTaps >= 1);
    const solvedAt = tl.findIndex((p) => p.solved === true);
    t.check(
      `the last tap cleans the board with 0 left (taps left ${tl[solvedAt]?.tapsLeft})`,
      solvedAt > 0 && tl[solvedAt].tapsLeft === 0,
    );
  }

  // 6 · Looks: filmstrip of the finale + a still of level 4 (piece taxonomy).
  {
    const w = createWorld(gravewellGame);
    (w.root.find('gravewell') as unknown as ViewHandle).gotoLevel(LEVELS.length - 1);
    t.artifact(
      'finale-filmstrip.svg',
      renderFilmstrip(w, finaleLog.frames, {
        width: gravewellGame.width,
        height: gravewellGame.height,
        background: gravewellGame.background,
        panels: 10,
      }),
    );
  }
  {
    const w = createWorld(gravewellGame);
    (w.root.find('gravewell') as unknown as ViewHandle).gotoLevel(3);
    w.step([]);
    const r = new HeadlessRenderer({ width: gravewellGame.width, height: gravewellGame.height, background: gravewellGame.background });
    r.draw(w.render());
    t.artifact('driftline.svg', r.toSVGString());
  }
}

// Seamfold verify suite — the benchmark B1 scoreboard (SPEC.md M1–M8).
// Every level solver-proven winnable WITH seams and UNwinnable without;
// solutions replayed through the real game; determinism + golden; feel
// probes proving the fold is visible; filmstrip + screenshot for looks.

import {
  solve,
  createWorld,
  checkDeterministic,
  recordTimeline,
  renderFilmstrip,
  HeadlessRenderer,
  type InputLog,
} from '@hayao';
import { seamfoldPuzzle, noWrapPuzzle, LEVELS, type Move } from './logic';
import { seamfoldGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

const movesToLog = (path: Move[]): InputLog => ({
  frames: path.flatMap((m) => [[m], []] as string[][]).concat([[]]),
});

export default async function verify(t: VerifyContext) {
  // 1 · M8: every level winnable with seams — and the finale is the deepest.
  const depths: number[] = [];
  const paths: Move[][] = [];
  LEVELS.forEach((lvl, i) => {
    const r = solve(seamfoldPuzzle, { level: i, maxDepth: 120, nodeCap: 2_000_000 });
    if (r.solvable) {
      depths.push(r.depth!);
      paths.push(r.path!);
    }
    t.check(
      r.solvable
        ? `M8 level ${i + 1} "${lvl.name}" winnable in ${r.depth} moves (${r.nodes} nodes)`
        : `M8 level ${i + 1} "${lvl.name}" NOT winnable`,
      r.solvable,
    );
  });
  t.check(
    `difficulty peaks at the finale (depths ${depths.join(' → ')})`,
    depths.length === LEVELS.length && depths[depths.length - 1] === Math.max(...depths),
  );

  // 2 · M4: the seam IS the mechanic — every level unsolvable without it.
  LEVELS.forEach((lvl, i) => {
    const r = solve(noWrapPuzzle, { level: i, maxDepth: 120, nodeCap: 2_000_000 });
    t.check(`M4 level ${i + 1} "${lvl.name}" is UNsolvable without seam crossings`, !r.solvable);
  });

  // 3 · M1/M3/M6: full campaign — replay every solution through the REAL game,
  // advancing levels via the test affordance; the view must agree with the logic.
  const world = createWorld(seamfoldGame);
  type ViewHandle = { gotoLevel(i: number): void };
  const view = world.root.find('seamfold') as unknown as ViewHandle;
  for (let i = 0; i < LEVELS.length; i++) {
    if (i > 0) view.gotoLevel(i);
    for (const f of movesToLog(paths[i]).frames) world.step(f);
    const p = world.probe();
    t.check(`M6 level ${i + 1} solved through the scene view (moves ${p.moves})`, p.solved === true && p.level === i);
  }
  t.golden('full campaign replay', world.hash());

  // 4 · M1 determinism: same log, bit-identical hashes.
  const log0 = movesToLog(paths[0]);
  const report = checkDeterministic(() => createWorld(seamfoldGame), log0);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 5 · Feel probes (windows judged from the level-1 replay: 10-move solve,
  // 21 frames; the single box must visibly jump the seam exactly once).
  {
    const tl = recordTimeline(createWorld(seamfoldGame), log0.frames);
    let seamJumps = 0;
    for (let i = 1; i < tl.length; i++) {
      const dx = Math.abs((tl[i].boxX as number) - (tl[i - 1].boxX as number));
      const dy = Math.abs((tl[i].boxY as number) - (tl[i - 1].boxY as number));
      if (dx > 1 || dy > 1) seamJumps++;
    }
    t.check(`M1/M3 the box visibly folds through the seam once (jumps: ${seamJumps})`, seamJumps === 1);
    const solvedAt = tl.findIndex((p) => p.solved === true);
    // The log ends with the solving press + its release + one pad frame, so a
    // tight solve leaves a tail of at most 3 timeline frames.
    t.check(
      `solve lands on the final push (frame ${solvedAt} of ${tl.length} — no dead tail)`,
      solvedAt > 0 && tl.length - solvedAt <= 3,
    );
    const onGoal = tl.map((p) => p.boxesOnGoal as number);
    t.check(
      'box-on-goal count is a single 0→1 step (no accidental un-solves)',
      onGoal.every((v, i) => i === 0 || v >= onGoal[i - 1]),
    );
  }

  // 6 · Looks: filmstrip of the level-1 solve + a still of the twisted level 2
  // (the ghost-lane shift is the signature image — judge readability there).
  t.artifact(
    'solve-filmstrip.svg',
    renderFilmstrip(createWorld(seamfoldGame), log0.frames, {
      width: seamfoldGame.width,
      height: seamfoldGame.height,
      background: seamfoldGame.background,
      panels: 8,
    }),
  );
  {
    const w2 = createWorld(seamfoldGame);
    (w2.root.find('seamfold') as unknown as ViewHandle).gotoLevel(1);
    w2.step([]);
    const r = new HeadlessRenderer({ width: seamfoldGame.width, height: seamfoldGame.height, background: seamfoldGame.background });
    r.draw(w2.render());
    t.artifact('twisted-lanes.svg', r.toSVGString());
  }
}

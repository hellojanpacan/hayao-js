// Kinfall verify suite: the co-op night is bot-proven survivable, idle play is
// proven fatal (skill delta), the storm is proven load-bearing, the revive loop
// is proven both ways, and the whole run is deterministic + golden-pinned.
// Feel probes gate the pacing; a filmstrip is emitted for the looks judgement.

import {
  Rng,
  createWorld,
  checkDeterministic,
  recordTimeline,
  renderFilmstrip,
  firstFrame,
  series,
  isMonotonic,
  longestLull,
  changeFrames,
  layoutIssues,
  missingControlHints,
  type InputLog,
} from '@hayao';
import { initialKin, stepKin, coopInput, WIN_AT, CENTER, PIDS, P_TUNE, type KinState, type PInput } from './logic';
import { kinfallGame, kinState, KIN_INPUT_MAP } from './game';
import type { VerifyContext } from '../../scripts/verify';

const dt = 1 / 60;

/** Compile the co-op bot's decisions into a replayable input log by driving a
 *  reference world forward one frame at a time. */
function coopLog(maxFrames: number): InputLog {
  const ref = createWorld(kinfallGame);
  const frames: string[][] = [];
  for (let i = 0; i < maxFrames; i++) {
    const s = kinState(ref);
    if (s.phase !== 'play') break;
    const actions: string[] = [];
    for (const pid of PIDS) {
      const c = coopInput(s, pid);
      if (c.moveX > 0) actions.push(`${pid}:right`);
      if (c.moveX < 0) actions.push(`${pid}:left`);
      if (c.moveY > 0) actions.push(`${pid}:down`);
      if (c.moveY < 0) actions.push(`${pid}:up`);
      if (c.fire) actions.push(`${pid}:fire`);
      if (c.interact) actions.push(`${pid}:interact`);
    }
    const frame = actions.sort();
    frames.push(frame);
    ref.step(frame);
  }
  // A short settle tail so the last state is stable.
  for (let i = 0; i < 10; i++) frames.push([]);
  return { frames };
}

export default async function verify(t: VerifyContext) {
  // 1. Pure sim: the pair-bot holds the ring to extraction, and doing nothing
  //    is fatal well before the timer — the co-op skill delta.
  {
    const seeds = [1, 2, 3, 7, 11, 42];
    let wins = 0;
    for (const seed of seeds) {
      const s = initialKin();
      const rng = new Rng(seed);
      for (let f = 0; f < WIN_AT * 60 + 120 && s.phase === 'play'; f++) stepKin(s, { p1: coopInput(s, 'p1'), p2: coopInput(s, 'p2') }, dt, rng);
      if (s.phase === 'won') wins++;
    }
    t.check(`pair-bot holds the ring to extraction on ${wins}/${seeds.length} seeds`, wins === seeds.length);

    const idle: PInput = { moveX: 0, moveY: 0, fire: false, interact: false };
    const ns = initialKin();
    const nrng = new Rng(7);
    for (let f = 0; f < WIN_AT * 60 && ns.phase === 'play'; f++) stepKin(ns, { p1: idle, p2: idle }, dt, nrng);
    t.check(`idle pair is wiped at ${ns.time.toFixed(0)}s — well short of the ${WIN_AT}s extraction (skill delta)`, ns.phase === 'lost' && ns.time < WIN_AT * 0.7);
  }

  // 2. The storm is load-bearing: a rim-camper outside the final ring is knocked
  //    out by storm damage alone. No safe camp.
  {
    const s = initialKin();
    const rng = new Rng(1);
    s.time = 92;
    s.players.p1.x = CENTER.x + 620;
    let knockedAt = -1;
    for (let f = 0; f < 60 * 10 && knockedAt < 0; f++) {
      stepKin(s, { p1: { moveX: 0, moveY: 0, fire: false, interact: false }, p2: { moveX: 0, moveY: 0, fire: false, interact: false } }, dt, rng);
      if (s.players.p1.downed || s.players.p1.dead) knockedAt = f;
    }
    t.check(knockedAt >= 0 ? `rim-camper outside the final ring is knocked out in ${(knockedAt / 60).toFixed(1)}s (no safe camp)` : 'rim-camper survived the storm — the ring is not load-bearing', knockedAt >= 0);
  }

  // 3. Revive proven both ways: a partner in range hauls you up; unattended, you
  //    bleed out and die.
  {
    const withHelp = reviveScenario(true);
    const alone = reviveScenario(false);
    t.check(`a partner holding interact revives a downed player to ${P_TUNE.reviveHp} hp`, withHelp === 'revived');
    t.check('an unattended downed player bleeds out and dies', alone === 'dead');
  }

  // 4. World-driven full run: the scripted co-op log reaches extraction; hash is
  //    golden-pinned.
  const log = coopLog(WIN_AT * 60 + 60);
  const world = createWorld(kinfallGame);
  for (const f of log.frames) world.step(f);
  const end = world.probe() as { phase: string; kills: number };
  t.check(`scripted co-op run reaches extraction (${end.kills} culled)`, end.phase === 'won');
  t.golden('full co-op run', world.hash());

  // 5. Determinism across two runs of the same log.
  const report = checkDeterministic(() => createWorld(kinfallGame), log);
  t.check(report.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${report.divergedAt}`, report.ok);

  // 6. Feel probes (Channel 3), windows derived from the judged run above.
  {
    const tl = recordTimeline(createWorld(kinfallGame), log.frames);
    const firstKill = firstFrame(tl, (p) => (p.kills as number) > 0);
    t.check(`first kill lands at ${(firstKill / 60).toFixed(1)}s — after the loot grace, inside the fight (7–28s)`, firstKill >= 7 * 60 && firstKill <= 28 * 60);

    const storm = series(tl, 'storm').map(Number);
    t.check('the storm radius never grows — the ring only closes', isMonotonic(storm, 'down', 1));

    const killLull = longestLull(changeFrames(tl, 'kills'), tl.length);
    t.check(`longest gap between kills is ${(killLull / 60).toFixed(1)}s — the horde keeps the pressure on (< 12s)`, killLull < 12 * 60);

    const peakHorde = Math.max(...series(tl, 'horde').map(Number));
    t.check(`the final ring peaks at ${peakHorde} enemies — the squeeze is real (≥ 40)`, peakHorde >= 40);
  }

  // 7. Human-contact lints on the opening frame.
  {
    const w = createWorld(kinfallGame);
    w.step([]);
    const li = layoutIssues(w.render());
    t.check(li.length === 0 ? 'opening frame: text is panel-or-disjoint (layout clean)' : `layout issues: ${li.join(' | ')}`, li.length === 0);
    const mh = missingControlHints(w, KIN_INPUT_MAP);
    t.check(mh.length === 0 ? 'every control is named on the first frame' : `unexplained controls: ${mh.join(', ')}`, mh.length === 0);
  }

  // 8. Filmstrip artifact for the looks judgement.
  t.artifact(
    'run-filmstrip.svg',
    renderFilmstrip(createWorld(kinfallGame), log.frames, {
      width: kinfallGame.width,
      height: kinfallGame.height,
      background: kinfallGame.background,
      panels: 12,
    }),
  );
}

/** Isolated revive scenario: p2 is downed mid-fight; p1 either helps or not. */
function reviveScenario(help: boolean): 'revived' | 'dead' | 'timeout' {
  const s: KinState = initialKin();
  const rng = new Rng(1);
  s.time = 20;
  const down = s.players.p2;
  down.downed = true;
  down.hp = 0;
  down.bleed = P_TUNE.bleedout;
  const helper = s.players.p1;
  if (help) {
    helper.x = down.x + 18;
    helper.y = down.y;
  } else {
    helper.x = CENTER.x;
    helper.y = CENTER.y;
  }
  const act: PInput = { moveX: 0, moveY: 0, fire: false, interact: help };
  const idle: PInput = { moveX: 0, moveY: 0, fire: false, interact: false };
  for (let f = 0; f < Math.ceil((P_TUNE.bleedout + 2) * 60); f++) {
    stepKin(s, { p1: help ? act : idle, p2: idle }, dt, rng);
    if (!down.downed && !down.dead) return 'revived';
    if (down.dead) return 'dead';
  }
  return 'timeout';
}

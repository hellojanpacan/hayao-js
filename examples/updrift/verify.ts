// Updrift verify — the reference proof that a game can be shown PROFESSIONAL, not
// just non-broken. Alongside the usual winnability/determinism/golden gates, it
// runs the full Channel-4 FEEL suite (docs/VERIFICATION.md): forgiveness (static +
// a behavioural coyote-window prover), feedback completeness, avatar salience,
// threat telegraph, and camera lawfulness — every one from pure data. This is the
// file that shows the four gates and the level format composing on a real game.

import {
  createWorld,
  checkDeterministic,
  recordTimeline,
  series,
  renderFilmstrip,
  layoutIssues,
  missingControlHints,
  // Channel-4 feel gates (D1)
  forgivenessIssues,
  graceWindowIssues,
  feedbackIssues,
  salienceIssues,
  telegraphIssues,
  cameraIssues,
  lookAheadIssues,
  isMonotonic,
  longestLull,
  changeFrames,
  // level format (D3)
  platformerReachable,
  levelIssues,
  // controller rig for the behavioural forgiveness proof
  tilemapFromAscii,
  createPlatformerState,
  stepPlatformer,
  PAD_NEUTRAL,
  type Vec2,
  type TelegraphFrame,
} from '@hayao';
import { updriftGame, UP_INPUT_MAP } from './game';
import { CONFIG, LEVEL, ENVELOPE, FEEDBACK, FEEDBACK_EVENTS, TILE_PX, FLARE } from './logic';
import { runClimb } from './drive';
import type { VerifyContext } from '../../scripts/verify';

/** Behavioural coyote prover: stand on a lip, walk off, press jump D frames later. */
function coyoteAccepts(delay: number): boolean {
  const map = tilemapFromAscii(['..........', '....##....', '..........', '..........', '..........', '..........'], TILE_PX);
  const s = createPlatformerState(4 * TILE_PX + 4, 1 * TILE_PX - CONFIG.height);
  stepPlatformer(s, PAD_NEUTRAL, 1 / 60, map, CONFIG); // settle onto the lip
  let sinceLeft = -1;
  for (let f = 0; f < 40; f++) {
    const wasGround = s.onGround;
    const jumpNow = sinceLeft === delay;
    const ev = stepPlatformer(s, { moveX: 1, moveY: 0, jumpHeld: jumpNow, jumpPressed: jumpNow, dashPressed: false }, 1 / 60, map, CONFIG);
    if (ev.jumped) return true;
    if (wasGround && !s.onGround) sinceLeft = 0;
    else if (sinceLeft >= 0) sinceLeft++;
  }
  return false;
}

export default async function verify(t: VerifyContext) {
  // ── Winnability + determinism + golden (correctness spine) ─────────────────
  const world = createWorld(updriftGame);
  const climb = runClimb(world);
  t.check(climb.won ? `bot reached the summit in ${climb.frames} frames (${(climb.frames / 60).toFixed(1)}s), ${climb.deaths} deaths` : 'bot NEVER reached the summit', climb.won && climb.deaths === 0);
  t.golden('climb', world.hash());
  const det = checkDeterministic(() => createWorld(updriftGame), { frames: climb.log });
  t.check(det.ok ? 'climb is deterministic across runs' : `diverged at frame ${det.divergedAt}`, det.ok);

  // ── D3: the level is well-formed and provably climbable AS DATA ────────────
  t.check(levelIssues(LEVEL).length === 0 ? 'level data is well-formed' : `level: ${levelIssues(LEVEL)[0]}`, levelIssues(LEVEL).length === 0);
  const reach = platformerReachable(LEVEL, ENVELOPE);
  t.check(reach.ok ? `summit reachable within the jump envelope (${reach.reached} footholds)` : `unreachable: ${reach.unreachable.join(', ')}`, reach.ok);

  // ── D1 gate 1: forgiveness (static floor + behavioural coyote window) ───────
  const fIssues = forgivenessIssues(CONFIG);
  t.check(fIssues.length === 0 ? 'forgiveness gate: coyote/buffer/corner windows all specced' : `forgiveness: ${fIssues[0]}`, fIssues.length === 0);
  let window = -1;
  for (let d = 0; d < 20; d++) { if (coyoteAccepts(d)) window = d; else break; }
  const graceIssues = window >= 3 ? graceWindowIssues('coyote', window, coyoteAccepts) : ['coyote window never opened'];
  t.check(graceIssues.length === 0 ? `coyote grace proven: a jump lands ${window} frame(s) after leaving the ledge, refused past it` : `coyote: ${graceIssues[0]}`, graceIssues.length === 0);

  // ── D1 gate 2: feedback completeness ───────────────────────────────────────
  const fbIssues = feedbackIssues(FEEDBACK, FEEDBACK_EVENTS);
  t.check(fbIssues.length === 0 ? `feedback gate: all ${FEEDBACK_EVENTS.length} events answer on ≥2 senses inside the juice envelope` : `feedback: ${fbIssues[0]}`, fbIssues.length === 0);

  // ── D1 gate 3: readability (avatar salience + human-contact layer) ─────────
  const midWorld = createWorld(updriftGame);
  runClimb(midWorld, Math.floor(climb.frames / 2));
  const sal = salienceIssues(midWorld.render(), '#e3c054', updriftGame.background);
  t.check(sal.length === 0 ? 'salience gate: the climber out-contrasts the scenery' : `salience: ${sal[0]}`, sal.length === 0);
  const first = createWorld(updriftGame);
  first.step([]);
  t.check(layoutIssues(first.render()).length === 0 ? 'layout lint: no text collisions on the first screen' : `layout: ${layoutIssues(first.render())[0]}`, layoutIssues(first.render()).length === 0);
  const unhinted = missingControlHints(first, UP_INPUT_MAP);
  t.check(unhinted.length === 0 ? 'every control is explained on screen' : `unhinted: ${unhinted.join(', ')}`, unhinted.length === 0);

  // ── D1 gate 3b: threat telegraph (the flare warns before it bites) ─────────
  const flareWorld = createWorld(updriftGame);
  const teleTimeline: TelegraphFrame[] = [];
  for (let f = 0; f < 240; f++) {
    const p = flareWorld.probe() as { flareTele: boolean; flareActive: boolean };
    teleTimeline.push({ telegraphing: p.flareTele, active: p.flareActive });
    flareWorld.step([]);
  }
  const telIssues = telegraphIssues(teleTimeline, 12, 'flare');
  t.check(telIssues.length === 0 ? `telegraph gate: the flare warns ≥12 frames before every activation (period ${FLARE.period}s)` : `telegraph: ${telIssues[0]}`, telIssues.length === 0);

  // ── D1 gate 4: camera lawfulness (no snaps/jerk; view leads the climb) ─────
  const tl = recordTimeline(createWorld(updriftGame), climb.log);
  const camX = series(tl, 'camX') as number[];
  const camY = series(tl, 'camY') as number[];
  const py = series(tl, 'py') as number[];
  // Drop probe 0 (taken before the tree starts, so no camera exists yet).
  const camSamples: Vec2[] = camX.map((x, i) => ({ x, y: camY[i] })).slice(1);
  const avatarSamples: Vec2[] = py.map((v) => ({ x: 0, y: v })).slice(1);
  const camIssues = cameraIssues(camSamples, { dt: 1 / 60 });
  t.check(camIssues.length === 0 ? 'camera gate: the follow never snaps or jerks' : `camera: ${camIssues[0]}`, camIssues.length === 0);
  const leadIssues = lookAheadIssues(camSamples, avatarSamples);
  t.check(leadIssues.length === 0 ? 'camera leads the climb (never trails backwards)' : `look-ahead: ${leadIssues[0]}`, leadIssues.length === 0);

  // ── Feel proxies: the ascent climbs and never goes dead ────────────────────
  const heights = py.map((v) => -v); // higher = further up
  t.check(isMonotonic(heights, 'up', TILE_PX * 4) ? 'the climb trends upward (difficulty ramps with breathers)' : 'the climb backtracks too far', isMonotonic(heights, 'up', TILE_PX * 4));
  const jumps = changeFrames(tl, 'py');
  const lull = longestLull(jumps, tl.length);
  t.check(lull < 90 ? `no dead air (longest still stretch ${lull} frames)` : `dead air: ${lull} frames of no movement`, lull < 90);

  // ── Filmstrip for the looks judgement ──────────────────────────────────────
  t.artifact('climb-filmstrip.svg', renderFilmstrip(createWorld(updriftGame), climb.log, { width: updriftGame.width, height: updriftGame.height, background: updriftGame.background, panels: 10 }));
}

// Feel gates (Channel 4): the FLOOR of professional game feel, made checkable.
//
// The correctness channels prove a game is not broken; the layout lints prove it
// is legible. Neither says whether it FEELS good. These gates encode the small
// set of feel fundamentals that separate amateur from professional and that are
// genuinely mechanical — not matters of taste:
//
//   1. forgiveness  — grace windows (coyote, jump-buffer, corner-nudge) exist and
//                     actually accept a late/early input to the frame (FUN law 5).
//   2. feedback     — every significant event answers on ≥2 sensory channels
//                     within a tight window, with juice magnitudes bounded (min to
//                     read, max to not nauseate).
//   3. readability  — the avatar out-contrasts its surroundings, and every threat
//                     telegraphs before its hitbox goes live.
//   4. camera       — the view moves lawfully: bounded speed/jerk (no snapping),
//                     and its lead matches the target's motion.
//
// Every function returns human-readable issues (empty array = pass), exactly like
// `layoutIssues`, so wiring one into a verify suite is one line:
//   t.check(issues.length === 0 ? 'forgiveness gate clean' : issues[0], !issues.length);
//
// All pure and allocation-light: gates read plain data (a config, a contract, a
// display list, a probe timeline, a sampled position series), never the live DOM.

import type { DrawCommand } from '../render/commands';
import type { Vec2 } from '../core/math';
import { applyTransform, invertTransform } from '../core/math';
import { dhypot, dpow } from '../core/dmath';
import { parseLightRun, splitByLightLayer } from '../render/lightRun';
import { sortCommands } from '../render/commands';

const dedupe = (a: string[]): string[] => [...new Set(a)];


// ── 1. Forgiveness ──────────────────────────────────────────────────────────
// Grace is a system, not polish (FUN law 5). Two checks: a static one on the
// controller config (the windows are specced at all), and a behavioural one that
// frame-pumps an actual grace window and asserts accepted-inside / refused-outside.

/** The forgiveness-relevant slice of any character config (PlatformerConfig satisfies it). */
export interface ForgivenessSpec {
  /** Seconds of coyote time after leaving the ground. */
  coyoteTime: number;
  /** Seconds a jump press is buffered before landing. */
  jumpBuffer: number;
  /** Pixels the body is nudged sideways to slip past a ceiling corner (0 = none). */
  jumpCornerNudge?: number;
}

export interface ForgivenessOptions {
  /** Minimum coyote time in seconds (default 0.05 ≈ 3 frames @60Hz). */
  minCoyote?: number;
  /** Minimum jump-buffer in seconds (default 0.05). */
  minBuffer?: number;
  /** Require a non-zero jump corner nudge (default true). */
  requireCornerNudge?: boolean;
}

/**
 * Static audit of a controller's grace windows. A platformer that ships without
 * coyote time and input buffering feels like it drops inputs — the single most
 * common reason an otherwise-correct platformer feels amateur.
 */
export function forgivenessIssues(spec: ForgivenessSpec, opts: ForgivenessOptions = {}): string[] {
  const minCoyote = opts.minCoyote ?? 0.05;
  const minBuffer = opts.minBuffer ?? 0.05;
  const requireNudge = opts.requireCornerNudge ?? true;
  const issues: string[] = [];
  if (!(spec.coyoteTime >= minCoyote)) issues.push(`coyote time ${spec.coyoteTime}s is below the ${minCoyote}s floor — late jumps off a ledge will be dropped`);
  if (!(spec.jumpBuffer >= minBuffer)) issues.push(`jump buffer ${spec.jumpBuffer}s is below the ${minBuffer}s floor — early jumps before landing will be swallowed`);
  if (requireNudge && !((spec.jumpCornerNudge ?? 0) > 0)) issues.push('no jump corner nudge — clipping a ceiling edge kills upward momentum instead of slipping past');
  return issues;
}

/**
 * Behavioural grace-window prover. `accepts(delayFrames)` runs the sim with the
 * grace-triggering input applied `delayFrames` after the enabling event and
 * returns whether the action still took. A correct window accepts every delay in
 * `[0, windowFrames]` and refuses `windowFrames + 1` — the exact edge FUN law 5
 * demands. Use it for coyote time, jump buffering, i-frames, mercy windows.
 */
export function graceWindowIssues(label: string, windowFrames: number, accepts: (delayFrames: number) => boolean): string[] {
  const issues: string[] = [];
  for (let d = 0; d <= windowFrames; d++) {
    if (!accepts(d)) issues.push(`${label}: input ${d} frame(s) into the window was refused — grace window is shorter than the specced ${windowFrames}`);
  }
  if (accepts(windowFrames + 1)) issues.push(`${label}: input ${windowFrames + 1} frame(s) in (past the window) was still accepted — grace window is longer than specced (unfair leniency)`);
  return dedupe(issues);
}

// ── 2. Feedback completeness ─────────────────────────────────────────────────
// Every gameplay-significant event must answer on at least two sensory channels
// within a tight window, and the juice magnitudes must stay inside an envelope:
// big enough to read, small enough not to nauseate or drown the frame.

export type FeedbackChannel = 'visual' | 'audio' | 'haptic';

/** What a game promises to fire for one event kind — audited statically. */
export interface FeedbackResponse {
  /** Channels this event answers on (particles/flash = visual, sfx = audio, shake/rumble = haptic). */
  channels: FeedbackChannel[];
  /** Screen-shake trauma added (0..1), if any — bounded by the envelope. */
  shake?: number;
  /** Hit-stop / freeze frames injected, if any — bounded by the envelope. */
  hitstopFrames?: number;
}

/** event kind → its feedback response. The game declares this next to its sim. */
export type FeedbackContract = Record<string, FeedbackResponse>;

export interface FeedbackOptions {
  /** Minimum distinct channels per event (default 2). */
  minChannels?: number;
  /** Allowed screen-shake trauma range (default [0, 1]). */
  shake?: [number, number];
  /** Allowed hit-stop range in frames (default [0, 12] — beyond ~0.2s reads as a hitch). */
  hitstop?: [number, number];
}

/**
 * Audit a feedback contract: every required event exists, answers on ≥ minChannels
 * distinct channels, and keeps its shake/hit-stop inside the envelope. This is the
 * "does every hit/land/collect/death actually land on the senses?" gate.
 */
export function feedbackIssues(contract: FeedbackContract, requiredEvents: readonly string[], opts: FeedbackOptions = {}): string[] {
  const minCh = opts.minChannels ?? 2;
  const [shakeLo, shakeHi] = opts.shake ?? [0, 1];
  const [stopLo, stopHi] = opts.hitstop ?? [0, 12];
  const issues: string[] = [];
  for (const ev of requiredEvents) {
    const r = contract[ev];
    if (!r) {
      issues.push(`event "${ev}" has no feedback response — it happens silently`);
      continue;
    }
    const distinct = new Set(r.channels).size;
    if (distinct < minCh) issues.push(`event "${ev}" answers on ${distinct} channel(s) (${r.channels.join('+') || 'none'}) — needs ≥ ${minCh} (e.g. sfx + particles)`);
    if (r.shake !== undefined && (r.shake < shakeLo || r.shake > shakeHi)) issues.push(`event "${ev}" shake ${r.shake} is outside the [${shakeLo}, ${shakeHi}] envelope`);
    if (r.hitstopFrames !== undefined && (r.hitstopFrames < stopLo || r.hitstopFrames > stopHi)) issues.push(`event "${ev}" hit-stop ${r.hitstopFrames}f is outside the [${stopLo}, ${stopHi}]f envelope`);
  }
  return dedupe(issues);
}

// ── 3. Readability: avatar salience + threat telegraphs ──────────────────────

/** Relative luminance (WCAG) of a #rrggbb / #rgb color, in [0,1]. */
export function relLuminance(hex: string): number {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const chan = (c: number): number => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : dpow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan((n >> 16) & 255) + 0.7152 * chan((n >> 8) & 255) + 0.0722 * chan(n & 255);
}

/** WCAG contrast ratio between two colors, in [1, 21]. */
export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export interface SalienceOptions {
  /** Minimum contrast the avatar must hold against the background (default 3). */
  minBackgroundContrast?: number;
  /**
   * The avatar's fill must out-contrast the MEDIAN non-avatar fill against the
   * background by at least this factor (default 1.15) — i.e. it visibly pops from
   * the scenery rather than blending into it.
   */
  minSalienceFactor?: number;
}

const fillOf = (c: DrawCommand): string | undefined => (c.kind === 'text' ? undefined : (c as { fill?: string }).fill);

/**
 * Readability gate: the player avatar must be the most salient thing on screen.
 * The game passes the exact fill it painted the avatar with; the gate asserts that
 * color out-contrasts both the background and the median scenery fill in the live
 * display list. "Where's my guy?" is a fun-killer no correctness proof catches —
 * this one does, from pure draw data.
 */
export function salienceIssues(commands: DrawCommand[], avatarFill: string, background: string, opts: SalienceOptions = {}): string[] {
  const minBg = opts.minBackgroundContrast ?? 3;
  const minFactor = opts.minSalienceFactor ?? 1.15;
  const issues: string[] = [];
  const avatarContrast = contrastRatio(avatarFill, background);
  if (avatarContrast < minBg) issues.push(`avatar (${avatarFill}) contrast vs background is ${avatarContrast.toFixed(2)}:1 (needs ≥ ${minBg}:1) — it sinks into the ground`);

  const others: number[] = [];
  for (const c of commands) {
    const f = fillOf(c);
    if (f && f !== 'none' && f !== avatarFill) others.push(contrastRatio(f, background));
  }
  if (others.length) {
    others.sort((x, y) => x - y);
    const median = others[Math.floor(others.length / 2)];
    if (avatarContrast < median * minFactor) issues.push(`avatar (${avatarFill}, ${avatarContrast.toFixed(2)}:1) does not pop from the scenery (median ${median.toFixed(2)}:1) — it needs ≥ ${minFactor}× the median contrast`);
  }
  return dedupe(issues);
}

export interface TelegraphFrame {
  /** True on frames where a threat is warning (flash/wind-up) before it can hurt you. */
  telegraphing: boolean;
  /** True on frames where the threat's hitbox is live (it can deal damage). */
  active: boolean;
}

/**
 * Telegraph gate: every activation of a threat must be preceded by at least
 * `minFrames` of contiguous telegraph. Reactive play is only possible if danger
 * announces itself; a hitbox that goes live with no wind-up is an unfair death.
 * Feed a per-frame timeline (one entry per sim frame) for a single threat.
 */
export function telegraphIssues(timeline: readonly TelegraphFrame[], minFrames: number, label = 'threat'): string[] {
  const issues: string[] = [];
  let warn = 0;
  for (let i = 0; i < timeline.length; i++) {
    const f = timeline[i];
    const justActivated = f.active && (i === 0 || !timeline[i - 1].active);
    if (justActivated && warn < minFrames) issues.push(`${label}: hitbox went live at frame ${i} after only ${warn} telegraph frame(s) — needs ≥ ${minFrames} of wind-up`);
    warn = f.active ? 0 : f.telegraphing ? warn + 1 : 0;
  }
  return dedupe(issues);
}

// ── 3b. Lit readability ──────────────────────────────────────────────────────
// A LightLayer multiplies an ambient darkness over the world. Palette AA holds
// PRE-lighting (that gate is `salienceIssues`); once the frame is lit, the
// avatar can still vanish into the dark if no pool falls on it. This gate reads
// the deterministic light run (render/lightRun.ts) straight from the display
// list and asserts the avatar sits in enough light to stay readable.

export interface LightingOptions {
  /**
   * Minimum effective ambient level (0 = pitch black, 1 = fully lit) the avatar
   * must sit in — either from the ambient base or a pool falling on it (default
   * 0.35). Below this the avatar reads as a silhouette in shadow.
   */
  minLitLevel?: number;
}

/** Effective luminance of a hex fill scaled by a 0..1 light level. */
const litLuminance = (fill: string, level: number): number => relLuminance(fill) * level;

/**
 * Lit-readability gate. Given the rendered display list (which must include the
 * LightLayer's run) and the avatar's WORLD position + fill, compute the light
 * level reaching the avatar: the ambient base, lifted toward 1 by any pool whose
 * radius covers it (scaled by that pool's peak brightness). If the avatar ends up
 * below `minLitLevel`, it is a silhouette lost in the dark — flagged. When the
 * frame carries no parseable light run, there is nothing to darken: pass (empty).
 */
export function lightingIssues(commands: DrawCommand[], avatarFill: string, avatarWorld: Vec2, opts: LightingOptions = {}): string[] {
  const minLit = opts.minLitLevel ?? 0.35;
  const { light } = splitByLightLayer(sortCommands(commands));
  const parsed = light.length ? parseLightRun(light) : null;
  if (!parsed) return [];

  // Ambient base level: how bright the darkness rect is (its own luminance in
  // [0,1] — a near-black ambient is a low level, white is fully lit).
  let level = relLuminance(parsed.ambient.fill ?? '#000000');

  // Any pool whose disc covers the avatar lifts the level by its peak brightness,
  // attenuated by distance from the pool center (linear falloff to the radius).
  for (const l of parsed.lights) {
    const c = l.circle;
    // Pool center/radius are in the pool's own transform (the camera view). Map
    // the avatar's world point into that same space to measure the distance.
    const p = applyTransform(invertTransform(c.transform), avatarWorld);
    const d = dhypot(p.x - c.cx, p.y - c.cy);
    if (d >= c.radius) continue;
    const peak = poolPeak(c);
    const reach = 1 - d / c.radius;
    level = Math.min(1, level + peak * reach);
  }

  const issues: string[] = [];
  if (level < minLit) {
    const lum = litLuminance(avatarFill, level);
    issues.push(
      `avatar (${avatarFill}) sits in light level ${level.toFixed(2)} (needs ≥ ${minLit}) — it sinks into the ambient darkness (effective luminance ${lum.toFixed(3)}); add a pool over it or raise ambient level`,
    );
  }
  return issues;
}

/** Peak brightness of a pool: the lightest gradient stop's luminance (0..1). */
function poolPeak(c: DrawCommand): number {
  const g = (c as { gradient?: { stops: { color: string }[] } }).gradient;
  if (g && g.stops.length) {
    let max = 0;
    for (const s of g.stops) max = Math.max(max, relLuminance(s.color));
    return max;
  }
  const fill = (c as { fill?: string }).fill;
  return fill ? relLuminance(fill) : 1;
}

// ── 4. Camera lawfulness ─────────────────────────────────────────────────────

export interface CameraOptions {
  /** Fixed timestep between samples in seconds (default 1/60). */
  dt?: number;
  /** Max camera speed in px/s before it reads as a snap (default 1800). */
  maxSpeed?: number;
  /** Max camera acceleration in px/s² before the motion reads as jerky (default 90000). */
  maxAccel?: number;
}

/**
 * Camera lawfulness gate over a sampled position series (one Vec2 per frame). A
 * good follow camera never teleports and never jerks: bounded velocity (no snap)
 * and bounded acceleration (smooth, not stuttery). You cannot systematize when a
 * director SHOULD break these for drama — but an unbidden snap is always a bug.
 */
export function cameraIssues(samples: readonly Vec2[], opts: CameraOptions = {}): string[] {
  const dt = opts.dt ?? 1 / 60;
  const maxSpeed = opts.maxSpeed ?? 1800;
  const maxAccel = opts.maxAccel ?? 90000;
  if (samples.length < 3) return [];
  const issues: string[] = [];
  const vel: number[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - samples[i - 1].x;
    const dy = samples[i].y - samples[i - 1].y;
    const speed = dhypot(dx, dy) / dt;
    vel.push(speed);
    if (speed > maxSpeed) issues.push(`camera snapped at frame ${i}: ${Math.round(speed)}px/s exceeds the ${maxSpeed}px/s ceiling`);
  }
  for (let i = 1; i < vel.length; i++) {
    const accel = Math.abs(vel[i] - vel[i - 1]) / dt;
    if (accel > maxAccel) issues.push(`camera jerked at frame ${i + 1}: ${Math.round(accel)}px/s² exceeds the ${maxAccel}px/s² ceiling`);
  }
  return dedupe(issues);
}

/**
 * Look-ahead gate: on the axes where the target is moving, the camera should lead
 * in the SAME direction (bias the view toward where you're going), never trail
 * backwards. Compares net camera drift to net target drift across the series.
 */
export function lookAheadIssues(cameraSamples: readonly Vec2[], targetSamples: readonly Vec2[], minLead = 0): string[] {
  if (cameraSamples.length < 2 || cameraSamples.length !== targetSamples.length) return [];
  const camDX = cameraSamples[cameraSamples.length - 1].x - cameraSamples[0].x;
  const tgtDX = targetSamples[targetSamples.length - 1].x - targetSamples[0].x;
  const camDY = cameraSamples[cameraSamples.length - 1].y - cameraSamples[0].y;
  const tgtDY = targetSamples[targetSamples.length - 1].y - targetSamples[0].y;
  const issues: string[] = [];
  if (Math.abs(tgtDX) > minLead && Math.sign(camDX) !== 0 && Math.sign(camDX) !== Math.sign(tgtDX)) issues.push('camera drifts opposite the target on X — the view lags behind instead of leading');
  if (Math.abs(tgtDY) > minLead && Math.sign(camDY) !== 0 && Math.sign(camDY) !== Math.sign(tgtDY)) issues.push('camera drifts opposite the target on Y — the view lags behind instead of leading');
  return issues;
}

// ── The declarative floor: one spec, all applicable gates ────────────────────
// A game DECLARES its feel contract once (`export const feel: FeelSpec`); the
// portfolio audit (`npm run feel`) and the game's own verify then run every gate
// the spec provides inputs for. This is how the floor rises for ALL output: new
// games declare a spec by definition-of-done, and the audit reports coverage.

export interface FeelSpec {
  /** The avatar's fill color — enables the salience gate. */
  avatarFill?: string;
  /** Background color (defaults to the game's `background`). */
  background?: string;
  /** Controller grace config — enables the forgiveness gate (PlatformerConfig fits). */
  forgiveness?: ForgivenessSpec;
  /** Declared feedback contract + the events that must be covered — enables the feedback gate. */
  feedback?: { contract: FeedbackContract; events: readonly string[] };
  /** True for scrolling games — enables the camera gate (needs sampled positions). */
  scrolls?: boolean;
  /**
   * True for games with a LightLayer — enables the lit-readability gate (needs a
   * rendered frame carrying the light run + the avatar's world position). Uses
   * `avatarFill` for the color.
   */
  lit?: boolean;
}

/** Runtime inputs the audit/verify computes and hands to the aggregator. */
export interface FeelContext {
  /** A rendered display list (drive a few frames, then `world.render()`). */
  commands?: DrawCommand[];
  /** Sampled camera-follow positions over a run (exclude the pre-start frame). */
  camSamples?: readonly Vec2[];
  /** Matching target positions, for the look-ahead check. */
  targetSamples?: readonly Vec2[];
  /** Fixed timestep for the camera gate (default 1/60). */
  dt?: number;
  /** Background fallback if the spec omits one. */
  background?: string;
  /** The avatar's WORLD position in the rendered frame — enables the lit-readability gate. */
  avatarWorld?: Vec2;
}

export interface FeelReport {
  ok: boolean;
  /** One entry per gate that actually ran (given the spec + context). */
  sections: { gate: string; issues: string[] }[];
  /** Gates the spec asks for but that lacked the runtime context to run. */
  skipped: string[];
}

/**
 * Run every feel gate the spec provides inputs for, returning a structured report.
 * Static gates (forgiveness, feedback) run from the spec alone; salience needs a
 * rendered display list; the camera gate needs sampled positions. Gates whose
 * context is missing are reported as `skipped`, never silently dropped.
 */
export function runFeelGates(spec: FeelSpec, ctx: FeelContext = {}): FeelReport {
  const sections: { gate: string; issues: string[] }[] = [];
  const skipped: string[] = [];
  const bg = spec.background ?? ctx.background ?? '#ffffff';
  if (spec.forgiveness) sections.push({ gate: 'forgiveness', issues: forgivenessIssues(spec.forgiveness) });
  if (spec.feedback) sections.push({ gate: 'feedback', issues: feedbackIssues(spec.feedback.contract, spec.feedback.events) });
  if (spec.avatarFill) {
    if (ctx.commands) sections.push({ gate: 'salience', issues: salienceIssues(ctx.commands, spec.avatarFill, bg) });
    else skipped.push('salience (no rendered frame)');
  }
  if (spec.lit) {
    if (spec.avatarFill && ctx.commands && ctx.avatarWorld) {
      sections.push({ gate: 'lighting', issues: lightingIssues(ctx.commands, spec.avatarFill, ctx.avatarWorld) });
    } else skipped.push('lighting (needs avatarFill + rendered frame + avatarWorld)');
  }
  if (spec.scrolls) {
    if (ctx.camSamples && ctx.camSamples.length >= 3) {
      const issues = cameraIssues(ctx.camSamples, { dt: ctx.dt });
      if (ctx.targetSamples) issues.push(...lookAheadIssues(ctx.camSamples, ctx.targetSamples));
      sections.push({ gate: 'camera', issues });
    } else skipped.push('camera (no sampled positions)');
  }
  return { ok: sections.every((s) => s.issues.length === 0), sections, skipped };
}

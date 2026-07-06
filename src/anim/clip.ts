// Authored animation CLIPS as plain data. A ClipDef is a JSON-serializable
// description of how a rig's transforms change over time: a set of tracks, each
// targeting one channel of one node (addressed by a '/'-separated path from the
// player's rig root) with a list of keyframes. Sampling is a PURE function of
// (def, time) — no node, no state — so it is trivially testable and produces
// bit-identical values on every engine (keyframe interpolation is plain
// arithmetic; the eases route through the dmath-backed EASINGS table).
//
// The clip format is the seam's data half: a ClipDef never reads or writes game
// state, and the values it produces are applied ONLY to cosmetic node transforms
// by ClipPlayer. Gameplay pose lives elsewhere (Fsm/PhaseClock/world.state); a
// clip is pure presentation and can be deleted without changing any outcome.
//
// rootMotion is RESERVED but not implemented — a future rootMotionDelta(clip, t0, t1) will be consumed + quantized by the logical side, never by ClipPlayer.

import { EASINGS } from '../scene/tween';

/** Which transform channel a track drives. */
export type ClipChannel = 'x' | 'y' | 'rotation' | 'scaleX' | 'scaleY' | 'opacity';

export const CLIP_CHANNELS: readonly ClipChannel[] = ['x', 'y', 'rotation', 'scaleX', 'scaleY', 'opacity'];

/** How the playhead behaves past `duration`. */
export type ClipLoop = 'loop' | 'once' | 'pingpong';

/** One keyframe: value `v` at time `t` (seconds), with the ease used to reach it FROM the previous key. */
export interface Keyframe {
  t: number;
  v: number;
  /** EASINGS name applied over the segment ENDING at this key. Default 'linear'. */
  ease?: keyof typeof EASINGS;
}

/** One track: a channel of one target node, driven by an ordered keyframe list. */
export interface TrackDef {
  /** '/'-separated path from the rig root to the target node (matched by Node.name). */
  target: string;
  channel: ClipChannel;
  /** Keyframes, ascending in `t`. At least one. */
  keys: Keyframe[];
}

/** A discrete event fired as the playhead crosses `t` (half-open (t0,t1] window). */
export interface ClipEvent {
  t: number;
  name: string;
}

/** A full clip: duration, loop mode, tracks, optional events. Plain data. */
export interface ClipDef {
  /** Clip length in seconds (> 0). */
  duration: number;
  loop: ClipLoop;
  tracks: TrackDef[];
  events?: ClipEvent[];
  /** RESERVED — root motion is not implemented (see file header). */
  rootMotion?: never;
}

/**
 * Map a raw elapsed time to a clip-local time in [0, duration], honoring the
 * loop mode. `once` clamps at both ends; `loop` wraps; `pingpong` folds so the
 * playhead ping-pongs 0→d→0. Pure and total (guards duration <= 0 → 0).
 */
export function clipTime(def: ClipDef, elapsed: number): number {
  const d = def.duration;
  if (d <= 0) return 0;
  if (def.loop === 'once') return elapsed < 0 ? 0 : elapsed > d ? d : elapsed;
  if (def.loop === 'loop') {
    const m = elapsed % d;
    return m < 0 ? m + d : m;
  }
  // pingpong: period is 2d; fold the second half back.
  const p = 2 * d;
  let m = elapsed % p;
  if (m < 0) m += p;
  return m <= d ? m : p - m;
}

/** True once a `once` clip has run past its end (used by ClipPlayer to fire `finished`). */
export function clipFinished(def: ClipDef, elapsed: number): boolean {
  return def.loop === 'once' && def.duration > 0 && elapsed >= def.duration;
}

/**
 * Binary-search the keyframe segment containing local time `t` and return the
 * eased-interpolated value. Before the first key → first value; after the last →
 * last value (clips are sampled at a clamped clipTime, so this only bites at the
 * exact ends). Allocation-free: no array building, no closures.
 */
export function sampleTrack(keys: Keyframe[], t: number): number {
  const n = keys.length;
  if (n === 0) return 0;
  if (n === 1 || t <= keys[0].t) return keys[0].v;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  // Find the first key with keys[hi].t >= t → segment is [hi-1, hi].
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (keys[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  const b = keys[hi];
  const a = keys[hi - 1];
  const span = b.t - a.t;
  if (span <= 0) return b.v;
  const raw = (t - a.t) / span;
  const ease = EASINGS[b.ease ?? 'linear'] ?? EASINGS.linear;
  return a.v + (b.v - a.v) * ease(raw);
}

/**
 * A sampled pose channel: which target/channel and the value. `sampleClip`
 * returns one per track. Kept flat (not a nested object) so ClipPlayer can bind
 * each to a resolved node once and apply in O(tracks) with no lookups.
 */
export interface SampledChannel {
  target: string;
  channel: ClipChannel;
  value: number;
}

/**
 * PURE sample of the whole clip at raw `elapsed` seconds → one SampledChannel per
 * track. Never mutates `def`. Two calls with the same args are deep-equal. This
 * is the reference sampler; ClipPlayer uses a prebound, allocation-free variant
 * of the same math for the hot path.
 */
export function sampleClip(def: ClipDef, elapsed: number): SampledChannel[] {
  const t = clipTime(def, elapsed);
  return def.tracks.map((tr) => ({ target: tr.target, channel: tr.channel, value: sampleTrack(tr.keys, t) }));
}

/**
 * Events crossed as the playhead advances from raw `prev` to raw `next`, in the
 * order they fire. FIXED SEMANTICS:
 *  - half-open window `(t0, t1]` in clip-local time (an event exactly at the new
 *    time fires; one exactly at the old time does NOT re-fire);
 *  - `loop` wrap emits the TAIL segment (prevLocal, duration] then the HEAD
 *    segment (0, nextLocal];
 *  - `once` never re-fires an event once the playhead is at/after duration;
 *  - order within a segment is ascending by `t`, tail before head on a wrap.
 * Pure; returns event names in fire order.
 */
export function clipEvents(def: ClipDef, prev: number, next: number): string[] {
  const evs = def.events;
  if (!evs || evs.length === 0 || next <= prev) return [];
  const d = def.duration;
  const out: string[] = [];
  const inWindow = (t: number, lo: number, hi: number): boolean => t > lo && t <= hi;
  const emit = (lo: number, hi: number): void => {
    // Ascending by t so ties/adjacent events fire in author order.
    for (const e of evs) if (inWindow(e.t, lo, hi)) out.push(e.name);
  };

  if (def.loop === 'once' || d <= 0) {
    // Clamp to the clip end; an event at exactly `d` fires the first time we reach it.
    const lo = prev < 0 ? 0 : prev > d ? d : prev;
    const hi = next < 0 ? 0 : next > d ? d : next;
    emit(lo, hi);
    return out;
  }

  const prevLocal = clipTime(def, prev);
  const nextLocal = clipTime(def, next);
  // How many clip periods the raw playhead advanced tells us whether we wrapped.
  const periodLen = def.loop === 'pingpong' ? 2 * d : d;
  const wraps = Math.floor(next / periodLen) - Math.floor(prev / periodLen);

  if (def.loop === 'pingpong') {
    // Simplify: pingpong events are rare; sample local motion in one direction.
    // If no fold happened this step, the local window is monotonic.
    if (wraps === 0 && nextLocal >= prevLocal) emit(prevLocal, nextLocal);
    else if (wraps === 0) emit(nextLocal, prevLocal); // moving backward on the fold
    else {
      // Crossed a fold: tail toward the turn, then head back.
      emit(Math.min(prevLocal, nextLocal), d);
      emit(0, Math.max(prevLocal, nextLocal));
    }
    return out;
  }

  // loop
  if (wraps === 0 && nextLocal >= prevLocal) {
    emit(prevLocal, nextLocal);
  } else {
    // One or more wraps: tail (prevLocal, d] then head (0, nextLocal].
    emit(prevLocal, d);
    emit(0, nextLocal);
  }
  return out;
}

/**
 * Validate a clip's DATA, in the levelIssues/tuningIssues idiom: return ALL
 * problems as human-readable strings (empty = clean), never throw. Optionally
 * pass the set of valid target paths (`knownTargets`) to catch tracks that point
 * at a node the rig doesn't contain.
 */
export function clipIssues(def: ClipDef, knownTargets?: readonly string[]): string[] {
  const issues: string[] = [];
  if (!(def.duration > 0)) issues.push(`duration must be > 0 (got ${def.duration})`);
  if (def.loop !== 'loop' && def.loop !== 'once' && def.loop !== 'pingpong') {
    issues.push(`loop must be 'loop' | 'once' | 'pingpong' (got '${String(def.loop)}')`);
  }
  if (!def.tracks || def.tracks.length === 0) issues.push('clip has no tracks');
  const known = knownTargets ? new Set(knownTargets) : null;
  (def.tracks ?? []).forEach((tr, i) => {
    const where = `track ${i} (${tr.target}/${tr.channel})`;
    if (!CLIP_CHANNELS.includes(tr.channel)) issues.push(`${where}: unknown channel '${tr.channel}'`);
    if (known && !known.has(tr.target)) issues.push(`${where}: target '${tr.target}' is not in the rig`);
    if (!tr.keys || tr.keys.length === 0) {
      issues.push(`${where}: no keyframes`);
    } else {
      for (let k = 0; k < tr.keys.length; k++) {
        const key = tr.keys[k];
        if (!Number.isFinite(key.t) || !Number.isFinite(key.v)) issues.push(`${where}: key ${k} has non-finite t/v`);
        if (key.t < 0 || key.t > def.duration) issues.push(`${where}: key ${k} time ${key.t} is outside [0, ${def.duration}]`);
        if (k > 0 && key.t < tr.keys[k - 1].t) issues.push(`${where}: keys must be ascending in t (key ${k} = ${key.t} < ${tr.keys[k - 1].t})`);
        if (key.ease !== undefined && !(key.ease in EASINGS)) issues.push(`${where}: key ${k} unknown ease '${String(key.ease)}'`);
      }
    }
  });
  (def.events ?? []).forEach((e, i) => {
    if (!Number.isFinite(e.t) || e.t < 0 || e.t > def.duration) issues.push(`event ${i} ('${e.name}') time ${e.t} is outside [0, ${def.duration}]`);
    if (!e.name) issues.push(`event ${i} has no name`);
  });
  return [...new Set(issues)];
}

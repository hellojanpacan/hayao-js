// ClipPlayer — a cosmetic Node that plays authored ClipDefs onto a rig. It is the
// VISUAL half of the animation seam: it advances a playhead on the fixed clock,
// samples the current clip (and, mid-crossfade, the outgoing one) via PREBOUND
// tracks, and writes the result straight into the rig's node transforms. Because
// every write lands on cosmetic-derived transforms and the player is itself
// `cosmetic = true`, none of it enters world.hash() — strip the whole rig and the
// game hashes identically. Blend weights and playheads never gate gameplay.
//
// ORDERING CONTRACT (documented, no scheduler): the tree updates depth-first in
// child-index order, so a rig's writers must be siblings ordered clip → IK →
// verlet. Make the ClipPlayer child 0 of the rig, IkTargets LATER siblings, and
// VerletChains deeper: the clip poses the joints first, then IK overrides the
// limb it owns, then springs/verlet trail off the posed result. Same rule the
// plan fixes for IkTarget.
//
// HOT PATH: prebound BoundTracks (resolved once in rebind), reusable Pose buffers,
// binary-search key lookup — no find(), no per-frame allocation (VerletChain
// discipline). Distinct from AnimationPlayer (ad-hoc value tweens); a ClipPlayer
// plays whole authored clips against a skeleton.

import { Node, type NodeConfig } from './node';
import {
  clipEvents,
  clipFinished,
  clipTime,
  sampleTrack,
  type ClipDef,
} from '../anim/clip';
import { mixPose, poseKey, type Pose } from '../anim/blend';
import { applyChannel, buildSkeleton, resolveTracks, type BoundTrack, type Skeleton } from '../anim/skeleton';
import { EASINGS } from './tween';

interface ClipEntry {
  def: ClipDef;
  tracks: BoundTrack[];
}

export interface ClipPlayerConfig extends NodeConfig {
  /** The rig root this player poses. Defaults to the player's own parent at ready. */
  rig?: Node;
}

/**
 * Plays named clips onto a rig. Add clips with `add(name, def)`, then `play(name,
 * {fade})`. Reads: `time` (current playhead, s), `current` (playing clip name).
 * Signals: `event` (payload = event name) and `finished` (a `once` clip ended).
 */
export class ClipPlayer extends Node {
  override readonly type = 'ClipPlayer';

  private rig: Node | null;
  private skeleton: Skeleton | null = null;
  private clips = new Map<string, ClipEntry>();

  private currentName: string | null = null;
  private elapsed = 0;

  // Crossfade state: the clip we are fading FROM, its frozen playhead, and progress.
  private prevName: string | null = null;
  private prevElapsed = 0;
  private fadeDur = 0;
  private fadeT = 0;

  // Reusable pose buffers for the crossfade path (allocation-free).
  private poseA: Pose = {};
  private poseB: Pose = {};
  private poseMix: Pose = {};

  constructor(config: ClipPlayerConfig = {}) {
    super(config);
    this.cosmetic = true; // hard-set: the player is pure view (VerletChain style).
    this.rig = config.rig ?? null;
  }

  protected override onReady(): void {
    if (!this.rig) this.rig = this.parent;
    this.rebind();
  }

  /** Register a clip under `name`. Rebinds its tracks against the current rig. */
  add(name: string, def: ClipDef): this {
    this.clips.set(name, { def, tracks: this.rig ? resolveTracks(def, this.ensureSkeleton()) : [] });
    return this;
  }

  /** Re-resolve the rig + every clip's tracks (call after the rig subtree changes). */
  rebind(rig?: Node): void {
    if (rig) this.rig = rig;
    if (!this.rig) return;
    this.skeleton = buildSkeleton(this.rig);
    for (const [, entry] of this.clips) entry.tracks = resolveTracks(entry.def, this.skeleton);
  }

  private ensureSkeleton(): Skeleton {
    if (!this.skeleton && this.rig) this.skeleton = buildSkeleton(this.rig);
    return this.skeleton as Skeleton;
  }

  /**
   * Play `name`, optionally crossfading over `fade` seconds from whatever is
   * playing. Restarting the same clip with no fade rewinds it. A fade freezes the
   * outgoing clip's playhead and blends it out with EASINGS.quadInOut.
   */
  play(name: string, opts: { fade?: number } = {}): void {
    if (!this.clips.has(name)) return;
    const fade = opts.fade ?? 0;
    if (fade > 0 && this.currentName && this.currentName !== name) {
      this.prevName = this.currentName;
      this.prevElapsed = this.elapsed;
      this.fadeDur = fade;
      this.fadeT = 0;
    } else {
      this.prevName = null;
      this.fadeDur = 0;
      this.fadeT = 0;
    }
    this.currentName = name;
    this.elapsed = 0;
  }

  /** Stop playback (freezes the rig at its current pose). */
  stop(): void {
    this.currentName = null;
    this.prevName = null;
    this.fadeDur = 0;
  }

  /** Current playhead in seconds (raw elapsed, pre-loop-wrap). */
  get time(): number {
    return this.elapsed;
  }
  /** The clip currently playing, or null. */
  get current(): string | null {
    return this.currentName;
  }

  /** Fired with the event name each time the playhead crosses a clip event. */
  get event() {
    return this.signal<string>('event');
  }
  /** Fired when a `once` clip reaches its end. */
  get finished() {
    return this.signal<string>('finished');
  }

  protected override onProcess(dt: number): void {
    const name = this.currentName;
    if (!name) return;
    const entry = this.clips.get(name);
    if (!entry) return;

    const prevElapsed = this.elapsed;
    this.elapsed += dt;

    if (this.fadeDur > 0 && this.prevName) {
      // Crossfade: sample both clips into reusable poses, mix by eased progress.
      this.fadeT += dt;
      const raw = this.fadeT >= this.fadeDur ? 1 : this.fadeT / this.fadeDur;
      const w = EASINGS.quadInOut(raw);
      const prevEntry = this.clips.get(this.prevName);
      // Outgoing clip's playhead is FROZEN at handoff (prevElapsed), so its pose
      // holds while it fades out — no double-advance.
      if (prevEntry) this.samplePose(prevEntry, this.prevElapsed, this.poseA);
      this.samplePose(entry, this.elapsed, this.poseB);
      mixPose(this.poseA, this.poseB, w, this.poseMix);
      this.applyPose(entry, this.poseMix);
      if (raw >= 1) {
        this.prevName = null;
        this.fadeDur = 0;
      }
    } else {
      // Steady state: apply each bound track directly (no pose bag, O(tracks)).
      this.applyDirect(entry, this.elapsed);
    }

    // Events (incoming clip only — the fixed crossfade rule).
    if (entry.def.events && entry.def.events.length > 0) {
      const names = clipEvents(entry.def, prevElapsed, this.elapsed);
      for (const ev of names) this.emit('event', ev);
    }

    // `once` finish.
    if (clipFinished(entry.def, this.elapsed) && !clipFinished(entry.def, prevElapsed)) {
      this.emit('finished', name);
    }
  }

  /** Direct steady-state apply: sample each bound track and write its channel. */
  private applyDirect(entry: ClipEntry, elapsed: number): void {
    const t = clipTime(entry.def, elapsed);
    const tracks = entry.tracks;
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      applyChannel(tr.node, tr.channel, sampleTrack(tr.keys, t));
    }
  }

  /** Sample an entry's bound tracks into a reusable Pose (clears then fills). */
  private samplePose(entry: ClipEntry, elapsed: number, out: Pose): void {
    for (const k in out) delete out[k];
    const t = clipTime(entry.def, elapsed);
    const tracks = entry.tracks;
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      out[poseKey(tr.target, tr.channel)] = sampleTrack(tr.keys, t);
    }
  }

  /** Write a mixed pose back onto the incoming entry's bound nodes. */
  private applyPose(entry: ClipEntry, pose: Pose): void {
    const tracks = entry.tracks;
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      const v = pose[poseKey(tr.target, tr.channel)];
      if (v !== undefined) applyChannel(tr.node, tr.channel, v);
    }
  }
}

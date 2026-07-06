// anim-lab — one primitive: the authored-animation stack. A Bone2D rig (a little
// figure with a two-bone arm), a ClipPlayer holding two authored ClipDefs (idle +
// wave), a Blend1D that crossfades between them by a slider, an IkTarget that
// lets the arm reach for the pointer, and a SkeletonDebug overlay you can toggle.
// No genre, no win state — just the parts, wired the idiomatic way. See
// sandboxes/README.md and src/anim/ for each piece in isolation.
//
// THE SEAM, in miniature: the rig lives under a `cosmetic = true` parent, and
// ClipPlayer / IkTarget / SkeletonDebug are all hard-cosmetic, so none of the
// animation touches world.hash(). The only hashed state is the knob values (the
// figure's canonical config) — strip the whole rig and the sandbox hashes the
// same. This is exactly how a game rigs a character: animation is pure view over
// logical state, never the other way around.
//
// ORDERING CONTRACT (DFS, child-index order → clip then IK): the ClipPlayer is
// child 0 of the rig so it poses the arm first; the IkTarget is a LATER sibling so
// it OVERRIDES the arm when reaching is on. Same rule ikTarget.ts documents.

import {
  Node,
  Sprite,
  Text,
  Bone2D,
  ClipPlayer,
  IkTarget,
  SkeletonDebug,
  Blend1D,
  applyChannel,
  KENTO,
  MEADOW,
  registerNode,
  defineGame,
  knob,
  type ClipDef,
  type InputMap,
  type World,
} from '@hayao';

// Named keys so the on-screen hints ("I ik, D debug") match the real controls.
const AL_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  ik: ['KeyI'],
  debug: ['KeyG'],
};

// ── Rig geometry (local px) ───────────────────────────────────────────────
const UPPER_LEN = 78; // shoulder → elbow
const FORE_LEN = 66; // elbow → hand
const SHOULDER = { x: 0, y: -70 }; // arm root, relative to the figure origin

// The figure stands centred in the 1280×720 view.
const ORIGIN = { x: 560, y: 430 };

// ── Two authored clips (plain data — pure presentation) ────────────────────
// Bone rotations are LOCAL angles in radians. At rotation 0 a bone points along
// +x; the arm hangs down-and-out from the shoulder. Both clips loop and are
// authored at the SAME nominal pace so the Blend1D keeps them phase-locked.

/** A calm resting sway: the arm drifts by a few degrees, breathing. */
const idle: ClipDef = {
  duration: 2.4,
  loop: 'loop',
  tracks: [
    {
      target: 'upperArm',
      channel: 'rotation',
      keys: [
        { t: 0, v: 0.62 },
        { t: 1.2, v: 0.74, ease: 'sineInOut' },
        { t: 2.4, v: 0.62, ease: 'sineInOut' },
      ],
    },
    {
      target: 'upperArm/forearm',
      channel: 'rotation',
      keys: [
        { t: 0, v: 0.5 },
        { t: 1.2, v: 0.34, ease: 'sineInOut' },
        { t: 2.4, v: 0.5, ease: 'sineInOut' },
      ],
    },
  ],
};

/** A big friendly wave: the upper arm lifts and the forearm swings, once a beat. */
const wave: ClipDef = {
  duration: 1.2,
  loop: 'loop',
  tracks: [
    {
      target: 'upperArm',
      channel: 'rotation',
      keys: [
        { t: 0, v: -0.9 },
        { t: 0.6, v: -1.15, ease: 'sineInOut' },
        { t: 1.2, v: -0.9, ease: 'sineInOut' },
      ],
    },
    {
      target: 'upperArm/forearm',
      channel: 'rotation',
      keys: [
        { t: 0, v: -0.85, ease: 'sineInOut' },
        { t: 0.3, v: 0.35, ease: 'sineInOut' },
        { t: 0.6, v: -0.85, ease: 'sineInOut' },
        { t: 0.9, v: 0.35, ease: 'sineInOut' },
        { t: 1.2, v: -0.85, ease: 'sineInOut' },
      ],
    },
  ],
  events: [{ t: 0.3, name: 'wave' }, { t: 0.9, name: 'wave' }],
};

const CLIPS = ['idle', 'wave'] as const;

class AnimLab extends Node {
  override readonly type = 'AnimLab';

  // ── Canonical (hashed) knob state — the figure's config, nothing else. ──
  clipIdx = 0; // which clip the blend leans toward (0 idle · 1 wave)
  blend = 0; // 0 → idle, 1 → wave (the Blend1D parameter)
  ik = false; // arm reaches for the pointer when true
  debug = false; // SkeletonDebug overlay
  speed = 1; // playback speed multiplier

  // ── The rig (all cosmetic view) ─────────────────────────────────────────
  private rig = new Node({ name: 'rig' });
  private upperArm!: Bone2D;
  private forearm!: Bone2D;
  private hand!: Sprite;
  private player!: ClipPlayer;
  private ikTarget!: IkTarget;
  private debugOverlay!: SkeletonDebug;
  private blender = new Blend1D([
    { clip: idle, x: 0 },
    { clip: wave, x: 1 },
  ]);
  private phase = 0; // normalized blend phase [0,1), advanced on the fixed clock
  private hud!: Text;

  protected override onReady(): void {
    const w = this.world as World;
    // Tuning is the initial truth; the live keys nudge from there.
    this.clipIdx = w.tune<string>('clip') === 'wave' ? 1 : 0;
    this.blend = w.tune('blend');
    this.ik = w.tune<string>('ik') === 'on';
    this.debug = w.tune<string>('debug') === 'on';
    this.speed = w.tune('speed');

    // The whole rig subtree is cosmetic → its transforms never enter the hash.
    this.rig.cosmetic = true;
    this.rig.pos = { x: ORIGIN.x, y: ORIGIN.y };
    this.addChild(this.rig);

    this.buildFigure();
    this.buildArm();

    // clip → IK ordering: ClipPlayer is child 0, IkTarget a later sibling.
    this.player = new ClipPlayer({ name: 'player', rig: this.rig });
    this.player.add('idle', idle).add('wave', wave);
    this.rig.addChild(this.player); // onReady binds tracks against the rig
    this.player.play('idle');

    // The IK goal is the target node's OWN world position; we move it to the
    // pointer each step. Parent it on the rig AFTER the player (later sibling).
    this.ikTarget = new IkTarget({ name: 'reach', bones: [this.upperArm, this.forearm], bendDir: 1 });
    this.rig.addChild(this.ikTarget);

    // Debug overlay (toggled by `visible`). Cosmetic; emits transient commands.
    this.debugOverlay = new SkeletonDebug({ name: 'debug', rig: this.rig, z: 50 });
    this.rig.addChild(this.debugOverlay);
    this.debugOverlay.visible = this.debug;

    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 44 }, size: 20, align: 'center', fill: MEADOW.inkSoft, text: '' });
    this.hud.cosmetic = true;
    this.addChild(this.hud);
    this.refreshHud();
  }

  /** Static torso + head sprites — context so the arm reads as an arm. Cosmetic. */
  private buildFigure(): void {
    // Ground shadow.
    this.rig.addChild(new Sprite({ pos: { x: 0, y: 96 }, z: 0, shape: { kind: 'circle', radius: 44 }, fill: KENTO.line, opacity: 0.5 }));
    // Torso.
    this.rig.addChild(new Sprite({ pos: { x: 0, y: 6 }, z: 2, shape: { kind: 'rect', w: 64, h: 150, r: 26 }, fill: KENTO.ko, stroke: KENTO.sumi, strokeWidth: 3 }));
    // Head.
    this.rig.addChild(new Sprite({ pos: { x: 0, y: -96 }, z: 3, shape: { kind: 'circle', radius: 30 }, fill: KENTO.kinu, stroke: KENTO.sumi, strokeWidth: 3 }));
    // A far (static) arm for silhouette balance, behind the torso.
    this.rig.addChild(new Sprite({ pos: { x: -34, y: 4 }, z: 1, shape: { kind: 'rect', w: 22, h: 118, r: 11 }, fill: KENTO.koDeep, stroke: KENTO.sumi, strokeWidth: 2.5 }));
  }

  /** The animated arm: shoulder → upperArm(Bone2D) → forearm(Bone2D) → hand. */
  private buildArm(): void {
    // A shoulder anchor pinned to the torso (fixed world angle → clean IK).
    const shoulder = new Node({ name: 'shoulder', pos: SHOULDER, z: 4 });
    this.rig.addChild(shoulder);

    this.upperArm = new Bone2D({ name: 'upperArm', length: UPPER_LEN, z: 4 });
    this.forearm = new Bone2D({ name: 'forearm', length: FORE_LEN, pos: { x: UPPER_LEN, y: 0 }, z: 4 });
    this.hand = new Sprite({ name: 'hand', pos: { x: FORE_LEN, y: 0 }, z: 5, shape: { kind: 'circle', radius: 13 }, fill: KENTO.kinu, stroke: KENTO.sumi, strokeWidth: 3 });

    // Skin: draw each bone as a limb segment. A child sprite offset to the bone's
    // midpoint gives the segment its thickness (the Bone2D itself is a pivot).
    this.upperArm.addChild(new Sprite({ pos: { x: UPPER_LEN / 2, y: 0 }, z: 4, shape: { kind: 'rect', w: UPPER_LEN, h: 22, r: 11 }, fill: KENTO.shu, stroke: KENTO.sumi, strokeWidth: 3 }));
    this.forearm.addChild(new Sprite({ pos: { x: FORE_LEN / 2, y: 0 }, z: 4, shape: { kind: 'rect', w: FORE_LEN, h: 18, r: 9 }, fill: KENTO.shuDeep, stroke: KENTO.sumi, strokeWidth: 3 }));

    this.forearm.addChild(this.hand);
    this.upperArm.addChild(this.forearm);
    shoulder.addChild(this.upperArm);
  }

  private refreshHud(): void {
    const lean = this.blend < 0.5 ? 'idle' : 'wave';
    this.hud.text =
      `ClipPlayer + Blend1D + IK · blend ${this.blend.toFixed(2)} (${lean})   ·   IK ${this.ik ? 'on — arm reaches pointer' : 'off'}   ·   ` +
      `debug ${this.debug ? 'on' : 'off'}   ·   speed ${this.speed.toFixed(2)}×   ·   ←→ blend, I ik, G debug, ↑↓ speed`;
  }

  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const input = (this.world as World).input;

    // ── Live knob nudges (keyboard) ──────────────────────────────────────
    let changed = false;
    if (input.isDown('left')) { this.blend = Math.max(0, this.blend - 0.9 * dt); changed = true; }
    if (input.isDown('right')) { this.blend = Math.min(1, this.blend + 0.9 * dt); changed = true; }
    if (input.justPressed('ik')) { this.ik = !this.ik; changed = true; }
    if (input.justPressed('debug')) { this.debug = !this.debug; changed = true; }
    if (input.justPressed('up')) { this.speed = Math.min(3, this.speed + 0.25); changed = true; }
    if (input.justPressed('down')) { this.speed = Math.max(0, this.speed - 0.25); changed = true; }
    this.clipIdx = this.blend < 0.5 ? 0 : 1;

    // ── Advance the shared normalized phase (foot-lock discipline) ────────
    // Both clips advance one shared phase so the blend never slides; we scale by
    // the idle duration as the reference beat and by the speed knob.
    this.phase = (this.phase + (dt * this.speed) / idle.duration) % 1;
    if (this.phase < 0) this.phase += 1;

    // ── Blend the two clips into a pose and apply it to the arm bones ─────
    // This is the Blend1D path: sample both neighbours at the SAME phase, mixed
    // by the slider, then write each channel onto its bone. (We drive the arm via
    // the blend rather than the ClipPlayer's single-clip playhead so the slider is
    // a live crossfade; the ClipPlayer is still the canonical single-clip player,
    // kept playing so its `event`/`finished` signals and binding stay exercised.)
    if (!this.ik) {
      const pose = this.blender.sample(this.blend, this.phase);
      applyChannel(this.upperArm, 'rotation', pose['upperArm/rotation'] ?? 0);
      applyChannel(this.forearm, 'rotation', pose['upperArm/forearm/rotation'] ?? 0);
    }

    // ── IK: the arm reaches for the pointer when enabled ─────────────────
    // The IkTarget solves in its onProcess (a later sibling → after the clip).
    // We only need to place its world goal; parented on the rig, its LOCAL pos is
    // the pointer in the rig's frame (rig sits at ORIGIN in design space).
    this.ikTarget.visible = this.ik;
    if (this.ik) {
      const pxRaw = input.axis('pointer.x');
      const pyRaw = input.axis('pointer.y');
      // Fall back to a resting reach if the pointer hasn't moved into the view.
      const px = Number.isFinite(pxRaw) && pxRaw !== 0 ? pxRaw : ORIGIN.x + 160;
      const py = Number.isFinite(pyRaw) && pyRaw !== 0 ? pyRaw : ORIGIN.y - 40;
      // Convert design-space pointer → rig-local (rig has no rotation/scale).
      this.ikTarget.pos = { x: px - (ORIGIN.x + SHOULDER.x), y: py - (ORIGIN.y + SHOULDER.y) };
    }

    // ── Reflect toggles onto the cosmetic nodes ──────────────────────────
    this.debugOverlay.visible = this.debug;
    // Keep the canonical player pointed at the leaning clip (drives its signals).
    const want = CLIPS[this.clipIdx];
    if (this.player.current !== want) this.player.play(want, { fade: 0.25 });

    if (changed) this.refreshHud();
  }

  // Only the knob state is canonical (hashed). The rig is cosmetic and excluded.
  protected override serializeProps(): Record<string, unknown> {
    return { clipIdx: this.clipIdx, blend: this.blend, ik: this.ik, debug: this.debug, speed: this.speed };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.clipIdx === 'number') this.clipIdx = props.clipIdx;
    if (typeof props.blend === 'number') this.blend = props.blend;
    if (typeof props.ik === 'boolean') this.ik = props.ik;
    if (typeof props.debug === 'boolean') this.debug = props.debug;
    if (typeof props.speed === 'number') this.speed = props.speed;
  }
}

registerNode('AnimLab', () => new AnimLab());

export const animLabGame = defineGame({
  title: 'Anim Lab',
  width: 1280,
  height: 720,
  background: MEADOW.bg,
  inputMap: AL_INPUT_MAP,
  tuning: {
    knobs: [
      knob.enumOf('clip', { default: 'idle', options: ['idle', 'wave'], group: 'clip' }),
      knob.num('blend', { default: 0, min: 0, max: 1, step: 0.05, group: 'clip', label: 'blend idle↔wave' }),
      knob.enumOf('ik', { default: 'off', options: ['off', 'on'], group: 'ik', label: 'reach pointer' }),
      knob.enumOf('debug', { default: 'off', options: ['off', 'on'], group: 'debug', label: 'skeleton overlay' }),
      knob.num('speed', { default: 1, min: 0, max: 3, step: 0.25, group: 'clip', label: 'playback speed' }),
    ],
  },
  build: () => new AnimLab({ name: 'anim-lab' }),
  probe: (world) => {
    const lab = world.root.find('anim-lab') as AnimLab | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      blend: lab ? Number(lab.blend.toFixed(3)) : 0,
      clip: lab?.clipIdx === 1 ? 'wave' : 'idle',
      ik: lab?.ik ?? false,
      debug: lab?.debug ?? false,
      speed: lab?.speed ?? 1,
    };
  },
});

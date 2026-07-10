// The first asset in the code-as-art character library: a 2D-platformer hero
// drawn in the Solar-bold-duotone language and animated with the authored-clip
// stack. Everything here is COSMETIC by construction — the rig is a tree of plain
// Nodes posed by a ClipPlayer, so none of it touches world.hash(). A game keeps
// its logical PlatformerState as the source of truth and calls `hero.setState(...)`
// to reflect motion; the character is pure view over that state, never the reverse.
//
// Three layers, smallest to largest:
//   1. buildHeroRig(scheme)  → the posed vector rig (a Node you can add anywhere)
//   2. HERO_CLIPS            → the seven authored ClipDefs, plain data
//   3. DuotoneHero           → batteries-included node: rig + ClipPlayer + state map
//
// The rig hierarchy (names are the clip target paths, all relative to the rig):
//   hero (facing scale lives here)
//     body           — whole-figure transform (spawn pop, death topple)
//       legBack      — child of body, at the hip (moves free of the torso)
//       torso        — lean / breathe / squash
//         armBack
//         armFront
//         head
//       legFront
// Limbs hang DOWN at rotation 0 (their skin sprite is offset below the pivot), so
// every clip authors swings as small ± angles around 0 — no π/2 rest offsets.

import { Node, type NodeConfig } from '../scene/node';
import { Sprite } from '../scene/nodes';
import { ClipPlayer } from '../scene/clipPlayer';
import type { ClipChannel, ClipDef, Keyframe, TrackDef } from '../anim/clip';
import { KENTO } from './palette';
import { duotone, type DuotoneScheme } from './duotone';

// ── Rig geometry (design px, hero ≈ 150px hip-to-crown) ────────────────────
const TORSO_W = 46;
const TORSO_H = 56; // hip (y=0) up to the shoulder line (y=-56)
const HEAD_R = 30;
const HEAD_Y = -TORSO_H - 24; // head-bone centre, above the torso
const SHOULDER_X = 18;
const SHOULDER_Y = -44;
const HIP_X = 12;
const ARM_LEN = 44;
const ARM_W = 17;
const LEG_LEN = 46;
const LEG_W = 19;
const HAND_R = 10;
const FOOT_R = 11;

/** Distance from the hero origin (the hip) down to the feet — the natural ground
 *  contact. Place the node at `groundY - HERO_FOOT_OFFSET` to stand it on a floor. */
export const HERO_FOOT_OFFSET = LEG_LEN + FOOT_R;

/** Rest arm splay (radians): a touch forward / back so a still hero isn't a plank. */
const ARM_FRONT_REST = -0.1;
const ARM_BACK_REST = 0.14;

const DEFAULT_SCHEME = duotone(KENTO.asagiDeep);

// ── Rig builder ────────────────────────────────────────────────────────────

interface LimbSpec {
  name: string;
  len: number;
  w: number;
  capR: number;
  fill: string;
  z: number;
  /** Pivot position relative to the parent joint. */
  pos: { x: number; y: number };
  /** Rest rotation (radians). Default 0 (hanging straight down). */
  rotation?: number;
  /** Draw the cap as a flattened foot ellipse instead of a round hand. */
  footish?: boolean;
}

/** One articulated limb: a pivot Node with a rounded-rect skin + a cap (hand/foot),
 *  drawn hanging straight down from the pivot. */
function limb(spec: LimbSpec): Node {
  const { name, len, w, capR, fill, z, footish } = spec;
  const pivot = new Node({ name, pos: spec.pos, rotation: spec.rotation ?? 0 });
  pivot.addChild(new Sprite({ z, pos: { x: 0, y: len / 2 }, shape: { kind: 'rect', w, h: len, r: w / 2 }, fill }));
  pivot.addChild(
    footish
      ? new Sprite({ z: z + 0.1, pos: { x: 3, y: len }, shape: { kind: 'ellipse', rx: capR + 2, ry: capR - 3 }, fill })
      : new Sprite({ z: z + 0.1, pos: { x: 0, y: len }, shape: { kind: 'circle', radius: capR }, fill }),
  );
  return pivot;
}

/**
 * Build the hero's vector rig from a duotone scheme and return its root Node
 * (named `name`). The root is where FACING lives — flip it with `scale.x = -1`.
 * The returned node is `cosmetic` and ready to receive a ClipPlayer bound to it.
 * Pure: same scheme in, structurally identical tree out.
 */
export function buildHeroRig(scheme: DuotoneScheme = DEFAULT_SCHEME, name = 'hero'): Node {
  const root = new Node({ name });
  root.cosmetic = true;

  // Contact shadow — sibling of `body`, so it stays on the floor while the body
  // pops up on jump/spawn. Symmetric, so facing-flip leaves it untouched.
  root.addChild(new Sprite({ z: -2, pos: { x: 0, y: HERO_FOOT_OFFSET }, shape: { kind: 'ellipse', rx: 30, ry: 8 }, fill: scheme.shadow }));

  const body = new Node({ name: 'body' });
  root.addChild(body);

  // Back leg first (recessed tone, drawn behind the torso via low z).
  body.addChild(limb({ name: 'legBack', len: LEG_LEN, w: LEG_W, capR: FOOT_R, fill: scheme.shade, z: 1, pos: { x: -HIP_X, y: 0 }, footish: true }));

  const torso = new Node({ name: 'torso' });
  body.addChild(torso);

  // Front leg (base tone, in front of the torso).
  body.addChild(limb({ name: 'legFront', len: LEG_LEN, w: LEG_W, capR: FOOT_R, fill: scheme.base, z: 4, pos: { x: HIP_X, y: 0 }, footish: true }));

  // Torso: bold mass + a lighter chest "second tone" plane, set high on the
  // chest (not low like shorts) — the Solar duotone "front plane" read.
  torso.addChild(new Sprite({ z: 2, pos: { x: 0, y: -TORSO_H / 2 }, shape: { kind: 'rect', w: TORSO_W, h: TORSO_H, r: TORSO_W / 2 }, fill: scheme.base }));
  torso.addChild(new Sprite({ z: 2.1, pos: { x: 1, y: -TORSO_H * 0.6 }, shape: { kind: 'rect', w: TORSO_W * 0.52, h: TORSO_H * 0.5, r: TORSO_W * 0.26 }, fill: scheme.light }));

  // Arms hang from the shoulder line.
  torso.addChild(limb({ name: 'armBack', len: ARM_LEN, w: ARM_W, capR: HAND_R, fill: scheme.shade, z: 1, pos: { x: -SHOULDER_X, y: SHOULDER_Y }, rotation: ARM_BACK_REST }));
  torso.addChild(limb({ name: 'armFront', len: ARM_LEN, w: ARM_W, capR: HAND_R, fill: scheme.base, z: 5, pos: { x: SHOULDER_X, y: SHOULDER_Y }, rotation: ARM_FRONT_REST }));

  // Head: bold circle + a lighter face plane + two ink eyes. z above all so the
  // face is never occluded by a raised arm.
  const head = new Node({ name: 'head', pos: { x: 0, y: HEAD_Y } });
  torso.addChild(head);
  head.addChild(new Sprite({ z: 6, shape: { kind: 'circle', radius: HEAD_R }, fill: scheme.base }));
  // Face plane + eyes biased toward +x (facing) so the hero looks where it goes;
  // the whole rig flips, so this stays correct when facing left.
  head.addChild(new Sprite({ z: 6.1, pos: { x: 5, y: 5 }, shape: { kind: 'circle', radius: HEAD_R * 0.72 }, fill: scheme.light }));
  head.addChild(new Sprite({ z: 6.2, pos: { x: 0, y: -1 }, shape: { kind: 'circle', radius: 4.4 }, fill: scheme.ink }));
  head.addChild(new Sprite({ z: 6.2, pos: { x: 14, y: -1 }, shape: { kind: 'circle', radius: 4.4 }, fill: scheme.ink }));

  return root;
}

// ── The seven clips (plain, JSON-serializable data) ────────────────────────
// Values are ABSOLUTE local channel values (applyChannel sets, not adds), so each
// clip authors the full pose. `heroClip` fills every channel a clip doesn't move
// with a held key at its REST value — that uniform coverage is what lets any two
// clips crossfade cleanly (no limb "sticks" at a stale value across a transition).

const k = (t: number, v: number, ease?: Keyframe['ease']): Keyframe => (ease ? { t, v, ease } : { t, v });
const tr = (target: string, channel: ClipChannel, ...keys: Keyframe[]): TrackDef => ({ target, channel, keys });

/** Every animatable channel and its neutral standing value. */
const REST: Record<string, number> = {
  'body/rotation': 0,
  'body/y': 0,
  'body/scaleX': 1,
  'body/scaleY': 1,
  'body/torso/rotation': 0,
  'body/torso/y': 0,
  'body/torso/scaleY': 1,
  'body/torso/head/rotation': 0,
  'body/torso/head/y': HEAD_Y,
  'body/torso/armBack/rotation': ARM_BACK_REST,
  'body/torso/armFront/rotation': ARM_FRONT_REST,
  'body/legBack/rotation': 0,
  'body/legFront/rotation': 0,
};

function heroClip(duration: number, loop: ClipDef['loop'], moving: TrackDef[], events?: ClipDef['events']): ClipDef {
  const moved = new Set(moving.map((t) => `${t.target}/${t.channel}`));
  const held: TrackDef[] = Object.entries(REST)
    .filter(([key]) => !moved.has(key))
    .map(([key, v]) => {
      const cut = key.lastIndexOf('/');
      return tr(key.slice(0, cut), key.slice(cut + 1) as ClipChannel, k(0, v));
    });
  return events ? { duration, loop, tracks: [...moving, ...held], events } : { duration, loop, tracks: [...moving, ...held] };
}

const idle = heroClip(2.6, 'loop', [
  tr('body/torso', 'scaleY', k(0, 1), k(1.3, 1.035, 'sineInOut'), k(2.6, 1, 'sineInOut')),
  tr('body/torso', 'y', k(0, 0), k(1.3, -2, 'sineInOut'), k(2.6, 0, 'sineInOut')),
  tr('body/torso/head', 'y', k(0, HEAD_Y), k(1.3, HEAD_Y - 3, 'sineInOut'), k(2.6, HEAD_Y, 'sineInOut')),
  tr('body/torso/armFront', 'rotation', k(0, -0.1), k(1.3, -0.02, 'sineInOut'), k(2.6, -0.1, 'sineInOut')),
  tr('body/torso/armBack', 'rotation', k(0, 0.14), k(1.3, 0.06, 'sineInOut'), k(2.6, 0.14, 'sineInOut')),
]);

const run = heroClip(0.52, 'loop', [
  tr('body/torso', 'rotation', k(0, 0.17), k(0.26, 0.2, 'sineInOut'), k(0.52, 0.17, 'sineInOut')),
  tr('body', 'y', k(0, 0), k(0.13, -4, 'sineInOut'), k(0.26, 0, 'sineInOut'), k(0.39, -4, 'sineInOut'), k(0.52, 0, 'sineInOut')),
  tr('body/legFront', 'rotation', k(0, -0.72), k(0.26, 0.72, 'sineInOut'), k(0.52, -0.72, 'sineInOut')),
  tr('body/legBack', 'rotation', k(0, 0.72), k(0.26, -0.72, 'sineInOut'), k(0.52, 0.72, 'sineInOut')),
  tr('body/torso/armFront', 'rotation', k(0, 0.55), k(0.26, -0.55, 'sineInOut'), k(0.52, 0.55, 'sineInOut')),
  tr('body/torso/armBack', 'rotation', k(0, -0.55), k(0.26, 0.55, 'sineInOut'), k(0.52, -0.55, 'sineInOut')),
  tr('body/torso/head', 'rotation', k(0, 0.05), k(0.26, 0.0, 'sineInOut'), k(0.52, 0.05, 'sineInOut')),
]);

// Jump: a compact, rising launch — body stretched tall, both arms thrown UP and
// slightly back, legs tucked. (Limbs hang at rotation 0; up-and-back ≈ ∓2.6 rad.)
const jump = heroClip(0.42, 'once', [
  tr('body', 'scaleY', k(0, 1), k(0.18, 1.14, 'backOut'), k(0.42, 1.1)),
  tr('body', 'scaleX', k(0, 1), k(0.18, 0.9, 'sineOut'), k(0.42, 0.92)),
  tr('body', 'y', k(0, 0), k(0.2, -6, 'sineOut'), k(0.42, -4)),
  tr('body/torso', 'rotation', k(0, 0.05), k(0.42, 0.07, 'sineOut')),
  tr('body/torso/armFront', 'rotation', k(0, -0.1), k(0.2, -2.6, 'sineOut'), k(0.42, -2.55)),
  tr('body/torso/armBack', 'rotation', k(0, 0.14), k(0.2, 2.55, 'sineOut'), k(0.42, 2.5)),
  tr('body/legFront', 'rotation', k(0, 0), k(0.22, -0.5, 'sineOut'), k(0.42, -0.42)),
  tr('body/legBack', 'rotation', k(0, 0), k(0.22, -0.72, 'sineOut'), k(0.42, -0.66)),
]);

// Fall: a spread, skydiver flail — arms up-and-OUT (opposite sides), legs spread,
// a gentle wobble so it reads as descending, not posed.
const fall = heroClip(0.7, 'loop', [
  tr('body', 'scaleY', k(0, 1.06), k(0.35, 1.0, 'sineInOut'), k(0.7, 1.06, 'sineInOut')),
  tr('body', 'scaleX', k(0, 0.96), k(0.35, 1.0, 'sineInOut'), k(0.7, 0.96, 'sineInOut')),
  tr('body/torso/armFront', 'rotation', k(0, -2.3), k(0.35, -2.5, 'sineInOut'), k(0.7, -2.3, 'sineInOut')),
  tr('body/torso/armBack', 'rotation', k(0, 2.35), k(0.35, 2.15, 'sineInOut'), k(0.7, 2.35, 'sineInOut')),
  tr('body/legFront', 'rotation', k(0, 0.5), k(0.35, 0.62, 'sineInOut'), k(0.7, 0.5, 'sineInOut')),
  tr('body/legBack', 'rotation', k(0, -0.4), k(0.35, -0.52, 'sineInOut'), k(0.7, -0.4, 'sineInOut')),
  tr('body/torso/head', 'y', k(0, HEAD_Y - 2), k(0.35, HEAD_Y - 4, 'sineInOut'), k(0.7, HEAD_Y - 2, 'sineInOut')),
]);

// Wall-slide leans INTO the facing side (the wall the flip faces); a small
// downward shudder reads as friction.
const wallSlide = heroClip(0.6, 'loop', [
  tr('body', 'rotation', k(0, 0.08), k(0.3, 0.1, 'sineInOut'), k(0.6, 0.08, 'sineInOut')),
  tr('body', 'y', k(0, 0), k(0.3, 2, 'sineInOut'), k(0.6, 0, 'sineInOut')),
  tr('body/torso', 'rotation', k(0, 0.04), k(0.6, 0.04)),
  tr('body/torso/armFront', 'rotation', k(0, -1.55), k(0.3, -1.62, 'sineInOut'), k(0.6, -1.55, 'sineInOut')),
  tr('body/torso/armBack', 'rotation', k(0, 0.5), k(0.6, 0.5)),
  tr('body/legFront', 'rotation', k(0, 0.4), k(0.3, 0.46, 'sineInOut'), k(0.6, 0.4, 'sineInOut')),
  tr('body/legBack', 'rotation', k(0, 0.16), k(0.3, 0.22, 'sineInOut'), k(0.6, 0.16, 'sineInOut')),
]);

const death = heroClip(
  1.0,
  'once',
  [
    tr('body', 'rotation', k(0, 0), k(0.7, -1.45, 'backOut'), k(1.0, -1.4)),
    tr('body', 'y', k(0, 0), k(0.7, 16, 'sineOut'), k(1.0, 18)),
    tr('body', 'scaleY', k(0, 1), k(0.7, 0.9, 'sineOut'), k(1.0, 0.88)),
    tr('body/torso', 'rotation', k(0, 0), k(1.0, -0.28, 'sineOut')),
    tr('body/torso', 'scaleY', k(0, 1), k(1.0, 0.82, 'sineOut')),
    tr('body/torso/head', 'rotation', k(0, 0), k(1.0, 0.5, 'sineOut')),
    tr('body/torso/armFront', 'rotation', k(0, -0.1), k(1.0, 0.9, 'sineOut')),
    tr('body/torso/armBack', 'rotation', k(0, 0.14), k(1.0, 1.15, 'sineOut')),
    tr('body/legFront', 'rotation', k(0, 0), k(1.0, -0.6, 'sineOut')),
    tr('body/legBack', 'rotation', k(0, 0), k(1.0, 0.55, 'sineOut')),
  ],
  [{ t: 0.5, name: 'dead' }],
);

const spawn = heroClip(
  0.72,
  'once',
  [
    tr('body', 'scaleX', k(0, 0), k(0.4, 1.12, 'backOut'), k(0.72, 1)),
    tr('body', 'scaleY', k(0, 0), k(0.4, 1.16, 'backOut'), k(0.56, 0.94, 'sineInOut'), k(0.72, 1)),
    tr('body', 'y', k(0, -18), k(0.4, 2, 'sineOut'), k(0.56, -2, 'sineInOut'), k(0.72, 0)),
    tr('body/torso', 'scaleY', k(0, 1), k(0.46, 0.86, 'sineOut'), k(0.72, 1, 'sineInOut')),
    tr('body/torso/armFront', 'rotation', k(0, 0.4), k(0.72, -0.1, 'sineOut')),
    tr('body/torso/armBack', 'rotation', k(0, -0.4), k(0.72, 0.14, 'sineOut')),
    tr('body/legFront', 'rotation', k(0, -0.3), k(0.72, 0, 'sineOut')),
    tr('body/legBack', 'rotation', k(0, 0.3), k(0.72, 0, 'sineOut')),
  ],
  [{ t: 0.62, name: 'spawned' }],
);

/** The seven authored hero animations, keyed by state name. Plain data — import
 *  these to wire your own ClipPlayer, or use `DuotoneHero` which loads them all. */
export const HERO_CLIPS = { idle, run, jump, fall, wallSlide, death, spawn } as const;

/** The hero's animation states, in catalog order. */
export type HeroState = keyof typeof HERO_CLIPS;
export const HERO_STATES = Object.keys(HERO_CLIPS) as HeroState[];

/** States that play once and hold their final pose (vs. looping). */
const ONE_SHOT: ReadonlySet<HeroState> = new Set<HeroState>(['jump', 'spawn', 'death']);

// ── Motion → state mapping (a convenience for platformers) ─────────────────

export interface HeroMotion {
  onGround: boolean;
  /** Horizontal velocity (px/s). Sign is world-space, not facing-relative. */
  vx: number;
  /** Vertical velocity (px/s), y-down: negative = rising, positive = falling. */
  vy: number;
  /** Pressed against a wall while airborne. */
  onWall?: boolean;
  dead?: boolean;
}

/** Classify a platformer motion sample into a HeroState. Death > wall-slide >
 *  air (jump rising / fall descending) > run/idle on the ground. */
export function heroStateFromMotion(m: HeroMotion, opts: { runThreshold?: number } = {}): HeroState {
  if (m.dead) return 'death';
  if (!m.onGround) {
    if (m.onWall && m.vy > 0) return 'wallSlide';
    return m.vy < 0 ? 'jump' : 'fall';
  }
  return Math.abs(m.vx) > (opts.runThreshold ?? 6) ? 'run' : 'idle';
}

// ── DuotoneHero: batteries-included node ───────────────────────────────────

export interface HeroConfig extends NodeConfig {
  /** Duotone dressing. Default: teal (KENTO.asagiDeep). */
  scheme?: DuotoneScheme;
  /** State to start in. Default 'idle'. Pass 'spawn' to materialize on entry. */
  state?: HeroState;
  /** Initial facing: 1 = right, -1 = left. Default 1. */
  facing?: 1 | -1;
}

/**
 * A drop-in animated platformer hero. Add it to your scene, position it each
 * frame at the character's foot/hip, and drive it with `setState(...)` /
 * `setFacing(...)` from your logical state. Cosmetic — it never enters the hash.
 *
 *   const hero = new DuotoneHero({ scheme: DUOTONE_SCHEMES.vermilion, state: 'spawn' });
 *   this.addChild(hero);
 *   // per frame:
 *   hero.pos = { x: pc.x, y: pc.y };
 *   hero.setFacing(pc.facing);
 *   hero.setState(heroStateFromMotion(pc));
 */
export class DuotoneHero extends Node {
  override readonly type = 'DuotoneHero';
  readonly scheme: DuotoneScheme;

  private flip: Node;
  private player: ClipPlayer;
  private facing: 1 | -1;
  private state: HeroState;

  constructor(config: HeroConfig = {}) {
    super(config);
    this.cosmetic = true;
    this.scheme = config.scheme ?? DEFAULT_SCHEME;
    this.facing = config.facing ?? 1;
    this.state = config.state ?? 'idle';

    // Facing lives on `flip` (above the rig) so it never fights the body's
    // clip-driven scaleX. The rig root is `flip` — clip target paths start at 'body'.
    this.flip = buildHeroRig(this.scheme, 'flip');
    this.flip.scale = { x: this.facing, y: 1 };
    this.addChild(this.flip);

    this.player = new ClipPlayer({ name: 'player', rig: this.flip });
    for (const name of HERO_STATES) this.player.add(name, HERO_CLIPS[name]);
    this.flip.addChild(this.player);
  }

  protected override onReady(): void {
    this.player.rebind(this.flip);
    this.player.play(this.state);
  }

  /** Fired with the event name as a clip crosses an event (e.g. 'dead', 'spawned'). */
  get event() {
    return this.player.event;
  }
  /** Fired when a one-shot clip (jump/spawn/death) reaches its end. */
  get finished() {
    return this.player.finished;
  }

  get currentState(): HeroState {
    return this.state;
  }
  /** The current clip's raw playhead in seconds (for replaying one-shots in demos). */
  get animTime(): number {
    return this.player.time;
  }
  get facingDir(): 1 | -1 {
    return this.facing;
  }

  /** Point the hero left (-1) or right (1). No-op if unchanged. */
  setFacing(dir: 1 | -1): void {
    if (dir === this.facing) return;
    this.facing = dir;
    this.flip.scale = { x: dir, y: 1 };
  }

  /**
   * Switch animation state, crossfading from the current one. A no-op if already
   * in `state` unless `force` (use it to re-trigger jump on a double-jump, or to
   * replay a one-shot). Looping states blend over 0.12s; one-shots snap in faster.
   */
  setState(state: HeroState, force = false): void {
    if (state === this.state && !force) return;
    this.state = state;
    const fade = state === 'spawn' ? 0 : ONE_SHOT.has(state) ? 0.06 : 0.12;
    this.player.play(state, { fade });
  }
}

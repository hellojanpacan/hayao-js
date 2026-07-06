// Lanternway — an engine-capability example: the camera decoupled from the
// screen. The playfield (3200×1800) dwarfs the viewport (1280×720); a Camera2D
// driven by a CameraController follows the bearer with a deadzone and clamps to
// the world edges, so the level SCROLLS. The HUD (coach line + compass) is
// parented to the camera, which pins it to the screen for free — children of the
// camera render at `centered ∘ local`, cancelling the scroll.
//
// Canonical state is only the bearer's position + the reached flag (held on this
// view, serialized). The field, camera, controller, and HUD are all cosmetic, so
// the smooth follow never enters world.hash() — determinism stays intact.
//
// ART: this is also the toolkit reference. The scenery is code-as-art — organic
// `blobPath` foliage, a `smoothOpenPath` trodden way, tonal woodblock grain, and
// a layered paper-lantern bearer — all built ONCE, statically, from STANDALONE
// rng streams. Nothing here is animated (the looks judge only sees a static SVG
// filmstrip) and nothing draws from world.rng (that would fold layout into the
// hash). The whole `field` subtree is cosmetic, so none of it is hashed.

import {
  Node,
  Sprite,
  Text,
  Camera2D,
  CameraController,
  Bone2D,
  ClipPlayer,
  IkTarget,
  Blend1D,
  applyChannel,
  Rng,
  KENTO,
  audio,
  datan2,
  dhypot,
  dcos,
  dsin,
  defineGame,
  showScreen,
  hideScreen,
  registerNode,
  blobPath,
  smoothOpenPath,
  mutateColor,
  withAlpha,
  mix,
  type ClipDef,
  type World,
  type InputMap,
} from '@hayao';
import { WORLD, START, GOAL, GOAL_R, BEARER_R, dist, reached, stepBearer } from './logic';

export const LW_INPUT_MAP: InputMap = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  restart: ['KeyR'],
};

// Every decorative layer is laid out from its OWN standalone rng so none of them
// touch world.rng — advancing world.rng would fold their layout into world.hash().
const GRAIN_SEED = 20260704;
const PATH_SEED = 517;
const FLORA_SEED = 8821;

// ── Cosmetic animation rig (v0.4.1) ─────────────────────────────────────────
// The lantern hangs from its handle and SWAYS as the bearer moves — a purely
// cosmetic ClipPlayer rig driven by the bearer's derived motion (never the
// reverse). The whole rig lives under the cosmetic `bearer`, and ClipPlayer /
// IkTarget are hard-cosmetic, so none of it enters world.hash(): the crossing
// golden is unchanged. Two authored clips, blended by speed:
//   • rest — a slow breathing sway while standing still.
//   • carry — a wider, quicker swing while walking.
// Bone rotations are LOCAL radians; the swing bone hangs DOWN from the handle
// (rotation 0 = straight down), so a small ± angle rocks the lantern like a
// pendulum. A single IkTarget keeps the flame buoyantly upright as it rocks.
const SWING_LEN = 30; // handle loop → lantern body centre
const FLAME_UPPER = 8; // body → flame stalk
const FLAME_LOWER = 7; // flame stalk → tip

const restSway: ClipDef = {
  duration: 2.6,
  loop: 'loop',
  tracks: [
    {
      target: 'swing',
      channel: 'rotation',
      keys: [
        { t: 0, v: -0.06 },
        { t: 1.3, v: 0.06, ease: 'sineInOut' },
        { t: 2.6, v: -0.06, ease: 'sineInOut' },
      ],
    },
  ],
};

const carrySway: ClipDef = {
  duration: 0.9,
  loop: 'loop',
  tracks: [
    {
      target: 'swing',
      channel: 'rotation',
      keys: [
        { t: 0, v: -0.22 },
        { t: 0.45, v: 0.22, ease: 'sineInOut' },
        { t: 0.9, v: -0.22, ease: 'sineInOut' },
      ],
    },
  ],
};

// Decorative shapes all sit at z ≤ 1 (the "background lattice" plane the layout
// lint treats as exempt) so they never collide with the torii glyph text box.
const Z_GROUND = -2;
const Z_GRAIN = -1;
const Z_PATH = 0;
const Z_DECO = 1;

/** Perpendicular distance from (px,py) to the straight START→GOAL corridor. */
function distToWay(px: number, py: number): number {
  const dx = GOAL.x - START.x;
  const dy = GOAL.y - START.y;
  const l2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - START.x) * dx + (py - START.y) * dy) / l2));
  const cx = START.x + t * dx;
  const cy = START.y + t * dy;
  return dhypot(px - cx, py - cy);
}

class LanternwayView extends Node {
  override readonly type = 'LanternwayView';
  px = START.x;
  py = START.y;
  won = false;

  private field = new Node({ name: 'field' });
  private bearer!: Node;
  private camera!: Camera2D;
  private compass!: Node;

  // Cosmetic rig state (derived from px/py; never serialized — pure view).
  private swing!: Bone2D;
  private flameUpper!: Bone2D;
  private flameLower!: Bone2D;
  private flameIk!: IkTarget;
  private swayBlend = new Blend1D([
    { clip: restSway, x: 0 },
    { clip: carrySway, x: 1 },
  ]);
  private swayPhase = 0; // shared normalized phase (foot-lock discipline)
  private prevPx = START.x;
  private prevPy = START.y;
  private speed01 = 0; // smoothed 0..1 locomotion parameter

  protected override onReady(): void {
    this.rebuild();
  }

  private rebuild(): void {
    for (const c of this.children.slice()) this.removeChild(c);

    // ── The scrolling world (all cosmetic — pure view over px/py) ──────────
    this.field = new Node({ name: 'field' });
    this.field.cosmetic = true;
    this.addChild(this.field);

    this.buildGround();
    this.buildWay();
    this.buildFlora();
    this.buildShrine();

    // ── The bearer: a layered paper lantern (cosmetic view of px/py) ───────
    this.bearer = new Node({ name: 'bearer', pos: { x: this.px, y: this.py }, z: 10 });
    this.bearer.cosmetic = true;
    this.buildLantern(this.bearer);
    this.addChild(this.bearer);
    this.prevPx = this.px;
    this.prevPy = this.py;
    this.speed01 = 0;
    this.swayPhase = 0;

    // ── The camera + its screen-pinned HUD (children ride the camera) ──────
    this.camera = new Camera2D({ name: 'camera', pos: { x: this.px, y: this.py }, current: true });
    this.camera.cosmetic = true;
    this.addChild(this.camera);
    this.buildHud(this.camera);

    // Follow behavior: deadzone slack, smooth trail, clamped to the world edges.
    const controller = new CameraController({ name: 'follow', target: this.bearer, deadzone: { x: 180, y: 120 }, smooth: 0.14, bounds: { minX: 0, minY: 0, maxX: WORLD.w, maxY: WORLD.h } });
    this.addChild(controller);
  }

  /** Paper ground with a warm border and a tonal woodblock grain (not a grid). */
  private buildGround(): void {
    // Ground slab with a visible border so the world's extent reads while scrolling.
    this.field.addChild(new Sprite({ name: 'ground', pos: { x: WORLD.w / 2, y: WORLD.h / 2 }, z: Z_GROUND, shape: { kind: 'rect', w: WORLD.w, h: WORLD.h }, fill: KENTO.washi, stroke: KENTO.kinako, strokeWidth: 6 }));

    // Printed grain: a scatter of faint tonal specks in drifted paper tones —
    // reads as inked washi rather than a mechanical dot lattice. Deterministic.
    const grng = new Rng(GRAIN_SEED);
    for (let y = 150; y < WORLD.h; y += 190) {
      for (let x = 150; x < WORLD.w; x += 190) {
        const tone = grng.pick([KENTO.line, KENTO.kinako, KENTO.kinu]);
        this.field.addChild(new Sprite({
          pos: { x: x + grng.range(-24, 24), y: y + grng.range(-24, 24) },
          z: Z_GRAIN,
          shape: { kind: 'circle', radius: grng.range(1.5, 3.5) },
          fill: mutateColor(grng, tone, { light: 0.04 }),
          opacity: grng.range(0.3, 0.6),
        }));
      }
    }
  }

  /** The lanternway itself: a trodden path meandering from START to the shrine. */
  private buildWay(): void {
    const prng = new Rng(PATH_SEED);
    const N = 9;
    const dx = GOAL.x - START.x;
    const dy = GOAL.y - START.y;
    const L = dhypot(dx, dy);
    const nx = -dy / L;
    const ny = dx / L;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const amp = i === 0 || i === N ? 0 : prng.range(-150, 150);
      pts.push({ x: START.x + dx * t + nx * amp, y: START.y + dy * t + ny * amp });
    }
    const d = smoothOpenPath(pts, 1);
    // Wide soft tread + a lighter worn centre — two strokes read as a real path.
    this.field.addChild(new Sprite({ name: 'wayEdge', z: Z_PATH, shape: { kind: 'path', d }, fill: 'none', stroke: KENTO.kinako, strokeWidth: 58, opacity: 0.55 }));
    this.field.addChild(new Sprite({ name: 'way', z: Z_PATH, shape: { kind: 'path', d }, fill: 'none', stroke: mix(KENTO.washi, KENTO.gofun, 0.5), strokeWidth: 30, opacity: 0.9 }));

    // Wayside stone lanterns marking the route — a shadow, a stone, a lit box.
    for (let i = 2; i < N - 1; i += 3) {
      const p = pts[i];
      const off = 46;
      const sx = p.x + nx * off;
      const sy = p.y + ny * off;
      this.field.addChild(new Sprite({ pos: { x: sx, y: sy + 12 }, z: Z_PATH, shape: { kind: 'circle', radius: 15 }, fill: withAlpha(KENTO.sumi, 0.16) }));
      this.field.addChild(new Sprite({ pos: { x: sx, y: sy }, z: Z_DECO, shape: { kind: 'rect', w: 14, h: 22, r: 3 }, fill: KENTO.stone, stroke: KENTO.sumiSoft, strokeWidth: 2 }));
      this.field.addChild(new Sprite({ pos: { x: sx, y: sy - 5 }, z: Z_DECO, shape: { kind: 'rect', w: 9, h: 9, r: 2 }, fill: KENTO.ko }));
    }
  }

  /** Organic foliage: grass-blade tufts, blob bushes, and a few tree canopies. */
  private buildFlora(): void {
    const frng = new Rng(FLORA_SEED);
    for (let gy = 220; gy < WORLD.h - 120; gy += 250) {
      for (let gx = 220; gx < WORLD.w - 120; gx += 250) {
        const x = gx + frng.range(-80, 80);
        const y = gy + frng.range(-80, 80);
        // Keep the way, the start, and the shrine clear.
        if (dist({ x, y }, START) < 190 || dist({ x, y }, GOAL) < 240 || distToWay(x, y) < 90) continue;
        const roll = frng.float();
        if (roll < 0.16) this.addTree(frng, x, y);
        else if (roll < 0.58) this.addBush(frng, x, y);
        else this.addTuft(frng, x, y);
      }
    }
  }

  private addTuft(rng: Rng, x: number, y: number): void {
    const green = mutateColor(rng, rng.pick([KENTO.matsu, KENTO.matsuDeep]), { hue: 8, light: 0.06 });
    const blades = 3 + Math.floor(rng.float() * 3);
    for (let i = 0; i < blades; i++) {
      const bx = x + rng.range(-10, 10);
      const lean = rng.range(-9, 9);
      const h = rng.range(16, 30);
      const d = smoothOpenPath([{ x: bx, y: y }, { x: bx + lean * 0.5, y: y - h * 0.55 }, { x: bx + lean, y: y - h }], 1);
      this.field.addChild(new Sprite({ z: Z_DECO, shape: { kind: 'path', d }, fill: 'none', stroke: green, strokeWidth: rng.range(2, 3.5), opacity: 0.9 }));
    }
  }

  private addBush(rng: Rng, x: number, y: number): void {
    const base = mutateColor(rng, rng.pick([KENTO.matsu, KENTO.matsuDeep, KENTO.koDeep]), { hue: 6, light: 0.05 });
    const r = rng.range(20, 34);
    // Contact shadow, then the blob body, then a lighter dab for volume.
    this.field.addChild(new Sprite({ pos: { x, y: y + r * 0.5 }, z: Z_PATH, shape: { kind: 'circle', radius: r * 0.85 }, fill: withAlpha(KENTO.sumi, 0.14) }));
    this.field.addChild(new Sprite({ pos: { x, y }, z: Z_DECO, shape: { kind: 'path', d: blobPath(rng, r, 0.28, 8) }, fill: base, stroke: KENTO.sumiSoft, strokeWidth: 1.5 }));
    this.field.addChild(new Sprite({ pos: { x: x - r * 0.28, y: y - r * 0.28 }, z: Z_DECO, shape: { kind: 'path', d: blobPath(rng, r * 0.5, 0.35, 6) }, fill: mix(base, KENTO.gofun, 0.28), opacity: 0.75 }));
  }

  private addTree(rng: Rng, x: number, y: number): void {
    const r = rng.range(40, 60);
    const canopy = mutateColor(rng, KENTO.matsuDeep, { hue: 6, light: 0.05 });
    // Ground shadow → trunk → canopy blob → highlight, painted back-to-front.
    this.field.addChild(new Sprite({ pos: { x: x + 6, y: y + r * 0.75 }, z: Z_PATH, shape: { kind: 'circle', radius: r * 0.8 }, fill: withAlpha(KENTO.sumi, 0.16) }));
    this.field.addChild(new Sprite({ pos: { x, y: y + r * 0.55 }, z: Z_DECO, shape: { kind: 'rect', w: 12, h: r * 0.7, r: 3 }, fill: mutateColor(rng, KENTO.stone, { light: 0.04 }), stroke: KENTO.sumiSoft, strokeWidth: 1.5 }));
    this.field.addChild(new Sprite({ pos: { x, y }, z: Z_DECO, shape: { kind: 'path', d: blobPath(rng, r, 0.22, 9) }, fill: canopy, stroke: KENTO.sumi, strokeWidth: 2 }));
    this.field.addChild(new Sprite({ pos: { x: x - r * 0.3, y: y - r * 0.32 }, z: Z_DECO, shape: { kind: 'path', d: blobPath(rng, r * 0.55, 0.3, 7) }, fill: mix(canopy, KENTO.matsu, 0.6), opacity: 0.7 }));
  }

  /** Goal shrine — a torii glyph over a stone base, halo, and flanking lanterns. */
  private buildShrine(): void {
    // Soft halo rings behind the shrine (all z ≤ 1: lint-exempt background plane).
    for (let i = 3; i >= 1; i--) {
      this.field.addChild(new Sprite({ pos: { ...GOAL }, z: Z_PATH, shape: { kind: 'circle', radius: GOAL_R * (0.7 + i * 0.34) }, fill: withAlpha(KENTO.ko, 0.05 * i) }));
    }
    // Stone base: two stacked slabs the torii stands on.
    this.field.addChild(new Sprite({ pos: { x: GOAL.x, y: GOAL.y + 60 }, z: Z_DECO, shape: { kind: 'rect', w: 190, h: 34, r: 8 }, fill: KENTO.kinako, stroke: KENTO.sumiSoft, strokeWidth: 2 }));
    this.field.addChild(new Sprite({ pos: { x: GOAL.x, y: GOAL.y + 40 }, z: Z_DECO, shape: { kind: 'rect', w: 150, h: 20, r: 6 }, fill: mix(KENTO.kinako, KENTO.gofun, 0.35), stroke: KENTO.sumiSoft, strokeWidth: 1.5 }));
    // Flanking stone lanterns.
    for (const sgn of [-1, 1]) {
      const lx = GOAL.x + sgn * 120;
      const ly = GOAL.y + 30;
      this.field.addChild(new Sprite({ pos: { x: lx, y: ly }, z: Z_DECO, shape: { kind: 'rect', w: 20, h: 42, r: 4 }, fill: KENTO.stone, stroke: KENTO.sumiSoft, strokeWidth: 2 }));
      this.field.addChild(new Sprite({ pos: { x: lx, y: ly - 8 }, z: Z_DECO, shape: { kind: 'rect', w: 13, h: 13, r: 2 }, fill: KENTO.ko }));
    }
    // The reach ring + the torii glyph itself (unchanged: a sacred text command).
    this.field.addChild(new Sprite({ name: 'goalRing', pos: { ...GOAL }, z: Z_DECO, shape: { kind: 'circle', radius: GOAL_R }, fill: 'none', stroke: KENTO.shu, strokeWidth: 4, opacity: 0.7 }));
    this.field.addChild(new Sprite({ name: 'goal', pos: { x: GOAL.x, y: GOAL.y + 6 }, z: 6, shape: { kind: 'glyph', char: '⛩', size: 96 }, fill: KENTO.shuDeep }));
  }

  /**
   * A layered paper lantern, built in the bearer's local space (footprint ≈ old).
   * v0.4.1: the body now HANGS from a cosmetic `swing` Bone2D pivoted at the
   * handle loop, so it rocks like a pendulum; a two-bone flame stalk is held
   * upright by an IkTarget. A ClipPlayer poses the swing (rest/carry), the
   * IkTarget overrides the flame — all cosmetic, none of it hashed.
   */
  private buildLantern(host: Node): void {
    // Warm halo + ground shadow — these DON'T sway (they track the bearer), so
    // they stay direct children of the host, exactly as before.
    host.addChild(new Sprite({ z: 9, shape: { kind: 'circle', radius: BEARER_R + 22 }, fill: withAlpha(KENTO.ko, 0.1) }));
    host.addChild(new Sprite({ z: 9, shape: { kind: 'circle', radius: BEARER_R + 12 }, fill: withAlpha(KENTO.ko, 0.16) }));
    host.addChild(new Sprite({ pos: { x: 0, y: BEARER_R + 6 }, z: 9, shape: { kind: 'circle', radius: BEARER_R * 0.7 }, fill: withAlpha(KENTO.sumi, 0.18) }));

    // The rig root: a Bone2D pivoted at the handle loop (y = -28). Its rotation
    // is the pendulum angle the clip drives; body parts sit BELOW its origin so a
    // small ± rotation rocks the whole lantern about the handle. Length points to
    // the body centre (for the debug overlay); the visual offset is +28 in y so
    // everything lands where it did before at rotation 0.
    const HANDLE_Y = -28;
    this.swing = new Bone2D({ name: 'swing', length: SWING_LEN, pos: { x: 0, y: HANDLE_Y }, z: 10 });
    host.addChild(this.swing);
    const dy = -HANDLE_Y; // shift body parts down into the bone's local frame

    // Handle loop sits at the bone origin (the pivot).
    this.swing.addChild(new Sprite({ z: 12, shape: { kind: 'circle', radius: 4 }, fill: 'none', stroke: KENTO.sumi, strokeWidth: 2 }));
    // Lantern body: warm paper cylinder with a lighter core.
    this.swing.addChild(new Sprite({ pos: { x: 0, y: dy }, z: 10, shape: { kind: 'rect', w: 30, h: 38, r: 12 }, fill: KENTO.ko, stroke: KENTO.sumi, strokeWidth: 3 }));
    this.swing.addChild(new Sprite({ pos: { x: 0, y: dy }, z: 11, shape: { kind: 'rect', w: 20, h: 30, r: 8 }, fill: mix(KENTO.ko, KENTO.gofun, 0.55), opacity: 0.85 }));
    // Ribs — thin horizontal bands.
    for (const yy of [-8, 0, 8]) this.swing.addChild(new Sprite({ pos: { x: 0, y: yy + dy }, z: 12, shape: { kind: 'rect', w: 26, h: 2 }, fill: withAlpha(KENTO.sumiSoft, 0.5) }));
    // Top & bottom caps.
    this.swing.addChild(new Sprite({ pos: { x: 0, y: -22 + dy }, z: 12, shape: { kind: 'rect', w: 22, h: 6, r: 2 }, fill: KENTO.sumi }));
    this.swing.addChild(new Sprite({ pos: { x: 0, y: 21 + dy }, z: 12, shape: { kind: 'rect', w: 16, h: 5, r: 2 }, fill: KENTO.sumi }));

    // The flame: a two-bone stalk rising from the body top, kept upright by IK so
    // it stays buoyant while the body rocks. Bones point along +x at rotation 0;
    // the IkTarget solves them toward a goal held ABOVE the lantern.
    this.flameUpper = new Bone2D({ name: 'flameUpper', length: FLAME_UPPER, pos: { x: 0, y: -18 + dy }, z: 13 });
    this.flameLower = new Bone2D({ name: 'flameLower', length: FLAME_LOWER, pos: { x: FLAME_UPPER, y: 0 }, z: 13 });
    this.flameLower.addChild(new Sprite({ pos: { x: FLAME_LOWER, y: 0 }, z: 13, shape: { kind: 'circle', radius: 5 }, fill: KENTO.gofun }));
    this.flameUpper.addChild(this.flameLower);
    this.swing.addChild(this.flameUpper);

    // ── The writers (cosmetic; DFS order = clip → IK) ────────────────────
    // The rig root the clips address is the BEARER: a clip track targets 'swing'
    // (and could target 'swing/flameUpper'…). Parenting the player under `swing`
    // keeps it a later DFS sibling of the swing's own sprites, and BEFORE the
    // IkTarget, so the clip poses the swing and IK then overrides the flame.
    const player = new ClipPlayer({ name: 'player', rig: host });
    player.add('rest', restSway).add('carry', carrySway);
    this.swing.addChild(player);
    player.play('rest');
    // IkTarget a LATER sibling → overrides the flame stalk after the clip. Its
    // goal is its own world position; we place it above the lantern each step.
    this.flameIk = new IkTarget({ name: 'flameIk', bones: [this.flameUpper, this.flameLower], bendDir: 1 });
    this.swing.addChild(this.flameIk);
  }

  /** HUD parented to the camera → fixed on screen. Local (0,0) is screen center. */
  private buildHud(cam: Camera2D): void {
    // Coach panel + line (names the controls → passes missingControlHints).
    cam.addChild(new Sprite({ name: 'coachPanel', pos: { x: 0, y: -300 }, z: 20, shape: { kind: 'rect', w: 900, h: 60, r: 12 }, fill: KENTO.sumi, stroke: KENTO.kinako, strokeWidth: 2, opacity: 0.88 }));
    cam.addChild(new Text({ name: 'coach', text: 'Arrow keys — cross the field to the ⛩ shrine   ·   R restart', pos: { x: 0, y: -292 }, z: 21, size: 24, align: 'center', fill: KENTO.gofun }));

    // Compass: a screen-pinned arrow at the bottom that points to the offscreen goal.
    this.compass = new Node({ name: 'compass', pos: { x: 0, y: 296 } });
    cam.addChild(this.compass);
    this.compass.addChild(new Sprite({ z: 30, shape: { kind: 'circle', radius: 26 }, fill: KENTO.sumi, stroke: KENTO.kinako, strokeWidth: 2, opacity: 0.85 }));
    this.compass.addChild(new Sprite({ name: 'needle', z: 31, shape: { kind: 'poly', points: [20, 0, -10, -11, -10, 11] }, fill: KENTO.shu, stroke: KENTO.gofun, strokeWidth: 1.5 }));
  }

  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const input = (this.world as World).input;
    if (input.justPressed('restart')) return this.restart();
    if (this.won) return;

    const ax = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const ay = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
    const next = stepBearer({ x: this.px, y: this.py }, ax, ay, dt);
    this.px = next.x;
    this.py = next.y;
    this.bearer.pos.x = this.px;
    this.bearer.pos.y = this.py;

    // ── Drive the cosmetic rig from DERIVED motion (reads px/py, writes view) ──
    // Speed is the frame-to-frame displacement; smoothed into a 0..1 locomotion
    // parameter so the sway eases in/out instead of snapping. This never writes
    // logical state — it's pure presentation over the already-committed position.
    const vx = this.px - this.prevPx;
    const vy = this.py - this.prevPy;
    this.prevPx = this.px;
    this.prevPy = this.py;
    const spd = dhypot(vx, vy) / Math.max(dt, 1e-6); // px/s
    const target = Math.min(1, spd / 300);
    this.speed01 += (target - this.speed01) * Math.min(1, 8 * dt); // exponential ease
    // Shared normalized phase for the blend (foot-lock): faster stride when moving.
    this.swayPhase = (this.swayPhase + dt * (0.9 + this.speed01 * 1.1)) % 1;
    if (this.swayPhase < 0) this.swayPhase += 1;
    // Blend rest↔carry by speed and write the pendulum angle onto the swing bone.
    const pose = this.swayBlend.sample(this.speed01, this.swayPhase);
    // A gentle lean into the travel direction adds intent to the sway.
    const lean = Math.max(-0.18, Math.min(0.18, vx * 0.01));
    applyChannel(this.swing, 'rotation', (pose['swing/rotation'] ?? 0) + lean);
    // Keep the flame buoyantly upright: hold the IK goal straight above the flame
    // root in WORLD space by counter-rotating the swing's tilt into its local frame.
    const rot = this.swing.rotation;
    const up = 24; // how far above the root the flame reaches
    this.flameIk.pos = {
      x: this.flameUpper.pos.x + dsin(rot) * up,
      y: this.flameUpper.pos.y - dcos(rot) * up,
    };

    // Compass needle tracks the goal from wherever the bearer stands.
    const needle = this.compass.find('needle');
    if (needle) needle.rotation = datan2(GOAL.y - this.py, GOAL.x - this.px);

    if (reached({ x: this.px, y: this.py })) this.win();
  }

  private win(): void {
    this.won = true;
    audio.success();
    showScreen({
      title: 'The lantern arrives.',
      body: `Crossed the field to the shrine — ${Math.round(dist(START, GOAL))} units, all of it beyond the opening screen.`,
      actions: [{ label: 'Cross again', primary: true, onSelect: () => this.restart() }],
    });
    this.emit('arrived', true);
  }

  restart(): void {
    this.won = false;
    this.px = START.x;
    this.py = START.y;
    hideScreen();
    this.rebuild();
  }

  protected override serializeProps(): Record<string, unknown> {
    return { px: this.px, py: this.py, won: this.won };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.px === 'number') this.px = props.px;
    if (typeof props.py === 'number') this.py = props.py;
    this.won = !!props.won;
    this.rebuild();
  }
}

registerNode('LanternwayView', () => new LanternwayView());

export function makeLanternwayRoot(): LanternwayView {
  return new LanternwayView({ name: 'lanternway' });
}

export const lanternwayGame = defineGame({
  title: 'Lanternway',
  width: 1280,
  height: 720,
  background: KENTO.kinu,
  inputMap: LW_INPUT_MAP,
  build: () => makeLanternwayRoot(),
  probe: (world) => {
    const view = world.root.find('lanternway') as LanternwayView | null;
    const px = view?.px ?? START.x;
    const py = view?.py ?? START.y;
    const s = world.worldToScreen({ x: px, y: py }); // bearer's on-screen position
    const cam = world.activeCamera;
    return {
      frame: world.frame,
      hash: world.hash(),
      px,
      py,
      camX: cam?.pos.x ?? 0,
      camY: cam?.pos.y ?? 0,
      sx: s.x,
      sy: s.y,
      remaining: Math.round(dist({ x: px, y: py }, GOAL)),
      won: view?.won ?? false,
    };
  },
});

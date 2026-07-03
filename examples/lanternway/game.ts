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

import {
  Node,
  Sprite,
  Text,
  Camera2D,
  CameraController,
  Rng,
  KENTO,
  audio,
  datan2,
  defineGame,
  showScreen,
  hideScreen,
  registerNode,
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

// Cosmetic decorations are laid out from a STANDALONE rng so they never touch
// world.rng — advancing world.rng would fold their layout into world.hash().
const DECO_SEED = 20260704;

class LanternwayView extends Node {
  override readonly type = 'LanternwayView';
  px = START.x;
  py = START.y;
  won = false;

  private field = new Node({ name: 'field' });
  private bearer!: Sprite;
  private camera!: Camera2D;
  private compass!: Node;

  protected override onReady(): void {
    this.rebuild();
  }

  private rebuild(): void {
    for (const c of this.children.slice()) this.removeChild(c);

    // ── The scrolling world (all cosmetic — pure view over px/py) ──────────
    this.field = new Node({ name: 'field' });
    this.field.cosmetic = true;
    this.addChild(this.field);

    // Ground slab with a visible border so the world's extent reads while scrolling.
    this.field.addChild(new Sprite({ name: 'ground', pos: { x: WORLD.w / 2, y: WORLD.h / 2 }, z: -1, shape: { kind: 'rect', w: WORLD.w, h: WORLD.h }, fill: KENTO.washi, stroke: KENTO.kinako, strokeWidth: 6 }));
    // A faint dot lattice (z0 = background, exempt from the layout lint).
    for (let y = 160; y < WORLD.h; y += 200) {
      for (let x = 160; x < WORLD.w; x += 200) {
        this.field.addChild(new Sprite({ pos: { x, y }, z: 0, shape: { kind: 'circle', radius: 3 }, fill: KENTO.line }));
      }
    }
    // Scattered tufts (z1 = background lattice), deterministic from DECO_SEED.
    const drng = new Rng(DECO_SEED);
    const tint = [KENTO.matsuDeep, KENTO.matsu, KENTO.koDeep, KENTO.kinako];
    for (let gy = 240; gy < WORLD.h - 120; gy += 240) {
      for (let gx = 240; gx < WORLD.w - 120; gx += 240) {
        const x = gx + drng.range(-70, 70);
        const y = gy + drng.range(-70, 70);
        if (dist({ x, y }, START) < 200 || dist({ x, y }, GOAL) < 220) continue;
        this.field.addChild(new Sprite({ pos: { x, y }, z: 1, rotation: drng.range(-0.4, 0.4), shape: { kind: 'poly', points: [0, -14, 11, 8, -11, 8] }, fill: drng.pick(tint), stroke: KENTO.sumiSoft, strokeWidth: 1.5, opacity: 0.85 }));
      }
    }

    // Goal shrine — a torii glyph over a ground ring. The ring sits at z1
    // (background lattice) so it never trips the layout lint against the glyph,
    // which is a sacred text command.
    this.field.addChild(new Sprite({ name: 'goalRing', pos: { ...GOAL }, z: 1, shape: { kind: 'circle', radius: GOAL_R }, fill: 'none', stroke: KENTO.shu, strokeWidth: 4, opacity: 0.7 }));
    this.field.addChild(new Sprite({ name: 'goal', pos: { x: GOAL.x, y: GOAL.y + 6 }, z: 6, shape: { kind: 'glyph', char: '⛩', size: 96 }, fill: KENTO.shuDeep }));

    // ── The bearer (cosmetic view of px/py) ────────────────────────────────
    this.bearer = new Sprite({ name: 'bearer', pos: { x: this.px, y: this.py }, z: 10, shape: { kind: 'circle', radius: BEARER_R }, fill: KENTO.ko, stroke: KENTO.sumi, strokeWidth: 3 });
    this.bearer.cosmetic = true;
    this.bearer.addChild(new Sprite({ name: 'glow', z: 9, shape: { kind: 'circle', radius: BEARER_R + 14 }, fill: 'none', stroke: KENTO.ko, strokeWidth: 3, opacity: 0.4 }));
    this.addChild(this.bearer);

    // ── The camera + its screen-pinned HUD (children ride the camera) ──────
    this.camera = new Camera2D({ name: 'camera', pos: { x: this.px, y: this.py }, current: true });
    this.camera.cosmetic = true;
    this.addChild(this.camera);
    this.buildHud(this.camera);

    // Follow behavior: deadzone slack, smooth trail, clamped to the world edges.
    const controller = new CameraController({ name: 'follow', target: this.bearer, deadzone: { x: 180, y: 120 }, smooth: 0.14, bounds: { minX: 0, minY: 0, maxX: WORLD.w, maxY: WORLD.h } });
    this.addChild(controller);
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

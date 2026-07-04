// Driftlight — an ART-SHOWCASE example for the renderer leap: gradient fills,
// soft glow/shadow, and parallax depth. A paper lantern drifts down a night
// river to the dawn sea; the player steers across-stream (↑/↓) to thread rock
// gates and gather firefly-light that feeds the flame. The sky cycles
// evening→night→dawn with progress; water reflects it; the lantern and fireflies
// glow; far mountains and mist parallax past.
//
// Canonical state (serialized, hashed): lantern px/py, flame, which fireflies are
// gathered, won/lost. EVERYTHING visual is cosmetic — sky, water, parallax,
// glow, reflections — so the lush view never enters world.hash(). Decorative
// layout draws from a STANDALONE rng, never world.rng.

import {
  Node,
  Sprite,
  Text,
  Camera2D,
  CameraController,
  ParallaxLayer,
  Rng,
  KENTO,
  linearGradient,
  radialGradient,
  glow,
  dropShadow,
  blobPath,
  mix,
  withAlpha,
  sampleGradient,
  audio,
  defineGame,
  showScreen,
  hideScreen,
  registerNode,
  type World,
  type InputMap,
} from '@hayao';
import {
  RIVER,
  START,
  SEA_X,
  DRIFT,
  STEER,
  FLAME_MAX,
  FLAME_START,
  DRAIN,
  HIT_COST,
  LIGHT_GAIN,
  COURSE_SEED,
  buildCourse,
  rockHit,
  lightHit,
  clampAcross,
  progress,
  type Course,
} from './logic';

export const DL_INPUT_MAP: InputMap = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  restart: ['KeyR'],
};

const VIEW_W = 1280;
const VIEW_H = 720;
const CAM_Y = 250; // fixed camera height → river sits low, sky fills the top
const DECO_SEED = 990201;

// Sky keyframes across progress 0 (evening) → 0.5 (night) → 1 (dawn).
const SKY_TOP = [KENTO.aiDeep, KENTO.yohaku, KENTO.fujiDeep];
const SKY_HORIZON = [KENTO.kaki, KENTO.aiDeep, KENTO.saku];

function skyColors(t: number): { top: string; horizon: string } {
  return { top: sampleGradient(SKY_TOP, t), horizon: sampleGradient(SKY_HORIZON, t) };
}

class DriftlightView extends Node {
  override readonly type = 'DriftlightView';
  // ── canonical sim state ──
  px = START.x;
  py = START.y;
  flame = FLAME_START;
  gathered: boolean[] = [];
  won = false;
  lost = false;

  private course: Course = buildCourse(COURSE_SEED);
  private field = new Node({ name: 'field' });
  private sky!: Sprite;
  private water!: Sprite;
  private lantern!: Node;
  private lanternGlow!: Sprite;
  private lanternFlame!: Sprite;
  private reflection!: Sprite;
  private lights: Sprite[] = [];
  private flameFill!: Sprite;
  private camera!: Camera2D;

  protected override onReady(): void {
    this.rebuild();
  }

  private rebuild(): void {
    for (const c of this.children.slice()) this.removeChild(c);
    this.gathered = this.gathered.length === this.course.lights.length ? this.gathered : this.course.lights.map(() => false);

    // ── camera first: parallax layers read its position ──
    this.camera = new Camera2D({ name: 'camera', pos: { x: this.px, y: CAM_Y }, current: true });
    this.camera.cosmetic = true;
    this.addChild(this.camera);

    this.buildSky(this.camera);

    // ── the scrolling world ──
    this.field = new Node({ name: 'field' });
    this.field.cosmetic = true;
    this.addChild(this.field);

    this.buildParallax();
    this.buildWater();
    this.buildCourseArt();
    this.buildLantern();

    // HUD + follow (built last; HUD rides the camera)
    this.buildHud(this.camera);
    this.addChild(new CameraController({
      name: 'follow', target: this.lantern, deadzone: { x: 90, y: 999 }, smooth: 0.16,
      bounds: { minX: 430, minY: CAM_Y, maxX: RIVER.length - 430, maxY: CAM_Y },
    }));

    this.syncView();
  }

  /** Full-screen sky gradient, pinned to the camera; recolored by progress. */
  private buildSky(cam: Camera2D): void {
    const { top, horizon } = skyColors(0);
    this.sky = new Sprite({ name: 'sky', pos: { x: 0, y: 0 }, z: -100, shape: { kind: 'rect', w: VIEW_W + 40, h: VIEW_H + 40 }, gradient: linearGradient([top, mix(top, horizon, 0.5), horizon], 90) });
    cam.addChild(this.sky);
    // A soft moon/sun disc, pinned high; its glow reads against every phase.
    cam.addChild(new Sprite({ name: 'orb', pos: { x: 360, y: -210 }, z: -99, shape: { kind: 'circle', radius: 46 }, gradient: radialGradient([withAlpha(KENTO.gofun, 0.95), withAlpha(KENTO.gofun, 0)]), shadow: glow(withAlpha(KENTO.gofun, 0.6), 40) }));
  }

  /** Far mountains + a mist band, each on its own parallax plane. */
  private buildParallax(): void {
    const rng = new Rng(DECO_SEED);
    const atScreenY = (screenY: number, f: number): number => screenY - VIEW_H / 2 + CAM_Y * f;

    // Distant mountain ridge — slow (factor 0.14).
    const mountains = new ParallaxLayer({ name: 'far', factor: 0.14, z: -90 });
    this.addChild(mountains);
    const ridge = mix(KENTO.aiDeep, KENTO.sumi, 0.35);
    for (let x = -200; x < RIVER.length; x += rng.range(360, 560)) {
      const w = rng.range(360, 620);
      const h = rng.range(150, 300);
      const baseY = atScreenY(300, 0.14);
      const d = blobPath(rng, w / 2, 0.16, 6);
      mountains.addChild(new Sprite({ pos: { x, y: baseY - h / 2 }, z: -90, shape: { kind: 'path', d }, gradient: linearGradient([mix(ridge, KENTO.fuji, 0.25), ridge], 90), opacity: 0.9 }));
    }

    // Mid mist band — quicker (factor 0.4), soft and low.
    const mist = new ParallaxLayer({ name: 'mist', factor: 0.4, z: -75 });
    this.addChild(mist);
    for (let x = -200; x < RIVER.length; x += rng.range(280, 460)) {
      const w = rng.range(420, 760);
      mist.addChild(new Sprite({ pos: { x, y: atScreenY(330, 0.4) }, z: -75, shape: { kind: 'rect', w, h: 130, r: 65 }, gradient: radialGradient([withAlpha(KENTO.washi, 0.22), withAlpha(KENTO.washi, 0)]), opacity: 0.8 }));
    }
  }

  /** The river surface: a wide gradient slab + drifting reflection streaks. */
  private buildWater(): void {
    const cy = (RIVER.top + RIVER.bottom) / 2;
    this.water = new Sprite({ name: 'water', pos: { x: RIVER.length / 2, y: cy + 120 }, z: -60, shape: { kind: 'rect', w: RIVER.length + 400, h: 900 }, gradient: this.waterGradient(0) });
    this.field.addChild(this.water);

    // Static horizontal glimmer streaks for surface texture (standalone rng).
    const rng = new Rng(DECO_SEED ^ 0x51);
    for (let x = 0; x < RIVER.length; x += rng.range(120, 260)) {
      const y = rng.range(RIVER.top + 20, RIVER.bottom + 160);
      this.field.addChild(new Sprite({ pos: { x, y }, z: -58, shape: { kind: 'rect', w: rng.range(60, 160), h: 2.5, r: 2 }, fill: withAlpha(KENTO.gofun, rng.range(0.05, 0.14)) }));
    }
  }

  private waterGradient(t: number) {
    const { horizon } = skyColors(t);
    const deep = mix(horizon, KENTO.yohaku, 0.72);
    const shal = mix(horizon, KENTO.asagiDeep, 0.5);
    return linearGradient([mix(deep, KENTO.gofun, 0.12), shal, deep], 90);
  }

  /** Rocks (blob + shadow) and fireflies (glowing radial dots). */
  private buildCourseArt(): void {
    const rng = new Rng(DECO_SEED ^ 0x7a);
    for (const r of this.course.rocks) {
      const tone = mix(KENTO.stone, KENTO.sumi, rng.range(0.2, 0.55));
      this.field.addChild(new Sprite({ pos: { x: r.x, y: r.y + r.r * 0.5 }, z: 4, shape: { kind: 'circle', radius: r.r * 0.9 }, fill: withAlpha(KENTO.yohaku, 0.28) }));
      this.field.addChild(new Sprite({
        pos: { x: r.x, y: r.y }, z: 10,
        shape: { kind: 'path', d: blobPath(rng, r.r, 0.24, 7) },
        gradient: linearGradient([mix(tone, KENTO.kinako, 0.35), tone], 90),
        stroke: KENTO.yohaku, strokeWidth: 2, shadow: dropShadow(withAlpha(KENTO.yohaku, 0.5), 6, 0, 3),
      }));
    }
    this.lights = this.course.lights.map((l) => {
      const s = new Sprite({
        pos: { x: l.x, y: l.y }, z: 30,
        shape: { kind: 'circle', radius: 7 },
        gradient: radialGradient([KENTO.gofun, KENTO.ko, withAlpha(KENTO.kaki, 0)]),
        shadow: glow(withAlpha(KENTO.ko, 0.9), 16),
      });
      this.field.addChild(s);
      return s;
    });
  }

  /** The paper lantern: a warm glow, its reflection, the body, and the flame. */
  private buildLantern(): void {
    this.lantern = new Node({ name: 'lantern', pos: { x: this.px, y: this.py }, z: 40 });
    this.lantern.cosmetic = true;

    // Reflection on the water, below the lantern (stretched, faded, warm).
    this.reflection = new Sprite({ name: 'reflection', pos: { x: 0, y: 58 }, z: 38, shape: { kind: 'rect', w: 26, h: 90, r: 13 }, gradient: linearGradient([withAlpha(KENTO.ko, 0.5), withAlpha(KENTO.ko, 0)], 90), opacity: 0.6 });
    this.lantern.addChild(this.reflection);

    // The soft warm glow (scaled by flame in syncView).
    this.lanternGlow = new Sprite({ name: 'glow', z: 39, shape: { kind: 'circle', radius: 60 }, gradient: radialGradient([withAlpha(KENTO.ko, 0.7), withAlpha(KENTO.kaki, 0.25), withAlpha(KENTO.kaki, 0)]), shadow: glow(withAlpha(KENTO.ko, 0.8), 30) });
    this.lantern.addChild(this.lanternGlow);

    // Body: a warm paper lantern with a lit gradient core.
    this.lantern.addChild(new Sprite({ z: 42, shape: { kind: 'rect', w: 30, h: 38, r: 12 }, gradient: linearGradient([mix(KENTO.ko, KENTO.gofun, 0.5), KENTO.ko, KENTO.kakiDeep], 90), stroke: KENTO.sumi, strokeWidth: 3 }));
    for (const yy of [-8, 0, 8]) this.lantern.addChild(new Sprite({ pos: { x: 0, y: yy }, z: 43, shape: { kind: 'rect', w: 26, h: 2 }, fill: withAlpha(KENTO.sumiSoft, 0.5) }));
    this.lantern.addChild(new Sprite({ pos: { x: 0, y: -22 }, z: 43, shape: { kind: 'rect', w: 22, h: 6, r: 2 }, fill: KENTO.sumi }));
    this.lantern.addChild(new Sprite({ pos: { x: 0, y: 21 }, z: 43, shape: { kind: 'rect', w: 16, h: 5, r: 2 }, fill: KENTO.sumi }));
    this.lanternFlame = new Sprite({ name: 'flame', z: 44, shape: { kind: 'circle', radius: 5 }, gradient: radialGradient([KENTO.gofun, KENTO.ko]), shadow: glow(KENTO.gofun, 10) });
    this.lantern.addChild(this.lanternFlame);

    this.addChild(this.lantern);
  }

  /** HUD: a flame gauge + the coach line, both pinned to the camera. */
  private buildHud(cam: Camera2D): void {
    cam.addChild(new Sprite({ name: 'gaugeBack', pos: { x: -520, y: -320 }, z: 90, shape: { kind: 'rect', w: 260, h: 22, r: 11 }, fill: withAlpha(KENTO.sumi, 0.7), stroke: KENTO.kinako, strokeWidth: 2 }));
    this.flameFill = new Sprite({ name: 'gaugeFill', pos: { x: -520, y: -320 }, z: 91, shape: { kind: 'rect', w: 252, h: 14, r: 7 }, gradient: linearGradient([KENTO.shu, KENTO.kaki, KENTO.ko], 0), shadow: glow(withAlpha(KENTO.ko, 0.7), 8) });
    cam.addChild(this.flameFill);
    cam.addChild(new Text({ name: 'gaugeLabel', text: 'flame', pos: { x: -520, y: -350 }, z: 92, size: 17, align: 'center', fill: KENTO.gofun }));

    cam.addChild(new Sprite({ name: 'coachPanel', pos: { x: 0, y: 322 }, z: 90, shape: { kind: 'rect', w: 940, h: 44, r: 12 }, fill: withAlpha(KENTO.sumi, 0.82), stroke: KENTO.kinako, strokeWidth: 2 }));
    cam.addChild(new Text({ name: 'coach', text: '↑ / ↓ steer  ·  gather fireflies  ·  reach the dawn sea  ·  R restart', pos: { x: 0, y: 322 }, z: 91, size: 20, align: 'center', fill: KENTO.gofun }));
  }

  /** Push canonical state → the cosmetic view (called after each sim step). */
  private syncView(): void {
    const t = progress(this.px);
    // Sky + water recolor with the day arc.
    const { top, horizon } = skyColors(t);
    this.sky.paint.gradient = linearGradient([top, mix(top, horizon, 0.5), horizon], 90);
    this.water.paint.gradient = this.waterGradient(t);

    // Lantern position + flame-driven brightness.
    this.lantern.pos.x = this.px;
    this.lantern.pos.y = this.py;
    const f = this.flame;
    this.lanternGlow.scale = { x: 0.5 + f, y: 0.5 + f };
    this.lanternGlow.paint.opacity = 0.35 + 0.6 * f;
    this.lanternFlame.scale = { x: 0.6 + 0.7 * f, y: 0.6 + 0.7 * f };
    this.reflection.paint.opacity = 0.2 + 0.5 * f;

    // Gathered fireflies wink out.
    for (let i = 0; i < this.lights.length; i++) this.lights[i].visible = !this.gathered[i];

    // Flame gauge width + hue (left-anchored bar).
    const w = Math.max(2, 252 * f);
    this.flameFill.shape = { kind: 'rect', w, h: 14, r: 7 };
    this.flameFill.pos.x = -520 - (252 - w) / 2;
  }

  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const input = (this.world as World).input;
    if (input.justPressed('restart')) return this.restart();
    if (this.won || this.lost) return;

    // Auto-drift downstream; player steers across-stream.
    this.px += DRIFT * dt;
    const ay = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
    this.py = clampAcross(this.py + ay * STEER * dt);

    // Flame drains always; scraping a rock bites steadily; fireflies feed.
    this.flame -= DRAIN * dt;
    const p = { x: this.px, y: this.py };
    if (rockHit(this.course, p) !== -1) this.flame -= HIT_COST * dt;
    const li = lightHit(this.course, p, this.gathered);
    if (li !== -1) {
      this.gathered[li] = true;
      this.flame = Math.min(FLAME_MAX, this.flame + LIGHT_GAIN);
      audio.blip(720);
    }

    if (this.flame <= 0) {
      this.flame = 0;
      this.syncView();
      return this.lose();
    }
    if (this.px >= SEA_X) {
      this.syncView();
      return this.win();
    }
    this.syncView();
  }

  private win(): void {
    this.won = true;
    audio.success();
    const lit = this.gathered.filter(Boolean).length;
    showScreen({
      title: 'The lantern reaches the sea.',
      body: `Dawn breaks over the water. Flame ${Math.round(this.flame * 100)}%, ${lit} fireflies gathered along the way.`,
      actions: [{ label: 'Drift again', primary: true, onSelect: () => this.restart() }],
    });
    this.emit('arrived', true);
  }

  private lose(): void {
    this.lost = true;
    audio.blip(150);
    showScreen({
      title: 'The flame goes out.',
      body: `The lantern drifts on, dark, ${Math.round(progress(this.px) * 100)}% of the way to the sea.`,
      actions: [{ label: 'Try again', primary: true, onSelect: () => this.restart() }],
    });
  }

  restart(): void {
    this.won = false;
    this.lost = false;
    this.px = START.x;
    this.py = START.y;
    this.flame = FLAME_START;
    this.gathered = this.course.lights.map(() => false);
    hideScreen();
    this.rebuild();
  }

  protected override serializeProps(): Record<string, unknown> {
    return { px: this.px, py: this.py, flame: this.flame, gathered: this.gathered.slice(), won: this.won, lost: this.lost };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.px === 'number') this.px = props.px;
    if (typeof props.py === 'number') this.py = props.py;
    if (typeof props.flame === 'number') this.flame = props.flame;
    if (Array.isArray(props.gathered)) this.gathered = props.gathered as boolean[];
    this.won = !!props.won;
    this.lost = !!props.lost;
    this.rebuild();
  }
}

registerNode('DriftlightView', () => new DriftlightView());

export function makeDriftlightRoot(): DriftlightView {
  return new DriftlightView({ name: 'driftlight' });
}

export const driftlightGame = defineGame({
  title: 'Driftlight',
  width: VIEW_W,
  height: VIEW_H,
  background: KENTO.yohaku,
  inputMap: DL_INPUT_MAP,
  build: () => makeDriftlightRoot(),
  probe: (world) => {
    const view = world.root.find('driftlight') as DriftlightView | null;
    const px = view?.px ?? START.x;
    return {
      frame: world.frame,
      hash: world.hash(),
      px,
      py: view?.py ?? START.y,
      flame: view?.flame ?? 0,
      progress: Math.round(progress(px) * 100),
      gathered: view?.gathered.filter(Boolean).length ?? 0,
      won: view?.won ?? false,
      lost: view?.lost ?? false,
    };
  },
});

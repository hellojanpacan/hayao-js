// Updrift — the golden platformer reference. Its job is to be the file an agent
// copies for anything with jump-and-climb feel, so it deliberately EXERCISES the
// art/juice stack most examples leave on the shelf (0/26 before this): parallax
// depth, an ambient snow field, burst particles, screen shake, a marching-squares
// terrain silhouette, floating text, and procedural SFX — all cosmetic, all out
// of world.hash(). The canonical sim is one PlatformerState in world.state; every
// pixel here is a replaceable view over it. See docs/JUICE.md for the cookbook.

import {
  Node,
  Sprite,
  Text,
  Camera2D,
  CameraController,
  ParallaxLayer,
  Particles,
  Shaker,
  AmbientField,
  FloatingText,
  PARTICLE_PRESETS,
  AMBIENT_PRESETS,
  FLOAT_PRESETS,
  autotileToCommands,
  Rng,
  gradient,
  KENTO,
  withAlpha,
  mix,
  audio,
  defineGame,
  showScreen,
  hideScreen,
  type World,
  type DrawCommand,
  type Transform,
  type InputMap,
  type BoolGrid,
  type PlatformerState,
  type FeelSpec,
} from '@hayao';
import {
  MAP,
  WORLD,
  TILE_PX,
  LEVEL,
  SPAWN_PX,
  GOAL_PX,
  FLARE,
  CONFIG,
  FEEDBACK,
  FEEDBACK_EVENTS,
  createUpdriftState,
  stepUpdrift,
  reachedGoal,
  bodyCenter,
  flarePhase,
} from './logic';

export const UP_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  dash: ['ShiftLeft', 'ShiftRight', 'KeyK'],
  restart: ['KeyR'],
};

const AVATAR_FILL = KENTO.ko; // bright ochre "lantern" — pops off the twilight ground (salience gate)
const SKY = KENTO.kuro;

/** The declared feel contract — audited by `npm run feel` and updrift's verify. */
export const feel: FeelSpec = {
  avatarFill: AVATAR_FILL,
  background: SKY,
  forgiveness: CONFIG,
  feedback: { contract: FEEDBACK, events: FEEDBACK_EVENTS },
  scrolls: true,
};

// ── Canonical state (hashed) ────────────────────────────────────────────────
interface UpState {
  pc: PlatformerState;
  collected: number[]; // indices of gathered crystals
  won: boolean;
  deaths: number;
  /** Per-frame feel events, mirrored into state so the probe timeline can see them. */
  fx: { jumped: boolean; landed: boolean; dashed: boolean; collect: boolean; died: boolean; summit: boolean };
}
const freshState = (): UpState => ({ pc: createUpdriftState(), collected: [], won: false, deaths: 0, fx: { jumped: false, landed: false, dashed: false, collect: false, died: false, summit: false } });
// Lazy-init so probe() is safe even before the first step() runs onReady.
const upState = (w: World): UpState => (w.state.up ??= freshState()) as UpState;

/** A cosmetic node that re-emits precomputed world-space draw commands under the camera. */
class CommandLayer extends Node {
  override readonly type = 'CommandLayer';
  constructor(private cmds: DrawCommand[], z = 0) {
    super({ z });
    this.cosmetic = true;
  }
  protected override draw(out: DrawCommand[], world: Transform): void {
    for (const c of this.cmds) out.push({ ...c, transform: world });
  }
}

const crystals = LEVEL.entities.filter((e) => e.kind === 'crystal');

class UpdriftView extends Node {
  override readonly type = 'UpdriftView';
  private avatar!: Sprite;
  private glow!: Sprite;
  private particles!: Particles;
  private pops!: FloatingText;
  private shaker!: Shaker;
  private camera!: Camera2D;
  private flare!: Sprite;
  private crystalNodes: Sprite[] = [];
  private height!: Text;

  protected override onReady(): void {
    const w = this.world as World;
    if (!w.state.up) w.state.up = freshState();
    this.build();
  }

  private build(): void {
    for (const c of this.children.slice()) this.removeChild(c);
    this.crystalNodes = [];

    // ── Parallax star haze: faint stars spanning the whole climb, drifting slow
    // so the ascent reads as movement through depth (the pinned sky is built on
    // the camera in buildSky, so it's always framed — see below).
    const stars = new ParallaxLayer({ name: 'stars', factor: 0.35, z: -60 });
    const srng = new Rng(20260705);
    for (let i = 0; i < 60; i++) {
      stars.addChild(new Sprite({ pos: { x: srng.range(0, WORLD.w), y: srng.range(0, WORLD.h) }, z: -60, shape: { kind: 'circle', radius: srng.range(0.8, 1.8) }, fill: withAlpha(KENTO.gofun, srng.range(0.12, 0.4)) }));
    }
    this.addChild(stars);

    // ── Terrain silhouette from the solid grid (art toolkit: autotile) ────────
    const solids: BoolGrid = Array.from({ length: MAP.rows }, (_, y) => Array.from({ length: MAP.cols }, (_, x) => MAP.tiles[y * MAP.cols + x] === 1));
    const terrain = autotileToCommands(solids, { tile: TILE_PX, fill: mix(KENTO.sumi, KENTO.aiDeep, 0.25), edge: KENTO.stone, edgeWidth: 2, z: 0 });
    this.addChild(new CommandLayer(terrain as DrawCommand[], 0));

    // ── One-way climbing ledges: inked woodblock planks ───────────────────────
    for (const l of LEVEL.rows.flatMap((row, ty) => [...row].map((ch, tx) => ({ ch, tx, ty }))).filter((c) => c.ch === '-')) {
      this.addChild(new Sprite({ pos: { x: (l.tx + 0.5) * TILE_PX, y: (l.ty + 0.5) * TILE_PX }, z: 1, shape: { kind: 'rect', w: TILE_PX, h: TILE_PX * 0.42, r: 4 }, fill: KENTO.kinako, stroke: KENTO.sumiSoft, strokeWidth: 1.5 }));
    }

    // ── Bonus crystals ────────────────────────────────────────────────────────
    const s = upState(this.world as World);
    crystals.forEach((e, i) => {
      const node = new Sprite({ name: `crystal${i}`, pos: { x: e.x, y: e.y }, z: 3, shape: { kind: 'poly', points: [0, -11, 8, 0, 0, 11, -8, 0] }, fill: KENTO.asagi, stroke: KENTO.gofun, strokeWidth: 1.5, opacity: 0.95 });
      node.visible = !s.collected.includes(i);
      this.crystalNodes.push(node);
      this.addChild(node);
    });

    // ── Flare: a telegraphed periodic hazard (drawn per phase in onProcess) ───
    this.flare = new Sprite({ name: 'flare', pos: { x: (FLARE.cell.x + 0.5) * TILE_PX, y: (FLARE.cell.y + 0.5) * TILE_PX }, z: 3, shape: { kind: 'circle', radius: 13 }, fill: KENTO.shuDeep, stroke: KENTO.sumi, strokeWidth: 1.5 });
    this.addChild(this.flare);

    // ── Goal shrine ───────────────────────────────────────────────────────────
    // Glow ring sits at background z (≤1) so it never trips the text-vs-shape lint against the ⛩ glyph.
    this.addChild(new Sprite({ name: 'goalGlow', pos: { ...GOAL_PX }, z: 1, shape: { kind: 'circle', radius: 34 }, fill: 'none', stroke: KENTO.ko, strokeWidth: 3, opacity: 0.45 }));
    this.addChild(new Sprite({ name: 'goal', pos: { x: GOAL_PX.x, y: GOAL_PX.y + 4 }, z: 4, shape: { kind: 'glyph', char: '⛩', size: 44 }, fill: KENTO.shu }));

    // ── The climber (avatar + soft lantern glow) ──────────────────────────────
    // Seed at the spawn so the camera's initial snap frames the climber, not (0,0).
    const spawnC = bodyCenter(s.pc);
    this.glow = new Sprite({ name: 'glow', pos: { ...spawnC }, z: 9, shape: { kind: 'circle', radius: CONFIG.width * 0.9 }, fill: 'none', stroke: AVATAR_FILL, strokeWidth: 3, opacity: 0.28 });
    this.addChild(this.glow);
    this.avatar = new Sprite({ name: 'avatar', pos: { ...spawnC }, z: 10, shape: { kind: 'rect', w: CONFIG.width, h: CONFIG.height, r: 5 }, fill: AVATAR_FILL, stroke: KENTO.sumi, strokeWidth: 2 });
    this.addChild(this.avatar);

    // ── Juice emitters (cosmetic) ─────────────────────────────────────────────
    this.particles = new Particles({ name: 'fx', z: 11, seed: 4 });
    this.addChild(this.particles);
    this.pops = new FloatingText({ name: 'pops', z: 12, seed: 5 });
    this.addChild(this.pops);
    const snow = new AmbientField({ name: 'snow', z: 15, seed: 9, count: 90, width: WORLD.w, height: WORLD.h, style: AMBIENT_PRESETS.snow() });
    snow.z = 15;
    this.addChild(snow);

    // ── Camera on a shaker, HUD pinned to the camera ─────────────────────────
    this.shaker = new Shaker({ name: 'shaker', amplitude: 12, decay: 3.2 });
    this.shaker.cosmetic = true;
    this.addChild(this.shaker);
    this.camera = new Camera2D({ name: 'camera', pos: { x: SPAWN_PX.x, y: SPAWN_PX.y }, current: true });
    this.camera.cosmetic = true;
    this.shaker.addChild(this.camera);
    this.addChild(new CameraController({ name: 'follow', target: this.avatar, camera: this.camera, deadzone: { x: 320, y: 90 }, smooth: 0.12, bounds: { minX: 0, minY: 0, maxX: WORLD.w, maxY: WORLD.h } }));
    this.buildSky(this.camera);
    this.buildHud(this.camera);
    this.syncAvatar();
  }

  /** Screen-pinned night backdrop (parented to the camera, so it's always framed
   *  on the long vertical climb): a graded sky, a low moon, and two ridgelines in
   *  receding dusk tones — atmospheric perspective that fills the former void. */
  private buildSky(cam: Camera2D): void {
    const W = 1280;
    const H = 720;
    // Graded sky: deep indigo overhead → a faint dusk glow toward the horizon.
    const bands = gradient([KENTO.yohaku, mix(KENTO.aiDeep, KENTO.yohaku, 0.55), mix(KENTO.aiDeep, KENTO.fujiDeep, 0.5)], 14);
    const bh = H / bands.length;
    bands.forEach((c, i) => cam.addChild(new Sprite({ pos: { x: 0, y: -H / 2 + bh * (i + 0.5) }, z: -100, shape: { kind: 'rect', w: W, h: bh + 1 }, fill: c })));
    // A low moon with a soft halo, upper-left.
    cam.addChild(new Sprite({ pos: { x: -380, y: -210 }, z: -97, shape: { kind: 'circle', radius: 58 }, fill: 'none', stroke: withAlpha(KENTO.asagi, 0.3), strokeWidth: 12 }));
    cam.addChild(new Sprite({ pos: { x: -380, y: -210 }, z: -96, shape: { kind: 'circle', radius: 34 }, fill: mix(KENTO.gofun, KENTO.asagi, 0.3) }));
    // Two ridgelines along the lower half — far (lighter, taller) then near (darker).
    cam.addChild(this.ridge(300, mix(KENTO.ai, KENTO.gofun, 0.12), -92, 71));
    cam.addChild(this.ridge(200, mix(KENTO.aiDeep, KENTO.yohaku, 0.4), -88, 137));
  }

  /** A jagged ridge silhouette spanning the screen, peaks rising `peak` px above
   *  the screen bottom. Screen-space (camera-local, origin = screen center). */
  private ridge(peak: number, fill: string, z: number, seed: number): Sprite {
    const W = 1280;
    const H = 720;
    const base = H / 2 + 30; // just past the bottom edge
    const rng = new Rng(seed);
    const pts: number[] = [-W / 2 - 20, base];
    const n = 8;
    for (let i = 0; i <= n; i++) pts.push(-W / 2 + (W / n) * i, base - peak * (0.45 + rng.float() * 0.55));
    pts.push(W / 2 + 20, base);
    return new Sprite({ z, shape: { kind: 'poly', points: pts }, fill, opacity: 0.95 });
  }

  private buildHud(cam: Camera2D): void {
    cam.addChild(new Sprite({ name: 'coachPanel', pos: { x: 0, y: -320 }, z: 20, shape: { kind: 'rect', w: 860, h: 52, r: 12 }, fill: withAlpha(KENTO.sumi, 0.86), stroke: KENTO.kinako, strokeWidth: 2 }));
    cam.addChild(new Text({ name: 'coach', text: '← → move · Space jump · Shift dash · R restart', pos: { x: 0, y: -314 }, z: 21, size: 22, align: 'center', fill: KENTO.gofun }));
    this.height = new Text({ name: 'height', text: 'Height 0m', pos: { x: -600, y: 300 }, z: 21, size: 24, align: 'left', fill: KENTO.ko });
    cam.addChild(this.height);
  }

  protected override onProcess(dt: number): void {
    const w = this.world as World;
    const s = upState(w);
    const fx = s.fx;
    fx.jumped = fx.landed = fx.dashed = fx.collect = fx.died = fx.summit = false;
    if (!s.won && !s.pc.dead) {
      const input = w.input;
      const ev = stepUpdrift(
        s.pc,
        {
          moveX: input.isDown('right') ? 1 : input.isDown('left') ? -1 : 0,
          moveY: 0,
          jumpHeld: input.isDown('jump'),
          jumpPressed: input.justPressed('jump'),
          dashPressed: input.justPressed('dash'),
        },
        dt,
      );
      this.applyFeel(ev, s);
      this.collect(s);
      this.hazard(s);
      if (reachedGoal(s.pc)) this.win(s);
    }
    if (input_restart(w) && (s.won || s.pc.dead)) this.reset();
    this.paintFlare(w.time);
    this.syncAvatar();
    this.height.text = `Height ${Math.max(0, Math.round((WORLD.h - bodyCenter(s.pc).y) / TILE_PX))}m` + (s.collected.length ? `  ·  ✦ ${s.collected.length}/${crystals.length}` : '');
  }

  private applyFeel(ev: ReturnType<typeof stepUpdrift>, s: UpState): void {
    const c = bodyCenter(s.pc);
    const feet = { x: c.x, y: s.pc.y + CONFIG.height };
    if (ev.jumped) {
      s.fx.jumped = true;
      audio.tone({ freq: 620, duration: 0.08, type: 'sine', gain: 0.16 });
      this.particles.burst(6, feet, PARTICLE_PRESETS.dust([KENTO.kinu, KENTO.kinako]));
    }
    if (ev.landed) {
      s.fx.landed = true;
      audio.tone({ freq: 180, duration: 0.07, type: 'sine', gain: 0.18 });
      this.particles.burst(8, feet, PARTICLE_PRESETS.dust([KENTO.kinu, KENTO.line]));
      this.shaker.addTrauma(0.12);
    }
    if (ev.dashed) {
      s.fx.dashed = true;
      audio.tone({ freq: 440, duration: 0.1, type: 'triangle', gain: 0.16 });
      this.particles.burst(12, c, { ...PARTICLE_PRESETS.burst([KENTO.ko, KENTO.gofun]), angle: s.pc.facing > 0 ? Math.PI : 0, spread: 0.9 });
      this.shaker.addTrauma(0.1);
    }
    if (ev.died) this.die(s);
  }

  private collect(s: UpState): void {
    const c = bodyCenter(s.pc);
    crystals.forEach((e, i) => {
      if (s.collected.includes(i)) return;
      if (Math.abs(c.x - e.x) < 22 && Math.abs(c.y - e.y) < 22) {
        s.collected.push(i);
        s.fx.collect = true;
        this.crystalNodes[i].visible = false;
        audio.blip(880);
        this.particles.burst(10, e, PARTICLE_PRESETS.sparkle());
        this.pops.pop('✦', e, FLOAT_PRESETS.heal(KENTO.asagi));
      }
    });
  }

  private hazard(s: UpState): void {
    const ph = flarePhase((this.world as World).time);
    if (!ph.active) return;
    const c = bodyCenter(s.pc);
    if (Math.abs(c.x - (FLARE.cell.x + 0.5) * TILE_PX) < 20 && Math.abs(c.y - (FLARE.cell.y + 0.5) * TILE_PX) < 22) this.die(s);
  }

  private die(s: UpState): void {
    if (s.pc.dead) return;
    s.pc.dead = true;
    s.fx.died = true;
    s.deaths++;
    audio.tone({ freq: 120, duration: 0.18, type: 'sawtooth', gain: 0.22 });
    this.particles.burst(16, bodyCenter(s.pc), PARTICLE_PRESETS.hit([KENTO.shu, KENTO.gofun]));
    this.shaker.addTrauma(0.5);
    showScreen({ title: 'The lantern gutters out', body: `A flare caught you. Height reached: ${Math.round((WORLD.h - bodyCenter(s.pc).y) / TILE_PX)}m.`, actions: [{ label: 'Climb again', primary: true, onSelect: () => { this.reset(); hideScreen(); } }] });
  }

  private win(s: UpState): void {
    s.won = true;
    s.fx.summit = true;
    audio.success();
    this.particles.burst(28, GOAL_PX, PARTICLE_PRESETS.burst([KENTO.ko, KENTO.shu, KENTO.gofun]));
    this.shaker.addTrauma(0.3);
    showScreen({ title: 'The summit shrine', body: `You reached the top${s.collected.length ? ` with ${s.collected.length}/${crystals.length} crystals` : ''}. Deaths: ${s.deaths}.`, actions: [{ label: 'Again', primary: true, onSelect: () => { this.reset(); hideScreen(); } }] });
  }

  private reset(): void {
    (this.world as World).state.up = freshState();
    this.build();
  }

  private paintFlare(time: number): void {
    const ph = flarePhase(time);
    this.flare.paint.fill = ph.active ? KENTO.gofun : ph.telegraphing ? KENTO.ko : KENTO.shuDeep;
    this.flare.paint.opacity = ph.active ? 1 : ph.telegraphing ? 0.85 : 0.5;
  }

  private syncAvatar(): void {
    const s = upState(this.world as World);
    const c = bodyCenter(s.pc);
    this.avatar.pos = { x: c.x, y: c.y };
    this.glow.pos = { x: c.x, y: c.y };
    this.avatar.visible = !s.pc.dead;
    this.glow.visible = !s.pc.dead;
  }
}

function input_restart(w: World): boolean {
  return w.input.justPressed('restart');
}

export const updriftGame = defineGame({
  title: 'Updrift',
  width: 1280,
  height: 720,
  background: SKY,
  inputMap: UP_INPUT_MAP,
  build: () => new UpdriftView({ name: 'updrift' }),
  probe: (w: World) => {
    const s = upState(w);
    const c = bodyCenter(s.pc);
    const cam = w.activeCamera;
    const ph = flarePhase(w.time);
    return {
      frame: w.frame,
      time: w.time,
      px: c.x,
      py: c.y,
      onGround: s.pc.onGround,
      vy: s.pc.vy,
      dashesLeft: s.pc.dashesLeft,
      won: s.won,
      dead: s.pc.dead,
      deaths: s.deaths,
      collected: s.collected.length,
      camX: cam ? cam.pos.x : 0,
      camY: cam ? cam.pos.y : 0,
      flareTele: ph.telegraphing,
      flareActive: ph.active,
      jumped: s.fx.jumped,
      landed: s.fx.landed,
      dashed: s.fx.dashed,
      collect: s.fx.collect,
      died: s.fx.died,
      summit: s.fx.summit,
      hash: w.hash(),
    };
  },
});

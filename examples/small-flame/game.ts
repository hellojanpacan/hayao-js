// Small Flame — the view. Samples thrust/drift actions, steps the pure sim
// (logic.ts), and paints a still night shaft in the Regalia night palette. The
// only canonical state is `sim` (serialized → hashed); every pixel below lives
// under a cosmetic Shaker, so deleting the juice changes no game bit.

import {
  Node,
  Sprite,
  Text,
  Particles,
  Shaker,
  AmbientField,
  dsin,
  REGALIA,
  REGALIA_NIGHT,
  withAlpha,
  registerNode,
  showScreen,
  hideScreen,
  audio,
  defineGame,
  type World,
  type ParticleStyle,
  type FeelSpec,
  type FeedbackContract,
} from '@hayao';
import {
  DEFAULT_FLAME,
  EMBER_POINTS,
  GOAL_POINT,
  LEVEL,
  MAP,
  TILE,
  medalFor,
  spawnState,
  stepFlame,
  type FlameConfig,
  type FlameState,
} from './logic';

const W = 1280;
const H = 720;

// ── Juice presets (all cosmetic — carry their own Rng) ───────────────────────
const trailStyle: ParticleStyle = {
  colors: [REGALIA.gold, REGALIA.rose, withAlpha(REGALIA.gold, 0.6)],
  sizeMin: 2,
  sizeMax: 4.5,
  speedMin: 8,
  speedMax: 42,
  lifeMin: 0.3,
  lifeMax: 0.7,
  gravity: -30, // embers drift UP as they cool
  drag: 2.2,
  shrink: true,
};
const landStyle: ParticleStyle = {
  colors: [REGALIA.gold, REGALIA.mist],
  sizeMin: 2,
  sizeMax: 4,
  speedMin: 40,
  speedMax: 120,
  angle: -Math.PI / 2,
  spread: Math.PI * 0.7,
  lifeMin: 0.25,
  lifeMax: 0.5,
  drag: 4,
  shrink: true,
};
const emberStyle: ParticleStyle = {
  colors: [REGALIA.gold, REGALIA.mist, REGALIA.blue],
  sizeMin: 2,
  sizeMax: 5,
  speedMin: 30,
  speedMax: 110,
  lifeMin: 0.4,
  lifeMax: 0.8,
  drag: 3,
  shrink: true,
};
const deathStyle: ParticleStyle = {
  colors: [REGALIA.rose, REGALIA.gold],
  sizeMin: 2,
  sizeMax: 5,
  speedMin: 60,
  speedMax: 220,
  lifeMin: 0.3,
  lifeMax: 0.6,
  drag: 3,
  shrink: true,
};

class FlameView extends Node {
  override readonly type = 'FlameView';
  private cfg: FlameConfig = DEFAULT_FLAME;
  sim: FlameState = spawnState(this.cfg);

  private stage = new Shaker({ name: 'stage', amplitude: 12, decay: 3.2 });
  private trail = new Particles({ name: 'trail', seed: 7 });
  private burst = new Particles({ name: 'burst', seed: 13 });
  private flame = new Node({ name: 'flame' });
  private glow!: Sprite;
  private body!: Sprite;
  private core!: Sprite;
  private gaugeFill!: Sprite;
  private emberNodes: Sprite[] = [];
  private goalGlow!: Sprite;
  private won = false;
  private glowPhase = 0;

  protected override onReady(): void {
    this.stage.cosmetic = true;
    this.addChild(this.stage);
    this.buildBackdrop();
    this.buildScenery();
    this.buildEmbers();
    this.buildGoal();
    this.stage.addChild(this.trail);
    this.buildFlame();
    this.stage.addChild(this.burst);
    this.buildHud();
    this.syncFlame();
  }

  // Atmosphere & depth (all cosmetic, string fills only so the salience gate is
  // untouched): a deepened void above, a warm hearth glow at the base, a soft
  // luminous halo drawing the eye up to the lantern, and embers drifting on a
  // gentle updraft behind the play field.
  private buildBackdrop(): void {
    const bg = new Node({ name: 'backdrop' });
    bg.cosmetic = true;
    // Deepen the top of the shaft (value range → the void reads as depth, not flat).
    bg.addChild(new Sprite({ pos: { x: W / 2, y: 150 }, z: -6, shape: { kind: 'rect', w: W, h: 300 }, fill: withAlpha('#060a1e', 0.45) }));
    bg.addChild(new Sprite({ pos: { x: W / 2, y: 70 }, z: -6, shape: { kind: 'rect', w: W, h: 140 }, fill: withAlpha('#04061a', 0.5) }));
    // A warm hearth glow at the base, where the flame is born.
    bg.addChild(new Sprite({ pos: { x: 230, y: 700 }, z: -5, shape: { kind: 'circle', radius: 220 }, fill: withAlpha(REGALIA.gold, 0.05) }));
    bg.addChild(new Sprite({ pos: { x: 230, y: 700 }, z: -5, shape: { kind: 'circle', radius: 120 }, fill: withAlpha(REGALIA.gold, 0.05) }));
    // The lantern's beacon — a soft focal halo, brightest destination on screen.
    for (const [r, a] of [[210, 0.05], [140, 0.06], [78, 0.08]] as const) {
      bg.addChild(new Sprite({ pos: { x: GOAL_POINT.x, y: GOAL_POINT.y }, z: -4, shape: { kind: 'circle', radius: r }, fill: withAlpha(REGALIA.mist, a) }));
    }
    // Embers rising on a slow updraft — atmosphere and parallax life.
    bg.addChild(
      new AmbientField({
        name: 'motes',
        z: -3,
        seed: 5,
        width: W,
        height: H,
        count: 46,
        style: {
          colors: [withAlpha(REGALIA.gold, 0.5), withAlpha(REGALIA.mist, 0.4), withAlpha(REGALIA.blue, 0.4)],
          sizeMin: 1,
          sizeMax: 2.4,
          fallY: -13, // drift UP, like embers on warm air
          swayAmp: 16,
          swayFreq: 0.12,
        },
      }),
    );
    this.stage.addChild(bg);
  }

  // Static shaft: solids, one-way ledges, thorns.
  private buildScenery(): void {
    const layer = new Node({ name: 'scenery' });
    layer.cosmetic = true;
    const rows = LEVEL.rows;
    for (let ty = 0; ty < rows.length; ty++) {
      for (let tx = 0; tx < rows[ty].length; tx++) {
        const ch = rows[ty][tx];
        const cx = (tx + 0.5) * TILE;
        const cy = (ty + 0.5) * TILE;
        if (ch === '#') {
          layer.addChild(new Sprite({ pos: { x: cx, y: cy }, z: 0, shape: { kind: 'rect', w: TILE, h: TILE, r: 3 }, fill: REGALIA.night, stroke: REGALIA.darkLine, strokeWidth: 1 }));
        } else if (ch === '-') {
          layer.addChild(new Sprite({ pos: { x: cx, y: cy - TILE / 2 + 5 }, z: 1, shape: { kind: 'rect', w: TILE - 2, h: 10, r: 4 }, fill: REGALIA.shade, stroke: withAlpha(REGALIA.gold, 0.5), strokeWidth: 1.5 }));
        } else if (ch === '^') {
          // A little thorn triangle — hazard, distinct rose silhouette.
          layer.addChild(new Sprite({ pos: { x: cx, y: cy + 6 }, z: 1, shape: { kind: 'poly', points: [-12, 12, 0, -14, 12, 12] }, fill: REGALIA.rose, stroke: REGALIA.paperInk, strokeWidth: 1.5 }));
        }
      }
    }
    this.stage.addChild(layer);
  }

  private buildEmbers(): void {
    const layer = new Node({ name: 'embers' });
    layer.cosmetic = true;
    for (const p of EMBER_POINTS) {
      const halo = new Sprite({ pos: { x: p.x, y: p.y }, z: 2, shape: { kind: 'circle', radius: 13 }, fill: withAlpha(REGALIA.gold, 0.22) });
      const dot = new Sprite({ pos: { x: p.x, y: p.y }, z: 3, shape: { kind: 'circle', radius: 6 }, fill: REGALIA.gold, stroke: REGALIA.paperInk, strokeWidth: 1.5 });
      layer.addChild(halo);
      layer.addChild(dot);
      this.emberNodes.push(dot);
      this.emberNodes.push(halo);
    }
    this.stage.addChild(layer);
  }

  private buildGoal(): void {
    // The lantern: a pale, lit destination — distinct from the gold flame/embers.
    this.goalGlow = new Sprite({ pos: { x: GOAL_POINT.x, y: GOAL_POINT.y }, z: 2, shape: { kind: 'circle', radius: 24 }, fill: withAlpha(REGALIA.mist, 0.28) });
    this.stage.addChild(this.goalGlow);
    this.stage.addChild(new Sprite({ pos: { x: GOAL_POINT.x, y: GOAL_POINT.y }, z: 3, shape: { kind: 'rect', w: 22, h: 30, r: 6 }, fill: REGALIA.mist, stroke: REGALIA.gold, strokeWidth: 2.5 }));
    this.stage.addChild(new Sprite({ pos: { x: GOAL_POINT.x, y: GOAL_POINT.y - 20 }, z: 3, shape: { kind: 'rect', w: 6, h: 8, r: 2 }, fill: REGALIA.gold }));
  }

  private buildFlame(): void {
    this.glow = new Sprite({ z: 4, shape: { kind: 'circle', radius: 22 }, fill: withAlpha(REGALIA.gold, 0.22) });
    this.body = new Sprite({ z: 5, shape: { kind: 'circle', radius: 13 }, fill: REGALIA.gold, stroke: REGALIA.paperInk, strokeWidth: 2 });
    this.core = new Sprite({ z: 6, shape: { kind: 'circle', radius: 6 }, fill: REGALIA.mist });
    this.flame.addChild(this.glow);
    this.flame.addChild(this.body);
    this.flame.addChild(this.core);
    this.flame.cosmetic = true;
    this.stage.addChild(this.flame);
  }

  private buildHud(): void {
    const hud = new Node({ name: 'hud' });
    hud.cosmetic = true;
    const gx = W / 2 - 110;
    const gy = 30;
    hud.addChild(new Sprite({ pos: { x: W / 2, y: gy }, z: 20, shape: { kind: 'rect', w: 228, h: 16, r: 8 }, fill: REGALIA.night, stroke: REGALIA.darkLine, strokeWidth: 1 }));
    this.gaugeFill = new Sprite({ pos: { x: gx + 2, y: gy }, z: 21, shape: { kind: 'rect', w: 216, h: 10, r: 5, anchor: 'topLeft' }, fill: REGALIA.gold });
    // Anchor the fill bar from its left edge so it shrinks rightward.
    this.gaugeFill.pos = { x: gx + 2, y: gy - 5 };
    hud.addChild(this.gaugeFill);
    hud.addChild(new Text({ text: 'fuel', pos: { x: gx - 26, y: gy + 5 }, size: 16, align: 'center', fill: REGALIA.softInk }));
    hud.addChild(new Text({ text: 'hold  ↑ / Z / Space  to rise   ·   ← →  drift   ·   R  restart', pos: { x: W / 2, y: H - 30 }, size: 20, align: 'center', fill: REGALIA.softInk }));
    this.stage.addChild(hud);
  }

  private syncFlame(): void {
    const cx = this.sim.x + this.cfg.width / 2;
    const cy = this.sim.y + this.cfg.height / 2;
    this.flame.pos = { x: cx, y: cy };
  }

  private updateGauge(): void {
    const frac = Math.max(0, Math.min(1, this.sim.fuel / this.cfg.fuelMax));
    this.gaugeFill.shape = { kind: 'rect', w: Math.max(0.001, 216 * frac), h: 10, r: 5, anchor: 'topLeft' };
    const low = this.sim.fuel < this.cfg.warnBand;
    this.gaugeFill.paint.fill = low ? REGALIA.rose : REGALIA.gold;
  }

  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const w = this.world as World;
    const input = w.input;

    if (input.justPressed('restart')) {
      this.restart();
      return;
    }
    if (this.sim.won) return;

    const moveX = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    const ev = stepFlame(
      this.sim,
      { moveX, thrustHeld: input.isDown('thrust'), thrustPressed: input.justPressed('thrust') },
      dt,
      MAP,
      this.cfg,
      EMBER_POINTS,
      GOAL_POINT,
    );

    this.syncFlame();
    this.updateGauge();

    // Living flame: gentle breathing glow + a rising trail while burning.
    this.glowPhase += dt;
    const breathe = 20 + dsin(this.glowPhase * 6) * 2;
    this.glow.shape = { kind: 'circle', radius: ev.thrusting ? breathe + 6 : breathe };
    if (ev.thrusting) this.trail.burst(1, { x: this.flame.pos.x, y: this.flame.pos.y + 10 }, trailStyle);

    // Answer every event on ≥2 senses (see FEEDBACK).
    if (ev.popped) audio.tone({ freq: 540, duration: 0.09, type: 'sine', gain: 0.16 });
    if (ev.thrusting && w.frame % 6 === 0) audio.tone({ freq: 210, duration: 0.05, type: 'triangle', gain: 0.05 });
    if (ev.landed) {
      audio.tone({ freq: 160, duration: 0.08, type: 'sine', gain: 0.14 });
      this.burst.burst(8, { x: this.flame.pos.x, y: this.sim.y + this.cfg.height }, landStyle);
    }
    if (ev.refueled) {
      audio.tone({ freq: 720, duration: 0.12, type: 'sine', gain: 0.16 });
      audio.tone({ freq: 960, duration: 0.12, type: 'sine', gain: 0.1, delay: 0.05 });
      const dot = this.emberNodes[ev.emberIndex * 2];
      if (dot) {
        this.burst.burst(10, dot.pos, emberStyle);
        dot.visible = false;
        const halo = this.emberNodes[ev.emberIndex * 2 + 1];
        if (halo) halo.visible = false;
      }
    }
    if (ev.died) this.onDeath();
    if (ev.reachedGoal) this.onWin();
  }

  private onDeath(): void {
    audio.tone({ freq: 300, duration: 0.16, type: 'triangle', gain: 0.14 });
    audio.tone({ freq: 150, duration: 0.22, type: 'sine', gain: 0.12, delay: 0.04 });
    this.burst.burst(16, this.flame.pos, deathStyle);
    this.stage.addTrauma(0.25);
    // Death is free: instant, momentum-clean respawn at the hearth.
    this.sim = spawnState(this.cfg);
    this.resyncEmbers();
    this.syncFlame();
    this.updateGauge();
  }

  private onWin(): void {
    if (this.won) return;
    this.won = true;
    const fuel = this.sim.fuel;
    const medal = medalFor(fuel);
    audio.tone({ freq: 660, duration: 0.14, type: 'sine', gain: 0.16 });
    audio.tone({ freq: 880, duration: 0.16, type: 'sine', gain: 0.14, delay: 0.09 });
    audio.tone({ freq: 1320, duration: 0.22, type: 'sine', gain: 0.12, delay: 0.19 });
    this.burst.burst(26, { x: GOAL_POINT.x, y: GOAL_POINT.y }, emberStyle);
    const glyph = medal === 'gold' ? '✦' : medal === 'silver' ? '✧' : '·';
    showScreen({
      title: `${glyph}  You reached the lantern`,
      body: `Fuel left: ${Math.round(fuel * 100)}%  —  ${medal} flight.<br/>Feather a cleaner line to keep more of the flame.`,
      dim: true,
      actions: [{ label: 'Fly again', primary: true, onSelect: () => this.restart() }],
    });
  }

  restart(): void {
    this.won = false;
    hideScreen();
    this.sim = spawnState(this.cfg);
    this.resyncEmbers();
    this.syncFlame();
    this.updateGauge();
  }

  private resyncEmbers(): void {
    for (const n of this.emberNodes) n.visible = true;
  }

  // Only `sim` is canonical; everything else is derived view.
  protected override serializeProps(): Record<string, unknown> {
    return { sim: this.sim, won: this.won };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (props.sim) {
      this.sim = props.sim as FlameState;
      this.won = !!props.won;
      this.resyncEmbers();
      for (let i = 0; i < this.sim.emberTaken.length; i++) {
        if (this.sim.emberTaken[i]) {
          const dot = this.emberNodes[i * 2];
          const halo = this.emberNodes[i * 2 + 1];
          if (dot) dot.visible = false;
          if (halo) halo.visible = false;
        }
      }
      this.syncFlame();
      this.updateGauge();
    }
  }
}

registerNode('FlameView', () => new FlameView());

export function makeFlameRoot(): FlameView {
  return new FlameView({ name: 'flame-game' });
}

// ── The feedback contract + declarative feel spec (gated by `npm run feel`) ──
export const FEEDBACK: FeedbackContract = {
  pop: { channels: ['audio', 'visual'] },
  thrust: { channels: ['audio', 'visual'] },
  land: { channels: ['audio', 'visual'] },
  refuel: { channels: ['audio', 'visual'] },
  death: { channels: ['audio', 'visual'], shake: 0.25 },
  win: { channels: ['audio', 'visual'] },
};

export const FEEDBACK_EVENTS = ['pop', 'thrust', 'land', 'refuel', 'death', 'win'] as const;

export const feel: FeelSpec = {
  avatarFill: REGALIA.gold,
  background: REGALIA_NIGHT.bg,
  forgiveness: {
    coyoteTime: DEFAULT_FLAME.coyoteTime,
    jumpBuffer: DEFAULT_FLAME.thrustBuffer,
    jumpCornerNudge: DEFAULT_FLAME.cornerNudge,
  },
  feedback: { contract: FEEDBACK, events: FEEDBACK_EVENTS },
  scrolls: false,
};

export const smallFlameGame = defineGame({
  title: 'Small Flame',
  width: W,
  height: H,
  background: REGALIA_NIGHT.bg,
  inputMap: {
    thrust: ['Space', 'ArrowUp', 'KeyW', 'KeyZ'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    restart: ['KeyR'],
  },
  build: () => makeFlameRoot(),
  probe: (world) => {
    const view = world.root.find('flame-game') as FlameView | null;
    const s = view?.sim;
    return {
      frame: world.frame,
      hash: world.hash(),
      x: s ? Math.round(s.x) : 0,
      y: s ? Math.round(s.y) : 0,
      fuel: s ? Math.round(s.fuel * 1000) / 1000 : 0,
      onGround: s?.onGround ?? false,
      won: s?.won ?? false,
      dead: s?.dead ?? false,
    };
  },
});

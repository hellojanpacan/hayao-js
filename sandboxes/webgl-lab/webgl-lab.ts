// webgl-lab — stress-test for WebGL2Renderer.
// Exercises every DrawCommand type (rect, circle, poly, path, text),
// gradients, shadows, opacity, and high entity counts on a scene designed
// to look good through any post-processing effect.
// Knobs: X = cycle effect, ↑/↓ = adjust param, SPACE = particle burst, U = entity storm.

import {
  Node,
  Sprite,
  Text,
  Particles,
  PARTICLE_PRESETS,
  REGALIA,
  REGALIA_DAY,
  linearGradient,
  glow,
  registerNode,
  defineGame,
  type World,
} from '@hayao';

// ── Layout ────────────────────────────────────────────────────────────────────

const W = 1280;
const H = 720;
const CX = W / 2;
const CY = H / 2;

// ── Effect descriptors (exported so main.ts can reference them) ───────────────

export interface EffectDef {
  label: string;
  mode: 'passthrough' | 'vignette' | 'pixelate' | 'crt' | 'chroma' | 'hue' | 'wave' | 'bloom';
  uniform: string | null;
  paramMin: number;
  paramMax: number;
  paramDefault: number;
  paramLabel: string;
}

export const EFFECTS: EffectDef[] = [
  { label: 'Passthrough',        mode: 'passthrough', uniform: null,               paramMin: 0,      paramMax: 1,     paramDefault: 0,     paramLabel: '—'          },
  { label: 'Vignette',           mode: 'vignette',    uniform: 'u_vignette',       paramMin: 0.05,   paramMax: 1.2,   paramDefault: 0.4,   paramLabel: 'strength'   },
  { label: 'Pixelate',           mode: 'pixelate',    uniform: 'u_block',          paramMin: 2,      paramMax: 24,    paramDefault: 4,     paramLabel: 'block px'   },
  { label: 'CRT',                mode: 'crt',         uniform: 'u_crt_warp',       paramMin: 0,      paramMax: 0.18,  paramDefault: 0.08,  paramLabel: 'barrel warp'},
  { label: 'Chromatic Aberr.',   mode: 'chroma',      uniform: 'u_aberration',     paramMin: 0,      paramMax: 0.015, paramDefault: 0.004, paramLabel: 'offset'     },
  { label: 'Hue Rotate',         mode: 'hue',         uniform: 'u_hue_shift',      paramMin: 0,      paramMax: 6.28,  paramDefault: 0,     paramLabel: 'angle (0=time-driven)' },
  { label: 'Wave',               mode: 'wave',        uniform: 'u_wave_amp',       paramMin: 0,      paramMax: 0.012, paramDefault: 0.003, paramLabel: 'amplitude'  },
  { label: 'Bloom (4-pass)',      mode: 'bloom',       uniform: 'u_bloom_intensity',paramMin: 0,      paramMax: 2.5,   paramDefault: 0.9,   paramLabel: 'intensity'  },
];

// ── Tile fills (dark dungeon palette for rich effect contrast) ─────────────────

const TILE_FILLS = [
  '#1a1a2e','#16213e','#0f3460','#1e2a4a',
  '#2d1b4e','#1a2a1a','#2a1a1a','#1a2a2a',
  '#0d1b2a','#1b2838','#2a2012','#1a1a1a',
];

// ── Geometry helpers ──────────────────────────────────────────────────────────

function starPoints(cx: number, cy: number, r: number, r2: number, n: number): number[] {
  const pts: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r2;
    pts.push(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
  }
  return pts;
}

function hexPoints(cx: number, cy: number, r: number): number[] {
  const pts: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return pts;
}

// ── State ─────────────────────────────────────────────────────────────────────

export interface LabState {
  effectIdx: number;
  param: number;
  storm: boolean;
}

// ── Lab node ──────────────────────────────────────────────────────────────────

class WebGLLab extends Node {
  override readonly type = 'WebGLLab';

  effectIdx = 0;
  param = EFFECTS[0].paramDefault;
  storm = false;

  private cosmLayer = new Node({ name: 'scene' });
  private hudLayer  = new Node({ name: 'hud' });
  private particles!: Particles;
  private spinner!: Sprite;
  private orbA!: Sprite;
  private orbB!: Sprite;
  private orbC!: Sprite;
  private stormSprites: Sprite[] = [];
  private hudMain!: Text;
  private hudSub!: Text;

  protected override onReady(): void {
    this.cosmLayer.cosmetic = true;
    this.hudLayer.cosmetic  = true;
    this.addChild(this.cosmLayer);
    this.addChild(this.hudLayer);
    this.buildBackground();
    this.buildScene();
    this.buildHud();
    this.syncState();
  }

  // ── Background: tile grid ────────────────────────────────────────────────

  private buildBackground(): void {
    const COLS = 10, ROWS = 6;
    const TW = W / COLS, TH = H / ROWS;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const fill = TILE_FILLS[(row * COLS + col) % TILE_FILLS.length];
        const accent = (row + col) % 3 === 0;
        this.cosmLayer.addChild(new Sprite({
          pos: { x: col * TW + TW / 2, y: row * TH + TH / 2 }, z: 0,
          shape: { kind: 'rect', w: TW - 2, h: TH - 2, r: 4 },
          fill, stroke: accent ? REGALIA.blue : '#1e1e2a',
          strokeWidth: accent ? 1.5 : 0.5,
        }));
        if (accent) {
          this.cosmLayer.addChild(new Sprite({
            pos: { x: col * TW + TW / 2, y: row * TH + TH / 2 }, z: 1,
            shape: { kind: 'circle', radius: TW * 0.08 },
            fill: REGALIA.blue, opacity: 0.3,
          }));
        }
      }
    }
  }

  // ── Scene: all DrawCommand types ─────────────────────────────────────────

  private buildScene(): void {
    const L = this.cosmLayer;

    // Gradient rect — central stage panel.
    L.addChild(new Sprite({
      pos: { x: CX, y: CY }, z: 2,
      shape: { kind: 'rect', w: 660, h: 380, r: 16 },
      gradient: linearGradient([REGALIA.ink + 'cc', '#0a0a1aee'], 180),
      stroke: REGALIA.blue, strokeWidth: 2, opacity: 0.88,
    }));

    // Poly: hexagonal ring.
    L.addChild(new Sprite({
      pos: { x: CX, y: CY }, z: 3,
      shape: { kind: 'poly', points: hexPoints(0, 0, 160), closed: true },
      fill: 'none', stroke: REGALIA.blue, strokeWidth: 1.5, opacity: 0.5,
    }));

    // Poly: spinning star (ref kept for animation).
    this.spinner = new Sprite({
      name: 'spinner',
      pos: { x: CX, y: CY }, z: 4,
      shape: { kind: 'poly', points: starPoints(0, 0, 80, 35, 8), closed: true },
      gradient: linearGradient([REGALIA.blue, REGALIA.paper], 45),
      stroke: REGALIA.paper, strokeWidth: 1,
      shadow: glow(REGALIA.blue, 18),
    });
    L.addChild(this.spinner);

    // Circle: glowing central orb.
    L.addChild(new Sprite({
      pos: { x: CX, y: CY }, z: 5,
      shape: { kind: 'circle', radius: 28 },
      fill: REGALIA.paper, stroke: REGALIA.blue, strokeWidth: 3,
      shadow: glow(REGALIA.blue, 24),
    }));

    // Path: decorative quarter arcs (SVG d — the path DrawCommand type).
    L.addChild(new Sprite({ pos: { x: CX, y: CY }, z: 3,
      shape: { kind: 'path', d: 'M -220 0 A 220 220 0 0 1 0 -220' },
      fill: 'none', stroke: REGALIA.gold, strokeWidth: 2, opacity: 0.45, round: true }));
    L.addChild(new Sprite({ pos: { x: CX, y: CY }, z: 3,
      shape: { kind: 'path', d: 'M 220 0 A 220 220 0 0 1 0 220' },
      fill: 'none', stroke: REGALIA.rose, strokeWidth: 2, opacity: 0.45, round: true }));
    L.addChild(new Sprite({ pos: { x: CX, y: CY }, z: 3,
      shape: { kind: 'path', d: 'M -220 0 A 220 220 0 0 0 0 220' },
      fill: 'none', stroke: REGALIA.green, strokeWidth: 2, opacity: 0.35, round: true }));

    // Circles: three orbiting orbs.
    const orbStyle = { z: 6, shape: { kind: 'circle' as const, radius: 14 } };
    this.orbA = new Sprite({ name: 'orbA', pos: { x: CX+140, y: CY }, ...orbStyle,
      fill: REGALIA_DAY.ramp[2], stroke: REGALIA.paper, strokeWidth: 2, shadow: glow(REGALIA_DAY.ramp[2], 12) });
    this.orbB = new Sprite({ name: 'orbB', pos: { x: CX, y: CY-140 }, ...orbStyle,
      fill: REGALIA.rose, stroke: REGALIA.paper, strokeWidth: 2, shadow: glow(REGALIA.rose, 12) });
    this.orbC = new Sprite({ name: 'orbC', pos: { x: CX-140, y: CY }, ...orbStyle,
      fill: REGALIA.gold, stroke: REGALIA.paper, strokeWidth: 2, shadow: glow(REGALIA.gold, 12) });
    L.addChild(this.orbA);
    L.addChild(this.orbB);
    L.addChild(this.orbC);

    // Poly: corner diamond accents.
    const diamond = (x: number, y: number, r: number, fill: string) =>
      new Sprite({ pos: { x, y }, z: 6,
        shape: { kind: 'poly', points: [0,-r, r,0, 0,r, -r,0], closed: true },
        fill, stroke: REGALIA.paper, strokeWidth: 1, opacity: 0.7 });
    L.addChild(diamond(120,   80,   22, REGALIA.blue));
    L.addChild(diamond(W-120, 80,   22, REGALIA.rose));
    L.addChild(diamond(120,   H-80, 22, REGALIA.gold));
    L.addChild(diamond(W-120, H-80, 22, REGALIA_DAY.ramp[2]));

    // Text: title (in-world Text command).
    L.addChild(new Text({ text: 'WebGL Lab', pos: { x: CX, y: CY-168 }, z: 7,
      size: 36, weight: 700, align: 'center',
      fill: REGALIA.paper, stroke: REGALIA.ink, strokeWidth: 3 }));
    L.addChild(new Text({ text: 'hayao.js · WebGL2 post-processing', pos: { x: CX, y: CY-128 }, z: 7,
      size: 16, align: 'center', fill: REGALIA.blue, opacity: 0.85 }));

    // Text: DrawCommand type legend (bottom-left) — proves text at small sizes.
    const legend = ['rect','circle','poly','path','gradient','shadow','opacity'];
    legend.forEach((s, i) =>
      L.addChild(new Text({ text: s, pos: { x: 38, y: 24 + i * 18 }, z: 7,
        size: 12, fill: REGALIA.blue, opacity: 0.5 })));

    // Particles system.
    this.particles = new Particles({ name: 'fx', seed: 42, z: 10, maxParticles: 700 });
    this.particles.cosmetic = true;
    L.addChild(this.particles);

    // Entity storm: 240 small circles arranged in rings, toggled via storm flag.
    for (let i = 0; i < 240; i++) {
      const angle = (i / 240) * Math.PI * 2;
      const ring = i % 5;
      const r = 90 + ring * 38;
      const s = new Sprite({
        name: `storm-${i}`,
        pos: { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r }, z: 8,
        shape: { kind: 'circle', radius: 4 },
        fill: TILE_FILLS[i % TILE_FILLS.length],
        stroke: REGALIA.blue, strokeWidth: 0.5,
        opacity: 0,
      });
      this.stormSprites.push(s);
      L.addChild(s);
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  private buildHud(): void {
    const HL = this.hudLayer;
    // Bottom scrim.
    HL.addChild(new Sprite({ pos: { x: CX, y: H - 40 }, z: 20,
      shape: { kind: 'rect', w: W, h: 80 }, fill: '#00000099' }));
    this.hudMain = new Text({ name: 'hudMain', pos: { x: CX, y: H - 54 }, z: 21,
      size: 20, weight: 700, align: 'center', fill: REGALIA.paper, text: '' });
    this.hudSub = new Text({ name: 'hudSub',  pos: { x: CX, y: H - 28 }, z: 21,
      size: 14, align: 'center', fill: REGALIA.blue, text: '' });
    HL.addChild(this.hudMain);
    HL.addChild(this.hudSub);
    // Controls legend (right side).
    HL.addChild(new Text({
      text: 'X: effect   ↑↓: param   SPACE: burst   U: storm',
      pos: { x: W - 18, y: H - 54 }, z: 21,
      size: 13, align: 'right', fill: REGALIA.blue, opacity: 0.7 }));
  }

  // ── Logic ─────────────────────────────────────────────────────────────────

  protected override onProcess(): void {
    if (!this.world) return;
    const w = this.world as World;
    const input = w.input;

    if (input.justPressed('action')) {
      this.effectIdx = (this.effectIdx + 1) % EFFECTS.length;
      this.param = EFFECTS[this.effectIdx].paramDefault;
    }

    const eff = EFFECTS[this.effectIdx];
    const step = (eff.paramMax - eff.paramMin) / 30;
    if (input.isDown('up'))   this.param = Math.min(eff.paramMax, this.param + step);
    if (input.isDown('down')) this.param = Math.max(eff.paramMin, this.param - step);

    if (input.justPressed('confirm')) {
      this.particles.burst(80, { x: CX, y: CY },
        PARTICLE_PRESETS.burst([REGALIA.blue, REGALIA.paper, REGALIA_DAY.ramp[2], REGALIA.gold]));
    }
    if (input.justPressed('undo')) this.storm = !this.storm;

    this.animateScene(w.frame);
    this.syncState();
  }

  private animateScene(frame: number): void {
    // Deterministic spin via fixed frame clock.
    const a = (frame * 0.008) % (Math.PI * 2);
    const pts = starPoints(
      Math.cos(a * 0.5) * 5, Math.sin(a * 0.7) * 5, 80, 35, 8
    );
    (this.spinner.shape as { points: number[] }).points = pts;

    // Orbit three orbs.
    const sp = 0.012;
    this.orbA.pos.x = CX + Math.cos(frame * sp)        * 145;
    this.orbA.pos.y = CY + Math.sin(frame * sp)        * 62;
    this.orbB.pos.x = CX + Math.cos(frame * sp + 2.09) * 145;
    this.orbB.pos.y = CY + Math.sin(frame * sp + 2.09) * 62;
    this.orbC.pos.x = CX + Math.cos(frame * sp + 4.19) * 145;
    this.orbC.pos.y = CY + Math.sin(frame * sp + 4.19) * 62;

    // Storm entity visibility (paint.opacity).
    const stormOpacity = this.storm ? 0.8 : 0;
    for (const s of this.stormSprites) s.paint.opacity = stormOpacity;

    // HUD text.
    const eff = EFFECTS[this.effectIdx];
    const n = this.effectIdx + 1;
    this.hudMain.text = `Effect ${n}/${EFFECTS.length}: ${eff.label}${this.storm ? '   [storm: ON — 240 entities]' : ''}`;
    if (eff.uniform && eff.paramLabel !== '—') {
      this.hudSub.text = `${eff.paramLabel}: ${this.param.toFixed(4)}   (↑/↓ to adjust)`;
    } else if (eff.mode === 'crt' || eff.mode === 'hue') {
      this.hudSub.text = 'animated by u_time  (↑/↓ adjusts warp/angle)';
    } else {
      this.hudSub.text = '';
    }
  }

  private syncState(): void {
    if (!this.world) return;
    const s = (this.world as World).state as unknown as LabState;
    s.effectIdx = this.effectIdx;
    s.param     = this.param;
    s.storm     = this.storm;
  }

  protected override serializeProps(): Record<string, unknown> {
    return { effectIdx: this.effectIdx, param: this.param, storm: this.storm };
  }
  override applyProps(p: Record<string, unknown>): void {
    if (typeof p.effectIdx === 'number') this.effectIdx = p.effectIdx;
    if (typeof p.param     === 'number') this.param     = p.param;
    if (typeof p.storm     === 'boolean') this.storm    = p.storm;
  }
}

registerNode('WebGLLab', () => new WebGLLab());

// ── Game definition ───────────────────────────────────────────────────────────

export const webglLabGame = defineGame({
  title: 'WebGL Lab',
  width: W,
  height: H,
  background: '#0e0e14',
  inputMap: {
    up:      ['ArrowUp',    'KeyW'],
    down:    ['ArrowDown',  'KeyS'],
    confirm: ['Space'],
    action:  ['KeyX'],
    cancel:  ['Escape'],
    undo:    ['KeyU'],
  },
  build(world): Node {
    world.state['effectIdx'] = 0;
    world.state['param'] = 0;
    world.state['storm'] = false;
    const root = new Node({ name: 'webgl-lab' });
    root.addChild(new WebGLLab({ name: 'lab' }));
    return root;
  },
  probe(world) {
    const s = (world.state as unknown) as LabState;
    return {
      ...world.probe(),
      effectIdx: s.effectIdx,
      param:     s.param,
      storm:     s.storm,
    };
  },
});

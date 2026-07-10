// juice-lab — one primitive: EASINGS (the deterministic easing curves).
// Every curve is plotted at once with a marker sweeping along it, so you can SEE
// the character of each ease. Knobs: up/down = sweep duration, Z = pause.
// No genre, no win state — just the primitive, exposed. See sandboxes/README.md.

import {
  Node,
  Sprite,
  Text,
  EASINGS,
  REGALIA,
  REGALIA_DAY,
  registerNode,
  defineGame,
  type World,
} from '@hayao';

const NAMES = Object.keys(EASINGS);
const COLS = 4;
const CELL_W = 300;
const CELL_H = 150;
const PLOT_W = 220;
const PLOT_H = 108;
const SAMPLES = 28;

class JuiceLab extends Node {
  override readonly type = 'JuiceLab';
  // Canonical knob state (hashed): the sweep phase, its speed, paused flag.
  phase = 0;
  duration = 1.6;
  paused = false;
  private layer = new Node({ name: 'layer' });
  private markers: Sprite[] = [];
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true; // pure view — only this node's props are canonical
    this.addChild(this.layer);
    this.buildStatic();
  }

  private cellOrigin(i: number) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return { x: 70 + col * CELL_W, y: 118 + row * CELL_H };
  }

  private plot(i: number, t: number) {
    const { x, y } = this.cellOrigin(i);
    const v = EASINGS[NAMES[i]](t);
    return { px: x + t * PLOT_W, py: y + PLOT_H - v * PLOT_H };
  }

  private buildStatic(): void {
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    this.markers = [];
    for (let i = 0; i < NAMES.length; i++) {
      const { x, y } = this.cellOrigin(i);
      // plot frame
      this.layer.addChild(
        new Sprite({ pos: { x: x + PLOT_W / 2, y: y + PLOT_H / 2 }, z: 0, shape: { kind: 'rect', w: PLOT_W, h: PLOT_H, r: 6 }, fill: REGALIA.paper, stroke: REGALIA_DAY.line, strokeWidth: 1 }),
      );
      // sampled curve
      const pts: number[] = [];
      for (let s = 0; s <= SAMPLES; s++) {
        const { px, py } = this.plot(i, s / SAMPLES);
        pts.push(px, py);
      }
      this.layer.addChild(
        new Sprite({ pos: { x: 0, y: 0 }, z: 1, shape: { kind: 'poly', points: pts, closed: false }, fill: 'none', stroke: REGALIA_DAY.accent, strokeWidth: 2 }),
      );
      // moving marker
      const p0 = this.plot(i, 0);
      const m = new Sprite({ pos: { x: p0.px, y: p0.py }, z: 2, shape: { kind: 'circle', radius: 6 }, fill: REGALIA_DAY.good, stroke: REGALIA.ink, strokeWidth: 2 });
      this.markers.push(m);
      this.layer.addChild(m);
      // label
      this.layer.addChild(
        new Text({ text: NAMES[i], pos: { x, y: y - 10 }, size: 18, align: 'left', fill: REGALIA_DAY.inkSoft }),
      );
    }
    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 44 }, size: 22, align: 'center', fill: REGALIA_DAY.inkSoft, text: '' });
    this.layer.addChild(this.hud);
    this.refreshHud();
  }

  private refreshHud(): void {
    this.hud.text = `EASINGS · ${NAMES.length} curves   ·   sweep ${this.duration.toFixed(1)}s   ·   ${this.paused ? 'PAUSED' : 'playing'}   ·   ↑↓ speed, Z pause`;
  }

  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const input = (this.world as World).input;
    let changed = false;
    if (input.justPressed('up')) { this.duration = Math.max(0.4, this.duration - 0.2); changed = true; }
    if (input.justPressed('down')) { this.duration = Math.min(4, this.duration + 0.2); changed = true; }
    if (input.justPressed('action') || input.justPressed('confirm')) { this.paused = !this.paused; changed = true; }
    if (changed) this.refreshHud();

    if (!this.paused) {
      this.phase += dt / this.duration;
      while (this.phase >= 1) this.phase -= 1;
    }
    for (let i = 0; i < this.markers.length; i++) {
      const { px, py } = this.plot(i, this.phase);
      this.markers[i].pos = { x: px, y: py };
    }
  }

  protected override serializeProps(): Record<string, unknown> {
    return { phase: this.phase, duration: this.duration, paused: this.paused };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.phase === 'number') this.phase = props.phase;
    if (typeof props.duration === 'number') this.duration = props.duration;
    if (typeof props.paused === 'boolean') this.paused = props.paused;
  }
}

registerNode('JuiceLab', () => new JuiceLab());

export const juiceLabGame = defineGame({
  title: 'Juice Lab',
  width: 1280,
  height: 720,
  background: REGALIA_DAY.bg,
  build: () => new JuiceLab({ name: 'juice-lab' }),
  probe: (world) => {
    const lab = world.root.find('juice-lab') as JuiceLab | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      curves: NAMES.length,
      duration: lab?.duration ?? 0,
      phase: lab ? Number(lab.phase.toFixed(3)) : 0,
      paused: lab?.paused ?? false,
    };
  },
});

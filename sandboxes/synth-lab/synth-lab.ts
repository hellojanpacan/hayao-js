// synth-lab — one primitive: the procedural audio bus (audio.tone, zzfx-style
// synthesis, no sound files). SPACE plays the current tone. Knobs: ↑↓ = pitch,
// X = waveform, ←→ = envelope length. The plotted waveform previews the shape.
// Audio is browser-only (silent in Node by construction). No genre.
// See sandboxes/README.md.

import {
  Node,
  Sprite,
  Text,
  Rng,
  audio,
  REGALIA,
  REGALIA_DAY,
  registerNode,
  defineGame,
  type World,
} from '@hayao';

const WAVES = ['sine', 'triangle', 'saw', 'square', 'noise'] as const;
type Wave = (typeof WAVES)[number];
const PLOT = { x0: 320, x1: 960, y: 380, amp: 120, n: 200 };
const NOISE = (() => {
  const r = new Rng(11);
  return Array.from({ length: PLOT.n + 1 }, () => r.range(-1, 1));
})();

class SynthLab extends Node {
  override readonly type = 'SynthLab';
  freq = 330;
  waveIdx = 0;
  env = 0.28; // decay + release length (s)
  private layer = new Node({ name: 'layer' });
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 44 }, size: 22, align: 'center', fill: REGALIA_DAY.inkSoft, text: '' });
    this.rebuild();
  }

  private wave(): Wave {
    return WAVES[this.waveIdx];
  }

  private sample(t: number): number {
    const cycles = Math.max(1, Math.min(8, Math.round(this.freq / 110)));
    const p = t * cycles;
    const frac = p - Math.floor(p);
    switch (this.wave()) {
      case 'sine': return Math.sin(p * 2 * Math.PI);
      case 'triangle': return 4 * Math.abs(frac - 0.5) - 1;
      case 'saw': return 2 * frac - 1;
      case 'square': return frac < 0.5 ? 1 : -1;
      case 'noise': return NOISE[Math.round(t * PLOT.n)];
    }
  }

  private rebuild(): void {
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    // baseline
    this.layer.addChild(new Sprite({ pos: { x: (PLOT.x0 + PLOT.x1) / 2, y: PLOT.y }, z: 0, shape: { kind: 'rect', w: PLOT.x1 - PLOT.x0, h: 2 }, fill: REGALIA_DAY.line }));
    const pts: number[] = [];
    for (let i = 0; i <= PLOT.n; i++) {
      const t = i / PLOT.n;
      pts.push(PLOT.x0 + t * (PLOT.x1 - PLOT.x0), PLOT.y - this.sample(t) * PLOT.amp);
    }
    this.layer.addChild(new Sprite({ pos: { x: 0, y: 0 }, z: 1, shape: { kind: 'poly', points: pts, closed: false }, fill: 'none', stroke: REGALIA_DAY.accent, strokeWidth: 2 }));
    // envelope length bar
    const barW = 120 + this.env * 900;
    this.layer.addChild(new Sprite({ pos: { x: PLOT.x0 + barW / 2, y: 560 }, z: 1, shape: { kind: 'rect', w: barW, h: 16, r: 8 }, fill: REGALIA_DAY.good, stroke: REGALIA.ink, strokeWidth: 1 }));
    this.layer.addChild(new Text({ text: 'envelope', pos: { x: PLOT.x0, y: 540 }, size: 16, align: 'left', fill: REGALIA_DAY.inkSoft }));
    this.hud.text = `audio.playSpec · ${this.wave()}   ·   ${this.freq} Hz   ·   env ${this.env.toFixed(2)}s   ·   SPACE play, ↑↓ pitch, X wave, ←→ envelope`;
    this.layer.addChild(this.hud);
  }

  protected override onProcess(): void {
    if (!this.world) return;
    const input = (this.world as World).input;
    let changed = false;
    if (input.justPressed('up')) { this.freq = Math.min(1760, Math.round(this.freq * 1.06)); changed = true; }
    if (input.justPressed('down')) { this.freq = Math.max(80, Math.round(this.freq / 1.06)); changed = true; }
    if (input.justPressed('action') || input.justPressed('action2')) { this.waveIdx = (this.waveIdx + 1) % WAVES.length; changed = true; }
    if (input.justPressed('right')) { this.env = Math.min(1.2, this.env + 0.06); changed = true; }
    if (input.justPressed('left')) { this.env = Math.max(0.06, this.env - 0.06); changed = true; }
    if (input.justPressed('confirm')) this.play();
    if (changed) this.rebuild();
  }

  private play(): void {
    // playSpec drives the data-defined zzfx synth (the same SoundSpec a verify
    // suite can prove headlessly) — richer than the bare-oscillator audio.tone.
    audio.playSpec({ freq: this.freq, wave: this.wave(), attack: 0.01, decay: this.env * 0.6, sustain: 0, release: this.env * 0.4, volume: 0.4 });
  }

  protected override serializeProps(): Record<string, unknown> {
    return { freq: this.freq, waveIdx: this.waveIdx, env: this.env };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.freq === 'number') this.freq = props.freq;
    if (typeof props.waveIdx === 'number') this.waveIdx = props.waveIdx;
    if (typeof props.env === 'number') this.env = props.env;
    this.rebuild();
  }
}

registerNode('SynthLab', () => new SynthLab());

export const synthLabGame = defineGame({
  title: 'Synth Lab',
  width: 1280,
  height: 720,
  background: REGALIA_DAY.bg,
  build: () => new SynthLab({ name: 'synth-lab' }),
  probe: (world) => {
    const lab = world.root.find('synth-lab') as SynthLab | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      freq: lab?.freq ?? 0,
      wave: WAVES[lab?.waveIdx ?? 0],
      env: lab ? Number(lab.env.toFixed(2)) : 0,
    };
  },
});

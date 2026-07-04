// procgen-lab — one primitive: generateCave (seeded cellular-automata caverns).
// SPACE re-rolls the seed; the same seed always re-derives the same cave. Knobs:
// ↑↓ = fill %, X = smoothing passes. The grid is drawn cell-by-cell here; in a
// real game you'd feed it to autotileToCommands for skinned walls. No genre.
// See sandboxes/README.md.

import {
  Node,
  Sprite,
  Text,
  Rng,
  generateCave,
  MEADOW,
  KENTO,
  registerNode,
  defineGame,
  type World,
} from '@hayao';

const COLS = 40;
const ROWS = 22;
const CELL = 28;
const OX = 640 - (COLS * CELL) / 2 + CELL / 2;
const OY = 380 - (ROWS * CELL) / 2 + CELL / 2;

class ProcgenLab extends Node {
  override readonly type = 'ProcgenLab';
  seed = 1;
  fill = 0.45;
  steps = 4;
  solidCount = 0;
  private layer = new Node({ name: 'layer' });
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 40 }, size: 22, align: 'center', fill: MEADOW.inkSoft, text: '' });
    this.rebuild();
  }

  private rebuild(): void {
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    // Deterministic: a seeded Rng, not world.rng, so a given seed is reproducible
    // across re-rolls and machines.
    const grid = generateCave(new Rng(this.seed), { cols: COLS, rows: ROWS, fill: this.fill, steps: this.steps });
    this.solidCount = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const solid = grid.cells[y * COLS + x] === 1;
        if (solid) this.solidCount++;
        this.layer.addChild(
          new Sprite({ pos: { x: OX + x * CELL, y: OY + y * CELL }, z: 0, shape: { kind: 'rect', w: CELL - 2, h: CELL - 2, r: 3 }, fill: solid ? KENTO.sumiSoft : KENTO.gofun, stroke: 'none' }),
        );
      }
    }
    const pct = Math.round((this.solidCount / (COLS * ROWS)) * 100);
    this.hud.text = `generateCave · seed ${this.seed}   ·   fill ${(this.fill * 100) | 0}%   ·   steps ${this.steps}   ·   ${pct}% rock   ·   SPACE re-roll, ↑↓ fill, X steps`;
    this.layer.addChild(this.hud);
  }

  protected override onProcess(): void {
    if (!this.world) return;
    const input = (this.world as World).input;
    let changed = false;
    if (input.justPressed('confirm')) { this.seed++; changed = true; }
    if (input.justPressed('up')) { this.fill = Math.min(0.65, this.fill + 0.03); changed = true; }
    if (input.justPressed('down')) { this.fill = Math.max(0.3, this.fill - 0.03); changed = true; }
    if (input.justPressed('action') || input.justPressed('action2')) { this.steps = this.steps >= 7 ? 1 : this.steps + 1; changed = true; }
    if (changed) this.rebuild();
  }

  protected override serializeProps(): Record<string, unknown> {
    return { seed: this.seed, fill: this.fill, steps: this.steps };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.seed === 'number') this.seed = props.seed;
    if (typeof props.fill === 'number') this.fill = props.fill;
    if (typeof props.steps === 'number') this.steps = props.steps;
    this.rebuild();
  }
}

registerNode('ProcgenLab', () => new ProcgenLab());

export const procgenLabGame = defineGame({
  title: 'Procgen Lab',
  width: 1280,
  height: 720,
  background: MEADOW.bg,
  build: () => new ProcgenLab({ name: 'procgen-lab' }),
  probe: (world) => {
    const lab = world.root.find('procgen-lab') as ProcgenLab | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      seed: lab?.seed ?? 0,
      solid: lab?.solidCount ?? 0,
    };
  },
});

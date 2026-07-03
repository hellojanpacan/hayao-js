// Lumen Forge: the economy (world.state) is the sim; the scene is a night sky
// whose forge visibly intensifies with production. All mutations flow through
// input actions ('forge', 'buy-N') so UI clicks live in the input log.

import { defineGame, Node, Sprite, TAU, type InputMap, type World } from '@hayao';
import { buy, forge, initialEconomy, production, tick, unlockedCount, TIERS, type EconomyState } from './logic';

export const LF_INPUT_MAP: InputMap = {
  forge: ['Space', 'Enter'],
  ...Object.fromEntries(TIERS.map((_, i) => [`buy-${i}`, []])),
};

export function lfState(world: World): EconomyState {
  return world.state.lf as EconomyState;
}

const PAL = { bg: '#0d1026', forge: '#ffc857', forgeCore: '#fff3d6', ember: '#ff9d47', fly: '#c8f7ae', ink: '#8e9bc4' };

class ForgeView extends Node {
  override readonly type = 'ForgeView';
  private glow!: Sprite;
  private core!: Sprite;
  private flies: Sprite[] = [];
  private layer = new Node({ name: 'layer' });

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.glow = this.layer.addChild(new Sprite({ name: 'glow', pos: { x: 640, y: 400 }, z: 1, shape: { kind: 'circle', radius: 90 }, fill: PAL.forge, opacity: 0.16 }));
    this.core = this.layer.addChild(new Sprite({ name: 'core', pos: { x: 640, y: 400 }, z: 3, shape: { kind: 'circle', radius: 42 }, fill: PAL.forge, stroke: PAL.forgeCore, strokeWidth: 4 }));
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = lfState(world);

    // Sim: actions → economy. One fixed step of production.
    if (world.input.justPressed('forge')) forge(s);
    for (let i = 0; i < TIERS.length; i++) if (world.input.justPressed(`buy-${i}`)) buy(s, i);
    tick(s, world.clock.dt);

    // View: pulse with production; fireflies reflect automation breadth.
    const p = production(s);
    const pulse = 1 + Math.min(0.5, Math.log10(1 + p) * 0.12) * (0.9 + 0.1 * Math.sin(world.time * TAU * 0.8));
    this.core.scale = { x: pulse, y: pulse };
    this.glow.scale = { x: pulse * (1 + Math.min(1.6, Math.log10(1 + p) * 0.4)), y: pulse * (1 + Math.min(1.6, Math.log10(1 + p) * 0.4)) };
    const wantFlies = Math.min(36, s.owned.reduce((a, b) => a + b, 0));
    while (this.flies.length < wantFlies) {
      const i = this.flies.length;
      this.flies.push(this.layer.addChild(new Sprite({ name: `fly-${i}`, z: 2, shape: { kind: 'circle', radius: 3 }, fill: i % 3 ? PAL.fly : PAL.ember })));
    }
    this.flies.forEach((f, i) => {
      const r = 120 + (i % 6) * 26;
      const a = world.time * (0.35 + (i % 5) * 0.11) + (i * TAU) / 11;
      f.pos = { x: 640 + Math.cos(a) * r * 1.35, y: 400 + Math.sin(a) * r * 0.72 };
    });
  }
}

export const lumenForgeGame = defineGame({
  title: 'Lumen Forge',
  background: PAL.bg,
  inputMap: LF_INPUT_MAP,
  build(world) {
    world.state.lf = initialEconomy();
    return new ForgeView({ name: 'forge-view' });
  },
  probe(world) {
    const s = lfState(world);
    return { frame: world.frame, time: world.time, motes: s.motes, total: s.total, perSec: production(s), owned: [...s.owned], unlocked: unlockedCount(s), clicks: s.clicks };
  },
});

// particle-studio — one primitive: the Particles emitter + PARTICLE_PRESETS.
// A fountain emits the selected preset on a fixed cadence; SPACE fires a big
// burst. Knobs: X = cycle preset, ↑↓ = burst count. Deterministic (seeded
// emitter, frame-clocked cadence). No genre. See sandboxes/README.md.

import {
  Node,
  Text,
  Particles,
  PARTICLE_PRESETS,
  MEADOW,
  KENTO,
  registerNode,
  defineGame,
  type World,
} from '@hayao';

const PRESETS = ['burst', 'hit', 'dust'] as const;
type PresetName = (typeof PRESETS)[number];
const COLORS = [MEADOW.accent, MEADOW.good, KENTO.kinako ?? '#b9a882'];
const CENTER = { x: 640, y: 430 };

class ParticleStudio extends Node {
  override readonly type = 'ParticleStudio';
  presetIdx = 0;
  count = 14;
  private fx = new Particles({ name: 'fx', seed: 7, z: 5, maxParticles: 900 });
  private hud!: Text;

  protected override onReady(): void {
    this.fx.cosmetic = true;
    this.addChild(this.fx);
    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 44 }, size: 22, align: 'center', fill: MEADOW.inkSoft, text: '' });
    this.hud.cosmetic = true;
    this.addChild(this.hud);
    this.refreshHud();
  }

  private preset(): PresetName {
    return PRESETS[this.presetIdx];
  }

  private refreshHud(): void {
    this.hud.text = `PARTICLES · preset: ${this.preset()}   ·   burst ${this.count}   ·   SPACE big burst, X preset, ↑↓ count`;
  }

  protected override onProcess(): void {
    if (!this.world) return;
    const w = this.world as World;
    const input = w.input;
    if (input.justPressed('action') || input.justPressed('action2')) { this.presetIdx = (this.presetIdx + 1) % PRESETS.length; this.refreshHud(); }
    if (input.justPressed('up')) { this.count = Math.min(80, this.count + 2); this.refreshHud(); }
    if (input.justPressed('down')) { this.count = Math.max(2, this.count - 2); this.refreshHud(); }
    if (input.justPressed('confirm')) this.fx.burst(this.count * 4, CENTER, PARTICLE_PRESETS[this.preset()](COLORS));
    // Fixed-cadence fountain (frame-clocked → deterministic).
    if (w.frame % 8 === 0) this.fx.burst(this.count, CENTER, PARTICLE_PRESETS[this.preset()](COLORS));
  }

  protected override serializeProps(): Record<string, unknown> {
    return { presetIdx: this.presetIdx, count: this.count };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.presetIdx === 'number') this.presetIdx = props.presetIdx;
    if (typeof props.count === 'number') this.count = props.count;
  }
}

registerNode('ParticleStudio', () => new ParticleStudio());

export const particleStudioGame = defineGame({
  title: 'Particle Studio',
  width: 1280,
  height: 720,
  background: MEADOW.bg,
  build: () => new ParticleStudio({ name: 'particle-studio' }),
  probe: (world) => {
    const lab = world.root.find('particle-studio') as ParticleStudio | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      preset: PRESETS[lab?.presetIdx ?? 0],
      count: lab?.count ?? 0,
    };
  },
});

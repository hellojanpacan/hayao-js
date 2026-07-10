// physics-lab — one primitive: the rigid-body world (createRigidWorld + addBody +
// rigidStep). A bin with static walls; press SPACE to drop a body and watch the
// constraint solver stack them. Knobs: X = box/circle, ↑↓ = gravity, R = clear.
// No genre, no win state — just the primitive. See sandboxes/README.md.

import {
  Node,
  Sprite,
  Text,
  createRigidWorld,
  addBody,
  rigidStep,
  polygonBox,
  worldPoints,
  REGALIA_DAY,
  REGALIA,
  registerNode,
  defineGame,
  knob,
  type RigidWorld,
  type World,
} from '@hayao';

const GROUND_Y = 660;

class PhysicsLab extends Node {
  override readonly type = 'PhysicsLab';
  // Canonical knob state (hashed). The RigidWorld itself is a cosmetic demo sim:
  // no verify suite rides on it, so it lives here as view, rebuilt on clear.
  gravity = 900;
  round = true;
  dropped = 0;
  private rw: RigidWorld = createRigidWorld({ gravityY: 900 });
  private layer = new Node({ name: 'layer' });
  private sprites = new Map<number, Sprite>();
  private hud!: Text;

  protected override onReady(): void {
    // Tuning is the initial truth; the ↑↓ keys still nudge gravity live.
    this.gravity = (this.world as World).tune('gravity');
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 44 }, size: 22, align: 'center', fill: REGALIA_DAY.inkSoft, text: '' });
    this.layer.addChild(this.hud);
    this.reset();
  }

  private reset(): void {
    this.rw = createRigidWorld({ gravityY: this.gravity });
    this.dropped = 0;
    for (const s of this.sprites.values()) this.layer.removeChild(s);
    this.sprites.clear();
    // A three-wall bin.
    addBody(this.rw, { kind: 'static', shape: polygonBox(760, 40), x: 640, y: GROUND_Y + 20, friction: 0.9 });
    addBody(this.rw, { kind: 'static', shape: polygonBox(40, 460), x: 268, y: GROUND_Y - 210, friction: 0.6 });
    addBody(this.rw, { kind: 'static', shape: polygonBox(40, 460), x: 1012, y: GROUND_Y - 210, friction: 0.6 });
    this.refreshHud();
  }

  private drop(): void {
    const w0 = this.world as World;
    const rng = w0.rng;
    const restitution = w0.tune('restitution');
    const friction = w0.tune('friction');
    const x = 500 + rng.float() * 280;
    if (this.round) {
      addBody(this.rw, { shape: { kind: 'circle', r: 20 + rng.float() * 16 }, x, y: 140, density: 0.9, friction, restitution });
    } else {
      const w = 34 + rng.float() * 28;
      addBody(this.rw, { shape: polygonBox(w, w), x, y: 140, density: 0.9, friction, restitution: restitution * 0.25 });
    }
    this.dropped++;
    this.refreshHud();
  }

  private refreshHud(): void {
    this.hud.text = `RIGID BODIES · ${this.dropped} dropped   ·   shape: ${this.round ? 'circle' : 'box'}   ·   gravity ${this.gravity}   ·   SPACE drop, X shape, ↑↓ gravity, R clear`;
  }

  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const input = (this.world as World).input;
    if (input.justPressed('confirm')) this.drop();
    if (input.justPressed('action') || input.justPressed('action2')) { this.round = !this.round; this.refreshHud(); }
    if (input.justPressed('up')) { this.gravity += 150; this.rw.gravityY = this.gravity; this.refreshHud(); }
    if (input.justPressed('down')) { this.gravity = Math.max(0, this.gravity - 150); this.rw.gravityY = this.gravity; this.refreshHud(); }
    if (input.justPressed('restart')) this.reset();

    rigidStep(this.rw, dt);
    this.repaint();
  }

  private repaint(): void {
    for (const b of this.rw.bodies) {
      let sp = this.sprites.get(b.id);
      const isStatic = b.kind === 'static';
      if (!sp) {
        sp =
          b.shape.kind === 'circle'
            ? new Sprite({ z: isStatic ? 1 : 3, shape: { kind: 'circle', radius: b.shape.r }, fill: REGALIA_DAY.good, stroke: REGALIA.ink, strokeWidth: 2 })
            : new Sprite({ z: isStatic ? 1 : 3, shape: { kind: 'poly', points: worldPoints(b) }, fill: isStatic ? REGALIA.ink : REGALIA_DAY.warn, stroke: REGALIA.ink, strokeWidth: 2 });
        this.sprites.set(b.id, sp);
        this.layer.addChild(sp);
      }
      if (b.shape.kind === 'circle') {
        sp.pos = { x: b.x, y: b.y };
      } else {
        sp.shape = { kind: 'poly', points: worldPoints(b) };
        sp.pos = { x: 0, y: 0 };
      }
    }
  }

  protected override serializeProps(): Record<string, unknown> {
    return { gravity: this.gravity, round: this.round, dropped: this.dropped };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.gravity === 'number') this.gravity = props.gravity;
    if (typeof props.round === 'boolean') this.round = props.round;
  }
}

registerNode('PhysicsLab', () => new PhysicsLab());

export const physicsLabGame = defineGame({
  title: 'Physics Lab',
  width: 1280,
  height: 720,
  background: REGALIA_DAY.bg,
  tuning: {
    knobs: [
      knob.num('gravity', { default: 900, min: 0, max: 3000, step: 50, group: 'world' }),
      knob.num('restitution', { default: 0.2, min: 0, max: 0.95, step: 0.05, group: 'bodies' }),
      knob.num('friction', { default: 0.5, min: 0, max: 1, step: 0.05, group: 'bodies' }),
    ],
  },
  build: () => new PhysicsLab({ name: 'physics-lab' }),
  probe: (world) => {
    const lab = world.root.find('physics-lab') as PhysicsLab | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      dropped: lab?.dropped ?? 0,
      gravity: lab?.gravity ?? 0,
      shape: lab?.round ? 'circle' : 'box',
    };
  },
});

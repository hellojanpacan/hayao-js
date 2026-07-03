// Brasswick view: a brass-and-felt table projected straight from the rigid
// world — walls drawn once from their static poses, bells that glow when
// struck, kinematic flipper blades, and a gun-metal ball.

import {
  KENTO, Node, NodePool, PARTICLE_PRESETS, Particles, Sprite, Text, audio,
  defineGame, dhypot, hideScreen, registerNode, showScreen, worldPoints,
  type InputMap, type World,
} from '@hayao';
import {
  BALLS, TABLE, TARGET_SCORE, ballPos, initialPb, stepPb, type PbState,
} from './logic';

export const PB_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  launch: ['Space', 'Enter'],
  restart: ['KeyR'],
};

const PAL = {
  bg: KENTO.washi,           // parlor cream -> light ground
  felt: KENTO.matsuDeep,     // deep table felt -> pine green
  brass: KENTO.koDeep,       // rails and blades -> ochre-gold
  bell: KENTO.shuDeep,       // unlit bell -> vermilion
  bellLit: KENTO.ko,         // struck bell -> bright gold glow
  ball: KENTO.sumiSoft,      // gun metal -> dark neutral
  ink: KENTO.sumi,           // outlines
  text: KENTO.stone,         // muted text
  feltText: KENTO.gofun,     // light text on dark felt
};

export function pbState(world: World): PbState {
  return world.state.pb as PbState;
}

class PbView extends Node {
  override readonly type = 'PbView';
  private layer = new Node({ name: 'layer' });
  private bellPool!: NodePool<Sprite>;
  private movingPool!: NodePool<Sprite>;
  private hud!: Text;
  private fx = new Particles({ name: 'fx', seed: 23, z: 9 });
  private wallsDrawn = false;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.layer.addChild(this.fx);
    // Felt bed behind everything on the table.
    this.layer.addChild(new Sprite({ z: 1, pos: { x: 640, y: 390 }, shape: { kind: 'rect', w: 460, h: 610, r: 10 }, fill: PAL.felt }));
    this.bellPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 30 }, fill: PAL.bell, stroke: PAL.ink, strokeWidth: 2.5 }));
    this.movingPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 5, shape: { kind: 'circle', radius: 10 }, fill: PAL.ball }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 40 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 700 }, z: 8, size: 15, align: 'center', fill: PAL.text, text: '←→ flippers · Space serves the ball · ring every bell for the jackpot · R restarts' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 128 }, z: 3, size: 14, align: 'center', fill: PAL.feltText, text: `first to ${TARGET_SCORE} · three balls` }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = pbState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.pb = initialPb();
      this.wallsDrawn = false;
      hideScreen();
      return;
    }
    const ev = stepPb(
      s,
      {
        left: input.isDown('left'),
        right: input.isDown('right'),
        launch: input.justPressed('launch'),
      },
      dt,
    );
    if (ev.served) audio.blip(260);
    if (ev.bells > 0) audio.blip(720 + s.bells.filter((b) => b.lit).length * 90);
    if (ev.jackpot) {
      audio.success();
      this.fx.burst(20, { x: 640, y: 300 }, PARTICLE_PRESETS.burst([PAL.bellLit, KENTO.gofun]));
    }
    if (ev.drained) audio.blip(140);
    if (ev.won) showScreen({ title: 'Every bell rung', body: `${s.score} — the parlor pays out.`, actions: [{ label: 'Rack another table', primary: true, onSelect: () => { world.state.pb = initialPb(); hideScreen(); } }] });
    if (ev.died) showScreen({ title: 'Last ball down the drain', body: `${s.score} of ${TARGET_SCORE} — the bells keep their brass.`, actions: [{ label: 'Three more balls', primary: true, onSelect: () => { world.state.pb = initialPb(); hideScreen(); } }] });
    this.redraw(s);
  }

  private redraw(s: PbState): void {
    // Walls once: static poly bodies, drawn as world-space polygons.
    if (!this.wallsDrawn) {
      this.wallsDrawn = true;
      for (const b of s.phys.bodies) {
        if (b.kind !== 'static' || b.sensor || b.shape.kind !== 'poly') continue;
        this.layer.addChild(new Sprite({ z: 3, shape: { kind: 'poly', points: worldPoints(b) }, fill: PAL.brass, stroke: PAL.ink, strokeWidth: 2 }));
      }
    }
    this.bellPool.begin();
    for (const bell of s.bells) {
      const sp = this.bellPool.get();
      sp.pos = { x: bell.x, y: bell.y };
      sp.paint.fill = bell.lit ? PAL.bellLit : PAL.bell;
    }
    this.bellPool.end();
    // Moving parts: flippers + ball, straight from body poses.
    this.movingPool.begin();
    for (const b of s.phys.bodies) {
      if (b.kind === 'static') continue;
      const sp = this.movingPool.get();
      sp.pos = { x: b.x, y: b.y };
      sp.rotation = b.a;
      if (b.shape.kind === 'circle') {
        sp.shape = { kind: 'circle', radius: b.shape.r };
        sp.paint.fill = PAL.ball;
        sp.z = 6;
      } else {
        sp.shape = { kind: 'poly', points: b.shape.points };
        sp.paint.fill = PAL.brass;
        sp.z = 5;
      }
      sp.paint.stroke = PAL.ink;
      sp.paint.strokeWidth = 2;
    }
    this.movingPool.end();
    this.hud.text = `score ${s.score} / ${TARGET_SCORE} · balls ${s.ballsLeft + (s.ball ? 1 : 0)} of ${BALLS}${s.ball === 0 && s.ballsLeft > 0 ? ' · Space serves' : ''}`;
  }
}

registerNode('PbView', () => new PbView({ name: 'pb-view' }));

export const brasswickGame = defineGame({
  title: 'Brasswick',
  background: PAL.bg,
  inputMap: PB_INPUT_MAP,
  build(world) {
    world.state.pb = initialPb();
    return new PbView({ name: 'pb-view' });
  },
  probe(world) {
    const s = pbState(world);
    const b = ballPos(s);
    return {
      frame: world.frame,
      score: s.score,
      ballsLeft: s.ballsLeft,
      inPlay: s.ball !== 0,
      ballY: b ? Math.round(b.y) : -1,
      ballSpeed: b ? Math.round(dhypot(b.vx, b.vy)) : 0,
      lit: s.bells.filter((x) => x.lit).length,
      won: s.won,
      dead: s.dead,
    };
  },
});

export const PB_TABLE = TABLE;

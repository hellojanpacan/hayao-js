// Pinshine: aim line, glowing pegs, patrol bucket. Physics feel comes free —
// the view just draws where the swept sim put things.

import { Node, NodePool, PARTICLE_PRESETS, Particles, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World, dcos, dsin, KENTO } from '@hayao';
import { initialPs, stepPs, BALL_R, BUCKET, LAUNCH_Y, PEG_R, W, type PsState } from './logic';

export const PS_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  launch: ['Space', 'Enter'],
  restart: ['KeyR'],
};

const PAL = { bg: KENTO.yohaku, peg: KENTO.ai, pegLit: KENTO.asagi, orange: KENTO.kakiDeep, orangeLit: KENTO.ko, ball: KENTO.gofun, bucket: KENTO.matsu, aim: KENTO.kinako, text: KENTO.kinako };

export function psState(world: World): PsState {
  return world.state.ps as PsState;
}

class PsView extends Node {
  override readonly type = 'PsView';
  private layer = new Node({ name: 'layer' });
  private pegPool!: NodePool<Sprite>;
  private aimPool!: NodePool<Sprite>;
  private ball!: Sprite;
  private bucket!: Sprite;
  private hud!: Text;
  private fx = new Particles({ name: 'fx', seed: 41, z: 9 });

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.layer.addChild(this.fx);
    this.pegPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 3, shape: { kind: 'circle', radius: PEG_R }, fill: PAL.peg }));
    this.aimPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 2, shape: { kind: 'circle', radius: 3 }, fill: PAL.aim }));
    this.ball = this.layer.addChild(new Sprite({ z: 5, shape: { kind: 'circle', radius: BALL_R }, fill: PAL.ball, stroke: KENTO.sumi, strokeWidth: 1.5 }));
    this.bucket = this.layer.addChild(new Sprite({ z: 4, shape: { kind: 'rect', w: BUCKET.w, h: BUCKET.h, r: 8 }, fill: 'none', stroke: PAL.bucket, strokeWidth: 3 }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 690 }, z: 8, size: 15, align: 'center', fill: PAL.text, text: 'arrows aim · Space launches · light every orange peg · the bucket refunds your ball' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = psState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.ps = initialPs();
      hideScreen();
      return;
    }
    if (s.won || s.dead) return;
    const ev = stepPs(
      s,
      {
        aimDir: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
        launch: input.justPressed('launch'),
      },
      dt,
    );
    if (ev.launched) audio.blip(300);
    if (ev.pegHit) audio.blip(480 + Math.min(8, ev.pegHit) * 40);
    if (ev.orangeHit) {
      audio.blip(700);
      if (s.ball) this.fx.burst(12, { x: s.ball.x, y: s.ball.y }, PARTICLE_PRESETS.burst([PAL.orangeLit, KENTO.gofun]));
    }
    if (ev.caught) audio.success();
    if (ev.won) showScreen({ title: 'The board shines clean', body: `${s.score} shine · ${s.caught} bucket saves · ${s.ballsLeft} balls to spare.`, actions: [{ label: 'Rack it again', primary: true, onSelect: () => { world.state.ps = initialPs(); hideScreen(); } }] });
    if (ev.died) showScreen({ title: 'Out of silver', body: `${s.score} shine — the last oranges still glow.`, actions: [{ label: 'One more rack', primary: true, onSelect: () => { world.state.ps = initialPs(); hideScreen(); } }] });
    this.redraw(s);
  }

  private redraw(s: PsState): void {
    this.pegPool.begin();
    for (const p of s.pegs) {
      const sp = this.pegPool.get();
      sp.pos = { x: p.x, y: p.y };
      sp.paint.fill = p.lit ? (p.orange ? PAL.orangeLit : PAL.pegLit) : p.orange ? PAL.orange : PAL.peg;
      sp.paint.opacity = p.lit ? 1 : 0.9;
    }
    this.pegPool.end();
    // Aim preview (a dotted arc of the first flight moments).
    this.aimPool.begin();
    if (!s.ball) {
      const a = s.aim + Math.PI / 2;
      let px = W / 2;
      let py = LAUNCH_Y;
      let vx = dcos(a) * 620;
      let vy = dsin(a) * 620;
      for (let i = 0; i < 9; i++) {
        px += vx * 0.045;
        py += vy * 0.045;
        vy += 640 * 0.045;
        const d = this.aimPool.get();
        d.pos = { x: px, y: py };
        d.paint.opacity = 1 - i / 10;
      }
    }
    this.aimPool.end();
    this.ball.visible = !!s.ball;
    if (s.ball) this.ball.pos = { x: s.ball.x, y: s.ball.y };
    this.bucket.pos = { x: s.bucketX, y: BUCKET.y };
    const oranges = s.pegs.filter((p) => p.orange && !p.lit).length;
    this.hud.text = `shine ${s.score} · balls ${s.ballsLeft} · oranges left ${oranges} · saves ${s.caught}`;
  }
}

registerNode('PsView', () => new PsView({ name: 'ps-view' }));

export const pinshineGame = defineGame({
  title: 'Pinshine',
  background: PAL.bg,
  inputMap: PS_INPUT_MAP,
  build(world) {
    world.state.ps = initialPs();
    return new PsView({ name: 'ps-view' });
  },
  probe(world) {
    const s = psState(world);
    return { frame: world.frame, ballsLeft: s.ballsLeft, aim: s.aim, score: s.score, caught: s.caught, ballInFlight: !!s.ball, oranges: s.pegs.filter((p) => p.orange && !p.lit).length, pegs: s.pegs.length, won: s.won, dead: s.dead };
  },
});

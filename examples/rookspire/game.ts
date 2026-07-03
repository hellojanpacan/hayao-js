// Rookspire view: the scene tree is a pure projection of the rigid-body
// world — every body becomes a rotated vector sprite, ropes are drawn from
// joint anchors, and the aim arc previews the ballistic flight.

import {
  KENTO, Node, NodePool, PARTICLE_PRESETS, Particles, Sprite, Text, audio, dcos,
  defineGame, dsin, hideScreen, registerNode, showScreen, type InputMap,
  type RigidBody, type World,
} from '@hayao';
import {
  GROUND_Y, LEVEL_COUNT, LEVEL_NAMES, SHOT_R, SLING, W, aimArc, idolsLeft,
  initialRk, stepRk, type RkState,
} from './logic';

export const RK_INPUT_MAP: InputMap = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  launch: ['Space', 'Enter'],
  restart: ['KeyR'],
};

const PAL = {
  bg: KENTO.washi,           // parchment sky (light ground)
  ground: KENTO.matsuDeep,   // moss earth — nature/green
  cliff: KENTO.kinako,       // earthen sling cliff — neutral, lifts off the green
  wood: KENTO.kakiDeep,      // warm timber — persimmon
  stone: KENTO.stone,        // grey masonry — neutral
  idol: KENTO.fujiDeep,      // the rooks/idols — arcane wisteria
  shot: KENTO.asagiDeep,     // the slung stone — cool teal (distinct from idols)
  band: KENTO.shuDeep,       // sling band — vermilion primary actor
  aim: KENTO.koDeep,         // aim-arc trajectory — ochre-gold energy
  ink: KENTO.sumi,           // outlines
  text: KENTO.sumiSoft,      // HUD / muted text
  groundText: KENTO.gofun,   // help text over the dark ground band — light for contrast
  spark: KENTO.fuji,         // impact fx accent — bright wisteria
};

export function rkState(world: World): RkState {
  return world.state.rk as RkState;
}

/** Wood or stone? Read the material back from mass/area (no extra state). */
function isStone(b: RigidBody): boolean {
  if (b.shape.kind !== 'poly') return false;
  const p = b.shape.points;
  const w = Math.abs(p[2] - p[0]) || 1;
  const h = Math.abs(p[5] - p[3]) || 1;
  return b.m / (w * h * 1e-4) > 1.5;
}

class RkView extends Node {
  override readonly type = 'RkView';
  private layer = new Node({ name: 'layer' });
  private bodyPool!: NodePool<Sprite>;
  private ropePool!: NodePool<Sprite>;
  private aimPool!: NodePool<Sprite>;
  private hud!: Text;
  private fx = new Particles({ name: 'fx', seed: 17, z: 9 });

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.layer.addChild(this.fx);
    // The earth and the sling cliff are static — draw once.
    this.layer.addChild(new Sprite({ z: 1, pos: { x: W / 2, y: GROUND_Y + 42 }, shape: { kind: 'rect', w: W, h: 84 }, fill: PAL.ground }));
    this.layer.addChild(new Sprite({ z: 1, pos: { x: 110, y: GROUND_Y - 75 }, shape: { kind: 'rect', w: 180, h: 150, r: 6 }, fill: PAL.cliff }));
    this.layer.addChild(new Sprite({ z: 3, pos: { x: SLING.x, y: SLING.y + 40 }, shape: { kind: 'rect', w: 10, h: 80, r: 3 }, fill: PAL.band, stroke: PAL.ink, strokeWidth: 2 }));
    this.bodyPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'rect', w: 10, h: 10 }, fill: PAL.wood }));
    this.ropePool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 3, shape: { kind: 'poly', points: [0, 0, 1, 1], closed: false }, fill: 'none', stroke: PAL.ink, strokeWidth: 2 }));
    this.aimPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 2, shape: { kind: 'circle', radius: 3.5 }, fill: PAL.aim }));
    this.hud = this.layer.addChild(new Text({ pos: { x: W / 2, y: 30 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: W / 2, y: 686 }, z: 8, size: 15, align: 'center', fill: PAL.groundText, text: '↑↓ aim · ←→ power · Space looses the stone · rooks shatter on hard hits or on the earth · R restarts' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = rkState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.rk = initialRk(s.level);
      hideScreen();
      return;
    }
    // No terminal gate here: stepRk keeps settling the rubble behind the end
    // screen (and fires win/lose events exactly once, on the transition).
    const ev = stepRk(
      s,
      {
        aimDir: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
        powerDir: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
        launch: input.justPressed('launch'),
      },
      dt,
    );
    if (ev.launched) audio.blip(220);
    if (ev.thud > 30) audio.blip(120 + Math.min(80, ev.thud));
    if (ev.smashed > 0 || ev.grounded > 0) {
      audio.success();
      for (const rook of s.idols) void rook; // fx at the score line below
      this.fx.burst(16, { x: W * 0.7, y: GROUND_Y - 100 }, PARTICLE_PRESETS.burst([PAL.idol, PAL.spark]));
    }
    if (ev.won) {
      const next = s.level + 1;
      showScreen({
        title: `${LEVEL_NAMES[s.level]} falls`,
        body: `score ${s.score} · ${s.shotsLeft} stones spared`,
        actions: next < LEVEL_COUNT
          ? [{ label: `Onward: ${LEVEL_NAMES[next]}`, primary: true, onSelect: () => { world.state.rk = initialRk(next); hideScreen(); } }]
          : [{ label: 'Raze it all again', primary: true, onSelect: () => { world.state.rk = initialRk(0); hideScreen(); } }],
      });
    }
    if (ev.died) {
      showScreen({
        title: 'The rooks still stand',
        body: `${idolsLeft(s)} idol(s) unbroken · score ${s.score}`,
        actions: [{ label: 'Sling again', primary: true, onSelect: () => { world.state.rk = initialRk(s.level); hideScreen(); } }],
      });
    }
    this.redraw(s);
  }

  private redraw(s: RkState): void {
    const idolIds = new Set(s.idols.filter((r) => r.alive).map((r) => r.id));
    this.bodyPool.begin();
    for (const b of s.phys.bodies) {
      if (b.kind === 'static') continue; // terrain is drawn once in onReady
      const sp = this.bodyPool.get();
      sp.pos = { x: b.x, y: b.y };
      sp.rotation = b.a;
      if (b.shape.kind === 'circle') {
        sp.shape = { kind: 'circle', radius: b.shape.r };
        if (idolIds.has(b.id)) {
          sp.paint.fill = PAL.idol;
          sp.z = 6;
        } else {
          sp.paint.fill = PAL.shot;
          sp.z = 5;
        }
      } else {
        sp.shape = { kind: 'poly', points: b.shape.points };
        sp.paint.fill = isStone(b) ? PAL.stone : PAL.wood;
        sp.z = 4;
      }
      sp.paint.stroke = PAL.ink;
      sp.paint.strokeWidth = 2;
      sp.paint.opacity = b.sleeping ? 0.92 : 1;
    }
    this.bodyPool.end();
    // Ropes: draw every distance joint as a line between world anchors.
    this.ropePool.begin();
    for (const j of s.phys.joints) {
      if (j.kind !== 'distance') continue;
      const A = s.phys.bodies.find((b) => b.id === j.a);
      const B = s.phys.bodies.find((b) => b.id === j.b);
      if (!A || !B) continue;
      const ca = dcos(A.a), sa = dsin(A.a);
      const cb = dcos(B.a), sb = dsin(B.a);
      const ax = A.x + j.ax * ca - j.ay * sa, ay = A.y + j.ax * sa + j.ay * ca;
      const bx = B.x + j.bx * cb - j.by * sb, by = B.y + j.bx * sb + j.by * cb;
      const rope = this.ropePool.get();
      rope.pos = { x: 0, y: 0 };
      rope.shape = { kind: 'poly', points: [ax, ay, bx, by], closed: false };
    }
    this.ropePool.end();
    // Aim arc while the sling is loaded.
    this.aimPool.begin();
    if (s.proj === 0 && s.shotsLeft > 0) {
      const arc = aimArc(s, 10);
      for (let i = 0; i < arc.length; i++) {
        const d = this.aimPool.get();
        d.pos = arc[i];
        d.paint.opacity = 1 - i / 12;
      }
    }
    this.aimPool.end();
    this.hud.text = `${LEVEL_NAMES[s.level]} · stones ${s.shotsLeft} · rooks ${idolsLeft(s)} · score ${s.score}`;
  }
}

registerNode('RkView', () => new RkView({ name: 'rk-view' }));

export const rookspireGame = defineGame({
  title: 'Rookspire',
  background: PAL.bg,
  inputMap: RK_INPUT_MAP,
  build(world) {
    world.state.rk = initialRk(0);
    return new RkView({ name: 'rk-view' });
  },
  probe(world) {
    const s = rkState(world);
    return {
      frame: world.frame,
      level: s.level,
      shotsLeft: s.shotsLeft,
      idols: idolsLeft(s),
      bodies: s.phys.bodies.length,
      awake: s.phys.bodies.filter((b) => b.kind === 'dynamic' && !b.sleeping).length,
      aim: s.aim,
      power: s.power,
      inFlight: s.proj !== 0,
      score: s.score,
      won: s.won,
      dead: s.dead,
    };
  },
});

/** Marker so the shot radius constant stays exported for tests. */
export const RK_SHOT_R = SHOT_R;

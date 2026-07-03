// Vellgrove Rally: tarmac ribbon, grass beyond, three tiny cars. The camera
// stays fixed (Micro Machines-style whole-track view); readability first.

import { Node, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { initialVg, playerPosition, stepVg, HALF_WIDTH, LAPS, TRACK, type VgState } from './logic';

export const VG_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  gas: ['ArrowUp', 'KeyW', 'Space'],
  brake: ['ArrowDown', 'KeyS', 'ShiftLeft'],
  restart: ['KeyR'],
};

const PAL = { grass: '#1c2a18', tarmac: '#2c2c34', edge: '#4a4a58', start: '#e8e8f0', player: '#ffd75e', rival1: '#ff6d8a', rival2: '#7fc8ff', text: '#9aa88e' };

export function vgState(world: World): VgState {
  return world.state.vg as VgState;
}

class VgView extends Node {
  override readonly type = 'VgView';
  private layer = new Node({ name: 'layer' });
  private cars: Sprite[] = [];
  private hud!: Text;
  private big!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    // Track ribbon: fat rounded segments along the centreline.
    for (let i = 0; i < TRACK.length; i++) {
      const a = TRACK[i];
      const b = TRACK[(i + 1) % TRACK.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      this.layer.addChild(new Sprite({ pos: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, rotation: Math.atan2(b.y - a.y, b.x - a.x), z: 1, shape: { kind: 'rect', w: len + HALF_WIDTH, h: HALF_WIDTH * 2, r: HALF_WIDTH }, fill: PAL.tarmac }));
    }
    // Start line.
    this.layer.addChild(new Sprite({ pos: { x: 240, y: 170 }, rotation: 1.35, z: 2, shape: { kind: 'rect', w: 12, h: HALF_WIDTH * 2 - 20, r: 4 }, fill: PAL.start, opacity: 0.7 }));
    const colors = [PAL.player, PAL.rival1, PAL.rival2];
    for (let i = 0; i < 3; i++) this.cars.push(this.layer.addChild(new Sprite({ z: 5, shape: { kind: 'poly', points: [16, 0, -10, 9, -6, 0, -10, -9], closed: true }, fill: colors[i], stroke: '#101014', strokeWidth: 2 })));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.big = this.layer.addChild(new Text({ pos: { x: 640, y: 360 }, z: 9, size: 64, align: 'center', fill: PAL.start, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 692 }, z: 8, size: 15, align: 'center', fill: PAL.text, text: '↑ gas · ↓ brake · ←/→ steer · grass is slow · 3 laps' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = vgState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.vg = initialVg();
      hideScreen();
      return;
    }
    if (s.done) return;
    const ev = stepVg(
      s,
      {
        throttle: input.isDown('gas') ? 1 : 0,
        brake: input.isDown('brake') ? 1 : 0,
        steer: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
      },
      dt,
    );
    if (ev.go) audio.success();
    if (ev.playerLap) audio.blip(640);
    if (ev.done) {
      const pos = s.results.indexOf(0) + 1;
      showScreen({ title: pos === 1 ? 'Chequered flag — P1!' : `P${pos}`, body: `Three laps of Vellgrove in ${s.time.toFixed(1)}s.`, actions: [{ label: 'Race again', primary: true, onSelect: () => { world.state.vg = initialVg(); hideScreen(); } }] });
    }
    // View sync.
    s.cars.forEach((c, i) => {
      this.cars[i].pos = { x: c.x, y: c.y };
      this.cars[i].rotation = c.heading;
    });
    this.big.text = s.countdown > 0 ? `${Math.ceil(s.countdown)}` : s.time < 1 ? 'GO!' : '';
    this.hud.text = `lap ${Math.min(LAPS, s.cars[0].lap + 1)}/${LAPS} · P${playerPosition(s)} · ${s.time.toFixed(1)}s`;
  }
}

registerNode('VgView', () => new VgView({ name: 'vg-view' }));

export const vellgroveGame = defineGame({
  title: 'Vellgrove Rally',
  background: '#1c2a18',
  inputMap: VG_INPUT_MAP,
  build(world) {
    world.state.vg = initialVg();
    return new VgView({ name: 'vg-view' });
  },
  probe(world) {
    const s = vgState(world);
    return { frame: world.frame, time: s.time, countdown: s.countdown, cars: s.cars.map((c) => ({ x: c.x, y: c.y, heading: c.heading, lap: c.lap, nextCp: c.nextCp, finished: c.finished })), position: playerPosition(s), results: [...s.results], won: s.won, done: s.done };
  },
});

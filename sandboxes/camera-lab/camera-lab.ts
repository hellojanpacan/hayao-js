// camera-lab — one primitive: Camera2D + CameraController. Drive the dot with
// arrows/WASD; the camera chases it through a deadzone, smoothed, clamped to the
// world edges. Knobs: Z = tighter deadzone, X = looser, C = toggle smoothing.
// The scrolling landmark grid makes the follow visible. No genre.
// See sandboxes/README.md.

import {
  Node,
  Node2D,
  Sprite,
  Text,
  Camera2D,
  CameraController,
  REGALIA,
  REGALIA_DAY,
  registerNode,
  defineGame,
  type World,
} from '@hayao';

const WORLD = { w: 2400, h: 1400 };
const DEADZONES = [30, 120, 260];
const SMOOTHS = [0.09, 0.3];

class CameraLab extends Node {
  override readonly type = 'CameraLab';
  tx = WORLD.w / 2;
  ty = WORLD.h / 2;
  dzIdx = 1;
  smIdx = 0;
  private world2 = new Node2D({ name: 'world' });
  private target = new Sprite({ name: 'target', z: 5, shape: { kind: 'circle', radius: 22 }, fill: REGALIA_DAY.accent, stroke: REGALIA.ink, strokeWidth: 3 });
  private cam!: Camera2D;
  private ctrl!: CameraController;
  private hud!: Text;

  protected override onReady(): void {
    // Landmark grid so camera motion reads.
    for (let y = 0; y <= WORLD.h; y += 200) {
      for (let x = 0; x <= WORLD.w; x += 200) {
        const edge = x === 0 || y === 0 || x >= WORLD.w - 200 || y >= WORLD.h - 200;
        this.world2.addChild(new Sprite({ pos: { x, y }, z: 0, shape: { kind: 'rect', w: 30, h: 30, r: 4 }, fill: edge ? REGALIA.ink : REGALIA_DAY.line }));
      }
    }
    this.world2.cosmetic = true;
    this.world2.addChild(this.target);
    this.target.pos = { x: this.tx, y: this.ty };
    this.addChild(this.world2);

    this.cam = new Camera2D({ name: 'camera', pos: { x: this.tx, y: this.ty }, current: true });
    this.addChild(this.cam);
    this.ctrl = new CameraController({ name: 'follow', target: this.target, deadzone: { x: DEADZONES[this.dzIdx], y: DEADZONES[this.dzIdx] }, smooth: SMOOTHS[this.smIdx], bounds: { minX: 0, minY: 0, maxX: WORLD.w, maxY: WORLD.h } });
    this.addChild(this.ctrl);

    this.hud = new Text({ name: 'hud', pos: { x: 0, y: 0 }, size: 22, align: 'center', fill: REGALIA_DAY.inkSoft, text: '' });
    this.hud.cosmetic = true;
    this.addChild(this.hud);
    this.refreshHud();
  }

  private refreshHud(): void {
    this.hud.text = `Camera2D + CameraController · deadzone ${DEADZONES[this.dzIdx]}   ·   smoothing ${this.smIdx === 0 ? 'smooth' : 'snappy'}   ·   arrows move, Z/X deadzone, C smoothing`;
  }

  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const input = (this.world as World).input;
    const sp = 420 * dt;
    if (input.isDown('left')) this.tx -= sp;
    if (input.isDown('right')) this.tx += sp;
    if (input.isDown('up')) this.ty -= sp;
    if (input.isDown('down')) this.ty += sp;
    this.tx = Math.max(40, Math.min(WORLD.w - 40, this.tx));
    this.ty = Math.max(40, Math.min(WORLD.h - 40, this.ty));
    this.target.pos = { x: this.tx, y: this.ty };

    if (input.justPressed('action')) { this.dzIdx = Math.max(0, this.dzIdx - 1); this.ctrl.deadzone = { x: DEADZONES[this.dzIdx], y: DEADZONES[this.dzIdx] }; this.refreshHud(); }
    if (input.justPressed('action2')) { this.dzIdx = Math.min(DEADZONES.length - 1, this.dzIdx + 1); this.ctrl.deadzone = { x: DEADZONES[this.dzIdx], y: DEADZONES[this.dzIdx] }; this.refreshHud(); }
    if (input.justPressed('cancel')) { this.smIdx = (this.smIdx + 1) % SMOOTHS.length; this.ctrl.smooth = SMOOTHS[this.smIdx]; this.refreshHud(); }

    // Keep the HUD pinned to the top of the view as the camera scrolls.
    this.hud.pos = { x: this.cam.pos.x, y: this.cam.pos.y - 320 };
  }

  protected override serializeProps(): Record<string, unknown> {
    return { tx: this.tx, ty: this.ty, dzIdx: this.dzIdx, smIdx: this.smIdx };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.tx === 'number') this.tx = props.tx;
    if (typeof props.ty === 'number') this.ty = props.ty;
    if (typeof props.dzIdx === 'number') this.dzIdx = props.dzIdx;
    if (typeof props.smIdx === 'number') this.smIdx = props.smIdx;
  }
}

registerNode('CameraLab', () => new CameraLab());

export const cameraLabGame = defineGame({
  title: 'Camera Lab',
  width: 1280,
  height: 720,
  background: REGALIA_DAY.bg,
  build: () => new CameraLab({ name: 'camera-lab' }),
  probe: (world) => {
    const lab = world.root.find('camera-lab') as CameraLab | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      targetX: lab ? Math.round(lab.tx) : 0,
      targetY: lab ? Math.round(lab.ty) : 0,
      deadzone: DEADZONES[lab?.dzIdx ?? 1],
    };
  },
});

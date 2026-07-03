// Veilstep: the stealth sim in world.state; the view draws vision cones as
// translucent fans (raycast-clipped would be nicer; fans read well enough),
// the detection meter as an eye that opens, and bushes as soft cover.

import {
  Node,
  Sprite,
  Text,
  TILE,
  audio,
  defineGame,
  hideScreen,
  registerNode,
  showScreen,
  tileAt,
  type InputMap,
  type World,
} from '@hayao';
import { BUSHES, BUSH_RADIUS, VISION, idolPoint, initialVs, isHidden, levelMap, spawnPoint, stepVs, TILE_SIZE, type VsState } from './logic';

export const VS_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  sprint: ['ShiftLeft', 'ShiftRight', 'KeyX'],
  restart: ['KeyR'],
};

const PAL = { bg: '#101418', rock: '#2a3340', rockLine: '#3c4a5c', thief: '#d8e8f4', thiefHidden: '#5a7a94', cone: '#ffd75e', coneAlert: '#ff5e5e', guard: '#c05555', bush: '#3f6444', idol: '#ffd75e', text: '#8598ad' };

export function vsState(world: World): VsState {
  return world.state.vs as VsState;
}

class VsView extends Node {
  override readonly type = 'VsView';
  private tiles = new Node({ name: 'tiles' });
  private dynamic = new Node({ name: 'dynamic' });

  protected override onReady(): void {
    this.tiles.cosmetic = true;
    this.dynamic.cosmetic = true;
    this.addChild(this.tiles);
    this.addChild(this.dynamic);
    const map = levelMap();
    for (let ty = 0; ty < map.rows; ty++)
      for (let tx = 0; tx < map.cols; tx++)
        if (tileAt(map, tx, ty) === TILE.SOLID)
          this.tiles.addChild(new Sprite({ pos: { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE }, z: 2, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.rock, stroke: PAL.rockLine, strokeWidth: 1 }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = vsState(world);
    if (s.won) return;
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.vs = initialVs();
      return;
    }
    const ev = stepVs(
      s,
      {
        moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
        moveY: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
        sprint: input.isDown('sprint'),
      },
      dt,
    );
    if (ev.grabbed) audio.success();
    if (ev.spotted) audio.blip(110);
    if (ev.won) {
      audio.success();
      showScreen({ title: 'Clean getaway', body: `The idol is yours. Alarms raised: ${s.alarms}.`, actions: [{ label: 'Steal it again', primary: true, onSelect: () => { (this.world as World).state.vs = initialVs(); hideScreen(); } }] });
      return;
    }
    this.redraw(s);
  }

  private redraw(s: VsState): void {
    for (const c of this.dynamic.children.slice()) this.dynamic.removeChild(c);

    for (const b of BUSHES) this.dynamic.addChild(new Sprite({ pos: b, z: 3, shape: { kind: 'circle', radius: BUSH_RADIUS }, fill: PAL.bush, opacity: 0.85 }));

    for (const g of s.guards) {
      const a = Math.atan2(g.fy, g.fx);
      const a0 = a - VISION.fov / 2;
      const a1 = a + VISION.fov / 2;
      const r = VISION.range;
      const d = `M 0 0 L ${Math.cos(a0) * r} ${Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r} Z`;
      this.dynamic.addChild(new Sprite({ pos: { x: g.x, y: g.y }, z: 4, shape: { kind: 'path', d }, fill: s.meter > 0.4 ? PAL.coneAlert : PAL.cone, opacity: 0.14 + s.meter * 0.2 }));
      this.dynamic.addChild(new Sprite({ pos: { x: g.x, y: g.y }, z: 5, shape: { kind: 'circle', radius: 13 }, fill: PAL.guard, stroke: '#26160f', strokeWidth: 2 }));
    }

    const idol = idolPoint();
    if (!s.idol) this.dynamic.addChild(new Sprite({ pos: idol, z: 4, shape: { kind: 'poly', points: [0, -14, 9, 0, 0, 14, -9, 0], closed: true }, fill: PAL.idol, stroke: '#fff', strokeWidth: 2 }));
    const sp = spawnPoint();
    this.dynamic.addChild(new Sprite({ pos: sp, z: 3, shape: { kind: 'circle', radius: 20 }, fill: 'none', stroke: PAL.thiefHidden, strokeWidth: 2 }));

    this.dynamic.addChild(new Sprite({ name: 'thief', pos: { x: s.x, y: s.y }, z: 6, shape: { kind: 'circle', radius: 11 }, fill: isHidden(s) ? PAL.thiefHidden : PAL.thief, stroke: '#1a2530', strokeWidth: 2 }));

    // Detection meter.
    if (s.meter > 0.02) this.dynamic.addChild(new Sprite({ pos: { x: s.x, y: s.y - 28 }, z: 8, shape: { kind: 'rect', w: 44 * s.meter, h: 6, r: 3 }, fill: s.meter > 0.6 ? PAL.coneAlert : PAL.cone }));
    this.dynamic.addChild(new Text({ pos: { x: 640, y: 34 }, size: 20, align: 'center', fill: PAL.text, text: `${s.idol ? 'Get back to the entry!' : 'Steal the idol'} · shift sprints (loud) · bushes hide · alarms ${s.alarms}` }));
  }
}

registerNode('VsView', () => new VsView({ name: 'vs-view' }));

export const veilstepGame = defineGame({
  title: 'Veilstep',
  background: PAL.bg,
  inputMap: VS_INPUT_MAP,
  build(world) {
    world.state.vs = initialVs();
    return new VsView({ name: 'vs-view' });
  },
  probe(world) {
    const s = vsState(world);
    return { frame: world.frame, time: world.time, x: s.x, y: s.y, idol: s.idol, won: s.won, alarms: s.alarms, meter: s.meter, hidden: isHidden(s), guards: s.guards.map((g) => ({ x: g.x, y: g.y, fx: g.fx, fy: g.fy, state: g.state, dir: g.dir })) };
  },
});

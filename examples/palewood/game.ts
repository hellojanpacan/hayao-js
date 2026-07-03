// Palewood: the night is drawn as darkness with a raycast-lit clearing around
// the lantern — lit tiles graded by distance, everything else near-black. The
// Pales are barely-visible until the light finds them. Spatial growls pan with
// the nearest stalker; a heartbeat quickens as dread rises.

import { Node, NodePool, Sprite, Text, TILE, audio, defineGame, hideScreen, registerNode, showScreen, tileAt, type InputMap, type World, dhypot } from '@hayao';
import { inLight, initialPw, stepPw, DAWN_AT, LANTERN, TILE_SIZE, woodsMap, type PwState } from './logic';

export const PW_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  restart: ['KeyR'],
};

const PAL = { bg: '#050607', dark: '#0a0c0e', treeDark: '#0e1210', treeLit: '#2a3d2a', groundLit: '#1a201a', player: '#f0e8d0', lantern: '#ffd75e', can: '#c97b4a', pale: '#dbe6f2', text: '#6a7a6a' };

export function pwState(world: World): PwState {
  return world.state.pw as PwState;
}

class PwView extends Node {
  override readonly type = 'PwView';
  private layer = new Node({ name: 'layer' });
  private tilePool!: NodePool<Sprite>;
  private entPool!: NodePool<Sprite>;
  private player!: Sprite;
  private glow!: Sprite;
  private hud!: Text;
  private beatT = 0;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.tilePool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 1, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.groundLit }));
    this.glow = this.layer.addChild(new Sprite({ z: 2, shape: { kind: 'circle', radius: LANTERN.radius }, fill: PAL.lantern, opacity: 0.06 }));
    this.entPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 10 }, fill: PAL.can }));
    this.player = this.layer.addChild(new Sprite({ z: 5, shape: { kind: 'circle', radius: 11 }, fill: PAL.player, stroke: '#0a0c0e', strokeWidth: 2 }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 8, size: 19, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 692 }, z: 8, size: 15, align: 'center', fill: PAL.text, text: 'stay in the light · fetch fuel cans before the lantern dies · dawn comes at 90s' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = pwState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.pw = initialPw();
      hideScreen();
      return;
    }
    if (s.won || s.dead) return;
    const ev = stepPw(
      s,
      {
        moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
        moveY: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
      },
      dt,
      world.rng,
    );
    // ── Spatial dread ──
    if (ev.growl && world.frame % 45 === 0) audio.spatial(70 + (world.frame % 3) * 8, ev.growl.dx, ev.growl.dist, 640, 0.5, 'sawtooth');
    this.beatT -= dt;
    if (ev.heartbeat > 0.15 && this.beatT <= 0) {
      audio.thud();
      this.beatT = 1.1 - ev.heartbeat * 0.75; // dread quickens the pulse
    }
    if (ev.fetched) audio.blip(620);
    if (ev.grabbed) audio.thud();
    if (ev.paleFled) audio.blip(220);
    if (ev.died) showScreen({ title: 'The dark takes you', body: `${Math.floor(s.time)}s from dawn's ${DAWN_AT}. The Pales feed.`, actions: [{ label: 'Face the night again', primary: true, onSelect: () => { world.state.pw = initialPw(); hideScreen(); } }] });
    if (ev.won) showScreen({ title: 'DAWN', body: `The Pales thin into morning mist. ${s.fetched} cans burned.`, actions: [{ label: 'Another night', primary: true, onSelect: () => { world.state.pw = initialPw(); hideScreen(); } }] });
    this.redraw(s);
  }

  private redraw(s: PwState): void {
    const map = woodsMap();
    this.tilePool.begin();
    for (let ty = 0; ty < map.rows; ty++)
      for (let tx = 0; tx < map.cols; tx++) {
        const cx = (tx + 0.5) * TILE_SIZE;
        const cy = (ty + 0.5) * TILE_SIZE;
        const solid = tileAt(map, tx, ty) === TILE.SOLID;
        const lit = inLight(s, cx, cy);
        if (!lit && !solid) continue; // unlit ground = darkness (the bg)
        const sp = this.tilePool.get();
        sp.pos = { x: cx, y: cy };
        if (solid) sp.paint.fill = lit ? PAL.treeLit : PAL.treeDark;
        else {
          const near = 1 - dhypot(cx - s.x, cy - s.y) / LANTERN.radius;
          sp.paint.fill = PAL.groundLit;
          sp.paint.opacity = 0.25 + near * 0.75;
        }
      }
    this.tilePool.end();

    this.entPool.begin();
    for (const c of s.cans)
      if (inLight(s, c.x, c.y)) {
        const sp = this.entPool.get();
        sp.pos = { x: c.x, y: c.y };
        sp.shape = { kind: 'rect', w: 14, h: 18, r: 3 };
        sp.paint.fill = PAL.can;
        sp.paint.opacity = 1;
      }
    for (const p of s.pales) {
      const lit = inLight(s, p.x, p.y);
      const d = dhypot(p.x - s.x, p.y - s.y);
      if (!lit && d > 320) continue; // truly unseen
      const sp = this.entPool.get();
      sp.pos = { x: p.x, y: p.y };
      sp.shape = { kind: 'poly', points: [0, -18, 12, 14, 0, 6, -12, 14], closed: true };
      sp.paint.fill = PAL.pale;
      sp.paint.opacity = lit ? 0.9 : 0.12; // a suggestion in the dark
    }
    this.entPool.end();

    this.player.pos = { x: s.x, y: s.y };
    this.glow.pos = { x: s.x, y: s.y };
    this.glow.visible = s.fuel > 0;
    this.glow.shape = { kind: 'circle', radius: LANTERN.radius * (0.85 + 0.15 * (s.fuel / LANTERN.fuelMax)) };
    const fuelWarn = s.fuel <= 6 ? ' — THE LIGHT GUTTERS' : '';
    this.hud.text = `to dawn ${Math.max(0, DAWN_AT - s.time).toFixed(0)}s · fuel ${s.fuel.toFixed(0)}/${LANTERN.fuelMax} · cans left ${s.cans.length}${s.wounds ? ' · WOUNDED' : ''}${fuelWarn}`;
  }
}

registerNode('PwView', () => new PwView({ name: 'pw-view' }));

export const palewoodGame = defineGame({
  title: 'Palewood',
  background: PAL.bg,
  inputMap: PW_INPUT_MAP,
  build(world) {
    world.state.pw = initialPw();
    return new PwView({ name: 'pw-view' });
  },
  probe(world) {
    const s = pwState(world);
    return { frame: world.frame, time: s.time, x: s.x, y: s.y, fuel: s.fuel, cans: s.cans.map((c) => ({ ...c })), fetched: s.fetched, pales: s.pales.map((p) => ({ x: p.x, y: p.y, state: p.state })), dead: s.dead, won: s.won };
  },
});

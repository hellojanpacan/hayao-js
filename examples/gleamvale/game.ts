// Gleamvale: the combat sim (logic.ts, in world.state) + a cosmetic view with
// the genre's juice — hit-stop, knockback flashes, screen shake, slash arcs.

import { KENTO, Node, PARTICLE_PRESETS, Particles, Shaker, Sprite, Text, TILE, audio, defineGame, hideScreen, registerNode, showScreen, tileAt, type InputMap, type World, dcos, dsin, datan2 } from '@hayao';
import { initialGv, parseRoom, stepGv, DOOR_RECT, KEY_AT, PLAYER, TILE_SIZE, type GvState } from './logic';
import { ROOMS } from './rooms';

export const GV_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  attack: ['Space', 'KeyZ', 'KeyJ'],
  restart: ['KeyR'],
};

// Kentō restyle — dark ground. Actors on distinct BRIGHT hue families:
// hero=gofun/matsu, chaser=kaki (warm), darter=shu (danger), sentry+orb=fuji (arcane),
// key=ko (treasure gold), heart=saku (health), door=kinako (wood), terrain=neutral ramp.
const PAL = { bg: KENTO.kuro, rock: KENTO.sumiSoft, rockLine: KENTO.stone, hero: KENTO.gofun, heroLine: KENTO.matsu, slash: KENTO.ko, chaser: KENTO.kaki, darter: KENTO.shu, darterFlash: KENTO.gofun, sentry: KENTO.fuji, orb: KENTO.fuji, key: KENTO.ko, door: KENTO.kinako, heart: KENTO.saku, text: KENTO.kinako, enemyLine: KENTO.sumi, rimLight: KENTO.gofun, doorLine: KENTO.sumi };

export function gvState(world: World): GvState {
  return world.state.gv as GvState;
}

class GvView extends Node {
  override readonly type = 'GvView';
  private tiles = new Node({ name: 'tiles' });
  private dynamic = new Node({ name: 'dynamic' });
  private fx = new Particles({ name: 'fx', seed: 21, z: 9 });
  private shaker = new Shaker({ name: 'shake', seed: 22 });
  private builtRoom = -1;

  protected override onReady(): void {
    this.tiles.cosmetic = true;
    this.dynamic.cosmetic = true;
    this.addChild(this.shaker);
    this.shaker.addChild(this.tiles);
    this.shaker.addChild(this.dynamic);
    this.shaker.addChild(this.fx);
    this.rebuildTiles();
  }

  private rebuildTiles(): void {
    const s = gvState(this.world as World);
    this.builtRoom = s.room;
    for (const c of this.tiles.children.slice()) this.tiles.removeChild(c);
    const map = parseRoom(s.room).map;
    for (let ty = 0; ty < map.rows; ty++)
      for (let tx = 0; tx < map.cols; tx++)
        if (tileAt(map, tx, ty) === TILE.SOLID)
          this.tiles.addChild(new Sprite({ pos: { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE }, z: 2, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.rock, stroke: PAL.rockLine, strokeWidth: 1 }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = gvState(world);
    if (s.won) return;
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.gv = initialGv();
      return;
    }
    const ev = stepGv(
      s,
      {
        moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
        moveY: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
        attack: input.justPressed('attack'),
      },
      dt,
    );

    if (ev.transitioned || s.room !== this.builtRoom) this.rebuildTiles();
    if (ev.slashed) audio.blip(340);
    if (ev.hitEnemy) {
      audio.blip(520);
      this.shaker.addTrauma(0.28);
      this.fx.burst(10, { x: s.x + s.faceX * 40, y: s.y + s.faceY * 40 }, PARTICLE_PRESETS.hit());
    }
    if (ev.killedEnemy) this.shaker.addTrauma(0.2);
    if (ev.playerHurt) {
      audio.blip(120);
      this.shaker.addTrauma(0.5);
      this.fx.burst(14, { x: s.x, y: s.y }, PARTICLE_PRESETS.hit([PAL.hero, PAL.heroLine]));
    }
    if (ev.pickedKey || ev.openedDoor || ev.won) audio.success();
    if (ev.won) {
      showScreen({ title: 'The Heart Container', body: `Gleamvale is calm again. Deaths: ${s.deaths}.`, actions: [{ label: 'Once more', primary: true, onSelect: () => { (this.world as World).state.gv = initialGv(); hideScreen(); } }] });
      return;
    }

    this.redraw(s);
  }

  /** Rebuild the dynamic layer each frame — entity counts are tiny here. */
  private redraw(s: GvState): void {
    for (const c of this.dynamic.children.slice()) this.dynamic.removeChild(c);
    const room = parseRoom(s.room);
    const rs = s.rooms[s.room];

    for (const e of rs.enemies) {
      if (e.hp <= 0) continue;
      const flash = e.hurt > 0 || (e.kind === 'darter' && e.state === 'telegraph' && Math.floor(e.t * 12) % 2 === 0);
      const fill = flash ? PAL.darterFlash : e.kind === 'chaser' ? PAL.chaser : e.kind === 'darter' ? PAL.darter : PAL.sentry;
      const shape = e.kind === 'sentry' ? ({ kind: 'rect', w: 30, h: 30, r: 8 } as const) : ({ kind: 'circle', radius: 13 } as const);
      this.dynamic.addChild(new Sprite({ pos: { x: e.x, y: e.y }, z: 5, shape, fill, stroke: PAL.enemyLine, strokeWidth: 2 }));
    }
    for (const o of s.orbs) this.dynamic.addChild(new Sprite({ pos: { x: o.x, y: o.y }, z: 5, shape: { kind: 'circle', radius: 8 }, fill: PAL.orb }));
    if (s.keyOnGround && s.room === 2) this.dynamic.addChild(new Sprite({ pos: KEY_AT, z: 4, shape: { kind: 'poly', points: [0, -12, 8, 0, 0, 12, -8, 0], closed: true }, fill: PAL.key, stroke: PAL.rimLight, strokeWidth: 2 }));
    if (!s.doorOpen && (s.room === 1 || s.room === 3)) {
      const y = s.room === 1 ? DOOR_RECT.y + 16 : 16;
      this.dynamic.addChild(new Sprite({ pos: { x: DOOR_RECT.x + 32, y }, z: 3, shape: { kind: 'rect', w: 64, h: 32, r: 4 }, fill: PAL.door, stroke: PAL.doorLine, strokeWidth: 3 }));
    }
    if (room.heart) this.dynamic.addChild(new Sprite({ pos: room.heart, z: 4, shape: { kind: 'circle', radius: 14 }, fill: PAL.heart, stroke: PAL.rimLight, strokeWidth: 3 }));

    // Hero (blinks during i-frames) + slash arc.
    const blink = s.iframes > 0 && Math.floor(s.iframes * 14) % 2 === 0;
    if (!blink) this.dynamic.addChild(new Sprite({ name: 'hero', pos: { x: s.x, y: s.y }, z: 6, shape: { kind: 'circle', radius: 12 }, fill: PAL.hero, stroke: PAL.heroLine, strokeWidth: 3 }));
    if (s.slashing > 0) {
      const a = datan2(s.faceY, s.faceX);
      const r = PLAYER.slashRange;
      const a0 = a - PLAYER.slashArc / 2;
      const a1 = a + PLAYER.slashArc / 2;
      const d = `M 0 0 L ${dcos(a0) * r} ${dsin(a0) * r} A ${r} ${r} 0 0 1 ${dcos(a1) * r} ${dsin(a1) * r} Z`;
      this.dynamic.addChild(new Sprite({ pos: { x: s.x, y: s.y }, z: 7, shape: { kind: 'path', d }, fill: PAL.slash, opacity: 0.55 }));
    }

    // HUD: hearts + keys + room name.
    for (let i = 0; i < PLAYER.hp; i++)
      this.dynamic.addChild(new Sprite({ pos: { x: 40 + i * 34, y: 40 }, z: 8, shape: { kind: 'circle', radius: 11 }, fill: i < s.hp ? PAL.heart : 'none', stroke: PAL.heart, strokeWidth: 2 }));
    if (s.keys > 0) this.dynamic.addChild(new Sprite({ pos: { x: 40 + PLAYER.hp * 34 + 10, y: 40 }, z: 8, shape: { kind: 'poly', points: [0, -10, 7, 0, 0, 10, -7, 0], closed: true }, fill: PAL.key }));
    this.dynamic.addChild(new Text({ pos: { x: 640, y: 40 }, size: 20, align: 'center', fill: PAL.text, text: `${room.name} · deaths ${s.deaths}` }));
  }
}

registerNode('GvView', () => new GvView({ name: 'gv-view' }));

export const gleamvaleGame = defineGame({
  title: 'Gleamvale',
  background: PAL.bg,
  inputMap: GV_INPUT_MAP,
  build(world) {
    world.state.gv = initialGv();
    return new GvView({ name: 'gv-view' });
  },
  probe(world) {
    const s = gvState(world);
    const rs = s.rooms[s.room];
    return { frame: world.frame, time: world.time, room: s.room, x: s.x, y: s.y, hp: s.hp, keys: s.keys, doorOpen: s.doorOpen, keyOnGround: s.keyOnGround, deaths: s.deaths, won: s.won, enemiesAlive: rs.enemies.filter((e) => e.hp > 0).length, enemies: rs.enemies.filter((e) => e.hp > 0).map((e) => ({ kind: e.kind, x: e.x, y: e.y, state: e.state })), orbs: s.orbs.length };
  },
});

export { ROOMS };

// Sproutveil: a four-room metroidvania. Canonical state (controller, room,
// abilities, pickups) lives in world.state; each room projects to a cosmetic
// tile view rebuilt on room change.

import {
  KENTO,
  Node,
  PARTICLE_PRESETS,
  Particles,
  Sprite,
  Text,
  TILE,
  audio,
  createPlatformerState,
  defineGame,
  hideScreen,
  mix,
  registerNode,
  showScreen,
  stepPlatformer,
  tileAt,
  type InputMap,
  type PadInput,
  type PlatformerState,
  type World,
} from '@hayao';
import { configFor, parseRoom, transition, ROOM_H, TILE_SIZE, type Ability } from './logic';

export const SV_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyZ'],
  dash: ['KeyX', 'ShiftLeft', 'ShiftRight'],
  restart: ['KeyR'],
};

export interface SvState {
  room: number;
  deaths: number;
  abilities: Ability[];
  taken: string[]; // pickup keys `${room}:${ability}` already collected
  won: boolean;
  p: PlatformerState;
  [key: string]: unknown;
}

const START = { room: 0, x: 112, y: 560 };
const PAL = {
  bg: KENTO.kuro,
  rock: KENTO.sumiSoft,
  rockLine: KENTO.stone,
  spike: KENTO.shu,
  sprout: KENTO.matsu,
  core: KENTO.gofun,
  seed: KENTO.ko,
  boots: KENTO.asagi,
  heart: KENTO.saku,
  text: KENTO.kinako,
};
const CFGW = 22;
const CFGH = 28;

function initPlayer(): PlatformerState {
  return createPlatformerState(START.x - CFGW / 2, START.y - CFGH / 2);
}

export function svState(world: World): SvState {
  return world.state.sv as SvState;
}

class SvView extends Node {
  override readonly type = 'SvView';
  private tiles = new Node({ name: 'tiles' });
  private dynamic = new Node({ name: 'dynamic' });
  private player!: Sprite;
  private hud!: Text;
  private fx = new Particles({ name: 'fx', seed: 11, z: 8 });
  private builtRoom = -1;

  protected override onReady(): void {
    this.tiles.cosmetic = true;
    this.dynamic.cosmetic = true;
    this.addChild(this.tiles);
    this.addChild(this.dynamic);
    this.addChild(this.fx);
    this.rebuild();
  }

  rebuild(): void {
    const s = svState(this.world as World);
    const room = parseRoom(s.room);
    this.builtRoom = s.room;
    for (const c of this.tiles.children.slice()) this.tiles.removeChild(c);
    for (const c of this.dynamic.children.slice()) this.dynamic.removeChild(c);

    const map = room.map;
    for (let ty = 0; ty < map.rows; ty++)
      for (let tx = 0; tx < map.cols; tx++) {
        const t = tileAt(map, tx, ty);
        if (t === TILE.EMPTY) continue;
        const pos = { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE };
        if (t === TILE.SOLID) this.tiles.addChild(new Sprite({ pos, z: 2, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.rock, stroke: PAL.rockLine, strokeWidth: 1 }));
        else if (t === TILE.HAZARD) this.tiles.addChild(new Sprite({ pos, z: 2, shape: { kind: 'poly', points: [-14, 16, 0, -14, 14, 16], closed: true }, fill: PAL.spike }));
      }
    for (const pu of room.pickups) {
      if (s.taken.includes(`${s.room}:${pu.ability}`)) continue;
      const fill = pu.ability === 'dj' ? PAL.seed : PAL.boots;
      this.dynamic.addChild(new Sprite({ name: `pickup-${pu.ability}`, pos: pu.at, z: 4, shape: { kind: 'poly', points: [0, -13, 9, 0, 0, 13, -9, 0], closed: true }, fill, stroke: KENTO.gofun, strokeWidth: 2 }));
    }
    if (room.heart) this.dynamic.addChild(new Sprite({ name: 'heart', pos: room.heart, z: 4, shape: { kind: 'circle', radius: 14 }, fill: PAL.heart, stroke: KENTO.gofun, strokeWidth: 3 }));
    this.player = this.dynamic.addChild(new Sprite({ name: 'sprout', z: 6, shape: { kind: 'circle', radius: 13 }, fill: PAL.sprout, stroke: PAL.core, strokeWidth: 3 }));
    this.hud = this.dynamic.addChild(new Text({ name: 'hud', pos: { x: 640, y: 34 }, size: 20, align: 'center', fill: PAL.text, text: '' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = svState(world);
    if (s.won) return;
    if (s.room !== this.builtRoom) this.rebuild();
    const input = world.input;
    if (input.justPressed('restart')) {
      s.p = initPlayer();
      s.room = START.room;
      return;
    }

    const room = parseRoom(s.room);
    const cfg = configFor(s.abilities);
    const pad: PadInput = {
      moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
      moveY: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
      jumpHeld: input.isDown('jump'),
      jumpPressed: input.justPressed('jump'),
      dashPressed: s.abilities.includes('dash') && input.justPressed('dash'),
    };
    const ev = stepPlatformer(s.p, pad, dt, room.map, cfg);
    const cx = s.p.x + CFGW / 2;
    const cy = s.p.y + CFGH / 2;

    if (ev.jumped) audio.blip(ev.airJumped ? 380 : 300);
    if (ev.airJumped) this.fx.burst(8, { x: cx, y: cy + 10 }, PARTICLE_PRESETS.sparkle());
    if (ev.dashed) {
      audio.blip(520);
      this.fx.burst(10, { x: cx, y: cy }, PARTICLE_PRESETS.burst([PAL.boots, mix(KENTO.asagi, KENTO.gofun, 0.5)]));
    }

    // Death: hazards or falling out through a closed border.
    const fellOut = s.p.y > ROOM_H && transition(s.room, cx, cy) === null;
    if (ev.died || fellOut) {
      s.deaths++;
      audio.blip(110);
      s.p = initPlayer();
      s.room = START.room;
      return;
    }

    // Room transitions.
    const t = transition(s.room, cx, cy);
    if (t) {
      s.room = t.room;
      s.p.x = t.x - CFGW / 2;
      s.p.y = t.y - CFGH / 2;
      return;
    }

    // Pickups + the Heart.
    for (const pu of room.pickups) {
      const key = `${s.room}:${pu.ability}`;
      if (s.taken.includes(key)) continue;
      const dx = cx - pu.at.x;
      const dy = cy - pu.at.y;
      if (dx * dx + dy * dy < 30 * 30) {
        s.taken.push(key);
        s.abilities.push(pu.ability);
        audio.success();
        this.fx.burst(20, pu.at, PARTICLE_PRESETS.sparkle());
        this.rebuild();
        showScreen({
          title: pu.ability === 'dj' ? 'Seed of Second Wind' : 'Dash Boots',
          body: pu.ability === 'dj' ? 'Press Jump again in the air.' : 'Press X / Shift to dash.',
          actions: [{ label: 'Onward', primary: true, onSelect: () => hideScreen() }],
        });
      }
    }
    if (room.heart) {
      const dx = cx - room.heart.x;
      const dy = cy - room.heart.y;
      if (dx * dx + dy * dy < 32 * 32) {
        s.won = true;
        audio.success();
        showScreen({ title: 'The Heart of the Veil', body: `Restored in ${s.deaths} deaths. The sprout blooms.`, actions: [{ label: 'Again', primary: true, onSelect: () => { Object.assign(s, initialSv()); hideScreen(); } }] });
        return;
      }
    }

    // View sync.
    this.player.pos = { x: cx, y: cy };
    this.hud.text = `${room.name} · abilities: ${s.abilities.length ? s.abilities.join(' + ') : 'none'} · deaths ${s.deaths}`;
  }
}

registerNode('SvView', () => new SvView({ name: 'sv-view' }));

function initialSv(): SvState {
  return { room: START.room, deaths: 0, abilities: [], taken: [], won: false, p: initPlayer() };
}

export const sproutveilGame = defineGame({
  title: 'Sproutveil',
  background: KENTO.kuro,
  inputMap: SV_INPUT_MAP,
  build(world) {
    world.state.sv = initialSv();
    return new SvView({ name: 'sv-view' });
  },
  probe(world) {
    const s = svState(world);
    return { frame: world.frame, time: world.time, room: s.room, deaths: s.deaths, abilities: [...s.abilities], won: s.won, x: s.p.x + CFGW / 2, y: s.p.y + CFGH / 2, vx: s.p.vx, vy: s.p.vy, onGround: s.p.onGround };
  },
});

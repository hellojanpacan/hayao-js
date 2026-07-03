// Shard Ascent: the platformer controller is the canonical sim (kept in
// world.state so it's hashed); the scene tree is a cosmetic projection of it.

import {
  DEFAULT_PLATFORMER,
  Node,
  PARTICLE_PRESETS,
  Particles,
  Shaker,
  Sprite,
  Text,
  audio,
  createPlatformerState,
  defineGame,
  hideScreen,
  showScreen,
  stepPlatformer,
  tileAt,
  TILE,
  type InputMap,
  type PadInput,
  type PlatformerState,
  type World,
} from '@hayao';
import { LEVELS, TILE_SIZE, nearPoint, parseLevel, platformsAt, type ParsedLevel } from './logic';

export const SA_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyZ'],
  dash: ['KeyX', 'ShiftLeft', 'ShiftRight'],
  restart: ['KeyR'],
};

export interface SaState {
  level: number;
  deaths: number;
  shard: boolean;
  won: boolean;
  p: PlatformerState;
  [key: string]: unknown;
}

const CFG = DEFAULT_PLATFORMER;
const PAL = { bg: '#10131d', rock: '#2a3147', rockLine: '#3c4560', oneway: '#57628a', spike: '#b8405e', wisp: '#3fd8e0', wispCore: '#d9fbfd', shard: '#ffc857', gate: '#5a6a8c', gateOpen: '#8fe8b0', text: '#8ea3bd' };

function initState(level = 0): SaState {
  const { spawn } = parseLevel(level);
  return { level, deaths: 0, shard: false, won: false, p: createPlatformerState(spawn.x - CFG.width / 2, spawn.y + TILE_SIZE / 2 - CFG.height) };
}

export function saState(world: World): SaState {
  return world.state.sa as SaState;
}

/** Test/verify affordance: jump straight to a level. */
export function gotoLevel(world: World, level: number): void {
  const s = saState(world);
  const fresh = initState(level);
  s.level = fresh.level;
  s.shard = false;
  s.won = false;
  s.p = fresh.p;
  const view = world.root.find('sa-view') as SaView | null;
  if (view?.world) view.rebuild(); // if not yet in-tree, onProcess rebuilds on first step
}

class SaView extends Node {
  override readonly type = 'SaView';
  private tiles = new Node({ name: 'tiles' });
  private dynamic = new Node({ name: 'dynamic' });
  private player!: Sprite;
  private shardSprite: Sprite | null = null;
  private gate!: Sprite;
  private hud!: Text;
  private fx = new Particles({ name: 'fx', seed: 5, z: 8 });
  private shaker = new Shaker({ name: 'shake', seed: 9 });
  private parsed!: ParsedLevel;
  private builtLevel = -1;

  protected override onReady(): void {
    this.tiles.cosmetic = true;
    this.dynamic.cosmetic = true;
    this.addChild(this.shaker);
    this.shaker.addChild(this.tiles);
    this.shaker.addChild(this.dynamic);
    this.shaker.addChild(this.fx);
    this.rebuild();
  }

  rebuild(): void {
    const s = saState(this.world as World);
    this.parsed = parseLevel(s.level);
    this.builtLevel = s.level;
    for (const c of this.tiles.children.slice()) this.tiles.removeChild(c);
    for (const c of this.dynamic.children.slice()) this.dynamic.removeChild(c);
    const { map, def, shard, exit } = this.parsed;

    for (let ty = 0; ty < map.rows; ty++)
      for (let tx = 0; tx < map.cols; tx++) {
        const t = tileAt(map, tx, ty);
        if (t === TILE.EMPTY) continue;
        const pos = { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE };
        if (t === TILE.SOLID) this.tiles.addChild(new Sprite({ pos, z: 2, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.rock, stroke: PAL.rockLine, strokeWidth: 1 }));
        else if (t === TILE.ONEWAY) this.tiles.addChild(new Sprite({ pos: { x: pos.x, y: pos.y - 10 }, z: 2, shape: { kind: 'rect', w: TILE_SIZE - 2, h: 8, r: 3 }, fill: PAL.oneway }));
        else if (t === TILE.HAZARD) this.tiles.addChild(new Sprite({ pos, z: 2, shape: { kind: 'poly', points: [-14, 16, 0, -14, 14, 16], closed: true }, fill: PAL.spike }));
      }

    // Exit gate + shard + movers + player + HUD (in dynamic layer).
    this.gate = this.dynamic.addChild(new Sprite({ name: 'gate', pos: exit, z: 3, shape: { kind: 'rect', w: 30, h: 46, r: 8 }, fill: 'none', stroke: PAL.gate, strokeWidth: 4 }));
    this.shardSprite = null;
    if (shard) this.shardSprite = this.dynamic.addChild(new Sprite({ name: 'shard', pos: shard, z: 4, shape: { kind: 'poly', points: [0, -14, 9, 0, 0, 14, -9, 0], closed: true }, fill: PAL.shard, stroke: '#fff2c9', strokeWidth: 2 }));
    def.movers.forEach((m, i) => this.dynamic.addChild(new Sprite({ name: `mover-${i}`, z: 3, shape: { kind: 'rect', w: m.w, h: m.h, r: 6 }, fill: PAL.oneway, stroke: PAL.rockLine, strokeWidth: 2 })));
    this.player = this.dynamic.addChild(new Sprite({ name: 'wisp', z: 6, shape: { kind: 'circle', radius: 13 }, fill: PAL.wisp, stroke: PAL.wispCore, strokeWidth: 3 }));
    this.dynamic.addChild(new Sprite({ name: 'hud-scrim', pos: { x: 640, y: 16 }, z: 9, shape: { kind: 'rect', w: 1280, h: 34 }, fill: '#0b0e16', opacity: 0.92 }));
    this.hud = this.dynamic.addChild(new Text({ name: 'hud', pos: { x: 640, y: 22 }, z: 10, size: 17, align: 'center', fill: '#dbe6f2', text: '' }));
  }

  private die(s: SaState): void {
    s.deaths++;
    audio.blip(110);
    this.fx.burst(26, this.center(s.p), PARTICLE_PRESETS.hit([PAL.wisp, PAL.wispCore]));
    this.shaker.addTrauma(0.55);
    const fresh = initState(s.level);
    s.p = fresh.p;
    s.shard = s.shard && !this.parsed.def.needsShard ? s.shard : false;
  }

  private center(p: PlatformerState): { x: number; y: number } {
    return { x: p.x + CFG.width / 2, y: p.y + CFG.height / 2 };
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = saState(world);
    if (s.won) return;
    if (s.level !== this.builtLevel) this.rebuild();
    const input = world.input;
    if (input.justPressed('restart')) {
      const fresh = initState(s.level);
      s.p = fresh.p;
      s.shard = false;
    }

    const pad: PadInput = {
      moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
      moveY: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
      jumpHeld: input.isDown('jump'),
      jumpPressed: input.justPressed('jump'),
      dashPressed: input.justPressed('dash'),
    };
    const plats = platformsAt(s.level, world.time, dt);
    const ev = stepPlatformer(s.p, pad, dt, this.parsed.map, CFG, plats);
    const c = this.center(s.p);

    // Feel hooks.
    if (ev.jumped) {
      audio.blip(ev.wallJumped ? 340 : 300);
      this.fx.burst(6, { x: c.x, y: s.p.y + CFG.height }, PARTICLE_PRESETS.dust());
    }
    if (ev.dashed) {
      audio.blip(520);
      this.shaker.addTrauma(0.18);
      this.fx.burst(10, c, PARTICLE_PRESETS.burst([PAL.wisp, PAL.wispCore, '#9ef7ff']));
    }
    if (ev.landed) this.fx.burst(5, { x: c.x, y: s.p.y + CFG.height }, PARTICLE_PRESETS.dust());
    if (ev.died || s.p.y > this.parsed.map.rows * TILE_SIZE) {
      this.die(s);
      s.p.dead = false;
      return;
    }

    // Pickups + exit.
    if (this.parsed.shard && !s.shard && nearPoint(c.x, c.y, this.parsed.shard)) {
      s.shard = true;
      audio.blip(760);
      this.fx.burst(18, this.parsed.shard, PARTICLE_PRESETS.sparkle());
    }
    const gateOpen = !this.parsed.def.needsShard || s.shard;
    if (gateOpen && nearPoint(c.x, c.y, this.parsed.exit, 34)) {
      audio.success();
      if (s.level >= LEVELS.length - 1) {
        s.won = true;
        showScreen({ title: 'Summit reached!', body: `The spire is lit. Deaths: ${s.deaths}.`, actions: [{ label: 'Climb again', primary: true, onSelect: () => { const f = initState(0); Object.assign(s, f); hideScreen(); } }] });
      } else {
        s.level++;
        s.shard = false;
        const fresh = initState(s.level);
        s.p = fresh.p;
      }
      return;
    }

    // View sync (cosmetic).
    this.player.pos = { x: c.x, y: c.y };
    const stretch = Math.min(0.35, Math.abs(s.p.vy) / 2000);
    this.player.scale = { x: 1 - stretch * 0.5, y: 1 + stretch };
    if (this.shardSprite) this.shardSprite.visible = !s.shard;
    this.gate.paint.stroke = gateOpen ? PAL.gateOpen : PAL.gate;
    this.parsed.def.movers.forEach((m, i) => {
      const node = this.dynamic.find(`mover-${i}`);
      if (node) node.pos = { x: plats[i].x + m.w / 2, y: m.y + m.h / 2 };
    });
    this.hud.text = `${s.level + 1}/${LEVELS.length} · ${this.parsed.def.name} — ${this.parsed.def.hint} · X dashes · deaths ${s.deaths}`;
  }
}

export const shardAscentGame = defineGame({
  title: 'Shard Ascent',
  background: PAL.bg,
  inputMap: SA_INPUT_MAP,
  build(world) {
    world.state.sa = initState(0);
    return new SaView({ name: 'sa-view' });
  },
  probe(world) {
    const s = saState(world);
    return { frame: world.frame, time: world.time, level: s.level, deaths: s.deaths, shard: s.shard, won: s.won, x: s.p.x + CFG.width / 2, y: s.p.y + CFG.height / 2, vx: s.p.vx, vy: s.p.vy, onGround: s.p.onGround };
  },
});

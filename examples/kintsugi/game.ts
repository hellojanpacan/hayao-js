// Kintsugi — the scene: a view over the pure sim (world.state.kg). Rooms are one
// screen each (40×22 tiles ≈ 1280×704), so there's no camera scroll — a room is
// a woodblock print you stand inside. Autotiled walls, a gradient/parallax
// backdrop per biome, glowing shrines, and the animated Mender. All cosmetic; the
// hash is world.state.kg only.

import {
  Node,
  Sprite,
  Text,
  audio,
  linearGradient,
  radialGradient,
  glow,
  withAlpha,
  mix,
  KENTO,
  composeTransform,
  IDENTITY,
  gridFromRows,
  autotileToCommands,
  defineGame,
  showScreen,
  hideScreen,
  registerNode,
  type World,
  type InputMap,
  type DrawCommand,
  type Transform,
} from '@hayao';
import { KINTSUGI_WORLD, ABILITY_ORDER, BIOMES } from './world';
import { initialState, stepKintsugi, padFrom, pickupsIn, mapFor, START_HP, type KgState } from './logic';
import { roomRows, MARK_PICKUPS, RW, RH, TS } from './rooms';
import { biomeArt } from './biome';
import { menderNode, motionFrom } from './mender';

export const KG_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyZ', 'KeyK'],
  dash: ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyL'],
  attack: ['KeyC', 'KeyJ'],
  restart: ['KeyR'],
};

const VIEW_W = RW * TS; // 1280
const VIEW_H = 720;

const biomeOf = (region: string): string => KINTSUGI_WORLD.regions.find((r) => r.id === region)?.biome ?? 'grove';
const biomeMeta = (id: string) => BIOMES.find((b) => b.id === id);

/** A node that blits precomputed draw commands (e.g. autotile output). */
class Blit extends Node {
  override readonly type = 'Blit';
  private cmds: DrawCommand[];
  constructor(cmds: DrawCommand[], z = 0) {
    super({});
    this.cmds = cmds;
    this.z = z;
    this.cosmetic = true;
  }
  protected override draw(out: DrawCommand[], world: Transform): void {
    for (const c of this.cmds) out.push({ ...c, transform: composeTransform(world, c.transform ?? IDENTITY) });
  }
}

class KintsugiView extends Node {
  override readonly type = 'KintsugiView';
  private room = new Node({ name: 'room' });
  private actor = new Node({ name: 'actor' });
  private hud = new Node({ name: 'hud' });
  private phase = 0;
  private viewAttack = 0;
  private hurtView = 0;
  private sig = '';
  private shownBeats = new Set<string>();
  private ended = false;

  private get kg(): KgState {
    const w = this.world as World;
    if (!(w.state as Record<string, unknown>).kg) (w.state as Record<string, unknown>).kg = initialState();
    return (w.state as Record<string, unknown>).kg as KgState;
  }

  protected override onReady(): void {
    this.room.cosmetic = true;
    this.actor.cosmetic = true;
    this.hud.cosmetic = true;
    this.addChild(this.room);
    this.addChild(this.actor);
    this.addChild(this.hud);
    this.rebuildRoom();
    this.buildHud();
  }

  // ── room rendering ────────────────────────────────────────────────
  private rebuildRoom(): void {
    for (const c of this.room.children.slice()) this.room.removeChild(c);
    const kg = this.kg;
    const region = kg.region;
    const art = biomeArt(biomeOf(region));
    const rows = roomRows(region)!;

    // backdrop sky
    this.room.addChild(new Sprite({ pos: { x: VIEW_W / 2, y: VIEW_H / 2 }, z: -100, shape: { kind: 'rect', w: VIEW_W + 20, h: VIEW_H + 20 }, gradient: linearGradient([art.skyTop, mix(art.skyTop, art.skyBot, 0.5), art.skyBot], 90) }));
    // distant silhouettes (cheap parallax feel — static per room)
    for (let i = 0; i < 4; i++) {
      const x = 160 + i * 320;
      const h = 150 + ((i * 53) % 90);
      this.room.addChild(new Sprite({ pos: { x, y: VIEW_H - 120 }, z: -90, shape: { kind: 'poly', points: [-160, 120, -70, -h + 120, 20, 40, 110, -h + 60, 190, 120], closed: true }, fill: withAlpha(art.far, 0.55) }));
    }

    // walls (autotiled woodblock)
    const grid = gridFromRows(rows, '#');
    const wallCmds = autotileToCommands(grid, { tile: TS, x: 0, y: 0, fill: art.wall, edge: art.wallEdge, edgeWidth: 2.5 });
    this.room.addChild(new Blit(wallCmds, 10));

    // hazards + one-way platforms + markers, read from the tilemap/ascii
    const map = mapFor(region);
    for (let ty = 0; ty < RH; ty++) {
      for (let tx = 0; tx < RW; tx++) {
        const t = map.tiles[ty * RW + tx];
        if (t === 3) this.addSpikes(tx, ty, art.hazard); // HAZARD
        else if (t === 2) this.room.addChild(new Sprite({ pos: { x: tx * TS + TS / 2, y: ty * TS + 3 }, z: 11, shape: { kind: 'rect', w: TS, h: 6, r: 3 }, fill: art.accent, stroke: art.wallEdge, strokeWidth: 1.5 })); // ONEWAY
      }
    }
    this.addMarkers(region, kg.taken, art);

    // fog / vignette
    this.room.addChild(new Sprite({ pos: { x: VIEW_W / 2, y: VIEW_H / 2 }, z: 45, shape: { kind: 'rect', w: VIEW_W, h: VIEW_H }, gradient: radialGradient([withAlpha(KENTO.yohaku, 0), withAlpha(KENTO.yohaku, 0.28)], { r: 0.75 }) }));

    this.sig = `${region}|${kg.taken.length}`;
  }

  private addSpikes(tx: number, ty: number, color: string): void {
    const g = new Node({ pos: { x: tx * TS, y: ty * TS }, z: 12 });
    for (let i = 0; i < 3; i++) {
      const sx = 5 + i * 10;
      g.addChild(new Sprite({ z: 12, shape: { kind: 'poly', points: [sx, TS, sx + 5, TS - 16, sx + 10, TS], closed: true }, fill: color, stroke: KENTO.sumi, strokeWidth: 1.5 }));
    }
    this.room.addChild(g);
  }

  private addMarkers(region: string, taken: readonly string[], art: ReturnType<typeof biomeArt>): void {
    const rows = roomRows(region)!;
    for (let ty = 0; ty < RH; ty++) {
      const row = rows[ty];
      for (let tx = 0; tx < RW; tx++) {
        const ch = row[tx];
        const px = tx * TS + TS / 2;
        const py = ty * TS + TS / 2;
        if (ch === 'S' && !taken.includes(MARK_PICKUPS.S)) this.addShrine(px, py, 'ability');
        else if (ch === 'E' && !taken.includes(MARK_PICKUPS.E)) this.addShard(px, py);
        else if (ch === 'K') this.addSaveShrine(px, py);
        void art;
      }
    }
  }

  private addShrine(x: number, y: number, _kind: string): void {
    const g = new Node({ pos: { x, y }, z: 20 });
    g.addChild(new Sprite({ z: 19, shape: { kind: 'circle', radius: 46 }, gradient: radialGradient([withAlpha(KENTO.ko, 0.5), withAlpha(KENTO.ko, 0)]), shadow: glow(withAlpha(KENTO.ko, 0.8), 26) }));
    g.addChild(new Sprite({ pos: { x: 0, y: 12 }, z: 20, shape: { kind: 'rect', w: 22, h: 40, r: 6 }, gradient: linearGradient([mix(KENTO.gofun, KENTO.ko, 0.4), KENTO.kakiDeep], 90), stroke: KENTO.sumi, strokeWidth: 2.5 }));
    g.addChild(new Sprite({ pos: { x: 0, y: -8 }, z: 21, shape: { kind: 'circle', radius: 9 }, gradient: radialGradient([KENTO.gofun, KENTO.ko]), shadow: glow(KENTO.ko, 10) }));
    this.room.addChild(g);
  }
  private addShard(x: number, y: number): void {
    const g = new Node({ pos: { x, y }, z: 20 });
    g.addChild(new Sprite({ z: 19, shape: { kind: 'circle', radius: 26 }, gradient: radialGradient([withAlpha(KENTO.ko, 0.55), withAlpha(KENTO.ko, 0)]), shadow: glow(withAlpha(KENTO.ko, 0.9), 16) }));
    g.addChild(new Sprite({ z: 20, shape: { kind: 'poly', points: [0, -12, 9, 0, 0, 12, -9, 0], closed: true }, gradient: linearGradient([KENTO.gofun, KENTO.ko], 90), stroke: KENTO.kakiDeep, strokeWidth: 1.5 }));
    this.room.addChild(g);
  }
  private addSaveShrine(x: number, y: number): void {
    const g = new Node({ pos: { x, y }, z: 20 });
    g.addChild(new Sprite({ z: 19, shape: { kind: 'circle', radius: 30 }, gradient: radialGradient([withAlpha(KENTO.ko, 0.4), withAlpha(KENTO.ko, 0)]), shadow: glow(withAlpha(KENTO.ko, 0.6), 16) }));
    g.addChild(new Sprite({ pos: { x: 0, y: 8 }, z: 20, shape: { kind: 'rect', w: 30, h: 14, r: 4 }, fill: KENTO.stone, stroke: KENTO.sumi, strokeWidth: 2 })); // anvil
    g.addChild(new Sprite({ pos: { x: 0, y: -4 }, z: 21, shape: { kind: 'rect', w: 6, h: 16, r: 2 }, fill: KENTO.kakiDeep, shadow: glow(KENTO.ko, 6) })); // gold seam
    this.room.addChild(g);
  }

  // ── HUD ───────────────────────────────────────────────────────────
  private buildHud(): void {
    // rebuilt each frame in updateHud; container only here
  }
  private updateHud(): void {
    for (const c of this.hud.children.slice()) this.hud.removeChild(c);
    const kg = this.kg;
    // hearts
    for (let i = 0; i < kg.maxHp; i++) {
      const on = i < kg.hp;
      const x = 40 + i * 34;
      this.hud.addChild(new Sprite({ pos: { x, y: 40 }, z: 100, shape: { kind: 'circle', radius: 12 }, fill: on ? KENTO.shu : withAlpha(KENTO.sumi, 0.5), stroke: KENTO.gofun, strokeWidth: 2, shadow: on ? glow(withAlpha(KENTO.shu, 0.6), 6) : undefined }));
      // a gold kintsugi seam across the heart
      this.hud.addChild(new Sprite({ pos: { x, y: 40 }, z: 101, shape: { kind: 'poly', points: [-7, -5, 2, 1, -3, 8], closed: false }, stroke: KENTO.ko, strokeWidth: 1.6, round: true, fill: 'none' }));
    }
    // recovered seams (abilities), top-right
    ABILITY_ORDER.forEach((ab, i) => {
      const has = kg.abilities.includes(ab);
      const x = VIEW_W - 40 - i * 30;
      this.hud.addChild(new Sprite({ pos: { x, y: 40 }, z: 100, shape: { kind: 'rect', w: 8, h: 22, r: 4 }, fill: has ? KENTO.ko : withAlpha(KENTO.sumi, 0.5), stroke: KENTO.gofun, strokeWidth: 1.5, shadow: has ? glow(withAlpha(KENTO.ko, 0.8), 6) : undefined }));
    });
  }

  // ── actor ─────────────────────────────────────────────────────────
  private updateActor(): void {
    for (const c of this.actor.children.slice()) this.actor.removeChild(c);
    const kg = this.kg;
    const p = kg.p;
    const attacking = this.viewAttack > 0;
    const motion = motionFrom(p.onGround, p.vx, p.vy, p.dashing > 0, attacking, this.hurtView > 0);
    const node = menderNode({
      x: p.x, y: p.y, w: 20, h: 36, facing: p.facing, phase: this.phase, motion,
      attackT: attacking ? 1 - this.viewAttack / 0.28 : 0,
      hurtT: this.hurtView > 0 ? this.hurtView / 0.3 : 0,
    });
    node.pos = { x: p.x + 10, y: p.y + 18 };
    this.actor.addChild(node);
  }

  // ── loop ──────────────────────────────────────────────────────────
  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const w = this.world as World;
    const input = w.input;
    this.phase += dt;
    if (this.viewAttack > 0) this.viewAttack = Math.max(0, this.viewAttack - dt);
    if (this.hurtView > 0) this.hurtView = Math.max(0, this.hurtView - dt);

    if (input.justPressed('restart')) return this.restart();
    const kg = this.kg;
    if (kg.won) {
      if (!this.ended) this.win();
      return;
    }
    if (input.justPressed('attack') && this.viewAttack <= 0) {
      this.viewAttack = 0.28;
      audio.blip(300);
    }

    const pad = padFrom(input);
    const ev = stepKintsugi(kg, pad, dt);

    if (ev.jumped) audio.blip(520);
    if (ev.dashed) audio.blip(380);
    if (ev.picked) audio.chime();
    if (ev.saved) audio.success();
    if (ev.died) { audio.blip(150); this.hurtView = 0.3; }

    // story beat on first entry to a biome
    const biome = biomeOf(kg.region);
    if (!this.shownBeats.has(biome)) {
      this.shownBeats.add(biome);
      const meta = biomeMeta(biome);
      if (meta) this.flashBiomeName(meta.name);
    }

    if (this.sig !== `${kg.region}|${kg.taken.length}`) this.rebuildRoom();
    this.updateActor();
    this.updateHud();
  }

  private flashBiomeName(name: string): void {
    const t = new Text({ name: 'biomeName', text: name, pos: { x: VIEW_W / 2, y: 130 }, z: 105, size: 40, align: 'center', fill: KENTO.gofun, font: 'Georgia, serif' });
    this.hud.addChild(t);
    // a simple fade via a timer node would be nicer; for now it lives until room rebuild
  }

  private win(): void {
    this.ended = true;
    audio.success();
    const kg = this.kg;
    showScreen({
      title: 'The kiln is relit.',
      body: `The seams hold. Light returns to the world. You mended it with ${kg.abilities.length} golden powers and ${kg.taken.length - kg.abilities.length} ember shards, falling ${kg.deaths} times along the way.`,
      actions: [{ label: 'Begin again', primary: true, onSelect: () => this.restart() }],
    });
  }

  restart(): void {
    const w = this.world as World;
    (w.state as Record<string, unknown>).kg = initialState();
    this.ended = false;
    this.shownBeats.clear();
    this.phase = 0;
    hideScreen();
    this.rebuildRoom();
    this.updateActor();
    this.updateHud();
  }
}

registerNode('KintsugiView', () => new KintsugiView());
registerNode('Blit', () => new Blit([]));

export function makeKintsugiRoot(): KintsugiView {
  return new KintsugiView({ name: 'kintsugi' });
}

export const kintsugiGame = defineGame({
  title: 'Kintsugi',
  width: VIEW_W,
  height: VIEW_H,
  background: KENTO.yohaku,
  inputMap: KG_INPUT_MAP,
  build: () => makeKintsugiRoot(),
  probe: (world) => {
    const kg = ((world.state as Record<string, unknown>).kg as KgState) ?? initialState();
    return {
      frame: world.frame,
      hash: world.hash(),
      region: kg.region,
      biome: biomeOf(kg.region),
      x: Math.round(kg.p.x),
      y: Math.round(kg.p.y),
      abilities: kg.abilities.length,
      taken: kg.taken.length,
      hp: kg.hp,
      deaths: kg.deaths,
      won: kg.won,
    };
  },
});

export { START_HP, pickupsIn };

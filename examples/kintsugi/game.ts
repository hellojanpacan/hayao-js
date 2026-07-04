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
  dhypot,
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
import { roomRows, markerPos, RW, RH, TS } from './rooms';
import { biomeArt } from './biome';
import { menderNode, motionFrom } from './mender';
import { ATTACK_TIME, IFRAMES, type EnemyState } from './combat';
import { MusicDirector } from './music';
import { StoryCards, ABILITY_LINES, SHARD_LINE, GUARDIAN_INTRO } from './story';

const PROLOGUE_SUB = 'Mend the broken world — seam by golden seam.';

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
const firstSentence = (s: string): string => {
  const i = s.indexOf('. ');
  return i >= 0 ? s.slice(0, i + 1) : s;
};

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
  private sig = '';
  private shownBeats = new Set<string>();
  private ended = false;
  private music = new MusicDirector();
  private lastBiome = '';
  private story!: StoryCards;
  private shownGuardians = new Set<string>();

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
    this.story = new StoryCards(this.hud);
    this.rebuildRoom();
    this.buildHud();
    this.story.card('Kintsugi', PROLOGUE_SUB, 8);
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
    this.addMarkers(region, kg.taken);

    // fog / vignette
    this.room.addChild(new Sprite({ pos: { x: VIEW_W / 2, y: VIEW_H / 2 }, z: 45, shape: { kind: 'rect', w: VIEW_W, h: VIEW_H }, gradient: radialGradient([withAlpha(KENTO.yohaku, 0), withAlpha(KENTO.yohaku, 0.28)], { r: 0.75 }) }));

    // controls hint in the tutorial grove
    if (biomeOf(region) === 'grove') {
      this.room.addChild(new Sprite({ pos: { x: VIEW_W / 2, y: VIEW_H - 30 }, z: 46, shape: { kind: 'rect', w: 900, h: 34, r: 10 }, fill: withAlpha(KENTO.sumi, 0.7), stroke: KENTO.kinako, strokeWidth: 1.5 }));
      this.room.addChild(new Text({ name: 'controls', text: 'Arrows move · Z jump · X dash · C strike · R restart', pos: { x: VIEW_W / 2, y: VIEW_H - 30 }, z: 47, size: 18, align: 'center', fill: KENTO.gofun }));
    }

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

  private addMarkers(region: string, taken: readonly string[]): void {
    for (const p of KINTSUGI_WORLD.pickups) {
      if (p.region !== region || taken.includes(p.id)) continue;
      const isShard = p.grants.startsWith('shard:');
      const pos = markerPos(region, isShard ? 'E' : 'P');
      if (!pos) continue;
      if (isShard) this.addShard(pos.x, pos.y);
      else this.addShrine(pos.x, pos.y, 'ability');
    }
    const save = markerPos(region, 'K');
    if (save) this.addSaveShrine(save.x, save.y);
    const kiln = markerPos(region, 'W');
    if (kiln) this.addKiln(kiln.x, kiln.y);
  }

  /** The heart-kiln (the goal): a great warm beacon to relight. */
  private addKiln(x: number, y: number): void {
    const g = new Node({ pos: { x, y }, z: 20 });
    g.addChild(new Sprite({ z: 18, shape: { kind: 'circle', radius: 120 }, gradient: radialGradient([withAlpha(KENTO.ko, 0.5), withAlpha(KENTO.kaki, 0.2), withAlpha(KENTO.kaki, 0)]), shadow: glow(withAlpha(KENTO.ko, 0.9), 50) }));
    g.addChild(new Sprite({ pos: { x: 0, y: 20 }, z: 20, shape: { kind: 'rect', w: 90, h: 70, r: 16 }, gradient: linearGradient([mix(KENTO.stone, KENTO.kakiDeep, 0.4), KENTO.sumi], 90), stroke: KENTO.sumi, strokeWidth: 3 }));
    g.addChild(new Sprite({ pos: { x: 0, y: 24 }, z: 21, shape: { kind: 'circle', radius: 26 }, gradient: radialGradient([KENTO.gofun, KENTO.ko, withAlpha(KENTO.kakiDeep, 0)]), shadow: glow(KENTO.ko, 24) }));
    this.room.addChild(g);
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
    // enemies (behind the Mender)
    for (const e of kg.enemies) this.actor.addChild(this.enemyNode(e));
    for (const o of kg.orbs) this.actor.addChild(new Sprite({ pos: { x: o.x, y: o.y }, z: 26, shape: { kind: 'circle', radius: 7 }, gradient: radialGradient([KENTO.gofun, KENTO.shu, withAlpha(KENTO.shuDeep, 0)]), shadow: glow(withAlpha(KENTO.shu, 0.9), 10) }));

    const p = kg.p;
    const attacking = kg.atk > 0;
    const justHurt = kg.iframes > IFRAMES - 0.22;
    // blink while invulnerable
    if (kg.iframes > 0 && !justHurt && Math.floor(this.phase * 20) % 2 === 0) return;
    const motion = motionFrom(p.onGround, p.vx, p.vy, p.dashing > 0, attacking, justHurt);
    const node = menderNode({
      x: p.x, y: p.y, w: 20, h: 36, facing: p.facing, phase: this.phase, motion,
      attackT: attacking ? 1 - kg.atk / ATTACK_TIME : 0,
      hurtT: justHurt ? 1 : 0,
    });
    node.pos = { x: p.x + 10, y: p.y + 18 };
    this.actor.addChild(node);
  }

  /** A grief-hardened guardian: dark cracked ceramic with red seams + a lit eye. */
  private enemyNode(e: EnemyState): Node {
    const g = new Node({ pos: { x: e.x + e.w / 2, y: e.y + e.h / 2 }, z: 25 });
    g.cosmetic = true;
    const tell = e.st === 'tell';
    const body = mix(KENTO.sumi, KENTO.kuro, 0.4);
    g.addChild(new Sprite({ z: 24, shape: { kind: 'circle', radius: e.w * 0.7 }, fill: withAlpha(KENTO.yohaku, 0.2) }));
    if (e.kind === 'mote') {
      g.addChild(new Sprite({ z: 25, shape: { kind: 'poly', points: [0, -e.h / 2, e.w / 2, 0, 0, e.h / 2, -e.w / 2, 0], closed: true }, fill: body, stroke: KENTO.shuDeep, strokeWidth: 2, shadow: tell ? glow(withAlpha(KENTO.shu, 0.9), 12) : undefined }));
    } else {
      g.addChild(new Sprite({ z: 25, shape: { kind: 'rect', w: e.w, h: e.h, r: e.w * 0.32 }, fill: body, stroke: KENTO.shuDeep, strokeWidth: 2.5, shadow: e.hurt > 0 ? glow(KENTO.gofun, 10) : undefined }));
    }
    // red grief seams
    g.addChild(new Sprite({ z: 26, shape: { kind: 'poly', points: [-e.w * 0.2, -e.h * 0.2, e.w * 0.05, 0, -e.w * 0.1, e.h * 0.24], closed: false }, stroke: KENTO.shu, strokeWidth: 1.6, round: true, fill: 'none', shadow: glow(withAlpha(KENTO.shu, 0.6), 4) }));
    // eye
    g.addChild(new Sprite({ pos: { x: e.face * e.w * 0.16, y: -e.h * 0.08 }, z: 27, shape: { kind: 'circle', radius: 3 }, fill: e.hurt > 0 ? KENTO.gofun : KENTO.shu, shadow: glow(KENTO.shu, 5) }));
    return g;
  }

  // ── loop ──────────────────────────────────────────────────────────
  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const w = this.world as World;
    const input = w.input;
    this.phase += dt;

    if (input.justPressed('restart')) return this.restart();
    const kg = this.kg;
    if (kg.won) {
      if (!this.ended) this.win();
      return;
    }

    const pad = padFrom(input);
    const ev = stepKintsugi(kg, pad, dt, input.justPressed('attack'));

    if (ev.attacked) audio.blip(300);
    if (ev.jumped) audio.blip(520);
    if (ev.dashed) audio.blip(380);
    if (ev.hitEnemy) audio.blip(680);
    if (ev.killed > 0) audio.chime();
    if (ev.hurt) audio.blip(180);
    if (ev.picked) audio.chime();
    if (ev.saved) audio.success();
    if (ev.died) audio.blip(150);

    // story beats + adaptive music on entering a biome / room
    const biome = biomeOf(kg.region);
    if (biome !== this.lastBiome) {
      this.music.setBiome(biome);
      this.lastBiome = biome;
    }
    if (!this.shownBeats.has(biome)) {
      this.shownBeats.add(biome);
      const meta = biomeMeta(biome);
      if (meta) this.story.card(meta.name, firstSentence(meta.beat));
    }
    const intro = GUARDIAN_INTRO[kg.region];
    if (intro && !this.shownGuardians.has(kg.region)) {
      this.shownGuardians.add(kg.region);
      this.story.card(biomeMeta(biome)?.name ?? '', intro, 6);
    }
    if (ev.picked) {
      const pk = KINTSUGI_WORLD.pickups.find((p) => p.id === ev.picked);
      const line = pk && !pk.grants.startsWith('shard:') ? ABILITY_LINES[pk.grants] : SHARD_LINE;
      if (line) this.story.line(line, kg.p.x + 10, kg.p.y - 24);
    }
    // threat intensity → music adapts (percussion, tempo, darker melody)
    let inten = kg.iframes > 0 ? 0.6 : 0;
    for (const e of kg.enemies) {
      const d = dhypot(e.x + e.w / 2 - (kg.p.x + 10), e.y + e.h / 2 - (kg.p.y + 15));
      inten = Math.max(inten, 1 - d / 380);
    }
    this.music.update(dt, Math.max(0, Math.min(1, inten)));
    this.story.update(dt);

    if (this.sig !== `${kg.region}|${kg.taken.length}`) this.rebuildRoom();
    this.updateActor();
    this.updateHud();
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
    this.shownGuardians.clear();
    this.lastBiome = '';
    this.phase = 0;
    hideScreen();
    this.story.clear();
    this.story.card('Kintsugi', PROLOGUE_SUB, 8);
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

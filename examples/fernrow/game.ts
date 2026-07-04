// Fernrow: a sunlit smallholding drawn in the house woodblock style — a washi
// field with tonal grain and a fence, grass turning to tilled earthen furrows,
// a blue sheen where you've watered, little plants that swell from sprout to a
// crop-coloured ripe, and a straw-hatted farmer. Gentle pace, seasonal HUD.
//
// ART: the fence + ground + corner trees are static scenery, built ONCE in
// onReady from a STANDALONE rng (never world.rng) under a cosmetic node, so none
// of it enters world.hash(). The plots, crops, and farmer are the dynamic view,
// pooled and re-synced each frame. Determinism is untouched; the golden held.

import { KENTO, Node, NodePool, Sprite, Text, Rng, audio, blobPath, mutateColor, withAlpha, mix, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { initialFr, pidx, seasonOf, stepFr, CROPS, FARM_H, FARM_W, GOAL_COINS, SEASON_CROP, YEAR_DAYS, type FrAction, type FrState } from './logic';

export const FR_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  till: ['KeyT', 'Digit1'],
  plant: ['KeyP', 'Digit2'],
  water: ['KeyO', 'Digit3'],
  harvest: ['KeyH', 'Digit4'],
  sleep: ['KeyZ', 'Enter'],
  restart: ['KeyR'],
};

const CELL = 96;
const OX = 640 - (FARM_W * CELL) / 2 + CELL / 2;
const OY = 380 - (FARM_H * CELL) / 2 + CELL / 2;
const at = (x: number, y: number) => ({ x: OX + x * CELL, y: OY + y * CELL });
// Farm bounds (tile edges) for the fence.
const FX0 = OX - CELL / 2, FY0 = OY - CELL / 2;
const FW = FARM_W * CELL, FH = FARM_H * CELL;

const PAL = {
  paper: KENTO.washi,
  grass: mix(KENTO.matsu, KENTO.ko, 0.1),
  soil: mix(KENTO.kinako, KENTO.sumiSoft, 0.42), // tilled earth
  furrow: mix(KENTO.sumiSoft, KENTO.kinako, 0.35),
  wet: withAlpha(KENTO.asagiDeep, 0.28), // watered sheen
  wetLine: KENTO.asagiDeep,
  leaf: KENTO.matsuDeep,
  line: KENTO.kinako,
  fence: KENTO.kinako,
  fenceInk: KENTO.sumiSoft,
  text: KENTO.sumiSoft,
  textSoft: KENTO.stone,
} as const;

// Ripe colour per crop — a readable harvest hue.
const RIPE: Record<string, string> = { turnip: KENTO.fuji, bean: KENTO.matsu, pumpkin: KENTO.kakiDeep };

const GROUND_SEED = 3307;

export function frState(world: World): FrState {
  return world.state.fr as FrState;
}

class FrView extends Node {
  override readonly type = 'FrView';
  private layer = new Node({ name: 'layer' });
  private field = new Node({ name: 'field' });
  private plotPool!: NodePool<Sprite>;
  private furrowPool!: NodePool<Sprite>;
  private stemPool!: NodePool<Sprite>;
  private cropPool!: NodePool<Sprite>;
  private farmer!: Node;
  private hud!: Text;
  private msg!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.field.cosmetic = true;
    this.layer.addChild(this.field);
    this.buildField();

    this.plotPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 1, shape: { kind: 'rect', w: CELL - 8, h: CELL - 8, r: 12 }, fill: PAL.grass }));
    this.furrowPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 2, shape: { kind: 'rect', w: CELL - 24, h: 3, r: 1 }, fill: PAL.furrow }));
    this.stemPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 3, shape: { kind: 'circle', radius: 8 }, fill: PAL.leaf }));
    this.cropPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 8 }, fill: KENTO.ko }));

    this.farmer = new Node({ name: 'farmer', z: 5 });
    this.farmer.cosmetic = true;
    this.buildFarmer(this.farmer);
    this.layer.addChild(this.farmer);

    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.msg = this.layer.addChild(new Text({ pos: { x: 640, y: 700 }, z: 8, size: 16, align: 'center', fill: PAL.textSoft, text: 'T till · P plant · O water · H harvest · Z sleep' }));
  }

  /** Static scenery: washi ground + grain, a rail fence, and corner trees. */
  private buildField(): void {
    this.field.addChild(new Sprite({ pos: { x: 640, y: 360 }, z: -4, shape: { kind: 'rect', w: 1280, h: 720 }, fill: PAL.paper }));
    const g = new Rng(GROUND_SEED);
    for (let y = 40; y < 720; y += 88) {
      for (let x = 40; x < 1280; x += 88) {
        this.field.addChild(new Sprite({ pos: { x: x + g.range(-16, 16), y: y + g.range(-16, 16) }, z: -3, shape: { kind: 'circle', radius: g.range(1.3, 3) }, fill: mutateColor(g, g.pick([KENTO.line, KENTO.kinu]), { light: 0.04 }), opacity: g.range(0.22, 0.44) }));
      }
    }
    // A soft plot bed under the whole farm, so the field reads as one worked patch.
    this.field.addChild(new Sprite({ pos: { x: FX0 + FW / 2, y: FY0 + FH / 2 }, z: -2, shape: { kind: 'rect', w: FW + 28, h: FH + 28, r: 20 }, fill: mix(PAL.grass, KENTO.gofun, 0.3), stroke: withAlpha(KENTO.sumi, 0.1), strokeWidth: 2 }));
    // Rail fence around the farm: posts + two rails per side.
    const post = (x: number, y: number) => {
      this.field.addChild(new Sprite({ pos: { x, y: y + 8 }, z: 0, shape: { kind: 'circle', radius: 6 }, fill: withAlpha(KENTO.sumi, 0.14) }));
      this.field.addChild(new Sprite({ pos: { x, y }, z: 1, shape: { kind: 'rect', w: 9, h: 30, r: 3 }, fill: PAL.fence, stroke: PAL.fenceInk, strokeWidth: 1.5 }));
    };
    const px0 = FX0 - 16, px1 = FX0 + FW + 16, py0 = FY0 - 16, py1 = FY0 + FH + 16;
    for (let x = px0; x <= px1 + 1; x += (px1 - px0) / 8) { post(x, py0); post(x, py1); }
    for (let y = py0 + (py1 - py0) / 4; y < py1; y += (py1 - py0) / 4) { post(px0, y); post(px1, y); }
    for (const ry of [-7, 5]) {
      this.field.addChild(new Sprite({ pos: { x: (px0 + px1) / 2, y: py0 + ry }, z: 0, shape: { kind: 'rect', w: px1 - px0, h: 4, r: 2 }, fill: PAL.fence, opacity: 0.9 }));
      this.field.addChild(new Sprite({ pos: { x: (px0 + px1) / 2, y: py1 + ry }, z: 0, shape: { kind: 'rect', w: px1 - px0, h: 4, r: 2 }, fill: PAL.fence, opacity: 0.9 }));
      this.field.addChild(new Sprite({ pos: { x: px0, y: (py0 + py1) / 2 + ry }, z: 0, shape: { kind: 'rect', w: 4, h: py1 - py0, r: 2 }, fill: PAL.fence, opacity: 0.9 }));
      this.field.addChild(new Sprite({ pos: { x: px1, y: (py0 + py1) / 2 + ry }, z: 0, shape: { kind: 'rect', w: 4, h: py1 - py0, r: 2 }, fill: PAL.fence, opacity: 0.9 }));
    }
    // A couple of trees tucked in the corners (outside the fence).
    const t = new Rng(GROUND_SEED + 5);
    for (const [tx, ty] of [[72, 120], [1208, 150], [80, 640], [1200, 610]] as const) {
      const r = t.range(34, 46);
      const canopy = mutateColor(t, KENTO.matsuDeep, { hue: 6, light: 0.05 });
      this.field.addChild(new Sprite({ pos: { x: tx + 5, y: ty + r * 0.7 }, z: 0, shape: { kind: 'circle', radius: r * 0.75 }, fill: withAlpha(KENTO.sumi, 0.14) }));
      this.field.addChild(new Sprite({ pos: { x: tx, y: ty + r * 0.5 }, z: 1, shape: { kind: 'rect', w: 10, h: r * 0.6, r: 3 }, fill: mutateColor(t, KENTO.stone, { light: 0.04 }), stroke: PAL.fenceInk, strokeWidth: 1.5 }));
      this.field.addChild(new Sprite({ pos: { x: tx, y: ty }, z: 1, shape: { kind: 'path', d: blobPath(t, r, 0.22, 9) }, fill: canopy, stroke: KENTO.sumi, strokeWidth: 2 }));
      this.field.addChild(new Sprite({ pos: { x: tx - r * 0.3, y: ty - r * 0.3 }, z: 1, shape: { kind: 'path', d: blobPath(t, r * 0.5, 0.3, 7) }, fill: mix(canopy, KENTO.matsu, 0.6), opacity: 0.7 }));
    }
  }

  /** A little straw-hatted farmer in local space (positioned each frame). */
  private buildFarmer(host: Node): void {
    host.addChild(new Sprite({ pos: { x: 0, y: 16 }, z: 5, shape: { kind: 'circle', radius: 13 }, fill: withAlpha(KENTO.sumi, 0.16) })); // shadow
    host.addChild(new Sprite({ pos: { x: 0, y: 6 }, z: 6, shape: { kind: 'rect', w: 22, h: 26, r: 8 }, fill: KENTO.aiDeep, stroke: KENTO.sumi, strokeWidth: 2 })); // overalls
    host.addChild(new Sprite({ pos: { x: 0, y: -8 }, z: 7, shape: { kind: 'circle', radius: 10 }, fill: KENTO.kinu, stroke: KENTO.sumi, strokeWidth: 2 })); // head
    host.addChild(new Sprite({ pos: { x: 0, y: -14 }, z: 8, shape: { kind: 'rect', w: 30, h: 6, r: 3 }, fill: KENTO.koDeep, stroke: KENTO.sumiSoft, strokeWidth: 1.5 })); // hat brim
    host.addChild(new Sprite({ pos: { x: 0, y: -20 }, z: 8, shape: { kind: 'rect', w: 16, h: 10, r: 4 }, fill: KENTO.ko, stroke: KENTO.sumiSoft, strokeWidth: 1.5 })); // hat crown
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = frState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.fr = initialFr();
      hideScreen();
      return;
    }
    if (!s.won && !s.yearOver) {
      const acts: FrAction[] = ['left', 'right', 'up', 'down', 'till', 'plant', 'water', 'harvest', 'sleep'];
      for (const a of acts)
        if (input.justPressed(a)) {
          const ev = stepFr(s, a);
          if (ev.acted) audio.blip(380);
          if (ev.harvested) audio.blip(560);
          if (ev.slept) audio.blip(240);
          if (ev.won) showScreen({ title: 'Festival champion', body: `${s.coins} coins by ${s.day > YEAR_DAYS ? "year's end" : `day ${s.day}`} · ${s.harvested} harvests.`, actions: [{ label: 'Farm anew', primary: true, onSelect: () => { world.state.fr = initialFr(); hideScreen(); } }] });
          else if (ev.yearOver) showScreen({ title: 'The year turns', body: `${s.coins}/${GOAL_COINS} coins · ${s.harvested} harvests.`, actions: [{ label: 'Another year', primary: true, onSelect: () => { world.state.fr = initialFr(); hideScreen(); } }] });
          break;
        }
    }
    this.redraw(s);
  }

  private redraw(s: FrState): void {
    this.plotPool.begin();
    this.furrowPool.begin();
    this.stemPool.begin();
    this.cropPool.begin();
    for (let y = 0; y < FARM_H; y++)
      for (let x = 0; x < FARM_W; x++) {
        const p = s.plots[pidx(x, y)];
        const c = at(x, y);
        const sp = this.plotPool.get();
        sp.pos = c;
        sp.paint.fill = p.tilled ? PAL.soil : PAL.grass;
        sp.paint.stroke = p.watered ? PAL.wetLine : withAlpha(KENTO.sumi, 0.12);
        sp.paint.strokeWidth = p.watered ? 3 : 1;
        if (p.tilled) {
          // Furrow lines (and a blue sheen when watered).
          for (const dy of [-20, 0, 20]) {
            const f = this.furrowPool.get();
            f.pos = { x: c.x, y: c.y + dy };
            f.paint.fill = p.watered ? PAL.wet : PAL.furrow;
            f.paint.opacity = p.watered ? 0.9 : 0.7;
          }
        }
        if (p.crop) {
          const def = CROPS[p.crop];
          const t = Math.min(1, p.grown / def.growDays);
          const ripe = p.grown >= def.growDays;
          // Green leafy base grows with the plant.
          const stem = this.stemPool.get();
          stem.pos = { x: c.x, y: c.y + 6 };
          stem.shape = { kind: 'circle', radius: 8 + t * 10 };
          stem.paint.fill = mutateColor(new Rng(pidx(x, y) + 11), PAL.leaf, { light: 0.05 });
          // The fruit: appears as it matures, crop-coloured when ripe.
          const fruit = this.cropPool.get();
          fruit.pos = { x: c.x, y: c.y - 4 };
          fruit.shape = { kind: 'circle', radius: ripe ? 12 : 4 + t * 6 };
          fruit.paint.fill = ripe ? RIPE[p.crop] : mix(PAL.leaf, KENTO.ko, 0.3);
          fruit.paint.stroke = ripe ? KENTO.sumi : 'none';
          fruit.paint.strokeWidth = ripe ? 2 : 0;
        }
      }
    this.plotPool.end();
    this.furrowPool.end();
    this.stemPool.end();
    this.cropPool.end();

    this.farmer.pos = at(s.x, s.y);
    const season = seasonOf(Math.min(s.day, YEAR_DAYS));
    const planting = SEASON_CROP[season] ? CROPS[SEASON_CROP[season]!].name : 'nothing (winter)';
    this.hud.text = `${season} · day ${s.day}/${YEAR_DAYS} · energy ${s.energy} · coins ${s.coins}/${GOAL_COINS} · sowing: ${planting}`;
    this.msg.text = `${s.msg}   ·   T till · P plant · O water · H harvest · Z sleep`;
  }
}

registerNode('FrView', () => new FrView({ name: 'fr-view' }));

export const fernrowGame = defineGame({
  title: 'Fernrow',
  background: PAL.paper,
  inputMap: FR_INPUT_MAP,
  build(world) {
    world.state.fr = initialFr();
    return new FrView({ name: 'fr-view' });
  },
  probe(world) {
    const s = frState(world);
    return { frame: world.frame, day: s.day, energy: s.energy, coins: s.coins, x: s.x, y: s.y, harvested: s.harvested, won: s.won, yearOver: s.yearOver };
  },
});

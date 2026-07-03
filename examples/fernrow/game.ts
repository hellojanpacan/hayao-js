// Fernrow: gentle-pace farming view — big tiles, soft palette, seasonal sky.

import { KENTO, Node, NodePool, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { initialFr, pidx, seasonOf, stepFr, CROPS, FARM_H, FARM_W, GOAL_COINS, SEASON_CROP, YEAR_DAYS, type FrAction, type FrState, type Season } from './logic';

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

const SKY: Record<Season, string> = { spring: KENTO.matsuDeep, summer: KENTO.koDeep, autumn: KENTO.kakiDeep, winter: KENTO.aiDeep };
const PAL = { soil: KENTO.sumiSoft, tilled: KENTO.stone, grass: KENTO.matsuDeep, line: KENTO.darkLine, player: KENTO.gofun, sprout: KENTO.matsu, ripe: KENTO.ko, water: KENTO.asagi, text: KENTO.kinako };

export function frState(world: World): FrState {
  return world.state.fr as FrState;
}

class FrView extends Node {
  override readonly type = 'FrView';
  private layer = new Node({ name: 'layer' });
  private plotPool!: NodePool<Sprite>;
  private cropPool!: NodePool<Sprite>;
  private player!: Sprite;
  private hud!: Text;
  private msg!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.plotPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 1, shape: { kind: 'rect', w: CELL - 8, h: CELL - 8, r: 10 }, fill: PAL.grass }));
    this.cropPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 3, shape: { kind: 'circle', radius: 12 }, fill: PAL.sprout }));
    this.player = this.layer.addChild(new Sprite({ z: 5, shape: { kind: 'circle', radius: 16 }, fill: PAL.player, stroke: KENTO.sumi, strokeWidth: 2 }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.msg = this.layer.addChild(new Text({ pos: { x: 640, y: 700 }, z: 8, size: 16, align: 'center', fill: PAL.text, text: 'T till · P plant · O water · H harvest · Z sleep' }));
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
    this.redraw(s, world);
  }

  private redraw(s: FrState, world: World): void {
    (world as unknown as { def?: unknown }); // background is static; season tint below
    this.plotPool.begin();
    this.cropPool.begin();
    for (let y = 0; y < FARM_H; y++)
      for (let x = 0; x < FARM_W; x++) {
        const p = s.plots[pidx(x, y)];
        const sp = this.plotPool.get();
        sp.pos = at(x, y);
        sp.paint.fill = p.tilled ? PAL.tilled : PAL.grass;
        sp.paint.stroke = p.watered ? PAL.water : PAL.line;
        sp.paint.strokeWidth = p.watered ? 3 : 1;
        if (p.crop) {
          const def = CROPS[p.crop];
          const c = this.cropPool.get();
          c.pos = at(x, y);
          const ripe = p.grown >= def.growDays;
          const t = Math.min(1, p.grown / def.growDays);
          c.shape = { kind: 'circle', radius: 6 + t * 12 };
          c.paint.fill = ripe ? PAL.ripe : PAL.sprout;
        }
      }
    this.plotPool.end();
    this.cropPool.end();
    this.player.pos = at(s.x, s.y);
    const season = seasonOf(Math.min(s.day, YEAR_DAYS));
    const planting = SEASON_CROP[season] ? CROPS[SEASON_CROP[season]!].name : 'nothing (winter)';
    this.hud.text = `${season} · day ${s.day}/${YEAR_DAYS} · energy ${s.energy} · coins ${s.coins}/${GOAL_COINS} · sowing: ${planting}`;
    this.msg.text = `${s.msg}   ·   T till · P plant · O water · H harvest · Z sleep`;
    void SKY;
  }
}

registerNode('FrView', () => new FrView({ name: 'fr-view' }));

export const fernrowGame = defineGame({
  title: 'Fernrow',
  background: KENTO.yohaku,
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

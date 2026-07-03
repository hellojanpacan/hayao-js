// Hollowdeep: turn-based — the sim advances only on input edges. The view is
// the classic roguelike trinity: visible (lit), explored (dim), unknown (void).

import { KENTO, Node, NodePool, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { computeFov, idx, initialHd, stepHd, COLS, ROWS, TILE_SIZE, type HdMove, type HdState } from './logic';

export const HD_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  wait: ['Period', 'KeyX'],
  quaff: ['KeyQ'],
  restart: ['KeyR'],
};

// Kentō dark-ground mapping: deepest yohaku ground; neutral ramp for the dungeon
// stonework; each entity on its own hue family so nothing is told apart by shade.
const PAL = { bg: KENTO.yohaku, lit: KENTO.sumiSoft, litLine: KENTO.stone, dim: KENTO.darkLine, floorLit: KENTO.kuro, hero: KENTO.fuji, rat: KENTO.kaki, shade: KENTO.asagi, potion: KENTO.saku, sword: KENTO.ko, stairs: KENTO.matsu, text: KENTO.kinako };

export function hdState(world: World): HdState {
  return world.state.hd as HdState;
}

class HdView extends Node {
  override readonly type = 'HdView';
  private layer = new Node({ name: 'layer' });
  private tilePool!: NodePool<Sprite>;
  private entPool!: NodePool<Sprite>;
  private hero!: Sprite;
  private hud!: Text;
  private msg!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.tilePool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 1, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.dim }));
    this.entPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 10 }, fill: PAL.rat }));
    this.hero = this.layer.addChild(new Sprite({ z: 5, shape: { kind: 'circle', radius: 11 }, fill: PAL.hero, stroke: KENTO.sumi, strokeWidth: 2 }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 24 }, z: 8, size: 19, align: 'center', fill: PAL.text, text: '' }));
    this.msg = this.layer.addChild(new Text({ pos: { x: 640, y: 702 }, z: 8, size: 15, align: 'center', fill: PAL.text, text: '' }));
    // Legend: every entity kind on screen is named here, with its true glyph.
    const legend: [Sprite, string][] = [
      [new Sprite({ shape: { kind: 'circle', radius: 8 }, fill: PAL.hero, stroke: KENTO.sumi, strokeWidth: 1.5 }), 'you'],
      [new Sprite({ shape: { kind: 'circle', radius: 6 }, fill: PAL.rat, stroke: KENTO.sumi, strokeWidth: 1.5 }), 'rat — bites'],
      [new Sprite({ shape: { kind: 'circle', radius: 8 }, fill: PAL.shade, stroke: KENTO.sumi, strokeWidth: 1.5 }), 'shade — slow, hits hard'],
      [new Sprite({ shape: { kind: 'rect', w: 9, h: 13, r: 3 }, fill: PAL.potion, stroke: KENTO.gofun, strokeWidth: 1 }), 'potion — Q drinks'],
      [new Sprite({ shape: { kind: 'poly', points: [0, -8, 4, 3, 0, 8, -4, 3], closed: true }, fill: PAL.sword }), 'blade — +3 atk'],
      [new Sprite({ shape: { kind: 'poly', points: [-7, 5, 7, 5, 0, -7], closed: true }, fill: PAL.stairs }), 'stairs down'],
    ];
    let lx = 120;
    for (const [glyph, label] of legend) {
      glyph.pos = { x: lx, y: 676 };
      glyph.z = 8;
      this.layer.addChild(glyph);
      const t = this.layer.addChild(new Text({ pos: { x: lx + 14, y: 681 }, z: 8, size: 13, align: 'left', fill: PAL.text, text: label }));
      lx += 34 + label.length * 7.6 + 26;
      void t;
    }
    this.redraw(hdState(this.world as World));
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = hdState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.hd = initialHd(world.rng);
      hideScreen();
      this.redraw(hdState(world));
      return;
    }
    if (s.won || s.dead) return;
    const move: HdMove | null = input.justPressed('left') ? 'left' : input.justPressed('right') ? 'right' : input.justPressed('up') ? 'up' : input.justPressed('down') ? 'down' : input.justPressed('wait') ? 'wait' : input.justPressed('quaff') ? 'quaff' : null;
    if (move) {
      const ev = stepHd(s, move, world.rng);
      if (ev.fought) audio.blip(320);
      if (ev.killed) audio.blip(500);
      if (ev.hurt) audio.blip(140);
      if (ev.drank) audio.blip(620);
      if (ev.descended) audio.success();
      if (ev.won) showScreen({ title: 'The Pale Amulet', body: `Claimed in ${s.turns} turns · ${s.kills} slain.`, actions: [{ label: 'Descend anew', primary: true, onSelect: () => { world.state.hd = initialHd(world.rng); hideScreen(); computeFov(hdState(world)); } }] });
      if (ev.died) showScreen({ title: 'The Hollow keeps you', body: `Floor ${s.depth + 1}, turn ${s.turns}.`, actions: [{ label: 'Try again', primary: true, onSelect: () => { world.state.hd = initialHd(world.rng); hideScreen(); } }] });
    }
    this.redraw(s);
  }

  private redraw(s: HdState): void {
    const f = s.floors[s.depth];
    this.tilePool.begin();
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const i = idx(x, y);
        if (!s.explored[s.depth][i]) continue;
        const sp = this.tilePool.get();
        sp.pos = { x: (x + 0.5) * TILE_SIZE, y: (y + 0.5) * TILE_SIZE };
        const lit = s.visible[i];
        if (f.cells[i] === 1) {
          sp.paint.fill = lit ? PAL.lit : PAL.dim;
          sp.paint.stroke = lit ? PAL.litLine : undefined;
          sp.paint.strokeWidth = lit ? 1 : 0;
        } else {
          sp.paint.fill = lit ? PAL.floorLit : KENTO.yohaku;
          sp.paint.stroke = undefined;
        }
      }
    this.tilePool.end();

    this.entPool.begin();
    const showAt = (x: number, y: number) => s.visible[idx(x, y)];
    if (showAt(f.stairs.x, f.stairs.y) || s.explored[s.depth][idx(f.stairs.x, f.stairs.y)]) {
      const sp = this.entPool.get();
      sp.pos = { x: (f.stairs.x + 0.5) * TILE_SIZE, y: (f.stairs.y + 0.5) * TILE_SIZE };
      sp.shape = { kind: 'poly', points: [-10, 8, 10, 8, 0, -10], closed: true };
      sp.paint.fill = PAL.stairs;
    }
    for (const p of f.potions)
      if (showAt(p.x, p.y)) {
        const sp = this.entPool.get();
        sp.pos = { x: (p.x + 0.5) * TILE_SIZE, y: (p.y + 0.5) * TILE_SIZE };
        sp.shape = { kind: 'rect', w: 9, h: 13, r: 3 }; // a flask, not a creature
        sp.paint.fill = PAL.potion;
        sp.paint.stroke = KENTO.gofun;
        sp.paint.strokeWidth = 1;
      }
    if (f.sword && showAt(f.sword.x, f.sword.y)) {
      const sp = this.entPool.get();
      sp.pos = { x: (f.sword.x + 0.5) * TILE_SIZE, y: (f.sword.y + 0.5) * TILE_SIZE };
      sp.shape = { kind: 'poly', points: [0, -11, 5, 4, 0, 11, -5, 4], closed: true };
      sp.paint.fill = PAL.sword;
    }
    for (const m of f.monsters)
      if (showAt(m.x, m.y)) {
        const sp = this.entPool.get();
        sp.pos = { x: (m.x + 0.5) * TILE_SIZE, y: (m.y + 0.5) * TILE_SIZE };
        sp.shape = { kind: 'circle', radius: m.kind === 'shade' ? 12 : 8 };
        sp.paint.fill = m.kind === 'shade' ? PAL.shade : PAL.rat;
        sp.paint.stroke = KENTO.sumi;
        sp.paint.strokeWidth = 2;
      }
    this.entPool.end();

    this.hero.pos = { x: (s.x + 0.5) * TILE_SIZE, y: (s.y + 0.5) * TILE_SIZE };
    this.hud.text = `floor ${s.depth + 1}/3 · ♥ ${s.hp}/${s.maxHp} · ⚔ atk ${s.atk} · ⚗ potions ${s.potions} (Q drinks) · arrows move · X waits · turn ${s.turns}`;
    this.msg.text = s.msg;
  }
}

registerNode('HdView', () => new HdView({ name: 'hd-view' }));

export const hollowdeepGame = defineGame({
  title: 'Hollowdeep',
  background: PAL.bg,
  seed: 1,
  inputMap: HD_INPUT_MAP,
  build(world) {
    world.state.hd = initialHd(world.rng);
    return new HdView({ name: 'hd-view' });
  },
  probe(world) {
    const s = hdState(world);
    const f = s.floors[s.depth];
    return { frame: world.frame, depth: s.depth, x: s.x, y: s.y, hp: s.hp, atk: s.atk, potions: s.potions, turns: s.turns, monsters: f.monsters.map((m) => ({ kind: m.kind, x: m.x, y: m.y, hp: m.hp })), stairs: { ...f.stairs }, itemsLeft: f.potions.length, won: s.won, dead: s.dead, kills: s.kills };
  },
});

// Bramblefall: the battle sim in world.state; pooled Canvas view; RTS HUD —
// per-type counts for both armies, selection badge, command cursor, keep hp.

import { Node, NodePool, Sprite, Text, TILE, audio, defineGame, hideScreen, registerNode, showScreen, tileAt, type InputMap, type World } from '@hayao';
import { countBy, fieldMap, initialBf, stepBf, KEEPS, TILE_SIZE, type BfState, type UnitKind } from './logic';

export const BF_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  'sel-spear': ['Digit1'],
  'sel-cavalry': ['Digit2'],
  'sel-archer': ['Digit3'],
  'sel-all': ['Digit0', 'KeyQ'],
  order: ['Space', 'Enter'],
  restart: ['KeyR'],
};

const PAL = { bg: '#141a10', rock: '#31402c', rockLine: '#465c3f', p0: '#8fb573', p0b: '#c8e8b0', p1: '#c05555', p1b: '#e8a0a0', keep0: '#5a7a44', keep1: '#7a3050', cursor: '#ffd75e', text: '#93ab84' };
const KIND_R: Record<UnitKind, number> = { spear: 7, cavalry: 10, archer: 6 };

export function bfState(world: World): BfState {
  return world.state.bf as BfState;
}

class BfView extends Node {
  override readonly type = 'BfView';
  private layer = new Node({ name: 'layer' });
  private unitPool!: NodePool<Sprite>;
  private keeps: Sprite[] = [];
  private cursor!: Sprite;
  private hud!: Text;
  private armies!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    const map = fieldMap();
    for (let ty = 0; ty < map.rows; ty++)
      for (let tx = 0; tx < map.cols; tx++)
        if (tileAt(map, tx, ty) === TILE.SOLID)
          this.layer.addChild(new Sprite({ pos: { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE }, z: 2, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.rock, stroke: PAL.rockLine, strokeWidth: 1 }));
    KEEPS.forEach((k, i) => this.keeps.push(this.layer.addChild(new Sprite({ pos: { x: k.x, y: k.y }, z: 3, shape: { kind: 'rect', w: 72, h: 88, r: 10 }, fill: i === 0 ? PAL.keep0 : PAL.keep1, stroke: '#1a2410', strokeWidth: 3 }))));
    this.unitPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 5, shape: { kind: 'circle', radius: 8 }, fill: PAL.p0 }));
    this.cursor = this.layer.addChild(new Sprite({ z: 7, shape: { kind: 'rect', w: 34, h: 34, r: 6 }, fill: 'none', stroke: PAL.cursor, strokeWidth: 3 }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 28 }, z: 8, size: 19, align: 'center', fill: PAL.text, text: '' }));
    this.armies = this.layer.addChild(new Text({ pos: { x: 640, y: 688 }, z: 8, size: 16, align: 'center', fill: PAL.text, text: '' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = bfState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.bf = initialBf();
      hideScreen();
      return;
    }
    if (s.won || s.dead) return;
    // Cursor repeats while held (8 tiles/s).
    const rep = world.frame % 8 === 0;
    const ev = stepBf(
      s,
      {
        cursorX: rep ? (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0) : 0,
        cursorY: rep ? (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0) : 0,
        select: input.justPressed('sel-spear') ? 'spear' : input.justPressed('sel-cavalry') ? 'cavalry' : input.justPressed('sel-archer') ? 'archer' : input.justPressed('sel-all') ? 'all' : null,
        order: input.justPressed('order'),
      },
      dt,
    );
    if (ev.ordered) audio.blip(420);
    if (ev.died) showScreen({ title: 'Your keep has fallen', body: `Held for ${s.time.toFixed(0)}s · ${s.kills[0]} foes felled.`, actions: [{ label: 'Rally again', primary: true, onSelect: () => { (this.world as World).state.bf = initialBf(); hideScreen(); } }] });
    if (ev.won) {
      audio.success();
      showScreen({ title: 'The bramble keep falls', body: `Victory in ${s.time.toFixed(0)}s · ${s.kills[0]} felled, ${countBy(s, 0).total} soldiers standing.`, actions: [{ label: 'March again', primary: true, onSelect: () => { (this.world as World).state.bf = initialBf(); hideScreen(); } }] });
    }

    // ── View sync ──
    this.cursor.pos = { x: (s.cursor.tx + 0.5) * TILE_SIZE, y: (s.cursor.ty + 0.5) * TILE_SIZE };
    this.unitPool.begin();
    for (const u of s.units) {
      const sp = this.unitPool.get();
      sp.pos = { x: u.x, y: u.y };
      sp.shape = u.kind === 'archer' ? { kind: 'poly', points: [0, -7, 6, 5, -6, 5], closed: true } : u.kind === 'spear' ? { kind: 'rect', w: 10, h: 12, r: 2 } : { kind: 'circle', radius: KIND_R[u.kind] };
      const selected = u.team === 0 && (s.selected === 'all' || u.kind === s.selected);
      sp.paint.fill = u.team === 0 ? PAL.p0 : PAL.p1;
      sp.paint.stroke = selected ? PAL.cursor : u.team === 0 ? PAL.p0b : PAL.p1b;
      sp.paint.strokeWidth = selected ? 2 : 1;
    }
    this.unitPool.end();
    this.keeps[0].paint.opacity = 0.4 + 0.6 * (s.keepHp[0] / KEEPS[0].hp);
    this.keeps[1].paint.opacity = 0.4 + 0.6 * (s.keepHp[1] / KEEPS[1].hp);
    const a = countBy(s, 0);
    const b = countBy(s, 1);
    this.hud.text = `your keep ${Math.max(0, s.keepHp[0])} · enemy keep ${Math.max(0, s.keepHp[1])} · commanding: ${s.selected}`;
    this.armies.text = `you  ▪${a.spear} ●${a.cavalry} ▲${a.archer}  (${a.total})   ·   foe  ▪${b.spear} ●${b.cavalry} ▲${b.archer}  (${b.total})   ·   1/2/3/0 select · arrows aim · Space orders`;
  }
}

registerNode('BfView', () => new BfView({ name: 'bf-view' }));

export const bramblefallGame = defineGame({
  title: 'Bramblefall',
  background: PAL.bg,
  inputMap: BF_INPUT_MAP,
  build(world) {
    world.state.bf = initialBf();
    return new BfView({ name: 'bf-view' });
  },
  probe(world) {
    const s = bfState(world);
    const a = countBy(s, 0);
    const b = countBy(s, 1);
    return { frame: world.frame, time: s.time, keep0: s.keepHp[0], keep1: s.keepHp[1], mine: a, theirs: b, cursor: { ...s.cursor }, selected: s.selected, pulseT: s.pulseT, won: s.won, dead: s.dead, units: s.units.length };
  },
});

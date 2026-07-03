// Vantage: the tactics sim in world.state; the view IS the information —
// telegraph arrows, movement range dots, hp pips. Perfect information or bust.

import { Node, NodePool, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { canMoveTo, initialVt, stepVt, GRID, MECHS, type VtState } from './logic';

export const VT_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  'sel-0': ['Digit1'],
  'sel-1': ['Digit2'],
  'sel-2': ['Digit3'],
  move: ['KeyM', 'Space'],
  attack: ['KeyF', 'Enter'],
  end: ['KeyE'],
  restart: ['KeyR'],
};

const CELL = 76;
const OX = 640 - (GRID * CELL) / 2 + CELL / 2;
const OY = 360 - (GRID * CELL) / 2 + CELL / 2;
const at = (x: number, y: number) => ({ x: OX + x * CELL, y: OY + y * CELL });

const PAL = { bg: '#101418', cell: '#1a2028', cellLine: '#2a3340', mech: '#7fc8ff', mechSel: '#ffd75e', bug: '#c05555', bugLine: '#e8a0a0', building: '#8fe8b0', telegraph: '#ff9d47', range: '#3d5a75', text: '#8598ad' };

export function vtState(world: World): VtState {
  return world.state.vt as VtState;
}

class VtView extends Node {
  override readonly type = 'VtView';
  private layer = new Node({ name: 'layer' });
  private marks!: NodePool<Sprite>;
  private units!: NodePool<Sprite>;
  private cursor!: Sprite;
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        this.layer.addChild(new Sprite({ pos: at(x, y), z: 1, shape: { kind: 'rect', w: CELL - 6, h: CELL - 6, r: 8 }, fill: PAL.cell, stroke: PAL.cellLine, strokeWidth: 1 }));
    this.marks = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 2, shape: { kind: 'circle', radius: 7 }, fill: PAL.range }));
    this.units = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 24 }, fill: PAL.bug }));
    this.cursor = this.layer.addChild(new Sprite({ z: 6, shape: { kind: 'rect', w: CELL - 2, h: CELL - 2, r: 10 }, fill: 'none', stroke: PAL.mechSel, strokeWidth: 3 }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 692 }, z: 8, size: 16, align: 'center', fill: PAL.text, text: '1/2/3 select mech · arrows aim · M move · F fire (pushes!) · E ends the turn' }));
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = vtState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.vt = initialVt();
      hideScreen();
      return;
    }
    if (s.won || s.dead) {
      this.redraw(s);
      return;
    }
    let ev = null;
    for (let i = 0; i < 3; i++) if (input.justPressed(`sel-${i}`)) ev = stepVt(s, { kind: 'select', mech: i });
    const dx = (input.justPressed('right') ? 1 : 0) - (input.justPressed('left') ? 1 : 0);
    const dy = (input.justPressed('down') ? 1 : 0) - (input.justPressed('up') ? 1 : 0);
    if (dx || dy) ev = stepVt(s, { kind: 'cursor', x: s.cursor.x + dx, y: s.cursor.y + dy });
    if (input.justPressed('move')) ev = stepVt(s, { kind: 'move' });
    if (input.justPressed('attack')) ev = stepVt(s, { kind: 'attack' });
    if (input.justPressed('end')) ev = stepVt(s, { kind: 'endTurn' });
    if (ev) {
      if (ev.attacked) audio.blip(420);
      if (ev.bugKilled) audio.blip(560);
      if (ev.buildingHit) audio.blip(120);
      if (ev.won) showScreen({ title: s.perfect ? 'Perfect defence' : 'The greenhouses stand', body: `${s.buildings.length}/3 saved through ${s.turn} turns.`, actions: [{ label: 'Hold again', primary: true, onSelect: () => { world.state.vt = initialVt(); hideScreen(); } }] });
      if (ev.died) showScreen({ title: 'The vantage is lost', body: `Fell on turn ${s.turn}.`, actions: [{ label: 'Redeploy', primary: true, onSelect: () => { world.state.vt = initialVt(); hideScreen(); } }] });
    }
    this.redraw(s);
  }

  private redraw(s: VtState): void {
    this.marks.begin();
    // Movement range for the selected mech.
    const sel = s.mechs[s.selected];
    if (sel && sel.hp > 0 && !sel.moved) {
      for (let y = 0; y < GRID; y++)
        for (let x = 0; x < GRID; x++)
          if (canMoveTo(s, sel, x, y)) {
            const m = this.marks.get();
            m.pos = at(x, y);
            m.shape = { kind: 'circle', radius: 6 };
            m.paint.fill = PAL.range;
          }
    }
    // Telegraph arrows: the tile each bug will strike.
    for (const b of s.bugs)
      if (b.dir) {
        const m = this.marks.get();
        m.pos = at(b.x + b.dir.x, b.y + b.dir.y);
        m.shape = { kind: 'poly', points: [0, -14, 12, 10, -12, 10], closed: true };
        m.paint.fill = PAL.telegraph;
      }
    this.marks.end();

    this.units.begin();
    for (const g of s.buildings) {
      const u = this.units.get();
      u.pos = at(g.x, g.y);
      u.shape = { kind: 'rect', w: 46, h: 46, r: 8 };
      u.paint.fill = PAL.building;
      u.paint.opacity = 0.5 + 0.25 * g.hp;
      u.paint.stroke = '#1a2a1e';
      u.paint.strokeWidth = 2;
    }
    s.mechs.forEach((m, i) => {
      if (m.hp <= 0) return;
      const u = this.units.get();
      u.pos = at(m.x, m.y);
      u.shape = m.kind === 'bruiser' ? { kind: 'rect', w: 40, h: 40, r: 10 } : m.kind === 'artillery' ? { kind: 'poly', points: [0, -22, 20, 14, -20, 14], closed: true } : { kind: 'circle', radius: 20 };
      u.paint.fill = PAL.mech;
      u.paint.stroke = i === s.selected ? PAL.mechSel : '#12202c';
      u.paint.strokeWidth = i === s.selected ? 4 : 2;
      u.paint.opacity = m.acted ? 0.55 : 1;
    });
    for (const b of s.bugs) {
      const u = this.units.get();
      u.pos = at(b.x, b.y);
      u.shape = { kind: 'poly', points: [0, -20, 18, 8, 0, 20, -18, 8], closed: true };
      u.paint.fill = PAL.bug;
      u.paint.stroke = PAL.bugLine;
      u.paint.strokeWidth = 2;
    }
    this.units.end();

    this.cursor.pos = at(s.cursor.x, s.cursor.y);
    const mech = s.mechs[s.selected];
    this.hud.text = `turn ${s.turn}/5 · ${s.buildings.length}/3 greenhouses · ${mech ? `${mech.kind} ${mech.hp}hp${mech.moved ? '' : ` · move ${MECHS[mech.kind].move}`}${mech.acted ? ' · spent' : ''}` : ''} · bugs ${s.bugs.length}`;
  }
}

registerNode('VtView', () => new VtView({ name: 'vt-view' }));

export const vantageGame = defineGame({
  title: 'Vantage',
  background: PAL.bg,
  inputMap: VT_INPUT_MAP,
  build(world) {
    world.state.vt = initialVt();
    return new VtView({ name: 'vt-view' });
  },
  probe(world) {
    const s = vtState(world);
    return { frame: world.frame, turn: s.turn, mechs: s.mechs.map((m) => ({ kind: m.kind, x: m.x, y: m.y, hp: m.hp, moved: m.moved, acted: m.acted })), bugs: s.bugs.map((b) => ({ x: b.x, y: b.y, hp: b.hp, dir: b.dir })), buildings: s.buildings.map((g) => ({ ...g })), cursor: { ...s.cursor }, selected: s.selected, won: s.won, dead: s.dead, perfect: s.perfect };
  },
});

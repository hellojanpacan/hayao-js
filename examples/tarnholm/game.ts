// Tarnholm: minimalist island view — terrain squares, building glyphs, and
// the one number that matters everywhere: what THIS placement would score,
// live under the cursor. Readable scoring is the whole genre.

import { Node, NodePool, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { currentBuilding, initialTh, place, placementScore, BUILDINGS, GH, GW, QUEUE, TARGET, tidx, type ThState } from './logic';

export const TH_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  build: ['Space', 'Enter'],
  restart: ['KeyR'],
};

const CELL = 64;
const OX = 640 - (GW * CELL) / 2 + CELL / 2;
const OY = 368 - (GH * CELL) / 2 + CELL / 2;
const at = (x: number, y: number) => ({ x: OX + x * CELL, y: OY + y * CELL });

const TERRA = { water: '#28425c', grass: '#2c4430', forest: '#1e3322' };
const GLYPH: Record<string, string> = { hut: '#e8d8b0', farm: '#ffd75e', sawmill: '#c97b4a', dock: '#7fc8ff', temple: '#e8a0ff' };
const PAL = { line: '#141c14', cursorOk: '#8fe8b0', cursorBad: '#c05555', text: '#a8b8a8' };

export function thState(world: World): ThState {
  return world.state.th as ThState;
}

class ThView extends Node {
  override readonly type = 'ThView';
  private layer = new Node({ name: 'layer' });
  private tilePool!: NodePool<Sprite>;
  private cursor!: Sprite;
  private gainLabel!: Text;
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.tilePool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 1, shape: { kind: 'rect', w: CELL - 4, h: CELL - 4, r: 8 }, fill: TERRA.grass }));
    this.cursor = this.layer.addChild(new Sprite({ z: 6, shape: { kind: 'rect', w: CELL, h: CELL, r: 10 }, fill: 'none', stroke: PAL.cursorOk, strokeWidth: 3 }));
    this.gainLabel = this.layer.addChild(new Text({ z: 7, size: 22, align: 'center', fill: PAL.cursorOk, text: '' }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 700 }, z: 8, size: 16, align: 'center', fill: PAL.text, text: 'arrows aim · Space builds · every roof scores by its neighbours' }));
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = thState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.th = initialTh(world.rng);
      hideScreen();
      return;
    }
    if (!s.won && !s.done) {
      const dx = (input.justPressed('right') ? 1 : 0) - (input.justPressed('left') ? 1 : 0);
      const dy = (input.justPressed('down') ? 1 : 0) - (input.justPressed('up') ? 1 : 0);
      s.cursor.x = Math.min(GW - 1, Math.max(0, s.cursor.x + dx));
      s.cursor.y = Math.min(GH - 1, Math.max(0, s.cursor.y + dy));
      if (input.justPressed('build')) {
        const ev = place(s, s.cursor.x, s.cursor.y);
        if (ev.placed) {
          audio.blip(380 + Math.min(10, ev.gain) * 30);
          if (ev.won) showScreen({ title: 'The island sings', body: `${s.score} renown with ${QUEUE.length - s.queueIdx} buildings unplaced.`, actions: [{ label: 'New island', primary: true, onSelect: () => { world.state.th = initialTh(world.rng); hideScreen(); } }] });
          if (ev.done && !ev.won) showScreen({ title: 'Out of timber', body: `${s.score}/${TARGET} renown — the town sleeps unfinished.`, actions: [{ label: 'Try a new island', primary: true, onSelect: () => { world.state.th = initialTh(world.rng); hideScreen(); } }] });
        } else audio.blip(140);
      }
    }
    this.redraw(s);
  }

  private redraw(s: ThState): void {
    this.tilePool.begin();
    for (let y = 0; y < GH; y++)
      for (let x = 0; x < GW; x++) {
        const i = tidx(x, y);
        const sp = this.tilePool.get();
        sp.pos = at(x, y);
        sp.shape = { kind: 'rect', w: CELL - 4, h: CELL - 4, r: 8 };
        sp.paint.fill = TERRA[s.terrain[i]];
        sp.paint.stroke = PAL.line;
        sp.paint.strokeWidth = 1;
        const b = s.built[i];
        if (b) {
          const g = this.tilePool.get();
          g.pos = at(x, y);
          g.shape = b === 'temple' ? { kind: 'poly', points: [0, -18, 15, 10, -15, 10], closed: true } : b === 'dock' ? { kind: 'rect', w: 30, h: 16, r: 3 } : { kind: 'rect', w: 24, h: 24, r: b === 'hut' ? 10 : 4 };
          g.paint.fill = GLYPH[b];
          g.paint.stroke = PAL.line;
          g.paint.strokeWidth = 2;
        }
      }
    this.tilePool.end();
    const kind = currentBuilding(s);
    const gain = kind ? placementScore(s, kind, s.cursor.x, s.cursor.y) : -1;
    this.cursor.pos = at(s.cursor.x, s.cursor.y);
    this.cursor.paint.stroke = gain >= 0 ? PAL.cursorOk : PAL.cursorBad;
    this.gainLabel.pos = { x: at(s.cursor.x, s.cursor.y).x, y: at(s.cursor.x, s.cursor.y).y - 44 };
    this.gainLabel.text = kind ? (gain >= 0 ? `+${gain}` : '×') : '';
    this.gainLabel.paint.fill = gain >= 0 ? PAL.cursorOk : PAL.cursorBad;
    this.hud.text = kind
      ? `renown ${s.score}/${TARGET} · placing ${BUILDINGS[kind].name} (${BUILDINGS[kind].blurb}) · ${QUEUE.length - s.queueIdx} left`
      : `renown ${s.score}/${TARGET}`;
  }
}

registerNode('ThView', () => new ThView({ name: 'th-view' }));

export const tarnholmGame = defineGame({
  title: 'Tarnholm',
  background: '#101812',
  inputMap: TH_INPUT_MAP,
  build(world) {
    world.state.th = initialTh(world.rng);
    return new ThView({ name: 'th-view' });
  },
  probe(world) {
    const s = thState(world);
    return { frame: world.frame, score: s.score, queueIdx: s.queueIdx, cursor: { ...s.cursor }, lastGain: s.lastGain, won: s.won, done: s.done };
  },
});

// Gravewell as a hayao game: pure logic (logic.ts) + a cursor-driven board
// view. The tap model is keyboard-native (SPEC.md M9): arrows move a cell
// cursor, confirm taps it — so every "click" lives in the same deterministic
// input log as any key. Cursor position is CANONICAL state (it decides what
// confirm does); only the painted layer is cosmetic.

import {
  Node,
  Sprite,
  Text,
  MEADOW,
  withAlpha,
  registerNode,
  showScreen,
  hideScreen,
  audio,
  defineGame,
  type World,
} from '@hayao';
import {
  H,
  LEVELS,
  W,
  applyTap,
  countClickables,
  countPushables,
  effectiveTaps,
  failReason,
  initialState,
  isWin,
  type Cell,
  type GravewellState,
} from './logic';

const VW = 1280;
const VH = 720;
const CELL = 92;
const OX = VW / 2 - (W * CELL) / 2 + CELL / 2;
const OY = VH / 2 - (H * CELL) / 2 + CELL / 2 + 16;

/**
 * Convert a solver path (tap cell indices) into input frames: walk the cursor
 * from its previous position (dx first, then dy), then confirm. Exported for
 * tests/verify — proves the keyboard tap model can express any solution.
 */
export function tapsToFrames(path: number[], start = { x: 0, y: 0 }): string[][] {
  const frames: string[][] = [];
  const cur = { ...start };
  for (const i of path) {
    const tx = i % W;
    const ty = Math.floor(i / W);
    while (cur.x !== tx) {
      frames.push([cur.x < tx ? 'right' : 'left'], []);
      cur.x += cur.x < tx ? 1 : -1;
    }
    while (cur.y !== ty) {
      frames.push([cur.y < ty ? 'down' : 'up'], []);
      cur.y += cur.y < ty ? 1 : -1;
    }
    frames.push(['confirm'], []);
  }
  frames.push([]);
  return frames;
}

const ARROW_GLYPH: Partial<Record<Cell, string>> = { up: '▲', right: '▶', down: '▼', left: '◀' };

class GravewellView extends Node {
  override readonly type = 'GravewellView';
  state: GravewellState = initialState(0);
  cursor = { x: 0, y: 0 };
  moves = 0;
  private history: GravewellState[] = [];
  private over = false; // win OR fail screen showing
  private layer = new Node({ name: 'layer' });

  protected override onReady(): void {
    this.layer.cosmetic = true; // painted layer only — state lives on this node
    this.addChild(this.layer);
    this.rebuild();
  }

  private rebuild(): void {
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    const lvl = LEVELS[this.state.levelIndex];
    const at = (x: number, y: number) => ({ x: OX + x * CELL, y: OY + y * CELL });

    // Board cells
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        this.layer.addChild(
          new Sprite({
            name: 'cell',
            pos: at(x, y),
            z: 0,
            shape: { kind: 'rect', w: CELL - 6, h: CELL - 6, r: 8 },
            fill: '#efe6d0',
            stroke: MEADOW.line,
            strokeWidth: 1,
          }),
        );
      }
    }

    // Pieces
    for (let i = 0; i < this.state.cells.length; i++) {
      const c = this.state.cells[i];
      if (c === 'empty') continue;
      const p = at(i % W, Math.floor(i / W));
      if (c === 'hole') {
        this.layer.addChild(
          new Sprite({ name: 'hole', pos: p, z: 1, shape: { kind: 'circle', radius: CELL * 0.32 }, fill: '#232228', stroke: MEADOW.accent, strokeWidth: 3 }),
        );
      } else if (c === 'blank') {
        this.layer.addChild(
          new Sprite({ name: 'blank', pos: p, z: 2, shape: { kind: 'rect', w: CELL * 0.62, h: CELL * 0.62, r: 8 }, fill: '#cbbfa4', stroke: '#2f281d', strokeWidth: 2 }),
        );
      } else if (c === 'x') {
        this.layer.addChild(
          new Sprite({ name: 'xsq', pos: p, z: 2, shape: { kind: 'rect', w: CELL * 0.62, h: CELL * 0.62, r: 8 }, fill: MEADOW.warn, stroke: '#2f281d', strokeWidth: 2 }),
        );
        this.layer.addChild(
          new Sprite({ name: 'xmark', pos: p, z: 3, shape: { kind: 'glyph', char: '✕', size: CELL * 0.4 }, fill: '#2f281d' }),
        );
      } else if (c === 'star') {
        this.layer.addChild(
          new Sprite({ name: 'star', pos: p, z: 2, shape: { kind: 'circle', radius: CELL * 0.28 }, fill: '#e8c15a', stroke: MEADOW.accent, strokeWidth: 3 }),
        );
        this.layer.addChild(
          new Sprite({ name: 'star-core', pos: p, z: 3, shape: { kind: 'circle', radius: CELL * 0.1 }, fill: '#fbf6ea' }),
        );
      } else {
        // arrow
        this.layer.addChild(
          new Sprite({ name: 'arrow', pos: p, z: 2, shape: { kind: 'rect', w: CELL * 0.62, h: CELL * 0.62, r: 8 }, fill: MEADOW.good, stroke: '#2f281d', strokeWidth: 2 }),
        );
        this.layer.addChild(
          new Sprite({ name: 'arrow-glyph', pos: p, z: 3, shape: { kind: 'glyph', char: ARROW_GLYPH[c]!, size: CELL * 0.34 }, fill: '#2f281d' }),
        );
      }
    }

    // Cursor (canonical pos, cosmetic paint)
    this.layer.addChild(
      new Sprite({
        name: 'cursor',
        pos: at(this.cursor.x, this.cursor.y),
        z: 4,
        shape: { kind: 'rect', w: CELL - 2, h: CELL - 2, r: 10 },
        fill: 'none',
        stroke: MEADOW.accent,
        strokeWidth: 4,
      }),
    );

    // HUD
    this.layer.addChild(
      new Text({
        name: 'hud',
        text: `${lvl.name}  ·  Level ${this.state.levelIndex + 1} / ${LEVELS.length}  ·  Taps left ${this.state.tapsLeft}  ·  arrows aim, Enter taps, U undo, R restart`,
        pos: { x: VW / 2, y: 44 },
        size: 22,
        align: 'center',
        fill: MEADOW.inkSoft,
      }),
    );
    this.layer.addChild(
      new Text({
        name: 'legend',
        text: '✕ tap to clear  ·  ● star collapses to a well  ·  ▶ slides its row/column  ·  the well swallows',
        pos: { x: VW / 2, y: VH - 26 },
        size: 18,
        align: 'center',
        fill: withAlpha(MEADOW.inkSoft, 0.8),
      }),
    );
  }

  private tap(): void {
    const i = this.cursor.y * W + this.cursor.x;
    const next = applyTap(this.state, i);
    if (next === this.state) {
      audio.blip(160); // dab — ineffective tap, no budget spent
      return;
    }
    this.history.push(this.state);
    this.state = next;
    this.moves += 1;
    audio.blip(320 + this.moves * 6);
    this.rebuild();
    if (isWin(this.state)) return this.win();
    const fail = failReason(this.state);
    if (fail) this.fail(fail);
  }

  private undo(): void {
    if (this.history.length === 0) return;
    this.over = false;
    this.state = this.history.pop()!;
    audio.blip(240);
    hideScreen();
    this.rebuild();
  }

  restart(): void {
    this.over = false;
    this.history = [];
    this.moves = 0;
    this.state = initialState(this.state.levelIndex);
    hideScreen();
    this.rebuild();
  }

  private win(): void {
    this.over = true;
    audio.success();
    const isLast = this.state.levelIndex >= LEVELS.length - 1;
    showScreen({
      title: 'Clean!',
      body: `${LEVELS[this.state.levelIndex].name} swept in ${this.moves} taps${this.state.tapsLeft === 0 ? ' — none to spare' : ''}.`,
      actions: isLast
        ? [{ label: 'Play again', primary: true, onSelect: () => this.gotoLevel(0) }]
        : [
            { label: 'Next debris field', primary: true, onSelect: () => this.gotoLevel(this.state.levelIndex + 1) },
            { label: 'Replay', onSelect: () => this.restart() },
          ],
    });
    this.emit('solved', this.state.levelIndex);
  }

  private fail(reason: string): void {
    this.over = true;
    audio.blip(120);
    const titles: Record<string, string> = {
      'out-of-taps': 'Out of taps!',
      'not-clean': 'Not clean…',
      stuck: 'Stuck.',
    };
    showScreen({
      title: titles[reason] ?? 'Failed',
      body:
        reason === 'out-of-taps'
          ? 'The budget is spent but debris remains.'
          : reason === 'not-clean'
            ? 'Nothing left to tap, but debris remains.'
            : 'Taps remain, but no tap can change the board.',
      actions: [
        { label: 'Retry', primary: true, onSelect: () => this.restart() },
        { label: 'Undo last tap', onSelect: () => this.undo() },
      ],
    });
  }

  gotoLevel(index: number): void {
    this.over = false;
    this.history = [];
    this.moves = 0;
    this.cursor = { x: 0, y: 0 };
    this.state = initialState(index);
    hideScreen();
    this.rebuild();
  }

  protected override onProcess(): void {
    if (this.over || !this.world) return;
    const input = (this.world as World).input;
    let moved = false;
    if (input.justPressed('up') && this.cursor.y > 0) { this.cursor.y--; moved = true; }
    if (input.justPressed('down') && this.cursor.y < H - 1) { this.cursor.y++; moved = true; }
    if (input.justPressed('left') && this.cursor.x > 0) { this.cursor.x--; moved = true; }
    if (input.justPressed('right') && this.cursor.x < W - 1) { this.cursor.x++; moved = true; }
    if (moved) this.rebuild();
    if (input.justPressed('confirm')) this.tap();
    if (input.justPressed('undo')) this.undo();
    if (input.justPressed('restart')) this.restart();
  }

  protected override serializeProps(): Record<string, unknown> {
    return { state: this.state, cursor: this.cursor, over: this.over, moves: this.moves };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (props.state) {
      this.state = props.state as GravewellState;
      this.cursor = (props.cursor as { x: number; y: number }) ?? { x: 0, y: 0 };
      this.over = !!props.over;
      this.moves = (props.moves as number) ?? 0;
      for (const c of this.layer.children.slice()) this.layer.removeChild(c);
      this.rebuild();
    }
  }
}

registerNode('GravewellView', () => new GravewellView());

export const gravewellGame = defineGame({
  title: 'Gravewell',
  width: VW,
  height: VH,
  background: MEADOW.bg,
  build: () => new GravewellView({ name: 'gravewell' }),
  probe: (world) => {
    const view = world.root.find('gravewell') as GravewellView | null;
    const s = view?.state ?? initialState(0);
    return {
      frame: world.frame,
      hash: world.hash(),
      level: s.levelIndex,
      solved: isWin(s),
      fail: failReason(s),
      tapsLeft: s.tapsLeft,
      pushables: countPushables(s),
      clickables: countClickables(s),
      options: effectiveTaps(s).length,
      cursorX: view?.cursor.x ?? 0,
      cursorY: view?.cursor.y ?? 0,
      moves: view?.moves ?? 0,
    };
  },
});

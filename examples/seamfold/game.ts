// Seamfold as a hayao game: pure logic (logic.ts) drives a scene-tree view.
// The twisted torus is SHOWN by tiling 3×3 ghost copies of the field around
// the canonical one, each copy shifted by the seam offsets (SPEC.md M7) — the
// world looks endless while only the canonical copy is real. All view nodes
// are cosmetic; the one canonical prop is `state`.

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
  DIRS,
  LEVELS,
  applyMove,
  initialState,
  isSolved,
  type Move,
  type SeamfoldState,
} from './logic';

const W = 1280;
const H = 720;
const GHOST_ALPHA = 0.28;

class SeamfoldView extends Node {
  override readonly type = 'SeamfoldView';
  state: SeamfoldState = initialState(0);
  moves = 0;
  private history: SeamfoldState[] = [];
  private won = false;
  private layer = new Node({ name: 'layer' });

  protected override onReady(): void {
    this.layer.cosmetic = true; // pure derived view — never enters the hash
    this.addChild(this.layer);
    this.rebuild();
  }

  private metrics() {
    const lvl = LEVELS[this.state.levelIndex];
    // Fit the 3×3 tiling with a little breathing room.
    const cell = Math.floor(Math.min((W * 0.94) / (3 * lvl.width), (H * 0.86) / (3 * lvl.height)));
    return { lvl, cell, ox: W / 2 - (lvl.width * cell) / 2 + cell / 2, oy: H / 2 - (lvl.height * cell) / 2 + cell / 2 + 14 };
  }

  private rebuild(): void {
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    const { lvl, cell, ox, oy } = this.metrics();

    // One copy per (dx,dy) in the 3×3 neighborhood. Canonical cell (x,y)
    // appears in copy (dx,dy) at grid coords (x + dx·W + dy·xOff,
    // y + dy·H + dx·yOff) — the same twist the wrap applies, inverted.
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ghost = dx !== 0 || dy !== 0;
        const alpha = ghost ? GHOST_ALPHA : 1;
        const at = (x: number, y: number) => ({
          x: ox + (x + dx * lvl.width + dy * lvl.xOff) * cell,
          y: oy + (y + dy * lvl.height + dx * lvl.yOff) * cell,
        });

        // Floor + walls
        for (let y = 0; y < lvl.height; y++) {
          for (let x = 0; x < lvl.width; x++) {
            const wall = lvl.walls.has(`${x},${y}`);
            this.layer.addChild(
              new Sprite({
                name: 'tile',
                pos: at(x, y),
                z: ghost ? 0 : 1,
                shape: { kind: 'rect', w: cell - 3, h: cell - 3, r: wall ? 6 : 4 },
                fill: withAlpha(wall ? '#4a4033' : '#efe6d0', alpha),
                stroke: withAlpha(wall ? '#2f281d' : MEADOW.line, alpha),
                strokeWidth: wall ? 2 : 1,
              }),
            );
          }
        }
        // Goals
        for (const g of lvl.goals) {
          this.layer.addChild(
            new Sprite({ name: 'goal', pos: at(g.x, g.y), z: ghost ? 0 : 2, shape: { kind: 'circle', radius: cell * 0.16 }, fill: 'none', stroke: withAlpha(MEADOW.accent, alpha), strokeWidth: 3 }),
          );
        }
        // Boxes
        for (const b of this.state.boxes) {
          const onGoal = lvl.goals.some((g) => g.x === b.x && g.y === b.y);
          this.layer.addChild(
            new Sprite({ name: 'box', pos: at(b.x, b.y), z: ghost ? 0 : 3, shape: { kind: 'rect', w: cell * 0.7, h: cell * 0.7, r: 5 }, fill: withAlpha(onGoal ? MEADOW.good : MEADOW.warn, alpha), stroke: withAlpha('#2f281d', alpha), strokeWidth: 2 }),
          );
        }
        // Player
        this.layer.addChild(
          new Sprite({ name: 'player', pos: at(this.state.player.x, this.state.player.y), z: ghost ? 0 : 4, shape: { kind: 'circle', radius: cell * 0.3 }, fill: withAlpha(MEADOW.accent, alpha), stroke: withAlpha('#2f281d', alpha), strokeWidth: 2 }),
        );
      }
    }

    // Seam frame around the canonical copy — the twist offsets make the ghost
    // rows/columns visibly slide, and this frame is the reference edge.
    this.layer.addChild(
      new Sprite({
        name: 'seam-frame',
        pos: { x: ox + ((lvl.width - 1) * cell) / 2, y: oy + ((lvl.height - 1) * cell) / 2 },
        z: 5,
        shape: { kind: 'rect', w: lvl.width * cell + 4, h: lvl.height * cell + 4, r: 4 },
        fill: 'none',
        stroke: withAlpha(MEADOW.ink, 0.55),
        strokeWidth: 2,
      }),
    );

    // HUD
    this.layer.addChild(
      new Text({
        name: 'hud',
        text: `${lvl.name}  ·  Level ${this.state.levelIndex + 1} / ${LEVELS.length}  ·  Moves ${this.moves}  ·  arrows push, U undo, R restart`,
        pos: { x: W / 2, y: 40 },
        size: 22,
        align: 'center',
        fill: MEADOW.inkSoft,
      }),
    );
    if (lvl.xOff !== 0 || lvl.yOff !== 0) {
      this.layer.addChild(
        new Text({ name: 'twist', text: `twist  x:${lvl.xOff}  y:${lvl.yOff}`, pos: { x: W / 2, y: H - 26 }, size: 18, align: 'center', fill: MEADOW.inkSoft }),
      );
    }
  }

  private tryMove(move: Move): void {
    const next = applyMove(this.state, move);
    if (next === this.state) return; // blocked
    this.history.push(this.state);
    this.state = next;
    this.moves += 1;
    audio.blip(300 + this.moves * 4);
    this.rebuild();
    if (isSolved(this.state)) this.win();
  }

  private undo(): void {
    if (this.won || this.history.length === 0) return;
    this.state = this.history.pop()!;
    this.moves += 1;
    audio.blip(240);
    this.rebuild();
  }

  restart(): void {
    this.won = false;
    this.history = [];
    this.moves = 0;
    this.state = initialState(this.state.levelIndex);
    hideScreen();
    this.rebuild();
  }

  private win(): void {
    this.won = true;
    audio.success();
    const isLast = this.state.levelIndex >= LEVELS.length - 1;
    showScreen({
      title: 'Folded!',
      body: `${LEVELS[this.state.levelIndex].name} sewn up in ${this.moves} moves.`,
      actions: isLast
        ? [{ label: 'Play again', primary: true, onSelect: () => this.gotoLevel(0) }]
        : [
            { label: 'Next seam', primary: true, onSelect: () => this.gotoLevel(this.state.levelIndex + 1) },
            { label: 'Replay', onSelect: () => this.restart() },
          ],
    });
    this.emit('solved', this.state.levelIndex);
  }

  gotoLevel(index: number): void {
    this.won = false;
    this.history = [];
    this.moves = 0;
    this.state = initialState(index);
    hideScreen();
    this.rebuild();
  }

  protected override onProcess(): void {
    if (this.won || !this.world) return;
    const input = (this.world as World).input;
    for (const d of DIRS) if (input.justPressed(d)) this.tryMove(d);
    if (input.justPressed('undo')) this.undo();
    if (input.justPressed('restart')) this.restart();
  }

  protected override serializeProps(): Record<string, unknown> {
    return { state: this.state, won: this.won, moves: this.moves };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (props.state) {
      this.state = props.state as SeamfoldState;
      this.won = !!props.won;
      this.moves = (props.moves as number) ?? 0;
      for (const c of this.layer.children.slice()) this.layer.removeChild(c);
      this.rebuild();
    }
  }
}

registerNode('SeamfoldView', () => new SeamfoldView());

export const seamfoldGame = defineGame({
  title: 'Seamfold',
  width: W,
  height: H,
  background: MEADOW.bg,
  build: () => new SeamfoldView({ name: 'seamfold' }),
  probe: (world) => {
    const view = world.root.find('seamfold') as SeamfoldView | null;
    const lvl = view ? LEVELS[view.state.levelIndex] : LEVELS[0];
    return {
      frame: world.frame,
      hash: world.hash(),
      level: view?.state.levelIndex ?? 0,
      solved: view ? isSolved(view.state) : false,
      moves: view?.moves ?? 0,
      playerX: view?.state.player.x ?? 0,
      playerY: view?.state.player.y ?? 0,
      boxX: view?.state.boxes[0]?.x ?? 0,
      boxY: view?.state.boxes[0]?.y ?? 0,
      boxesOnGoal: view ? view.state.boxes.filter((b) => lvl.goals.some((g) => g.x === b.x && g.y === b.y)).length : 0,
    };
  },
});

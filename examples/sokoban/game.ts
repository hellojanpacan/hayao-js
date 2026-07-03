// Sokoban as a hayao game: the pure logic (logic.ts) drives a scene-tree view.
// Input edges apply moves; undo is a snapshot stack; the state is serialized so
// world.hash()/snapshot() cover it and the determinism harness verifies the game.

import {
  Node,
  Sprite,
  Text,
  MEADOW,
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
  type SokobanState,
} from './logic';

const CELL = 84;

class SokobanView extends Node {
  override readonly type = 'SokobanView';
  state: SokobanState = initialState(0);
  private history: SokobanState[] = [];
  private won = false;
  private layer = new Node({ name: 'layer' });

  protected override onReady(): void {
    // The view is pure derived state → cosmetic, so it never enters the hash.
    // Only this node's `state` prop is canonical.
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.rebuild();
  }

  private origin() {
    const lvl = LEVELS[this.state.levelIndex];
    return {
      ox: 640 - (lvl.width * CELL) / 2 + CELL / 2,
      oy: 360 - (lvl.height * CELL) / 2 + CELL / 2,
    };
  }

  private rebuild(): void {
    // Clear and repaint. SVG is retained-mode; for a grid this is trivially cheap.
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    const lvl = LEVELS[this.state.levelIndex];
    const { ox, oy } = this.origin();
    const at = (x: number, y: number) => ({ x: ox + x * CELL, y: oy + y * CELL });

    // Floor + walls
    for (let y = 0; y < lvl.height; y++) {
      for (let x = 0; x < lvl.width; x++) {
        const wall = lvl.walls.has(`${x},${y}`);
        this.layer.addChild(
          new Sprite({
            name: `tile-${x}-${y}`,
            pos: at(x, y),
            z: 0,
            shape: { kind: 'rect', w: CELL - 4, h: CELL - 4, r: wall ? 8 : 6 },
            fill: wall ? '#4a4033' : '#efe6d0',
            stroke: wall ? '#2f281d' : MEADOW.line,
            strokeWidth: wall ? 2 : 1,
          }),
        );
      }
    }
    // Goals
    for (const g of lvl.goals) {
      this.layer.addChild(
        new Sprite({ name: 'goal', pos: at(g.x, g.y), z: 1, shape: { kind: 'circle', radius: 12 }, fill: 'none', stroke: MEADOW.accent, strokeWidth: 3 }),
      );
    }
    // Boxes (green when on a goal)
    for (const b of this.state.boxes) {
      const onGoal = lvl.goals.some((g) => g.x === b.x && g.y === b.y);
      this.layer.addChild(
        new Sprite({ name: 'box', pos: at(b.x, b.y), z: 2, shape: { kind: 'rect', w: CELL - 22, h: CELL - 22, r: 8 }, fill: onGoal ? MEADOW.good : MEADOW.warn, stroke: '#2f281d', strokeWidth: 2 }),
      );
    }
    // Player
    this.layer.addChild(
      new Sprite({ name: 'player', pos: at(this.state.player.x, this.state.player.y), z: 3, shape: { kind: 'circle', radius: 22 }, fill: MEADOW.accent, stroke: '#2f281d', strokeWidth: 2 }),
    );

    // HUD
    this.layer.addChild(
      new Text({ name: 'hud', text: `Level ${this.state.levelIndex + 1} / ${LEVELS.length}   ·   Moves ${this.history.length}   ·   arrows to push, U undo, R restart`, pos: { x: 640, y: 44 }, size: 22, align: 'center', fill: MEADOW.inkSoft }),
    );
  }

  private tryMove(move: Move): void {
    const next = applyMove(this.state, move);
    if (next === this.state) return; // blocked
    this.history.push(this.state);
    this.state = next;
    audio.blip(300 + this.history.length * 4);
    this.rebuild();
    if (isSolved(this.state)) this.win();
  }

  private undo(): void {
    if (this.won || this.history.length === 0) return;
    this.state = this.history.pop()!;
    audio.blip(240);
    this.rebuild();
  }

  restart(): void {
    this.won = false;
    this.history = [];
    this.state = initialState(this.state.levelIndex);
    hideScreen();
    this.rebuild();
  }

  private win(): void {
    this.won = true;
    audio.success();
    const isLast = this.state.levelIndex >= LEVELS.length - 1;
    showScreen({
      title: 'Solved!',
      body: `Cleared level ${this.state.levelIndex + 1} in ${this.history.length} moves.`,
      actions: isLast
        ? [{ label: 'Play again', primary: true, onSelect: () => this.gotoLevel(0) }]
        : [
            { label: 'Next level', primary: true, onSelect: () => this.gotoLevel(this.state.levelIndex + 1) },
            { label: 'Replay', onSelect: () => this.restart() },
          ],
    });
    this.emit('solved', this.state.levelIndex);
  }

  gotoLevel(index: number): void {
    this.won = false;
    this.history = [];
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

  // Serialize the logic state so world.hash()/snapshot() cover the game.
  protected override serializeProps(): Record<string, unknown> {
    return { state: this.state, won: this.won };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (props.state) {
      this.state = props.state as SokobanState;
      this.won = !!props.won;
      // history length isn't restored (undo history is transient), which is fine.
      for (const c of this.layer.children.slice()) this.layer.removeChild(c);
      this.rebuild();
    }
  }
}

registerNode('SokobanView', () => new SokobanView());

export function makeSokobanRoot(): SokobanView {
  return new SokobanView({ name: 'sokoban' });
}

export const sokobanGame = defineGame({
  title: 'Sokoban',
  width: 1280,
  height: 720,
  background: MEADOW.bg,
  build: () => makeSokobanRoot(),
  probe: (world) => {
    const view = world.root.find('sokoban') as SokobanView | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      level: view?.state.levelIndex ?? 0,
      solved: view ? isSolved(view.state) : false,
      boxes: view?.state.boxes.length ?? 0,
    };
  },
});

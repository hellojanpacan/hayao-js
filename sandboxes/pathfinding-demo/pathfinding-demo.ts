// pathfinding-demo — one primitive: astarGrid. Paint walls and watch the path
// re-solve instantly. Knobs: arrows = move cursor, SPACE = toggle wall, X = drop
// goal on cursor, Z = toggle diagonal, R = clear. Fully deterministic (no rng).
// No genre. See sandboxes/README.md.

import {
  Node,
  Sprite,
  Text,
  astarGrid,
  MEADOW,
  KENTO,
  registerNode,
  defineGame,
  type Cell,
  type World,
} from '@hayao';

const COLS = 22;
const ROWS = 12;
const CELL = 50;
const OX = 640 - (COLS * CELL) / 2 + CELL / 2;
const OY = 380 - (ROWS * CELL) / 2 + CELL / 2;

class PathfindingDemo extends Node {
  override readonly type = 'PathfindingDemo';
  walls: boolean[] = new Array(COLS * ROWS).fill(false);
  cursor: Cell = { x: 3, y: 6 };
  start: Cell = { x: 1, y: 6 };
  goal: Cell = { x: 20, y: 6 };
  diagonal = false;
  pathLen = 0;
  private layer = new Node({ name: 'layer' });
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 40 }, size: 22, align: 'center', fill: MEADOW.inkSoft, text: '' });
    this.rebuild();
  }

  private at(c: Cell) {
    return { x: OX + c.x * CELL, y: OY + c.y * CELL };
  }
  private idx(x: number, y: number) {
    return y * COLS + x;
  }

  private solve(): Cell[] {
    const passable = (x: number, y: number) => !this.walls[this.idx(x, y)];
    return astarGrid(this.start, this.goal, passable, { cols: COLS, rows: ROWS, diagonal: this.diagonal }) ?? [];
  }

  private rebuild(): void {
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    const path = this.solve();
    this.pathLen = path.length;
    const onPath = new Set(path.map((c) => this.idx(c.x, c.y)));
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const wall = this.walls[this.idx(x, y)];
        const lit = onPath.has(this.idx(x, y));
        this.layer.addChild(
          new Sprite({ pos: this.at({ x, y }), z: 0, shape: { kind: 'rect', w: CELL - 4, h: CELL - 4, r: 5 }, fill: wall ? KENTO.sumiSoft : lit ? MEADOW.good : KENTO.gofun, stroke: MEADOW.line, strokeWidth: 1 }),
        );
      }
    }
    // start, goal, cursor
    this.layer.addChild(new Sprite({ pos: this.at(this.start), z: 2, shape: { kind: 'circle', radius: 15 }, fill: MEADOW.accent, stroke: KENTO.sumi, strokeWidth: 2 }));
    this.layer.addChild(new Sprite({ pos: this.at(this.goal), z: 2, shape: { kind: 'circle', radius: 15 }, fill: 'none', stroke: MEADOW.accent, strokeWidth: 4 }));
    this.layer.addChild(new Sprite({ pos: this.at(this.cursor), z: 3, shape: { kind: 'rect', w: CELL - 10, h: CELL - 10, r: 4 }, fill: 'none', stroke: MEADOW.warn, strokeWidth: 3 }));
    this.hud.text = `A* GRID · path ${this.pathLen} cells${this.pathLen === 0 ? ' (blocked!)' : ''}   ·   diagonal ${this.diagonal ? 'on' : 'off'}   ·   arrows move, SPACE wall, X goal, Z diag, R clear`;
    this.layer.addChild(this.hud);
  }

  protected override onProcess(): void {
    if (!this.world) return;
    const input = (this.world as World).input;
    let moved = false;
    if (input.justPressed('left')) { this.cursor.x = Math.max(0, this.cursor.x - 1); moved = true; }
    if (input.justPressed('right')) { this.cursor.x = Math.min(COLS - 1, this.cursor.x + 1); moved = true; }
    if (input.justPressed('up')) { this.cursor.y = Math.max(0, this.cursor.y - 1); moved = true; }
    if (input.justPressed('down')) { this.cursor.y = Math.min(ROWS - 1, this.cursor.y + 1); moved = true; }
    if (input.justPressed('confirm')) { const i = this.idx(this.cursor.x, this.cursor.y); this.walls[i] = !this.walls[i]; moved = true; }
    if (input.justPressed('action2')) { this.goal = { x: this.cursor.x, y: this.cursor.y }; this.walls[this.idx(this.goal.x, this.goal.y)] = false; moved = true; }
    if (input.justPressed('action')) { this.diagonal = !this.diagonal; moved = true; }
    if (input.justPressed('restart')) { this.walls.fill(false); moved = true; }
    if (moved) this.rebuild();
  }

  protected override serializeProps(): Record<string, unknown> {
    return { walls: this.walls, cursor: this.cursor, goal: this.goal, diagonal: this.diagonal };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (Array.isArray(props.walls)) this.walls = props.walls as boolean[];
    if (props.cursor) this.cursor = props.cursor as Cell;
    if (props.goal) this.goal = props.goal as Cell;
    if (typeof props.diagonal === 'boolean') this.diagonal = props.diagonal;
    this.rebuild();
  }
}

registerNode('PathfindingDemo', () => new PathfindingDemo());

export const pathfindingDemoGame = defineGame({
  title: 'Pathfinding Demo',
  width: 1280,
  height: 720,
  background: MEADOW.bg,
  build: () => new PathfindingDemo({ name: 'pathfinding-demo' }),
  probe: (world) => {
    const lab = world.root.find('pathfinding-demo') as PathfindingDemo | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      pathLen: lab?.pathLen ?? 0,
      diagonal: lab?.diagonal ?? false,
    };
  },
});

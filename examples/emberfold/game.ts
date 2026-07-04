// Emberfold as a hayao game: the pure slide-and-merge logic (logic.ts) drives a
// scene-tree view of a night forge. The whole 40-level campaign is DATA generated
// by the solver-backed generator (levels.ts / campaign.ts); this file only VIEWS
// it. Art is code-as-art — embers are warm gradient tiles that glow hotter as they
// fuse, stones are cold slate, the forge breathes a radial glow behind the board.

import {
  Node,
  Sprite,
  Text,
  KENTO,
  mix,
  withAlpha,
  linearGradient,
  radialGradient,
  glow,
  registerNode,
  showScreen,
  hideScreen,
  audio,
  defineGame,
  type FeelSpec,
  type FeedbackContract,
  type World,
} from '@hayao';
import { DIRS, EMPTY, STONE, applyMove, isWin, maxTile, puzzleFromRecord, type Move } from './logic';
import { EMBER_LEVELS } from './levels';

const W = 1280;
const H = 720;

// ── Feel contract (Channel 4). A turn-based puzzle's honest floor is its feedback:
// every meaningful action answers on ≥2 channels. No avatar, no scroll, no controller.
const FEEDBACK: FeedbackContract = {
  slide: { channels: ['audio', 'visual'] },
  merge: { channels: ['audio', 'visual'] },
  win: { channels: ['audio', 'visual'] },
};
export const feel: FeelSpec = {
  background: KENTO.yohaku,
  feedback: { contract: FEEDBACK, events: ['slide', 'merge', 'win'] },
};

/** Heat ramp: pale kindling → white-hot. Indexed by log2(value) - 1 (value 2 → 0). */
const HEAT: { fill: string; grad: [string, string]; ink: string }[] = [
  { fill: KENTO.washi, grad: [KENTO.gofun, KENTO.kinu], ink: KENTO.sumi }, // 2
  { fill: KENTO.kinako, grad: [mix(KENTO.kinako, KENTO.gofun, 0.4), KENTO.kinako], ink: KENTO.sumi }, // 4
  { fill: KENTO.ko, grad: [KENTO.ko, KENTO.koDeep], ink: KENTO.sumi }, // 8
  { fill: KENTO.kaki, grad: [KENTO.kaki, KENTO.kakiDeep], ink: KENTO.sumi }, // 16
  { fill: KENTO.shu, grad: [KENTO.shu, KENTO.shuDeep], ink: KENTO.gofun }, // 32
  { fill: KENTO.shuDeep, grad: [KENTO.shu, mix(KENTO.shuDeep, KENTO.kuro, 0.25)], ink: KENTO.gofun }, // 64
  { fill: mix(KENTO.kaki, KENTO.gofun, 0.4), grad: [KENTO.gofun, KENTO.kaki], ink: KENTO.sumi }, // 128
  { fill: mix(KENTO.shu, KENTO.gofun, 0.55), grad: [KENTO.gofun, KENTO.shu], ink: KENTO.sumi }, // 256+
];
/** Tier index for a power-of-two value (2 → 0, 4 → 1, …), capped — no Math.log2 (banned in sim). */
function tierOf(v: number): number {
  let t = 0;
  let x = 2;
  while (x < v && t < HEAT.length - 1) { x *= 2; t++; }
  return t;
}
const heatOf = (v: number): (typeof HEAT)[number] => HEAT[tierOf(v)];

/** Canonical, serialized game state — everything world.hash() must cover. */
interface ViewState {
  levelIndex: number;
  cells: number[];
  moves: number;
  best: number;
  won: boolean;
}

function initState(levelIndex: number): ViewState {
  const rec = EMBER_LEVELS[levelIndex];
  const cells = puzzleFromRecord(rec).initial().cells;
  return { levelIndex, cells, moves: 0, best: 0, won: false };
}

class EmberfoldView extends Node {
  override readonly type = 'EmberfoldView';
  state: ViewState = initState(0);
  private history: { cells: number[]; moves: number; best: number }[] = [];
  private layer = new Node({ name: 'layer' });

  protected override onReady(): void {
    this.layer.cosmetic = true; // pure derived view — only `state` is canonical
    this.addChild(this.layer);
    this.rebuild();
  }

  private get rec() {
    return EMBER_LEVELS[this.state.levelIndex];
  }

  private grid() {
    return { cols: this.rec.cols, rows: this.rec.rows, cells: this.state.cells, target: this.rec.target };
  }

  private geom() {
    const { cols, rows } = this.rec;
    const cell = Math.min(126, Math.floor(Math.min((W - 300) / cols, (H - 260) / rows)));
    const gw = cols * cell;
    const gh = rows * cell;
    return { cols, rows, cell, ox: W / 2 - gw / 2, oy: H / 2 - gh / 2 + 22, gw, gh };
  }

  private rebuild(): void {
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    const { cols, rows, cell, ox, oy, gw, gh } = this.geom();
    const pad = cell * 0.09;
    const at = (i: number) => ({ x: ox + (i % cols) * cell + cell / 2, y: oy + Math.floor(i / cols) * cell + cell / 2 });
    const rec = this.rec;
    const target = rec.target;

    // Night sky over the forge — deep indigo, warming toward the hearth below.
    this.layer.addChild(
      new Sprite({ name: 'sky', pos: { x: W / 2, y: H / 2 }, z: -20, shape: { kind: 'rect', w: W, h: H }, fill: KENTO.yohaku, gradient: linearGradient([KENTO.yohaku, KENTO.kuro, mix(KENTO.shuDeep, KENTO.yohaku, 0.72)], 90) }),
    );
    // Hearth glow breathing behind the board (radial, warm) — cosmetic atmosphere.
    this.layer.addChild(
      new Sprite({ name: 'hearth', pos: { x: W / 2, y: oy + gh / 2 }, z: -12, shape: { kind: 'circle', radius: Math.max(gw, gh) * 0.78 }, fill: withAlpha(KENTO.kaki, 0.12), gradient: radialGradient([withAlpha(KENTO.kaki, 0.28), withAlpha(KENTO.shuDeep, 0.0)]) }),
    );
    // Board plate.
    this.layer.addChild(
      new Sprite({ name: 'plate', pos: { x: W / 2, y: oy + gh / 2 }, z: -6, shape: { kind: 'rect', w: gw + pad * 2.4, h: gh + pad * 2.4, r: cell * 0.16 }, fill: mix(KENTO.kuro, KENTO.sumi, 0.5), stroke: withAlpha(KENTO.kinako, 0.28), strokeWidth: 2 }),
    );

    const n = cols * rows;
    for (let i = 0; i < n; i++) {
      const p = at(i);
      const v = this.state.cells[i];
      // Recessed cell socket under every position.
      this.layer.addChild(
        new Sprite({ name: `socket-${i}`, pos: p, z: -4, shape: { kind: 'rect', w: cell - pad * 2, h: cell - pad * 2, r: cell * 0.13 }, fill: withAlpha(KENTO.kuro, 0.55), stroke: withAlpha(KENTO.sumiSoft, 0.6), strokeWidth: 1 }),
      );
      if (v === STONE) {
        // Cold slate block — immovable, unmergeable. Reads dark and inert.
        this.layer.addChild(
          new Sprite({ name: `stone-${i}`, pos: p, z: 2, shape: { kind: 'rect', w: cell - pad * 2.2, h: cell - pad * 2.2, r: cell * 0.1 }, fill: KENTO.stone, gradient: linearGradient([mix(KENTO.stone, KENTO.gofun, 0.14), KENTO.stone, KENTO.sumiSoft], 90), stroke: KENTO.sumi, strokeWidth: 2 }),
        );
        for (const dx of [-0.16, 0.16]) {
          this.layer.addChild(new Sprite({ name: `stone-crack-${i}`, pos: { x: p.x + cell * dx, y: p.y }, z: 3, shape: { kind: 'rect', w: 2, h: cell * 0.42 }, fill: withAlpha(KENTO.kuro, 0.5) }));
        }
      } else if (v !== EMPTY) {
        // Ember tile: warm gradient + glow that intensifies with heat; the value in ink.
        const h = heatOf(v);
        const isHot = v >= target;
        const size = cell - pad * 2.2;
        this.layer.addChild(
          new Sprite({ name: `ember-${i}`, pos: p, z: 4, shape: { kind: 'rect', w: size, h: size, r: cell * 0.15 }, fill: h.fill, gradient: linearGradient([h.grad[0], h.grad[1]], 90), stroke: withAlpha(KENTO.gofun, isHot ? 0.7 : 0.35), strokeWidth: 2, shadow: glow(withAlpha(h.fill, isHot ? 1 : 0.6), cell * (isHot ? 0.5 : 0.28)) }),
        );
        this.layer.addChild(
          new Text({ name: `val-${i}`, text: String(v), pos: { x: p.x, y: p.y + cell * 0.02 }, z: 6, size: cell * (v >= 100 ? 0.3 : 0.4), align: 'center', fill: h.ink }),
        );
      }
    }

    // HUD — act, progress, target heat, slides vs par.
    const best = maxTile(this.grid());
    this.layer.addChild(new Text({ name: 'title', text: rec.actName, pos: { x: W / 2, y: 50 }, size: 30, align: 'center', fill: KENTO.gofun }));
    this.layer.addChild(
      new Text({ name: 'sub', text: `Ember ${this.state.levelIndex + 1} / ${EMBER_LEVELS.length}   ·   fuse to ${target}   ·   hottest ${best || '—'}   ·   ${this.state.moves} slides (par ${rec.depth})`, pos: { x: W / 2, y: 88 }, size: 20, align: 'center', fill: KENTO.kinako }),
    );
    this.layer.addChild(
      new Text({ name: 'hint', text: 'arrows slide · equal embers fuse · stones hold fast · U undo · R restart', pos: { x: W / 2, y: H - 38 }, size: 18, align: 'center', fill: withAlpha(KENTO.kinako, 0.72) }),
    );
  }

  private slide(move: Move): void {
    if (this.state.won || !this.world) return;
    const before = this.grid();
    const after = applyMove(before, move);
    if (after === before) {
      audio.blip(150); // blocked — a low, short answer so a dead push still speaks
      return;
    }
    this.history.push({ cells: this.state.cells.slice(), moves: this.state.moves, best: this.state.best });
    const prevBest = this.state.best;
    this.state.cells = after.cells;
    this.state.moves++;
    this.state.best = Math.max(this.state.best, maxTile(after));
    if (this.state.best > prevBest) audio.blip(360 + tierOf(this.state.best) * 40); // a merge climbed the heat
    else audio.blip(300);
    this.rebuild();
    if (isWin(after)) this.win();
  }

  private undo(): void {
    if (this.state.won || this.history.length === 0) return;
    const prev = this.history.pop()!;
    this.state.cells = prev.cells;
    this.state.moves = prev.moves;
    this.state.best = prev.best;
    audio.blip(200);
    this.rebuild();
  }

  restart(): void {
    this.history = [];
    this.state = initState(this.state.levelIndex);
    hideScreen();
    this.rebuild();
  }

  gotoLevel(index: number): void {
    this.history = [];
    this.state = initState(Math.max(0, Math.min(EMBER_LEVELS.length - 1, index)));
    hideScreen();
    this.rebuild();
  }

  private win(): void {
    this.state.won = true;
    audio.success();
    const rec = this.rec;
    const perfect = this.state.moves <= rec.depth;
    const isLast = this.state.levelIndex >= EMBER_LEVELS.length - 1;
    showScreen({
      title: isLast ? 'The forge blazes white.' : 'Ember fused!',
      body: perfect
        ? `Reached ${rec.target} in ${this.state.moves} slides — the proven minimum. Flawless.`
        : `Reached ${rec.target} in ${this.state.moves} slides (a ${rec.depth}-slide line exists).`,
      actions: isLast
        ? [{ label: 'Stoke it again', primary: true, onSelect: () => this.gotoLevel(0) }]
        : [
            { label: 'Next ember', primary: true, onSelect: () => this.gotoLevel(this.state.levelIndex + 1) },
            { label: 'Replay', onSelect: () => this.restart() },
          ],
    });
    this.emit('fused', this.state.levelIndex);
  }

  protected override onProcess(): void {
    if (this.state.won || !this.world) return;
    const input = (this.world as World).input;
    for (const d of DIRS) if (input.justPressed(d)) this.slide(d);
    if (input.justPressed('undo')) this.undo();
    if (input.justPressed('restart')) this.restart();
  }

  protected override serializeProps(): Record<string, unknown> {
    return { state: this.state };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (props.state) {
      this.state = props.state as ViewState;
      this.history = [];
      this.rebuild();
    }
  }
}

registerNode('EmberfoldView', () => new EmberfoldView());

export function makeEmberfoldRoot(): EmberfoldView {
  return new EmberfoldView({ name: 'emberfold' });
}

export const emberfoldGame = defineGame({
  title: 'Emberfold',
  width: W,
  height: H,
  background: KENTO.yohaku,
  build: () => makeEmberfoldRoot(),
  probe: (world) => {
    const view = world.root.find('emberfold') as EmberfoldView | null;
    const g = view ? { cols: view.state.cells.length, rows: 1, cells: view.state.cells, target: EMBER_LEVELS[view.state.levelIndex].target } : null;
    return {
      frame: world.frame,
      hash: world.hash(),
      level: view?.state.levelIndex ?? 0,
      moves: view?.state.moves ?? 0,
      best: g ? maxTile(g) : 0,
      target: view ? EMBER_LEVELS[view.state.levelIndex].target : 0,
      won: view?.state.won ?? false,
    };
  },
});

// Tarnholm: an island town drawn as a printed woodblock MAP — a washi sea chart
// with teal water, sand-rimmed land, forest stands, and little illustrated
// buildings whose silhouettes tell them apart. The one number that matters is
// always live under the cursor: what THIS placement would score. Readable
// scoring is the whole genre.
//
// ART: the terrain is a pure, deterministic projection of world.state (the
// procgen island), so it reads the same every replay. It's painted into a
// cosmetic board that is rebuilt only when the island identity changes (a new
// game), from a STANDALONE per-tile rng — never world.rng, which would fold
// decoration into world.hash(). Buildings, cursor, and the gain label are the
// light dynamic layer, re-synced each frame.

import { KENTO, Node, NodePool, Sprite, Text, Rng, audio, blobPath, defineGame, hideScreen, mix, mutateColor, withAlpha, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { currentBuilding, initialTh, place, placementScore, BUILDINGS, GH, GW, QUEUE, TARGET, tidx, type BuildingKind, type Terrain, type ThState } from './logic';

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

// A woodblock sea chart: washi paper, teal sea, warm land.
const PAL = {
  paper: KENTO.washi,
  sea: mix(KENTO.asagiDeep, KENTO.aiDeep, 0.35),
  seaWave: mix(KENTO.asagi, KENTO.gofun, 0.35),
  sand: KENTO.kinako,
  grass: mix(KENTO.matsu, KENTO.ko, 0.12),
  forest: KENTO.matsuDeep,
  line: KENTO.kinako,
  cursorOk: KENTO.matsuDeep,
  cursorBad: KENTO.shuDeep,
  text: KENTO.sumiSoft,
  textSoft: KENTO.stone,
} as const;

// Five buildings, five readable silhouettes + hue families.
const ROOF: Record<BuildingKind, string> = { hut: KENTO.shuDeep, farm: KENTO.koDeep, sawmill: KENTO.kakiDeep, dock: KENTO.stone, temple: KENTO.fujiDeep };

const GRAIN_SEED = 55128;

export function thState(world: World): ThState {
  return world.state.th as ThState;
}

class ThView extends Node {
  override readonly type = 'ThView';
  private layer = new Node({ name: 'layer' });
  private board = new Node({ name: 'board' }); // static terrain (rebuilt on new island)
  private builtPool!: NodePool<Sprite>;
  private cursor!: Sprite;
  private gainLabel!: Text;
  private hud!: Text;
  private terrainRef: Terrain[] | null = null;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.board.cosmetic = true;
    this.layer.addChild(this.board);

    this.builtPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 5, shape: { kind: 'rect', w: 24, h: 24, r: 6 }, fill: KENTO.kinu }));
    this.cursor = this.layer.addChild(new Sprite({ z: 7, shape: { kind: 'rect', w: CELL, h: CELL, r: 10 }, fill: 'none', stroke: PAL.cursorOk, strokeWidth: 3 }));
    this.gainLabel = this.layer.addChild(new Text({ z: 8, size: 22, align: 'center', fill: PAL.cursorOk, text: '' }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 9, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 700 }, z: 9, size: 16, align: 'center', fill: PAL.textSoft, text: 'arrows aim · Space builds · every roof scores by its neighbours' }));

    // Paint the island immediately so frame 0 shows the chart, not blank paper.
    const w = this.world as World | undefined;
    if (w?.state.th) this.rebuildBoard(thState(w));
  }

  /** Rebuild the static island art. Runs on first ready and each new island. */
  private rebuildBoard(s: ThState): void {
    for (const c of this.board.children.slice()) this.board.removeChild(c);
    this.terrainRef = s.terrain;

    // Paper grain over the whole chart (standalone rng — not hashed).
    const grng = new Rng(GRAIN_SEED);
    for (let y = 30; y < 720; y += 84) {
      for (let x = 30; x < 1280; x += 84) {
        this.board.addChild(new Sprite({ pos: { x: x + grng.range(-16, 16), y: y + grng.range(-16, 16) }, z: -4, shape: { kind: 'circle', radius: grng.range(1.2, 2.8) }, fill: mutateColor(grng, grng.pick([KENTO.line, KENTO.kinu]), { light: 0.03 }), opacity: grng.range(0.22, 0.42) }));
      }
    }

    const isWater = (x: number, y: number) => x < 0 || y < 0 || x >= GW || y >= GH || s.terrain[tidx(x, y)] === 'water';

    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const t = s.terrain[tidx(x, y)];
        const c = at(x, y);
        const trng = new Rng(1000 + tidx(x, y) * 7 + 3);
        if (t === 'water') {
          // Continuous sea (edge-to-edge, no gap) with a couple of wave ticks.
          this.board.addChild(new Sprite({ pos: c, z: -3, shape: { kind: 'rect', w: CELL, h: CELL }, fill: PAL.sea }));
          if (trng.chance(0.5)) {
            const wy = c.y + trng.range(-14, 14);
            this.board.addChild(new Sprite({ pos: { x: c.x, y: wy }, z: -2, shape: { kind: 'rect', w: trng.range(14, 24), h: 2, r: 1 }, fill: PAL.seaWave, opacity: 0.5 }));
          }
          continue;
        }
        // Land: a sand base (peeks as a shoreline rim) under a rounded green tile.
        const touchesWater = isWater(x - 1, y) || isWater(x + 1, y) || isWater(x, y - 1) || isWater(x, y + 1);
        this.board.addChild(new Sprite({ pos: c, z: -3, shape: { kind: 'rect', w: CELL, h: CELL, r: touchesWater ? 14 : 4 }, fill: PAL.sand, opacity: touchesWater ? 1 : 0.55 }));
        const green = t === 'forest' ? PAL.forest : PAL.grass;
        this.board.addChild(new Sprite({ pos: c, z: -2, shape: { kind: 'rect', w: CELL - 10, h: CELL - 10, r: 8 }, fill: mutateColor(trng, green, { light: 0.03 }), stroke: withAlpha(KENTO.sumi, 0.12), strokeWidth: 1 }));
        if (t === 'forest') {
          const n = 1 + trng.int(2);
          for (let k = 0; k < n; k++) {
            const tx = c.x + trng.range(-16, 16);
            const ty = c.y + trng.range(-14, 14);
            const r = trng.range(9, 13);
            this.board.addChild(new Sprite({ pos: { x: tx + 2, y: ty + r * 0.7 }, z: -1, shape: { kind: 'circle', radius: r * 0.7 }, fill: withAlpha(KENTO.sumi, 0.12) }));
            this.board.addChild(new Sprite({ pos: { x: tx, y: ty }, z: -1, shape: { kind: 'path', d: blobPath(trng, r, 0.24, 7) }, fill: mutateColor(trng, KENTO.matsuDeep, { light: 0.05 }), stroke: withAlpha(KENTO.sumi, 0.4), strokeWidth: 1.5 }));
          }
        } else if (trng.chance(0.5)) {
          // A grass tuft or two on open meadow.
          for (let k = 0; k < 2; k++) {
            const gx = c.x + trng.range(-18, 18);
            const gy = c.y + trng.range(-12, 16);
            this.board.addChild(new Sprite({ pos: { x: gx, y: gy }, z: -1, shape: { kind: 'poly', points: [-4, 0, 0, -8, 4, 0] }, fill: withAlpha(KENTO.matsuDeep, 0.55) }));
          }
        }
      }
    }
  }

  /** Emit a small illustrated building (shadow + body + topper) from the pool. */
  private drawBuilding(kind: BuildingKind, cx: number, cy: number): void {
    const add = (props: ConstructorParameters<typeof Sprite>[0]) => {
      const sp = this.builtPool.get();
      sp.pos = props!.pos ?? { x: cx, y: cy };
      sp.shape = props!.shape!;
      sp.paint.fill = (props!.fill as string) ?? KENTO.kinu;
      sp.paint.stroke = (props!.stroke as string) ?? withAlpha(KENTO.sumi, 0.5);
      sp.paint.strokeWidth = props!.strokeWidth ?? 1.5;
      sp.paint.opacity = props!.opacity ?? 1;
      return sp;
    };
    // Contact shadow under every structure.
    add({ pos: { x: cx, y: cy + 15 }, shape: { kind: 'circle', radius: 15 }, fill: withAlpha(KENTO.sumi, 0.18), stroke: 'none', strokeWidth: 0 });
    const roof = ROOF[kind];
    switch (kind) {
      case 'hut':
        add({ pos: { x: cx, y: cy + 6 }, shape: { kind: 'rect', w: 26, h: 18, r: 3 }, fill: KENTO.kinu });
        add({ pos: { x: cx, y: cy - 6 }, shape: { kind: 'poly', points: [-17, 4, 0, -14, 17, 4], closed: true }, fill: roof });
        add({ pos: { x: cx, y: cy + 7 }, shape: { kind: 'circle', radius: 3.2 }, fill: KENTO.ko, stroke: 'none', strokeWidth: 0 });
        break;
      case 'farm':
        add({ pos: { x: cx, y: cy + 2 }, shape: { kind: 'rect', w: 30, h: 24, r: 4 }, fill: mix(KENTO.ko, KENTO.matsu, 0.25) });
        for (const dx of [-9, 0, 9]) add({ pos: { x: cx + dx, y: cy + 2 }, shape: { kind: 'rect', w: 2.5, h: 20, r: 1 }, fill: roof, stroke: 'none', strokeWidth: 0, opacity: 0.8 });
        break;
      case 'sawmill':
        add({ pos: { x: cx, y: cy + 6 }, shape: { kind: 'rect', w: 28, h: 18, r: 2 }, fill: KENTO.kinako });
        add({ pos: { x: cx, y: cy - 6 }, shape: { kind: 'rect', w: 30, h: 8, r: 2 }, fill: roof });
        add({ pos: { x: cx + 10, y: cy + 10 }, shape: { kind: 'circle', radius: 5 }, fill: KENTO.stone });
        break;
      case 'dock':
        add({ pos: { x: cx, y: cy }, shape: { kind: 'rect', w: 34, h: 12, r: 2 }, fill: roof });
        for (const dx of [-12, 0, 12]) add({ pos: { x: cx + dx, y: cy + 10 }, shape: { kind: 'rect', w: 3, h: 10, r: 1 }, fill: KENTO.sumiSoft, stroke: 'none', strokeWidth: 0 });
        break;
      case 'temple':
        // A little torii: two posts and a curved-ish top beam.
        for (const dx of [-11, 11]) add({ pos: { x: cx + dx, y: cy + 2 }, shape: { kind: 'rect', w: 5, h: 24, r: 1 }, fill: roof });
        add({ pos: { x: cx, y: cy - 11 }, shape: { kind: 'rect', w: 34, h: 6, r: 2 }, fill: roof });
        add({ pos: { x: cx, y: cy - 4 }, shape: { kind: 'rect', w: 26, h: 4, r: 1 }, fill: roof });
        break;
    }
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = thState(world);
    const input = world.input;
    if (this.terrainRef !== s.terrain) this.rebuildBoard(s);
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
    this.builtPool.begin();
    for (let y = 0; y < GH; y++)
      for (let x = 0; x < GW; x++) {
        const b = s.built[tidx(x, y)];
        if (b) {
          const c = at(x, y);
          this.drawBuilding(b, c.x, c.y);
        }
      }
    this.builtPool.end();

    const kind = currentBuilding(s);
    const gain = kind ? placementScore(s, kind, s.cursor.x, s.cursor.y) : -1;
    const cur = at(s.cursor.x, s.cursor.y);
    this.cursor.pos = cur;
    this.cursor.paint.stroke = gain >= 0 ? PAL.cursorOk : PAL.cursorBad;
    this.gainLabel.pos = { x: cur.x, y: cur.y - 44 };
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
  background: PAL.paper,
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

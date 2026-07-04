// Rootward: a sunlit-meadow tower defense. The sim (waves, economy, the
// rock-paper-scissors counter system) lives in world.state; this file is its
// VIEW. Readable HUD is a genre requirement — the lane is a trodden earth road,
// pads are tilled stone plots that show a cursor ring, towers show range on the
// selected pad, and wave/economy state is always visible.
//
// ART: the meadow is code-as-art in the house woodblock style — a washi ground
// with tonal grain, an earthen creep road drawn with `smoothOpenPath`, and
// organic `blobPath` foliage that keeps clear of the lane and the build plots.
// The whole field is built ONCE in onReady from STANDALONE rng streams (never
// world.rng — that would fold layout into world.hash()) and lives under a
// cosmetic node, so none of it is hashed and determinism stays intact. The
// dynamic actors (foes, towers, rings) are pooled and re-synced each frame.

import { Node, NodePool, Sprite, Text, Rng, audio, defineGame, hideScreen, registerNode, showScreen, KENTO, blobPath, smoothOpenPath, mutateColor, withAlpha, mix, type InputMap, type World, dhypot } from '@hayao';
import { initialRw, pointAt, stepRw, ENEMIES, PADS, PATH, TOWERS, WAVES, type RwState, type TowerKind } from './logic';

export const RW_INPUT_MAP: InputMap = {
  prev: ['ArrowLeft', 'KeyA'],
  next: ['ArrowRight', 'KeyD'],
  'build-arrow': ['Digit1'],
  'build-frost': ['Digit2'],
  'build-cannon': ['Digit3'],
  start: ['Space', 'Enter'],
  restart: ['KeyR'],
};

// Light woodblock palette — a warm meadow the creeps march across. Foe/tower
// hues are the `Deep` tones so they hold contrast on the washi ground (AA).
const PAL = {
  bg: KENTO.washi,
  road: KENTO.kinako, // trodden earth edge
  roadWorn: mix(KENTO.kinako, KENTO.gofun, 0.5), // pale worn centre
  plot: KENTO.kinu, // tilled stone build plot
  plotLine: KENTO.stone,
  cursor: KENTO.koDeep,
  arrow: KENTO.matsuDeep,
  frost: KENTO.asagiDeep,
  cannon: KENTO.kakiDeep,
  runner: KENTO.sakuDeep,
  grunt: KENTO.shuDeep,
  tank: KENTO.aiDeep,
  text: KENTO.sumiSoft,
  textSoft: KENTO.stone,
  range: KENTO.shuDeep,
} as const;

const GROUND_SEED = 41207;
const FLORA_SEED = 90312;

const Z_GROUND = -3;
const Z_GRAIN = -2;
const Z_ROAD = -1;
const Z_DECO = 1; // ≤ backgroundZ → exempt from layout lint (background plane)

export function rwState(world: World): RwState {
  return world.state.rw as RwState;
}

const TOWER_COLOR: Record<TowerKind, string> = { arrow: PAL.arrow, frost: PAL.frost, cannon: PAL.cannon };
const FOE_COLOR: Record<string, string> = { runner: PAL.runner, grunt: PAL.grunt, tank: PAL.tank };

/** Perpendicular distance from (px,py) to the nearest lane segment. */
function distToLane(px: number, py: number): number {
  let best = Infinity;
  for (let i = 1; i < PATH.length; i++) {
    const a = PATH[i - 1];
    const b = PATH[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2));
    best = Math.min(best, dhypot(px - (a.x + dx * t), py - (a.y + dy * t)));
  }
  return best;
}

class RwView extends Node {
  override readonly type = 'RwView';
  private layer = new Node({ name: 'layer' });
  private field = new Node({ name: 'field' });
  private foePool!: NodePool<Sprite>;
  private foeShadowPool!: NodePool<Sprite>;
  private hpPool!: NodePool<Sprite>;
  private towerPool!: NodePool<Sprite>;
  private towerShadowPool!: NodePool<Sprite>;
  private cursorRing!: Sprite;
  private rangeRing!: Sprite;
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);

    // ── The static meadow (built once, standalone rng — never hashed) ──────
    this.field.cosmetic = true;
    this.layer.addChild(this.field);
    this.buildGround();
    this.buildRoad();
    this.buildGates();
    this.buildFlora();
    this.buildPads();

    // ── Dynamic actors (pooled, re-synced every frame) ─────────────────────
    this.rangeRing = this.layer.addChild(new Sprite({ z: 2, shape: { kind: 'circle', radius: 100 }, fill: 'none', stroke: PAL.range, strokeWidth: 2, opacity: 0.5 }));
    this.cursorRing = this.layer.addChild(new Sprite({ z: 3, shape: { kind: 'rect', w: 66, h: 66, r: 14 }, fill: 'none', stroke: PAL.cursor, strokeWidth: 4 }));
    this.towerShadowPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 3, shape: { kind: 'circle', radius: 20 }, fill: withAlpha(KENTO.sumi, 0.18) }));
    this.towerPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'rect', w: 38, h: 38, r: 9 }, fill: PAL.arrow, stroke: KENTO.sumi, strokeWidth: 2.5 }));
    this.foeShadowPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 12 }, fill: withAlpha(KENTO.sumi, 0.16) }));
    this.foePool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 5, shape: { kind: 'circle', radius: 12 }, fill: PAL.grunt, stroke: KENTO.sumi, strokeWidth: 1.5 }));
    this.hpPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 6, shape: { kind: 'rect', w: 24, h: 4, r: 2 }, fill: KENTO.matsuDeep }));

    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 30 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 690 }, z: 8, size: 16, align: 'center', fill: PAL.textSoft, text: '←/→ select plot · [1] arrow 100 · [2] frost 120 · [3] cannon 190 · Space starts the wave early' }));
  }

  /** Washi ground with a warm border and a scatter of tonal woodblock grain. */
  private buildGround(): void {
    this.field.addChild(new Sprite({ name: 'ground', pos: { x: 640, y: 360 }, z: Z_GROUND, shape: { kind: 'rect', w: 1280, h: 720 }, fill: PAL.bg }));
    const grng = new Rng(GROUND_SEED);
    for (let y = 40; y < 720; y += 96) {
      for (let x = 40; x < 1280; x += 96) {
        // Two soft speck sizes read as inked washi rather than a dot lattice.
        const tone = grng.pick([KENTO.line, KENTO.kinako, KENTO.kinu]);
        this.field.addChild(new Sprite({
          pos: { x: x + grng.range(-18, 18), y: y + grng.range(-18, 18) },
          z: Z_GRAIN,
          shape: { kind: 'circle', radius: grng.range(1.4, 3.2) },
          fill: mutateColor(grng, tone, { light: 0.04 }),
          opacity: grng.range(0.25, 0.5),
        }));
      }
    }
  }

  /** The creep lane as a trodden earth road: a wide soft tread + worn centre. */
  private buildRoad(): void {
    const d = smoothOpenPath(PATH, 1);
    this.field.addChild(new Sprite({ name: 'roadShadow', z: Z_ROAD, shape: { kind: 'path', d }, fill: 'none', stroke: withAlpha(KENTO.sumi, 0.12), strokeWidth: 56 }));
    this.field.addChild(new Sprite({ name: 'road', z: Z_ROAD, shape: { kind: 'path', d }, fill: 'none', stroke: PAL.road, strokeWidth: 46, opacity: 0.92 }));
    this.field.addChild(new Sprite({ name: 'roadWorn', z: Z_ROAD, shape: { kind: 'path', d }, fill: 'none', stroke: PAL.roadWorn, strokeWidth: 22, opacity: 0.9 }));
  }

  /** West gate (creeps enter) and east warren mound (they're marching for). */
  private buildGates(): void {
    // West gate posts at the lane mouth.
    for (const dy of [-30, 30]) {
      this.field.addChild(new Sprite({ pos: { x: 8, y: 150 + dy }, z: Z_DECO, shape: { kind: 'rect', w: 16, h: 30, r: 3 }, fill: KENTO.stone, stroke: KENTO.sumiSoft, strokeWidth: 2 }));
    }
    this.field.addChild(new Sprite({ pos: { x: 8, y: 150 }, z: Z_DECO, shape: { kind: 'rect', w: 54, h: 12, r: 4 }, fill: KENTO.sumiSoft }));
    // East warren: a soft mound with a burrow mouth at the goal.
    const g = PATH[PATH.length - 1];
    this.field.addChild(new Sprite({ pos: { x: g.x - 40, y: g.y }, z: Z_ROAD, shape: { kind: 'circle', radius: 70 }, fill: withAlpha(KENTO.sumi, 0.1) }));
    this.field.addChild(new Sprite({ pos: { x: g.x - 46, y: g.y }, z: Z_DECO, shape: { kind: 'circle', radius: 58 }, fill: mutateColor(new Rng(7), KENTO.matsuDeep, { light: -0.02 }), stroke: KENTO.sumi, strokeWidth: 2 }));
    this.field.addChild(new Sprite({ pos: { x: g.x - 60, y: g.y }, z: Z_DECO, shape: { kind: 'circle', radius: 22 }, fill: KENTO.sumi }));
  }

  /** Organic foliage scattered across the meadow, clear of the lane and plots. */
  private buildFlora(): void {
    const frng = new Rng(FLORA_SEED);
    for (let gy = 90; gy < 700; gy += 118) {
      for (let gx = 90; gx < 1240; gx += 128) {
        const x = gx + frng.range(-46, 46);
        const y = gy + frng.range(-40, 40);
        if (distToLane(x, y) < 58) continue; // keep the creep lane readable
        if (PADS.some((p) => dhypot(p.x - x, p.y - y) < 62)) continue; // keep plots clear
        if (y < 62 || y > 662) continue; // clear of the HUD bands
        const roll = frng.float();
        if (roll < 0.14) this.addTree(frng, x, y);
        else if (roll < 0.52) this.addBush(frng, x, y);
        else this.addTuft(frng, x, y);
      }
    }
  }

  private addTuft(rng: Rng, x: number, y: number): void {
    const green = mutateColor(rng, rng.pick([KENTO.matsu, KENTO.matsuDeep]), { hue: 8, light: 0.06 });
    const blades = 3 + Math.floor(rng.float() * 3);
    for (let i = 0; i < blades; i++) {
      const bx = x + rng.range(-9, 9);
      const lean = rng.range(-8, 8);
      const h = rng.range(14, 26);
      const d = smoothOpenPath([{ x: bx, y }, { x: bx + lean * 0.5, y: y - h * 0.55 }, { x: bx + lean, y: y - h }], 1);
      this.field.addChild(new Sprite({ z: Z_DECO, shape: { kind: 'path', d }, fill: 'none', stroke: green, strokeWidth: rng.range(2, 3.2), opacity: 0.9 }));
    }
  }

  private addBush(rng: Rng, x: number, y: number): void {
    const base = mutateColor(rng, rng.pick([KENTO.matsu, KENTO.matsuDeep, KENTO.koDeep]), { hue: 6, light: 0.05 });
    const r = rng.range(16, 28);
    this.field.addChild(new Sprite({ pos: { x, y: y + r * 0.5 }, z: Z_ROAD, shape: { kind: 'circle', radius: r * 0.85 }, fill: withAlpha(KENTO.sumi, 0.12) }));
    this.field.addChild(new Sprite({ pos: { x, y }, z: Z_DECO, shape: { kind: 'path', d: blobPath(rng, r, 0.28, 8) }, fill: base, stroke: KENTO.sumiSoft, strokeWidth: 1.5 }));
    this.field.addChild(new Sprite({ pos: { x: x - r * 0.28, y: y - r * 0.28 }, z: Z_DECO, shape: { kind: 'path', d: blobPath(rng, r * 0.5, 0.35, 6) }, fill: mix(base, KENTO.gofun, 0.28), opacity: 0.75 }));
  }

  private addTree(rng: Rng, x: number, y: number): void {
    const r = rng.range(30, 46);
    const canopy = mutateColor(rng, KENTO.matsuDeep, { hue: 6, light: 0.05 });
    this.field.addChild(new Sprite({ pos: { x: x + 5, y: y + r * 0.72 }, z: Z_ROAD, shape: { kind: 'circle', radius: r * 0.78 }, fill: withAlpha(KENTO.sumi, 0.14) }));
    this.field.addChild(new Sprite({ pos: { x, y: y + r * 0.55 }, z: Z_DECO, shape: { kind: 'rect', w: 10, h: r * 0.68, r: 3 }, fill: mutateColor(rng, KENTO.stone, { light: 0.04 }), stroke: KENTO.sumiSoft, strokeWidth: 1.5 }));
    this.field.addChild(new Sprite({ pos: { x, y }, z: Z_DECO, shape: { kind: 'path', d: blobPath(rng, r, 0.22, 9) }, fill: canopy, stroke: KENTO.sumi, strokeWidth: 2 }));
    this.field.addChild(new Sprite({ pos: { x: x - r * 0.3, y: y - r * 0.32 }, z: Z_DECO, shape: { kind: 'path', d: blobPath(rng, r * 0.55, 0.3, 7) }, fill: mix(canopy, KENTO.matsu, 0.6), opacity: 0.7 }));
  }

  /** Tilled stone build plots flanking the lane — a shadow, a slab, an inset. */
  private buildPads(): void {
    for (const p of PADS) {
      this.field.addChild(new Sprite({ pos: { x: p.x, y: p.y + 6 }, z: Z_DECO, shape: { kind: 'rect', w: 56, h: 56, r: 12 }, fill: withAlpha(KENTO.sumi, 0.12) }));
      this.field.addChild(new Sprite({ pos: { x: p.x, y: p.y }, z: Z_DECO, shape: { kind: 'rect', w: 56, h: 56, r: 12 }, fill: PAL.plot, stroke: PAL.plotLine, strokeWidth: 2 }));
      this.field.addChild(new Sprite({ pos: { x: p.x, y: p.y }, z: Z_DECO, shape: { kind: 'rect', w: 40, h: 40, r: 8 }, fill: 'none', stroke: withAlpha(PAL.plotLine, 0.4), strokeWidth: 1.5 }));
    }
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = rwState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.rw = initialRw();
      hideScreen();
      return;
    }
    if (s.won || s.dead) return;
    const ev = stepRw(
      s,
      {
        cursorMove: (input.justPressed('next') ? 1 : 0) - (input.justPressed('prev') ? 1 : 0),
        build: input.justPressed('build-arrow') ? 'arrow' : input.justPressed('build-frost') ? 'frost' : input.justPressed('build-cannon') ? 'cannon' : null,
        startWave: input.justPressed('start'),
      },
      dt,
    );
    if (ev.built) audio.blip(420);
    if (ev.kill) audio.blip(560);
    if (ev.leak) audio.blip(110);
    if (ev.waveStart) audio.blip(300);
    if (ev.died) showScreen({ title: 'The warren is overrun', body: `Fell on wave ${s.wave + 1} of ${WAVES.length}.`, actions: [{ label: 'Replant', primary: true, onSelect: () => { (this.world as World).state.rw = initialRw(); hideScreen(); } }] });
    if (ev.won) showScreen({ title: 'The roots hold', body: `All ${WAVES.length} waves repelled · ${s.lives} lives kept · ${s.kills} routed.`, actions: [{ label: 'Defend again', primary: true, onSelect: () => { (this.world as World).state.rw = initialRw(); hideScreen(); } }] });

    // ── View sync ──
    const cur = PADS[s.cursor];
    this.cursorRing.pos = cur;
    const built = s.towers.find((t) => t.pad === s.cursor);
    this.rangeRing.pos = cur;
    this.rangeRing.shape = { kind: 'circle', radius: built ? TOWERS[built.kind].range : TOWERS.arrow.range };
    this.rangeRing.paint.stroke = built ? TOWER_COLOR[built.kind] : PAL.range;

    this.towerShadowPool.begin();
    this.towerPool.begin();
    for (const t of s.towers) {
      const pad = PADS[t.pad];
      const sh = this.towerShadowPool.get();
      sh.pos = { x: pad.x, y: pad.y + 8 };
      const sp = this.towerPool.get();
      sp.pos = { x: pad.x, y: pad.y - 2 };
      sp.paint.fill = TOWER_COLOR[t.kind];
    }
    this.towerShadowPool.end();
    this.towerPool.end();

    this.foeShadowPool.begin();
    this.foePool.begin();
    this.hpPool.begin();
    for (const f of s.foes) {
      const p = pointAt(f.dist);
      const r = f.kind === 'tank' ? 17 : f.kind === 'grunt' ? 12 : 9;
      const sh = this.foeShadowPool.get();
      sh.pos = { x: p.x, y: p.y + r * 0.55 };
      sh.shape = { kind: 'circle', radius: r * 0.85 };
      const sp = this.foePool.get();
      sp.pos = p;
      sp.shape = { kind: 'circle', radius: r };
      sp.paint.fill = FOE_COLOR[f.kind];
      sp.paint.opacity = f.slowT > 0 ? 0.62 : 1;
      const hb = this.hpPool.get();
      hb.pos = { x: p.x, y: p.y - r - 8 };
      hb.shape = { kind: 'rect', w: Math.max(1, 26 * (f.hp / ENEMIES[f.kind].hp)), h: 4, r: 2 };
    }
    this.foeShadowPool.end();
    this.foePool.end();
    this.hpPool.end();

    const nextIn = s.foes.length === 0 && s.spawnQueue.length === 0 && s.wave < WAVES.length - 1 ? ` · next wave in ${Math.max(0, s.betweenT).toFixed(0)}s` : '';
    this.hud.text = `wave ${Math.max(1, s.wave + 1)}/${WAVES.length} · ♥ ${s.lives} · gold ${s.gold}${nextIn}`;
  }
}

registerNode('RwView', () => new RwView({ name: 'rw-view' }));

export const rootwardGame = defineGame({
  title: 'Rootward',
  background: PAL.bg,
  inputMap: RW_INPUT_MAP,
  build(world) {
    world.state.rw = initialRw();
    return new RwView({ name: 'rw-view' });
  },
  probe(world) {
    const s = rwState(world);
    return { frame: world.frame, gold: s.gold, lives: s.lives, wave: s.wave, foes: s.foes.length, queued: s.spawnQueue.length, towers: s.towers.map((t) => ({ pad: t.pad, kind: t.kind })), cursor: s.cursor, kills: s.kills, leaked: s.leaked, won: s.won, dead: s.dead };
  },
});

// Rootward: TD sim in world.state; readable HUD is a genre requirement — the
// lane is a drawn ribbon, pads show a cursor ring, towers show range on the
// selected pad, and wave/economy state is always visible.

import { Node, NodePool, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World, dhypot, datan2 } from '@hayao';
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

const PAL = { bg: '#131a10', lane: '#3d3323', laneEdge: '#57492e', pad: '#2a3d24', padLine: '#456339', cursor: '#ffd75e', arrow: '#8fb573', frost: '#7fc8ff', cannon: '#c97b4a', runner: '#d84f6a', grunt: '#b8405e', tank: '#7a3050', hpBack: '#222', text: '#93ab84', range: '#ffd75e' };

export function rwState(world: World): RwState {
  return world.state.rw as RwState;
}

const TOWER_COLOR: Record<TowerKind, string> = { arrow: PAL.arrow, frost: PAL.frost, cannon: PAL.cannon };

class RwView extends Node {
  override readonly type = 'RwView';
  private layer = new Node({ name: 'layer' });
  private foePool!: NodePool<Sprite>;
  private hpPool!: NodePool<Sprite>;
  private towerPool!: NodePool<Sprite>;
  private cursorRing!: Sprite;
  private rangeRing!: Sprite;
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    // Lane ribbon.
    for (let i = 1; i < PATH.length; i++) {
      const a = PATH[i - 1];
      const b = PATH[i];
      const len = dhypot(b.x - a.x, b.y - a.y);
      this.layer.addChild(new Sprite({ pos: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, rotation: datan2(b.y - a.y, b.x - a.x), z: 1, shape: { kind: 'rect', w: len + 44, h: 44, r: 22 }, fill: PAL.lane, stroke: PAL.laneEdge, strokeWidth: 2 }));
    }
    for (const p of PADS) this.layer.addChild(new Sprite({ pos: p, z: 2, shape: { kind: 'rect', w: 56, h: 56, r: 10 }, fill: PAL.pad, stroke: PAL.padLine, strokeWidth: 2 }));
    this.rangeRing = this.layer.addChild(new Sprite({ z: 2, shape: { kind: 'circle', radius: 100 }, fill: 'none', stroke: PAL.range, strokeWidth: 1.5, opacity: 0.5 }));
    this.cursorRing = this.layer.addChild(new Sprite({ z: 3, shape: { kind: 'rect', w: 64, h: 64, r: 12 }, fill: 'none', stroke: PAL.cursor, strokeWidth: 3 }));
    this.towerPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 18 }, fill: PAL.arrow, stroke: '#1a2410', strokeWidth: 2 }));
    this.foePool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 5, shape: { kind: 'circle', radius: 12 }, fill: PAL.grunt }));
    this.hpPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 6, shape: { kind: 'rect', w: 24, h: 4, r: 2 }, fill: '#8fe8b0' }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 30 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 686 }, z: 8, size: 16, align: 'center', fill: PAL.text, text: '←/→ select pad · [1] arrow 100 · [2] frost 120 · [3] cannon 190 · Space starts the wave early' }));
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
    this.towerPool.begin();
    for (const t of s.towers) {
      const sp = this.towerPool.get();
      sp.pos = PADS[t.pad];
      sp.paint.fill = TOWER_COLOR[t.kind];
    }
    this.towerPool.end();
    this.foePool.begin();
    this.hpPool.begin();
    for (const f of s.foes) {
      const p = pointAt(f.dist);
      const sp = this.foePool.get();
      sp.pos = p;
      sp.shape = { kind: 'circle', radius: f.kind === 'tank' ? 17 : f.kind === 'grunt' ? 12 : 9 };
      sp.paint.fill = PAL[f.kind];
      sp.paint.opacity = f.slowT > 0 ? 0.6 : 1;
      const hb = this.hpPool.get();
      hb.pos = { x: p.x, y: p.y - 22 };
      hb.shape = { kind: 'rect', w: Math.max(1, 26 * (f.hp / ENEMIES[f.kind].hp)), h: 4, r: 2 };
    }
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

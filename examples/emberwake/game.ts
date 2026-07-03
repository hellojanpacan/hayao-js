// Emberwake: horde sim in world.state; the view uses POOLED sprites (update
// in place, hide extras) — rebuilding hundreds of nodes per frame is an
// allocation storm. Runs on the Canvas2D backend (see main.ts).

import { Node, NodePool, Sprite, Text, TILE, audio, defineGame, hideScreen, registerNode, showScreen, tileAt, type InputMap, type World } from '@hayao';
import { arenaMap, initialEw, stepEw, E_TUNE, P_TUNE, TILE_SIZE, UPGRADES, WIN_AT, type EwState } from './logic';

export const EW_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  'pick-0': ['Digit1'],
  'pick-1': ['Digit2'],
  'pick-2': ['Digit3'],
  restart: ['KeyR'],
};

const PAL = { bg: '#140f16', rock: '#332838', rockLine: '#4a3a52', hero: '#ffd75e', heroLine: '#fff3d0', bullet: '#ffe9a8', swarmer: '#b8405e', brute: '#7a3050', text: '#a893b5', card: '#e8d8f0' };

export function ewState(world: World): EwState {
  return world.state.ew as EwState;
}

class EwView extends Node {
  override readonly type = 'EwView';
  private layer = new Node({ name: 'layer' });
  private enemyPool!: NodePool<Sprite>;
  private bulletPool!: NodePool<Sprite>;
  private hero!: Sprite;
  private hud!: Text;
  private cards!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    const map = arenaMap();
    for (let ty = 0; ty < map.rows; ty++)
      for (let tx = 0; tx < map.cols; tx++)
        if (tileAt(map, tx, ty) === TILE.SOLID)
          this.layer.addChild(new Sprite({ pos: { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE }, z: 2, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.rock, stroke: PAL.rockLine, strokeWidth: 1 }));
    this.enemyPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 5, shape: { kind: 'circle', radius: 12 }, fill: PAL.swarmer }));
    this.bulletPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 4 }, fill: PAL.bullet }));
    this.hero = this.layer.addChild(new Sprite({ name: 'hero', z: 6, shape: { kind: 'circle', radius: P_TUNE.radius }, fill: PAL.hero, stroke: PAL.heroLine, strokeWidth: 3 }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 34 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.cards = this.layer.addChild(new Text({ pos: { x: 640, y: 360 }, z: 9, size: 24, align: 'center', fill: PAL.card, text: '' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = ewState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.ew = initialEw();
      hideScreen();
      return;
    }
    if (s.won || s.dead) return;
    const pick = input.justPressed('pick-0') ? 0 : input.justPressed('pick-1') ? 1 : input.justPressed('pick-2') ? 2 : -1;
    const ev = stepEw(
      s,
      {
        moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
        moveY: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
        pick,
      },
      dt,
      world.rng,
    );
    if (ev.kill) audio.blip(500 + (s.kills % 8) * 30);
    if (ev.hurt) audio.blip(120);
    if (ev.levelUp) audio.success();
    if (ev.died) showScreen({ title: 'The night takes you', body: `Survived ${s.time.toFixed(0)}s · ${s.kills} embers quenched.`, actions: [{ label: 'Rise again', primary: true, onSelect: () => { (this.world as World).state.ew = initialEw(); hideScreen(); } }] });
    if (ev.won) showScreen({ title: 'DAWN', body: `You outlasted the night. ${s.kills} embers quenched, level ${s.level}.`, actions: [{ label: 'Another night', primary: true, onSelect: () => { (this.world as World).state.ew = initialEw(); hideScreen(); } }] });

    // ── Pooled view sync ──
    this.hero.pos = { x: s.x, y: s.y };
    this.hero.paint.opacity = s.iframes > 0 && Math.floor(s.iframes * 14) % 2 === 0 ? 0.35 : 1;
    this.enemyPool.begin();
    for (const e of s.enemies) {
      const sp = this.enemyPool.get();
      sp.pos = { x: e.x, y: e.y };
      const T = E_TUNE[e.kind];
      sp.shape = { kind: 'circle', radius: T.radius };
      sp.paint.fill = e.kind === 'brute' ? PAL.brute : PAL.swarmer;
    }
    this.enemyPool.end();
    this.bulletPool.begin();
    for (const b of s.bullets) {
      const sp = this.bulletPool.get();
      sp.pos = { x: b.x, y: b.y };
    }
    this.bulletPool.end();
    this.hud.text = `♥ ${s.hp}/${s.maxHp} · lvl ${s.level} · kills ${s.kills} · ${Math.max(0, WIN_AT - s.time).toFixed(0)}s to dawn · horde ${s.enemies.length}`;
    this.cards.text = s.choice ? s.choice.map((u, i) => `[${i + 1}] ${UPGRADES[u].label}`).join('      ') : '';
  }
}

registerNode('EwView', () => new EwView({ name: 'ew-view' }));

export const emberwakeGame = defineGame({
  title: 'Emberwake',
  background: PAL.bg,
  inputMap: EW_INPUT_MAP,
  build(world) {
    world.state.ew = initialEw();
    return new EwView({ name: 'ew-view' });
  },
  probe(world) {
    const s = ewState(world);
    return { frame: world.frame, time: s.time, x: s.x, y: s.y, hp: s.hp, level: s.level, kills: s.kills, alive: s.enemies.length, bullets: s.bullets.length, choosing: !!s.choice, choiceIds: s.choice ? s.choice.map((i) => UPGRADES[i].id) : [], dead: s.dead, won: s.won, enemies: s.enemies.slice(0, 64).map((e) => ({ x: e.x, y: e.y, kind: e.kind })) };
  },
});

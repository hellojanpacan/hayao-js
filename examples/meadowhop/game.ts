// Meadowhop (view) — a one-screen platformer that dogfoods DuotoneHero. Camera:
// none. The room is authored to fill the 1280×720 design space, so world space is
// screen space and the whole room is on screen, static. Every node here is
// cosmetic view over the one MeadowState in world.state (see logic.ts); strip it
// all and the golden replay hash is unchanged.

import {
  Node,
  Sprite,
  Text,
  DuotoneHero,
  DUOTONE_SCHEMES,
  heroStateFromMotion,
  HERO_FOOT_OFFSET,
  HERO_CLIPS,
  star,
  tileCenter,
  KENTO,
  MEADOW,
  withAlpha,
  registerNode,
  defineGame,
  TILE,
  type World,
  type InputMap,
  type PadInput,
} from '@hayao';
import { TILE_PX, MAP, COINS, GOAL_PX, CONFIG, freshMeadowState, stepMeadow, collectedCount, type MeadowState } from './logic';

export const MH_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  restart: ['KeyR'],
};

const GROUND = KENTO.matsuDeep; // pine platforms
const GRASS = KENTO.matsu; // lighter top strip
const SPIKE = KENTO.shuDeep; // vermilion hazard
const GOLD = KENTO.ko; // coins + star
const GRASS_H = 8;
const HERO_SCALE = 0.48;
const SPAWN_CLIP = HERO_CLIPS.spawn.duration;

const meadow = (w: World): MeadowState => (w.state.meadow ??= freshMeadowState()) as MeadowState;
const solidAt = (tx: number, ty: number): boolean => tx >= 0 && ty >= 0 && tx < MAP.cols && ty < MAP.rows && MAP.tiles[ty * MAP.cols + tx] === TILE.SOLID;

class MeadowView extends Node {
  override readonly type = 'MeadowView';

  private hero!: DuotoneHero;
  private star!: Node;
  private coinNodes: Sprite[] = [];
  private hud!: Text;
  private banner!: Text;
  private spawnLock = 0;

  protected override onReady(): void {
    const w = this.world as World;
    w.state.meadow = freshMeadowState();

    this.buildRoom();
    this.buildGoal();
    this.buildCoins();

    this.hero = new DuotoneHero({ name: 'hero', scheme: DUOTONE_SCHEMES.teal, state: 'spawn', scale: { x: HERO_SCALE, y: HERO_SCALE } });
    this.addChild(this.hero);
    this.spawnLock = SPAWN_CLIP;
    this.syncHero(meadow(w));

    this.hud = this.text(640, 30, 20, MEADOW.inkSoft, '');
    this.banner = this.text(640, 360, 46, KENTO.matsuDeep, '');
    this.refreshHud(w);
  }

  // ── Static scenery (built once, cosmetic) ────────────────────────────────
  private buildRoom(): void {
    for (let ty = 0; ty < MAP.rows; ty++) {
      for (let tx = 0; tx < MAP.cols; tx++) {
        const id = MAP.tiles[ty * MAP.cols + tx];
        const c = tileCenter(tx, ty, TILE_PX);
        if (id === TILE.SOLID) {
          this.addStatic(new Sprite({ z: 0, pos: c, shape: { kind: 'rect', w: TILE_PX + 1, h: TILE_PX + 1 }, fill: GROUND }));
          if (!solidAt(tx, ty - 1)) {
            this.addStatic(new Sprite({ z: 1, pos: { x: c.x, y: ty * TILE_PX + GRASS_H / 2 }, shape: { kind: 'rect', w: TILE_PX + 1, h: GRASS_H }, fill: GRASS }));
          }
        } else if (id === TILE.HAZARD) {
          // three little spikes across the tile
          for (let k = -1; k <= 1; k++) {
            const sx = c.x + k * (TILE_PX / 3);
            this.addStatic(new Sprite({ z: 2, pos: { x: sx, y: c.y }, shape: { kind: 'poly', points: [-6, TILE_PX / 2, 0, -TILE_PX / 2 + 4, 6, TILE_PX / 2] }, fill: SPIKE }));
          }
        }
      }
    }
  }

  private buildGoal(): void {
    this.star = new Node({ name: 'star', pos: { x: GOAL_PX.x, y: GOAL_PX.y }, z: 3 });
    this.star.cosmetic = true;
    this.star.addChild(new Sprite({ z: 3, shape: { kind: 'circle', radius: 26 }, fill: withAlpha(GOLD, 0.28) })); // glow
    this.star.addChild(new Sprite({ z: 4, shape: { kind: 'poly', points: star(5, 20, 9), closed: true }, fill: GOLD, stroke: KENTO.sumi, strokeWidth: 2 }));
    this.star.addChild(new Sprite({ z: 5, pos: { x: -3, y: -4 }, shape: { kind: 'poly', points: star(5, 11, 5), closed: true }, fill: withAlpha(KENTO.gofun, 0.5) })); // duotone shine
    this.addChild(this.star);
  }

  private buildCoins(): void {
    for (const coin of COINS) {
      const node = new Sprite({ z: 3, pos: { x: coin.x, y: coin.y }, shape: { kind: 'circle', radius: 10 }, fill: GOLD, stroke: KENTO.sumi, strokeWidth: 2 });
      node.cosmetic = true;
      node.addChild(new Sprite({ z: 4, pos: { x: -2, y: -2 }, shape: { kind: 'circle', radius: 4.5 }, fill: withAlpha(KENTO.gofun, 0.6) }));
      this.addChild(node);
      this.coinNodes.push(node);
    }
  }

  private addStatic(sprite: Sprite): void {
    sprite.cosmetic = true;
    this.addChild(sprite);
  }
  private text(x: number, y: number, size: number, fill: string, t: string): Text {
    const node = new Text({ pos: { x, y }, size, align: 'center', fill, text: t });
    node.cosmetic = true;
    this.addChild(node);
    return node;
  }

  // ── Per-frame drive ──────────────────────────────────────────────────────
  protected override onProcess(dt: number): void {
    const w = this.world as World;
    if (!w) return;
    const input = w.input;

    if (input.justPressed('restart')) {
      w.state.meadow = freshMeadowState();
      this.spawnLock = SPAWN_CLIP;
      this.hero.setState('spawn', true);
    }

    const s = meadow(w);
    const pad: PadInput = {
      moveX: input.isDown('right') ? 1 : input.isDown('left') ? -1 : 0,
      moveY: 0,
      jumpHeld: input.isDown('jump'),
      jumpPressed: input.justPressed('jump'),
      dashPressed: false,
    };
    stepMeadow(s, pad, dt);

    this.spawnLock = Math.max(0, this.spawnLock - dt);
    if (s.fx.spawned) {
      this.spawnLock = SPAWN_CLIP;
      this.hero.setState('spawn', true);
    }
    this.syncHero(s);

    for (let i = 0; i < this.coinNodes.length; i++) this.coinNodes[i].visible = !s.collected[i];
    this.star.rotation += dt * 1.1;
    this.star.visible = !s.won;
    this.refreshHud(w);
  }

  private syncHero(s: MeadowState): void {
    this.hero.pos = { x: s.pc.x + CONFIG.width / 2, y: s.pc.y + CONFIG.height - HERO_FOOT_OFFSET * HERO_SCALE };
    this.hero.setFacing(s.pc.facing >= 0 ? 1 : -1);
    // Don't let live motion interrupt the spawn pop or the death fall.
    if (this.spawnLock > 0) return;
    if (s.won) {
      this.hero.setState('idle');
      return;
    }
    this.hero.setState(heroStateFromMotion({ onGround: s.pc.onGround, vx: s.pc.vx, vy: s.pc.vy, onWall: s.pc.onWall !== 0, dead: s.pc.dead }));
  }

  private refreshHud(w: World): void {
    const s = meadow(w);
    this.hud.text = `Meadowhop · ←/→ move · ↑/Space jump · R restart      ★ ${collectedCount(s)}/${COINS.length} coins · deaths ${s.deaths}`;
    this.banner.text = s.won ? 'You reached the star!  —  R to play again' : '';
    this.banner.visible = s.won;
  }

  protected override serializeProps(): Record<string, unknown> {
    return {};
  }
}

registerNode('MeadowView', () => new MeadowView());

export const meadowhopGame = defineGame({
  title: 'Meadowhop',
  width: 1280,
  height: 720,
  background: MEADOW.bg,
  inputMap: MH_INPUT_MAP,
  build: () => new MeadowView({ name: 'meadowhop' }),
  probe: (world) => {
    const s = (world.state.meadow ?? freshMeadowState()) as MeadowState;
    return {
      frame: world.frame,
      hash: world.hash(),
      x: Math.round(s.pc.x),
      y: Math.round(s.pc.y),
      onGround: s.pc.onGround,
      coins: collectedCount(s),
      deaths: s.deaths,
      won: s.won,
    };
  },
});

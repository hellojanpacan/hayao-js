// Duskveil: the bullet-hell sim in world.state; pooled Canvas view (the
// Emberwake lesson, at 4× the entity count). Slow-mode shows the true hitbox.

import { Node, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { initialDv, stepDv, P_TUNE, PHASES, type DvState } from './logic';

export const DV_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  slow: ['ShiftLeft', 'ShiftRight'],
  restart: ['KeyR'],
};

const PAL = { bg: '#0c0a14', player: '#9ef7ff', hitbox: '#ffffff', shot: '#4ed8e8', bullet: '#ff9db8', bullet2: '#ffd0dc', boss: '#8a5fc8', bossCore: '#e8d8ff', text: '#9a8fc0' };

export function dvState(world: World): DvState {
  return world.state.dv as DvState;
}

class Pool {
  private items: Sprite[] = [];
  private used = 0;
  constructor(private parent: Node, private make: () => Sprite) {}
  begin(): void {
    this.used = 0;
  }
  get(): Sprite {
    if (this.used === this.items.length) this.items.push(this.parent.addChild(this.make()));
    const s = this.items[this.used++];
    s.visible = true;
    return s;
  }
  end(): void {
    for (let i = this.used; i < this.items.length; i++) this.items[i].visible = false;
  }
}

class DvView extends Node {
  override readonly type = 'DvView';
  private layer = new Node({ name: 'layer' });
  private bulletPool!: Pool;
  private shotPool!: Pool;
  private player!: Sprite;
  private hitbox!: Sprite;
  private boss!: Sprite;
  private hpBar!: Sprite;
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.bulletPool = new Pool(this.layer, () => new Sprite({ z: 5, shape: { kind: 'circle', radius: 6 }, fill: PAL.bullet, stroke: PAL.bullet2, strokeWidth: 1.5 }));
    this.shotPool = new Pool(this.layer, () => new Sprite({ z: 3, shape: { kind: 'rect', w: 4, h: 14, r: 2 }, fill: PAL.shot }));
    this.boss = this.layer.addChild(new Sprite({ z: 4, shape: { kind: 'circle', radius: 46 }, fill: PAL.boss, stroke: PAL.bossCore, strokeWidth: 4 }));
    this.player = this.layer.addChild(new Sprite({ z: 6, shape: { kind: 'poly', points: [0, -14, 10, 12, 0, 6, -10, 12], closed: true }, fill: PAL.player, stroke: '#ffffff', strokeWidth: 1.5 }));
    this.hitbox = this.layer.addChild(new Sprite({ z: 7, shape: { kind: 'circle', radius: P_TUNE.hitbox }, fill: PAL.hitbox }));
    this.hpBar = this.layer.addChild(new Sprite({ pos: { x: 640, y: 16 }, z: 8, shape: { kind: 'rect', w: 600, h: 8, r: 4 }, fill: PAL.boss }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 44 }, z: 8, size: 18, align: 'center', fill: PAL.text, text: '' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = dvState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.dv = initialDv();
      hideScreen();
      return;
    }
    if (s.won || s.dead) return;
    const ev = stepDv(
      s,
      {
        moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
        moveY: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
        slow: input.isDown('slow'),
      },
      dt,
      world.rng,
    );
    if (ev.hit) audio.blip(110);
    if (ev.phaseDown) audio.success();
    if (ev.died) showScreen({ title: 'The veil falls over you', body: `Phase ${s.phase + 1}, graze ${s.graze}.`, actions: [{ label: 'Again', primary: true, onSelect: () => { (this.world as World).state.dv = initialDv(); hideScreen(); } }] });
    if (ev.won) showScreen({ title: 'The Duskveil lifts', body: `Cleared with ${s.lives} spare ${s.lives === 1 ? 'life' : 'lives'} · graze ${s.graze}.`, actions: [{ label: 'Face it again', primary: true, onSelect: () => { (this.world as World).state.dv = initialDv(); hideScreen(); } }] });

    // ── View sync (pooled) ──
    this.player.pos = { x: s.x, y: s.y };
    this.player.paint.opacity = s.invuln > 0 && Math.floor(s.invuln * 12) % 2 === 0 ? 0.3 : 1;
    this.hitbox.pos = { x: s.x, y: s.y };
    this.hitbox.visible = input.isDown('slow');
    this.boss.pos = { x: s.bossX, y: s.bossY };
    const frac = s.phase < PHASES.length ? s.bossHp / PHASES[s.phase].hp : 0;
    this.hpBar.shape = { kind: 'rect', w: Math.max(1, 600 * frac), h: 8, r: 4 };
    this.bulletPool.begin();
    for (const b of s.bullets) this.bulletPool.get().pos = { x: b.x, y: b.y };
    this.bulletPool.end();
    this.shotPool.begin();
    for (const sh of s.shots) this.shotPool.get().pos = { x: sh.x, y: sh.y };
    this.shotPool.end();
    this.hud.text = `phase ${s.phase + 1}/3 · lives ${Math.max(0, s.lives)} · graze ${s.graze} · bullets ${s.bullets.length} · hold Shift to focus`;
  }
}

registerNode('DvView', () => new DvView({ name: 'dv-view' }));

export const duskveilGame = defineGame({
  title: 'Duskveil',
  background: PAL.bg,
  inputMap: DV_INPUT_MAP,
  build(world) {
    world.state.dv = initialDv();
    return new DvView({ name: 'dv-view' });
  },
  probe(world) {
    const s = dvState(world);
    return { frame: world.frame, time: s.time, x: s.x, y: s.y, lives: s.lives, deaths: s.deaths, graze: s.graze, phase: s.phase, bossHp: s.bossHp, bossX: s.bossX, bullets: s.bullets.length, dead: s.dead, won: s.won };
  },
});

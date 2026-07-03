// Cadence Hollow: the view pulses WITH THE SIM'S BEAT — the metronome tones,
// the floor throb, the beat bar all read the frame counter. Audio observes.

import { KENTO, Node, NodePool, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { beatOf, initialCd, beatTick, onBeat, tryMove, wallAt, CHAMBER, FRAMES_PER_BEAT, GRID_H, GRID_W, type CdMove, type CdState } from './logic';

export const CD_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  restart: ['KeyR'],
};

const CELL = 72;
const OX = 640 - (GRID_W * CELL) / 2 + CELL / 2;
const OY = 356 - (GRID_H * CELL) / 2 + CELL / 2;
const at = (x: number, y: number) => ({ x: OX + x * CELL, y: OY + y * CELL });

const PAL = { bg: KENTO.yohaku, floor: KENTO.darkLine, floorPulse: KENTO.fujiDeep, wall: KENTO.kuro, hero: KENTO.asagi, slime: KENTO.matsu, zombie: KENTO.shu, exit: KENTO.ko, text: KENTO.kinako, beat: KENTO.saku };

export function cdState(world: World): CdState {
  return world.state.cd as CdState;
}

class CdView extends Node {
  override readonly type = 'CdView';
  private layer = new Node({ name: 'layer' });
  private floorPool!: NodePool<Sprite>;
  private entPool!: NodePool<Sprite>;
  private hero!: Sprite;
  private beatBar!: Sprite;
  private hud!: Text;
  private lastBeat = -1;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.floorPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 1, shape: { kind: 'rect', w: CELL - 4, h: CELL - 4, r: 8 }, fill: PAL.floor }));
    this.entPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 4, shape: { kind: 'circle', radius: 20 }, fill: PAL.slime }));
    this.hero = this.layer.addChild(new Sprite({ z: 5, shape: { kind: 'circle', radius: 22 }, fill: PAL.hero, stroke: KENTO.sumi, strokeWidth: 3 }));
    this.beatBar = this.layer.addChild(new Sprite({ pos: { x: 640, y: 690 }, z: 8, shape: { kind: 'circle', radius: 12 }, fill: PAL.beat }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 26 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 660 }, z: 8, size: 15, align: 'center', fill: PAL.text, text: 'move ON the pulse · off-beat breaks your combo · bump to fight · reach the gold door' }));
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = cdState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.cd = initialCd();
      hideScreen();
      return;
    }
    // ── The beat lives in sim frames; the metronome OBSERVES it ──
    const beat = beatOf(world.frame);
    if (world.frame % FRAMES_PER_BEAT === 0 && beat !== this.lastBeat) {
      this.lastBeat = beat;
      if (!s.won && !s.dead) {
        const ev = beatTick(s, beat);
        audio.tone({ freq: beat % 4 === 0 ? 220 : 160, duration: 0.09, type: 'square', gain: 0.12 }); // the pulse itself
        if (ev.hurt) audio.blip(120);
        if (ev.died) showScreen({ title: 'The rhythm ends', body: `Best combo ${s.bestCombo}, ${s.kills} slain.`, actions: [{ label: 'Once more, with feeling', primary: true, onSelect: () => { world.state.cd = initialCd(); hideScreen(); } }] });
      }
    }
    if (!s.won && !s.dead) {
      const moves: CdMove[] = ['left', 'right', 'up', 'down'];
      for (const m of moves)
        if (input.justPressed(m)) {
          const ev = tryMove(s, m, world.frame);
          if (ev.moved || ev.fought) audio.blip(400 + s.combo * 14);
          if (ev.offBeat) audio.blip(110);
          if (ev.killed) audio.blip(640);
          if (ev.won) showScreen({ title: 'The Hollow keeps the beat', body: `Best combo ${s.bestCombo} · ${s.kills} slain · hp ${s.hp} left.`, actions: [{ label: 'Encore', primary: true, onSelect: () => { world.state.cd = initialCd(); hideScreen(); } }] });
          break;
        }
    }
    this.redraw(s, world.frame);
  }

  private redraw(s: CdState, frame: number): void {
    const pulse = 1 - ((frame % FRAMES_PER_BEAT) / FRAMES_PER_BEAT); // 1 at the beat, decaying
    this.floorPool.begin();
    for (let y = 0; y < GRID_H; y++)
      for (let x = 0; x < GRID_W; x++) {
        const sp = this.floorPool.get();
        sp.pos = at(x, y);
        if (wallAt(x, y)) {
          sp.paint.fill = PAL.wall;
          sp.paint.opacity = 1;
        } else if (CHAMBER[y][x] === 'E') {
          sp.paint.fill = PAL.exit;
          sp.paint.opacity = 0.6 + pulse * 0.4;
        } else {
          const checker = (x + y) % 2 === 0;
          sp.paint.fill = checker ? PAL.floorPulse : PAL.floor;
          sp.paint.opacity = checker ? 0.5 + pulse * 0.5 : 1;
        }
      }
    this.floorPool.end();
    this.entPool.begin();
    for (const f of s.foes) {
      const sp = this.entPool.get();
      sp.pos = at(f.x, f.y);
      sp.shape = f.kind === 'slime' ? { kind: 'circle', radius: 16 + pulse * 4 } : { kind: 'rect', w: 30, h: 38, r: 8 };
      sp.paint.fill = f.kind === 'slime' ? PAL.slime : PAL.zombie;
    }
    this.entPool.end();
    this.hero.pos = at(s.x, s.y);
    this.hero.scale = { x: 1 + pulse * 0.08, y: 1 + pulse * 0.08 };
    this.beatBar.shape = { kind: 'circle', radius: 8 + pulse * 10 };
    this.beatBar.paint.opacity = 0.4 + pulse * 0.6;
    this.hud.text = `♪ combo ${s.combo} (best ${s.bestCombo}) · hp ${s.hp} · slain ${s.kills}`;
  }
}

registerNode('CdView', () => new CdView({ name: 'cd-view' }));

export const cadenceGame = defineGame({
  title: 'Cadence Hollow',
  background: PAL.bg,
  inputMap: CD_INPUT_MAP,
  build(world) {
    world.state.cd = initialCd();
    return new CdView({ name: 'cd-view' });
  },
  probe(world) {
    const s = cdState(world);
    return { frame: world.frame, beat: beatOf(world.frame), onBeat: onBeat(world.frame), x: s.x, y: s.y, hp: s.hp, combo: s.combo, bestCombo: s.bestCombo, kills: s.kills, foes: s.foes.map((f) => ({ kind: f.kind, x: f.x, y: f.y, hp: f.hp })), won: s.won, dead: s.dead };
  },
});

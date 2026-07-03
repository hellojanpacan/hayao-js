// Glimmerfall: instant sim, animated view. Gem sprites spring toward their
// grid slots and burst on clears — the choreography reads the resolve script
// but never touches the board. If the tweens vanished, the game would still
// be exactly the game (that's the test of a cosmetic layer).

import { Node, PARTICLE_PRESETS, Particles, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { bidx, initialGf, trySwap, BOARD, MOVE_BUDGET, TARGET_SCORE, type GfState } from './logic';

export const GF_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  grab: ['Space', 'Enter'],
  restart: ['KeyR'],
};

const CELL = 74;
const OX = 640 - (BOARD * CELL) / 2 + CELL / 2;
const OY = 372 - (BOARD * CELL) / 2 + CELL / 2;
const at = (x: number, y: number) => ({ x: OX + x * CELL, y: OY + y * CELL });

const GEMS = ['#ff6d8a', '#ffd75e', '#8fe8b0', '#7fc8ff', '#c8a8ff', '#ff9d47'];
const PAL = { bg: '#141020', cell: '#1e1830', cellLine: '#2e2648', cursor: '#ffffff', sel: '#ffd75e', text: '#9a8fc0' };

export function gfState(world: World): GfState {
  return world.state.gf as GfState;
}

class GfView extends Node {
  override readonly type = 'GfView';
  private layer = new Node({ name: 'layer' });
  private gems: Sprite[] = [];
  private gemPos: { x: number; y: number }[] = [];
  private cursor!: Sprite;
  private selRing!: Sprite;
  private hud!: Text;
  private fx = new Particles({ name: 'fx', seed: 31, z: 9, maxParticles: 700 });

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.layer.addChild(this.fx);
    for (let y = 0; y < BOARD; y++)
      for (let x = 0; x < BOARD; x++) {
        this.layer.addChild(new Sprite({ pos: at(x, y), z: 1, shape: { kind: 'rect', w: CELL - 6, h: CELL - 6, r: 12 }, fill: PAL.cell, stroke: PAL.cellLine, strokeWidth: 1 }));
        const g = this.layer.addChild(new Sprite({ pos: at(x, y - 2), z: 4, shape: { kind: 'poly', points: [0, -24, 21, 0, 0, 24, -21, 0], closed: true }, fill: GEMS[0], stroke: '#0d0a14', strokeWidth: 2 }));
        this.gems.push(g);
        this.gemPos.push(at(x, y - 2));
      }
    this.cursor = this.layer.addChild(new Sprite({ z: 6, shape: { kind: 'rect', w: CELL - 2, h: CELL - 2, r: 14 }, fill: 'none', stroke: PAL.cursor, strokeWidth: 2.5 }));
    this.selRing = this.layer.addChild(new Sprite({ z: 6, shape: { kind: 'circle', radius: 30 }, fill: 'none', stroke: PAL.sel, strokeWidth: 3 }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 28 }, z: 8, size: 20, align: 'center', fill: PAL.text, text: '' }));
    this.layer.addChild(new Text({ pos: { x: 640, y: 700 }, z: 8, size: 16, align: 'center', fill: PAL.text, text: 'arrows move · Space grabs, then an arrow swaps · match 3+' }));
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = gfState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.gf = initialGf(world.rng);
      hideScreen();
      return;
    }
    const dx = (input.justPressed('right') ? 1 : 0) - (input.justPressed('left') ? 1 : 0);
    const dy = (input.justPressed('down') ? 1 : 0) - (input.justPressed('up') ? 1 : 0);
    if (!s.won && !s.dead) {
      if (input.justPressed('grab')) s.sel = s.sel ? null : { ...s.cursor };
      else if (dx || dy) {
        if (s.sel) {
          const ev = trySwap(s, s.sel.x, s.sel.y, dx, dy, world.rng);
          s.sel = null;
          if (ev.swapped) {
            audio.blip(400 + ev.cascaded * 80);
            // Choreograph: bursts per combo depth (staggered by the fall).
            for (const step of s.lastSteps)
              for (const i of step.cleared) {
                const x = i % BOARD;
                const y = (i / BOARD) | 0;
                this.fx.burst(4 + step.combo * 2, at(x, y), PARTICLE_PRESETS.burst([GEMS[step.combo % GEMS.length], '#ffffff']));
              }
            if (ev.cascaded > 1) audio.success();
          } else audio.blip(140);
          if (ev.won) showScreen({ title: 'The board glitters clean', body: `${s.score} light gathered with ${s.movesLeft} moves to spare.`, actions: [{ label: 'Again', primary: true, onSelect: () => { world.state.gf = initialGf(world.rng); hideScreen(); } }] });
          if (ev.died) showScreen({ title: 'The glimmer fades', body: `${s.score}/${TARGET_SCORE} gathered.`, actions: [{ label: 'One more board', primary: true, onSelect: () => { world.state.gf = initialGf(world.rng); hideScreen(); } }] });
        } else {
          s.cursor.x = Math.min(BOARD - 1, Math.max(0, s.cursor.x + dx));
          s.cursor.y = Math.min(BOARD - 1, Math.max(0, s.cursor.y + dy));
        }
      }
    }

    // ── Spring choreography: gems chase their slots; colors snap to truth ──
    const k = Math.min(1, dt * 10);
    for (let y = 0; y < BOARD; y++)
      for (let x = 0; x < BOARD; x++) {
        const i = bidx(x, y);
        const target = at(x, y);
        const p = this.gemPos[i];
        p.x += (target.x - p.x) * k;
        p.y += (target.y - p.y) * k;
        const g = this.gems[i];
        g.pos = { x: p.x, y: p.y };
        g.paint.fill = GEMS[s.board[i] % GEMS.length];
      }
    this.cursor.pos = at(s.cursor.x, s.cursor.y);
    this.selRing.visible = !!s.sel;
    if (s.sel) this.selRing.pos = at(s.sel.x, s.sel.y);
    this.hud.text = `light ${s.score}/${TARGET_SCORE} · moves ${s.movesLeft}/${MOVE_BUDGET}${s.reshuffles ? ` · reshuffles ${s.reshuffles}` : ''}`;
  }
}

registerNode('GfView', () => new GfView({ name: 'gf-view' }));

export const glimmerfallGame = defineGame({
  title: 'Glimmerfall',
  background: PAL.bg,
  inputMap: GF_INPUT_MAP,
  build(world) {
    world.state.gf = initialGf(world.rng);
    return new GfView({ name: 'gf-view' });
  },
  probe(world) {
    const s = gfState(world);
    return { frame: world.frame, score: s.score, movesLeft: s.movesLeft, cursor: { ...s.cursor }, sel: s.sel, reshuffles: s.reshuffles, won: s.won, dead: s.dead, board: [...s.board] };
  },
});

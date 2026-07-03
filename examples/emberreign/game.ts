// Emberreign: a card table of consequence — four meter columns, the speaker,
// the dilemma, two fates. Text-forward; the meters ARE the drama.

import { Node, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { choose, drawCard, initialEr, DECK, DOOMS, METERS, SEASONS_PER_YEAR, YEARS_TO_WIN, type ErState } from './logic';

export const ER_INPUT_MAP: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  restart: ['KeyR'],
};

const PAL = { bg: '#191210', card: '#241a16', cardLine: '#3d2c24', ink: '#f0e4d8', soft: '#a89484', meterBack: '#141311', meters: { grove: '#8fe8b0', folk: '#ffd75e', wardens: '#c05555', coffers: '#e8d8a0' } as Record<string, string>, choiceL: '#7fc8ff', choiceR: '#ff9d47' };

export function erState(world: World): ErState {
  return world.state.er as ErState;
}

class ErView extends Node {
  override readonly type = 'ErView';
  private layer = new Node({ name: 'layer' });
  private meterFills: Sprite[] = [];
  private who!: Text;
  private text1!: Text;
  private text2!: Text;
  private optL!: Text;
  private optR!: Text;
  private hud!: Text;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    // Meter columns.
    METERS.forEach((m, i) => {
      const x = 400 + i * 160;
      this.layer.addChild(new Sprite({ pos: { x, y: 120 }, z: 2, shape: { kind: 'rect', w: 26, h: 130, r: 8 }, fill: PAL.meterBack, stroke: PAL.cardLine, strokeWidth: 2 }));
      this.meterFills.push(this.layer.addChild(new Sprite({ pos: { x, y: 120 }, z: 3, shape: { kind: 'rect', w: 18, h: 60, r: 6 }, fill: PAL.meters[m] })));
      this.layer.addChild(new Text({ pos: { x, y: 205 }, z: 3, size: 15, align: 'center', fill: PAL.soft, text: m }));
    });
    this.layer.addChild(new Sprite({ pos: { x: 640, y: 430 }, z: 1, shape: { kind: 'rect', w: 860, h: 300, r: 22 }, fill: PAL.card, stroke: PAL.cardLine, strokeWidth: 2 }));
    this.who = this.layer.addChild(new Text({ pos: { x: 640, y: 340 }, z: 4, size: 20, align: 'center', fill: PAL.soft, text: '' }));
    this.text1 = this.layer.addChild(new Text({ pos: { x: 640, y: 400 }, z: 4, size: 26, align: 'center', fill: PAL.ink, text: '' }));
    this.text2 = this.layer.addChild(new Text({ pos: { x: 640, y: 436 }, z: 4, size: 26, align: 'center', fill: PAL.ink, text: '' }));
    this.optL = this.layer.addChild(new Text({ pos: { x: 400, y: 520 }, z: 4, size: 21, align: 'center', fill: PAL.choiceL, text: '' }));
    this.optR = this.layer.addChild(new Text({ pos: { x: 880, y: 520 }, z: 4, size: 21, align: 'center', fill: PAL.choiceR, text: '' }));
    this.hud = this.layer.addChild(new Text({ pos: { x: 640, y: 660 }, z: 4, size: 17, align: 'center', fill: PAL.soft, text: '' }));
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = erState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.er = initialEr();
      drawCard(erState(world), world.rng);
      hideScreen();
      return;
    }
    if (!s.won && !s.dead) {
      const side = input.justPressed('left') ? 'left' : input.justPressed('right') ? 'right' : null;
      if (side) {
        const ev = choose(s, side, world.rng);
        audio.blip(side === 'left' ? 320 : 400);
        if (ev.ended) {
          audio.thud();
          const body = s.won ? `Twelve years of embers, ${s.season} seasons of choices.` : DOOMS[s.ending!] ?? '';
          showScreen({ title: s.won ? 'A long reign' : 'The reign ends', body, actions: [{ label: 'Take the throne again', primary: true, onSelect: () => { world.state.er = initialEr(); drawCard(erState(world), world.rng); hideScreen(); } }] });
        }
      }
    }
    this.redraw(s);
  }

  private redraw(s: ErState): void {
    METERS.forEach((m, i) => {
      const v = s.meters[m];
      const h = Math.max(4, (v / 100) * 126);
      const f = this.meterFills[i];
      f.shape = { kind: 'rect', w: 18, h, r: 6 };
      f.pos = { x: 400 + i * 160, y: 120 + (126 - h) / 2 };
      f.paint.opacity = v <= 15 || v >= 85 ? 0.55 + 0.45 * Math.abs(Math.sin(s.season)) : 1; // warning shimmer
    });
    const card = DECK.find((c) => c.id === s.cardId);
    if (card) {
      this.who.text = `— ${card.who} —`;
      const words = card.text.split(' ');
      const mid = Math.ceil(words.length / 2);
      this.text1.text = words.slice(0, mid).join(' ');
      this.text2.text = words.slice(mid).join(' ');
      this.optL.text = `← ${card.left.label}`;
      this.optR.text = `${card.right.label} →`;
    }
    const year = Math.floor(s.season / SEASONS_PER_YEAR) + 1;
    this.hud.text = `year ${Math.min(YEARS_TO_WIN, year)} of ${YEARS_TO_WIN} · season ${(s.season % SEASONS_PER_YEAR) + 1} · keep every ember between the ditches`;
  }
}

registerNode('ErView', () => new ErView({ name: 'er-view' }));

export const emberreignGame = defineGame({
  title: 'Emberreign',
  background: PAL.bg,
  inputMap: ER_INPUT_MAP,
  build(world) {
    world.state.er = initialEr();
    drawCard(world.state.er as ErState, world.rng);
    return new ErView({ name: 'er-view' });
  },
  probe(world) {
    const s = erState(world);
    return { frame: world.frame, season: s.season, meters: { ...s.meters }, flags: [...s.flags], cardId: s.cardId, ending: s.ending, won: s.won, dead: s.dead };
  },
});

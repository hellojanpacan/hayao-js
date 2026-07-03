// Thornspire: the run sim in world.state; a text-forward card table view —
// hand as numbered cards, the foe's intent always visible (the genre's core
// promise: perfect information about the next enemy move).

import { Node, Sprite, Text, audio, defineGame, hideScreen, registerNode, showScreen, type InputMap, type World } from '@hayao';
import { currentIntent, initialTs, stepTs, CARDS, CLIMB, FOES, type TsState } from './logic';

export const TS_INPUT_MAP: InputMap = {
  'play-0': ['Digit1'],
  'play-1': ['Digit2'],
  'play-2': ['Digit3'],
  'play-3': ['Digit4'],
  'play-4': ['Digit5'],
  'play-5': ['Digit6'],
  'play-6': ['Digit7'],
  end: ['KeyE', 'Space'],
  'pick-0': ['Digit1'],
  'pick-1': ['Digit2'],
  'pick-2': ['Digit3'],
  skip: ['Digit4', 'KeyX'],
  proceed: ['Enter', 'Space'],
  restart: ['KeyR'],
};

const PAL = { bg: '#171126', felt: '#211a33', line: '#3a2f52', ink: '#e8e2f6', soft: '#9a8fc0', hp: '#ff6d8a', energy: '#ffd75e', foe: '#c05555', block: '#7fc8ff', card: '#2a2244', cardLine: '#4a3c70', intent: '#ffb86e' };

export function tsState(world: World): TsState {
  return world.state.ts as TsState;
}

class TsView extends Node {
  override readonly type = 'TsView';
  private layer = new Node({ name: 'layer' });
  private lines: Text[] = [];
  private foeSprite!: Sprite;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    this.layer.addChild(new Sprite({ pos: { x: 640, y: 360 }, z: 0, shape: { kind: 'rect', w: 1180, h: 620, r: 24 }, fill: PAL.felt, stroke: PAL.line, strokeWidth: 2 }));
    this.foeSprite = this.layer.addChild(new Sprite({ pos: { x: 640, y: 210 }, z: 2, shape: { kind: 'circle', radius: 52 }, fill: PAL.foe, stroke: '#1a0f0f', strokeWidth: 4 }));
    for (let i = 0; i < 9; i++) this.lines.push(this.layer.addChild(new Text({ pos: { x: 640, y: 96 + i * 58 }, z: 3, size: 21, align: 'center', fill: PAL.ink, text: '' })));
  }

  protected override onProcess(): void {
    const world = this.world as World;
    const s = tsState(world);
    const input = world.input;
    if (input.justPressed('restart')) {
      world.state.ts = initialTs();
      hideScreen();
      return;
    }
    if (s.won || s.dead) return;
    let play = -1;
    for (let i = 0; i < 7; i++) if (input.justPressed(`play-${i}`)) play = i;
    let pick = -1;
    if (s.draft) {
      for (let i = 0; i < 3; i++) if (input.justPressed(`pick-${i}`)) pick = i;
      if (input.justPressed('skip')) pick = 3;
      play = -1;
    }
    const ev = stepTs(s, { play, endTurn: input.justPressed('end'), pick, proceed: input.justPressed('proceed') }, world.rng);
    if (ev.played) audio.blip(420);
    if (ev.playerHurt) audio.blip(140);
    if (ev.fightWon) audio.success();
    if (ev.won) showScreen({ title: 'The Spire Heart shatters', body: `The climb is done. ${s.fightsWon} battles, ${s.deck.length} cards, ${s.hp} hp to spare.`, actions: [{ label: 'Climb again', primary: true, onSelect: () => { world.state.ts = initialTs(); hideScreen(); } }] });
    if (ev.died) showScreen({ title: 'The thorns claim you', body: `Fell at ${s.node >= 0 ? FOES[CLIMB[s.node].foe!]?.name ?? 'the climb' : 'the gate'} after ${s.fightsWon} wins.`, actions: [{ label: 'Try again', primary: true, onSelect: () => { world.state.ts = initialTs(); hideScreen(); } }] });
    this.redraw(s);
  }

  private redraw(s: TsState): void {
    const L = this.lines;
    L.forEach((l) => (l.text = ''));
    this.foeSprite.visible = !!s.fight;
    if (s.draft) {
      L[0].text = '— choose a card for your deck —';
      s.draft.forEach((id, i) => {
        const c = CARDS[id];
        L[1 + i].text = `[${i + 1}] ${c.name} · cost ${c.cost} · ${cardBlurb(id)}`;
      });
      L[4].text = '[4] take nothing (a lean deck is a fast deck)';
      return;
    }
    if (!s.fight) {
      L[2].text = s.node < 0 ? 'THORNSPIRE' : 'the path winds upward…';
      L[3].text = `hp ${s.hp}/${s.maxHp} · deck ${s.deck.length} cards`;
      L[4].text = 'press Enter to climb';
      const next = CLIMB[s.node + 1];
      if (next) L[5].text = `ahead: ${next.kind === 'rest' ? 'a resting fire' : FOES[next.foe!].name}`;
      return;
    }
    const f = s.fight;
    const foe = FOES[f.foe];
    const intent = currentIntent(s)!;
    const intentTxt = intent.kind === 'attack' ? `will strike for ${intent.value * (f.charged ? 2 : 1)}` : intent.kind === 'block' ? `will brace (+${intent.value} block)` : 'is gathering power…';
    L[0].text = `${foe.name} — ${f.foeHp} hp${f.foeBlock ? ` (${f.foeBlock} block)` : ''}${f.foeVuln ? ' · vulnerable' : ''}`;
    L[1].text = `it ${intentTxt}`;
    L[3].text = `you — ${s.hp}/${s.maxHp} hp${f.block ? ` (${f.block} block)` : ''} · energy ${f.energy}/3 · turn ${f.turn}`;
    f.hand.forEach((id, i) => {
      const c = CARDS[id];
      L[4 + Math.floor(i / 2)].text += `${i % 2 ? '    ' : ''}[${i + 1}] ${c.name} (${c.cost}) ${cardBlurb(id)}`;
    });
    L[8].text = '[E] end turn · number keys play cards';
  }
}

function cardBlurb(id: string): string {
  const c = CARDS[id];
  const bits: string[] = [];
  if (c.dmg) bits.push(`${c.dmg} dmg${c.hits ? ` ×${c.hits}` : ''}`);
  if (c.block) bits.push(`${c.block} block`);
  if (c.vuln) bits.push(`vuln ${c.vuln}`);
  if (c.draw) bits.push(`draw ${c.draw}`);
  return bits.join(', ');
}

registerNode('TsView', () => new TsView({ name: 'ts-view' }));

export const thornspireGame = defineGame({
  title: 'Thornspire',
  background: PAL.bg,
  inputMap: TS_INPUT_MAP,
  build(world) {
    world.state.ts = initialTs();
    return new TsView({ name: 'ts-view' });
  },
  probe(world) {
    const s = tsState(world);
    return { frame: world.frame, node: s.node, hp: s.hp, deck: s.deck.length, fighting: !!s.fight, foeHp: s.fight?.foeHp ?? 0, energy: s.fight?.energy ?? 0, hand: s.fight?.hand ?? [], draft: s.draft, intent: currentIntent(s), won: s.won, dead: s.dead, fightsWon: s.fightsWon };
  },
});

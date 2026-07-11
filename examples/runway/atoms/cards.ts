// The deck's face — Runway's first atom. Iteration log:
//   v1 hand-placed SVG mocks: six corrections, all layout (margins, overlap,
//      chip drift) → the lesson that built the engine's card kit.
//   v2 rebuilt on makeCard: content only, layout guaranteed; the wry-doom
//      flavor lines carry the tone. Day/night knob rides the CardTheme pair.
// Radiates: committing to one card at a time while a clock runs — a solitaire
// economy where every play is a small irreversible promise.

import {
  Node,
  Sprite,
  defineAtom,
  makeCard,
  knob,
  duotone,
  REGALIA,
  CARD_DAY,
  CARD_NIGHT,
  type CardSpec,
  type CardTheme,
  type World,
} from '@hayao';

function artEngineer(_w: number, _h: number): Node {
  const s = duotone(REGALIA.blue);
  const n = new Node({ name: 'art' });
  n.cosmetic = true;
  n.addChild(new Sprite({ pos: { x: 20, y: 110 }, shape: { kind: 'rect', w: 212, h: 9, r: 3, anchor: 'topLeft' }, fill: s.shade }));
  n.addChild(new Sprite({ pos: { x: 132, y: 36 }, shape: { kind: 'rect', w: 86, h: 58, r: 6, anchor: 'topLeft' }, fill: s.base }));
  n.addChild(new Sprite({ pos: { x: 140, y: 44 }, shape: { kind: 'rect', w: 70, h: 42, r: 3, anchor: 'topLeft' }, fill: s.light }));
  n.addChild(new Sprite({ pos: { x: 74, y: 52 }, shape: { kind: 'circle', radius: 15 }, fill: s.shade }));
  n.addChild(new Sprite({ pos: { x: 74, y: 108 }, shape: { kind: 'path', d: 'M-24 0 C-24 -30 24 -30 24 0 Z' }, fill: s.base }));
  return n;
}

function artCoins(w: number, h: number): Node {
  const s = duotone(REGALIA.gold);
  const n = new Node({ name: 'art' });
  n.cosmetic = true;
  for (let i = 0; i < 3; i++) {
    n.addChild(new Sprite({ pos: { x: w / 2, y: h / 2 + 22 - i * 20 }, shape: { kind: 'ellipse', rx: 50, ry: 16 }, fill: s.base, stroke: s.ink, strokeWidth: 2 }));
  }
  n.addChild(new Sprite({ pos: { x: w / 2, y: h / 2 - 18 }, shape: { kind: 'ellipse', rx: 44, ry: 12 }, fill: s.light }));
  return n;
}

function artPivot(w: number, h: number): Node {
  const blue = duotone(REGALIA.blue);
  const rose = duotone(REGALIA.rose);
  const n = new Node({ name: 'art' });
  n.cosmetic = true;
  n.addChild(new Sprite({ pos: { x: w / 2, y: h / 2 }, shape: { kind: 'rect', w: 74, h: 100, r: 12 }, fill: blue.base }));
  n.addChild(new Sprite({ pos: { x: w / 2, y: h / 2 }, shape: { kind: 'rect', w: 58, h: 76, r: 5 }, fill: blue.light }));
  n.addChild(new Sprite({ pos: { x: w / 2, y: h / 2 }, shape: { kind: 'path', d: 'M0 -8 C-10 -22 -30 -6 0 16 C30 -6 10 -22 0 -8 Z' }, fill: rose.base }));
  return n;
}

function deck(theme: CardTheme): CardSpec[] {
  const template = { theme };
  return [
    {
      template,
      slots: [
        { kind: 'chips', left: [{ text: 'HIRE' }], right: [{ text: '$30K', role: 'cash' }] },
        { kind: 'title', text: 'Founding Engineer' },
        { kind: 'art', height: 140, build: artEngineer },
        { kind: 'effects', trigger: 'everyTurn', rows: [
          { glyph: 'cube', role: 'product', value: 2, label: 'Product' },
          { glyph: 'flame', role: 'burn', value: 1, label: 'Burn' },
        ] },
        { kind: 'paragraph', text: 'Writes code faster than the runway burns. Usually.' },
      ],
    },
    {
      template,
      slots: [
        { kind: 'chips', left: [{ text: 'FINANCING' }], right: [{ text: 'FREE', role: 'cash' }] },
        { kind: 'title', text: 'Seed Round' },
        { kind: 'art', height: 140, build: artCoins },
        { kind: 'effects', trigger: 'onPlay', rows: [
          { glyph: 'coin', role: 'cash', value: '$250K', label: 'Cash' },
          { glyph: 'users', role: 'tech', label: 'Adds a Board' },
        ] },
        { kind: 'paragraph', text: 'Money now. A board that expects a hockey stick later.' },
      ],
    },
    {
      template,
      slots: [
        { kind: 'chips', left: [{ text: 'EVENT' }] },
        { kind: 'title', text: 'Pivot: Horse Tinder' },
        { kind: 'art', height: 120, build: artPivot },
        { kind: 'divider' },
        { kind: 'paragraph', tone: 'body', text: 'Discard your product. Draw 3 from the Absurd deck. Your model resets — the sales team is not included.' },
        { kind: 'paragraph', text: 'It tested surprisingly well.' },
      ],
    },
  ];
}

export const cards = defineAtom({
  kind: 'scene',
  title: 'The Deck',
  radiates: 'committing to one card at a time while a clock runs',
  background: REGALIA.ground,
  tuning: { knobs: [knob.enumOf('theme', { default: 'day', options: ['day', 'night'], group: 'style', label: 'card theme', cosmetic: true })] },
  build: (world: World) => {
    const theme = (world.tune('theme') as string) === 'night' ? CARD_NIGHT : CARD_DAY;
    const root = new Node({ name: 'deck' });
    root.cosmetic = true;
    deck(theme).forEach((spec, i) => {
      const card = makeCard(spec);
      card.pos = { x: 120 + i * 340, y: 96 };
      root.addChild(card);
    });
    return root;
  },
});

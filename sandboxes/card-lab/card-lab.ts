// card-lab — one primitive in isolation: the card kit (`makeCard`). This is a
// catalog sheet, not a game: four cards of deliberately DIFFERENT anatomy sit
// side by side so you can read what the slot stack does at a glance.
//
//   1. a Hire      — chips · title · art · every-turn effects · tag · flavor
//   2. a Financing — a one-time (on-play) effect, no tag
//   3. an Event    — no cost chip, a divider, a text-heavy rules body
//   4. an MVP      — the sparse case: title · art · one effect, nothing else
//
// The point: the SAME layout engine lays out all four with even margins and no
// overlap, though their anatomies share almost nothing. You bring art + words;
// the kit brings the frame. Flip the `theme` knob to see the day↔night mirror.
//
// THE SEAM: every card is `cosmetic` (makeCard returns a pure-view node), so the
// whole sheet stays out of world.hash(). Strip the cards and the sandbox hashes
// the same — the discipline a real deckbuilder renders its hand with.

import {
  Node,
  Sprite,
  Text,
  makeCard,
  resourceGlyph,
  duotone,
  REGALIA,
  CARD_DAY,
  CARD_NIGHT,
  defineGame,
  knob,
  type CardTheme,
  type CardSpec,
  type World,
} from '@hayao';

const FONT = 'Overpass';
const heading = (x: number, y: number, text: string, size: number, fill: string): Text =>
  new Text({ pos: { x, y }, text, size, font: FONT, weight: 600, fill });

function grp(): Node {
  const n = new Node({ name: 'art' });
  n.cosmetic = true;
  return n;
}

// ── art builders: each draws in local (0,0)..(w,h), top-left ─────────
function artEngineer(_w: number, _h: number): Node {
  const s = duotone(REGALIA.blue);
  const n = grp();
  n.addChild(new Sprite({ pos: { x: 20, y: 110 }, shape: { kind: 'rect', w: 212, h: 9, r: 3, anchor: 'topLeft' }, fill: s.shade }));
  n.addChild(new Sprite({ pos: { x: 132, y: 36 }, shape: { kind: 'rect', w: 86, h: 58, r: 6, anchor: 'topLeft' }, fill: s.base }));
  n.addChild(new Sprite({ pos: { x: 140, y: 44 }, shape: { kind: 'rect', w: 70, h: 42, r: 3, anchor: 'topLeft' }, fill: s.light }));
  for (const [y, w] of [[52, 30], [62, 46], [72, 22]] as const)
    n.addChild(new Sprite({ pos: { x: 148, y }, shape: { kind: 'rect', w, h: 5, r: 2, anchor: 'topLeft' }, fill: s.shade }));
  n.addChild(new Sprite({ pos: { x: 74, y: 52 }, shape: { kind: 'circle', radius: 15 }, fill: s.shade }));
  n.addChild(new Sprite({ pos: { x: 74, y: 108 }, shape: { kind: 'path', d: 'M-24 0 C-24 -30 24 -30 24 0 Z' }, fill: s.base }));
  n.addChild(new Sprite({ pos: { x: 66, y: 100 }, shape: { kind: 'rect', w: 66, h: 7, r: 3, anchor: 'topLeft' }, fill: s.shade }));
  return n;
}

function artCoins(w: number, h: number): Node {
  const s = duotone(REGALIA.gold);
  const n = grp();
  const cx = w / 2;
  for (let i = 0; i < 3; i++) {
    const cy = h / 2 + 22 - i * 20;
    n.addChild(new Sprite({ pos: { x: cx, y: cy }, shape: { kind: 'ellipse', rx: 50, ry: 16 }, fill: s.base, stroke: s.ink, strokeWidth: 2 }));
  }
  n.addChild(new Sprite({ pos: { x: cx, y: h / 2 - 18 }, shape: { kind: 'ellipse', rx: 44, ry: 12 }, fill: s.light }));
  return n;
}

function artPivot(w: number, h: number): Node {
  const blue = duotone(REGALIA.blue);
  const rose = duotone(REGALIA.rose);
  const n = grp();
  const cx = w / 2;
  n.addChild(new Sprite({ pos: { x: cx, y: h / 2 }, shape: { kind: 'rect', w: 74, h: 108, r: 12 }, fill: blue.base }));
  n.addChild(new Sprite({ pos: { x: cx, y: h / 2 }, shape: { kind: 'rect', w: 58, h: 82, r: 5 }, fill: blue.light }));
  n.addChild(new Sprite({ pos: { x: cx, y: h / 2 }, shape: { kind: 'path', d: 'M0 -8 C-10 -22 -30 -6 0 16 C30 -6 10 -22 0 -8 Z' }, fill: rose.base }));
  return n;
}

function artMvp(w: number, h: number): Node {
  const n = grp();
  const g = resourceGlyph('spark', REGALIA.blue, 84);
  g.pos = { x: w / 2, y: h / 2 };
  n.addChild(g);
  return n;
}

// ── the four cards ───────────────────────────────────────────────────
function specs(theme: CardTheme): CardSpec[] {
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
        { kind: 'chips', left: [{ text: 'ENG', outline: true, role: 'tech' }] },
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
    {
      template,
      slots: [
        { kind: 'title', text: 'MVP' },
        { kind: 'art', height: 150, build: artMvp },
        { kind: 'effects', rows: [{ glyph: 'spark', role: 'tech', value: 1, label: 'Product' }] },
      ],
    },
  ];
}

export const cardLabGame = defineGame({
  title: 'Card Lab',
  width: 1300,
  height: 720,
  background: REGALIA.ground,
  tuning: {
    knobs: [knob.enumOf('theme', { default: 'day', options: ['day', 'night'], group: 'style', label: 'card theme', cosmetic: true })],
  },
  build: (world: World) => {
    const theme = (world.tune('theme') as string) === 'night' ? CARD_NIGHT : CARD_DAY;
    const root = new Node({ name: 'card-lab' });

    root.addChild(heading(22, 44, 'Card Lab', 30, REGALIA.paperInk));
    root.addChild(heading(190, 46, 'one primitive — the card', 15, REGALIA.softInk));

    specs(theme).forEach((spec, i) => {
      const card = makeCard(spec);
      card.pos = { x: 22 + i * 315, y: 92 };
      root.addChild(card);
    });

    root.addChild(heading(22, 690, 'composable slots · measured margins · bring your own font, theme, and glyphs', 14, REGALIA.softInk));
    return root;
  },
  probe: (world) => ({ frame: world.frame, hash: world.hash(), theme: world.tune('theme'), cards: 4 }),
});

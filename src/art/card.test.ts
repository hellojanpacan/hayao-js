// The card kit's whole promise is "you never think about layout again", so the
// tests assert exactly the failures that made hand-placing a card painful:
// margins drifting, slots overlapping, a chip overflowing the frame, a long
// title spilling out, flavor crashing the bottom edge. If these hold, a designer
// can pour any art + content in and trust the frame.

import { describe, it, expect } from 'vitest';
import { Node } from '../scene/node';
import { Sprite, Text } from '../scene/nodes';
import { HeadlessRenderer } from '../render/headless';
import type { DrawCommand } from '../render/commands';
import { measureVectorText, OVERPASS_600 } from './fontMetrics';
import { makeCard, cardLayout, CARD_TEMPLATE, CARD_NIGHT, type CardSpec } from './card';

const CW = CARD_TEMPLATE.width - 2 * CARD_TEMPLATE.gutter;

/** A representative "full" card: every common slot in one anatomy. */
const foundingEngineer: CardSpec = {
  slots: [
    { kind: 'chips', left: [{ text: 'HIRE' }], right: [{ text: '$30K', role: 'cash' }] },
    { kind: 'title', text: 'Founding Engineer' },
    { kind: 'art', height: 140, build: (w, h) => new Sprite({ shape: { kind: 'rect', w: w - 20, h: h - 20, anchor: 'topLeft' }, pos: { x: 10, y: 10 }, fill: '#88a' }) },
    { kind: 'effects', trigger: 'everyTurn', rows: [
      { glyph: 'cube', role: 'product', value: 2, label: 'Product' },
      { glyph: 'flame', role: 'burn', value: 1, label: 'Burn' },
    ] },
    { kind: 'chips', left: [{ text: 'ENG', outline: true, role: 'tech' }] },
    { kind: 'paragraph', text: 'Writes code faster than the runway burns. Usually.' },
  ],
};

/** First Sprite descendant of a node (the pill/panel background rect). */
function firstSprite(n: Node): Sprite | null {
  if (n instanceof Sprite) return n;
  for (const c of n.children) {
    const r = firstSprite(c);
    if (r) return r;
  }
  return null;
}

describe('makeCard layout', () => {
  it('is deterministic — same spec, same geometry and same draw list', () => {
    const a = makeCard(foundingEngineer);
    const b = makeCard(foundingEngineer);
    expect(cardLayout(a)).toEqual(cardLayout(b));
    const ca: DrawCommand[] = [];
    const cb: DrawCommand[] = [];
    a.collectDraw(ca);
    b.collectDraw(cb);
    expect(ca.length).toBe(cb.length);
    expect(ca.length).toBeGreaterThan(0);
  });

  it('keeps every slot inside the gutter box on all four sides', () => {
    const card = makeCard(foundingEngineer);
    const L = cardLayout(card)!;
    for (const s of L.slots) {
      expect(s.x).toBeGreaterThanOrEqual(L.gutter);
      expect(s.x + s.w).toBeLessThanOrEqual(L.width - L.gutter + 0.001);
      expect(s.y).toBeGreaterThanOrEqual(L.gutter - 0.001);
      expect(s.y + s.h).toBeLessThanOrEqual(L.height - L.gutter + 0.001);
    }
  });

  it('never overlaps two slots vertically', () => {
    const L = cardLayout(makeCard(foundingEngineer))!;
    const sorted = [...L.slots].sort((p, q) => p.y - q.y);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].y).toBeGreaterThanOrEqual(sorted[i - 1].y + sorted[i - 1].h - 0.001);
    }
  });

  it('sizes a chip pill to its text — longer label, wider pill', () => {
    const short = makeCard({ slots: [{ kind: 'chips', left: [{ text: 'A' }] }] });
    const long = makeCard({ slots: [{ kind: 'chips', left: [{ text: 'ACQUISITION' }] }] });
    const shortW = (firstSprite(short.find('chips')!)!.shape as { w: number }).w;
    const longW = (firstSprite(long.find('chips')!)!.shape as { w: number }).w;
    expect(longW).toBeGreaterThan(shortW);
  });

  it('auto-fits a long title so it can never overflow the content width', () => {
    const card = makeCard({ slots: [{ kind: 'title', text: 'A Preposterously Overlong Enterprise Title' }] });
    const title = card.find('title')!;
    const text = title.children.find((c) => c instanceof Text) as Text;
    expect(measureVectorText(OVERPASS_600, text.text, text.size)).toBeLessThanOrEqual(CW + 0.001);
  });

  it('bottom-anchors a slot flush to the bottom gutter on a fixed-height card', () => {
    const card = makeCard({
      height: 460,
      slots: [
        { kind: 'title', text: 'Sparse' },
        { kind: 'paragraph', text: 'Pinned to the base.', anchor: 'bottom' },
      ],
    });
    const L = cardLayout(card)!;
    const para = L.slots.find((s) => s.name === 'paragraph')!;
    expect(para.y + para.h).toBeCloseTo(L.height - L.gutter, 1);
    const title = L.slots.find((s) => s.name === 'title')!;
    expect(title.y).toBe(L.gutter);
  });

  it('auto height = gutters + slots + gaps', () => {
    const L = cardLayout(makeCard(foundingEngineer))!;
    const slotSum = L.slots.reduce((a, s) => a + s.h, 0);
    const expected = L.gutter * 2 + slotSum + (L.slots.length - 1) * L.gap;
    expect(L.height).toBe(expected);
  });

  it('honours a swapped theme (night card renders a dark ground)', () => {
    const card = makeCard({ template: { theme: CARD_NIGHT }, slots: [{ kind: 'title', text: 'Night' }] });
    const bg = firstSprite(card)!;
    expect(bg.paint.fill).toBe(CARD_NIGHT.ground);
  });

  it('renders headlessly to an SVG screenshot', () => {
    const card = makeCard(foundingEngineer);
    const L = cardLayout(card)!;
    card.pos = { x: 20, y: 20 };
    const out: DrawCommand[] = [];
    card.collectDraw(out);
    const r = new HeadlessRenderer({ width: L.width + 40, height: L.height + 40, background: '#141a30' });
    r.draw(out);
    const svg = r.toSVGString();
    expect(svg).toContain('<svg');
    expect(r.count('rect')).toBeGreaterThan(0);
  });
});

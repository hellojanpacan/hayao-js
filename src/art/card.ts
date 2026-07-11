// The card kit — a flexible, self-laying-out playing card for any deckbuilder,
// TCG, roguelite reward screen, or board game built on hayao.
//
// WHY THIS EXISTS: hand-placing a card's chrome (margins, chip shapes, an
// every-turn brace, wrapped flavor) is the same fiddly work in every card game,
// and getting it consistent across a whole deck by eye is nearly impossible. So
// this module owns layout so a designer never has to: you describe a card as an
// ordered list of SLOTS (chips · title · art · effects · paragraph · …) and the
// kit measures the real font to place everything on a fixed grid — even margins,
// even gaps, chips sized to their text, a title that auto-shrinks to fit, flavor
// that wraps and sits a clean gutter above the bottom edge.
//
// CRISP VECTOR TEXT, EXACTLY MEASURED: text renders as the engine's real `Text`
// node (smooth, mixed-case, house Overpass) and width comes from a `FontMetric`
// advance-width table (see fontMetrics.ts) — so layout is exact and deterministic
// without a canvas or a loaded font, the same way the logo is outlined from true
// metrics. Pass your own `FontMetric` + family to measure and render any face.
//
// COMPOSABLE, NOT FIXED: the slot stack is generic — reorder, drop, or add slots
// and the grid still holds. That is what makes it reusable across card anatomies
// (a Slay-the-Spire card, a text-heavy euro card, a minimal reward token) rather
// than being one game's card in disguise. The template also carries the palette
// THEME and glyph SET, both overridable — lose the house look, keep the layout.
//
// COSMETIC: `makeCard` returns a pure-view node (`cosmetic = true`) — a card is a
// render of game state, never canonical state, so it stays out of `world.hash()`.

import { Node } from '../scene/node';
import { Sprite, Text } from '../scene/nodes';
import { REGALIA } from './palette';
import { measureVectorText, wrapVectorText, fitFontSize, OVERPASS_600, type FontMetric } from './fontMetrics';
import { resourceGlyph, DEFAULT_GLYPHS, type GlyphSet, type GlyphDraw } from './cardGlyphs';

// ── Theme: which colour plays which role ─────────────────────────────
/** Maps the card's structural parts and resource roles to concrete colours. */
export interface CardTheme {
  /** Card body fill. */ ground: string;
  /** Text + outline ink. */ ink: string;
  /** Secondary text (flavor). */ inkSoft: string;
  /** Hairline dividers. */ line: string;
  /** Effects-panel fill. */ panel: string;
  /** Art-window fill. */ artFill: string;
  /** Default (filled) chip background. */ chipFill: string;
  /** Default chip text. */ chipInk: string;
  /** Card border + chip/art outline. */ outline: string;
  /** Resource role → Regalia hue, used for glyph tint and role-coloured chips. */
  roles: Record<string, string>;
}

const ROLES: Record<string, string> = {
  cash: REGALIA.gold,
  product: REGALIA.green,
  growth: REGALIA.green,
  burn: REGALIA.rose,
  danger: REGALIA.rose,
  tech: REGALIA.blue,
  material: REGALIA.bark,
};

/** Light card on any ground — the default. */
export const CARD_DAY: CardTheme = {
  ground: REGALIA.mist,
  ink: REGALIA.ink,
  inkSoft: REGALIA.soft,
  line: REGALIA.line,
  panel: REGALIA.cloud,
  artFill: REGALIA.cloud,
  chipFill: REGALIA.ink,
  chipInk: REGALIA.paper,
  outline: REGALIA.ink,
  roles: ROLES,
};

/** Raised card on a dark table — the night mirror of the same seven roles. */
export const CARD_NIGHT: CardTheme = {
  ground: REGALIA.night,
  ink: REGALIA.paperInk,
  inkSoft: REGALIA.softInk,
  line: REGALIA.darkLine,
  panel: REGALIA.shade,
  artFill: REGALIA.shade,
  chipFill: REGALIA.paperInk,
  chipInk: REGALIA.night,
  outline: REGALIA.darkLine,
  roles: ROLES,
};

// ── Template: the fixed grid + defaults ──────────────────────────────
/** Every metric the layout obeys. Override any field per card via `spec.template`. */
export interface CardTemplate {
  width: number;
  /** Margin on all four sides. */ gutter: number;
  /** Vertical gap between slots. */ gap: number;
  /** Corner radius of the card body. */ radius: number;
  /** Advance-width table used to measure text (must match `fontFamily`). */ metric: FontMetric;
  /** CSS font-family the `Text` nodes render with. */ fontFamily: string;
  /** Max title size (px); auto-shrinks to fit the content width. */ titleSize: number;
  bodySize: number;
  chipSize: number;
  flavorSize: number;
  /** Line height as a multiple of font size (wrapping + rhythm). */ lineFactor: number;
  chipHeight: number;
  chipPadX: number;
  chipGap: number;
  glyphSize: number;
  /** Gap between effect rows. */ rowGap: number;
  /** Effects-panel inner padding. */ panelPad: number;
  /** Left column reserved for the every-turn trigger + brace. */ triggerW: number;
  strokeW: number;
  theme: CardTheme;
  glyphs: GlyphSet;
}

/** The house default: a 300×auto card, 24px margins, 16px gaps, Regalia + Overpass. */
export const CARD_TEMPLATE: CardTemplate = {
  width: 300,
  gutter: 24,
  gap: 16,
  radius: 18,
  metric: OVERPASS_600,
  fontFamily: OVERPASS_600.family,
  titleSize: 26,
  bodySize: 15,
  chipSize: 14,
  flavorSize: 13,
  lineFactor: 1.32,
  chipHeight: 30,
  chipPadX: 14,
  chipGap: 8,
  glyphSize: 22,
  rowGap: 10,
  panelPad: 14,
  triggerW: 40,
  strokeW: 2.5,
  theme: CARD_DAY,
  glyphs: DEFAULT_GLYPHS,
};

// ── Slots: the composable card anatomy ───────────────────────────────
export type SlotAnchor = 'top' | 'bottom';

/** A pill in a chip row (type ribbon, cost, tag). Sizes to its own text. */
export interface Chip {
  text: string;
  /** Fill from `theme.roles[role]` (e.g. 'cash' → gold). */
  role?: string;
  /** Explicit fill, overrides `role`. */
  fill?: string;
  /** Explicit text colour. */
  textColor?: string;
  /** Outlined (transparent) pill instead of filled — for tags. */
  outline?: boolean;
}

/** One line in an effects slot: an optional glyph, a value, and a label. */
export interface EffectRow {
  /** Glyph name (resolved against the template's `glyphs`) or a draw fn. */
  glyph?: GlyphDraw | string;
  /** Role hue for the glyph. */
  role?: string;
  /** Numbers auto-prefix '+'; strings render verbatim (e.g. '$250K'). */
  value?: string | number;
  label: string;
}

/** What makes the effects fire — shows a ↻ (every turn) or ▸ (on play) + brace. */
export type Trigger = 'everyTurn' | 'onPlay' | 'none';

/** One row in the card's vertical stack. `anchor:'bottom'` pins it to the base. */
export type Slot =
  | { kind: 'chips'; left?: Chip[]; right?: Chip[]; anchor?: SlotAnchor }
  | { kind: 'title'; text: string; anchor?: SlotAnchor }
  | { kind: 'art'; height: number; build: (w: number, h: number) => Node; frame?: boolean; anchor?: SlotAnchor }
  | { kind: 'effects'; rows: EffectRow[]; trigger?: Trigger; anchor?: SlotAnchor }
  | { kind: 'paragraph'; text: string; tone?: 'flavor' | 'body'; anchor?: SlotAnchor }
  | { kind: 'divider'; anchor?: SlotAnchor }
  | { kind: 'spacer'; height?: number; anchor?: SlotAnchor }
  | { kind: 'custom'; height: number; build: (w: number, h: number) => Node; anchor?: SlotAnchor };

/** A card description: an ordered slot list plus optional size + template tweaks. */
export interface CardSpec {
  slots: Slot[];
  width?: number;
  /** Fixed card height. Omit for auto (sum of slots + gutters). */
  height?: number;
  template?: Partial<CardTemplate>;
}

// ── Measured geometry (for tests + tools) ────────────────────────────
export interface SlotBox {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface CardLayout {
  width: number;
  height: number;
  gutter: number;
  gap: number;
  slots: SlotBox[];
}
const LAYOUTS = new WeakMap<Node, CardLayout>();
/** Read back the measured geometry of a card built by `makeCard` (or undefined). */
export function cardLayout(card: Node): CardLayout | undefined {
  return LAYOUTS.get(card);
}

// ── Internals ────────────────────────────────────────────────────────
function resolveTemplate(p?: Partial<CardTemplate>): CardTemplate {
  if (!p) return CARD_TEMPLATE;
  return {
    ...CARD_TEMPLATE,
    ...p,
    fontFamily: p.fontFamily ?? p.metric?.family ?? CARD_TEMPLATE.fontFamily,
    theme: p.theme ?? CARD_TEMPLATE.theme,
    glyphs: p.glyphs ?? CARD_TEMPLATE.glyphs,
  };
}

function cosmetic(name: string): Node {
  const n = new Node({ name });
  n.cosmetic = true;
  return n;
}

/** A vector text label. Renders centered on `y` (the engine baselines text 'middle'). */
function label(t: CardTemplate, x: number, y: number, text: string, size: number, color: string, align: 'left' | 'center' | 'right' = 'left'): Text {
  const node = new Text({ pos: { x, y }, text, size, font: t.fontFamily, weight: t.metric.weight, align, fill: color });
  node.cosmetic = true;
  return node;
}

const measure = (t: CardTemplate, text: string, size: number): number => measureVectorText(t.metric, text, size);

/** A single pill sized to its text; returns the node and its measured width. */
function buildPill(t: CardTemplate, chip: Chip): { node: Node; width: number } {
  const w = Math.ceil(measure(t, chip.text, t.chipSize) + 2 * t.chipPadX);
  const h = t.chipHeight;
  const outlined = chip.outline ?? false;
  const fill = chip.fill ?? (chip.role ? t.theme.roles[chip.role] : t.theme.chipFill);
  const textColor = chip.textColor ?? (outlined ? fill : t.theme.chipInk);
  const node = cosmetic('chip');
  node.addChild(
    new Sprite({
      shape: { kind: 'rect', w, h, r: h / 2, anchor: 'topLeft' },
      fill: outlined ? 'none' : fill,
      stroke: outlined ? fill : t.theme.outline,
      strokeWidth: 2,
    }),
  );
  node.addChild(label(t, w / 2, h / 2, chip.text, t.chipSize, textColor, 'center'));
  return { node, width: w };
}

/** The ↻ / ▸ trigger mark, centered on (cx,cy) in the effects panel. */
function triggerIcon(t: CardTemplate, trigger: Trigger, cx: number, cy: number): Node {
  const n = cosmetic('trigger');
  const ink = t.theme.inkSoft;
  if (trigger === 'onPlay') {
    n.addChild(new Sprite({ pos: { x: cx, y: cy }, shape: { kind: 'poly', points: [-5, -6, 6, 0, -5, 6] }, fill: ink }));
    return n;
  }
  // everyTurn: a ~300° arc (gap at top) + an arrowhead — a refresh loop.
  n.addChild(
    new Sprite({
      pos: { x: cx, y: cy },
      shape: { kind: 'path', d: 'M4 -6.9 A8 8 0 1 1 -4 -6.9' },
      fill: 'none',
      stroke: ink,
      strokeWidth: 2.5,
    }),
  );
  n.addChild(new Sprite({ pos: { x: cx, y: cy }, shape: { kind: 'path', d: 'M4 -6.9 l5 -1 l-1.5 5 z' }, fill: ink }));
  return n;
}

/** A curly brace spanning [yTop,yBot] at x, opening to the right. */
function braceNode(t: CardTemplate, x: number, yTop: number, yBot: number): Node {
  const mid = (yTop + yBot) / 2;
  const d =
    `M${x + 6} ${yTop} Q${x} ${yTop} ${x} ${(yTop + mid) / 2} Q${x} ${mid} ${x - 6} ${mid} ` +
    `Q${x} ${mid} ${x} ${(mid + yBot) / 2} Q${x} ${yBot} ${x + 6} ${yBot}`;
  const n = cosmetic('brace');
  n.addChild(new Sprite({ pos: { x: 0, y: 0 }, shape: { kind: 'path', d }, fill: 'none', stroke: t.theme.ink, strokeWidth: 2 }));
  return n;
}

interface Built {
  node: Node;
  height: number;
  name: string;
}

function buildSlot(t: CardTemplate, CW: number, slot: Slot): Built {
  switch (slot.kind) {
    case 'chips': {
      const node = cosmetic('chips');
      let x = 0;
      for (const c of slot.left ?? []) {
        const { node: p, width } = buildPill(t, c);
        p.pos = { x, y: 0 };
        node.addChild(p);
        x += width + t.chipGap;
      }
      let rx = CW;
      for (const c of (slot.right ?? []).slice().reverse()) {
        const { node: p, width } = buildPill(t, c);
        rx -= width;
        p.pos = { x: rx, y: 0 };
        node.addChild(p);
        rx -= t.chipGap;
      }
      return { node, height: t.chipHeight, name: 'chips' };
    }
    case 'title': {
      const reserved = Math.round(t.titleSize * t.lineFactor);
      const size = fitFontSize(t.metric, slot.text, CW, t.titleSize);
      const node = cosmetic('title');
      node.addChild(label(t, 0, reserved / 2, slot.text, size, t.theme.ink, 'left'));
      return { node, height: reserved, name: 'title' };
    }
    case 'art': {
      const node = cosmetic('art');
      if (slot.frame ?? true) {
        node.addChild(new Sprite({ shape: { kind: 'rect', w: CW, h: slot.height, r: 12, anchor: 'topLeft' }, fill: t.theme.artFill, stroke: t.theme.outline, strokeWidth: 2 }));
      }
      node.addChild(slot.build(CW, slot.height));
      return { node, height: slot.height, name: 'art' };
    }
    case 'effects': {
      const trigger = slot.trigger ?? 'none';
      const rowH = Math.max(t.glyphSize, t.bodySize * t.lineFactor);
      const rowsH = slot.rows.length * rowH + Math.max(0, slot.rows.length - 1) * t.rowGap;
      const panelH = rowsH + 2 * t.panelPad;
      const node = cosmetic('effects');
      node.addChild(new Sprite({ shape: { kind: 'rect', w: CW, h: panelH, r: 12, anchor: 'topLeft' }, fill: t.theme.panel }));
      const leftPad = trigger === 'none' ? t.panelPad : t.triggerW;
      const rowsTop = t.panelPad;
      if (trigger !== 'none') {
        node.addChild(triggerIcon(t, trigger, t.panelPad + 7, rowsTop + rowsH / 2));
        node.addChild(braceNode(t, t.triggerW - 14, rowsTop + 2, rowsTop + rowsH - 2));
      }
      let y = rowsTop;
      for (const r of slot.rows) {
        const cy = y + rowH / 2;
        const hue = r.role ? t.theme.roles[r.role] : t.theme.ink;
        if (r.glyph) {
          const g = resourceGlyph(r.glyph, hue, t.glyphSize, t.glyphs);
          g.pos = { x: leftPad + t.glyphSize / 2, y: cy };
          node.addChild(g);
        }
        const tx = leftPad + (r.glyph ? t.glyphSize + 12 : 0);
        let valStr = '';
        if (r.value !== undefined) valStr = (typeof r.value === 'number' ? (r.value >= 0 ? `+${r.value}` : `${r.value}`) : r.value) + ' ';
        node.addChild(label(t, tx, cy, valStr + r.label, t.bodySize, t.theme.ink, 'left'));
        y += rowH + t.rowGap;
      }
      return { node, height: panelH, name: 'effects' };
    }
    case 'paragraph': {
      const tone = slot.tone ?? 'flavor';
      const size = tone === 'flavor' ? t.flavorSize : t.bodySize;
      const color = tone === 'flavor' ? t.theme.inkSoft : t.theme.ink;
      const lineH = size * t.lineFactor;
      const lines = wrapVectorText(t.metric, slot.text, CW, size);
      const node = cosmetic('paragraph');
      lines.forEach((ln, i) => node.addChild(label(t, 0, i * lineH + lineH / 2, ln, size, color, 'left')));
      return { node, height: Math.ceil(lines.length * lineH), name: 'paragraph' };
    }
    case 'divider': {
      const node = cosmetic('divider');
      node.addChild(new Sprite({ shape: { kind: 'rect', w: CW, h: 2, anchor: 'topLeft' }, fill: t.theme.line }));
      return { node, height: 2, name: 'divider' };
    }
    case 'spacer':
      return { node: cosmetic('spacer'), height: slot.height ?? 0, name: 'spacer' };
    case 'custom': {
      const node = cosmetic('custom');
      node.addChild(slot.build(CW, slot.height));
      return { node, height: slot.height, name: 'custom' };
    }
  }
}

/**
 * Build a card as a cosmetic scene node from a slot list. Layout is a pure
 * function of the spec and the font metric, so the same spec always yields the
 * same geometry (read it back with `cardLayout`). Set `card.pos` to place it;
 * tween/flip it like any node.
 */
export function makeCard(spec: CardSpec): Node {
  const t = resolveTemplate(spec.template);
  const width = spec.width ?? t.width;
  const CW = width - 2 * t.gutter;

  const built = spec.slots.map((slot) => ({ ...buildSlot(t, CW, slot), anchor: slot.anchor ?? ('top' as SlotAnchor) }));
  const totalSlotH = built.reduce((a, b) => a + b.height, 0);
  const autoH = t.gutter * 2 + totalSlotH + Math.max(0, built.length - 1) * t.gap;
  const H = spec.height ?? autoH;

  const root = cosmetic('card');
  root.addChild(new Sprite({ shape: { kind: 'rect', w: width, h: H, r: t.radius, anchor: 'topLeft' }, fill: t.theme.ground, stroke: t.theme.outline, strokeWidth: t.strokeW }));

  const slots: SlotBox[] = [];
  const place = (b: (typeof built)[number], y: number): void => {
    b.node.pos = { x: t.gutter, y };
    root.addChild(b.node);
    slots.push({ name: b.name, x: t.gutter, y, w: CW, h: b.height });
  };

  const top = built.filter((b) => b.anchor === 'top');
  const bottom = built.filter((b) => b.anchor === 'bottom');

  let y = t.gutter;
  for (const b of top) {
    place(b, y);
    y += b.height + t.gap;
  }

  const botBlock = bottom.reduce((a, b) => a + b.height, 0) + Math.max(0, bottom.length - 1) * t.gap;
  let yb = bottom.length ? H - t.gutter - botBlock : H;
  for (const b of bottom) {
    place(b, yb);
    yb += b.height + t.gap;
  }

  LAYOUTS.set(root, { width, height: H, gutter: t.gutter, gap: t.gap, slots });
  return root;
}

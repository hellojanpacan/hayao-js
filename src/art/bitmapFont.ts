// Bitmap/pixel text: glyph atlas → proportional layout → run-merged draw
// commands. Covers what the js13k HUD/dialogue games hand-build: per-char
// widths, word wrap, typewriter reveal (clock-driven, never wall-clock), and
// inline colour markup via a `{tag}…{/}` stack (clawstrike/coup-ahoo style).
//
// COSMETIC / DETERMINISM: text is pure view. Layout is a pure function of
// (font, string, width). Typewriter reveal is a pure function of sim time from
// `world.time`/`clock` — no `performance.now`. `BitmapText` is `cosmetic`.

import { IDENTITY, type Transform } from '../core/math';
import type { DrawCommand, RectCommand, TextAlign } from '../render/commands';
import { Node, type NodeConfig } from '../scene/node';
import { FONT_5, type BitmapFont } from './font5';

/** One source character with an optional colour and its index in the source string. */
export interface RichChar {
  ch: string;
  color?: string;
  i: number;
}

/**
 * Parse inline colour markup into per-character colours. `{name}` pushes a
 * colour, `{/}` pops it (a stack, so nesting works); `{{` is a literal `{`.
 * A tag resolves through `colorMap`, or is used literally if it starts with `#`
 * or is not in the map. Text outside any tag has no colour (caller default).
 */
export function parseRich(markup: string, colorMap: Record<string, string> = {}): RichChar[] {
  const out: RichChar[] = [];
  const stack: string[] = [];
  let i = 0;
  let srcIndex = 0;
  while (i < markup.length) {
    const c = markup[i];
    if (c === '{' && markup[i + 1] === '{') {
      out.push({ ch: '{', color: stack[stack.length - 1], i: srcIndex++ });
      i += 2;
      continue;
    }
    if (c === '{') {
      const end = markup.indexOf('}', i);
      if (end === -1) {
        out.push({ ch: c, color: stack[stack.length - 1], i: srcIndex++ });
        i++;
        continue;
      }
      const tag = markup.slice(i + 1, end);
      if (tag === '/') stack.pop();
      else stack.push(tag[0] === '#' ? tag : (colorMap[tag] ?? tag));
      i = end + 1;
      continue;
    }
    out.push({ ch: c, color: stack[stack.length - 1], i: srcIndex++ });
    i++;
  }
  return out;
}

/** Fold a character to one the font can draw (uppercase; unknown → space or `?`). */
function resolveChar(font: BitmapFont, ch: string): string {
  if (ch === ' ' || ch === '\n') return ch;
  const up = ch.toUpperCase();
  if (font.glyphs[up]) return up;
  if (font.glyphs[ch]) return ch;
  return font.glyphs['?'] ? '?' : ' ';
}

/** Width of a single glyph (advance excludes tracking). */
function glyphWidth(font: BitmapFont, ch: string): number {
  if (ch === ' ') return font.spaceWidth;
  const rows = font.glyphs[ch];
  return rows ? rows[0].length : font.spaceWidth;
}

/** Width in font-pixels of a run of already-resolved chars on one line. */
export function measureLine(font: BitmapFont, chars: readonly RichChar[]): number {
  let w = 0;
  for (let k = 0; k < chars.length; k++) {
    w += glyphWidth(font, chars[k].ch);
    if (k < chars.length - 1) w += font.tracking;
  }
  return w;
}

/** Width in font-pixels of a plain string (no wrapping). */
export function measureText(font: BitmapFont, text: string): number {
  return measureLine(font, [...text].map((ch, i) => ({ ch: resolveChar(font, ch), i })));
}

export interface PlacedGlyph {
  ch: string;
  color?: string;
  /** Source-string index (for typewriter reveal). */
  i: number;
  /** Top-left in font-pixel units. */
  x: number;
  y: number;
  w: number;
}

export interface TextLayout {
  glyphs: PlacedGlyph[];
  /** Bounding size in font-pixel units. */
  width: number;
  height: number;
  lines: number;
}

export interface TextLayoutOptions {
  /** Wrap width in font-pixels. Omit for no wrapping. */
  maxWidth?: number;
  /** Extra blank rows between lines. Default 1. */
  lineSpacing?: number;
  /** Horizontal alignment within `maxWidth` (or the widest line). Default 'left'. */
  align?: TextAlign;
}

/**
 * Lay out text into placed glyphs (font-pixel coords), word-wrapping on spaces
 * and breaking on `\n`. Accepts a plain string or a `RichChar[]` from
 * `parseRich`. Pure and deterministic.
 */
export function layoutText(
  font: BitmapFont,
  input: string | readonly RichChar[],
  options: TextLayoutOptions = {},
): TextLayout {
  const lineSpacing = options.lineSpacing ?? 1;
  const source: RichChar[] =
    typeof input === 'string' ? [...input].map((ch, i) => ({ ch, i })) : input.map((r) => ({ ...r }));

  // Split into hard lines on '\n', then greedily wrap each on spaces.
  const hardLines: RichChar[][] = [[]];
  for (const rc of source) {
    if (rc.ch === '\n') hardLines.push([]);
    else hardLines[hardLines.length - 1].push({ ...rc, ch: resolveChar(font, rc.ch) });
  }

  const rows: RichChar[][] = [];
  for (const line of hardLines) {
    if (options.maxWidth === undefined) {
      rows.push(line);
      continue;
    }
    let current: RichChar[] = [];
    let word: RichChar[] = [];
    const flushWord = () => {
      if (word.length === 0) return;
      const sep = current.length ? font.spaceWidth + font.tracking : 0;
      if (current.length && measureLine(font, current) + sep + measureLine(font, word) > options.maxWidth!) {
        rows.push(current);
        current = [];
      }
      if (current.length) current.push({ ch: ' ', i: -1 });
      current.push(...word);
      word = [];
    };
    for (const rc of line) {
      if (rc.ch === ' ') flushWord();
      else word.push(rc);
    }
    flushWord();
    rows.push(current);
  }

  const glyphs: PlacedGlyph[] = [];
  let maxW = 0;
  for (const row of rows) maxW = Math.max(maxW, measureLine(font, row));
  const boundW = options.maxWidth ?? maxW;

  let y = 0;
  for (const row of rows) {
    const rowW = measureLine(font, row);
    let x = options.align === 'center' ? Math.floor((boundW - rowW) / 2) : options.align === 'right' ? boundW - rowW : 0;
    for (const rc of row) {
      const w = glyphWidth(font, rc.ch);
      if (rc.ch !== ' ') glyphs.push({ ch: rc.ch, color: rc.color, i: rc.i, x, y, w });
      x += w + font.tracking;
    }
    y += font.height + lineSpacing;
  }

  return { glyphs, width: boundW, height: rows.length * (font.height + lineSpacing) - lineSpacing, lines: rows.length };
}

/** Typewriter: how many source characters are revealed after `elapsed` seconds. */
export function typewriterCount(total: number, elapsedSec: number, charsPerSec: number): number {
  if (charsPerSec <= 0) return total;
  const n = Math.floor(elapsedSec * charsPerSec);
  return n < 0 ? 0 : n > total ? total : n;
}

export interface TextDrawOptions {
  /** Font-pixel cell size in design units. Default 2. */
  cell?: number;
  /** Top-left origin in local space. Default 0,0. */
  x?: number;
  y?: number;
  z?: number;
  /** Default fill for glyphs without an inline colour. Default '#000'. */
  color?: string;
  transform?: Transform;
  /** Draw only glyphs whose source index is `< reveal` (typewriter). */
  reveal?: number;
}

/**
 * Project a laid-out text to run-merged `rect` commands — one rect per
 * horizontal span of lit pixels. Pure; the commands belong under a `cosmetic`
 * node.
 */
export function textToCommands(
  font: BitmapFont,
  layout: TextLayout,
  options: TextDrawOptions = {},
): RectCommand[] {
  const cell = options.cell ?? 2;
  const ox = options.x ?? 0;
  const oy = options.y ?? 0;
  const z = options.z ?? 0;
  const transform = options.transform ?? IDENTITY;
  const defColor = options.color ?? '#000';
  const reveal = options.reveal;
  const out: RectCommand[] = [];
  for (const g of layout.glyphs) {
    if (reveal !== undefined && g.i >= reveal) continue;
    const rows = font.glyphs[g.ch];
    if (!rows) continue;
    const fill = g.color ?? defColor;
    for (let ry = 0; ry < rows.length; ry++) {
      const row = rows[ry];
      let cx = 0;
      while (cx < row.length) {
        if (row[cx] !== '#') {
          cx++;
          continue;
        }
        let run = 1;
        while (cx + run < row.length && row[cx + run] === '#') run++;
        out.push({
          kind: 'rect',
          x: ox + (g.x + cx) * cell,
          y: oy + (g.y + ry) * cell,
          w: run * cell,
          h: cell,
          transform,
          z,
          fill,
        });
        cx += run;
      }
    }
  }
  return out;
}

export interface BitmapTextConfig extends NodeConfig {
  text: string;
  font?: BitmapFont;
  cell?: number;
  color?: string;
  /** Resolve `{tag}` markup names to colours. */
  colorMap?: Record<string, string>;
  /** Wrap width in font-pixels. */
  maxWidth?: number;
  lineSpacing?: number;
  align?: TextAlign;
  /** Typewriter speed in chars/sec (clock-driven). Omit to show all at once. */
  charsPerSec?: number;
  /** Center the block on the node origin instead of top-left. Default false. */
  center?: boolean;
}

/**
 * A scene node that renders bitmap text with optional inline colour and a
 * clock-driven typewriter reveal. Pure view → `cosmetic = true` (never hashed).
 */
export class BitmapText extends Node {
  override readonly type = 'BitmapText';
  text: string;
  font: BitmapFont;
  cell: number;
  color: string;
  colorMap: Record<string, string>;
  maxWidth?: number;
  lineSpacing: number;
  align: TextAlign;
  charsPerSec?: number;
  center: boolean;
  private startTime = 0;

  constructor(config: BitmapTextConfig) {
    super(config);
    this.text = config.text;
    this.font = config.font ?? FONT_5;
    this.cell = config.cell ?? 2;
    this.color = config.color ?? '#000';
    this.colorMap = config.colorMap ?? {};
    this.maxWidth = config.maxWidth;
    this.lineSpacing = config.lineSpacing ?? 1;
    this.align = config.align ?? 'left';
    this.charsPerSec = config.charsPerSec;
    this.center = config.center ?? false;
    this.cosmetic = true;
  }

  protected override onReady(): void {
    this.startTime = this.world?.time ?? 0;
  }

  /** Restart the typewriter from the current sim time. */
  restartReveal(): void {
    this.startTime = this.world?.time ?? 0;
  }

  private buildLayout(): TextLayout {
    const chars = parseRich(this.text, this.colorMap);
    return layoutText(this.font, chars, { maxWidth: this.maxWidth, lineSpacing: this.lineSpacing, align: this.align });
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    const layout = this.buildLayout();
    let reveal: number | undefined;
    if (this.charsPerSec !== undefined) {
      const elapsed = (this.world?.time ?? 0) - this.startTime;
      reveal = typewriterCount(this.text.length, elapsed, this.charsPerSec);
    }
    const x = this.center ? -(layout.width * this.cell) / 2 : 0;
    const y = this.center ? -(layout.height * this.cell) / 2 : 0;
    for (const cmd of textToCommands(this.font, layout, {
      cell: this.cell,
      x,
      y,
      z: this.z,
      color: this.color,
      transform: world,
      reveal,
    })) {
      out.push(cmd);
    }
  }
}

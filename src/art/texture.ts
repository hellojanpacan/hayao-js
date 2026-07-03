// Procedural sprite / texture generation — build whole tilesets and sprites
// from code with ~0 asset bytes (the defining js13k art trick). A `PixelBuffer`
// is a tiny indexed bitmap; decoders reconstruct one from a compact encoding
// (packed 2-bit, RLE run pairs, or a 1-bit BigInt/hex bitmap), and the emitter
// projects it to run-merged `rect` draw commands the renderer already speaks.
//
// COSMETIC / DETERMINISM: the pixels here are pure *view* derived from constant
// data (or from `world.rng`, never `Math.random`). The output rects carry no
// canonical state, so `TextureSprite` sets `cosmetic = true` — it never enters
// `world.hash()`/snapshot. Decoding is a pure function of its inputs.

import { IDENTITY, type Transform } from '../core/math';
import type { DrawCommand, RectCommand } from '../render/commands';
import { Node, type NodeConfig } from '../scene/node';

/** A palette entry; `null` (or a missing index) renders transparent. */
export type Swatch = string | null;

/** A small indexed bitmap: `data[y * width + x]` is a palette index. */
export class PixelBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;

  constructor(width: number, height: number, data?: Uint8Array) {
    this.width = width;
    this.height = height;
    this.data = data ?? new Uint8Array(width * height);
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return this.data[y * this.width + x];
  }
  set(x: number, y: number, index: number): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.data[y * this.width + x] = index;
  }

  /** Build from a rows-of-strings grid, mapping each character to an index. */
  static fromRows(rows: readonly string[], charToIndex: Record<string, number>): PixelBuffer {
    const height = rows.length;
    const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
    const buf = new PixelBuffer(width, height);
    for (let y = 0; y < height; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) buf.data[y * width + x] = charToIndex[row[x]] ?? 0;
    }
    return buf;
  }

  /** A copy with every index passed through `lut` (2-bit → palette remap). */
  remap(lut: readonly number[]): PixelBuffer {
    const out = new Uint8Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) out[i] = lut[this.data[i]] ?? 0;
    return new PixelBuffer(this.width, this.height, out);
  }
}

/** Normalize a packed bitmap source (hex string, `0b…`/`0x…`, or bigint) to a BigInt. */
function toBig(source: bigint | string): bigint {
  if (typeof source === 'bigint') return source;
  const s = source.trim();
  if (s.startsWith('0x') || s.startsWith('0b') || s.startsWith('0o')) return BigInt(s);
  return BigInt('0x' + s);
}

/**
 * Decode a 1-bit-per-pixel bitmap packed MSB-first into a BigInt/hex string
 * (the super-castle-style trick). Pixel `i` reads bit `(w*h-1-i)`, so a hex
 * literal reads left-to-right, top-to-bottom. Produces indices 0 or 1.
 */
export function decodeBits(source: bigint | string, width: number, height: number): PixelBuffer {
  const bits = toBig(source);
  const total = width * height;
  const buf = new PixelBuffer(width, height);
  for (let i = 0; i < total; i++) {
    buf.data[i] = Number((bits >> BigInt(total - 1 - i)) & 1n);
  }
  return buf;
}

/**
 * Decode a 2-bit-per-pixel bitmap (indices 0–3) packed MSB-first, matching the
 * dying-dreams "2-bit source → palette LUT" pipeline. Pass the result through
 * `PixelBuffer.remap(lut)` to lift the 2-bit indices into a wider palette.
 */
export function decode2bit(source: bigint | string, width: number, height: number): PixelBuffer {
  const bits = toBig(source);
  const total = width * height;
  const buf = new PixelBuffer(width, height);
  for (let i = 0; i < total; i++) {
    const shift = BigInt((total - 1 - i) * 2);
    buf.data[i] = Number((bits >> shift) & 3n);
  }
  return buf;
}

/**
 * Decode a run-length-encoded index stream (witchcat-style). `runs` is a flat
 * list of `[count, index, count, index, …]` filled row-major. A short encoding
 * for sprites dominated by flat colour.
 */
export function decodeRLE(runs: readonly number[], width: number, height: number): PixelBuffer {
  const buf = new PixelBuffer(width, height);
  let p = 0;
  for (let i = 0; i + 1 < runs.length; i += 2) {
    const count = runs[i];
    const index = runs[i + 1];
    for (let k = 0; k < count && p < buf.data.length; k++) buf.data[p++] = index;
  }
  return buf;
}

/** Encode a PixelBuffer back to RLE run pairs — the inverse of `decodeRLE`. */
export function encodeRLE(buf: PixelBuffer): number[] {
  const runs: number[] = [];
  const d = buf.data;
  for (let i = 0; i < d.length; ) {
    const v = d[i];
    let count = 1;
    while (i + count < d.length && d[i + count] === v) count++;
    runs.push(count, v);
    i += count;
  }
  return runs;
}

export interface PixelDrawOptions {
  /** Size of one pixel cell in design units. Default 1. */
  cell?: number;
  /** Top-left origin in local space. Default 0,0. */
  x?: number;
  y?: number;
  /** Painter z. Default 0. */
  z?: number;
  /** World transform for the emitted commands. Default identity. */
  transform?: Transform;
}

/**
 * Project a PixelBuffer to `rect` draw commands, run-merging horizontal spans
 * of the same colour so a 16×16 sprite is a handful of rects, not 256. Palette
 * entries that are `null`/undefined render transparent (skipped). Pure — the
 * commands carry no state and belong under a `cosmetic` node.
 */
export function pixelsToCommands(
  buf: PixelBuffer,
  palette: readonly Swatch[],
  options: PixelDrawOptions = {},
): RectCommand[] {
  const cell = options.cell ?? 1;
  const ox = options.x ?? 0;
  const oy = options.y ?? 0;
  const z = options.z ?? 0;
  const transform = options.transform ?? IDENTITY;
  const out: RectCommand[] = [];
  for (let y = 0; y < buf.height; y++) {
    let x = 0;
    while (x < buf.width) {
      const idx = buf.get(x, y);
      const fill = palette[idx];
      if (fill == null) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < buf.width && buf.get(x + run, y) === idx) run++;
      out.push({
        kind: 'rect',
        x: ox + x * cell,
        y: oy + y * cell,
        w: run * cell,
        h: cell,
        transform,
        z,
        fill,
      });
      x += run;
    }
  }
  return out;
}

export interface TextureSpriteConfig extends NodeConfig {
  buffer: PixelBuffer;
  palette: readonly Swatch[];
  /** Pixel cell size in design units. Default 1. */
  cell?: number;
  /** Draw centered on the node origin instead of top-left. Default true. */
  center?: boolean;
}

/**
 * A scene node that renders a decoded PixelBuffer. It is pure view over
 * constant art data, so it is `cosmetic = true` by default — excluded from
 * `serialize()`/`hash()`/snapshot. Position/scale it like any other node.
 */
export class TextureSprite extends Node {
  override readonly type = 'TextureSprite';
  buffer: PixelBuffer;
  palette: readonly Swatch[];
  cell: number;
  center: boolean;

  constructor(config: TextureSpriteConfig) {
    super(config);
    this.buffer = config.buffer;
    this.palette = config.palette;
    this.cell = config.cell ?? 1;
    this.center = config.center ?? true;
    this.cosmetic = true;
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    const cell = this.cell;
    const x = this.center ? -(this.buffer.width * cell) / 2 : 0;
    const y = this.center ? -(this.buffer.height * cell) / 2 : 0;
    for (const cmd of pixelsToCommands(this.buffer, this.palette, { cell, x, y, z: this.z, transform: world })) {
      out.push(cmd);
    }
  }
}

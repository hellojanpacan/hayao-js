// 2.5D view nodes. These are pure VIEW sugar built on the same DrawCommand
// vocabulary — no renderer change, no sim state. They collapse the two chores a
// 2.5D game hand-rolls per frame: drawing a raised tile as three shaded faces
// (IsoPrism) and re-deriving painter `z` from a depth axis (DepthSort).

import type { Transform } from '../core/math';
import type { DrawCommand, Paint } from '../render/commands';
import { Node, type NodeConfig } from './node';
import { diamondPoints } from './nodes';

// ── IsoPrism ──────────────────────────────────────────────────────
/**
 * A raised isometric tile = a cube: a top diamond + a front-left and front-right
 * parallelogram. `pos` is the GROUND cell centre (where an elev-0 diamond would
 * sit); the block rises `height` screen-px toward −y. Give it a base `fill` and
 * the two side faces auto-shade (left darkest, right mid) — or override any face
 * with `top` / `left` / `right`. Emits the three faces in back-to-front order so
 * the top always paints over the sides within the prism.
 */
export interface IsoPrismConfig extends NodeConfig {
  /** Footprint diamond width (horizontal diagonal) in screen px. */
  tileW: number;
  /** Footprint diamond height (vertical diagonal) in screen px. */
  tileH: number;
  /** Block height in screen px (0 = a flat tile: only the top diamond). */
  height: number;
  /** Base colour; side faces derive from it unless overridden. */
  fill: string;
  /** Explicit face paints (override the auto-shade). */
  top?: Paint;
  left?: Paint;
  right?: Paint;
  /** Shared stroke for all faces (seams between tiles). */
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

/** Multiply a #rgb / #rrggbb colour's channels by `f` (clamped) for face shading. */
export function shadeHex(hex: string, f: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return hex; // non-hex (named/rgb()) — leave as-is
  const ch = (i: number) => {
    const v = Math.round(Math.min(255, Math.max(0, parseInt(h.slice(i, i + 2), 16) * f)));
    return v.toString(16).padStart(2, '0');
  };
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}

export class IsoPrism extends Node {
  override readonly type = 'IsoPrism';
  tileW: number;
  tileH: number;
  height: number;
  fill: string;
  topPaint?: Paint;
  leftPaint?: Paint;
  rightPaint?: Paint;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;

  constructor(config: IsoPrismConfig) {
    super(config);
    this.tileW = config.tileW;
    this.tileH = config.tileH;
    this.height = config.height;
    this.fill = config.fill;
    this.topPaint = config.top;
    this.leftPaint = config.left;
    this.rightPaint = config.right;
    this.stroke = config.stroke;
    this.strokeWidth = config.strokeWidth;
    this.opacity = config.opacity;
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    const w = this.tileW;
    const h = this.tileH;
    const H = this.height;
    const seam: Paint = { stroke: this.stroke, strokeWidth: this.strokeWidth, opacity: this.opacity };
    const top: Paint = this.topPaint ?? { fill: this.fill };
    const left: Paint = this.leftPaint ?? { fill: shadeHex(this.fill, 0.65) };
    const right: Paint = this.rightPaint ?? { fill: shadeHex(this.fill, 0.85) };
    const base = { transform: world, z: this.z };
    if (H > 0) {
      // Front-left face: ground L→B up to top B'→L'.
      out.push({ kind: 'poly', closed: true, points: [-w / 2, 0, 0, h / 2, 0, h / 2 - H, -w / 2, -H], ...seam, ...left, ...base });
      // Front-right face: ground B→R up to top R'→B'.
      out.push({ kind: 'poly', closed: true, points: [0, h / 2, w / 2, 0, w / 2, -H, 0, h / 2 - H], ...seam, ...right, ...base });
    }
    // Top diamond, raised by H (drawn last so it wins ties within the prism).
    const tp = diamondPoints(w, h).map((v, i) => (i % 2 === 1 ? v - H : v));
    out.push({ kind: 'poly', closed: true, points: tp, ...seam, ...top, ...base });
  }

  protected override serializeProps(): Record<string, unknown> {
    return { tileW: this.tileW, tileH: this.tileH, height: this.height, fill: this.fill };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.tileW === 'number') this.tileW = props.tileW;
    if (typeof props.tileH === 'number') this.tileH = props.tileH;
    if (typeof props.height === 'number') this.height = props.height;
    if (typeof props.fill === 'string') this.fill = props.fill;
  }
}

// ── DepthSort ─────────────────────────────────────────────────────
/**
 * A container that auto-assigns each child's painter `z` from a depth accessor,
 * so overlapping sprites stack correctly without every mover re-setting `z` in
 * its own update. The key is read at DRAW time (positions are final for the
 * frame), integrating these children into the same global z-order as the rest of
 * the scene. Godot's `YSort`, generalised to any axis:
 *   new DepthSort({ key: (n) => n.pos.y })          // top-down overlap
 *   new DepthSort({ key: (n) => n.userDepth })      // iso gx+gy
 * See docs/CONVENTIONS.md §Depth for the z-from-depth convention.
 */
export interface DepthSortConfig extends NodeConfig {
  /** Depth of a child → its `z`. Larger = drawn on top (painter's order). */
  key: (n: Node) => number;
  /** Multiplier applied to the key before it becomes `z` (default 1). */
  depthScale?: number;
}

export class DepthSort extends Node {
  override readonly type = 'DepthSort';
  key: (n: Node) => number;
  depthScale: number;
  /** DepthSort is a pure ordering container — its z assignments are view-only. */
  override cosmetic = true;

  constructor(config: DepthSortConfig) {
    super(config);
    this.key = config.key;
    this.depthScale = config.depthScale ?? 1;
  }

  override collectDraw(out: DrawCommand[], parentWorld?: Transform): void {
    for (const c of this.children) c.z = this.key(c) * this.depthScale;
    super.collectDraw(out, parentWorld);
  }
}

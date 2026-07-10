// Immediate-mode debug drawing — the "just show me the raycast" channel.
// Call debugRect/debugLine/debugCircle/debugText/debugPoint from anywhere in
// update code; the browser driver drains the queue into every rendered frame,
// above ALL game layers. The queue is view-only scratch: it never enters
// world.hash(), snapshots, or the headless proofs — and calls compile away to
// a cheap early-return when debug drawing is disabled.
//
// Coordinates are WORLD space by default (they ride the camera); pass
// `screen: true` for design-space overlay (HUD-like) placement.

import { IDENTITY, type Transform } from '../core/math';
import type { DrawCommand } from '../render/commands';

/** Debug commands paint above everything, including the HUD pass. */
export const LAYER_DEBUG = 2;

interface Pending {
  cmd: DrawCommand;
  screen: boolean;
}

let queue: Pending[] = [];
let enabled = true;

/** Master switch (the debug pane toggles it; release builds can pin it off). */
export function setDebugDraw(on: boolean): void {
  enabled = on;
  if (!on) queue = [];
}

export function debugDrawEnabled(): boolean {
  return enabled;
}

export interface DebugDrawOptions {
  color?: string;
  /** Stroke width / point radius, px. */
  width?: number;
  /** Fill instead of stroke (rect/circle). Default false — outlines read better over art. */
  fill?: boolean;
  /** Design-space overlay instead of world space. */
  screen?: boolean;
}

const push = (cmd: DrawCommand, screen: boolean) => {
  if (enabled) queue.push({ cmd, screen });
};

const paint = (o: DebugDrawOptions) =>
  o.fill ? { fill: o.color ?? '#e01b4c', opacity: 0.55 } : { stroke: o.color ?? '#e01b4c', strokeWidth: o.width ?? 2, opacity: 0.9 };

export function debugRect(x: number, y: number, w: number, h: number, opts: DebugDrawOptions = {}): void {
  push({ kind: 'rect', x, y, w, h, transform: IDENTITY, z: 0, layer: LAYER_DEBUG, ...paint(opts) }, opts.screen ?? false);
}

export function debugCircle(cx: number, cy: number, radius: number, opts: DebugDrawOptions = {}): void {
  push({ kind: 'circle', cx, cy, radius, transform: IDENTITY, z: 0, layer: LAYER_DEBUG, ...paint(opts) }, opts.screen ?? false);
}

export function debugLine(x0: number, y0: number, x1: number, y1: number, opts: DebugDrawOptions = {}): void {
  push(
    { kind: 'poly', points: [x0, y0, x1, y1], closed: false, transform: IDENTITY, z: 0, layer: LAYER_DEBUG, stroke: opts.color ?? '#e01b4c', strokeWidth: opts.width ?? 2, opacity: 0.9 },
    opts.screen ?? false,
  );
}

export function debugPoint(x: number, y: number, opts: DebugDrawOptions = {}): void {
  push({ kind: 'circle', cx: x, cy: y, radius: opts.width ?? 3, transform: IDENTITY, z: 0, layer: LAYER_DEBUG, fill: opts.color ?? '#e01b4c', opacity: 0.9 }, opts.screen ?? false);
}

export function debugText(text: string, x: number, y: number, opts: DebugDrawOptions & { size?: number } = {}): void {
  push(
    { kind: 'text', text, x, y, size: opts.size ?? 12, font: 'monospace', transform: IDENTITY, z: 1, layer: LAYER_DEBUG, fill: opts.color ?? '#e01b4c' },
    opts.screen ?? false,
  );
}

/** Queued command count (tests / the pane's readout). */
export function debugDrawCount(): number {
  return queue.length;
}

/**
 * Drain the queue into renderable commands: world-space entries get the view
 * transform, screen-space entries stay in design space. The browser driver
 * calls this once per rendered frame and appends the result after the game's
 * own display list.
 */
export function drainDebugCommands(view: Transform = IDENTITY): DrawCommand[] {
  if (queue.length === 0) return [];
  const out = queue.map(({ cmd, screen }) => (screen ? cmd : { ...cmd, transform: view }));
  queue = [];
  return out;
}

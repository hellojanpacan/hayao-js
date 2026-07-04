// Concrete node types built on Node. Code-as-art: a Sprite is a vector shape or
// glyph, never a bitmap. Text is a DOM-quality label. Camera2D drives the view.
// Timer is a deterministic countdown that emits a signal.

import type { Transform } from '../core/math';
import type { DrawCommand, Paint, TextAlign } from '../render/commands';
import { Node, type NodeConfig, type WorldContext } from './node';

// ── Sprite ────────────────────────────────────────────────────────
export type Shape =
  | { kind: 'rect'; w: number; h: number; r?: number }
  | { kind: 'circle'; radius: number }
  | { kind: 'poly'; points: number[]; closed?: boolean }
  | { kind: 'path'; d: string }
  | { kind: 'glyph'; char: string; size: number };

export interface SpriteConfig extends NodeConfig, Paint {
  shape: Shape;
}

export class Sprite extends Node {
  override readonly type = 'Sprite';
  shape: Shape;
  paint: Paint;

  constructor(config: SpriteConfig) {
    super(config);
    this.shape = config.shape;
    this.paint = {
      fill: config.fill,
      stroke: config.stroke,
      strokeWidth: config.strokeWidth,
      opacity: config.opacity,
      round: config.round,
      gradient: config.gradient,
      shadow: config.shadow,
    };
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    const p = this.paint;
    const base = { transform: world, z: this.z, ...p };
    switch (this.shape.kind) {
      case 'rect':
        out.push({ kind: 'rect', x: -this.shape.w / 2, y: -this.shape.h / 2, w: this.shape.w, h: this.shape.h, r: this.shape.r, ...base });
        break;
      case 'circle':
        out.push({ kind: 'circle', cx: 0, cy: 0, radius: this.shape.radius, ...base });
        break;
      case 'poly':
        out.push({ kind: 'poly', points: this.shape.points, closed: this.shape.closed ?? true, ...base });
        break;
      case 'path':
        out.push({ kind: 'path', d: this.shape.d, ...base });
        break;
      case 'glyph':
        out.push({ kind: 'text', text: this.shape.char, x: 0, y: 0, size: this.shape.size, align: 'center', ...base });
        break;
    }
  }

  protected override serializeProps(): Record<string, unknown> {
    return { shape: this.shape, paint: this.paint };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (props.shape) this.shape = props.shape as Shape;
    if (props.paint) this.paint = props.paint as Paint;
  }
}

// ── Text ──────────────────────────────────────────────────────────
export interface TextConfig extends NodeConfig, Paint {
  text: string;
  size?: number;
  font?: string;
  align?: TextAlign;
  weight?: number;
}

export class Text extends Node {
  override readonly type = 'Text';
  text: string;
  size: number;
  font?: string;
  align: TextAlign;
  weight?: number;
  paint: Paint;

  constructor(config: TextConfig) {
    super(config);
    this.text = config.text;
    this.size = config.size ?? 24;
    this.font = config.font;
    this.align = config.align ?? 'left';
    this.weight = config.weight;
    this.paint = { fill: config.fill ?? '#000', stroke: config.stroke, strokeWidth: config.strokeWidth, opacity: config.opacity };
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    out.push({
      kind: 'text', text: this.text, x: 0, y: 0, size: this.size, font: this.font,
      align: this.align, weight: this.weight, transform: world, z: this.z, ...this.paint,
    });
  }

  protected override serializeProps(): Record<string, unknown> {
    return { text: this.text, size: this.size, align: this.align, paint: this.paint };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.text === 'string') this.text = props.text;
    if (typeof props.size === 'number') this.size = props.size;
    if (props.align) this.align = props.align as TextAlign;
    if (props.paint) this.paint = props.paint as Paint;
  }
}

// ── Camera2D ──────────────────────────────────────────────────────
export interface CameraConfig extends NodeConfig {
  zoom?: number;
  /** Make this the active camera on ready. */
  current?: boolean;
}

export class Camera2D extends Node {
  override readonly type = 'Camera2D';
  zoom: number;
  current: boolean;

  constructor(config: CameraConfig = {}) {
    super(config);
    this.zoom = config.zoom ?? 1;
    this.current = config.current ?? true;
  }

  protected override onReady(): void {
    if (this.current) (this.world as WorldContext & { activeCamera?: Camera2D }).activeCamera = this;
  }

  protected override serializeProps(): Record<string, unknown> {
    return { zoom: this.zoom, current: this.current };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.zoom === 'number') this.zoom = props.zoom;
    if (typeof props.current === 'boolean') this.current = props.current;
  }
}

// ── Timer ─────────────────────────────────────────────────────────
export interface TimerConfig extends NodeConfig {
  duration: number; // seconds
  autostart?: boolean;
  oneShot?: boolean;
}

export class Timer extends Node {
  override readonly type = 'Timer';
  duration: number;
  oneShot: boolean;
  private remaining: number;
  private running: boolean;

  constructor(config: TimerConfig) {
    super(config);
    this.duration = config.duration;
    this.oneShot = config.oneShot ?? true;
    this.remaining = config.duration;
    this.running = config.autostart ?? true;
  }

  start(duration?: number): void {
    if (duration !== undefined) this.duration = duration;
    this.remaining = this.duration;
    this.running = true;
  }
  stop(): void {
    this.running = false;
  }

  get timeLeft(): number {
    return this.remaining;
  }

  protected override onProcess(dt: number): void {
    if (!this.running) return;
    this.remaining -= dt;
    if (this.remaining <= 0) {
      this.emit('timeout', undefined);
      if (this.oneShot) this.running = false;
      else this.remaining += this.duration;
    }
  }

  /** Signal emitted when the countdown reaches zero. */
  get timeout() {
    return this.signal('timeout');
  }

  protected override serializeProps(): Record<string, unknown> {
    return { duration: this.duration, oneShot: this.oneShot, remaining: this.remaining, running: this.running };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.duration === 'number') this.duration = props.duration;
    if (typeof props.oneShot === 'boolean') this.oneShot = props.oneShot;
    if (typeof props.remaining === 'number') this.remaining = props.remaining;
    if (typeof props.running === 'boolean') this.running = props.running;
  }
}

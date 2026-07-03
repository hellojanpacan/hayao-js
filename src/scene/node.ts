// The scene node: a Godot-style tree element with a transform, lifecycle,
// children, local signals, and attachable behaviors. Updates run in fixed tree
// order (depth-first, child-index order) which keeps the whole tree deterministic.

import type { Rng } from '../core/rng';
import type { Clock } from '../core/clock';
import { Signal } from '../core/events';
import {
  IDENTITY,
  composeTransform,
  makeTransform,
  type Transform,
  type Vec2,
} from '../core/math';
import type { DrawCommand } from '../render/commands';

/** What a live node can see of its host world. The World implements this. */
export interface WorldContext {
  readonly rng: Rng;
  readonly clock: Clock;
  /** Queue a node to be freed at the end of the current step (safe during iteration). */
  requestFree(node: Node): void;
  /** Seconds elapsed in sim time. */
  readonly time: number;
}

/** A composable update unit attached to a node (favour over deep inheritance). */
export interface Behavior {
  ready?(node: Node): void;
  update?(node: Node, dt: number): void;
  exit?(node: Node): void;
  /** Optional tag for lookup/serialization. */
  readonly kind?: string;
}

let __idCounter = 0;
/** Deterministic id source — reset by the World on load so ids are reproducible. */
export function resetNodeIds(start = 0): void {
  __idCounter = start;
}

export interface NodeConfig {
  name?: string;
  pos?: Vec2;
  rotation?: number;
  scale?: Vec2;
  z?: number;
  visible?: boolean;
}

export class Node {
  readonly id: string;
  name: string;
  /** Type tag for serialization; subclasses override. */
  readonly type: string = 'Node';

  pos: Vec2;
  rotation: number;
  scale: Vec2;
  z: number;
  visible: boolean;

  parent: Node | null = null;
  readonly children: Node[] = [];
  world: WorldContext | null = null;

  /** Optional inline update without subclassing: node.onUpdate = (n, dt) => {…}. */
  onUpdate?: (node: this, dt: number) => void;

  private behaviors: Behavior[] = [];
  private signals = new Map<string, Signal<unknown>>();
  private _ready = false;
  private _freed = false;

  constructor(config: NodeConfig = {}) {
    this.id = `n${__idCounter++}`;
    this.name = config.name ?? this.constructor.name;
    this.pos = config.pos ? { ...config.pos } : { x: 0, y: 0 };
    this.rotation = config.rotation ?? 0;
    this.scale = config.scale ? { ...config.scale } : { x: 1, y: 1 };
    this.z = config.z ?? 0;
    this.visible = config.visible ?? true;
  }

  // ── Tree structure ─────────────────────────────────────────────
  addChild<T extends Node>(child: T): T {
    child.parent = this;
    this.children.push(child);
    if (this.world && this._ready) child.enterTree(this.world);
    return child;
  }

  removeChild(child: Node): void {
    const i = this.children.indexOf(child);
    if (i >= 0) {
      this.children.splice(i, 1);
      child.parent = null;
    }
  }

  /** Deferred free: runs exit hooks and detaches at the end of the step. */
  free(): void {
    this.world?.requestFree(this);
  }

  /** Depth-first find by name. */
  find(name: string): Node | null {
    if (this.name === name) return this;
    for (const c of this.children) {
      const r = c.find(name);
      if (r) return r;
    }
    return null;
  }

  /** All descendants (and self) of a given type tag. */
  query(type: string, out: Node[] = []): Node[] {
    if (this.type === type) out.push(this);
    for (const c of this.children) c.query(type, out);
    return out;
  }

  // ── Behaviors ─────────────────────────────────────────────────
  addBehavior(b: Behavior): this {
    this.behaviors.push(b);
    if (this._ready) b.ready?.(this);
    return this;
  }

  // ── Signals ───────────────────────────────────────────────────
  signal<T = void>(name: string): Signal<T> {
    let s = this.signals.get(name);
    if (!s) {
      s = new Signal<unknown>();
      this.signals.set(name, s);
    }
    return s as unknown as Signal<T>;
  }
  emit<T>(name: string, payload: T): void {
    this.signals.get(name)?.emit(payload);
  }

  // ── Lifecycle (engine-called) ─────────────────────────────────
  enterTree(world: WorldContext): void {
    this.world = world;
    if (!this._ready) {
      this._ready = true;
      this.onReady();
      for (const b of this.behaviors) b.ready?.(this);
    }
    for (const c of this.children) c.enterTree(world);
  }

  updateTree(dt: number): void {
    if (this._freed) return;
    for (const b of this.behaviors) b.update?.(this, dt);
    this.onUpdate?.(this, dt);
    this.onProcess(dt);
    // Copy children so structural changes during update are safe.
    for (const c of this.children.slice()) c.updateTree(dt);
  }

  exitTree(): void {
    for (const b of this.behaviors) b.exit?.(this);
    this.onExit();
    for (const c of this.children.slice()) c.exitTree();
    this._freed = true;
  }

  get isFreed(): boolean {
    return this._freed;
  }

  // ── Transforms ────────────────────────────────────────────────
  localTransform(): Transform {
    return makeTransform(this.pos, this.rotation, this.scale);
  }

  worldTransform(): Transform {
    const local = this.localTransform();
    return this.parent ? composeTransform(this.parent.worldTransform(), local) : local;
  }

  // ── Rendering (projection) ────────────────────────────────────
  /** Walk the subtree, appending draw commands with computed world transforms. */
  collectDraw(out: DrawCommand[], parentWorld: Transform = IDENTITY): void {
    if (!this.visible) return;
    const world = composeTransform(parentWorld, this.localTransform());
    this.draw(out, world);
    for (const c of this.children) c.collectDraw(out, world);
  }

  /** Subclasses emit their own commands here. Base draws nothing. */
  protected draw(_out: DrawCommand[], _world: Transform): void {}

  // ── Overridable hooks ─────────────────────────────────────────
  protected onReady(): void {}
  protected onProcess(_dt: number): void {}
  protected onExit(): void {}

  // ── Serialization (data only; behaviors/closures are re-attached by scene code) ──
  serialize(): SerializedNode {
    return {
      type: this.type,
      name: this.name,
      pos: { ...this.pos },
      rotation: this.rotation,
      scale: { ...this.scale },
      z: this.z,
      visible: this.visible,
      props: this.serializeProps(),
      children: this.children.map((c) => c.serialize()),
    };
  }
  /** Subclasses persist their own fields here. */
  protected serializeProps(): Record<string, unknown> {
    return {};
  }
  /** Subclasses restore their own fields here. */
  applyProps(_props: Record<string, unknown>): void {}
}

export interface SerializedNode {
  type: string;
  name: string;
  pos: Vec2;
  rotation: number;
  scale: Vec2;
  z: number;
  visible: boolean;
  props: Record<string, unknown>;
  children: SerializedNode[];
}

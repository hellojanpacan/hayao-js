// The scene node: a Godot-style tree element with a transform, lifecycle,
// children, local signals, and attachable behaviors. Updates run in fixed tree
// order (depth-first, child-index order) which keeps the whole tree deterministic.

import type { Rng } from '../core/rng';
import type { Clock } from '../core/clock';
import type { InputState } from '../input/actions';
import { Signal, type EventBus } from '../core/events';
import {
  IDENTITY,
  composeTransform,
  makeTransform,
  type Transform,
  type Vec2,
} from '../core/math';
import type { DrawCommand } from '../render/commands';

/**
 * What a live node can see of its host world. The World implements this — it is
 * exactly the read-only context handed to update callbacks, so a behaviour can
 * reach input/rng/clock/time WITHOUT closing over the `world` from build(). That
 * closure-free property is what lets a node be lifted out and reused verbatim.
 */
export interface WorldContext {
  readonly rng: Rng;
  readonly clock: Clock;
  /** Sampled input for this step — `ctx.input.isDown('jump')`, `ctx.input.axis('pointer.x')`. */
  readonly input: InputState;
  /** Queue a node to be freed at the end of the current step (safe during iteration). */
  requestFree(node: Node): void;
  /** Seconds elapsed in sim time. */
  readonly time: number;
  /**
   * Canonical out-of-tree game state (hashed + snapshotted) — the same object
   * as `world.state`, so behaviours read/write shared sim data without closing
   * over the world or stashing it in module variables.
   */
  readonly state: Record<string, unknown>;
  /** The world event bus — emit/subscribe without a `world` closure. */
  readonly events: EventBus<Record<string, unknown>>;
  /** Design-space dimensions (what the camera letterboxes to). */
  readonly width: number;
  readonly height: number;
  /** True while the world is paused (only `pauseMode: 'always'` subtrees update). */
  readonly paused: boolean;
  /** Sim-time multiplier (1 = realtime); `'always'` subtrees receive unscaled dt. */
  readonly timeScale: number;
  /**
   * The active camera's world position + zoom, or null when none is current.
   * Structural (no Camera2D import needed) — enough for parallax, culling, and
   * screen-edge logic without a sibling search through the tree.
   */
  camera(): { pos: { x: number; y: number }; zoom: number } | null;
}

/** A composable update unit attached to a node (favour over deep inheritance). */
export interface Behavior {
  ready?(node: Node): void;
  /** `ctx` is the host world (input/rng/clock/time) — self-contained, no closure needed. */
  update?(node: Node, dt: number, ctx: WorldContext): void;
  exit?(node: Node): void;
  /** Optional tag for lookup/serialization. */
  readonly kind?: string;
}

/**
 * How a node behaves while the world is paused. `'inherit'` (default) takes the
 * parent's effective mode (the root default is pausable), `'always'` keeps its
 * subtree updating through a pause (pause menus, transitions), `'stopped'`
 * halts its subtree even when the world is running.
 */
export type PauseMode = 'inherit' | 'always' | 'stopped';

/** A resolved pause mode — what 'inherit' collapses to as it flows down the tree. */
type EffectivePauseMode = 'pausable' | 'always' | 'stopped';

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
  /**
   * Cosmetic nodes are pure *view* (derived from game state, rebuildable) and are
   * excluded from serialize()/snapshot()/hash(). Mark a container cosmetic when it
   * only renders state that lives elsewhere — so transient display (move counters,
   * particles, tweened positions) never pollutes the canonical, verifiable state.
   */
  cosmetic = false;
  /**
   * Pause behaviour for this subtree (see PauseMode). Serialized only when
   * non-default, so existing trees keep their pinned hashes.
   */
  pauseMode: PauseMode = 'inherit';
  /**
   * Screen-space overlay: this subtree ignores the camera — its transforms
   * compose from IDENTITY (design-space coordinates) — and every command it
   * emits is tagged `layer: 1` so HUD/overlay content always paints above the
   * world, whatever the z values. Serialized only when true.
   */
  screenSpace = false;
  /**
   * Optional local anchor: when set, rotation/scale pivot around this point in
   * local space instead of the node origin (the local transform gains a
   * trailing translation of −pivot). Serialized only when set.
   */
  pivot?: Vec2;

  parent: Node | null = null;
  readonly children: Node[] = [];
  world: WorldContext | null = null;

  /**
   * Optional inline update without subclassing. The third argument is the host
   * world context (input/rng/clock/time), so the callback is self-contained —
   * `node.onUpdate = (n, dt, ctx) => { if (ctx.input.isDown('jump')) … }`.
   */
  onUpdate?: (node: Node, dt: number, ctx: WorldContext) => void;

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

  // ── Convenience accessors ─────────────────────────────────────
  /** Shorthand for `pos.x` — reads and writes the same vector. */
  get x(): number {
    return this.pos.x;
  }
  set x(v: number) {
    this.pos.x = v;
  }
  /** Shorthand for `pos.y` — reads and writes the same vector. */
  get y(): number {
    return this.pos.y;
  }
  set y(v: number) {
    this.pos.y = v;
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

  /**
   * Immediately exit + detach ALL children. Unlike `free()` this is NOT
   * deferred — the children are gone when the call returns (safe here because
   * it iterates a snapshot of the array). Use it to rebuild a container's
   * contents wholesale; prefer `free()` for removals during an update.
   */
  clearChildren(): void {
    for (const c of this.children.slice()) {
      c.exitTree();
      this.removeChild(c);
    }
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

  /** Depth-first find of the first node (self included) that is an instance of `ctor` — typed. */
  findOfType<T extends Node>(ctor: new (...args: never[]) => T): T | null {
    if (this instanceof ctor) return this as unknown as T;
    for (const c of this.children) {
      const r = c.findOfType(ctor);
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

  /**
   * Advance this subtree. `dt` is the (time-scaled) step delta; `unscaledDt`
   * and `paused` come from the world, and `parentMode` is the effective pause
   * mode flowing down the tree. The walk always descends — a paused node just
   * skips its callbacks — so an `'always'` descendant (pause menu, transition)
   * keeps running inside a paused parent.
   */
  updateTree(dt: number, unscaledDt: number = dt, parentMode: EffectivePauseMode = 'pausable', paused = false): void {
    if (this._freed) return;
    const mode: EffectivePauseMode = this.pauseMode === 'inherit' ? parentMode : this.pauseMode;
    const running = mode === 'always' || (mode === 'pausable' && !paused);
    if (running) {
      const ctx = this.world as WorldContext; // set once in-tree (updateTree runs after enterTree)
      // 'always' subtrees animate through pause AND slow-mo: they get real-step dt.
      const useDt = mode === 'always' ? unscaledDt : dt;
      for (const b of this.behaviors) b.update?.(this, useDt, ctx);
      this.onUpdate?.(this, useDt, ctx);
      this.onProcess(useDt);
    }
    // Copy children so structural changes during update are safe.
    for (const c of this.children.slice()) c.updateTree(dt, unscaledDt, mode, paused);
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
    const t = makeTransform(this.pos, this.rotation, this.scale);
    // Pivot: rotate/scale around a local anchor point instead of the origin.
    return this.pivot ? composeTransform(t, makeTransform({ x: -this.pivot.x, y: -this.pivot.y }, 0, { x: 1, y: 1 })) : t;
  }

  worldTransform(): Transform {
    const local = this.localTransform();
    return this.parent ? composeTransform(this.parent.worldTransform(), local) : local;
  }

  // ── Rendering (projection) ────────────────────────────────────
  /** Walk the subtree, appending draw commands with computed world transforms. */
  collectDraw(out: DrawCommand[], parentWorld: Transform = IDENTITY): void {
    if (!this.visible) return;
    // screenSpace: drop the camera — compose from IDENTITY so coordinates are design-space.
    const world = composeTransform(this.screenSpace ? IDENTITY : parentWorld, this.localTransform());
    const start = out.length;
    this.draw(out, world);
    for (const c of this.children) c.collectDraw(out, world);
    if (this.screenSpace) {
      // Tag the subtree's commands for the overlay pass (unless already higher).
      for (let i = start; i < out.length; i++) {
        const cmd = out[i];
        if ((cmd.layer ?? 0) < 1) cmd.layer = 1;
      }
    }
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
      // New base fields only when non-default, so pinned hashes survive.
      ...(this.pivot ? { pivot: { ...this.pivot } } : {}),
      props: {
        ...this.serializeProps(),
        ...(this.pauseMode !== 'inherit' ? { pauseMode: this.pauseMode } : {}),
        ...(this.screenSpace ? { screenSpace: true } : {}),
      },
      children: this.children.filter((c) => !c.cosmetic).map((c) => c.serialize()),
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
  /** Local rotation/scale anchor (absent when unset). */
  pivot?: Vec2;
  props: Record<string, unknown>;
  children: SerializedNode[];
}

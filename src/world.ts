// The World: the deterministic simulation container. Owns the root scene, the
// rng, the clock, the input state, an event bus, and a resource table. Advancing
// the world is `step()` — a pure function of (previous state, input frame).

import { Clock, type ClockConfig } from './core/clock';
import { EventBus } from './core/events';
import { hashValue } from './core/hash';
import { Rng } from './core/rng';
import { InputState } from './input/actions';
import { Node, resetNodeIds, type WorldContext } from './scene/node';
import { deserializeNode } from './scene/registry';
import type { Camera2D } from './scene/nodes';
import { IDENTITY, applyTransform, composeTransform, invertTransform, makeTransform, type Transform, type Vec2 } from './core/math';
import type { DrawCommand } from './render/commands';

export interface WorldConfig {
  seed?: number;
  clock?: ClockConfig;
  /** Design-space dimensions (default 1280×720). */
  width?: number;
  height?: number;
}

/** Default engine event map; games extend it with their own keys. */
export interface CoreEvents {
  [key: string]: unknown;
}

export class World implements WorldContext {
  readonly rng: Rng;
  readonly clock: Clock;
  readonly input = new InputState();
  readonly events = new EventBus<CoreEvents>();
  readonly resources = new Map<string, unknown>();
  /**
   * Canonical game state that lives OUTSIDE the scene tree (pure-sim structs,
   * controllers). Must be plain JSON-serializable data: it is included in
   * `hash()` and `snapshot()`, so hidden state here cannot escape determinism
   * checks the way ad-hoc module variables can.
   */
  state: Record<string, unknown> = {};
  readonly width: number;
  readonly height: number;

  root: Node;
  activeCamera: Camera2D | null = null;

  private seed: number;
  private freeQueue: Node[] = [];
  private started = false;

  constructor(config: WorldConfig = {}) {
    this.seed = config.seed ?? 1;
    this.rng = new Rng(this.seed);
    this.clock = new Clock(config.clock);
    this.width = config.width ?? 1280;
    this.height = config.height ?? 720;
    this.root = new Node({ name: 'root' });
  }

  get time(): number {
    return this.clock.simTimeSec;
  }
  get frame(): number {
    return this.clock.frame;
  }

  /** Replace the scene root, entering the tree. */
  setRoot(node: Node): void {
    if (this.root) this.root.exitTree();
    this.root = node;
    this.started = false;
  }

  requestFree(node: Node): void {
    this.freeQueue.push(node);
  }

  private ensureStarted(): void {
    if (!this.started) {
      this.root.enterTree(this);
      this.started = true;
    }
  }

  /**
   * Advance exactly one fixed step with the given actions held down.
   * This is THE deterministic transition — call it from Node or the browser loop.
   */
  step(actionsDown: Iterable<string> = []): void {
    this.ensureStarted();
    this.input.beginFrame(actionsDown);
    this.root.updateTree(this.clock.dt);
    this.flushFree();
    this.clock.tick();
  }

  /**
   * Feed REAL elapsed ms; runs 0+ fixed steps. Returns steps run. This is the
   * realtime driver entry point — it CLAMPS realMs to the clock's maxFrameMs
   * (default 250) to avoid a spiral of death, so `advance(1200)` runs ~15 steps,
   * not 72. For headless tests/harnesses that want to fast-forward an exact
   * number of steps, use `runSteps(n)` or `step()` — never `advance` with a big ms.
   */
  advance(realMs: number, actionsDown: Iterable<string> = []): number {
    const steps = this.clock.advance(realMs);
    for (let i = 0; i < steps; i++) this.step(actionsDown);
    return steps;
  }

  /**
   * Run exactly `n` fixed steps — the deterministic fast-forward for tests and
   * headless drivers (unlike `advance`, no realtime clamp). Pass `actionsFor(i)`
   * to script the input per step; omit it to hold nothing down.
   */
  runSteps(n: number, actionsFor?: (i: number) => Iterable<string>): void {
    for (let i = 0; i < n; i++) this.step(actionsFor ? actionsFor(i) : []);
  }

  private flushFree(): void {
    if (this.freeQueue.length === 0) return;
    const q = this.freeQueue;
    this.freeQueue = [];
    for (const node of q) {
      node.exitTree();
      node.parent?.removeChild(node);
      if (this.activeCamera === node) this.activeCamera = null;
    }
  }

  // ── Rendering ────────────────────────────────────────────────
  /** The view transform (inverse of the active camera), mapping world → screen. */
  viewTransform(): Transform {
    if (!this.activeCamera) return IDENTITY;
    const cam = this.activeCamera;
    // Center the camera in design space, apply zoom, then invert.
    const camWorld = cam.worldTransform();
    const centered = composeTransform(makeTransform({ x: this.width / 2, y: this.height / 2 }, 0, { x: cam.zoom, y: cam.zoom }), invertTransform(camWorld));
    return centered;
  }

  /**
   * Map a world-space point to screen/design space (the forward view transform).
   * With no active camera this is the identity, so world == screen.
   */
  worldToScreen(p: Vec2): Vec2 {
    return applyTransform(this.viewTransform(), p);
  }

  /**
   * Map a screen/design-space point back to world space — the inverse of the
   * view transform. Use this to turn a pointer position (in design units) into
   * a world coordinate under a scrolled/zoomed camera. Keep raw pointer values
   * OUT of the sim: convert at the host edge and feed the result in as a
   * quantized action/axis, or determinism breaks (see docs/CONVENTIONS.md).
   */
  screenToWorld(p: Vec2): Vec2 {
    return applyTransform(invertTransform(this.viewTransform()), p);
  }

  /** Project the whole scene to a display list (already camera-applied). */
  render(): DrawCommand[] {
    this.ensureStarted();
    const out: DrawCommand[] = [];
    this.root.collectDraw(out, this.viewTransform());
    return out;
  }

  // ── Determinism & saves ──────────────────────────────────────
  /** Deterministic structural hash of the whole sim state. */
  hash(): string {
    return hashValue({
      seed: this.seed,
      rng: this.rng.getState(),
      clock: this.clock.getState(),
      input: this.input.getState(),
      state: this.state,
      tree: this.root.serialize(),
    });
  }

  /** Compact snapshot for undo/time-travel and saves. */
  snapshot(): WorldSnapshot {
    return {
      seed: this.seed,
      rng: this.rng.getState(),
      clock: this.clock.getState(),
      input: this.input.getState(),
      state: structuredClone(this.state),
      tree: this.root.serialize(),
    };
  }

  /** Restore a snapshot. Rebuilds the tree from data (behaviors are re-attached by scene code). */
  restore(snap: WorldSnapshot): void {
    this.seed = snap.seed;
    this.rng.setState(snap.rng);
    this.clock.setState(snap.clock);
    this.input.setState(snap.input);
    this.state = structuredClone(snap.state);
    resetNodeIds(1_000_000); // avoid id collisions with the live session
    this.setRoot(deserializeNode(snap.tree));
    this.ensureStarted();
  }

  /** A compact probe snapshot for the verification harness (override-friendly). */
  probe(): Record<string, unknown> {
    return {
      frame: this.frame,
      time: this.time,
      hash: this.hash(),
      nodes: this.root.query('Sprite').length + this.root.query('Text').length,
    };
  }
}

export interface WorldSnapshot {
  seed: number;
  rng: ReturnType<Rng['getState']>;
  clock: ReturnType<Clock['getState']>;
  input: ReturnType<InputState['getState']>;
  state: Record<string, unknown>;
  tree: ReturnType<Node['serialize']>;
}

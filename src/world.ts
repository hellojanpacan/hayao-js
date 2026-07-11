// The World: the deterministic simulation container. Owns the root scene, the
// rng, the clock, the input state, an event bus, and a resource table. Advancing
// the world is `step()` — a pure function of (previous state, input frame).

import { Clock, type ClockConfig } from './core/clock';
import { EventBus } from './core/events';
import { hashValue } from './core/hash';
import { Rng } from './core/rng';
import { InputState, type AxisFrame } from './input/actions';
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
  /** Resolved tuning values (see app/tuning.ts). Sim state: hashed + snapshotted. */
  tuning?: Record<string, number | string>;
  /**
   * Dev guard: during each step(), `Math.random`/`Date.now` are wrapped so a
   * stray call inside the sim warns ONCE (with a stack hint) instead of
   * silently breaking determinism. Never throws; safe to leave on in tests.
   */
  guardDeterminism?: boolean;
}

/** Default engine event map; games extend it with their own keys. */
export interface CoreEvents {
  [key: string]: unknown;
}

export class World<TState extends Record<string, unknown> = Record<string, unknown>> implements WorldContext {
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
  state: TState = {} as TState;
  readonly width: number;
  readonly height: number;
  /**
   * Pause switch. While true, only `pauseMode: 'always'` subtrees update —
   * rendering, input sampling, and the clock keep ticking, so a pause menu
   * (an 'always' subtree) stays live. Sim state: hashed + snapshotted, but
   * only when true, so pinned hashes of unpaused games are unchanged.
   */
  paused = false;
  /**
   * Sim-time multiplier: the tree receives `clock.dt * timeScale` (slow-mo /
   * fast-forward), while `'always'` subtrees get the unscaled dt so UI keeps
   * realtime feel. The clock itself ticks normally. Hashed/snapshotted only
   * when ≠ 1.
   */
  timeScale = 1;

  root: Node;
  activeCamera: Camera2D | null = null;

  private seed: number;
  private freeQueue: Node[] = [];
  private started = false;
  private tuningValues: Record<string, number | string>;
  private guardDeterminism: boolean;
  private warnedClamp = false;
  private warnedNondet = false;

  constructor(config: WorldConfig = {}) {
    this.seed = config.seed ?? 1;
    this.rng = new Rng(this.seed);
    this.clock = new Clock(config.clock);
    this.width = config.width ?? 1280;
    this.height = config.height ?? 720;
    this.tuningValues = { ...(config.tuning ?? {}) };
    this.guardDeterminism = config.guardDeterminism ?? false;
    this.root = new Node({ name: 'root' });
  }

  /**
   * Read a tuning value resolved at world creation (declared default unless
   * overridden). Throws on an undeclared key — a typo here would otherwise
   * silently read `undefined` into the sim.
   */
  tune<T extends number | string = number>(key: string): T {
    const v = this.tuningValues[key];
    if (v === undefined) throw new Error(`tune('${key}'): no such knob declared in the game's tuning spec`);
    return v as T;
  }

  /**
   * Read a shared resource by key. Throws on a missing key (listing what IS
   * available) — a typo here would otherwise silently read `undefined` into
   * the sim, exactly like an undeclared tuning knob.
   */
  resource<T>(key: string): T {
    if (!this.resources.has(key)) {
      const available = [...this.resources.keys()].join(', ') || '(none)';
      throw new Error(`resource('${key}'): not set. Available: ${available}`);
    }
    return this.resources.get(key) as T;
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
  step(actionsDown: Iterable<string> = [], axes?: AxisFrame): void {
    if (typeof actionsDown === 'string' || typeof (actionsDown as Iterable<string>)[Symbol.iterator] !== 'function') {
      throw new TypeError(`step(actionsDown): pass an array/iterable of action names, got ${typeof actionsDown === 'string' ? `the string '${actionsDown}'` : typeof actionsDown}`);
    }
    this.ensureStarted();
    const unguard = this.guardDeterminism ? this.installGuard() : null;
    try {
      this.input.beginFrame(actionsDown, axes);
      // Scaled dt drives the sim; the unscaled dt rides along for 'always' subtrees.
      this.root.updateTree(this.clock.dt * this.timeScale, this.clock.dt, 'pausable', this.paused);
      this.flushFree();
      this.clock.tick();
    } finally {
      unguard?.();
    }
  }

  /**
   * Wrap `Math.random`/`Date.now` for the duration of a step so a stray call
   * inside the sim warns ONCE per world (with a stack hint) — the values still
   * flow through, so nothing breaks mid-frame. Returns the restore function;
   * properly nested re-entry (a world stepped inside another's step) is safe
   * because each install restores exactly what it replaced.
   */
  private installGuard(): () => void {
    const mathObj = globalThis.Math;
    const realRandom = mathObj.random;
    const realNow = globalThis.Date.now;
    const warn = (what: string) => {
      if (this.warnedNondet) return;
      this.warnedNondet = true;
      const stack = new Error().stack?.split('\n').slice(2, 5).join('\n') ?? '';
      console.warn(`hayao: ${what} called during step() — nondeterministic. Use world.rng / ctx.time instead.\n${stack}`);
    };
    // Note: names below omit the call parens so the invariants lint (which
    // greps for literal nondeterministic CALLS) doesn't flag the guard itself.
    mathObj.random = () => {
      warn('Math.random');
      return realRandom.call(mathObj);
    };
    globalThis.Date.now = () => {
      warn('Date.now');
      return realNow.call(globalThis.Date);
    };
    return () => {
      mathObj.random = realRandom;
      globalThis.Date.now = realNow;
    };
  }

  /**
   * Feed REAL elapsed ms; runs 0+ fixed steps. Returns steps run. This is the
   * realtime driver entry point — it CLAMPS realMs to the clock's maxFrameMs
   * (default 250) to avoid a spiral of death, so `advance(1200)` runs ~15 steps,
   * not 72. For headless tests/harnesses that want to fast-forward an exact
   * number of steps, use `runSteps(n)` or `step()` — never `advance` with a big ms.
   */
  advance(realMs: number, actionsDown: Iterable<string> = [], axes?: AxisFrame, opts?: { realtime?: boolean }): number {
    // The warning targets a harness author misusing advance(bigMs) as a
    // fast-forward. A sanctioned realtime driver (runBrowser) legitimately sees
    // big deltas — throttled tab, occluded iframe, GC hitch — so it declares
    // { realtime: true } and gets the clamp silently.
    if (!opts?.realtime && realMs > this.clock.maxFrameMs && !this.warnedClamp) {
      this.warnedClamp = true;
      console.warn(`hayao: advance(${realMs}) exceeds maxFrameMs (${this.clock.maxFrameMs}) and was clamped. In a realtime loop this is expected (throttled/janky frame) — drivers pass { realtime: true }. To fast-forward an exact number of steps in a harness, use runSteps(n).`);
    }
    const steps = this.clock.advance(realMs);
    for (let i = 0; i < steps; i++) this.step(actionsDown, axes);
    return steps;
  }

  /**
   * Run exactly `n` fixed steps — the deterministic fast-forward for tests and
   * headless drivers (unlike `advance`, no realtime clamp). Pass `actionsFor(i)`
   * to script the input per step; omit it to hold nothing down.
   */
  runSteps(n: number, actionsFor?: (i: number) => Iterable<string>, axesFor?: (i: number) => AxisFrame | undefined): void {
    for (let i = 0; i < n; i++) this.step(actionsFor ? actionsFor(i) : [], axesFor?.(i));
  }

  /**
   * Run pending frees NOW instead of at the end of the step. `free()` is
   * deferred (safe during iteration), which means freed nodes survive until
   * the step ends — during a scene swap that lets old nodes contaminate the
   * first frame of the new scene. Pattern: `oldRoot.free(); world.flushFree();
   * buildNewScene()`. Called automatically at the end of every step.
   */
  flushFree(): void {
    if (this.freeQueue.length === 0) return;
    const q = this.freeQueue;
    this.freeQueue = [];
    for (const node of q) {
      node.exitTree();
      node.parent?.removeChild(node);
      if (this.activeCamera === node) this.activeCamera = null;
    }
  }

  // ── Tree inspection ──────────────────────────────────────────
  /** Visit every live node depth-first (root first, child-index order). */
  walk(fn: (node: Node) => void): void {
    const visit = (n: Node): void => {
      fn(n);
      for (const c of n.children) visit(c);
    };
    visit(this.root);
  }

  /** Total live nodes in the tree (root included). */
  get nodeCount(): number {
    let n = 0;
    this.walk(() => n++);
    return n;
  }

  /**
   * One indented line per node — `name (type) [flags] @x,y` — for quick tree
   * audits in a REPL or test failure message.
   */
  debugTree(): string {
    const lines: string[] = [];
    const visit = (n: Node, depth: number): void => {
      const flags: string[] = [];
      if (n.cosmetic) flags.push('cosmetic');
      if (n.screenSpace) flags.push('screenSpace');
      if (n.pauseMode !== 'inherit') flags.push(n.pauseMode);
      if (!n.visible) flags.push('!visible');
      lines.push(`${'  '.repeat(depth)}${n.name} (${n.type})${flags.length > 0 ? ` [${flags.join(' ')}]` : ''} @${n.pos.x},${n.pos.y}`);
      for (const c of n.children) visit(c, depth + 1);
    };
    visit(this.root, 0);
    return lines.join('\n');
  }

  /** The active camera's world position + zoom, or null (see WorldContext.camera). */
  camera(): { pos: { x: number; y: number }; zoom: number } | null {
    if (!this.activeCamera) return null;
    const wt = this.activeCamera.worldTransform();
    return { pos: { x: wt.e, y: wt.f }, zoom: this.activeCamera.zoom };
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
      // Only when declared, so games without tuning keep their pinned hashes.
      ...(Object.keys(this.tuningValues).length > 0 ? { tuning: this.tuningValues } : {}),
      // Same guard: only when non-default, so pre-pause pinned hashes survive.
      ...(this.paused ? { paused: true } : {}),
      ...(this.timeScale !== 1 ? { timeScale: this.timeScale } : {}),
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
      tuning: { ...this.tuningValues },
      // Only when non-default, so pre-pause snapshots stay byte-identical.
      ...(this.paused ? { paused: true } : {}),
      ...(this.timeScale !== 1 ? { timeScale: this.timeScale } : {}),
    };
  }

  /** Restore a snapshot. Rebuilds the tree from data (behaviors are re-attached by scene code). */
  restore(snap: WorldSnapshot): void {
    this.seed = snap.seed;
    this.rng.setState(snap.rng);
    this.clock.setState(snap.clock);
    this.input.setState(snap.input);
    this.state = structuredClone(snap.state) as TState;
    if (snap.tuning) this.tuningValues = { ...snap.tuning };
    this.paused = snap.paused ?? false;
    this.timeScale = snap.timeScale ?? 1;
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
  /** Resolved tuning values (absent in pre-tuning saves). */
  tuning?: Record<string, number | string>;
  /** Pause flag (absent when false — keeps old snapshots byte-identical). */
  paused?: boolean;
  /** Sim-time multiplier (absent when 1). */
  timeScale?: number;
}

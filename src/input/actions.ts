// Input as ACTIONS, not keys. Game logic asks "is 'jump' down?", never "is 'KeyZ'
// down?". Input is sampled once per fixed step, so a run is a pure function of its
// input log — which is what makes replay and scripted playthroughs exact.

/**
 * action name → physical bindings (KeyboardEvent.code strings, or pointer
 * buttons `mouse.left` / `mouse.right` / `mouse.middle`). Readonly on both
 * levels so `as const` maps type-check without casts.
 */
export type InputMap = Readonly<Record<string, readonly string[]>>;

/** Per-frame analog axis values (already quantized). Recorded into the log + hash. */
export type AxisFrame = Record<string, number>;

export class InputState {
  private down = new Set<string>();
  private prev = new Set<string>();
  /**
   * Analog axes (e.g. from pointer or gamepad), sampled per step. By default
   * these are LIVE host samples — NOT hashed or logged (see PointerSource).
   * Axes passed to `beginFrame`'s second argument are the exception: they are
   * *logged* (enter `getState()` → hash, and the input log), so quantized analog
   * aim replays bit-exactly. Both live and logged values read back via `axis()`.
   */
  readonly axes = new Map<string, number>();
  /** The subset of axes that are part of the deterministic log + hash this frame. */
  private logged = new Map<string, number>();
  /**
   * Action names some source has declared it can produce (null until the first
   * declareActions call). Headless worlds with no sources never declare, so
   * they never warn — the typo guard only arms once a host wires real input.
   */
  private declared: Set<string> | null = null;
  /** Unknown names already warned about (warn ONCE per name). */
  private warned = new Set<string>();

  /**
   * Register action names a source (or input map) can produce. The browser
   * driver declares the keyboard map's actions and the pointer's `mouse.*`
   * buttons; custom sources should declare theirs too. Once at least one
   * declaration has happened, querying an undeclared action name via
   * `isDown`/`justPressed`/`justReleased` logs a console.warn ONCE per name —
   * catching `isDown('jmup')` typos that would otherwise fail silently.
   */
  declareActions(names: Iterable<string>): void {
    this.declared ??= new Set();
    for (const n of names) this.declared.add(n);
  }

  /** Warn-once guard for querying an action no source has declared. O(1). */
  private checkDeclared(action: string): void {
    if (this.declared === null || this.declared.has(action) || this.warned.has(action)) return;
    this.warned.add(action);
    console.warn(
      `hayao: input action "${action}" is not declared by any input source — ` +
        `declared actions: ${[...this.declared].sort().join(', ') || '(none)'}`
    );
  }

  /**
   * Engine: set which actions are down this step (from live input or replay).
   * `axes` (optional) are QUANTIZED analog values that become part of the log
   * and hash for this frame — use `snapAxis`/`quantizeAngle` at the host edge so
   * replay and lockstep netplay reproduce analog aim exactly.
   */
  beginFrame(actionsDown: Iterable<string>, axes?: AxisFrame): void {
    this.prev = new Set(this.down);
    this.down = new Set(actionsDown);
    // Any action a frame actually delivers is by definition producible — count
    // it as declared so virtual taps (input.press('fire')) never false-warn.
    // Typos in QUERIES never appear here, so the guard still catches them.
    if (this.declared !== null) for (const a of this.down) this.declared.add(a);
    this.logged.clear();
    if (axes) {
      for (const k in axes) {
        this.logged.set(k, axes[k]);
        this.axes.set(k, axes[k]);
      }
    }
  }

  isDown(action: string): boolean {
    this.checkDeclared(action);
    return this.down.has(action);
  }
  justPressed(action: string): boolean {
    this.checkDeclared(action);
    return this.down.has(action) && !this.prev.has(action);
  }
  justReleased(action: string): boolean {
    this.checkDeclared(action);
    return !this.down.has(action) && this.prev.has(action);
  }
  axis(name: string): number {
    return this.axes.get(name) ?? 0;
  }

  /** The current down-set as a stable sorted array (for recording). */
  snapshot(): string[] {
    return [...this.down].sort();
  }

  getState(): { down: string[]; prev: string[]; axes?: Array<[string, number]> } {
    const s: { down: string[]; prev: string[]; axes?: Array<[string, number]> } = {
      down: [...this.down].sort(),
      prev: [...this.prev].sort(),
    };
    // Only emit axes when present, so games that never use logged axes keep their
    // pinned hashes byte-for-byte.
    if (this.logged.size > 0) s.axes = [...this.logged].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return s;
  }
  setState(s: { down: string[]; prev: string[]; axes?: Array<[string, number]> }): void {
    this.down = new Set(s.down);
    this.prev = new Set(s.prev);
    this.logged.clear();
    if (s.axes) for (const [k, v] of s.axes) {
      this.logged.set(k, v);
      this.axes.set(k, v);
    }
  }
}

/**
 * Quantize an analog value into `buckets` levels across `[min,max]` and return
 * the SNAPPED value (deterministic — same input → same output on every engine).
 * Feed the result through `beginFrame`'s axes so analog input is replay-exact.
 */
export function snapAxis(value: number, buckets: number, min = -1, max = 1): number {
  if (buckets < 2 || max === min) return value;
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const b = Math.round(t * (buckets - 1));
  return min + (b / (buckets - 1)) * (max - min);
}

/** Snap an angle (radians) to the nearest of `buckets` evenly-spaced headings. */
export function quantizeAngle(radians: number, buckets: number): number {
  const step = (Math.PI * 2) / buckets;
  return Math.round(radians / step) * step;
}

/** Map a set of raw key codes to the set of actions they trigger. */
export function keysToActions(map: InputMap, keysDown: Set<string>): string[] {
  const actions: string[] = [];
  for (const action in map) {
    if (map[action].some((k) => keysDown.has(k))) actions.push(action);
  }
  return actions.sort();
}

/** Records the per-frame action-down sets → a compact, replayable input log. */
export class InputRecorder {
  private frames: string[][] = [];
  private axes: Array<AxisFrame | undefined> = [];
  private anyAxes = false;

  record(actionsDown: string[], axes?: AxisFrame): void {
    this.frames.push(actionsDown.slice().sort());
    if (axes && Object.keys(axes).length > 0) {
      this.axes.push({ ...axes });
      this.anyAxes = true;
    } else {
      this.axes.push(undefined);
    }
  }

  get length(): number {
    return this.frames.length;
  }

  toLog(): InputLog {
    const log: InputLog = { frames: this.frames.map((f) => f.slice()) };
    // Only carry the axes track when at least one frame had logged axes.
    if (this.anyAxes) log.axes = this.axes.map((a) => (a ? { ...a } : undefined));
    return log;
  }
}

export interface InputLog {
  frames: string[][];
  /** Optional per-frame quantized analog axes, aligned to `frames` (absent = none). */
  axes?: Array<AxisFrame | undefined>;
}

/** Replays a recorded log: returns the action set for frame index i. */
export function frameActions(log: InputLog, i: number): string[] {
  return log.frames[i] ?? [];
}

/** The logged analog axes for frame index i, or undefined if none were recorded. */
export function frameAxes(log: InputLog, i: number): AxisFrame | undefined {
  return log.axes?.[i];
}

/** A default set of common bindings games can start from. */
export const DEFAULT_INPUT_MAP: InputMap = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Enter', 'Space'],
  cancel: ['Escape', 'Backspace'],
  action: ['KeyZ', 'KeyJ'],
  action2: ['KeyX', 'KeyK'],
  undo: ['KeyU'],
  restart: ['KeyR'],
};

// Input as ACTIONS, not keys. Game logic asks "is 'jump' down?", never "is 'KeyZ'
// down?". Input is sampled once per fixed step, so a run is a pure function of its
// input log — which is what makes replay and scripted playthroughs exact.

/** action name → physical key codes (KeyboardEvent.code strings). */
export type InputMap = Record<string, string[]>;

export class InputState {
  private down = new Set<string>();
  private prev = new Set<string>();
  /** Analog axes (e.g. from gamepad or pointer), sampled per step. */
  readonly axes = new Map<string, number>();

  /** Engine: set which actions are down this step (from live input or replay). */
  beginFrame(actionsDown: Iterable<string>): void {
    this.prev = new Set(this.down);
    this.down = new Set(actionsDown);
  }

  isDown(action: string): boolean {
    return this.down.has(action);
  }
  justPressed(action: string): boolean {
    return this.down.has(action) && !this.prev.has(action);
  }
  justReleased(action: string): boolean {
    return !this.down.has(action) && this.prev.has(action);
  }
  axis(name: string): number {
    return this.axes.get(name) ?? 0;
  }

  /** The current down-set as a stable sorted array (for recording). */
  snapshot(): string[] {
    return [...this.down].sort();
  }

  getState() {
    return { down: [...this.down].sort(), prev: [...this.prev].sort() };
  }
  setState(s: { down: string[]; prev: string[] }): void {
    this.down = new Set(s.down);
    this.prev = new Set(s.prev);
  }
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

  record(actionsDown: string[]): void {
    this.frames.push(actionsDown.slice().sort());
  }

  get length(): number {
    return this.frames.length;
  }

  toLog(): InputLog {
    return { frames: this.frames.map((f) => f.slice()) };
  }
}

export interface InputLog {
  frames: string[][];
}

/** Replays a recorded log: returns the action set for frame index i. */
export function frameActions(log: InputLog, i: number): string[] {
  return log.frames[i] ?? [];
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

// Fixed-timestep clock. Real elapsed milliseconds go in; whole fixed steps come
// out. This is what makes the sim frame-rate independent AND exactly reproducible:
// the same input log always yields the same number of steps.

export interface ClockConfig {
  /** Simulation rate in Hz (steps per second). Default 60. */
  hz?: number;
  /** Max real ms consumed per advance, to avoid a spiral of death. Default 250. */
  maxFrameMs?: number;
}

export class Clock {
  readonly stepMs: number;
  readonly dt: number; // fixed delta in seconds, for game logic
  private maxFrameMs: number;
  private accumulator = 0;
  private _frame = 0;
  private _simTimeMs = 0;

  constructor(config: ClockConfig = {}) {
    const hz = config.hz ?? 60;
    this.stepMs = 1000 / hz;
    this.dt = 1 / hz;
    this.maxFrameMs = config.maxFrameMs ?? 250;
  }

  /**
   * Feed real elapsed ms; returns how many fixed steps to run now.
   * Caller runs the sim exactly that many times.
   */
  advance(realMs: number): number {
    this.accumulator += Math.min(realMs, this.maxFrameMs);
    let steps = 0;
    while (this.accumulator >= this.stepMs) {
      this.accumulator -= this.stepMs;
      steps++;
    }
    return steps;
  }

  /** Called by the World once per executed step to keep counters honest. */
  tick(): void {
    this._frame++;
    this._simTimeMs += this.stepMs;
  }

  /** Interpolation alpha in [0,1) for smooth rendering between fixed steps. */
  get alpha(): number {
    return this.accumulator / this.stepMs;
  }

  get frame(): number {
    return this._frame;
  }
  get simTimeMs(): number {
    return this._simTimeMs;
  }
  get simTimeSec(): number {
    return this._simTimeMs / 1000;
  }

  getState() {
    return { accumulator: this.accumulator, frame: this._frame, simTimeMs: this._simTimeMs };
  }
  setState(s: { accumulator: number; frame: number; simTimeMs: number }): void {
    this.accumulator = s.accumulator;
    this._frame = s.frame;
    this._simTimeMs = s.simTimeMs;
  }
}

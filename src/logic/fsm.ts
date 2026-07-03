// Finite state machines for AI, screens, and move-animation. Two flavours:
//
//   • `Fsm`  — classic onEnter/onUpdate/onLeave states + an ORDERED transition
//     table (first matching guard wins). For enemy brains, UI phases, anything
//     driven by conditions.
//   • `PhaseClock` — the pure-logic↔`cosmetic` bridge. A timed phase with an
//     eased 0→1 progress value and a `next`-phase map (super-castle-game's
//     `IState` + `NextPhaseMap`, generalised): logical moves advance in discrete
//     phases while `progress()` feeds smooth interpolation to the view.
//
// Both are DETERMINISTIC: time arrives as a fixed `dt` (from the `Clock`, never
// wall-clock), transitions are evaluated in array order, and the whole state is
// a single serializable key + timer so it round-trips through `world.state`.

/** Per-state lifecycle hooks. All optional; all pure over the shared context. */
export interface StateHandlers<C> {
  /** Ran once when the machine enters this state. */
  onEnter?(ctx: C): void;
  /** Ran every `update(dt)` while in this state. */
  onUpdate?(ctx: C, dt: number): void;
  /** Ran once when the machine leaves this state. */
  onLeave?(ctx: C): void;
}

/**
 * A guarded edge. `from` is a source state or `'*'` (any). Edges are evaluated
 * in table order every tick; the first whose `when` returns true fires. Keep
 * the table ordered — order IS the tie-break, so the machine stays hash-stable.
 */
export interface Transition<S extends string, C> {
  from: S | '*';
  to: S;
  when(ctx: C): boolean;
}

export class Fsm<S extends string, C> {
  /** The active state key — this is the whole serializable state. */
  current: S;

  constructor(
    private readonly states: Record<S, StateHandlers<C>>,
    private readonly transitions: readonly Transition<S, C>[],
    initial: S,
    private readonly ctx: C,
  ) {
    this.current = initial;
    this.states[initial]?.onEnter?.(ctx);
  }

  /**
   * Advance one fixed step: fire the first satisfied transition (if any), then
   * run the current state's `onUpdate`. A transition runs its target's
   * `onUpdate` this same tick, so entering and acting aren't a frame apart.
   */
  update(dt: number): void {
    for (const t of this.transitions) {
      if ((t.from === '*' || t.from === this.current) && t.when(this.ctx)) {
        this.go(t.to);
        break;
      }
    }
    this.states[this.current]?.onUpdate?.(this.ctx, dt);
  }

  /** Force a transition (fires onLeave/onEnter). No-op if already there. */
  go(to: S): void {
    if (to === this.current) return;
    this.states[this.current]?.onLeave?.(this.ctx);
    this.current = to;
    this.states[to]?.onEnter?.(this.ctx);
  }

  /** True when in one of the given states. */
  is(...states: S[]): boolean {
    return states.includes(this.current);
  }

  /** Serialize (games persist this in `world.state`; the handlers are code). */
  getState(): S {
    return this.current;
  }
  /** Restore without firing enter/leave (it's a resume, not a transition). */
  setState(state: S): void {
    this.current = state;
  }
}

/** Eased progress curve `[0,1] → [0,1]`. Identity by default. */
export type Ease = (t: number) => number;

/** A timed phase: how long it lasts and (optionally) what follows it. */
export interface PhaseDef {
  /** Duration in seconds (same units as the `dt` you feed `update`). */
  duration: number;
  /** Successor phase when this one elapses. Omit for a terminal phase. */
  next?: string;
}

/**
 * A phase with a countdown and an eased progress readout. Drives discrete
 * logical steps (each phase = one settled move) while exposing `progress()` for
 * the view to interpolate between the old and new position — so animation
 * timing rides on the same deterministic clock as the logic.
 */
export class PhaseClock {
  /** Current phase key — serializable with `elapsed`. */
  phase: string;
  /** Seconds spent in the current phase so far. */
  elapsed = 0;

  constructor(
    private readonly defs: Record<string, PhaseDef>,
    initial: string,
  ) {
    if (!defs[initial]) throw new Error(`hayao: PhaseClock has no phase '${initial}'`);
    this.phase = initial;
  }

  private get duration(): number {
    return this.defs[this.phase]?.duration ?? 0;
  }

  /** Eased fraction 0→1 through the current phase (clamped). For cosmetic interp. */
  progress(ease: Ease = (t) => t): number {
    const d = this.duration;
    const raw = d > 0 ? this.elapsed / d : 1;
    return ease(raw < 0 ? 0 : raw > 1 ? 1 : raw);
  }

  /** True once the current phase's duration has fully elapsed. */
  get done(): boolean {
    return this.elapsed >= this.duration;
  }

  /**
   * Advance by `dt`. When a phase completes and has a `next`, roll into it
   * (carrying any overshoot so long phases don't drift). Returns true on the
   * tick a new phase begins — the game's cue to commit the next logical step.
   */
  update(dt: number): boolean {
    this.elapsed += dt;
    let advanced = false;
    // Loop in case a very small duration is stepped over in one big dt.
    let guard = 0;
    while (this.elapsed >= this.duration && this.defs[this.phase]?.next !== undefined && guard++ < 1024) {
      const overshoot = this.elapsed - this.duration;
      this.phase = this.defs[this.phase].next as string;
      this.elapsed = overshoot;
      advanced = true;
    }
    return advanced;
  }

  /** Jump to a phase and reset its timer (fresh `onEnter`-style restart). */
  to(phase: string): void {
    if (!this.defs[phase]) throw new Error(`hayao: PhaseClock has no phase '${phase}'`);
    this.phase = phase;
    this.elapsed = 0;
  }

  getState(): { phase: string; elapsed: number } {
    return { phase: this.phase, elapsed: this.elapsed };
  }
  setState(state: { phase: string; elapsed: number }): void {
    this.phase = state.phase;
    this.elapsed = state.elapsed;
  }
}

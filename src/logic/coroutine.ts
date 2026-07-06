// Deterministic coroutines — sequenced game flow (intros, cutscenes, boss
// phases, tutorials) as plain generators stepped on the fixed clock.
//
// WHY GENERATORS, NOT PROMISES: async/await resolves on the microtask queue,
// whose interleaving with the render loop is engine- and load-dependent — a
// Promise-based `await sleep(1)` lands on a *wall-clock-ish* boundary that two
// runs (or two peers) will disagree on. A generator only advances when
// `Coroutines.step(dt)` says so, so every resume happens at an exact sim step
// and replays land on the same tick, every time.
//
// Usage (an intro flow: wait, then race a prompt against a timeout):
//
//   const co = new Coroutines();
//   co.start(function* () {
//     yield sleep(1.5);                                   // banner hold
//     const winner = yield race(waitFor(() => input.any), sleep(5));
//     if (winner === 0) showTip('nice, you pressed something');
//     yield nextStep();                                   // let the tip render
//   }, 'intro');
//
//   // …and in the game's brain node (Coroutines is engine-agnostic on purpose —
//   // it has no Node/world coupling, so a game owns WHEN it advances):
//   brain.onUpdate = (_n, dt) => co.step(dt);
//
// Semantics (all deterministic, all fixed-step):
// • `step(dt)` advances live runners in insertion order, at most one resume per
//   runner per step; conditions are evaluated at most once per step.
// • A runner's first resume (start → first yield) happens on the first `step()`
//   AFTER `start()` — a coroutine started during `step()` never runs mid-step;
//   it runs first thing on the NEXT step.
// • `yield sleep(s)` resumes on the first step where the accumulated dt reaches
//   `s` (within 1e-9, absorbing float drift on non-exact dt like 1/60).
// • `yield race(...)` resumes with the index of the WINNING wait (ties go to
//   the lowest index); every other yield resumes with 0.
// • Yielding another runner's handle joins it (resumes once that runner is done).
// • An exception inside a generator kills only that runner, with a console.warn
//   naming it (pass a `name` to `start` to get useful blame).

/** Resumes after `seconds` of accumulated sim time. */
export function sleep(seconds: number): Wait {
  return { kind: 'sleep', left: seconds };
}

/** Resumes on the first step where `cond()` is true (checked once per step). */
export function waitFor(cond: () => boolean): Wait {
  return { kind: 'cond', cond };
}

/** Resumes on the next step — yields one frame (e.g. to let a spawn render). */
export function nextStep(): Wait {
  return { kind: 'next' };
}

/**
 * Resumes when ANY of the waits completes; the yield expression evaluates to
 * the winning index (ties resolve to the lowest index — deterministic).
 */
export function race(...waits: Wait[]): Wait {
  return { kind: 'race', waits };
}

/** Resumes when ALL of the waits have completed. */
export function all(...waits: Wait[]): Wait {
  return { kind: 'all', waits };
}

interface SleepWait {
  kind: 'sleep';
  left: number;
}
interface CondWait {
  kind: 'cond';
  cond: () => boolean;
  /** Memo so a satisfied condition is never re-evaluated (inside all()). */
  met?: boolean;
}
interface NextWait {
  kind: 'next';
  passed?: boolean;
}
interface RaceWait {
  kind: 'race';
  waits: Wait[];
}
interface AllWait {
  kind: 'all';
  waits: Wait[];
}

/** What a coroutine may yield. A `CoroutineHandle` yield joins that runner. */
export type Wait = SleepWait | CondWait | NextWait | RaceWait | AllWait | CoroutineHandle;

/** A started coroutine. `done` flips when it returns, throws, or is stopped. */
export interface CoroutineHandle {
  readonly name: string;
  readonly done: boolean;
  /** Kill the runner (its generator's finally blocks run via `return()`). */
  stop(): void;
}

const EPS = 1e-9;

/**
 * Advance a wait by dt. Returns -1 while pending; otherwise the resume value
 * (the winning index for race, 0 for everything else).
 */
function advanceWait(w: Wait, dt: number): number {
  if (isHandle(w)) return w.done ? 0 : -1;
  switch (w.kind) {
    case 'sleep':
      w.left -= dt;
      return w.left <= EPS ? 0 : -1;
    case 'cond':
      if (!w.met && w.cond()) w.met = true;
      return w.met ? 0 : -1;
    case 'next':
      // The first advance IS the next step — completes immediately.
      w.passed = true;
      return 0;
    case 'race': {
      // Advance every arm (each is checked once this step), lowest index wins.
      let winner = -1;
      for (let i = 0; i < w.waits.length; i++) {
        if (advanceWait(w.waits[i], dt) >= 0 && winner < 0) winner = i;
      }
      return winner;
    }
    case 'all': {
      let done = true;
      for (const inner of w.waits) {
        if (!isDone(inner)) {
          if (advanceWait(inner, dt) < 0) done = false;
        }
      }
      return done ? 0 : -1;
    }
  }
}

/** Has this wait already completed? (Used by all() to skip finished arms.) */
function isDone(w: Wait): boolean {
  if (isHandle(w)) return w.done;
  switch (w.kind) {
    case 'sleep':
      return w.left <= EPS;
    case 'cond':
      return w.met === true;
    case 'next':
      return w.passed === true;
    case 'race':
      return w.waits.some(isDone);
    case 'all':
      return w.waits.every(isDone);
  }
}

function isHandle(w: Wait): w is CoroutineHandle {
  return w instanceof Runner;
}

class Runner implements CoroutineHandle {
  readonly name: string;
  done = false;
  /** null until the first resume (which runs the body to its first yield). */
  wait: Wait | null = null;
  private readonly gen: Generator<Wait, void, number>;

  constructor(factory: () => Generator<Wait, void, number>, name: string) {
    this.name = name;
    this.gen = factory();
  }

  /** Resume the generator with a value; a throw kills only this runner. */
  resume(value: number): void {
    try {
      const it = this.gen.next(value);
      if (it.done) this.done = true;
      else this.wait = it.value;
    } catch (err) {
      this.done = true;
      console.warn(`[hayao] coroutine "${this.name}" threw and was stopped:`, err);
    }
  }

  stop(): void {
    if (this.done) return;
    this.done = true;
    try {
      this.gen.return(undefined);
    } catch {
      /* a throw during unwind still counts as stopped */
    }
  }
}

/**
 * A deterministic scheduler for many concurrent coroutines. Owns no clock —
 * call `step(dt)` from wherever your game advances (typically a brain node's
 * `onUpdate`), so coroutine time IS sim time.
 */
export class Coroutines {
  private runners: Runner[] = [];
  /** Started since the last step boundary; adopted at the top of the next step. */
  private pending: Runner[] = [];
  private nextId = 0;

  /**
   * Register a coroutine. Its body runs (up to the first yield) on the NEXT
   * `step()` — never immediately, and never mid-step. Pass a `name` so a
   * thrown generator warns something better than "co3".
   */
  start(gen: () => Generator<Wait, void, number>, name?: string): CoroutineHandle {
    const r = new Runner(gen, name ?? `co${this.nextId}`);
    this.nextId++;
    this.pending.push(r);
    return r;
  }

  /** Advance every live runner by one fixed step, in insertion order. */
  step(dt: number): void {
    // Adopt runners started before this step; ones started DURING this step
    // land in `pending` and are adopted next step (so a mid-step start never
    // advances in the same step it was created).
    if (this.pending.length > 0) {
      this.runners.push(...this.pending);
      this.pending.length = 0;
    }
    for (const r of this.runners) {
      if (r.done) continue;
      if (r.wait === null) {
        r.resume(0); // first resume: run the body to its first yield
        continue;
      }
      const result = advanceWait(r.wait, dt);
      if (result >= 0) {
        r.wait = null;
        r.resume(result);
      }
    }
    // Compact in place (order-preserving) so dead runners don't accumulate.
    let write = 0;
    for (const r of this.runners) if (!r.done) this.runners[write++] = r;
    this.runners.length = write;
  }

  /** Stop every runner (including ones not yet adopted). */
  stopAll(): void {
    for (const r of this.runners) r.stop();
    for (const r of this.pending) r.stop();
    this.runners.length = 0;
    this.pending.length = 0;
  }

  /** Live runner count (started-but-not-yet-stepped ones included). */
  get active(): number {
    let n = 0;
    for (const r of this.runners) if (!r.done) n++;
    for (const r of this.pending) if (!r.done) n++;
    return n;
  }
}

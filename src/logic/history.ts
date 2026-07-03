// Undo / record-replay buffers over pure state. Nearly free given Hayao's
// pure-logic + snapshot model, but worth packaging cleanly:
//   • UndoStack  — a bounded memento (state-clone) stack with redo, for puzzle
//                  undo over an immutable-ish State (dying-dreams clones its
//                  PuzzleState; this is that, with a cursor and a size cap).
//   • RingBuffer — a bounded FIFO for ghost/echo trails (soul-jumper's 8-frame
//                  pose history) — overwrites oldest, O(1) push.
// Both are pure and deterministic; store their contents as plain data so they
// ride along in `world.state` without escaping the hash.

/** Deep clone used by default. structuredClone is available in Node ≥17 & browsers. */
function deepClone<S>(s: S): S {
  return structuredClone(s);
}

/**
 * A memento stack for undo/redo over snapshots of pure state. Call `record()`
 * after every committed move; `undo()`/`redo()` walk the cursor. States are
 * cloned in and out so callers can freely mutate what they get back. Capacity is
 * bounded — the oldest entry is dropped once `limit` is exceeded (undo has a
 * horizon, memory doesn't grow without bound).
 */
export class UndoStack<S> {
  private history: S[] = [];
  private cursor = -1;
  private readonly limit: number;
  private readonly clone: (s: S) => S;

  constructor(opts: { limit?: number; clone?: (s: S) => S } = {}) {
    this.limit = Math.max(1, opts.limit ?? 64);
    this.clone = opts.clone ?? deepClone;
  }

  /** Push a new state as the present, discarding any redo branch ahead of it. */
  record(state: S): void {
    // Drop the redo tail, then append.
    this.history.length = this.cursor + 1;
    this.history.push(this.clone(state));
    this.cursor = this.history.length - 1;
    // Enforce the horizon from the front.
    if (this.history.length > this.limit) {
      const overflow = this.history.length - this.limit;
      this.history.splice(0, overflow);
      this.cursor -= overflow;
    }
  }

  /** Step back one state and return a clone of it (undefined if nothing to undo). */
  undo(): S | undefined {
    if (this.cursor <= 0) return undefined;
    this.cursor--;
    return this.clone(this.history[this.cursor]);
  }

  /** Step forward one state and return a clone of it (undefined if nothing to redo). */
  redo(): S | undefined {
    if (this.cursor >= this.history.length - 1) return undefined;
    this.cursor++;
    return this.clone(this.history[this.cursor]);
  }

  /** A clone of the current state, or undefined if empty. */
  current(): S | undefined {
    return this.cursor >= 0 ? this.clone(this.history[this.cursor]) : undefined;
  }

  get canUndo(): boolean {
    return this.cursor > 0;
  }
  get canRedo(): boolean {
    return this.cursor < this.history.length - 1;
  }
  /** Number of recorded states retained. */
  get size(): number {
    return this.history.length;
  }

  clear(): void {
    this.history.length = 0;
    this.cursor = -1;
  }
}

/**
 * A fixed-capacity ring buffer — the ghost/echo trail. Push a pose (or any value)
 * each frame; when full, the oldest is overwritten. `toArray()` returns
 * oldest→newest, which is exactly the order a trail renderer wants (tail first,
 * head last). Pure and O(1) per push.
 */
export class RingBuffer<T> {
  private readonly buf: (T | undefined)[];
  private start = 0;
  private count = 0;

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('hayao: RingBuffer capacity must be a positive integer');
    this.buf = new Array<T | undefined>(capacity);
  }

  push(item: T): void {
    const end = (this.start + this.count) % this.capacity;
    this.buf[end] = item;
    if (this.count < this.capacity) {
      this.count++;
    } else {
      // Full: the write above overwrote the oldest slot; advance start past it.
      this.start = (this.start + 1) % this.capacity;
    }
  }

  /** Number of items currently held (≤ capacity). */
  get length(): number {
    return this.count;
  }
  get isFull(): boolean {
    return this.count === this.capacity;
  }

  /** Item by age index: 0 = oldest, length-1 = newest. Undefined if out of range. */
  at(i: number): T | undefined {
    if (i < 0 || i >= this.count) return undefined;
    return this.buf[(this.start + i) % this.capacity];
  }

  /** The most recently pushed item, or undefined if empty. */
  latest(): T | undefined {
    return this.at(this.count - 1);
  }

  /** Contents oldest→newest. */
  toArray(): T[] {
    const out: T[] = [];
    for (let i = 0; i < this.count; i++) out.push(this.buf[(this.start + i) % this.capacity]!);
    return out;
  }

  clear(): void {
    this.start = 0;
    this.count = 0;
    this.buf.fill(undefined);
  }
}

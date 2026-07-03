// Synchronous typed signal bus (Godot-style signals). Deterministic: listeners
// fire in connection order, synchronously, within the current step.

export type Listener<T> = (payload: T) => void;

export class Signal<T = void> {
  private listeners: Listener<T>[] = [];

  connect(fn: Listener<T>): () => void {
    this.listeners.push(fn);
    return () => this.disconnect(fn);
  }

  once(fn: Listener<T>): () => void {
    const off = this.connect((p) => {
      off();
      fn(p);
    });
    return off;
  }

  disconnect(fn: Listener<T>): void {
    const i = this.listeners.indexOf(fn);
    if (i >= 0) this.listeners.splice(i, 1);
  }

  emit(payload: T): void {
    // Copy so a listener disconnecting mid-emit doesn't skip its neighbor.
    for (const fn of this.listeners.slice()) fn(payload);
  }

  get count(): number {
    return this.listeners.length;
  }

  clear(): void {
    this.listeners.length = 0;
  }
}

/**
 * A named event bus for cross-cutting game events, keyed by an event map so
 * payloads are typed. Prefer node-local Signals for local wiring; use the bus
 * for global concerns (score changed, level complete, sound cue).
 */
export class EventBus<Events extends Record<string, unknown>> {
  private signals = new Map<keyof Events, Signal<unknown>>();

  private signalFor<K extends keyof Events>(key: K): Signal<Events[K]> {
    let s = this.signals.get(key);
    if (!s) {
      s = new Signal<unknown>();
      this.signals.set(key, s);
    }
    return s as unknown as Signal<Events[K]>;
  }

  on<K extends keyof Events>(key: K, fn: Listener<Events[K]>): () => void {
    return this.signalFor(key).connect(fn);
  }

  once<K extends keyof Events>(key: K, fn: Listener<Events[K]>): () => void {
    return this.signalFor(key).once(fn);
  }

  emit<K extends keyof Events>(key: K, payload: Events[K]): void {
    this.signalFor(key).emit(payload);
  }

  clear(): void {
    this.signals.clear();
  }
}

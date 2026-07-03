// Pluggable persistence backend. The ONLY browser-coupled piece of save/load:
// everything above it (codec, save manager) is pure and headless-stable. In the
// browser you get `localStorage`; headless you get an in-memory map (so tests can
// round-trip a save without touching disk or leaking global state) or a true
// no-op. The sim never imports this directly — it snapshots/restores plain data.

/**
 * A minimal key→string store. Deliberately tiny (get/set/remove/keys) so any
 * backend — `localStorage`, a Map, a file, IndexedDB — satisfies it trivially.
 */
export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /** All keys currently held, in insertion order where the backend preserves it. */
  keys(): string[];
}

/** In-memory backend. Deterministic and self-contained — the headless default. */
export class MemoryStorage implements StorageAdapter {
  private readonly map = new Map<string, string>();

  get(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  set(key: string, value: string): void {
    this.map.set(key, value);
  }
  remove(key: string): void {
    this.map.delete(key);
  }
  keys(): string[] {
    return [...this.map.keys()];
  }
}

/** Swallows everything — reads always miss. For runs that must stay pristine. */
export class NullStorage implements StorageAdapter {
  get(_key: string): string | null {
    return null;
  }
  set(_key: string, _value: string): void {}
  remove(_key: string): void {}
  keys(): string[] {
    return [];
  }
}

/**
 * `localStorage`-backed, guarded on every call: a disabled/absent/full store
 * (private mode, quota, SSR) degrades to a silent miss instead of throwing, so a
 * save failure never crashes a game. Keys are namespaced by `prefix`.
 */
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly prefix = 'hayao.save.') {}

  private ls(): Storage | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
      return null; // access itself can throw when cookies/storage are blocked
    }
  }

  get(key: string): string | null {
    try {
      return this.ls()?.getItem(this.prefix + key) ?? null;
    } catch {
      return null;
    }
  }
  set(key: string, value: string): void {
    try {
      this.ls()?.setItem(this.prefix + key, value);
    } catch {
      /* quota / disabled — a lost save beats a crash */
    }
  }
  remove(key: string): void {
    try {
      this.ls()?.removeItem(this.prefix + key);
    } catch {
      /* ignore */
    }
  }
  keys(): string[] {
    const ls = this.ls();
    if (!ls) return [];
    const out: string[] = [];
    try {
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(this.prefix)) out.push(k.slice(this.prefix.length));
      }
    } catch {
      /* ignore */
    }
    return out;
  }
}

/**
 * The right adapter for the current environment: `localStorage` when a real one
 * is present (browser), otherwise an in-memory map (headless tests/CI). Pass
 * `NullStorage` explicitly when you want reads to always miss.
 */
export function defaultStorage(prefix?: string): StorageAdapter {
  try {
    if (typeof localStorage !== 'undefined') {
      // Feature-probe rather than trust the global: some headless runtimes expose
      // a `localStorage` object whose methods throw. A real write/read/remove is
      // the only honest test; any failure falls through to the in-memory backend.
      const probe = '__hayao_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return new LocalStorageAdapter(prefix);
    }
  } catch {
    /* fall through to memory */
  }
  return new MemoryStorage();
}

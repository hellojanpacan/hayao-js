// Deterministic, seedable, splittable RNG. SplitMix64 for seeding, xoshiro128**
// for the stream — fast, good distribution, trivially reproducible.
// Every random draw in a game MUST flow through here (never Math.random()).

function splitmix32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 16), 0x21f0aaad);
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

export interface RngState {
  s: [number, number, number, number];
}

export class Rng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number | RngState = 0) {
    if (typeof seed === 'number') {
      const sm = splitmix32(seed === 0 ? 0x1234abcd : seed);
      this.s0 = sm();
      this.s1 = sm();
      this.s2 = sm();
      this.s3 = sm();
    } else {
      [this.s0, this.s1, this.s2, this.s3] = seed.s;
    }
  }

  /** Raw 32-bit unsigned integer. */
  private next(): number {
    const result = (Math.imul(this.rotl(Math.imul(this.s1, 5), 7), 9) >>> 0);
    const t = (this.s1 << 9) >>> 0;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 = (this.s2 ^ t) >>> 0;
    this.s3 = this.rotl(this.s3, 11);
    return result >>> 0;
  }

  private rotl(x: number, k: number): number {
    return (((x << k) | (x >>> (32 - k))) >>> 0);
  }

  /** Float in [0, 1). */
  float(): number {
    return this.next() / 4294967296;
  }

  /** Float in [lo, hi). */
  range(lo: number, hi: number): number {
    return lo + this.float() * (hi - lo);
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.float() * n);
  }

  /** Integer in [lo, hi] inclusive. */
  intRange(lo: number, hi: number): number {
    return lo + this.int(hi - lo + 1);
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.float() < p;
  }

  /** Uniform element of an array. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)];
  }

  /** In-place Fisher–Yates shuffle (deterministic). */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Derive an independent child stream. Same parent state + same key always
   * yields the same child — so subsystems (enemy AI, loot, terrain) get stable,
   * decorrelated randomness without threading one generator through everything.
   */
  split(key = 0): Rng {
    const mix = (this.s0 ^ Math.imul(key + 1, 0x9e3779b9)) >>> 0;
    const child = new Rng(mix ^ this.s3);
    // Advance parent so repeated splits differ.
    this.next();
    return child;
  }

  /** Serialize / restore for saves and replay. */
  getState(): RngState {
    return { s: [this.s0, this.s1, this.s2, this.s3] };
  }
  setState(state: RngState): void {
    [this.s0, this.s1, this.s2, this.s3] = state.s;
  }
}

/** Deterministic 32-bit FNV-1a hash of a string — handy for stable ids/seeds. */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Coordinate-hash scatter + value noise — the corpus's actual "procgen texture"
// need (witchcat / cat-survivors do `((x-812347*y)*928371)%17===0`), done right.
//
// Every function here is STATELESS and deterministic: the value at a cell is a
// pure hash of (x, y, seed), so no PRNG stream is threaded and the same world
// coordinate always decorates the same way — across frames, reloads, and peers.
// Output is COSMETIC by intent (decoration placement, dithering, texture): keep
// it out of `world.hash()`. For logical structure use the carving generators
// (cave/terrain/rooms), which run off `world.rng`.

/** 32-bit integer hash of a 2D cell + seed. Well-mixed; avalanche on any bit. */
export function cellHash(x: number, y: number, seed = 0): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (x | 0), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (y | 0), 0xc2b2ae35) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2f) >>> 0;
  h ^= h >>> 15;
  return h >>> 0;
}

/** Deterministic float in [0,1) for a cell — hash normalized. */
export function cellFloat(x: number, y: number, seed = 0): number {
  return cellHash(x, y, seed) / 4294967296;
}

/** Deterministic integer in [0,n) for a cell (e.g. pick a decoration variant). */
export function cellInt(x: number, y: number, n: number, seed = 0): number {
  return Math.floor(cellFloat(x, y, seed) * n);
}

/** True with ~`probability` at this cell — the stateless scatter test. */
export function scatter(x: number, y: number, probability: number, seed = 0): boolean {
  return cellFloat(x, y, seed) < probability;
}

/**
 * Enumerate the chosen cells in a rectangle, row-major (ordered). Handy for
 * placing decoration nodes over a visible region without a PRNG. Cosmetic.
 */
export function scatterCells(
  x0: number,
  y0: number,
  cols: number,
  rows: number,
  probability: number,
  seed = 0,
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = y0; y < y0 + rows; y++) {
    for (let x = x0; x < x0 + cols; x++) {
      if (scatter(x, y, probability, seed)) out.push({ x, y });
    }
  }
  return out;
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * Value noise in [0,1] at a fractional coordinate — smooth bilinear blend of the
 * four surrounding integer-cell hashes. This is the deliberately-small
 * alternative to a simplex lib (see JS13K-MINING anti-recommendations): enough
 * for cosmetic terrain tint, cloud cover, wobble; not a gameplay dependency.
 */
export function valueNoise(x: number, y: number, seed = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const c00 = cellFloat(x0, y0, seed);
  const c10 = cellFloat(x0 + 1, y0, seed);
  const c01 = cellFloat(x0, y0 + 1, seed);
  const c11 = cellFloat(x0 + 1, y0 + 1, seed);
  const top = c00 + (c10 - c00) * fx;
  const bot = c01 + (c11 - c01) * fx;
  return top + (bot - top) * fy;
}

export interface FractalOptions {
  octaves?: number;
  /** Frequency multiplier per octave (default 2). */
  lacunarity?: number;
  /** Amplitude multiplier per octave (default 0.5). */
  gain?: number;
}

/** Fractal (fBm) value noise — layered octaves, normalized to [0,1]. Cosmetic. */
export function fractalNoise(x: number, y: number, seed = 0, opts: FractalOptions = {}): number {
  const octaves = opts.octaves ?? 4;
  const lacunarity = opts.lacunarity ?? 2;
  const gain = opts.gain ?? 0.5;
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + o);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return norm === 0 ? 0 : sum / norm;
}

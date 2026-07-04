// Deterministic transcendental math. JavaScript guarantees bit-exact results
// across engines for +, -, *, /, Math.sqrt (IEEE-754 correctly rounded) — but
// NOT for Math.sin/cos/atan2/pow/hypot/exp, which are implementation-defined
// and may differ between V8, JSC, and SpiderMonkey. A cross-machine lockstep
// game that touches them can desync even with identical input logs.
//
// These replacements are built from exactly-rounded ops only (fdlibm-style
// polynomial kernels), so every engine computes bit-identical values. Sim code
// MUST use these instead of the Math.* originals (enforced by
// `npm run invariants`). Accuracy ≈ 1 ulp on game-scale inputs.

// ── argument reduction constants (π/2 split for Cody-Waite reduction) ──
const INV_PIO2 = 6.36619772367581382433e-1; // 2/π
const PIO2_HI = 1.57079632673412561417e0; //  first 33 bits of π/2
const PIO2_LO = 6.07710050650619224932e-11; // π/2 − PIO2_HI

// fdlibm kernel coefficients for sin/cos on |r| ≤ π/4.
const S1 = -1.66666666666666324348e-1;
const S2 = 8.33333333332248946124e-3;
const S3 = -1.98412698298579493134e-4;
const S4 = 2.75573137070700676789e-6;
const S5 = -2.50507602534068634195e-8;
const S6 = 1.58969099521155010221e-10;

const C1 = 4.16666666666666019037e-2;
const C2 = -1.38888888888741095749e-3;
const C3 = 2.48015872894767294178e-5;
const C4 = -2.75573143513906633035e-7;
const C5 = 2.08757232129817482790e-9;
const C6 = -1.13596475577881948265e-11;

function kSin(r: number): number {
  const z = r * r;
  return r + r * z * (S1 + z * (S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)))));
}

function kCos(r: number): number {
  const z = r * r;
  return 1 - 0.5 * z + z * z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
}

/** Reduce x to r ∈ [−π/4, π/4] and quadrant n. Accurate for |x| ≲ 1e7 (plenty for game angles). */
function reduce(x: number): { n: number; r: number } {
  const n = Math.round(x * INV_PIO2);
  const r = x - n * PIO2_HI - n * PIO2_LO;
  return { n: ((n % 4) + 4) % 4, r };
}

/** Deterministic sine (bit-identical on every JS engine). */
export function dsin(x: number): number {
  if (!Number.isFinite(x)) return NaN;
  const { n, r } = reduce(x);
  switch (n) {
    case 0:
      return kSin(r);
    case 1:
      return kCos(r);
    case 2:
      return -kSin(r);
    default:
      return -kCos(r);
  }
}

/** Deterministic cosine (bit-identical on every JS engine). */
export function dcos(x: number): number {
  if (!Number.isFinite(x)) return NaN;
  const { n, r } = reduce(x);
  switch (n) {
    case 0:
      return kCos(r);
    case 1:
      return -kSin(r);
    case 2:
      return -kCos(r);
    default:
      return kSin(r);
  }
}

// ── atan / atan2 (fdlibm port) ──────────────────────────────────
const ATAN_HI = [4.63647609000806093515e-1, 7.85398163397448278999e-1, 9.82793723247329054082e-1, 1.570796326794896558e0];
const ATAN_LO = [2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17, 6.12323399573676603587e-17];
const AT = [
  3.33333333333329318027e-1, -1.99999999998764832476e-1, 1.42857142725034663711e-1, -1.1111110405462355788e-1,
  9.09088713343650656196e-2, -7.69187620504482999495e-2, 6.66107313738753120669e-2, -5.83357013379057348645e-2,
  4.97687799461593236017e-2, -3.6531572744216915527e-2, 1.62858201153657823623e-2,
];

/** Deterministic arctangent. */
export function datan(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (!Number.isFinite(x)) return x > 0 ? ATAN_HI[3] : -ATAN_HI[3];
  const sign = x < 0 || Object.is(x, -0) ? -1 : 1;
  let ax = Math.abs(x);
  if (ax >= 1e19) return sign * (ATAN_HI[3] + ATAN_LO[3]);

  let id = -1;
  if (ax < 0.4375) {
    if (ax < 1e-9) return x; // tiny: atan(x) ≈ x
  } else if (ax < 0.6875) {
    id = 0;
    ax = (2 * ax - 1) / (2 + ax);
  } else if (ax < 1.1875) {
    id = 1;
    ax = (ax - 1) / (ax + 1);
  } else if (ax < 2.4375) {
    id = 2;
    ax = (ax - 1.5) / (1 + 1.5 * ax);
  } else {
    id = 3;
    ax = -1 / ax;
  }

  const z = ax * ax;
  const w = z * z;
  const s1 = z * (AT[0] + w * (AT[2] + w * (AT[4] + w * (AT[6] + w * (AT[8] + w * AT[10])))));
  const s2 = w * (AT[1] + w * (AT[3] + w * (AT[5] + w * (AT[7] + w * AT[9]))));
  if (id < 0) return sign * (ax - ax * (s1 + s2));
  const r = ATAN_HI[id] - (ax * (s1 + s2) - ATAN_LO[id] - ax);
  return sign * r;
}

const PI = 3.141592653589793;

/** Deterministic atan2(y, x) with standard quadrant conventions. */
export function datan2(y: number, x: number): number {
  if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
  if (y === 0 && x === 0) return Object.is(x, -0) ? (Object.is(y, -0) ? -PI : PI) : Object.is(y, -0) ? -0 : 0;
  if (x === 0 || (!Number.isFinite(y) && Number.isFinite(x))) return y > 0 ? PI / 2 : -PI / 2;
  if (!Number.isFinite(x)) {
    if (!Number.isFinite(y)) {
      const q = x > 0 ? PI / 4 : (3 * PI) / 4;
      return y > 0 ? q : -q;
    }
    return x > 0 ? (y < 0 || Object.is(y, -0) ? -0 : 0) : y < 0 || Object.is(y, -0) ? -PI : PI;
  }
  const a = datan(y / x);
  if (x > 0) return a;
  return y < 0 || Object.is(y, -0) ? a - PI : a + PI;
}

// ── exp2 (for easing curves and decay) ──────────────────────────
const LN2 = 6.93147180559945286227e-1;

/** Deterministic 2^x via Taylor series on the reduced argument. */
export function dexp2(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x >= 1024) return Infinity;
  if (x <= -1075) return 0;
  const k = Math.round(x);
  const y = (x - k) * LN2; // |y| ≤ ln2/2 ≈ 0.347
  let term = 1;
  let sum = 1;
  for (let i = 1; i <= 13; i++) {
    term = (term * y) / i;
    sum += term;
  }
  return sum * 2 ** k; // 2^integer is exact in every engine
}

/** Deterministic natural exponential eˣ. Routes through dexp2 (eˣ = 2^(x/ln2)). */
export function dexp(x: number): number {
  return dexp2(x * INV_LN2);
}

/** Deterministic hypotenuse: sqrt is IEEE-correctly-rounded, hypot is not. */
export function dhypot(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

// ── logarithms ──────────────────────────────────────────────────
// Decompose x = m·2^e with the exponent read straight from the float bits
// (bit-exact everywhere), then ln(m) on m ∈ [√½·2, √2) via the atanh series
// ln(m) = 2·atanh((m−1)/(m+1)) — only exactly-rounded ops.
const logView = new DataView(new ArrayBuffer(8));
const LN2_HI = 6.93147180369123816490e-1;
const LN2_LO = 1.90821492927058770002e-10;

/** Deterministic natural logarithm. */
export function dlog(x: number): number {
  if (Number.isNaN(x) || x < 0) return NaN;
  if (x === 0) return -Infinity;
  if (!Number.isFinite(x)) return Infinity;
  logView.setFloat64(0, x);
  let e = ((logView.getUint32(0) >>> 20) & 0x7ff) - 1023;
  if (e === -1023) {
    // subnormal: scale up by 2^54 (exact) and correct the exponent
    logView.setFloat64(0, x * 18014398509481984);
    e = ((logView.getUint32(0) >>> 20) & 0x7ff) - 1023 - 54;
  }
  // mantissa m ∈ [1, 2); shift to [√½·2, √2) so |s| stays small
  logView.setUint32(0, (logView.getUint32(0) & 0xfffff) | (1023 << 20));
  let m = logView.getFloat64(0);
  if (m > 1.4142135623730951) {
    m *= 0.5;
    e += 1;
  }
  const s = (m - 1) / (m + 1);
  const z = s * s;
  // 2·atanh(s) = 2s·(1 + z/3 + z²/5 + …) — terms through z⁹/19 keep the
  // truncation below 1 ulp for |s| ≤ 0.172
  const p =
    1 +
    z *
      (0.3333333333333333 +
        z *
          (0.2 +
            z *
              (0.14285714285714285 +
                z *
                  (0.1111111111111111 +
                    z *
                      (0.09090909090909091 +
                        z * (0.07692307692307693 + z * (0.06666666666666667 + z * (0.058823529411764705 + z * 0.05263157894736842))))))));
  return e * LN2_HI + (2 * s * p + e * LN2_LO);
}

const INV_LN10 = 4.34294481903251816668e-1; // 1/ln(10)
const INV_LN2 = 1.44269504088896338700e0; // 1/ln(2)

/** Deterministic base-10 logarithm. */
export const dlog10 = (x: number): number => dlog(x) * INV_LN10;
/** Deterministic base-2 logarithm. */
export const dlog2 = (x: number): number => dlog(x) * INV_LN2;

// ── power ────────────────────────────────────────────────────────
// Math.pow is implementation-defined and banned in the sim. This is the one
// sanctioned replacement (four subsystems used to hand-roll it privately).
// Integer exponents run an exact multiply chain — bit-identical everywhere and
// valid for negative bases; other cases route through dexp2(exp·dlog2(base)).

/** Deterministic base^exp (bit-identical across JS engines). */
export function dpow(base: number, exp: number): number {
  if (Number.isNaN(base) || Number.isNaN(exp)) return NaN;
  if (exp === 0) return 1; // includes 0^0 = 1, matching Math.pow
  if (exp === 1) return base;
  // Exact path for integer exponents: repeated squaring on |exp|, bit-exact and
  // the only route that stays valid for a negative base.
  if (Number.isInteger(exp) && Math.abs(exp) <= 1024) {
    let n = Math.abs(exp);
    let b = base;
    let r = 1;
    while (n > 0) {
      if (n & 1) r *= b;
      n >>= 1;
      if (n > 0) b *= b;
    }
    return exp < 0 ? 1 / r : r;
  }
  if (base > 0) return dexp2(exp * dlog2(base));
  if (base === 0) return exp > 0 ? 0 : Infinity;
  return NaN; // negative base, non-integer exponent → complex → NaN (like Math.pow)
}

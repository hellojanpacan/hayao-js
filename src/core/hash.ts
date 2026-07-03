// Deterministic structural hash of any JSON-like value. The spine of replay
// verification: two runs are identical iff their state hashes match.

function canonicalNumber(n: number): string {
  if (Number.isNaN(n)) return 'NaN';
  if (n === Infinity) return 'Inf';
  if (n === -Infinity) return '-Inf';
  if (n === 0) return '0'; // collapse -0 and 0
  return n.toString();
}

/**
 * Walk a value in a canonical order (object keys sorted) and fold it into a
 * 64-bit-ish FNV-1a hash represented as an 8-char hex string. Stable across runs
 * for structurally identical data.
 */
export function hashValue(value: unknown): string {
  let h1 = 2166136261 >>> 0;
  let h2 = 0x811c9dc5 >>> 0;
  const push = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ ((c << 3) | (c >>> 5)), 2246822519) >>> 0;
    }
  };

  const walk = (v: unknown): void => {
    if (v === null) return push('n');
    if (v === undefined) return push('u');
    switch (typeof v) {
      case 'number':
        return push('#' + canonicalNumber(v));
      case 'boolean':
        return push(v ? 't' : 'f');
      case 'string':
        return push('"' + v);
      case 'object': {
        if (Array.isArray(v)) {
          push('[');
          for (const el of v) walk(el);
          push(']');
          return;
        }
        const obj = v as Record<string, unknown>;
        // Omit undefined-valued keys: JSON has no `undefined`, so `{a: undefined}`
        // and `{}` serialize identically. Counting the key would make hash()
        // disagree with the value after a save/load JSON round-trip (a Sprite's
        // unset paint fields are the canonical case). JSON-stable = the guarantee
        // persistence needs.
        const keys = Object.keys(obj)
          .filter((k) => obj[k] !== undefined)
          .sort();
        push('{');
        for (const k of keys) {
          push(k + ':');
          walk(obj[k]);
        }
        push('}');
        return;
      }
      default:
        push('?');
    }
  };

  walk(value);
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return hex(h1) + hex(h2);
}

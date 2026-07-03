// Compact string codecs for levels and state — the js13k byte-squeeze trick, made
// deterministic and fully reversible. Two independent tools:
//   • RLE   — collapse runs in grid/level strings (walls, tiles), witchcat-style.
//   • varint pack — pack a list of small non-negative ints into a short URL-safe
//                   string (base-64 continuation varints), soul-surf encode/decode.
// Both are pure functions with exact round-trips; no RNG, no clock, no browser.

// ── Run-length encoding ─────────────────────────────────────────
// Reversible for ANY string. A run of ≥4 (or any literal escape char) becomes
// `~<char><count>~`; shorter runs stay literal. Compact for repetitive maps,
// never larger by more than the escapes it introduces.
const ESC = '~';
const RLE_MIN_RUN = 4;

export function rleEncode(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    let run = 1;
    while (i + run < input.length && input[i + run] === ch) run++;
    if (run >= RLE_MIN_RUN || ch === ESC) {
      out += ESC + ch + run.toString(36) + ESC;
    } else {
      out += ch.repeat(run);
    }
    i += run;
  }
  return out;
}

export function rleDecode(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    if (input[i] === ESC) {
      const ch = input[i + 1];
      const end = input.indexOf(ESC, i + 2);
      if (ch === undefined || end < 0) throw new Error('hayao: malformed RLE stream');
      const count = parseInt(input.slice(i + 2, end), 36);
      if (!Number.isFinite(count) || count < 1) throw new Error('hayao: malformed RLE count');
      out += ch.repeat(count);
      i = end + 1;
    } else {
      out += input[i];
      i++;
    }
  }
  return out;
}

// ── Base-64 variable-length integers ────────────────────────────
// Pack non-negative integers into a URL/JSON-safe string: 6 bits per char, the
// top bit a continuation flag (LEB128-style, base 32 per digit). Ideal for
// coordinate lists, tile ids, and other small-int level payloads.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const INDEX: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) INDEX[ALPHABET[i]] = i;

export function packVarints(nums: readonly number[]): string {
  let out = '';
  for (const n of nums) {
    if (!Number.isInteger(n) || n < 0) throw new Error(`hayao: packVarints expects non-negative integers, got ${n}`);
    let v = n;
    do {
      let digit = v & 0x1f; // low 5 bits
      v = Math.floor(v / 32);
      if (v > 0) digit |= 0x20; // continuation bit
      out += ALPHABET[digit];
    } while (v > 0);
  }
  return out;
}

export function unpackVarints(input: string): number[] {
  const out: number[] = [];
  let v = 0;
  let shift = 1;
  for (const ch of input) {
    const digit = INDEX[ch];
    if (digit === undefined) throw new Error(`hayao: unpackVarints saw invalid char "${ch}"`);
    v += (digit & 0x1f) * shift;
    if (digit & 0x20) {
      shift *= 32; // more digits follow
    } else {
      out.push(v);
      v = 0;
      shift = 1;
    }
  }
  if (shift !== 1) throw new Error('hayao: unpackVarints hit a truncated stream');
  return out;
}

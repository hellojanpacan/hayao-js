// Actionable, newcomer-facing errors (issue #66). The contract: when someone
// makes a common mistake, the FIRST thing they read names the field, the
// expected value, what they actually passed, and a link to the fix — never a
// cryptic engine-internal stack trace deep inside a render or step loop.
//
// House format:
//   [hayao] <problem>
//     field:     <field>
//     expected:  <expected>
//     received:  <describeValue(received)>
//     fix:       <hint>
//     docs:      <ERRORS_DOC>#<anchor>

/** Where every guard message points for the full explanation + fix. */
export const ERRORS_DOC = 'https://github.com/hellojanpacan/hayao-js/blob/main/docs/ERRORS.md';

/** Render an arbitrary value for an error message: type + short, safe preview. */
export function describeValue(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : Number.isNaN(v) ? 'NaN' : String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'boolean' || typeof v === 'function') return typeof v;
  if (Array.isArray(v)) return `an array (length ${v.length})`;
  if (typeof v === 'object') {
    const keys = Object.keys(v as object);
    const shown = keys.slice(0, 6).join(', ');
    return `an object with keys { ${shown}${keys.length > 6 ? ', …' : ''} }`;
  }
  return typeof v;
}

export interface GuardInfo {
  /** One-line statement of what's wrong. */
  problem: string;
  /** The offending field/argument name (e.g. 'shape', 'build', 'pos.x'). */
  field?: string;
  /** What a correct value looks like. */
  expected?: string;
  /** What was actually passed — rendered via describeValue. Include the key even
   *  when the value is undefined by setting it explicitly. */
  received?: unknown;
  /** Whether `received` was provided (so we can render `undefined` deliberately). */
  hasReceived?: boolean;
  /** A concrete next step the reader can take. */
  hint?: string;
  /** Anchor on ERRORS.md (e.g. 'sprite-shape'). */
  anchor?: string;
}

/** Build (but do not throw) a hayao guard error with the house format. */
export function guardError(info: GuardInfo): Error {
  const lines = [`[hayao] ${info.problem}`];
  if (info.field !== undefined) lines.push(`  field:     ${info.field}`);
  if (info.expected !== undefined) lines.push(`  expected:  ${info.expected}`);
  if (info.hasReceived) lines.push(`  received:  ${describeValue(info.received)}`);
  if (info.hint) lines.push(`  fix:       ${info.hint}`);
  lines.push(`  docs:      ${ERRORS_DOC}${info.anchor ? '#' + info.anchor : ''}`);
  return new Error(lines.join('\n'));
}

/** Throw a hayao guard error. */
export function fail(info: GuardInfo): never {
  throw guardError(info);
}

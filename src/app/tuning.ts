// Tuning: declared, live-adjustable parameters. A game declares its knobs once
// (`tuning` on the GameDefinition); `createWorld` resolves declared defaults +
// overrides into plain values the sim reads via `world.tune()`. Resolved values
// are sim state — hashed and snapshotted — so a knob change can never escape the
// determinism checks. The declared defaults ARE the config: code stays the
// source of truth, and Workshop overrides are session data, never a second config.

import type { GameDefinition } from './game';

export type TuningValue = number | string;
export type TuningValues = Record<string, TuningValue>;

export interface TuningKnob {
  key: string;
  /** Human label for panels; defaults to the key. */
  label?: string;
  type: 'number' | 'color' | 'enum';
  default: TuningValue;
  /** number knobs: slider bounds + resolution. */
  min?: number;
  max?: number;
  step?: number;
  /** enum knobs: the allowed values. */
  options?: string[];
  /** Panel grouping (e.g. 'jump', 'combat', 'style'). */
  group?: string;
  /**
   * Pure-view knob (palette, fonts): eligible for cheap re-apply without a sim
   * rebuild. Sim-affecting knobs leave this unset.
   */
  cosmetic?: boolean;
}

export interface TuningSpec {
  knobs: TuningKnob[];
}

/**
 * A named alternative of a game for A/B playtesting: a tuning preset and/or a
 * definition patch. Tuning-only variants can hot-swap mid-play (rebuild with
 * snapshot carryover); `patch` variants restart fresh.
 */
export interface Variant {
  label: string;
  tuning?: TuningValues;
  patch?(def: GameDefinition): GameDefinition;
}

/** Sugar for declaring knobs without repeating the key in a label. */
export const knob = {
  num(key: string, opts: { default: number; min?: number; max?: number; step?: number; label?: string; group?: string; cosmetic?: boolean }): TuningKnob {
    return { key, type: 'number', ...opts };
  },
  color(key: string, opts: { default: string; label?: string; group?: string; cosmetic?: boolean }): TuningKnob {
    return { key, type: 'color', cosmetic: true, ...opts };
  },
  enumOf(key: string, opts: { default: string; options: string[]; label?: string; group?: string; cosmetic?: boolean }): TuningKnob {
    return { key, type: 'enum', ...opts };
  },
};

/**
 * Resolve a spec + overrides into concrete values: declared defaults first,
 * overrides applied only for DECLARED keys (unknown keys are dropped — a typo'd
 * override must not smuggle undeclared state into the hash), numbers clamped to
 * [min, max] and coerced, enum values validated against `options`.
 */
export function resolveTuning(spec: TuningSpec | undefined, overrides?: TuningValues): TuningValues {
  const out: TuningValues = {};
  if (!spec) return out;
  for (const k of spec.knobs) {
    out[k.key] = k.default;
    const o = overrides?.[k.key];
    if (o === undefined) continue;
    if (k.type === 'number') {
      const n = typeof o === 'number' ? o : Number(o);
      if (!Number.isFinite(n)) continue;
      const lo = k.min ?? -Infinity;
      const hi = k.max ?? Infinity;
      out[k.key] = Math.min(hi, Math.max(lo, n));
    } else if (k.type === 'enum') {
      if (typeof o === 'string' && (k.options ?? []).includes(o)) out[k.key] = o;
    } else {
      if (typeof o === 'string') out[k.key] = o;
    }
  }
  return out;
}

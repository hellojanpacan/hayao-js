// The Solar-Bold-Duotone style primitive. The Solar icon set (and the whole
// "bold duotone" family) reads as ONE bold solid mass plus a lighter "second
// tone" plane of the SAME hue — two opacities of a single color, rounded and
// chunky, with ink used sparingly for the few hard details (eyes, notches).
//
// This module turns that language into a small, palette-sourced value type. Every
// asset in the character/prop library dresses itself from a `DuotoneScheme` so a
// whole game reads as one coherent set — the same way the Solar sheet does. Pure
// and deterministic: colors are derived by `mix` toward the palette's paper/ink,
// never hand-typed RGB (keeps `npm run palette` honest).

import { KENTO, REGALIA, mix, withAlpha } from './palette';

/** The four tones an asset paints with, derived from one hue. */
export interface DuotoneScheme {
  /** The bold, fully-opaque primary mass — the "bold" in bold-duotone. */
  base: string;
  /** The lighter same-hue "second tone" — faces, fronts, highlights. */
  light: string;
  /** A recessed tone for parts that sit behind (back limbs, undersides). */
  shade: string;
  /** Sparing ink for the few hard details (eyes, seams). */
  ink: string;
  /** A translucent version of `ink` for soft contact shadows. */
  shadow: string;
}

export interface DuotoneOptions {
  /** How far the second tone lifts toward `paper` (0..1). Default 0.34. */
  lift?: number;
  /** How far recessed parts sink toward `ink` (0..1). Default 0.24. */
  recess?: number;
  /** Light target the second tone mixes toward. Default KENTO.gofun (shell-white). */
  paper?: string;
  /** Dark target ink/shade mix toward. Default KENTO.sumi (墨 ink). */
  ink?: string;
}

/**
 * Build a duotone scheme from a single base hue. Pick the base from a `Deep`
 * swatch (e.g. `KENTO.asagiDeep`) so it holds AA as a large mark on light paper;
 * the lighter/darker planes are derived from it. Pure — same args, same result.
 */
export function duotone(base: string, opts: DuotoneOptions = {}): DuotoneScheme {
  const paper = opts.paper ?? KENTO.gofun;
  const ink = opts.ink ?? KENTO.sumi;
  return {
    base,
    light: mix(base, paper, opts.lift ?? 0.34),
    shade: mix(base, ink, opts.recess ?? 0.24),
    ink,
    shadow: withAlpha(ink, 0.18),
  };
}

/**
 * The default scheme set — the clean/friendly Regalia hues at their true tone. Each
 * takes a brand hue as its bold mass, lifts a second tone toward Regalia paper, and
 * sinks a shade toward navy ink — the duotone is those two opacities, no second hex.
 * `rose` and `bark` are purpose-scoped (vitality / material). Starter set for new games.
 */
export const REGALIA_SCHEMES = {
  gold: duotone(REGALIA.gold, { paper: REGALIA.paper, ink: REGALIA.ink }),
  meadow: duotone(REGALIA.green, { paper: REGALIA.paper, ink: REGALIA.ink }),
  dusk: duotone(REGALIA.blue, { paper: REGALIA.paper, ink: REGALIA.ink }),
  rose: duotone(REGALIA.rose, { paper: REGALIA.paper, ink: REGALIA.ink }),
  bark: duotone(REGALIA.bark, { paper: REGALIA.paper, ink: REGALIA.ink }),
} as const;

/** Ready-made schemes on the Kentō woodblock hues — an opt-in theme, never a restriction. */
export const DUOTONE_SCHEMES = {
  teal: duotone(KENTO.asagiDeep),
  vermilion: duotone(KENTO.shuDeep),
  pine: duotone(KENTO.matsuDeep),
  wisteria: duotone(KENTO.fujiDeep),
  rose: duotone(KENTO.sakuDeep),
  persimmon: duotone(KENTO.kakiDeep),
  indigo: duotone(KENTO.aiDeep),
} as const;

/** The name of every ready-made scheme, for tuning knobs / catalogs. */
export type DuotoneSchemeName = keyof typeof DUOTONE_SCHEMES;
export const DUOTONE_SCHEME_NAMES = Object.keys(DUOTONE_SCHEMES) as DuotoneSchemeName[];

/** The name of every Regalia scheme, for tuning knobs / catalogs. */
export type RegaliaSchemeName = keyof typeof REGALIA_SCHEMES;
export const REGALIA_SCHEME_NAMES = Object.keys(REGALIA_SCHEMES) as RegaliaSchemeName[];

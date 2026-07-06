// The lighting run: a flat, self-describing DrawCommand stream tagged
// `layer: LAYER_LIGHT`, emitted by LightLayer. Both Canvas2D and SVG interpret
// it through THIS ONE parser so the two backends composite identically — and it
// is the WebGL attach point (parse once, upload as uniforms). The run is
// tolerant: anything it cannot understand is reported so the backend paints the
// run flat (honouring per-command `blend`) rather than dropping commands.
//
// Stream order (must match LightLayer.draw):
//   1. ambient base — one full-viewport `rect`, IDENTITY transform, blend 'multiply'
//   2. per light, in child order:
//        a. `circle` with radial gradient (color×intensity → transparent), blend 'screen'
//        b. that light's shadow quads — closed `poly`s, ambient fill, blend 'multiply'
//           (soft mode adds one expanded 50%-opacity penumbra quad per segment)

import { LAYER_LIGHT, type CircleCommand, type DrawCommand, type PolyCommand, type RectCommand } from './commands';

/** The three painter bands the compositor needs: world, the light run, HUD/overlay. */
export interface LightRunSplit {
  /** Everything below the light layer (the lit world). */
  below: DrawCommand[];
  /** The light run itself (layer === LAYER_LIGHT), in stream order. */
  light: DrawCommand[];
  /** Everything above the light layer (HUD/overlay — never darkened). */
  above: DrawCommand[];
}

/**
 * Split a SORTED display list into below/light/above runs by layer. The caller
 * passes commands already through `sortCommands`, so the light run is contiguous.
 */
export function splitByLightLayer(sorted: DrawCommand[]): LightRunSplit {
  const below: DrawCommand[] = [];
  const light: DrawCommand[] = [];
  const above: DrawCommand[] = [];
  for (const c of sorted) {
    const layer = c.layer ?? 0;
    if (layer === LAYER_LIGHT) light.push(c);
    else if (layer < LAYER_LIGHT) below.push(c);
    else above.push(c);
  }
  return { below, light, above };
}

/** One parsed light: its pool circle plus the shadow polys that erase it. */
export interface ParsedLight {
  circle: CircleCommand;
  shadows: PolyCommand[];
}

/** A parsed light run: the ambient darkness base + the per-light pools/shadows. */
export interface ParsedLightRun {
  ambient: RectCommand;
  lights: ParsedLight[];
}

/**
 * Parse a light run (as produced by `splitByLightLayer().light`) into its
 * structured form, or `null` if the stream does not match the expected order —
 * in which case the backend must fall back to painting the run flat. An EMPTY
 * run is unparseable (null): there is nothing to composite, so backends paint
 * it flat (a no-op) and produce byte-identical output to a lit-layer-free frame.
 */
export function parseLightRun(run: DrawCommand[]): ParsedLightRun | null {
  if (run.length === 0) return null;
  const first = run[0];
  // The ambient base is always the leading multiply rect.
  if (first.kind !== 'rect' || first.blend !== 'multiply') return null;
  const ambient = first;
  const lights: ParsedLight[] = [];
  let i = 1;
  while (i < run.length) {
    const c = run[i];
    // Each light opens with a screen-blended circle (its pool).
    if (c.kind !== 'circle' || c.blend !== 'screen') return null;
    const light: ParsedLight = { circle: c, shadows: [] };
    i++;
    // Followed by zero or more multiply polys (its shadow quads) until the next pool.
    while (i < run.length && run[i].kind === 'poly' && run[i].blend === 'multiply') {
      light.shadows.push(run[i] as PolyCommand);
      i++;
    }
    lights.push(light);
  }
  return { ambient, lights };
}

/** True when a command carries the light-layer tag (helper for tests/backends). */
export const isLightCommand = (c: DrawCommand): boolean => (c.layer ?? 0) === LAYER_LIGHT;

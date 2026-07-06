import { describe, expect, it } from 'vitest';
import { isLightCommand, parseLightRun, splitByLightLayer } from './lightRun';
import { LAYER_HUD, LAYER_LIGHT, type DrawCommand } from './commands';

const ID = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const rect = (over: Partial<DrawCommand> = {}): DrawCommand => ({ kind: 'rect', x: 0, y: 0, w: 1, h: 1, transform: ID, z: 0, ...over } as DrawCommand);
const ambient = (): DrawCommand => rect({ fill: '#111', blend: 'multiply', layer: LAYER_LIGHT });
const pool = (): DrawCommand => ({ kind: 'circle', cx: 0, cy: 0, radius: 5, blend: 'screen', transform: ID, z: 0, layer: LAYER_LIGHT });
const shadow = (): DrawCommand => ({ kind: 'poly', points: [0, 0, 1, 0, 1, 1], closed: true, blend: 'multiply', transform: ID, z: 0, layer: LAYER_LIGHT });

describe('splitByLightLayer', () => {
  it('partitions a sorted list into below / light / above bands', () => {
    const below = rect({ layer: 0 });
    const light = ambient();
    const above = rect({ layer: LAYER_HUD });
    const split = splitByLightLayer([below, light, above]);
    expect(split.below).toEqual([below]);
    expect(split.light).toEqual([light]);
    expect(split.above).toEqual([above]);
  });

  it('treats the default (undefined) layer as world/below', () => {
    const c = rect();
    expect(splitByLightLayer([c]).below).toEqual([c]);
  });
});

describe('parseLightRun', () => {
  it('returns null for an empty run (nothing to composite)', () => {
    expect(parseLightRun([])).toBeNull();
  });

  it('parses ambient + one pool + its shadows', () => {
    const parsed = parseLightRun([ambient(), pool(), shadow(), shadow()]);
    expect(parsed).not.toBeNull();
    expect(parsed!.ambient.kind).toBe('rect');
    expect(parsed!.lights).toHaveLength(1);
    expect(parsed!.lights[0].shadows).toHaveLength(2);
  });

  it('parses multiple lights, attributing shadows to the preceding pool', () => {
    const parsed = parseLightRun([ambient(), pool(), shadow(), pool()]);
    expect(parsed!.lights).toHaveLength(2);
    expect(parsed!.lights[0].shadows).toHaveLength(1);
    expect(parsed!.lights[1].shadows).toHaveLength(0);
  });

  it('returns null when the run does not open with a multiply rect (unparseable → flat)', () => {
    expect(parseLightRun([pool()])).toBeNull();
    expect(parseLightRun([rect({ layer: LAYER_LIGHT })])).toBeNull(); // rect but no multiply blend
  });

  it('returns null when a non-pool, non-shadow command appears mid-run', () => {
    expect(parseLightRun([ambient(), rect({ fill: '#f00', layer: LAYER_LIGHT })])).toBeNull();
  });
});

describe('isLightCommand', () => {
  it('is true only for LAYER_LIGHT commands', () => {
    expect(isLightCommand(ambient())).toBe(true);
    expect(isLightCommand(rect())).toBe(false);
    expect(isLightCommand(rect({ layer: LAYER_HUD }))).toBe(false);
  });
});

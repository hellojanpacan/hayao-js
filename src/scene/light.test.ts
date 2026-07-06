import { describe, expect, it } from 'vitest';
import { World } from '../world';
import { Node } from './node';
import { LightLayer, PointLight } from './light';
import { LAYER_LIGHT } from '../render/commands';
import { parseLightRun, splitByLightLayer } from '../render/lightRun';
import { occludersFromTilemap } from './shadow2d';
import { tilemapFromAscii } from '../physics/tilemap';

// Build a small world with a Sprite-less root; return {world, root} so tests can
// bolt a cosmetic LightLayer on and compare hashes / renders.
function makeWorld(): World {
  const world = new World({ seed: 1 });
  const root = new Node({ name: 'root' });
  root.addChild(new Node({ name: 'ground', pos: { x: 100, y: 100 } }));
  world.setRoot(root);
  return world;
}

describe('light nodes — cosmetic seam (hash equality)', () => {
  it('adding a LightLayer + PointLight does NOT change world.hash()', () => {
    const bare = makeWorld();
    bare.step([]);
    const hashBefore = bare.hash();

    const lit = makeWorld();
    const layer = lit.root.addChild(new LightLayer({ ambient: { color: '#101018', level: 0.1 } }));
    layer.addChild(new PointLight({ pos: { x: 100, y: 100 }, radius: 120 }));
    lit.step([]);

    // Cosmetic nodes are excluded from serialize()/hash() — the lit world hashes
    // exactly like the bare one (same seed, same canonical state).
    expect(lit.hash()).toBe(hashBefore);
  });

  it('the light layer + point light are excluded from serialize()', () => {
    const w = makeWorld();
    const layer = w.root.addChild(new LightLayer());
    layer.addChild(new PointLight());
    const tree = w.root.serialize();
    // Only the canonical child ('ground') survives serialization.
    expect(tree.children.map((c) => c.name)).toEqual(['ground']);
  });
});

describe('light run — command census', () => {
  function litRun() {
    const w = makeWorld();
    const layer = w.root.addChild(new LightLayer({ ambient: { color: '#101018', level: 0 }, width: 200, height: 100 }));
    layer.addChild(new PointLight({ pos: { x: 50, y: 50 }, radius: 60, color: '#ffddaa', intensity: 1 }));
    w.step([]);
    const cmds = w.render();
    return splitByLightLayer(cmds).light;
  }

  it('emits an ambient multiply rect then a screen pool circle', () => {
    const run = litRun();
    expect(run.length).toBe(2);
    expect(run[0].kind).toBe('rect');
    expect(run[0].blend).toBe('multiply');
    expect(run[0].layer).toBe(LAYER_LIGHT);
    expect(run[1].kind).toBe('circle');
    expect(run[1].blend).toBe('screen');
    expect(run[1].layer).toBe(LAYER_LIGHT);
  });

  it('the run parses into ambient + one light with no shadows (no occluders)', () => {
    const parsed = parseLightRun(litRun());
    expect(parsed).not.toBeNull();
    expect(parsed!.lights).toHaveLength(1);
    expect(parsed!.lights[0].shadows).toHaveLength(0);
  });

  it('with occluders, the light gains multiply shadow polys after the pool', () => {
    const w = makeWorld();
    const map = tilemapFromAscii(['....', '.#..', '....'], 20);
    const layer = w.root.addChild(new LightLayer({ width: 80, height: 60 }));
    layer.setOccluders(occludersFromTilemap(map));
    layer.addChild(new PointLight({ pos: { x: 10, y: 30 }, radius: 200 }));
    w.step([]);
    const run = splitByLightLayer(w.render()).light;
    const parsed = parseLightRun(run);
    expect(parsed!.lights[0].shadows.length).toBeGreaterThan(0);
    for (const s of parsed!.lights[0].shadows) expect(s.blend).toBe('multiply');
  });

  it('soft shadows add a half-opacity penumbra poly per hard shadow', () => {
    const w = makeWorld();
    const map = tilemapFromAscii(['....', '.#..', '....'], 20);
    const hardLayer = w.root.addChild(new LightLayer({ softShadows: false }));
    hardLayer.setOccluders(occludersFromTilemap(map));
    hardLayer.addChild(new PointLight({ pos: { x: 10, y: 30 }, radius: 200 }));
    w.step([]);
    const hard = parseLightRun(splitByLightLayer(w.render()).light)!.lights[0].shadows.length;

    const w2 = makeWorld();
    const softLayer = w2.root.addChild(new LightLayer({ softShadows: true }));
    softLayer.setOccluders(occludersFromTilemap(map));
    softLayer.addChild(new PointLight({ pos: { x: 10, y: 30 }, radius: 200 }));
    w2.step([]);
    const soft = parseLightRun(splitByLightLayer(w2.render()).light)!.lights[0].shadows.length;

    expect(soft).toBe(hard * 2);
    // The penumbra polys carry a sub-1 opacity.
    const softShadows = parseLightRun(splitByLightLayer(w2.render()).light)!.lights[0].shadows;
    expect(softShadows.some((s) => s.opacity !== undefined && s.opacity < 1)).toBe(true);
  });
});

describe('flicker — determinism', () => {
  function flickerIntensityAfter(steps: number): number {
    const w = makeWorld();
    const layer = w.root.addChild(new LightLayer());
    const light = layer.addChild(new PointLight({ pos: { x: 50, y: 50 }, flicker: { amount: 0.4, speed: 8 }, seed: 99 }));
    for (let i = 0; i < steps; i++) w.step([]);
    return light.litIntensity;
  }

  it('is byte-equal across two same-seed runs', () => {
    expect(flickerIntensityAfter(20)).toBe(flickerIntensityAfter(20));
  });

  it('advances only in onProcess — repeated render() in one step does not change litIntensity', () => {
    const w = makeWorld();
    const layer = w.root.addChild(new LightLayer({ width: 200, height: 100 }));
    const light = layer.addChild(new PointLight({ pos: { x: 50, y: 50 }, flicker: { amount: 0.5, speed: 10 }, seed: 7 }));
    w.step([]);
    const after = light.litIntensity;
    // Rendering many times within the same step must NOT touch the flicker stream.
    for (let i = 0; i < 5; i++) w.render();
    expect(light.litIntensity).toBe(after);
    // And the emitted pool is byte-identical across those renders.
    const a = JSON.stringify(splitByLightLayer(w.render()).light);
    const b = JSON.stringify(splitByLightLayer(w.render()).light);
    expect(a).toBe(b);
  });

  it('flicker off → litIntensity equals intensity exactly', () => {
    const w = makeWorld();
    const layer = w.root.addChild(new LightLayer());
    const light = layer.addChild(new PointLight({ intensity: 0.75 }));
    for (let i = 0; i < 5; i++) w.step([]);
    expect(light.litIntensity).toBe(0.75);
  });
});

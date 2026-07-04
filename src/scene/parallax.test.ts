import { describe, it, expect } from 'vitest';
import { Node } from './node';
import { Sprite, Camera2D } from './nodes';
import { ParallaxLayer } from './parallax';
import { World } from '../world';

/** World + active camera + a parallax layer holding one child at local origin. */
function setup(factor: number): { world: World; cam: Camera2D; layer: ParallaxLayer } {
  const world = new World({ seed: 1, width: 1280, height: 720 });
  const root = new Node({ name: 'root' });
  const cam = new Camera2D({ name: 'cam', pos: { x: 0, y: 0 }, current: true });
  const layer = new ParallaxLayer({ name: 'layer', factor });
  layer.addChild(new Sprite({ name: 'child', pos: { x: 0, y: 0 }, shape: { kind: 'circle', radius: 4 } }));
  root.addChild(cam);
  root.addChild(layer);
  world.setRoot(root);
  world.step();
  return { world, cam, layer };
}

describe('ParallaxLayer', () => {
  it('is cosmetic (never enters the hash)', () => {
    expect(new ParallaxLayer({ factor: 0.5 }).cosmetic).toBe(true);
  });

  it('a factor-0 layer stays pinned to the screen as the camera scrolls', () => {
    const { world, cam, layer } = setup(0);
    cam.pos.x = 1000;
    cam.pos.y = 400;
    world.step();
    // layer tracks the camera fully, cancelling all scroll
    expect(layer.pos.x).toBeCloseTo(1000);
    expect(layer.pos.y).toBeCloseTo(400);
    // its child sits at the layer origin, so its world point == layer.pos;
    // that maps to screen center regardless of camera motion → pinned.
    const s = world.worldToScreen({ x: layer.pos.x, y: layer.pos.y });
    expect(s.x).toBeCloseTo(640);
    expect(s.y).toBeCloseTo(360);
  });

  it('a factor-1 layer scrolls fully with the world', () => {
    const { world, cam, layer } = setup(1);
    cam.pos.x = 1000;
    world.step();
    expect(layer.pos.x).toBeCloseTo(0); // no compensation → full scroll
  });

  it('a mid factor scrolls at exactly that fraction', () => {
    const { world, cam, layer } = setup(0.25);
    cam.pos.x = 800;
    world.step();
    expect(layer.pos.x).toBeCloseTo(600); // 800·(1−0.25)
  });
});

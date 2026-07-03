import { describe, it, expect } from 'vitest';
import { Node } from './node';
import { Sprite, Camera2D } from './nodes';
import { CameraController } from './cameraController';
import { World } from '../world';

/** A world with a single active camera at `camPos`, zoom `zoom`. */
function worldWithCamera(camPos = { x: 0, y: 0 }, zoom = 1): { world: World; cam: Camera2D } {
  const world = new World({ seed: 1, width: 1280, height: 720 });
  const root = new Node({ name: 'root' });
  const cam = new Camera2D({ name: 'cam', pos: camPos, zoom, current: true });
  root.addChild(cam);
  world.setRoot(root);
  world.step(); // enter tree → onReady registers activeCamera
  return { world, cam };
}

describe('Camera2D view transform', () => {
  it('with no camera, world == screen (identity)', () => {
    const world = new World({ seed: 1 });
    world.setRoot(new Node({ name: 'root' }));
    world.step();
    expect(world.activeCamera).toBeNull();
    const p = { x: 123, y: -45 };
    expect(world.worldToScreen(p)).toEqual(p);
    expect(world.screenToWorld(p)).toEqual(p);
  });

  it('a camera at the origin puts world-origin at screen center', () => {
    const { world } = worldWithCamera({ x: 0, y: 0 });
    const c = world.worldToScreen({ x: 0, y: 0 });
    expect(c.x).toBeCloseTo(640);
    expect(c.y).toBeCloseTo(360);
  });

  it('the camera position maps to screen center', () => {
    const { world } = worldWithCamera({ x: 1000, y: 500 });
    const c = world.worldToScreen({ x: 1000, y: 500 });
    expect(c.x).toBeCloseTo(640);
    expect(c.y).toBeCloseTo(360);
  });

  it('zoom scales world distance around the camera center', () => {
    const { world } = worldWithCamera({ x: 0, y: 0 }, 2);
    const c = world.worldToScreen({ x: 100, y: 0 });
    expect(c.x).toBeCloseTo(640 + 200); // 100 world px → 200 screen px at 2×
    expect(c.y).toBeCloseTo(360);
  });
});

describe('screenToWorld is the exact inverse of the view', () => {
  it('round-trips arbitrary points under a scrolled, zoomed camera', () => {
    const { world } = worldWithCamera({ x: 742, y: -318 }, 1.75);
    for (const p of [
      { x: 0, y: 0 },
      { x: 640, y: 360 },
      { x: 1280, y: 720 },
      { x: -50, y: 900 },
    ]) {
      const back = world.screenToWorld(world.worldToScreen(p));
      expect(back.x).toBeCloseTo(p.x);
      expect(back.y).toBeCloseTo(p.y);
    }
  });

  it('screen center always resolves to the camera position', () => {
    const { world, cam } = worldWithCamera({ x: 333, y: 222 }, 1.4);
    const w = world.screenToWorld({ x: 640, y: 360 });
    expect(w.x).toBeCloseTo(cam.pos.x);
    expect(w.y).toBeCloseTo(cam.pos.y);
  });
});

describe('CameraController follow', () => {
  it('snaps the camera onto the target on ready (frame 0 is framed)', () => {
    const world = new World({ seed: 1, width: 1280, height: 720 });
    const root = new Node({ name: 'root' });
    const cam = new Camera2D({ name: 'cam', current: true });
    const target = new Sprite({ name: 't', pos: { x: 900, y: 400 }, shape: { kind: 'circle', radius: 8 } });
    root.addChild(cam);
    root.addChild(target);
    root.addChild(new CameraController({ target, smooth: 0.2 }));
    world.setRoot(root);
    world.step();
    expect(cam.pos.x).toBeCloseTo(900);
    expect(cam.pos.y).toBeCloseTo(400);
  });

  it('a deadzone lets the target roam before the camera moves', () => {
    const world = new World({ seed: 1, width: 1280, height: 720 });
    const root = new Node({ name: 'root' });
    const cam = new Camera2D({ name: 'cam', pos: { x: 0, y: 0 }, current: true });
    const target = new Sprite({ name: 't', pos: { x: 0, y: 0 }, shape: { kind: 'circle', radius: 8 } });
    root.addChild(cam);
    root.addChild(target);
    root.addChild(new CameraController({ target, deadzone: 100, smooth: 1 }));
    world.setRoot(root);
    world.step(); // snap to (0,0)

    target.pos.x = 60; // inside the 100px slack box
    world.step();
    expect(cam.pos.x).toBeCloseTo(0);

    target.pos.x = 260; // 160px out → camera trails by exactly the deadzone
    world.step();
    expect(cam.pos.x).toBeCloseTo(160);
  });

  it('clamps the camera so the view never leaves the world bounds', () => {
    const world = new World({ seed: 1, width: 1280, height: 720 });
    const root = new Node({ name: 'root' });
    const cam = new Camera2D({ name: 'cam', current: true });
    const target = new Sprite({ name: 't', pos: { x: 0, y: 0 }, shape: { kind: 'circle', radius: 8 } });
    root.addChild(cam);
    root.addChild(target);
    root.addChild(
      new CameraController({ target, smooth: 1, bounds: { minX: 0, minY: 0, maxX: 3200, maxY: 1800 } }),
    );
    world.setRoot(root);
    world.step();
    // Target at the world origin, but the view can't show past x<0 / y<0:
    // the center is pinned to half the viewport (640, 360).
    expect(cam.pos.x).toBeCloseTo(640);
    expect(cam.pos.y).toBeCloseTo(360);

    target.pos.x = 5000; // far past the far edge
    target.pos.y = 5000;
    world.step();
    expect(cam.pos.x).toBeCloseTo(3200 - 640);
    expect(cam.pos.y).toBeCloseTo(1800 - 360);
  });

  it('is cosmetic: following never changes world.hash()', () => {
    const build = () => {
      const root = new Node({ name: 'root' });
      const cam = new Camera2D({ name: 'cam', current: true });
      cam.cosmetic = true;
      const target = new Sprite({ name: 't', pos: { x: 0, y: 0 }, shape: { kind: 'circle', radius: 8 } });
      root.addChild(cam);
      root.addChild(target);
      root.addChild(new CameraController({ target, smooth: 0.3, bounds: { minX: 0, minY: 0, maxX: 3200, maxY: 1800 } }));
      return root;
    };
    const a = new World({ seed: 1 });
    a.setRoot(build());
    const b = new World({ seed: 1 });
    b.setRoot(build());
    // Drive both identically; hashes must track only the (canonical) target.
    for (let f = 0; f < 30; f++) {
      a.step();
      b.step();
    }
    expect(a.hash()).toBe(b.hash());
  });
});

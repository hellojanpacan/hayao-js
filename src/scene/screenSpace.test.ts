import { describe, it, expect } from 'vitest';
import { Node } from './node';
import { Sprite, Camera2D } from './nodes';
import { deserializeNode } from './registry';
import { World } from '../world';
import type { DrawCommand, RectCommand } from '../render/commands';
import type { Transform } from '../core/math';

/** A world with an offset, zoomed camera so world-space ≠ design-space. */
function offsetCameraWorld(): { world: World; root: Node } {
  const world = new World({ seed: 1, width: 200, height: 100 });
  const root = new Node({ name: 'root' });
  root.addChild(new Camera2D({ pos: { x: 500, y: 300 }, zoom: 2 }));
  world.setRoot(root);
  return { world, root };
}

describe('screenSpace', () => {
  it('a screenSpace subtree ignores the camera (IDENTITY basing, design-space coords)', () => {
    const { world, root } = offsetCameraWorld();
    root.addChild(new Sprite({ name: 'world', shape: { kind: 'rect', w: 10, h: 10 }, fill: '#000', pos: { x: 500, y: 300 } }));
    const hud = root.addChild(new Node({ name: 'hud', pos: { x: 20, y: 30 } }));
    hud.screenSpace = true;
    hud.addChild(new Sprite({ name: 'label', shape: { kind: 'rect', w: 4, h: 4 }, fill: '#000', pos: { x: 5, y: 5 } }));
    const cmds = world.render();
    const [worldCmd, hudCmd] = cmds;
    // World sprite at the camera center lands at design center, zoomed.
    expect(worldCmd.transform.e).toBeCloseTo(100);
    expect(worldCmd.transform.f).toBeCloseTo(50);
    expect(worldCmd.transform.a).toBeCloseTo(2);
    // HUD sprite composes from IDENTITY: hud pos + child pos, camera nowhere.
    expect(hudCmd.transform.e).toBeCloseTo(25);
    expect(hudCmd.transform.f).toBeCloseTo(35);
    expect(hudCmd.transform.a).toBeCloseTo(1);
  });

  it('tags every command in the subtree with layer 1; world commands stay untagged', () => {
    const { world, root } = offsetCameraWorld();
    root.addChild(new Sprite({ name: 'world', shape: { kind: 'rect', w: 10, h: 10 }, fill: '#000' }));
    const hud = root.addChild(new Node({ name: 'hud' }));
    hud.screenSpace = true;
    hud.addChild(new Sprite({ name: 'a', shape: { kind: 'rect', w: 4, h: 4 }, fill: '#000' }));
    hud.addChild(new Sprite({ name: 'b', shape: { kind: 'circle', radius: 2 }, fill: '#000' }));
    const cmds = world.render();
    expect(cmds[0].layer ?? 0).toBe(0);
    expect(cmds[1].layer).toBe(1);
    expect(cmds[2].layer).toBe(1);
  });

  it('respects a command that already set a HIGHER layer', () => {
    class TopmostSprite extends Node {
      protected override draw(out: DrawCommand[], world: Transform): void {
        const cmd: RectCommand = { kind: 'rect', x: 0, y: 0, w: 1, h: 1, z: 0, transform: world, layer: 2 };
        out.push(cmd);
      }
    }
    const { world, root } = offsetCameraWorld();
    const hud = root.addChild(new Node({ name: 'hud' }));
    hud.screenSpace = true;
    hud.addChild(new TopmostSprite({ name: 'top' }));
    hud.addChild(new Sprite({ name: 'plain', shape: { kind: 'rect', w: 4, h: 4 }, fill: '#000' }));
    const cmds = world.render();
    expect(cmds[0].layer).toBe(2); // pre-set higher layer wins
    expect(cmds[1].layer).toBe(1);
  });

  it('serializes only when true and round-trips', () => {
    const root = new Node({ name: 'root' });
    const hud = root.addChild(new Node({ name: 'hud' }));
    hud.screenSpace = true;
    const data = root.serialize();
    expect('screenSpace' in data.props).toBe(false); // default stays out (pinned hashes)
    expect(data.children[0].props.screenSpace).toBe(true);
    const clone = deserializeNode(data);
    expect(clone.find('hud')!.screenSpace).toBe(true);
    expect(clone.screenSpace).toBe(false);
  });
});

// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { bootDom } from './dom';
import { TouchControls } from '../ui/touch';
import { defineGame } from '../app/game';
import { Node } from '../scene/node';

// A trivial game: a token that moves left/right from held actions and fires a
// counter. Proves the host touch layer reaches the sim's probe() — the layer the
// headless proofs cannot see.
const def = defineGame({
  title: 'touch-probe',
  width: 200,
  height: 200,
  inputMap: { left: ['ArrowLeft'], right: ['ArrowRight'], fire: ['Space'] },
  build(world) {
    const state = world.state as { x: number; shots: number };
    state.x = 100;
    state.shots = 0;
    const root = new Node({ name: 'root' });
    root.onUpdate = (_n, _dt, ctx) => {
      if (ctx.input.isDown('left')) state.x -= 1;
      if (ctx.input.isDown('right')) state.x += 1;
      if (ctx.input.justPressed('fire')) state.shots += 1;
    };
    return root;
  },
  probe: (world) => world.state as { x: number; shots: number },
});

describe('verify/dom host-layer proof', () => {
  it('a held virtual action moves the token via setHeld', () => {
    const h = bootDom(def);
    h.handle.input.setHeld('right');
    h.step(10);
    expect((h.handle.world.probe() as { x: number }).x).toBe(110);
    h.handle.input.releaseHeld('right');
    h.step(5);
    expect((h.handle.world.probe() as { x: number }).x).toBe(110); // no drift after release
    h.dispose();
  });

  it('TouchControls buttons drive the same action set', () => {
    const h = bootDom(def);
    const tc = new TouchControls(h.handle, { touchOnly: false, buttons: [{ action: 'fire', hold: false }] });
    const btn = document.querySelector('.hy-btn') as HTMLElement;
    expect(btn).toBeTruthy();
    const ev = new Event('pointerdown', { bubbles: true }) as Event & { pointerId: number };
    ev.pointerId = 1;
    btn.dispatchEvent(ev);
    h.step(1);
    expect((h.handle.world.probe() as { shots: number }).shots).toBe(1);
    tc.dispose();
    h.dispose();
  });
});

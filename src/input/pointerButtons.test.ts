import { describe, expect, it } from 'vitest';
import { KeyboardSource, PointerSource } from './source';
import { InputState } from './actions';

// Same stub approach as source.test.ts: an EventTarget standing in for the
// renderer element, plain Events with the PointerEvent fields assigned on.
function fakeTarget() {
  const element = new EventTarget();
  return { element: element as unknown as HTMLElement, toDesign: (x: number, y: number) => ({ x, y }) };
}
const ev = (type: string, fields: Record<string, unknown> = {}) => Object.assign(new Event(type), { clientX: 0, clientY: 0, ...fields });

describe('PointerSource secondary buttons', () => {
  it('samples right/middle buttons into pointer.right / pointer.middle axes', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const ps = new PointerSource(target);
    const input = new InputState();

    ps.sample(input);
    expect(input.axis('pointer.right')).toBe(0);
    expect(input.axis('pointer.middle')).toBe(0);

    // Right button down: buttons bitmask 2 (primary NOT pressed).
    el.dispatchEvent(ev('pointerdown', { buttons: 2, button: 2 }));
    ps.sample(input);
    expect(input.axis('pointer.right')).toBe(1);
    expect(input.axis('pointer.down')).toBe(0);
    expect(input.axis('pointer.middle')).toBe(0);

    // Release (last button up → buttons 0).
    el.dispatchEvent(ev('pointerup', { buttons: 0, button: 2 }));
    ps.sample(input);
    expect(input.axis('pointer.right')).toBe(0);

    // Middle button.
    el.dispatchEvent(ev('pointerdown', { buttons: 4, button: 1 }));
    ps.sample(input);
    expect(input.axis('pointer.middle')).toBe(1);
    el.dispatchEvent(ev('pointerup', { buttons: 0, button: 1 }));
    ps.sample(input);
    expect(input.axis('pointer.middle')).toBe(0);

    ps.dispose();
  });

  it('tracks chorded button changes arriving as pointermove (buttons bitmask)', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const ps = new PointerSource(target);
    const input = new InputState();

    el.dispatchEvent(ev('pointerdown', { buttons: 1, button: 0 }));
    ps.sample(input);
    expect(input.axis('pointer.down')).toBe(1);

    // Right pressed while left held → spec delivers a pointermove with buttons=3.
    el.dispatchEvent(ev('pointermove', { buttons: 3 }));
    ps.sample(input);
    expect(input.axis('pointer.down')).toBe(1);
    expect(input.axis('pointer.right')).toBe(1);

    // Left released while right held → pointermove with buttons=2.
    el.dispatchEvent(ev('pointermove', { buttons: 2 }));
    ps.sample(input);
    expect(input.axis('pointer.down')).toBe(0);
    expect(input.axis('pointer.right')).toBe(1);

    // Hover-only move (buttons=0 on move) must NOT clear anything by itself…
    el.dispatchEvent(ev('pointerdown', { buttons: 1, button: 0 }));
    el.dispatchEvent(ev('pointermove', { buttons: 0 }));
    ps.sample(input);
    expect(input.axis('pointer.down')).toBe(1);

    ps.dispose();
  });

  it('falls back to e.button when the buttons bitmask is absent (stub events)', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const ps = new PointerSource(target);
    const input = new InputState();

    el.dispatchEvent(ev('pointerdown', { button: 2 }));
    ps.sample(input);
    expect(input.axis('pointer.right')).toBe(1);
    expect(input.axis('pointer.down')).toBe(0);

    el.dispatchEvent(ev('pointerup', { button: 2 }));
    ps.sample(input);
    expect(input.axis('pointer.right')).toBe(0);
    ps.dispose();
  });

  it('suppresses the context menu by default; contextMenu: true allows it', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const ps = new PointerSource(target);
    const ctx = new Event('contextmenu', { cancelable: true });
    el.dispatchEvent(ctx);
    expect(ctx.defaultPrevented).toBe(true);
    ps.dispose();

    const ps2 = new PointerSource(target, { contextMenu: true });
    const ctx2 = new Event('contextmenu', { cancelable: true });
    el.dispatchEvent(ctx2);
    expect(ctx2.defaultPrevented).toBe(false);
    ps2.dispose();
  });

  it('routes buttons through the action pipeline as mouse.left/right/middle', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const keyboard = new KeyboardSource({ shield: ['mouse.right'] }, new EventTarget() as unknown as Document);
    const ps = new PointerSource(target, { keyboard });
    const input = new InputState();

    ps.sample(input);
    input.beginFrame(keyboard.currentActions());
    expect(input.isDown('mouse.right')).toBe(false);

    el.dispatchEvent(ev('pointerdown', { buttons: 2, button: 2 }));
    ps.sample(input);
    input.beginFrame(keyboard.currentActions());
    // The raw held name AND the inputMap binding both resolve, and the edge is
    // visible via justPressed — buttons live in the same actionsDown log as keys.
    expect(input.isDown('mouse.right')).toBe(true);
    expect(input.justPressed('mouse.right')).toBe(true);
    expect(input.isDown('shield')).toBe(true);
    expect(input.justPressed('shield')).toBe(true);

    ps.sample(input);
    input.beginFrame(keyboard.currentActions());
    expect(input.isDown('shield')).toBe(true);
    expect(input.justPressed('shield')).toBe(false);

    el.dispatchEvent(ev('pointerup', { buttons: 0, button: 2 }));
    ps.sample(input);
    input.beginFrame(keyboard.currentActions());
    expect(input.isDown('shield')).toBe(false);
    expect(input.justReleased('shield')).toBe(true);
    expect(input.justReleased('mouse.right')).toBe(true);

    // Primary press → mouse.left ("pointer.justDown" for free).
    el.dispatchEvent(ev('pointerdown', { buttons: 1, button: 0 }));
    ps.sample(input);
    input.beginFrame(keyboard.currentActions());
    expect(input.justPressed('mouse.left')).toBe(true);

    // dispose releases the held mouse actions.
    ps.dispose();
    expect(keyboard.currentActions()).toEqual([]);
    keyboard.dispose();
  });
});

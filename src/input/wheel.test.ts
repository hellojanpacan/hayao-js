// Wheel + relative-motion sampling on PointerSource, and the device tracker.
// Same stub approach as pointerButtons.test.ts.

import { describe, expect, it } from 'vitest';
import { InputState } from './actions';
import { InputDeviceTracker } from './device';
import { PointerSource } from './source';

function fakeTarget() {
  const element = new EventTarget();
  return { element: element as unknown as HTMLElement, toDesign: (x: number, y: number) => ({ x, y }) };
}
const ev = (type: string, fields: Record<string, unknown> = {}) => Object.assign(new Event(type), { clientX: 0, clientY: 0, ...fields });

describe('PointerSource wheel axis', () => {
  it('quantizes accumulated deltaY into integer notches, remainder carries', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const ps = new PointerSource(target);
    const input = new InputState();

    ps.sample(input);
    expect(input.axis('pointer.wheel')).toBe(0);

    // One Chrome-style notch (100px) + a bit.
    el.dispatchEvent(ev('wheel', { deltaY: 100, deltaMode: 0 }));
    el.dispatchEvent(ev('wheel', { deltaY: 30, deltaMode: 0 }));
    ps.sample(input);
    expect(input.axis('pointer.wheel')).toBe(1);

    // The 30px remainder + 80 more crosses the next notch.
    el.dispatchEvent(ev('wheel', { deltaY: 80, deltaMode: 0 }));
    ps.sample(input);
    expect(input.axis('pointer.wheel')).toBe(1);

    // Nothing new → 0 (per-step delta, not a running total).
    ps.sample(input);
    expect(input.axis('pointer.wheel')).toBe(0);

    // Scroll up reads negative; line mode (Firefox) normalizes ~40px/line.
    el.dispatchEvent(ev('wheel', { deltaY: -3, deltaMode: 1 }));
    ps.sample(input);
    expect(input.axis('pointer.wheel')).toBe(-1);

    ps.dispose();
  });
});

describe('PointerSource relative motion (pointer.dx/dy)', () => {
  it('accumulates movementX/Y between samples and resets after each', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const ps = new PointerSource(target);
    const input = new InputState();

    el.dispatchEvent(ev('pointermove', { movementX: 4, movementY: -2 }));
    el.dispatchEvent(ev('pointermove', { movementX: 3, movementY: 1 }));
    ps.sample(input);
    expect(input.axis('pointer.dx')).toBe(7);
    expect(input.axis('pointer.dy')).toBe(-1);

    ps.sample(input);
    expect(input.axis('pointer.dx')).toBe(0);
    expect(input.axis('pointer.dy')).toBe(0);

    ps.dispose();
  });
});

describe('InputDeviceTracker', () => {
  it('switches on DOM activity and emits only on change', () => {
    const tracker = new InputDeviceTracker();
    const seen: string[] = [];
    tracker.changed.connect((d) => seen.push(d));

    expect(tracker.current).toBe('keyboard');
    tracker.note('mouse');
    tracker.note('mouse');
    tracker.note('gamepad');
    tracker.note('keyboard');
    expect(seen).toEqual(['mouse', 'gamepad', 'keyboard']);

    tracker.dispose();
  });

  it('sample() is safe without navigator.getGamepads', () => {
    const tracker = new InputDeviceTracker({ initial: 'touch' });
    tracker.sample(new InputState());
    expect(tracker.current).toBe('touch');
    tracker.dispose();
  });
});

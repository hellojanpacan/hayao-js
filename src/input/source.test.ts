import { describe, expect, it } from 'vitest';
import { PointerSource, KeyboardSource } from './source';
import { InputState } from './actions';

// A fake renderer target: an EventTarget for listeners + a toDesign that offsets
// so we can prove the source runs client coords through the design mapper.
function fakeTarget() {
  const element = new EventTarget();
  return { element: element as unknown as HTMLElement, toDesign: (x: number, y: number) => ({ x: x - 10, y: y - 20 }) };
}
const move = (t: string, clientX: number, clientY: number) => Object.assign(new Event(t), { clientX, clientY });

describe('PointerSource', () => {
  it('samples pointer position into design-space axes', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const ps = new PointerSource(target);
    const input = new InputState();

    ps.sample(input);
    expect(input.axis('pointer.x')).toBe(-10); // toDesign(0,0)
    expect(input.axis('pointer.down')).toBe(0);
    expect(ps.read().active).toBe(false);

    el.dispatchEvent(move('pointermove', 100, 50));
    ps.sample(input);
    expect(input.axis('pointer.x')).toBe(90);
    expect(input.axis('pointer.y')).toBe(30);
    expect(ps.read().active).toBe(true);

    el.dispatchEvent(move('pointerdown', 200, 60));
    ps.sample(input);
    expect(input.axis('pointer.x')).toBe(190);
    expect(input.axis('pointer.down')).toBe(1);

    ps.dispose();
  });

  it('tracks simultaneous touches via readAll(), keyed by id', () => {
    const target = fakeTarget();
    const el = target.element as unknown as EventTarget;
    const ps = new PointerSource(target);
    const touch = (t: string, id: number, x: number, y: number) => Object.assign(new Event(t), { clientX: x, clientY: y, pointerId: id });

    el.dispatchEvent(touch('pointerdown', 2, 100, 100));
    el.dispatchEvent(touch('pointerdown', 5, 300, 200));
    let all = ps.readAll();
    expect(all.map((p) => p.id)).toEqual([2, 5]); // sorted by id
    expect(all[0]).toMatchObject({ x: 90, y: 80, down: true, id: 2 });
    expect(all[1]).toMatchObject({ x: 290, y: 180, id: 5 });

    el.dispatchEvent(touch('pointermove', 2, 120, 100));
    expect(ps.readAll()[0].x).toBe(110);

    el.dispatchEvent(touch('pointerup', 2, 120, 100));
    all = ps.readAll();
    expect(all.map((p) => p.id)).toEqual([5]);
    ps.dispose();
  });
});

describe('KeyboardSource sustained input', () => {
  it('setHeld keeps an action in currentActions until released', () => {
    const k = new KeyboardSource({ jump: ['Space'] }, new EventTarget() as unknown as Document);
    expect(k.currentActions()).toEqual([]);
    k.setHeld('left');
    expect(k.currentActions()).toEqual(['left']);
    // Held survives a clearPressed (unlike a one-shot press()).
    k.clearPressed();
    expect(k.currentActions()).toEqual(['left']);
    k.press('fire'); // one-shot, unions in
    expect(k.currentActions()).toEqual(['fire', 'left']);
    k.clearPressed();
    expect(k.currentActions()).toEqual(['left']);
    k.releaseHeld('left');
    expect(k.currentActions()).toEqual([]);
    k.dispose();
  });
});

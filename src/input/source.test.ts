import { describe, expect, it } from 'vitest';
import { PointerSource } from './source';
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
});

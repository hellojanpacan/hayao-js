// @vitest-environment happy-dom
// The menu navigation kit: focus ring, slider/toggle rows, and the screenNav()
// seam that keyboard AND gamepad both drive.

import { afterEach, describe, expect, it } from 'vitest';
import { hideScreen, screenNav, showScreen } from './overlay';

afterEach(() => hideScreen());

const key = (code: string) => document.dispatchEvent(Object.assign(new KeyboardEvent('keydown', { code }), {}));

describe('showScreen navigation seam', () => {
  it('exposes screenNav() while up, null after close', () => {
    expect(screenNav()).toBeNull();
    const h = showScreen({ title: 'T', actions: [{ label: 'Go', onSelect: () => {} }] });
    expect(screenNav()).not.toBeNull();
    h.close();
    expect(screenNav()).toBeNull();
  });

  it('move() wraps the focus ring; select() activates the focused row', () => {
    const hits: string[] = [];
    showScreen({
      actions: [
        { label: 'A', onSelect: () => hits.push('A') },
        { label: 'B', onSelect: () => hits.push('B') },
        { label: 'C', onSelect: () => hits.push('C') },
      ],
    });
    const nav = screenNav()!;
    nav.select();
    nav.move(1);
    nav.select();
    nav.move(-2); // wraps from B up past A to C
    nav.select();
    expect(hits).toEqual(['A', 'B', 'C']);
  });

  it('sliders adjust by step, clamp at the ends, and report via onChange', () => {
    const seen: number[] = [];
    showScreen({
      actions: [{ label: 'Music', slider: { value: 0.5, step: 0.1, onChange: (v) => seen.push(v) } }],
    });
    const nav = screenNav()!;
    nav.adjust(1);
    nav.adjust(1);
    nav.adjust(-1);
    for (let i = 0; i < 12; i++) nav.adjust(1); // slam into the max
    expect(seen[0]).toBeCloseTo(0.6, 9);
    expect(seen[1]).toBeCloseTo(0.7, 9);
    expect(seen[2]).toBeCloseTo(0.6, 9);
    expect(seen[seen.length - 1]).toBe(1);
    expect(seen.every((v) => v >= 0 && v <= 1)).toBe(true);
  });

  it('toggles flip on select() and on adjust()', () => {
    const seen: boolean[] = [];
    showScreen({ actions: [{ label: 'Mute', toggle: { value: false, onChange: (v) => seen.push(v) } }] });
    const nav = screenNav()!;
    nav.select();
    nav.adjust(1);
    expect(seen).toEqual([true, false]);
  });

  it('cancel() fires the screen onCancel', () => {
    let cancelled = 0;
    showScreen({ actions: [{ label: 'X', onSelect: () => {} }], onCancel: () => cancelled++ });
    screenNav()!.cancel();
    expect(cancelled).toBe(1);
  });

  it('arrow keys drive the same seam (left/right adjust, enter selects)', () => {
    const seen: number[] = [];
    let resumed = 0;
    showScreen({
      actions: [
        { label: 'Resume', onSelect: () => resumed++ },
        { label: 'Vol', slider: { value: 0.5, step: 0.25, onChange: (v) => seen.push(v) } },
      ],
    });
    key('Enter');
    key('ArrowDown');
    key('ArrowRight');
    key('ArrowLeft');
    expect(resumed).toBe(1);
    expect(seen[0]).toBe(0.75);
    expect(seen[1]).toBe(0.5);
  });

  it('renders slider value + meter and updates them in place', () => {
    const h = showScreen({ actions: [{ label: 'Vol', slider: { value: 0.5, step: 0.1, onChange: () => {} } }] });
    const val = () => h.element.querySelector('.hy-val')!.textContent;
    expect(val()).toBe('50');
    screenNav()!.adjust(1);
    expect(val()).toBe('60');
    const bar = h.element.querySelector('.hy-meter > i') as HTMLElement;
    expect(bar.style.width).toBe('60%');
  });
});

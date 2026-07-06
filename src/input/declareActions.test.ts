import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputState } from './actions';

describe('InputState.declareActions warn-once', () => {
  afterEach(() => vi.restoreAllMocks());

  it('never warns when nothing has been declared (headless worlds)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const input = new InputState();
    input.beginFrame(['right']);
    expect(input.isDown('rihgt')).toBe(false); // typo, but no sources → silent
    expect(input.justPressed('anything')).toBe(false);
    expect(input.justReleased('anything')).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns ONCE per unknown name after a declaration, listing declared names', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const input = new InputState();
    input.declareActions(['jump', 'left', 'right']);

    input.beginFrame(['jump']);
    expect(input.isDown('jump')).toBe(true); // declared → silent
    expect(warn).not.toHaveBeenCalled();

    expect(input.isDown('jmup')).toBe(false); // typo → warn
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"jmup"');
    expect(warn.mock.calls[0][0]).toContain('jump'); // lists the declared names

    // Same name again, via any query kind → no second warn.
    input.isDown('jmup');
    input.justPressed('jmup');
    input.justReleased('jmup');
    expect(warn).toHaveBeenCalledTimes(1);

    // A different unknown name gets its own single warn.
    input.justPressed('fire');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('declarations are additive across sources', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const input = new InputState();
    input.declareActions(['jump']);
    input.declareActions(['mouse.left', 'mouse.right']);
    input.isDown('mouse.right');
    input.isDown('jump');
    expect(warn).not.toHaveBeenCalled();
  });

  it('actions actually delivered by a frame count as declared (virtual taps)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const input = new InputState();
    input.declareActions(['jump']);
    // A DOM button's input.press('fire') arrives via beginFrame without any
    // source declaring it — that must not false-warn, this frame or later.
    input.beginFrame(['fire']);
    expect(input.isDown('fire')).toBe(true);
    input.beginFrame([]);
    expect(input.justReleased('fire')).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });
});

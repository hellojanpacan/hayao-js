import { describe, it, expect } from 'vitest';
import { InputState, InputRecorder, snapAxis, quantizeAngle, frameAxes, type InputLog } from './actions';

describe('snapAxis / quantizeAngle', () => {
  it('snapAxis is deterministic and lands on bucket boundaries', () => {
    // 5 buckets over [-1,1] ⇒ steps at -1,-0.5,0,0.5,1.
    expect(snapAxis(0.24, 5)).toBeCloseTo(0, 10);
    expect(snapAxis(0.26, 5)).toBeCloseTo(0.5, 10);
    expect(snapAxis(-0.9, 5)).toBeCloseTo(-1, 10);
    expect(snapAxis(0.7, 5)).toBe(snapAxis(0.7, 5));
  });
  it('quantizeAngle snaps to evenly spaced headings', () => {
    const step = (Math.PI * 2) / 8;
    expect(quantizeAngle(step * 1.1, 8)).toBeCloseTo(step, 10);
    expect(quantizeAngle(-step * 0.4, 8)).toBeCloseTo(0, 10);
  });
});

describe('logged axes enter hash + replay, unused axes do not', () => {
  it('getState omits axes when none are logged (hash stability)', () => {
    const s = new InputState();
    s.beginFrame(['x']);
    expect('axes' in s.getState()).toBe(false);
  });
  it('getState carries sorted logged axes when present', () => {
    const s = new InputState();
    s.beginFrame(['x'], { aim: 0.5, throttle: 1 });
    expect(s.getState().axes).toEqual([['aim', 0.5], ['throttle', 1]]);
    expect(s.axis('aim')).toBe(0.5); // also readable
  });
  it('setState round-trips logged axes', () => {
    const s = new InputState();
    s.beginFrame(['x'], { aim: -0.25 });
    const t = new InputState();
    t.setState(s.getState());
    expect(t.getState().axes).toEqual([['aim', -0.25]]);
    expect(t.axis('aim')).toBe(-0.25);
  });
});

describe('InputRecorder axes track', () => {
  it('is absent unless a frame logged axes, then aligns to frames', () => {
    const r = new InputRecorder();
    r.record(['a']);
    r.record(['b'], { aim: 0.5 });
    const log: InputLog = r.toLog();
    expect(log.frames).toEqual([['a'], ['b']]);
    expect(log.axes).toEqual([undefined, { aim: 0.5 }]);
    expect(frameAxes(log, 0)).toBeUndefined();
    expect(frameAxes(log, 1)).toEqual({ aim: 0.5 });
  });
  it('omits the axes track entirely when no frame logged any', () => {
    const r = new InputRecorder();
    r.record(['a']);
    expect(r.toLog().axes).toBeUndefined();
  });
});

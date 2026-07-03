import { describe, it, expect } from 'vitest';
import { recordTimeline, firstFrame, series, changeFrames, isMonotonic, inputDensity, longestLull } from './feel';
import { renderFilmstrip } from './filmstrip';
import { World } from '../world';
import { Node } from '../scene/node';
import { Sprite } from '../scene/nodes';

/** A world whose probe counts steps and flags `hot` while 'go' is held. */
function makeWorld(): World {
  const w = new World({ seed: 7 });
  const root = new Node({ name: 'root' });
  const dot = new Sprite({ name: 'dot', shape: { kind: 'circle', radius: 6 }, fill: '#c33' });
  root.addChild(dot);
  w.setRoot(root);
  w.state.steps = 0;
  w.state.hot = false;
  dot.onUpdate = () => {
    w.state.steps = (w.state.steps as number) + 1;
    w.state.hot = w.input.isDown('go');
    dot.pos.x = (w.state.steps as number) * 2;
  };
  const base = w.probe.bind(w);
  w.probe = () => ({ ...base(), steps: w.state.steps, hot: w.state.hot });
  return w;
}

describe('feel timeline', () => {
  it('recordTimeline probes before and after every frame', () => {
    const tl = recordTimeline(makeWorld(), [[], ['go'], []]);
    expect(tl).toHaveLength(4);
    expect(series(tl, 'steps')).toEqual([0, 1, 2, 3]);
  });

  it('firstFrame finds the first frame matching a predicate', () => {
    const tl = recordTimeline(makeWorld(), [[], [], ['go'], ['go']]);
    expect(firstFrame(tl, (p) => p.hot === true)).toBe(3);
    expect(firstFrame(tl, (p) => p.steps === 99)).toBe(-1);
  });

  it('changeFrames yields the event cadence of a key', () => {
    const tl = recordTimeline(makeWorld(), [[], ['go'], ['go'], []]);
    expect(changeFrames(tl, 'hot')).toEqual([2, 4]);
  });

  it('isMonotonic honours direction and slack', () => {
    expect(isMonotonic([1, 2, 2, 5], 'up')).toBe(true);
    expect(isMonotonic([1, 3, 2], 'up')).toBe(false);
    expect(isMonotonic([1, 3, 2.5], 'up', 0.6)).toBe(true);
    expect(isMonotonic([5, 4, 4, 1], 'down')).toBe(true);
  });

  it('inputDensity and longestLull quantify engagement and dead air', () => {
    expect(inputDensity([[], ['a'], ['a', 'b'], []])).toBe(0.5);
    expect(inputDensity([])).toBe(0);
    expect(longestLull([10, 40], 100)).toBe(60);
    expect(longestLull([], 100)).toBe(100);
  });
});

describe('filmstrip', () => {
  it('composes sampled frames into one SVG with labels', () => {
    const svg = renderFilmstrip(makeWorld(), Array.from({ length: 90 }, () => [] as string[]), {
      width: 320,
      height: 180,
      panels: 4,
    });
    expect(svg.startsWith('<svg')).toBe(true);
    // First + last frames always sampled; label carries frame and seconds.
    expect(svg).toContain('f 0 · 0.0s');
    expect(svg).toContain('f 90 · 1.5s');
    // One nested <svg> per panel (plus the outer document).
    expect(svg.match(/<svg/g)!.length).toBeGreaterThanOrEqual(4);
  });

  it('advances the world it renders', () => {
    const w = makeWorld();
    renderFilmstrip(w, [[], [], []], { width: 320, height: 180, panels: 2 });
    expect(w.probe().steps).toBe(3);
  });
});

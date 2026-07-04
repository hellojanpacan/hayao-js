import { describe, expect, it } from 'vitest';
import { clientToDesign } from './renderer';

describe('clientToDesign (letterbox inverse)', () => {
  it('is identity when the element exactly fits the design box', () => {
    const rect = { left: 0, top: 0, width: 1280, height: 720 };
    expect(clientToDesign(rect, 1280, 720, 640, 360)).toEqual({ x: 640, y: 360 });
    expect(clientToDesign(rect, 1280, 720, 0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('undoes horizontal pillarboxing (element wider than design ratio)', () => {
    // 1440×720 element, 1280×720 design → scale 1, 80px bars left/right.
    const rect = { left: 0, top: 0, width: 1440, height: 720 };
    expect(clientToDesign(rect, 1280, 720, 80, 0)).toEqual({ x: 0, y: 0 });
    expect(clientToDesign(rect, 1280, 720, 720, 360)).toEqual({ x: 640, y: 360 });
  });

  it('undoes uniform scale and honours the element origin', () => {
    // Half-size element, offset 100,50 on screen.
    const rect = { left: 100, top: 50, width: 640, height: 360 };
    expect(clientToDesign(rect, 1280, 720, 100, 50)).toEqual({ x: 0, y: 0 });
    expect(clientToDesign(rect, 1280, 720, 420, 230)).toEqual({ x: 640, y: 360 });
  });
});

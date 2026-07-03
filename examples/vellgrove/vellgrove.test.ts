import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { initialVg, makeCar, onTrack, stepCar, stepVg, trackDistance, CAR } from './logic';
import { vellgroveGame, vgState } from './game';

const DT = 1 / 60;
const coast = { throttle: 0, brake: 0, steer: 0 };

describe('track geometry', () => {
  it('centreline points are on-track; the infield is not', () => {
    expect(onTrack(500, 110)).toBe(true);
    expect(onTrack(640, 360)).toBe(false);
    expect(trackDistance(500, 110)).toBeLessThan(2);
  });
});

describe('car physics', () => {
  it('accelerates under throttle up to the cap', () => {
    const c = makeCar(0);
    c.x = 500;
    c.y = 110;
    c.heading = 0;
    let peak = 0;
    for (let f = 0; f < 100; f++) {
      stepCar(c, { throttle: 1, brake: 0, steer: 0 }, DT);
      peak = Math.max(peak, Math.hypot(c.vx, c.vy));
    }
    expect(peak).toBeLessThanOrEqual(CAR.maxSpeed + 1);
    expect(peak).toBeGreaterThan(CAR.maxSpeed * 0.8);
  });

  it('grip kills lateral slip (a hard turn sheds sideways velocity)', () => {
    const c = makeCar(0);
    c.x = 500;
    c.y = 110;
    c.heading = 0;
    c.vx = 300;
    // Point the car up while moving right — lateral speed must decay fast.
    c.heading = -Math.PI / 2;
    for (let f = 0; f < 60; f++) stepCar(c, coast, DT);
    const lateral = Math.abs(c.vx); // vx is now sideways relative to heading
    expect(lateral).toBeLessThan(120); // grip sheds most of it inside a second
  });

  it('steering authority vanishes at standstill', () => {
    const c = makeCar(0);
    const h0 = c.heading;
    for (let f = 0; f < 60; f++) stepCar(c, { throttle: 0, brake: 0, steer: 1 }, DT);
    expect(Math.abs(c.heading - h0)).toBeLessThan(0.05);
  });
});

describe('race flow', () => {
  it('countdown holds the grid, then the field races', () => {
    const s = initialVg();
    for (let f = 0; f < 60; f++) stepVg(s, coast, DT);
    expect(s.cars[1].x).toBeCloseTo(makeCar(1).x, 5); // still gridded
    for (let f = 0; f < 60 * 3; f++) stepVg(s, coast, DT);
    expect(Math.hypot(s.cars[1].vx, s.cars[1].vy)).toBeGreaterThan(10); // rivals off
  });
});

describe('game wiring', () => {
  it('gas + steer flow through input actions', () => {
    const world = createWorld(vellgroveGame);
    for (let f = 0; f < 60 * 4; f++) world.step(['gas']);
    const c = vgState(world).cars[0];
    expect(Math.hypot(c.vx, c.vy)).toBeGreaterThan(50);
  });
});

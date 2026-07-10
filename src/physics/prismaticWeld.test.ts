// Prismatic (slider) + weld joints: axis lock, travel limits, motor drive,
// and rigid glue under gravity. Each sim runs a few hundred fixed steps and
// asserts on positions — the same style as rigid.test.ts.

import { describe, expect, it } from 'vitest';
import { addBody, createRigidWorld, getBody, polygonBox } from './rigidBody';
import { addPrismaticJoint, addWeldJoint } from './rigidJoints';
import { rigidStep } from './rigidStep';

const DT = 1 / 60;
const run = (rw: ReturnType<typeof createRigidWorld>, steps: number) => {
  for (let i = 0; i < steps; i++) rigidStep(rw, DT);
};

describe('prismatic joint', () => {
  it('constrains motion to the axis: a vertical slider falls straight down, x locked', () => {
    const rw = createRigidWorld({ gravityY: 900 });
    const anchor = addBody(rw, { kind: 'static', shape: polygonBox(20, 20), x: 100, y: 0 });
    const slider = addBody(rw, { shape: polygonBox(30, 30), x: 100, y: 50, vx: 120 }); // sideways shove
    addPrismaticJoint(rw, { a: anchor, b: slider, px: 100, py: 50, axisX: 0, axisY: 1 });
    run(rw, 120);
    const b = getBody(rw, slider)!;
    expect(Math.abs(b.x - 100)).toBeLessThan(1.5); // perpendicular locked despite the shove
    expect(b.y).toBeGreaterThan(200); // free to slide along the axis
    expect(Math.abs(b.a)).toBeLessThan(0.05); // rotation locked
  });

  it('travel limits bound the slide', () => {
    const rw = createRigidWorld({ gravityY: 900 });
    const anchor = addBody(rw, { kind: 'static', shape: polygonBox(20, 20), x: 0, y: 0 });
    const slider = addBody(rw, { shape: polygonBox(30, 30), x: 0, y: 0 });
    addPrismaticJoint(rw, { a: anchor, b: slider, px: 0, py: 0, axisX: 0, axisY: 1, limitLower: -10, limitUpper: 80 });
    run(rw, 300);
    const b = getBody(rw, slider)!;
    expect(b.y).toBeGreaterThan(60); // fell to the stop…
    expect(b.y).toBeLessThan(90); // …and the stop held (80 + slop)
  });

  it('a motor drives the slide against gravity (an elevator)', () => {
    const rw = createRigidWorld({ gravityY: 900 });
    const anchor = addBody(rw, { kind: 'static', shape: polygonBox(20, 20), x: 0, y: 0 });
    const car = addBody(rw, { shape: polygonBox(40, 40), x: 0, y: 0 });
    addPrismaticJoint(rw, {
      a: anchor, b: car, px: 0, py: 0, axisX: 0, axisY: 1,
      motorSpeed: -60, maxMotorForce: 1e7, // drive upward (y-down coords)
    });
    run(rw, 120);
    const b = getBody(rw, car)!;
    expect(b.y).toBeLessThan(-80); // ~2s at 60 px/s upward, minus spin-up
    expect(Math.abs(b.x)).toBeLessThan(1);
  });
});

describe('weld joint', () => {
  it('glues two bodies rigidly: they fall as one, keeping offset and relative angle', () => {
    const rw = createRigidWorld({ gravityY: 900 });
    const left = addBody(rw, { shape: polygonBox(30, 30), x: 0, y: 0, vx: 40 });
    const right = addBody(rw, { shape: polygonBox(30, 30), x: 40, y: 0 });
    addWeldJoint(rw, { a: left, b: right, px: 20, py: 0 });
    run(rw, 180);
    const a = getBody(rw, left)!;
    const b = getBody(rw, right)!;
    const dx = b.x - a.x, dy = b.y - a.y;
    expect(Math.hypot(dx, dy)).toBeCloseTo(40, 0); // offset preserved
    expect(Math.abs(b.a - a.a)).toBeLessThan(0.03); // no relative rotation
    expect(a.y).toBeGreaterThan(500); // and the pair actually fell
  });

  it('a welded pair is deterministic (same seed world twice → same poses)', () => {
    const build = () => {
      const rw = createRigidWorld({ gravityY: 900 });
      const a = addBody(rw, { shape: polygonBox(30, 30), x: 5, y: 0, w: 2 });
      const b = addBody(rw, { shape: polygonBox(20, 20), x: 45, y: 3 });
      addWeldJoint(rw, { a, b, px: 25, py: 1 });
      run(rw, 240);
      const A = getBody(rw, a)!;
      return [A.x, A.y, A.a, A.vx, A.vy, A.w];
    };
    expect(build()).toEqual(build());
  });
});

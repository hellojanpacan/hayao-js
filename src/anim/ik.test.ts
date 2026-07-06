import { describe, it, expect } from 'vitest';
import { dcos, dsin } from '../core/dmath';
import { solveFabrik, solveTwoBoneIK } from './ik';
import type { Vec2 } from '../core/math';

const root: Vec2 = { x: 0, y: 0 };

// Forward-kinematics helper: where does the 2-bone end effector land?
function endOfTwoBone(angle0: number, angle1: number, l0: number, l1: number): Vec2 {
  const midX = dcos(angle0) * l0;
  const midY = dsin(angle0) * l0;
  return { x: midX + dcos(angle1) * l1, y: midY + dsin(angle1) * l1 };
}

describe('solveTwoBoneIK', () => {
  it('reaches a target inside the annulus (FK of the solution lands on it)', () => {
    const target = { x: 3, y: 2 };
    const res = solveTwoBoneIK(root, 3, 3, target, 1);
    expect(res.reachable).toBe(true);
    const end = endOfTwoBone(res.angle0, res.angle1, 3, 3);
    expect(end.x).toBeCloseTo(target.x, 6);
    expect(end.y).toBeCloseTo(target.y, 6);
  });

  it('reports unreachable and clamps to full extension when out of range', () => {
    const target = { x: 100, y: 0 };
    const res = solveTwoBoneIK(root, 3, 3, target, 1);
    expect(res.reachable).toBe(false);
    const end = endOfTwoBone(res.angle0, res.angle1, 3, 3);
    // Fully extended toward the target = distance 6 along +x.
    expect(end.x).toBeCloseTo(6, 6);
    expect(end.y).toBeCloseTo(0, 6);
  });

  it('bendDir flips the elbow to the opposite side', () => {
    const target = { x: 3, y: 2 };
    const up = solveTwoBoneIK(root, 3, 3, target, 1);
    const down = solveTwoBoneIK(root, 3, 3, target, -1);
    // Both reach the target...
    const eu = endOfTwoBone(up.angle0, up.angle1, 3, 3);
    const ed = endOfTwoBone(down.angle0, down.angle1, 3, 3);
    expect(eu.x).toBeCloseTo(target.x, 6);
    expect(ed.x).toBeCloseTo(target.x, 6);
    // ...but the middle joint sits on opposite sides (different angle0).
    expect(up.angle0).not.toBeCloseTo(down.angle0, 3);
  });

  it('is bit-identical across repeated runs', () => {
    const a = solveTwoBoneIK(root, 3.5, 2.5, { x: 2, y: 3 }, 1);
    const b = solveTwoBoneIK(root, 3.5, 2.5, { x: 2, y: 3 }, 1);
    expect(a.angle0).toBe(b.angle0); // exact equality
    expect(a.angle1).toBe(b.angle1);
  });
});

describe('solveFabrik', () => {
  const lengths = [2, 2, 2];
  it('converges to a reachable target', () => {
    const res = solveFabrik(root, lengths, { x: 3, y: 3 });
    expect(res.reachable).toBe(true);
    const end = res.joints[res.joints.length - 1];
    expect(end.x).toBeCloseTo(3, 3);
    expect(end.y).toBeCloseTo(3, 3);
    // Bone lengths are preserved.
    for (let i = 0; i < lengths.length; i++) {
      const a = res.joints[i];
      const b = res.joints[i + 1];
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(lengths[i], 4);
    }
  });

  it('lays the chain straight for an unreachable target', () => {
    const res = solveFabrik(root, lengths, { x: 100, y: 0 });
    expect(res.reachable).toBe(false);
    const end = res.joints[res.joints.length - 1];
    expect(end.x).toBeCloseTo(6, 6); // sum of lengths, straight along +x
    expect(end.y).toBeCloseTo(0, 6);
  });

  it('is bit-identical across repeated runs', () => {
    const a = solveFabrik(root, lengths, { x: 2.5, y: 1.5 });
    const b = solveFabrik(root, lengths, { x: 2.5, y: 1.5 });
    expect(a.joints).toEqual(b.joints);
    expect(a.angles).toEqual(b.angles);
    expect(a.iterations).toBe(b.iterations);
  });

  it('seeding from the previous pose still converges', () => {
    const first = solveFabrik(root, lengths, { x: 3, y: 3 });
    const second = solveFabrik(root, lengths, { x: -3, y: 2 }, { initial: first.joints });
    const end = second.joints[second.joints.length - 1];
    expect(end.x).toBeCloseTo(-3, 3);
    expect(end.y).toBeCloseTo(2, 3);
  });
});

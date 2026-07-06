// Inverse kinematics, pure and dmath-only. Given a chain root, bone lengths, and
// a target point, solve for the joint angles that reach it. Two solvers:
//
//   • solveTwoBoneIK — the analytic 2-bone case (upper arm + forearm, thigh +
//     shin). Law of cosines for the elbow, atan2 for the shoulder, a bend
//     direction to pick the elbow's side. Exact and cheap.
//   • solveFabrik — the iterative N-bone case (FABRIK: forward-and-backward
//     reaching). Converges to any reachable target; clamps to the fully-extended
//     line when the target is out of range.
//
// EVERYTHING routes through dmath (datan2/dhypot/Math.sqrt — sqrt is IEEE
// correctly-rounded, so it is deterministic) so the SAME implementation is safe
// on BOTH sides of the seam: a game may run IK in its pure logic (e.g. a
// procedural reach that affects a hitbox) OR IkTarget may run it cosmetically.
// One code path, bit-identical everywhere — no "fast" nondeterministic variant.

import { datan2, dhypot } from '../core/dmath';
import type { Vec2 } from '../core/math';

/** Result of a 2-bone solve: absolute WORLD-space angles (radians) for each joint. */
export interface TwoBoneResult {
  /** Absolute angle of bone 0 (root→mid). */
  angle0: number;
  /** Absolute angle of bone 1 (mid→end). */
  angle1: number;
  /** True if the target was in range; false → chain clamped to full extension toward it. */
  reachable: boolean;
}

/**
 * Analytic two-bone IK. `root` is the base joint (world), `l0`/`l1` the bone
 * lengths, `target` the desired end-effector position (world). `bendDir` is +1
 * or −1 to choose which side the middle joint bends to (elbow up/down). Returns
 * the two ABSOLUTE bone angles (add to nothing — they are world angles; convert
 * to local by subtracting the parent's world angle at the call site).
 */
export function solveTwoBoneIK(root: Vec2, l0: number, l1: number, target: Vec2, bendDir: 1 | -1 = 1): TwoBoneResult {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  let dist = dhypot(dx, dy);
  const maxReach = l0 + l1;
  const minReach = Math.abs(l0 - l1);
  let reachable = true;
  // Clamp the distance into the annulus the chain can actually hit.
  if (dist > maxReach) {
    dist = maxReach;
    reachable = false;
  } else if (dist < minReach) {
    dist = minReach || 1e-9;
    reachable = false;
  }
  if (dist < 1e-9) dist = 1e-9;
  const toTarget = datan2(dy, dx);
  // Law of cosines: interior angle at the root between (root→target) and bone 0.
  const cosRoot = clampUnit((l0 * l0 + dist * dist - l1 * l1) / (2 * l0 * dist));
  const rootInterior = dacos(cosRoot);
  // Interior angle at the middle joint between bone 0 and bone 1.
  const cosMid = clampUnit((l0 * l0 + l1 * l1 - dist * dist) / (2 * l0 * l1));
  const midInterior = dacos(cosMid);
  const angle0 = toTarget - bendDir * rootInterior;
  // Bone 1's absolute angle: bone 0's angle plus (π − midInterior) turned by bendDir.
  const angle1 = angle0 + bendDir * (Math.PI - midInterior);
  return { angle0, angle1, reachable };
}

/** Clamp to [-1,1] so acos never sees a rounding-induced out-of-domain value. */
function clampUnit(v: number): number {
  return v < -1 ? -1 : v > 1 ? 1 : v;
}

/**
 * Deterministic arccosine. Math.acos is implementation-defined (banned in the
 * sim); build it from the sanctioned deterministic ops: acos(x) = atan2(√(1−x²),
 * x). sqrt is IEEE correctly-rounded and datan2 is dmath, so this is bit-identical
 * on every engine. Input is assumed already clamped to [−1,1].
 */
function dacos(x: number): number {
  return datan2(Math.sqrt(1 - x * x), x);
}

export interface FabrikResult {
  /** Joint positions (world), joints[0] === root, joints[n] === end effector. */
  joints: Vec2[];
  /** Absolute bone angles (radians), one per bone (length joints.length - 1). */
  angles: number[];
  reachable: boolean;
  /** Iterations actually run before convergence (or the cap). */
  iterations: number;
}

/**
 * FABRIK N-bone solver. `root` anchors joint 0; `lengths` are the bone lengths
 * (n bones → n+1 joints); `target` is the desired end position. Alternates a
 * backward reach (pull the end to the target, propagate inward) and a forward
 * reach (pin the root, propagate outward) until the end is within `tolerance` of
 * the target or `maxIter` is hit. When the target is unreachable the chain is
 * laid out straight toward it (reachable=false). Pure; deterministic (dmath).
 */
export function solveFabrik(
  root: Vec2,
  lengths: number[],
  target: Vec2,
  opts: { maxIter?: number; tolerance?: number; initial?: Vec2[] } = {},
): FabrikResult {
  const n = lengths.length;
  const maxIter = opts.maxIter ?? 16;
  const tolerance = opts.tolerance ?? 1e-4;
  const total = lengths.reduce((a, b) => a + b, 0);

  // Working joint positions (world). Seed from `initial` (previous frame → fast
  // convergence + stable elbow side) or lay the chain straight along +x.
  const joints: Vec2[] = [];
  for (let i = 0; i <= n; i++) {
    const seed = opts.initial?.[i];
    joints.push(seed ? { x: seed.x, y: seed.y } : { x: root.x + (i === 0 ? 0 : 1e-6 * i), y: root.y });
  }
  joints[0] = { x: root.x, y: root.y };

  const rootToTarget = dhypot(target.x - root.x, target.y - root.y);
  if (rootToTarget > total) {
    // Unreachable: straight line from root toward the target.
    const ux = (target.x - root.x) / (rootToTarget || 1);
    const uy = (target.y - root.y) / (rootToTarget || 1);
    let px = root.x;
    let py = root.y;
    joints[0] = { x: px, y: py };
    for (let i = 0; i < n; i++) {
      px += ux * lengths[i];
      py += uy * lengths[i];
      joints[i + 1] = { x: px, y: py };
    }
    return { joints, angles: anglesOf(joints), reachable: false, iterations: 0 };
  }

  let iter = 0;
  for (; iter < maxIter; iter++) {
    const end = joints[n];
    if (dhypot(end.x - target.x, end.y - target.y) <= tolerance) break;
    // Backward: end → target, drag joints inward keeping bone lengths.
    joints[n] = { x: target.x, y: target.y };
    for (let i = n - 1; i >= 0; i--) {
      const a = joints[i];
      const b = joints[i + 1];
      const d = dhypot(a.x - b.x, a.y - b.y) || 1e-9;
      const r = lengths[i] / d;
      joints[i] = { x: b.x + (a.x - b.x) * r, y: b.y + (a.y - b.y) * r };
    }
    // Forward: pin root, push joints outward keeping bone lengths.
    joints[0] = { x: root.x, y: root.y };
    for (let i = 0; i < n; i++) {
      const a = joints[i];
      const b = joints[i + 1];
      const d = dhypot(a.x - b.x, a.y - b.y) || 1e-9;
      const r = lengths[i] / d;
      joints[i + 1] = { x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r };
    }
  }
  return { joints, angles: anglesOf(joints), reachable: true, iterations: iter };
}

/** Absolute angle of each bone segment between consecutive joints. */
function anglesOf(joints: Vec2[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < joints.length - 1; i++) {
    out.push(datan2(joints[i + 1].y - joints[i].y, joints[i + 1].x - joints[i].x));
  }
  return out;
}

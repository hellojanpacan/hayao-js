import { describe, expect, it } from 'vitest';
import {
  addBody, addDistanceJoint, addRevoluteJoint, applyImpulse, bodyAABB,
  createRigidWorld, getBody, hashValue, polygonBox, pointQuery, rayCastRigid,
  rigidStep, type RigidWorld,
} from '../index';

const DT = 1 / 60;
const step = (rw: RigidWorld, n: number) => {
  for (let k = 0; k < n; k++) rigidStep(rw, DT);
};
/** Static floor spanning x∈[-2000,2000] with its top surface at y=`top`. */
const addFloor = (rw: RigidWorld, top = 500) =>
  addBody(rw, { kind: 'static', shape: polygonBox(4000, 100), x: 0, y: top + 50, friction: 0.8 });

describe('rigid bodies: basics', () => {
  it('a dropped ball falls, lands, and comes to rest on the floor', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    const ball = addBody(rw, { shape: { kind: 'circle', r: 20 }, x: 0, y: 0, restitution: 0 });
    step(rw, 240);
    const b = getBody(rw, ball)!;
    expect(b.y).toBeGreaterThan(470);
    expect(b.y).toBeLessThanOrEqual(482); // resting: 500 - 20 + slop
    expect(Math.abs(b.vy)).toBeLessThan(5);
  });

  it('restitution: a bouncy ball rebounds to roughly e² of its drop height', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    addBody(rw, { shape: { kind: 'circle', r: 10 }, x: 0, y: 100, restitution: 0.8 });
    // Track the apex after the first bounce.
    let apex = 500;
    let bounced = false;
    for (let k = 0; k < 400; k++) {
      rigidStep(rw, DT);
      const b = rw.bodies[1];
      if (b.vy < 0) bounced = true;
      if (bounced && b.y < apex) apex = b.y;
    }
    // Dropped from 100 → floor at 490 (radius): fall of 390. e=0.8 → e²·390 ≈ 250 rebound.
    const reboundHeight = 490 - apex;
    expect(reboundHeight).toBeGreaterThan(140);
    expect(reboundHeight).toBeLessThan(360);
    expect(bounced).toBe(true);
  });

  it('a bounce never adds energy (Pinshine invariant)', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    addBody(rw, { shape: { kind: 'circle', r: 10 }, x: 0, y: 200, restitution: 1.0 });
    let prevSpeedDown = 0;
    let checked = 0;
    for (let k = 0; k < 600; k++) {
      const b = rw.bodies[1];
      if (b.vy > 0) prevSpeedDown = b.vy;
      rigidStep(rw, DT);
      if (b.vy < 0 && prevSpeedDown > 100) {
        // Allow one gravity tick: the step integrates gravity BEFORE the bounce.
        expect(-b.vy).toBeLessThanOrEqual((prevSpeedDown + 900 * DT) * 1.001);
        checked++;
        prevSpeedDown = 0;
      }
    }
    expect(checked).toBeGreaterThan(2);
  });

  it('friction stops a sliding box; a frictionless box keeps sliding', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    const gripId = addBody(rw, { shape: polygonBox(30, 30), x: -300, y: 484, vx: 300, friction: 0.6 });
    const slickId = addBody(rw, { shape: polygonBox(30, 30), x: 300, y: 484, vx: 300, friction: 0 });
    step(rw, 120);
    const grip = getBody(rw, gripId)!;
    const slick = getBody(rw, slickId)!;
    expect(Math.abs(grip.vx)).toBeLessThan(10);
    expect(slick.vx).toBeGreaterThan(200);
  });

  it('a 10-box stack settles and stays standing', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    const ids: number[] = [];
    for (let k = 0; k < 10; k++) {
      ids.push(addBody(rw, { shape: polygonBox(40, 40), x: 0, y: 480 - k * 40, friction: 0.7, restitution: 0 }));
    }
    step(rw, 600); // 10 seconds
    for (let k = 0; k < 10; k++) {
      const b = getBody(rw, ids[k])!;
      expect(Math.abs(b.x)).toBeLessThan(12);           // no sideways collapse
      expect(Math.abs(b.a)).toBeLessThan(0.15);          // no toppling rotation
      expect(Math.abs(b.y - (480 - k * 40))).toBeLessThan(8);
    }
  });

  it('an impulse knocks a stack over (and wakes sleepers)', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    const ids: number[] = [];
    for (let k = 0; k < 5; k++) ids.push(addBody(rw, { shape: polygonBox(40, 40), x: 0, y: 480 - k * 40, friction: 0.7 }));
    step(rw, 400); // settle → sleep
    expect(getBody(rw, ids[2])!.sleeping).toBe(true);
    applyImpulse(rw, ids[4], 60, 0, 0, 320); // whack the top box sideways (Δv ≈ 375 px/s)
    step(rw, 300);
    const top = getBody(rw, ids[4])!;
    expect(Math.abs(top.x)).toBeGreaterThan(30); // it moved
  });
});

describe('rigid bodies: sleeping', () => {
  it('a settled body sleeps and its velocity zeroes', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    const id = addBody(rw, { shape: polygonBox(40, 40), x: 0, y: 480 });
    step(rw, 200);
    const b = getBody(rw, id)!;
    expect(b.sleeping).toBe(true);
    expect(b.vx).toBe(0);
    expect(b.vy).toBe(0);
  });

  it('a fast body crashing into a sleeper wakes it', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    const sleeper = addBody(rw, { shape: polygonBox(40, 40), x: 0, y: 480 });
    step(rw, 200);
    expect(getBody(rw, sleeper)!.sleeping).toBe(true);
    addBody(rw, { shape: { kind: 'circle', r: 15 }, x: -400, y: 470, vx: 800, restitution: 0.2 });
    let wokeAtSomePoint = false;
    for (let k = 0; k < 90; k++) {
      rigidStep(rw, DT);
      if (!getBody(rw, sleeper)!.sleeping) wokeAtSomePoint = true;
    }
    const s = getBody(rw, sleeper)!;
    expect(wokeAtSomePoint).toBe(true);        // the crash woke it…
    expect(Math.abs(s.x)).toBeGreaterThan(0.5); // …and physically moved it
  });
});

describe('rigid bodies: joints', () => {
  it('a pendulum on a revolute joint swings and conserves height-ish', () => {
    const rw = createRigidWorld();
    const anchor = addBody(rw, { kind: 'static', shape: { kind: 'circle', r: 5 }, x: 0, y: 0 });
    const bob = addBody(rw, { shape: { kind: 'circle', r: 15 }, x: 120, y: 0, angDamp: 0 });
    addRevoluteJoint(rw, { a: anchor, b: bob, px: 0, py: 0 });
    step(rw, 55); // fall through the arc
    const b = getBody(rw, bob)!;
    const dist = Math.hypot(b.x, b.y);
    expect(dist).toBeGreaterThan(110);
    expect(dist).toBeLessThan(130); // constraint holds the length
    expect(b.y).toBeGreaterThan(60); // it actually swung down
  });

  it('a distance rod holds two bodies apart under gravity', () => {
    const rw = createRigidWorld();
    addFloor(rw);
    const a = addBody(rw, { shape: { kind: 'circle', r: 10 }, x: -30, y: 300 });
    const b = addBody(rw, { shape: { kind: 'circle', r: 10 }, x: 30, y: 300 });
    addDistanceJoint(rw, { a, b });
    step(rw, 300);
    const A = getBody(rw, a)!, B = getBody(rw, b)!;
    expect(Math.abs(Math.hypot(B.x - A.x, B.y - A.y) - 60)).toBeLessThan(3);
  });

  it('a rope constrains only when stretched', () => {
    const rw = createRigidWorld();
    const anchor = addBody(rw, { kind: 'static', shape: { kind: 'circle', r: 5 }, x: 0, y: 0 });
    const bob = addBody(rw, { shape: { kind: 'circle', r: 10 }, x: 0, y: 50 });
    addDistanceJoint(rw, { a: anchor, b: bob, length: 150, rope: true });
    step(rw, 120);
    const b = getBody(rw, bob)!;
    const dist = Math.hypot(b.x, b.y);
    expect(dist).toBeLessThan(160); // never far past the rope length
    expect(dist).toBeGreaterThan(130); // hanging at full extension
  });

  it('a motored revolute joint spins a wheel to its target speed', () => {
    const rw = createRigidWorld();
    const anchor = addBody(rw, { kind: 'static', shape: { kind: 'circle', r: 5 }, x: 0, y: 0 });
    const wheel = addBody(rw, { shape: { kind: 'circle', r: 40 }, x: 0, y: 0, gravityScale: 0, angDamp: 0 });
    addRevoluteJoint(rw, { a: anchor, b: wheel, px: 0, py: 0, motorSpeed: 6, maxMotorTorque: 5000 });
    step(rw, 120);
    expect(getBody(rw, wheel)!.w).toBeGreaterThan(5.5);
    expect(getBody(rw, wheel)!.w).toBeLessThan(6.5);
  });

  it('angle limits stop a swinging arm', () => {
    const rw = createRigidWorld();
    const anchor = addBody(rw, { kind: 'static', shape: { kind: 'circle', r: 5 }, x: 0, y: 0 });
    const arm = addBody(rw, { shape: polygonBox(100, 10), x: 60, y: 0 });
    addRevoluteJoint(rw, { a: anchor, b: arm, px: 0, py: 0, limitLower: -0.5, limitUpper: 0.5 });
    step(rw, 300);
    const a = getBody(rw, arm)!;
    expect(a.a).toBeGreaterThan(-0.65);
    expect(a.a).toBeLessThan(0.65);
  });
});

describe('rigid bodies: CCD, sensors, queries', () => {
  it('a bullet at 24,000 px/s cannot tunnel through a thin wall', () => {
    const rw = createRigidWorld({ gravityY: 0 });
    addBody(rw, { kind: 'static', shape: polygonBox(10, 400), x: 300, y: 0 });
    const bullet = addBody(rw, { shape: { kind: 'circle', r: 5 }, x: -300, y: 0, vx: 24000, bullet: true, restitution: 0.5 });
    step(rw, 30);
    expect(getBody(rw, bullet)!.x).toBeLessThan(300); // stayed on the near side
  });

  it('a sensor reports overlap without deflecting the body', () => {
    const rw = createRigidWorld({ gravityY: 0 });
    addBody(rw, { kind: 'static', shape: polygonBox(80, 80), x: 0, y: 0, sensor: true });
    const mover = addBody(rw, { shape: { kind: 'circle', r: 10 }, x: -200, y: 0, vx: 400 });
    let overlapped = false;
    for (let k = 0; k < 90; k++) {
      const ev = rigidStep(rw, DT);
      if (ev.some((e) => e.sensor)) overlapped = true;
    }
    expect(overlapped).toBe(true);
    expect(getBody(rw, mover)!.x).toBeGreaterThan(120); // passed clean through
    expect(Math.abs(getBody(rw, mover)!.vy)).toBeLessThan(1);
  });

  it('contact events carry impulse magnitudes that scale with violence', () => {
    const soft = createRigidWorld();
    addFloor(soft, 200);
    addBody(soft, { shape: { kind: 'circle', r: 10 }, x: 0, y: 170, vy: 100 });
    const hard = createRigidWorld();
    addFloor(hard, 200);
    addBody(hard, { shape: { kind: 'circle', r: 10 }, x: 0, y: 170, vy: 2000 });
    const maxImpulse = (rw: RigidWorld) => {
      let m = 0;
      for (let k = 0; k < 30; k++) for (const e of rigidStep(rw, DT)) m = Math.max(m, e.impulse);
      return m;
    };
    expect(maxImpulse(hard)).toBeGreaterThan(maxImpulse(soft) * 4);
  });

  it('rayCastRigid returns the nearest hit with a sane normal', () => {
    const rw = createRigidWorld();
    addBody(rw, { kind: 'static', shape: polygonBox(100, 100), x: 300, y: 0 });
    addBody(rw, { kind: 'static', shape: { kind: 'circle', r: 30 }, x: 600, y: 0 });
    const hit = rayCastRigid(rw, 0, 0, 800, 0)!;
    expect(hit).toBeTruthy();
    expect(hit.x).toBeCloseTo(250, 0);
    expect(hit.nx).toBeLessThan(-0.9);
    expect(pointQuery(rw, 600, 0)?.id).toBe(rw.bodies[1].id);
  });

  it('bodyAABB bounds a rotated box', () => {
    const rw = createRigidWorld();
    const id = addBody(rw, { shape: polygonBox(100, 20), x: 0, y: 0, a: Math.PI / 4 });
    const r = bodyAABB(getBody(rw, id)!);
    expect(r.w).toBeGreaterThan(80);
    expect(r.w).toBeLessThan(90); // (100+20)/√2 ≈ 84.85
  });
});

describe('rigid bodies: determinism', () => {
  const chaosWorld = () => {
    const rw = createRigidWorld();
    addFloor(rw);
    for (let k = 0; k < 30; k++) {
      addBody(rw, {
        shape: k % 3 === 0 ? { kind: 'circle', r: 8 + (k % 5) * 3 } : polygonBox(20 + (k % 4) * 8, 20 + (k % 3) * 8),
        x: -200 + (k * 37) % 400, y: -100 - k * 25,
        restitution: (k % 4) * 0.2, friction: 0.3 + (k % 3) * 0.2,
        a: k * 0.37,
      });
    }
    const a = addBody(rw, { shape: { kind: 'circle', r: 10 }, x: -100, y: -900 });
    const b = addBody(rw, { shape: { kind: 'circle', r: 10 }, x: 100, y: -900 });
    addDistanceJoint(rw, { a, b });
    return rw;
  };

  it('two identical runs produce bit-identical state (hash compare)', () => {
    const r1 = chaosWorld(), r2 = chaosWorld();
    step(r1, 300);
    step(r2, 300);
    expect(hashValue(r1)).toBe(hashValue(r2));
  });

  it('structuredClone mid-flight resumes identically (snapshot contract)', () => {
    const r1 = chaosWorld();
    step(r1, 100);
    const r2 = structuredClone(r1);
    step(r1, 150);
    step(r2, 150);
    expect(hashValue(r1)).toBe(hashValue(r2));
  });

  it('the whole world round-trips through JSON (plain-data contract)', () => {
    const r1 = chaosWorld();
    step(r1, 50);
    const r2 = JSON.parse(JSON.stringify(r1)) as RigidWorld;
    step(r1, 100);
    step(r2, 100);
    expect(hashValue(r1)).toBe(hashValue(r2));
  });
});

describe('rigid bodies: performance sanity', () => {
  // GitHub's shared CI runners are ~2× slower than a dev machine — the budget
  // has headroom there so the gate catches real regressions, not runner noise.
  it('150 mixed bodies step under budget on average', () => {
    const budgetMs = process.env.CI ? 5 : 2;
    const rw = createRigidWorld();
    addFloor(rw);
    for (let k = 0; k < 150; k++) {
      addBody(rw, {
        shape: k % 2 ? { kind: 'circle', r: 6 + (k % 6) * 2 } : polygonBox(14 + (k % 5) * 6, 14 + (k % 4) * 6),
        x: -600 + (k * 53) % 1200, y: -50 - (k * 31) % 800,
      });
    }
    step(rw, 60); // warm up + let them pile
    const t0 = performance.now();
    step(rw, 120);
    const avg = (performance.now() - t0) / 120;
    expect(avg).toBeLessThan(budgetMs);
  });
});

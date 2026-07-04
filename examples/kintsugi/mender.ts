// The Mender — a procedurally animated figure, drawn as cracked ceramic rejoined
// with glowing gold (the game's whole thesis in one sprite: kintsugi). Fully
// code-as-art and code-as-ANIMATION: articulated limbs via forward kinematics,
// state-driven poses (idle/run/rise/fall/dash/attack/hurt), a pulsing gold core,
// and gold seam accents. Pure view — returns a cosmetic Node rebuilt each frame
// from a plain `MenderPose`, so nothing here touches world.hash().

import {
  Node,
  Sprite,
  dsin,
  dcos,
  KENTO,
  radialGradient,
  linearGradient,
  glow,
  withAlpha,
  mix,
  type Vec2,
} from '@hayao';

export type Motion = 'idle' | 'run' | 'rise' | 'fall' | 'dash' | 'attack' | 'hurt';

export interface MenderPose {
  /** Collision-box top-left + size (matches the platformer body). */
  x: number;
  y: number;
  w: number;
  h: number;
  facing: number; // -1 | 1
  phase: number; // seconds, accumulates — drives cycles
  motion: Motion;
  /** Attack progress 0..1 (for the gold-arc swing). */
  attackT?: number;
  /** Hurt flash 0..1. */
  hurtT?: number;
}

const CERAMIC = KENTO.gofun;
const CERAMIC_SHADE = mix(KENTO.gofun, KENTO.kinako, 0.5);
const INK = KENTO.sumi;
const GOLD = KENTO.ko;
const GOLD_DEEP = KENTO.kakiDeep;

/** A round-capped capsule between two local points (an articulated limb bone). */
function bone(a: Vec2, b: Vec2, thick: number, fill: string, z: number): Sprite {
  return new Sprite({ z, shape: { kind: 'poly', points: [a.x, a.y, b.x, b.y], closed: false }, stroke: fill, strokeWidth: thick, round: true, fill: 'none' });
}

/** A thin glowing gold seam along a short segment. */
function seam(a: Vec2, b: Vec2, z: number, w = 2): Sprite {
  return new Sprite({ z, shape: { kind: 'poly', points: [a.x, a.y, b.x, b.y], closed: false }, stroke: GOLD, strokeWidth: w, round: true, fill: 'none', shadow: glow(withAlpha(GOLD, 0.8), 5) });
}

/**
 * Build the Mender figure for a pose. Local origin is the collision-box CENTER;
 * the caller positions the returned node at (x + w/2, y + h/2).
 */
export function menderNode(pose: MenderPose): Node {
  const root = new Node({ name: 'mender' });
  root.cosmetic = true;
  const f = pose.facing < 0 ? -1 : 1;
  const t = pose.phase;
  const H = pose.h;
  // Figure proportions relative to body height.
  const hipY = H * 0.16; // hips below center
  const shoulderY = -H * 0.16;
  const headY = -H * 0.38;
  const legLen = H * 0.34; // per bone
  const armLen = H * 0.24;

  // ── gait / pose angles (radians) ─────────────────────────────────
  let hipSwing = 0;
  let kneeBend = 0.15;
  let lean = 0;
  let bob = dsin(t * 2) * (H * 0.01); // gentle idle breathing
  let armSwing = 0;
  const cycle = t * 9; // run cadence

  switch (pose.motion) {
    case 'run':
      hipSwing = dsin(cycle) * 0.9;
      kneeBend = 0.5 + dcos(cycle) * 0.35;
      lean = 0.18 * f;
      armSwing = dsin(cycle) * 0.7;
      bob = Math.abs(dsin(cycle)) * (H * 0.03);
      break;
    case 'rise':
      hipSwing = 0.5;
      kneeBend = 0.9;
      lean = 0.12 * f;
      armSwing = -0.6;
      break;
    case 'fall':
      hipSwing = 0.3;
      kneeBend = 0.5;
      lean = -0.06 * f;
      armSwing = 0.5;
      break;
    case 'dash':
      hipSwing = 0.2;
      kneeBend = 0.3;
      lean = 0.45 * f;
      armSwing = -0.9;
      break;
    case 'attack':
      lean = 0.14 * f;
      kneeBend = 0.4;
      armSwing = 0;
      break;
    default: // idle
      hipSwing = 0.06;
      kneeBend = 0.18;
      lean = 0;
  }

  // Forward kinematics for one leg given a hip phase offset.
  const leg = (sign: number, zBack: boolean): Sprite[] => {
    const hip: Vec2 = { x: sign * H * 0.08, y: hipY + bob };
    const hipAng = Math.PI / 2 + sign * hipSwing; // down-ish
    const knee: Vec2 = { x: hip.x + dcos(hipAng) * legLen, y: hip.y + dsin(hipAng) * legLen };
    const kneeAng = hipAng + kneeBend;
    const foot: Vec2 = { x: knee.x + dcos(kneeAng) * legLen, y: knee.y + dsin(kneeAng) * legLen };
    const z = zBack ? 1 : 3;
    const shade = zBack ? CERAMIC_SHADE : CERAMIC;
    return [
      bone(hip, knee, H * 0.11, INK, z), // outline
      bone(hip, knee, H * 0.08, shade, z + 0.1),
      bone(knee, foot, H * 0.095, INK, z),
      bone(knee, foot, H * 0.065, shade, z + 0.1),
      seam(hip, { x: (hip.x + knee.x) / 2, y: (hip.y + knee.y) / 2 }, z + 0.2, 1.6),
    ];
  };

  // Arm (lead arm holds the gold needle-blade; swings on attack).
  const arm = (sign: number, lead: boolean): Sprite[] => {
    const sh: Vec2 = { x: sign * H * 0.1, y: shoulderY + bob };
    let ang = Math.PI / 2 + sign * armSwing * (lead ? 1 : -1);
    if (pose.motion === 'attack' && lead) {
      const a = pose.attackT ?? 0;
      ang = -0.9 + a * 2.6; // sweep down-forward
    }
    const elbow: Vec2 = { x: sh.x + dcos(ang) * armLen * f, y: sh.y + dsin(ang) * armLen };
    const handAng = ang + 0.3;
    const hand: Vec2 = { x: elbow.x + dcos(handAng) * armLen * f, y: elbow.y + dsin(handAng) * armLen };
    const z = lead ? 4 : 1;
    const shade = lead ? CERAMIC : CERAMIC_SHADE;
    const out = [
      bone(sh, elbow, H * 0.085, INK, z),
      bone(sh, elbow, H * 0.06, shade, z + 0.1),
      bone(elbow, hand, H * 0.075, INK, z),
      bone(elbow, hand, H * 0.05, shade, z + 0.1),
    ];
    if (lead) {
      // the golden needle-blade extending from the hand
      const tip: Vec2 = { x: hand.x + dcos(handAng) * H * 0.5 * f, y: hand.y + dsin(handAng) * H * 0.5 };
      out.push(new Sprite({ z: z + 0.3, shape: { kind: 'poly', points: [hand.x, hand.y, tip.x, tip.y], closed: false }, stroke: GOLD, strokeWidth: 3.5, round: true, fill: 'none', shadow: glow(withAlpha(GOLD, 0.9), 7) }));
    }
    return out;
  };

  // ── assemble, back to front ──────────────────────────────────────
  // contact shadow
  root.addChild(new Sprite({ pos: { x: 0, y: H * 0.5 }, z: 0, shape: { kind: 'circle', radius: H * 0.22 }, fill: withAlpha(KENTO.yohaku, 0.22) }));
  for (const s of leg(-f, true)) root.addChild(s); // back leg
  for (const s of arm(-f, false)) root.addChild(s); // back arm

  // torso: a ceramic vessel with a lit gold seam down the front
  const torso = new Node({ name: 'torso', pos: { x: lean * H * 0.4, y: bob }, rotation: lean });
  torso.addChild(new Sprite({ z: 2, shape: { kind: 'rect', w: H * 0.34, h: H * 0.5, r: H * 0.16 }, fill: CERAMIC, stroke: INK, strokeWidth: 3, gradient: linearGradient([CERAMIC, CERAMIC_SHADE], 90) }));
  // the gold core (the needle of gold in the chest) — pulsing light
  const pulse = 0.7 + dsin(t * 3) * 0.3;
  torso.addChild(new Sprite({ z: 3, shape: { kind: 'circle', radius: H * 0.1 * pulse }, gradient: radialGradient([KENTO.gofun, GOLD, withAlpha(GOLD_DEEP, 0)]), shadow: glow(withAlpha(GOLD, 0.9), 14 * pulse) }));
  // kintsugi seams across the torso
  torso.addChild(seam({ x: -H * 0.1, y: -H * 0.22 }, { x: H * 0.04, y: 0 }, 3.1, 2));
  torso.addChild(seam({ x: H * 0.04, y: 0 }, { x: -H * 0.06, y: H * 0.22 }, 3.1, 2));
  root.addChild(torso);

  // head: a smooth ceramic oval tilted by lean, with a single soft eye-light
  const head = new Node({ name: 'head', pos: { x: lean * H * 0.5 + f * H * 0.02, y: headY + bob }, rotation: lean * 0.6 });
  head.addChild(new Sprite({ z: 5, shape: { kind: 'circle', radius: H * 0.16 }, fill: CERAMIC, stroke: INK, strokeWidth: 3, gradient: linearGradient([CERAMIC, CERAMIC_SHADE], 90) }));
  head.addChild(new Sprite({ pos: { x: f * H * 0.06, y: -H * 0.02 }, z: 6, shape: { kind: 'circle', radius: H * 0.03 }, fill: GOLD, shadow: glow(GOLD, 6) }));
  head.addChild(seam({ x: -H * 0.08, y: -H * 0.1 }, { x: H * 0.02, y: H * 0.05 }, 6, 1.6));
  root.addChild(head);

  for (const s of leg(f, false)) root.addChild(s); // front leg
  for (const s of arm(f, true)) root.addChild(s); // front arm + blade

  // hurt flash: a red-white wash over everything
  if ((pose.hurtT ?? 0) > 0) {
    root.addChild(new Sprite({ z: 20, shape: { kind: 'circle', radius: H * 0.5 }, fill: withAlpha(KENTO.shu, 0.35 * (pose.hurtT ?? 0)) }));
  }
  // attack arc: a sweeping gold crescent in front
  if (pose.motion === 'attack') {
    const a = pose.attackT ?? 0;
    const arcA = -0.8 + a * 2.4;
    const r = H * 0.62;
    const pts: number[] = [];
    for (let i = -3; i <= 3; i++) {
      const ang = arcA + i * 0.16;
      pts.push(f * dcos(ang) * r, dsin(ang) * r);
    }
    root.addChild(new Sprite({ z: 8, shape: { kind: 'poly', points: pts, closed: false }, stroke: withAlpha(GOLD, 0.85 * (1 - Math.abs(a - 0.5) * 1.4)), strokeWidth: 6, round: true, fill: 'none', shadow: glow(withAlpha(GOLD, 0.7), 10) }));
  }

  return root;
}

/** Pick a motion from platformer facts (a convenience for the view). */
export function motionFrom(onGround: boolean, vx: number, vy: number, dashing: boolean, attacking: boolean, hurt: boolean): Motion {
  if (hurt) return 'hurt';
  if (attacking) return 'attack';
  if (dashing) return 'dash';
  if (!onGround) return vy < 0 ? 'rise' : 'fall';
  return Math.abs(vx) > 20 ? 'run' : 'idle';
}

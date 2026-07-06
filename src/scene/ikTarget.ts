// IkTarget — a cosmetic Node whose OWN WORLD POSITION is the IK goal. Point it
// at a chain of Bone2Ds (root-first) and each step it solves for the joint
// rotations that reach it, writing those rotations back onto the bones. Because
// the solver runs on cosmetic writes and the node is `cosmetic = true`, IK never
// touches world.hash(): strip it and the game hashes identically.
//
// ORDERING CONTRACT (documented, no scheduler): the tree updates depth-first in
// child-index order. An IkTarget MUST sit AFTER the rig's ClipPlayer in sibling
// order so the clip poses the whole rig first and IK then OVERRIDES the limb it
// owns (clip → IK → verlet). Placing it before the ClipPlayer would let the clip
// stomp the IK result the same frame. Since the target reads its own world
// transform, parent it wherever the goal should live (e.g. under a hand marker or
// the pointer follower) — its position in WORLD space is what the solver chases.
//
// The math is dmath-only (solveTwoBoneIK / solveFabrik) — the single seam-safe
// implementation. Bone rotations are absolute WORLD angles from the solver,
// converted to each bone's LOCAL angle by subtracting its parent's world angle.

import { dcos, dsin } from '../core/dmath';
import { invertTransform, type Transform, type Vec2 } from '../core/math';
import { Node, type NodeConfig } from './node';
import { Bone2D } from '../anim/skeleton';
import { solveFabrik, solveTwoBoneIK } from '../anim/ik';

export interface IkTargetConfig extends NodeConfig {
  /** The bone chain to solve, ROOT first. 2 bones → analytic solve; N → FABRIK. */
  bones?: Bone2D[];
  /** Elbow/knee bend side for the 2-bone solve (+1 or −1). Default 1. */
  bendDir?: 1 | -1;
  /** FABRIK iteration cap (N-bone only). Default 16. */
  maxIter?: number;
}

/** A cosmetic node that drives a Bone2D chain to reach the node's own world position. */
export class IkTarget extends Node {
  override readonly type = 'IkTarget';

  bones: Bone2D[];
  bendDir: 1 | -1;
  maxIter: number;
  /** True if the chain reached the target on the last solve (else it was clamped). */
  reached = true;

  constructor(config: IkTargetConfig = {}) {
    super(config);
    this.cosmetic = true; // hard-set: IK output is pure view.
    this.bones = config.bones ?? [];
    this.bendDir = config.bendDir ?? 1;
    this.maxIter = config.maxIter ?? 16;
  }

  /** Repoint the solver at a new chain (root-first). */
  setBones(bones: Bone2D[]): void {
    this.bones = bones;
  }

  protected override onProcess(_dt: number): void {
    const bones = this.bones;
    if (bones.length < 1) return;
    const rootBone = bones[0];
    const rootParent = rootBone.parent;
    if (!rootParent) return;

    // The goal is this node's own world position.
    const wt = this.worldTransform();
    const goalWorld: Vec2 = { x: wt.e, y: wt.f };

    // Solve in the chain's PARENT space (where bone rotations are expressed):
    // convert the goal into the root bone's parent frame.
    const parentWorld = rootParent.worldTransform();
    const invParent = invertTransform(parentWorld);
    const goal = applyInv(invParent, goalWorld);
    const rootLocal: Vec2 = { x: rootBone.pos.x, y: rootBone.pos.y };

    if (bones.length === 2) {
      const res = solveTwoBoneIK(rootLocal, bones[0].length, bones[1].length, goal, this.bendDir);
      this.reached = res.reachable;
      // angle0 is absolute in parent space → local rotation of bone 0.
      bones[0].rotation = res.angle0;
      // bone 1's parent is bone 0 → subtract bone 0's angle to get its local rotation.
      bones[1].rotation = res.angle1 - res.angle0;
      return;
    }

    // N-bone FABRIK. Solve joint positions in parent space, seed from current pose.
    const lengths = bones.map((b) => b.length);
    const initial = this.currentJoints(rootLocal);
    const res = solveFabrik(rootLocal, lengths, goal, { maxIter: this.maxIter, initial });
    this.reached = res.reachable;
    // Convert absolute bone angles to local rotations (each relative to the previous).
    let parentAngle = 0;
    for (let i = 0; i < bones.length; i++) {
      bones[i].rotation = res.angles[i] - parentAngle;
      parentAngle = res.angles[i];
    }
  }

  /** Current joint positions (parent space) for FABRIK seeding — stable elbow side. */
  private currentJoints(rootLocal: Vec2): Vec2[] {
    const joints: Vec2[] = [{ x: rootLocal.x, y: rootLocal.y }];
    let angle = 0;
    let px = rootLocal.x;
    let py = rootLocal.y;
    for (const b of this.bones) {
      angle += b.rotation;
      px += dcos(angle) * b.length;
      py += dsin(angle) * b.length;
      joints.push({ x: px, y: py });
    }
    return joints;
  }
}

/** Apply an inverse transform to a world point → local point. */
function applyInv(inv: Transform, p: Vec2): Vec2 {
  return { x: inv.a * p.x + inv.c * p.y + inv.e, y: inv.b * p.x + inv.d * p.y + inv.f };
}

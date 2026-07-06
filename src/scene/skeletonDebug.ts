// SkeletonDebug — a cosmetic overlay that draws a rig's bones, joint pivots, and
// IK anchors as TRANSIENT draw commands (poly segments for bones, circles for
// pivots). Purely a development aid: every command is `transient: true` so layout
// lints ignore it, and the node is `cosmetic = true` so it never enters the hash.
// It emits ONLY transient commands — nothing it draws is content the player reads.
//
// It walks the rig subtree each draw and, for every Bone2D, strokes a segment
// from the bone origin to its tip in that bone's world frame; a small circle
// marks each joint. Anchor points (a node's `pivot`) are marked too. Toggle it by
// flipping `visible`.

import { composeTransform, makeTransform, type Transform } from '../core/math';
import type { DrawCommand } from '../render/commands';
import { Node, type NodeConfig } from './node';
import { Bone2D } from '../anim/skeleton';

export interface SkeletonDebugConfig extends NodeConfig {
  /** The rig root to visualize. Defaults to the node's parent. */
  rig?: Node;
  /** Bone segment color. Default '#e0483b'. */
  boneColor?: string;
  /** Joint pivot color. Default '#f4d35e'. */
  pivotColor?: string;
  /** Joint circle radius, px. Default 3. */
  pivotRadius?: number;
  /** Bone stroke width, px. Default 2. */
  strokeWidth?: number;
}

/** Draws a rig's bones + pivots as transient overlay commands. Cosmetic. */
export class SkeletonDebug extends Node {
  override readonly type = 'SkeletonDebug';

  rig: Node | null;
  boneColor: string;
  pivotColor: string;
  pivotRadius: number;
  strokeWidth: number;

  constructor(config: SkeletonDebugConfig = {}) {
    super(config);
    this.cosmetic = true;
    this.rig = config.rig ?? null;
    this.boneColor = config.boneColor ?? '#e0483b';
    this.pivotColor = config.pivotColor ?? '#f4d35e';
    this.pivotRadius = config.pivotRadius ?? 3;
    this.strokeWidth = config.strokeWidth ?? 2;
  }

  protected override onReady(): void {
    if (!this.rig) this.rig = this.parent;
  }

  // The overlay draws in WORLD space directly (each command carries the bone's own
  // world transform), so `world` — the debug node's own frame — is only the base
  // the rig's world transforms are already absolute against. We walk the rig and
  // emit per-bone commands with each bone's worldTransform().
  protected override draw(out: DrawCommand[], _world: Transform): void {
    const rig = this.rig;
    if (!rig) return;
    this.emitFor(rig, out);
  }

  private emitFor(node: Node, out: DrawCommand[]): void {
    if (node instanceof Bone2D) {
      const wt = node.worldTransform();
      // Bone segment: origin (0,0) → tip (length,0) in the bone's local frame.
      out.push({
        kind: 'poly',
        points: [0, 0, node.length, 0],
        closed: false,
        stroke: this.boneColor,
        strokeWidth: this.strokeWidth,
        round: true,
        transform: wt,
        z: this.z,
        transient: true,
      });
      // Joint pivot marker at the bone origin.
      out.push({
        kind: 'circle',
        cx: 0,
        cy: 0,
        radius: this.pivotRadius,
        fill: this.pivotColor,
        transform: wt,
        z: this.z,
        transient: true,
      });
      // Explicit local anchor, if any (drawn in the bone's frame, offset by pivot).
      if (node.pivot) {
        const at = composeTransform(wt, makeTransform({ x: node.pivot.x, y: node.pivot.y }, 0, { x: 1, y: 1 }));
        out.push({
          kind: 'circle',
          cx: 0,
          cy: 0,
          radius: this.pivotRadius * 0.6,
          stroke: this.pivotColor,
          strokeWidth: 1,
          transform: at,
          z: this.z,
          transient: true,
        });
      }
    }
    for (const c of node.children) this.emitFor(c, out);
  }
}

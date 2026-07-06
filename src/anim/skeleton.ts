// The rig. A Bone2D is a plain scene Node plus a `length` — the one extra fact
// IK, skinning, and the debug overlay all need (the bone's reach), which would
// otherwise live in a fragile side-table keyed by node id. A Bone2D is NOT forced
// cosmetic: a rig is legitimate, hashable TREE DATA (a game may pose it in logic
// and want that pose in world.hash()). It is the WRITERS — ClipPlayer, IkTarget,
// SkeletonDebug — that are cosmetic; the bones they write to are structure.
//
// `buildSkeleton` indexes a rig subtree by path so tracks/IK can address joints
// by a stable '/'-name path, and `resolveTracks` PREBINDS a clip's tracks to the
// actual target nodes once — so the per-frame apply is O(tracks) with zero
// lookups (the VerletChain discipline: no find() in the hot path).

import { Node, type NodeConfig } from '../scene/node';
import type { ClipChannel, ClipDef, Keyframe } from './clip';

export interface Bone2DConfig extends NodeConfig {
  /** Bone reach in local px (root→tip along +x at rotation 0). Default 0. */
  length?: number;
}

/**
 * A rig joint: a Node with a `length`. Rotation is the joint angle; children
 * inherit the transform, so a chain of Bone2Ds nested tip-to-root forms a limb.
 * Registered (`Bone2D`) so a serialized rig round-trips — `length` persists.
 */
export class Bone2D extends Node {
  override readonly type = 'Bone2D';
  /** Reach in local px along +x. Used by IK, skinning, and the debug overlay. */
  length: number;

  constructor(config: Bone2DConfig = {}) {
    super(config);
    this.length = config.length ?? 0;
  }

  /** Tip position in LOCAL space (root is the node origin; tip is `length` along +x). */
  get tip(): { x: number; y: number } {
    return { x: this.length, y: 0 };
  }

  protected override serializeProps(): Record<string, unknown> {
    return { length: this.length };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.length === 'number') this.length = props.length;
  }
}

/**
 * An index of a rig subtree: '/'-separated name path → node. Paths are relative
 * to the rig root passed to `buildSkeleton` (the root itself is '' and its direct
 * children are just their names). Ordered iteration only (a plain Map, built by a
 * deterministic DFS).
 */
export class Skeleton {
  readonly byPath = new Map<string, Node>();

  constructor(readonly root: Node) {
    this.index(root, '');
  }

  private index(node: Node, path: string): void {
    if (path !== '') this.byPath.set(path, node);
    for (const c of node.children) {
      const childPath = path === '' ? c.name : `${path}/${c.name}`;
      this.index(c, childPath);
    }
  }

  /** Resolve a track/IK target path to a node (null if the rig lacks it). */
  resolve(path: string): Node | null {
    return this.byPath.get(path) ?? null;
  }

  /** All target paths in the rig — feed to `clipIssues(def, skeleton.targets())`. */
  targets(): string[] {
    return [...this.byPath.keys()];
  }

  /** Only the Bone2D joints, by path (for IK / skinning). */
  bones(): Bone2D[] {
    const out: Bone2D[] = [];
    for (const node of this.byPath.values()) if (node instanceof Bone2D) out.push(node);
    return out;
  }
}

/** Build a skeleton index from a rig root. */
export function buildSkeleton(root: Node): Skeleton {
  return new Skeleton(root);
}

/**
 * A track prebound to its target node: the resolved Node, the channel, and the
 * clip's keyframes captured by reference. ClipPlayer holds an array of these and
 * applies each with a single write in the hot path — no path lookup, no find().
 */
export interface BoundTrack {
  node: Node;
  channel: ClipChannel;
  keys: Keyframe[];
  /** The track's path, kept for diagnostics / rebind. */
  target: string;
}

/**
 * Resolve every track of a clip against a skeleton ONCE. Tracks whose target the
 * rig doesn't contain are dropped (surfaced separately by clipIssues) so the hot
 * path never guards for a null node. Returns bound tracks in clip order.
 */
export function resolveTracks(def: ClipDef, skeleton: Skeleton): BoundTrack[] {
  const out: BoundTrack[] = [];
  for (const tr of def.tracks) {
    const node = skeleton.resolve(tr.target);
    if (node) out.push({ node, channel: tr.channel, keys: tr.keys, target: tr.target });
  }
  return out;
}

/** Apply one channel's value to a node's transform (the single hot-path write). */
export function applyChannel(node: Node, channel: ClipChannel, value: number): void {
  switch (channel) {
    case 'x':
      node.pos.x = value;
      break;
    case 'y':
      node.pos.y = value;
      break;
    case 'rotation':
      node.rotation = value;
      break;
    case 'scaleX':
      node.scale.x = value;
      break;
    case 'scaleY':
      node.scale.y = value;
      break;
    case 'opacity':
      // Opacity rides on the paint of a Sprite/Text if present; otherwise ignored.
      // (Kept transform-adjacent so a clip can fade a limb without a custom channel.)
      applyOpacity(node, value);
      break;
  }
}

function applyOpacity(node: Node, value: number): void {
  const withPaint = node as unknown as { paint?: { opacity?: number } };
  if (withPaint.paint) withPaint.paint.opacity = value;
}

// Frame-scoped node pool: hide/show instead of create/destroy, for views that
// redraw a whole entity set every frame (hordes, bullets, tiles, HP bars).
// Usage per frame: begin() → get() once per live entity → end(). Nodes are
// created on demand, reused in stable order, and surplus nodes are hidden —
// never removed — so the scene tree stays allocation-quiet at peak load.
//
// Pooled nodes are pure view: parent them to a `cosmetic = true` layer so the
// pool's grow-only node set never enters world.hash().
// (Promoted from six near-identical per-game copies — see docs/LESSONS.md.)

import type { Node } from './node';

export class NodePool<T extends Node = Node> {
  private items: T[] = [];
  private used = 0;

  constructor(
    private parent: Node,
    private make: () => T,
  ) {}

  /** Start a frame: every pooled node is up for reuse. */
  begin(): void {
    this.used = 0;
  }

  /** Claim the next node (created and parented on first use), made visible. */
  get(): T {
    if (this.used === this.items.length) this.items.push(this.parent.addChild(this.make()));
    const n = this.items[this.used++];
    n.visible = true;
    return n;
  }

  /** End a frame: hide every node not claimed since begin(). */
  end(): void {
    for (let i = this.used; i < this.items.length; i++) this.items[i].visible = false;
  }

  /** Nodes claimed this frame (call after the get() loop). */
  get liveCount(): number {
    return this.used;
  }
}

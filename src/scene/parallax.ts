// ParallaxLayer — a depth layer that scrolls at a fraction of the camera's
// motion, so far scenery (mountains, sky, moon) drifts slower than near scenery
// (reeds, foreground). Place world-space children under it and give it a
// `factor`: 0 pins the layer to the screen (infinitely far), 1 scrolls it fully
// with the world (foreground). Anything between is a middle plane.
//
// It works by tracking the active camera: setting its own position to
// `camPos·(1−factor)` cancels part of the view's scroll, leaving an effective
// scroll of exactly `factor`. Pure view — cosmetic, so it never enters
// world.hash(); it reads the camera (itself cosmetic) and touches only its own
// transform. No wall-clock, no randomness.

import { Node, type NodeConfig, type WorldContext } from './node';
import type { Camera2D } from './nodes';

type CameraHost = WorldContext & { activeCamera: Camera2D | null };

export interface ParallaxLayerConfig extends NodeConfig {
  /** Scroll fraction: 0 = pinned to screen (far), 1 = full world scroll (near). */
  factor: number;
}

export class ParallaxLayer extends Node {
  override readonly type = 'ParallaxLayer';
  // A parallax layer is pure view — keep its drift out of world.hash().
  override cosmetic = true;
  factor: number;

  constructor(config: ParallaxLayerConfig) {
    super(config);
    this.factor = config.factor;
  }

  /** Re-sync to the current camera; called each process tick (and on demand). */
  sync(): void {
    const cam = (this.world as CameraHost | null)?.activeCamera;
    if (!cam) return;
    this.pos.x = cam.pos.x * (1 - this.factor);
    this.pos.y = cam.pos.y * (1 - this.factor);
  }

  protected override onReady(): void {
    this.sync();
  }

  protected override onProcess(): void {
    this.sync();
  }
}

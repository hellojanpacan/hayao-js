// CameraController — a follow behavior for Camera2D. Chases a target node with
// an optional deadzone (slack box the target roams before the camera moves),
// smooth lerp, and world-bounds clamping so the view never shows past the edges
// of a level larger than the screen. This is the ergonomic layer on top of the
// raw view transform (World.viewTransform / World.screenToWorld).
//
// DETERMINISM: a follow camera is usually pure *view* — its smoothed position is
// derived from the target and would only add float drift to world.hash(). Mark
// the camera (and this controller) `cosmetic = true` unless the camera position
// is genuinely gameplay-meaningful (e.g. offscreen == death). This class does
// NOT set cosmetic on the camera it drives; that policy belongs to the game.

import { Node, type NodeConfig, type WorldContext } from './node';
import { clamp, lerp, type Vec2 } from '../core/math';
import type { Camera2D } from './nodes';

/** World-space rectangle the camera CENTER is kept inside (before viewport inset). */
export interface CameraBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CameraControllerConfig extends NodeConfig {
  /** Node to follow. May be set later via `follow()`. */
  target?: Node;
  /** Camera to drive. Defaults to the world's active camera each step. */
  camera?: Camera2D;
  /** Half-extents of a slack box the target may roam before the camera chases. */
  deadzone?: number | Vec2;
  /** Per-step chase factor in [0,1]; 1 snaps, lower trails. Default 0.15. */
  smooth?: number;
  /** Clamp the view to a world rectangle (the level bounds) so no void shows. */
  bounds?: CameraBounds;
}

type CameraHost = WorldContext & {
  width: number;
  height: number;
  activeCamera: Camera2D | null;
};

export class CameraController extends Node {
  override readonly type = 'CameraController';
  // Follow is view-only by default: keep the smoothed chase out of world.hash().
  override cosmetic = true;

  target: Node | null;
  private cameraRef: Camera2D | null;
  deadzone: Vec2;
  smooth: number;
  bounds: CameraBounds | null;

  constructor(config: CameraControllerConfig = {}) {
    super(config);
    this.target = config.target ?? null;
    this.cameraRef = config.camera ?? null;
    const dz = config.deadzone ?? 0;
    this.deadzone = typeof dz === 'number' ? { x: dz, y: dz } : { ...dz };
    this.smooth = config.smooth ?? 0.15;
    this.bounds = config.bounds ? { ...config.bounds } : null;
  }

  /** Point the controller at a node to follow. */
  follow(target: Node): this {
    this.target = target;
    return this;
  }

  private host(): CameraHost | null {
    return (this.world as CameraHost | null) ?? null;
  }

  private camera(): Camera2D | null {
    return this.cameraRef ?? this.host()?.activeCamera ?? null;
  }

  /** Where the camera wants to sit: the target position, clamped to bounds. */
  private desired(cam: Camera2D): Vec2 {
    const host = this.host()!;
    const tw = this.target!.worldTransform();
    let x = cam.pos.x;
    let y = cam.pos.y;
    // Deadzone: only chase the axis once the target leaves the slack box.
    const dx = tw.e - cam.pos.x;
    const dy = tw.f - cam.pos.y;
    if (Math.abs(dx) > this.deadzone.x) x = tw.e - Math.sign(dx) * this.deadzone.x;
    if (Math.abs(dy) > this.deadzone.y) y = tw.f - Math.sign(dy) * this.deadzone.y;
    if (this.bounds) {
      // Inset by half the visible extent (which grows as you zoom out) so the
      // view rectangle stays wholly inside the world. If the world is smaller
      // than the view on an axis, centre on it instead of fighting the clamp.
      const zoom = cam.zoom || 1;
      const halfW = host.width / 2 / zoom;
      const halfH = host.height / 2 / zoom;
      const loX = this.bounds.minX + halfW;
      const hiX = this.bounds.maxX - halfW;
      const loY = this.bounds.minY + halfH;
      const hiY = this.bounds.maxY - halfH;
      x = loX > hiX ? (this.bounds.minX + this.bounds.maxX) / 2 : clamp(x, loX, hiX);
      y = loY > hiY ? (this.bounds.minY + this.bounds.maxY) / 2 : clamp(y, loY, hiY);
    }
    return { x, y };
  }

  /** Jump the camera straight to its desired position (no smoothing). */
  snap(): void {
    const cam = this.camera();
    if (!cam || !this.target || !this.host()) return;
    const d = this.desired(cam);
    cam.pos.x = d.x;
    cam.pos.y = d.y;
  }

  protected override onReady(): void {
    // Start framed so frame 0 is already centered — no lurch from the origin.
    this.snap();
  }

  protected override onProcess(): void {
    const cam = this.camera();
    if (!cam || !this.target || !this.host()) return;
    const d = this.desired(cam);
    const s = clamp(this.smooth, 0, 1);
    cam.pos.x = lerp(cam.pos.x, d.x, s);
    cam.pos.y = lerp(cam.pos.y, d.y, s);
  }
}

// @hayao — the single public seam. Games and examples import ONLY from here.
// Everything below the barrel is swappable; this file is the whole API surface,
// greppable in one place (an AI-first invariant).

// ── core: the deterministic kernel ──────────────────────────────
export * from './core/math';
export * from './core/rng';
export * from './core/clock';
export * from './core/events';
export * from './core/hash';

// ── scene: the Godot-style node tree ────────────────────────────
export * from './scene/node';
// Node2D is an alias for Node — the base node already carries a 2D transform.
export { Node as Node2D } from './scene/node';
export * from './scene/nodes';
export * from './scene/tween';
export * from './scene/particles';
export * from './scene/registry';

// ── input: actions, sampling, record/replay ─────────────────────
export * from './input/actions';
export * from './input/source';

// ── physics: tilemaps, kinematic AABB, character controllers ────
export * from './physics/tilemap';
export * from './physics/aabb';
export * from './physics/platformer';
export * from './physics/spatialHash';
export * from './physics/raycast';

// ── render: display list + backends ─────────────────────────────
export * from './render/commands';
export * from './render/renderer';
export * from './render/svgString';
export * from './render/svg';
export * from './render/canvas';
export * from './render/headless';

// ── art: code-as-art helpers ────────────────────────────────────
export * from './art/palette';
export * from './art/shapes';

// ── audio ───────────────────────────────────────────────────────
export * from './audio/audio';

// ── ui: DOM overlays + shell + settings ─────────────────────────
export * from './ui/overlay';
export * from './ui/settings';
export * from './ui/shell';

// ── verify: the AI-first harness ────────────────────────────────
export * from './verify/solver';
export * from './verify/determinism';
export * from './verify/playthrough';
export * from './verify/capture';
export * from './verify/driver';
export * from './verify/bot';

// ── world + app ─────────────────────────────────────────────────
export * from './world';
export * from './app/game';
export * from './app/browser';

/** Engine version. */
export const VERSION = '0.1.0';

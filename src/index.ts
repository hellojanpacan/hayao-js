// @hayao — the single public seam. Games and examples import ONLY from here.
// Everything below the barrel is swappable; this file is the whole API surface,
// greppable in one place (an AI-first invariant).

// ── core: the deterministic kernel ──────────────────────────────
export * from './core/math';
export * from './core/projection';
export * from './core/dmath';
export * from './core/rng';
export * from './core/clock';
export * from './core/events';
export * from './core/hash';

// ── scene: the Godot-style node tree ────────────────────────────
export * from './scene/node';
// Node2D is an alias for Node — the base node already carries a 2D transform.
export { Node as Node2D } from './scene/node';
export * from './scene/nodes';
export * from './scene/iso';
export * from './scene/cameraController';
export * from './scene/parallax';
export * from './scene/pool';
export * from './scene/tween';
export * from './scene/particles';
export * from './scene/floatingText';
export * from './scene/verletChain';
export * from './scene/clipPlayer';
export * from './scene/ikTarget';
export * from './scene/skeletonDebug';
export * from './scene/light';
export * from './scene/shadow2d';
export * from './scene/tileLayer';
export * from './scene/registry';

// ── anim: authored clips, blend spaces, skeletons, IK (cosmetic view) ─
export * from './anim/clip';
export * from './anim/blend';
export * from './anim/ik';
export * from './anim/skeleton';

// ── input: actions, sampling, record/replay ─────────────────────
export * from './input/actions';
export * from './input/source';
export * from './input/gamepad';
export * from './input/haptics';
export * from './input/device';

// ── physics: tilemaps, kinematic AABB, character controllers ────
export * from './physics/tilemap';
export * from './physics/aabb';
export * from './physics/platformer';
export * from './physics/spatialHash';
export * from './physics/raycast';
// ── physics: rigid-body dynamics (plain-data world → hash/snapshot free) ─
export * from './physics/rigidBody';
export * from './physics/rigidCollide';
export * from './physics/rigidJoints';
export * from './physics/rigidStep';
export * from './physics/rigidQueries';

// ── render: display list + backends ─────────────────────────────
export * from './render/commands';
export * from './render/paint';
export * from './render/lightRun';
export * from './render/renderer';
export * from './render/svgString';
export * from './render/svg';
export * from './render/canvas';
export * from './render/webgl';
export * from './render/headless';
export * from './render/nineSlice';

// ── art: code-as-art helpers ────────────────────────────────────
export * from './art/palette';
export * from './art/shapes';
export * from './art/texture';
export * from './art/font5';
export * from './art/bitmapFont';
export * from './art/autotile';
export * from './art/duotone';
export * from './art/hero';

// ── procgen: deterministic generators + stateless scatter ───────
export * from './procgen/grid';
export * from './procgen/scatter';
export * from './procgen/cave';
export * from './procgen/terrain';
export * from './procgen/rooms';

// ── audio ───────────────────────────────────────────────────────
export * from './audio/audio';
export * from './audio/pcm';
export * from './audio/synth';
export * from './audio/analysis';
export * from './audio/theory';
export * from './audio/chord';
export * from './audio/reverb';
export * from './audio/music';
export * from './audio/lint';
export * from './audio/match';
export * from './audio/adaptive';
export * from './audio/quality';
export * from './audio/genres';
export * from './audio/zzfx';
export * from './audio/album';
export * from './audio/soundtrack';

// ── ui: DOM overlays + shell + settings ─────────────────────────
export * from './ui/overlay';
export * from './ui/settings';
export * from './ui/shell';
export * from './ui/touch';
export * from './ui/transition';
export * from './ui/toast';
export * from './ui/menuNav';

// ── verify: the AI-first harness ────────────────────────────────
export * from './verify/solver';
export * from './verify/determinism';
export * from './verify/playthrough';
export * from './verify/capture';
export * from './verify/driver';
export * from './verify/bot';
export * from './verify/layout';
export * from './verify/feel';
export * from './verify/gates';
export * from './verify/ramp';
export * from './verify/filmstrip';
export * from './verify/audioFilmstrip';
export * from './verify/ethnography';
export * from './verify/dom';

// ── logic: pure engine primitives (FSM, weighted tables, graph search) ─
export * from './logic/fsm';
export * from './logic/coroutine';
export * from './logic/random';
export * from './logic/graph';
export * from './logic/history';

// ── persist: save/load over a pluggable storage adapter + compact codecs ─
export * from './persist/storage';
export * from './persist/codec';
export * from './persist/save';
export * from './persist/achievements';

// ── content: data-driven wave/spawn directors + upgrade trees ───
export * from './content/dsl';
export * from './content/level';
export * from './content/generate';
export * from './content/campaign';
export * from './content/worldgraph';

// ── net: deterministic multiplayer (lockstep / rollback) ────────
export * from './net/players';
export * from './net/protocol';
export * from './net/transport';
export * from './net/inputBuffer';
export * from './net/lockstep';
export * from './net/rollback';
export * from './net/room';
export * from './net/browser';

// ── debug: immediate-mode draws + the Backspace runtime pane ────
export * from './debug/draw';
export * from './debug/pane';

// ── world + app ─────────────────────────────────────────────────
export * from './world';
export * from './app/game';
export * from './app/tuning';
export * from './app/browser';
export * from './app/share';

// ── workshop (browser-safe parts; the vite plugin ships via `hayao/workshop`) ──
export * from './workshop/session';
export * from './workshop/record';
export * from './workshop/timeline';
export * from './workshop/run';

/** Engine version. Must equal package.json — guarded by src/version.test.ts. */
export const VERSION = '0.5.0';

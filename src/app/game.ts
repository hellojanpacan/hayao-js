// The project system. A game is a data definition: dimensions, input map, and a
// build() that constructs the initial scene tree. `createWorld` turns it into a
// live deterministic World — used identically by the browser driver, the headless
// runner, and every test. That symmetry is the whole point.

import { World } from '../world';
import { Node } from '../scene/node';
import { DEFAULT_INPUT_MAP, type InputLog, type InputMap } from '../input/actions';
import type { ClockConfig } from '../core/clock';
import { resolveTuning, type TuningSpec, type TuningValues } from './tuning';
import { guardError } from '../core/errors';

/**
 * Optional boot splash. Rendered by the engine (so its colors are palette-guaranteed
 * and never trip a contrast escape the way a hand-rolled loading <div> can) while
 * `preload` runs. Pass `splash: false` to opt out entirely.
 */
export interface SplashConfig {
  /** Splash headline (defaults to the game title). */
  title?: string;
  /** Background/foreground pair; defaults to a contrast-guaranteed pair from the game background. */
  palette?: { bg: string; fg: string };
  /** Keep the splash up at least this long, so a fast preload doesn't flash by. */
  minDurationMs?: number;
}

export interface GameDefinition<TState extends Record<string, unknown> = Record<string, unknown>> {
  title: string;
  width?: number;
  height?: number;
  seed?: number;
  background?: string;
  clock?: ClockConfig;
  inputMap?: InputMap;
  /** Build the initial scene tree for a fresh world. */
  build(world: World<TState>): Node;
  /** Optional compact probe snapshot for verification (defaults to World.probe). */
  probe?(world: World<TState>): Record<string, unknown>;
  /**
   * Live-tunable parameters, declared once. Defaults ARE the config; Workshop and
   * tests override them via `createWorld(def, { tuning })` and the sim reads
   * resolved values with `world.tune(key)`. Values are hashed + snapshotted.
   */
  tuning?: TuningSpec;
  /**
   * Re-attach behaviors/controllers after `world.restore()` rebuilds the tree
   * from data (closures do not survive a restore). One contract serves every
   * carryover path: Workshop knob changes, variant toggles, HMR, and net rollback.
   */
  attach?(world: World<TState>): void;
  /**
   * Awaited before the world starts stepping — load fonts, sprite atlases, a
   * SoundFont, anything async. The engine holds a splash on screen until it
   * resolves, so there is no asset pop-in and no ungoverned pre-first-frame window.
   */
  preload?(world: World<TState>): Promise<void>;
  /** Boot splash config, or `false` to start on the first frame with no cover. */
  splash?: SplashConfig | false;
}

/**
 * Identity + defaults. Kept as a function so games read `export default defineGame({…})`.
 * Pass a state shape for a typed world: `defineGame<{ score: number }>({ … })`
 * types `world.state` in build/probe/attach/preload (default keeps untyped calls as-is).
 */
export function defineGame<TState extends Record<string, unknown> = Record<string, unknown>>(
  def: GameDefinition<TState>,
): Required<Pick<GameDefinition<TState>, 'width' | 'height' | 'seed' | 'inputMap' | 'background'>> & GameDefinition<TState> {
  return {
    width: 1280,
    height: 720,
    seed: 1,
    background: '#f3ecdb',
    inputMap: DEFAULT_INPUT_MAP,
    ...def,
  };
}

export interface CreateWorldOptions {
  seed?: number;
  /** Overrides for declared tuning knobs (undeclared keys are dropped). */
  tuning?: TuningValues;
}

/**
 * Build a live, deterministic World from a game definition. No browser needed.
 * `opts` as a bare number is the legacy seed override.
 */
export function createWorld<TState extends Record<string, unknown> = Record<string, unknown>>(def: GameDefinition<TState>, opts?: number | CreateWorldOptions): World<TState> {
  const o: CreateWorldOptions = typeof opts === 'number' ? { seed: opts } : (opts ?? {});
  const world = new World<TState>({
    seed: o.seed ?? def.seed ?? 1,
    width: def.width ?? 1280,
    height: def.height ?? 720,
    clock: def.clock,
    tuning: resolveTuning(def.tuning, o.tuning),
  });
  const root = def.build(world);
  // build() must return the root scene Node. A missing `return` (or returning
  // world.state, an array, etc.) otherwise crashes cryptically inside setRoot;
  // name the field and show what came back instead (issue #66).
  if (!(root instanceof Node)) {
    throw guardError({
      problem: 'build(world) did not return a Node.',
      field: 'build',
      expected: 'the root scene Node the game renders (e.g. a Node2D you addChild into)',
      received: root,
      hasReceived: true,
      hint: "Construct the root and RETURN it: build(world) { const root = new Node2D(); root.addChild(/* … */); return root; }. A missing `return` is the usual cause.",
      anchor: 'build-return',
    });
  }
  world.setRoot(root);
  if (def.probe) {
    // Instance override shadows the prototype method.
    (world as unknown as { probe: () => Record<string, unknown> }).probe = () => def.probe!(world);
  }
  return world;
}

/** The input map a game uses (with defaults applied). */
export function gameInputMap(def: GameDefinition): InputMap {
  return def.inputMap ?? DEFAULT_INPUT_MAP;
}

export interface HeadlessResult<TState extends Record<string, unknown> = Record<string, unknown>> {
  world: World<TState>;
  hash: string;
  steps: number;
}

/**
 * Run a game to completion in Node with no host — play an input log (or zero
 * steps) and return the final world + state hash. This is what tests, the CI
 * verifier, and replays call. The browser is never involved.
 */
export function runHeadless<TState extends Record<string, unknown> = Record<string, unknown>>(def: GameDefinition<TState>, inputLog?: InputLog): HeadlessResult<TState> {
  const world = createWorld(def);
  const frames = inputLog?.frames ?? [];
  for (const f of frames) world.step(f);
  return { world, hash: world.hash(), steps: frames.length };
}

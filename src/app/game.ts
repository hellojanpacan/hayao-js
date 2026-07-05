// The project system. A game is a data definition: dimensions, input map, and a
// build() that constructs the initial scene tree. `createWorld` turns it into a
// live deterministic World — used identically by the browser driver, the headless
// runner, and every test. That symmetry is the whole point.

import { World } from '../world';
import type { Node } from '../scene/node';
import { DEFAULT_INPUT_MAP, type InputLog, type InputMap } from '../input/actions';
import type { ClockConfig } from '../core/clock';
import { resolveTuning, type TuningSpec, type TuningValues } from './tuning';

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

export interface GameDefinition {
  title: string;
  width?: number;
  height?: number;
  seed?: number;
  background?: string;
  clock?: ClockConfig;
  inputMap?: InputMap;
  /** Build the initial scene tree for a fresh world. */
  build(world: World): Node;
  /** Optional compact probe snapshot for verification (defaults to World.probe). */
  probe?(world: World): Record<string, unknown>;
  /**
   * Live-tunable parameters, declared once. Defaults ARE the config; Studio and
   * tests override them via `createWorld(def, { tuning })` and the sim reads
   * resolved values with `world.tune(key)`. Values are hashed + snapshotted.
   */
  tuning?: TuningSpec;
  /**
   * Re-attach behaviors/controllers after `world.restore()` rebuilds the tree
   * from data (closures do not survive a restore). One contract serves every
   * carryover path: Studio knob changes, variant toggles, HMR, and net rollback.
   */
  attach?(world: World): void;
  /**
   * Awaited before the world starts stepping — load fonts, sprite atlases, a
   * SoundFont, anything async. The engine holds a splash on screen until it
   * resolves, so there is no asset pop-in and no ungoverned pre-first-frame window.
   */
  preload?(world: World): Promise<void>;
  /** Boot splash config, or `false` to start on the first frame with no cover. */
  splash?: SplashConfig | false;
}

/** Identity + defaults. Kept as a function so games read `export default defineGame({…})`. */
export function defineGame(def: GameDefinition): Required<Pick<GameDefinition, 'width' | 'height' | 'seed' | 'inputMap' | 'background'>> & GameDefinition {
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
export function createWorld(def: GameDefinition, opts?: number | CreateWorldOptions): World {
  const o: CreateWorldOptions = typeof opts === 'number' ? { seed: opts } : (opts ?? {});
  const world = new World({
    seed: o.seed ?? def.seed ?? 1,
    width: def.width ?? 1280,
    height: def.height ?? 720,
    clock: def.clock,
    tuning: resolveTuning(def.tuning, o.tuning),
  });
  world.setRoot(def.build(world));
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

export interface HeadlessResult {
  world: World;
  hash: string;
  steps: number;
}

/**
 * Run a game to completion in Node with no host — play an input log (or zero
 * steps) and return the final world + state hash. This is what tests, the CI
 * verifier, and replays call. The browser is never involved.
 */
export function runHeadless(def: GameDefinition, inputLog?: InputLog): HeadlessResult {
  const world = createWorld(def);
  const frames = inputLog?.frames ?? [];
  for (const f of frames) world.step(f);
  return { world, hash: world.hash(), steps: frames.length };
}

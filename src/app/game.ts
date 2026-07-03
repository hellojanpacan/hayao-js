// The project system. A game is a data definition: dimensions, input map, and a
// build() that constructs the initial scene tree. `createWorld` turns it into a
// live deterministic World — used identically by the browser driver, the headless
// runner, and every test. That symmetry is the whole point.

import { World } from '../world';
import type { Node } from '../scene/node';
import { DEFAULT_INPUT_MAP, type InputMap } from '../input/actions';
import type { ClockConfig } from '../core/clock';

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

/** Build a live, deterministic World from a game definition. No browser needed. */
export function createWorld(def: GameDefinition, seedOverride?: number): World {
  const world = new World({
    seed: seedOverride ?? def.seed ?? 1,
    width: def.width ?? 1280,
    height: def.height ?? 720,
    clock: def.clock,
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

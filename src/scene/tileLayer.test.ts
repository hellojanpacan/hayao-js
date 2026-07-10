// TileLayer: bake-once semantics, neighbourhood invalidation, and view culling.

import { describe, expect, it } from 'vitest';
import { TILE, tilemapFromAscii } from '../physics/tilemap';
import { World } from '../world';
import { Camera2D } from './nodes';
import { TileLayer, type TileCell } from './tileLayer';
import type { DrawCommand } from '../render/commands';
import { IDENTITY } from '../core/math';

/** A counting producer: one rect per solid tile. */
function makeProducer() {
  let calls = 0;
  const producer = (cell: TileCell): DrawCommand[] => {
    calls++;
    if (cell.id !== TILE.SOLID) return [];
    return [{ kind: 'rect', x: cell.x, y: cell.y, w: cell.size, h: cell.size, fill: '#654', transform: IDENTITY, z: 0 }];
  };
  return { producer, count: () => calls };
}

const MAP = ['########', '#......#', '#......#', '########'];

describe('TileLayer bake cache', () => {
  it('bakes once on first draw, then re-emits without calling the producer', () => {
    const { producer, count } = makeProducer();
    const layer = new TileLayer({ map: tilemapFromAscii(MAP, 32), tile: producer, cull: false });

    const out1: DrawCommand[] = [];
    layer.collectDraw(out1);
    expect(count()).toBe(8 * 4); // every cell baked exactly once
    expect(out1.length).toBe(20); // the solid border ring

    const out2: DrawCommand[] = [];
    layer.collectDraw(out2);
    expect(count()).toBe(8 * 4); // cache hit — no new producer calls
    expect(out2.length).toBe(out1.length);
  });

  it('setTile re-bakes only the 3×3 neighbourhood and updates the art', () => {
    const { producer, count } = makeProducer();
    const layer = new TileLayer({ map: tilemapFromAscii(MAP, 32), tile: producer, cull: false });
    layer.collectDraw([]);
    const baked = count();

    layer.setTile(3, 1, TILE.SOLID); // interior cell → full 3×3 re-bake
    expect(count()).toBe(baked + 9);

    const out: DrawCommand[] = [];
    layer.collectDraw(out);
    expect(out.length).toBe(21); // ring + the new solid
    expect(count()).toBe(baked + 9); // draw itself bakes nothing
  });

  it('the layer transform stamps every emitted command', () => {
    const { producer } = makeProducer();
    const layer = new TileLayer({ map: tilemapFromAscii(MAP, 32), tile: producer, cull: false, pos: { x: 100, y: 50 } });
    const out: DrawCommand[] = [];
    layer.collectDraw(out);
    expect(out[0].transform.e).toBe(100);
    expect(out[0].transform.f).toBe(50);
  });

  it('is cosmetic by default (tile art must stay out of world.hash)', () => {
    const { producer } = makeProducer();
    const layer = new TileLayer({ map: tilemapFromAscii(MAP, 32), tile: producer });
    expect(layer.cosmetic).toBe(true);
  });
});

describe('TileLayer view culling', () => {
  it('emits only the cells under the camera view', () => {
    // A wide 100×4 corridor of solid floor, 32px tiles → 3200px wide.
    const rows = ['#'.repeat(100), '#'.repeat(100), '#'.repeat(100), '#'.repeat(100)];
    const { producer, count } = makeProducer();

    const world = new World({ width: 320, height: 128 });
    const layer = new TileLayer({ map: tilemapFromAscii(rows, 32), tile: producer });
    world.root.addChild(layer);
    const cam = world.root.addChild(new Camera2D({ pos: { x: 160, y: 64 } }));
    world.activeCamera = cam;
    world.step([]);

    const out = world.render();
    // Visible: ~320px/32 = 10 cols + one-tile pad each side ≈ ≤13 cols × 4 rows.
    expect(out.length).toBeLessThanOrEqual(13 * 4);
    expect(out.length).toBeGreaterThanOrEqual(10 * 4);
    expect(count()).toBe(100 * 4); // bake is still whole-map, once

    // Move the camera to the far end — different cells, same bake count.
    cam.pos.x = 3100;
    const out2 = world.render();
    expect(out2.length).toBeLessThanOrEqual(13 * 4);
    expect(count()).toBe(100 * 4);
  });

  it('cull: false emits the whole map', () => {
    const rows = ['#'.repeat(100)];
    const { producer } = makeProducer();
    const world = new World({ width: 320, height: 128 });
    const layer = new TileLayer({ map: tilemapFromAscii(rows, 32), tile: producer, cull: false });
    world.root.addChild(layer);
    world.step([]);
    expect(world.render().length).toBe(100);
  });
});

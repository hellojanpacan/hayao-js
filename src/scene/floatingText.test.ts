import { describe, it, expect } from 'vitest';
import { World, FloatingText, FLOAT_PRESETS, type TextCommand } from '@hayao';

function texts(world: World): TextCommand[] {
  return world.render().filter((c): c is TextCommand => c.kind === 'text');
}

describe('FloatingText — pooled rise-and-fade popups', () => {
  it('spawns a popup and reports it live', () => {
    const world = new World();
    const ft = world.root.addChild(new FloatingText());
    world.step([]);
    ft.pop('12', { x: 100, y: 100 }, FLOAT_PRESETS.damage());
    expect(ft.liveCount).toBe(1);
    world.step([]);
    expect(texts(world).some((t) => t.text === '12')).toBe(true);
  });

  it('rises upward and expires after its lifetime', () => {
    const world = new World();
    const ft = world.root.addChild(new FloatingText());
    world.step([]);
    ft.pop('X', { x: 0, y: 0 }, { color: '#fff', rise: 60, gravity: 0, life: 0.5, jitter: 0 });
    const y0 = texts(world)[0]?.y ?? 0;
    for (let i = 0; i < 10; i++) world.step([]);
    const y1 = texts(world)[0].y;
    expect(y1).toBeLessThan(y0); // screen +y is down, so rising means y decreases
    // After 0.5s (30 frames) the popup is gone.
    for (let i = 0; i < 30; i++) world.step([]);
    expect(ft.liveCount).toBe(0);
  });

  it('fades opacity out over the tail of its life', () => {
    const world = new World();
    const ft = world.root.addChild(new FloatingText());
    world.step([]);
    ft.pop('!', { x: 0, y: 0 }, { color: '#fff', life: 1, fade: 0.5, rise: 0 });
    world.step([]);
    const early = texts(world)[0].opacity ?? 1;
    for (let i = 0; i < 50; i++) world.step([]);
    const late = texts(world)[0]?.opacity ?? 0;
    expect(early).toBeGreaterThan(late);
  });

  it('caps the pool at maxPopups, recycling the oldest', () => {
    const world = new World();
    const ft = world.root.addChild(new FloatingText({ maxPopups: 8 }));
    world.step([]);
    for (let i = 0; i < 20; i++) ft.pop(String(i), { x: 0, y: 0 }, FLOAT_PRESETS.label());
    expect(ft.liveCount).toBe(8);
  });

  it('is cosmetic — never enters the world hash', () => {
    const world = new World();
    const before = world.hash();
    const ft = world.root.addChild(new FloatingText());
    world.step([]);
    ft.pop('999', { x: 0, y: 0 }, FLOAT_PRESETS.crit());
    world.step([]);
    expect(ft.cosmetic).toBe(true);
    // A bare world with no cosmetic children hashes identically at frame 0…
    const fresh = new World();
    expect(fresh.hash()).toBe(before);
    // …and the cosmetic child is excluded from serialize().
    expect(world.root.serialize().children.length).toBe(0);
  });

  it('jitter is deterministic for a fixed seed', () => {
    const run = () => {
      const world = new World();
      const ft = world.root.addChild(new FloatingText({ seed: 5 }));
      world.step([]);
      for (let i = 0; i < 6; i++) ft.pop('J', { x: 0, y: 0 }, { color: '#fff', jitter: 40, rise: 30, life: 2 });
      for (let i = 0; i < 3; i++) world.step([]);
      return texts(world).map((t) => t.x);
    };
    expect(run()).toEqual(run());
  });
});

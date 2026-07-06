import { describe, expect, it } from 'vitest';
import { lightingIssues, runFeelGates } from './gates';
import { LightLayer, PointLight } from '../scene/light';
import { Node } from '../scene/node';
import { World } from '../world';

// Build a lit frame: an avatar at (avatarX, 50), an ambient darkness, and an
// optional pool. Returns the rendered display list + the avatar's world point.
function litFrame(opts: { ambientLevel: number; pool?: { x: number; radius: number; intensity?: number }; avatarX?: number }): {
  commands: ReturnType<World['render']>;
  avatarWorld: { x: number; y: number };
} {
  const world = new World({ seed: 1 });
  const root = new Node({ name: 'root' });
  const avatarX = opts.avatarX ?? 100;
  const layer = root.addChild(new LightLayer({ ambient: { color: '#000010', level: opts.ambientLevel }, width: 200, height: 100 }));
  if (opts.pool) layer.addChild(new PointLight({ pos: { x: opts.pool.x, y: 50 }, radius: opts.pool.radius, intensity: opts.pool.intensity ?? 1, color: '#ffffff' }));
  world.setRoot(root);
  world.step([]);
  return { commands: world.render(), avatarWorld: { x: avatarX, y: 50 } };
}

describe('lighting gate — lit readability', () => {
  it('passes when there is no light run (nothing darkens the frame)', () => {
    expect(lightingIssues([], '#ffffff', { x: 0, y: 0 })).toEqual([]);
  });

  it('flags an avatar stranded in ambient darkness (no pool over it)', () => {
    const { commands, avatarWorld } = litFrame({ ambientLevel: 0, avatarX: 180 });
    const issues = lightingIssues(commands, '#e0d0b0', avatarWorld);
    expect(issues.length).toBe(1);
    expect(issues[0]).toContain('sinks into the ambient darkness');
  });

  it('passes when a bright pool falls on the avatar', () => {
    const { commands, avatarWorld } = litFrame({ ambientLevel: 0, avatarX: 50, pool: { x: 50, radius: 80 } });
    expect(lightingIssues(commands, '#e0d0b0', avatarWorld)).toEqual([]);
  });

  it('passes when the ambient level is high enough on its own', () => {
    const { commands, avatarWorld } = litFrame({ ambientLevel: 0.9, avatarX: 180 });
    expect(lightingIssues(commands, '#e0d0b0', avatarWorld)).toEqual([]);
  });

  it('wires into runFeelGates as an optional section (lit spec + context)', () => {
    const { commands, avatarWorld } = litFrame({ ambientLevel: 0, avatarX: 180 });
    const report = runFeelGates(
      { avatarFill: '#e0d0b0', lit: true, background: '#000010' },
      { commands, avatarWorld },
    );
    const lighting = report.sections.find((s) => s.gate === 'lighting');
    expect(lighting).toBeDefined();
    expect(lighting!.issues.length).toBe(1);
    expect(report.ok).toBe(false);
  });

  it('skips the lighting gate when avatarWorld is missing', () => {
    const { commands } = litFrame({ ambientLevel: 0 });
    const report = runFeelGates({ avatarFill: '#e0d0b0', lit: true }, { commands });
    expect(report.skipped.some((s) => s.startsWith('lighting'))).toBe(true);
  });
});

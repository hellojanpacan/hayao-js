import { describe, it, expect } from 'vitest';
import { Node, IDENTITY, renderToSVGString, KENTO, type DrawCommand } from '@hayao';
import { menderNode, motionFrom, type Motion, type MenderPose } from './mender';

const MOTIONS: Motion[] = ['idle', 'run', 'rise', 'fall', 'dash', 'attack', 'hurt'];

function draw(pose: MenderPose): DrawCommand[] {
  const n = menderNode(pose);
  const out: DrawCommand[] = [];
  n.collectDraw(out, IDENTITY);
  return out;
}

describe('Mender figure', () => {
  it('builds an articulated, cosmetic figure for every motion', () => {
    for (const motion of MOTIONS) {
      const n = menderNode({ x: 0, y: 0, w: 20, h: 44, facing: 1, phase: 0.3, motion, attackT: 0.5, hurtT: motion === 'hurt' ? 1 : 0 });
      expect(n.cosmetic).toBe(true);
      const out: DrawCommand[] = [];
      n.collectDraw(out, IDENTITY);
      expect(out.length).toBeGreaterThan(10); // torso, head, 2 legs, 2 arms, core, seams…
    }
  });

  it('renders the pulsing gold core + gold seams (the kintsugi motif)', () => {
    const cmds = draw({ x: 0, y: 0, w: 20, h: 44, facing: 1, phase: 0, motion: 'idle' });
    expect(cmds.some((c) => c.gradient)).toBe(true); // the radial-gradient core
    expect(cmds.some((c) => c.shadow)).toBe(true); // glowing seams / core
    expect(cmds.some((c) => c.stroke === KENTO.ko)).toBe(true); // gold seam stroke
  });

  it('is deterministic — same pose renders identically', () => {
    const pose: MenderPose = { x: 5, y: 9, w: 20, h: 44, facing: -1, phase: 1.2, motion: 'run' };
    expect(draw(pose)).toEqual(draw(pose));
  });

  it('motionFrom classifies platformer facts', () => {
    expect(motionFrom(true, 0, 0, false, false, false)).toBe('idle');
    expect(motionFrom(true, 200, 0, false, false, false)).toBe('run');
    expect(motionFrom(false, 0, -300, false, false, false)).toBe('rise');
    expect(motionFrom(false, 0, 300, false, false, false)).toBe('fall');
    expect(motionFrom(true, 0, 0, true, false, false)).toBe('dash');
    expect(motionFrom(true, 0, 0, false, true, false)).toBe('attack');
    expect(motionFrom(true, 999, 0, false, false, true)).toBe('hurt');
  });

  it('renders a full pose sheet to valid SVG (in-memory)', () => {
    const scene = new Node({ name: 'sheet' });
    MOTIONS.forEach((motion, i) => {
      const n = menderNode({ x: 0, y: 0, w: 26, h: 60, facing: 1, phase: 0.28, motion, attackT: 0.5, hurtT: motion === 'hurt' ? 0.8 : 0 });
      n.pos = { x: 110 + i * 150, y: 190 };
      scene.addChild(n);
    });
    const out: DrawCommand[] = [];
    scene.collectDraw(out, IDENTITY);
    const svg = renderToSVGString(out, 1130, 340, KENTO.kuro);
    expect(out.length).toBeGreaterThan(70);
    expect(svg.startsWith('<svg')).toBe(true);
  });
});

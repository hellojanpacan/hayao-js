// @vitest-environment happy-dom
// Debug pane + immediate-mode debug draws: queue semantics, freeze/step
// determinism, and the Backspace toggle.

import { afterEach, describe, expect, it } from 'vitest';
import { debugDrawCount, debugLine, debugRect, debugText, drainDebugCommands, setDebugDraw, LAYER_DEBUG } from './draw';
import { DebugPane } from './pane';
import { World } from '../world';
import { makeTransform } from '../core/math';

afterEach(() => {
  setDebugDraw(true);
  drainDebugCommands(); // leave the module queue clean between tests
});

describe('debug draw queue', () => {
  it('queues, drains once, and paints above every layer', () => {
    debugRect(10, 10, 20, 20);
    debugLine(0, 0, 100, 100, { color: '#0f0' });
    debugText('hp 3', 5, 5, { screen: true });
    expect(debugDrawCount()).toBe(3);

    const view = makeTransform({ x: -50, y: 0 }, 0, { x: 1, y: 1 });
    const cmds = drainDebugCommands(view);
    expect(cmds).toHaveLength(3);
    expect(debugDrawCount()).toBe(0);
    expect(drainDebugCommands(view)).toHaveLength(0); // drained means gone

    for (const c of cmds) expect(c.layer).toBe(LAYER_DEBUG);
    // World-space entries ride the view; screen-space entries don't.
    expect(cmds[0].transform.e).toBe(-50);
    expect(cmds[2].transform.e).toBe(0);
  });

  it('setDebugDraw(false) makes calls free no-ops and clears the queue', () => {
    debugRect(0, 0, 1, 1);
    setDebugDraw(false);
    debugRect(0, 0, 1, 1);
    expect(debugDrawCount()).toBe(0);
    setDebugDraw(true);
    debugRect(0, 0, 1, 1);
    expect(debugDrawCount()).toBe(1);
  });
});

function makeHost() {
  const world = new World({ width: 320, height: 200 });
  world.step([]);
  const mount = document.createElement('div');
  document.body.appendChild(mount);
  let steps = 0;
  const host = {
    get world() {
      return world;
    },
    stepOnce: () => {
      steps++;
      world.step([]);
    },
    canvas: undefined,
    mount,
  };
  return { world, mount, host, stepCount: () => steps };
}

describe('DebugPane', () => {
  it('toggles on Backspace, holds the sim while frozen, steps exactly one frame', () => {
    const { mount, host, stepCount, world } = makeHost();
    const pane = new DebugPane(host);
    expect(pane.isOpen).toBe(false);

    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Backspace' }));
    expect(pane.isOpen).toBe(true);
    expect(mount.querySelector('.hy-debug')).not.toBeNull();
    expect(pane.held).toBe(false); // opening alone does not freeze

    // Freeze, then frame-step twice through the pane's buttons.
    const buttons = [...mount.querySelectorAll('button')];
    const freeze = buttons.find((b) => b.textContent === 'freeze')!;
    freeze.click();
    expect(pane.held).toBe(true);
    const before = world.frame;
    const step = buttons.find((b) => b.textContent === 'step')!;
    step.click();
    step.click();
    expect(stepCount()).toBe(2);
    expect(world.frame).toBe(before + 2);
    expect(pane.held).toBe(true); // stepping keeps the freeze

    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Backspace' }));
    expect(pane.isOpen).toBe(false);
    expect(pane.held).toBe(false); // closing releases the sim
    pane.dispose();
    mount.remove();
  });

  it('renders the node tree and stats, selects a node on click', () => {
    const { mount, host, world } = makeHost();
    world.root.name = 'root';
    const pane = new DebugPane(host);
    pane.open();

    const tree = mount.querySelector('.hy-dbg-tree')!;
    expect(tree.textContent).toContain('root (Node)');
    (tree.firstChild as HTMLElement).click();
    const detail = mount.querySelector('.hy-dbg-detail')!;
    expect(detail.textContent).toContain('"type": "Node"');

    const stats = mount.querySelector('.hy-debug')!.textContent!;
    expect(stats).toContain('hash');
    pane.dispose();
    mount.remove();
  });

  it('slow-mo buttons set world.timeScale', () => {
    const { mount, host, world } = makeHost();
    const pane = new DebugPane(host);
    pane.open();
    const buttons = [...mount.querySelectorAll('button')];
    buttons.find((b) => b.textContent === '¼')!.click();
    expect(world.timeScale).toBe(0.25);
    buttons.find((b) => b.textContent === '1×')!.click();
    expect(world.timeScale).toBe(1);
    pane.dispose();
    mount.remove();
  });

  it('ignores Backspace typed into form fields', () => {
    const { mount, host } = makeHost();
    const pane = new DebugPane(host);
    const inp = document.createElement('input');
    document.body.appendChild(inp);
    inp.dispatchEvent(new KeyboardEvent('keydown', { code: 'Backspace', bubbles: true }));
    expect(pane.isOpen).toBe(false);
    inp.remove();
    pane.dispose();
    mount.remove();
  });
});

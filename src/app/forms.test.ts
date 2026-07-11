import { describe, expect, it } from 'vitest';
import { pickForm, type GameDefinition } from './game';
import { Node } from '../scene/node';

// pickForm never invokes build(); a marker node is enough to tell forms apart.
const mark = (id: string) => () => new Node({ name: id });

const landscape: GameDefinition = {
  title: 'Regalia',
  width: 900,
  height: 520, // ~16:9.2 landscape
  build: mark('landscape'),
  forms: [{ width: 540, height: 960, label: 'portrait', build: mark('portrait') }],
};

describe('pickForm', () => {
  it('keeps the default landscape design on a wide container', () => {
    const f = pickForm(landscape, 1920 / 1080);
    expect(f.label).toBe('default');
    expect([f.width, f.height]).toEqual([900, 520]);
  });

  it('switches to the portrait form on a tall phone container', () => {
    const f = pickForm(landscape, 390 / 844); // iPhone-ish portrait
    expect(f.label).toBe('portrait');
    expect([f.width, f.height]).toEqual([540, 960]);
    expect(f.build).toBe(landscape.forms![0].build);
  });

  it('a form without its own build inherits the game build', () => {
    const def: GameDefinition = { title: 'g', width: 900, height: 520, build: mark('base'), forms: [{ width: 520, height: 900 }] };
    expect(pickForm(def, 0.5).build).toBe(def.build);
  });

  it('falls back to the design ratio when the container aspect is unusable', () => {
    expect(pickForm(landscape, 0).label).toBe('default');
    expect(pickForm(landscape, NaN).label).toBe('default');
  });

  it('the default design wins an exact tie', () => {
    // A form identical in ratio to the default must not displace it.
    const def: GameDefinition = { title: 'g', width: 900, height: 520, build: mark('base'), forms: [{ width: 1800, height: 1040, label: 'hd', build: mark('hd') }] };
    expect(pickForm(def, 900 / 520).label).toBe('default');
  });
});

import { describe, it, expect } from 'vitest';
import { buildSkeleton } from '../anim/skeleton';
import { clipIssues } from '../anim/clip';
import { duotone } from './duotone';
import { buildHeroRig, HERO_CLIPS, HERO_STATES, heroStateFromMotion, DuotoneHero } from './hero';

describe('duotone scheme', () => {
  it('derives four distinct tones from one base, deterministically', () => {
    const a = duotone('#2c7a90');
    const b = duotone('#2c7a90');
    expect(a).toEqual(b); // pure
    expect(a.base).toBe('#2c7a90');
    // light lifts toward paper, shade sinks toward ink → all four differ.
    const tones = new Set([a.base, a.light, a.shade, a.ink]);
    expect(tones.size).toBe(4);
    expect(a.shadow).toMatch(/^rgba\(/); // translucent contact shadow
  });
});

describe('hero rig', () => {
  it('exposes exactly the joints the clips target', () => {
    const skel = buildSkeleton(buildHeroRig());
    for (const name of ['body', 'body/torso', 'body/torso/head', 'body/torso/armBack', 'body/torso/armFront', 'body/legBack', 'body/legFront']) {
      expect(skel.resolve(name), name).not.toBeNull();
    }
  });

  it('is structurally identical for the same scheme (pure)', () => {
    const targets = (root: ReturnType<typeof buildHeroRig>) => buildSkeleton(root).targets().sort();
    expect(targets(buildHeroRig(duotone('#b23a24')))).toEqual(targets(buildHeroRig(duotone('#b23a24'))));
  });
});

describe('hero clips', () => {
  it('has all seven states', () => {
    expect(HERO_STATES).toEqual(['idle', 'run', 'jump', 'fall', 'wallSlide', 'death', 'spawn']);
  });

  it('every clip validates against the rig (no unknown targets, well-formed keys)', () => {
    const known = buildSkeleton(buildHeroRig()).targets();
    for (const state of HERO_STATES) {
      expect(clipIssues(HERO_CLIPS[state], known), state).toEqual([]);
    }
  });

  it('every clip covers the full REST channel set, so crossfades never strand a limb', () => {
    // Each clip must drive the same 13 target/channel pairs (moving or held).
    const channelSet = (state: (typeof HERO_STATES)[number]) => new Set(HERO_CLIPS[state].tracks.map((t) => `${t.target}/${t.channel}`));
    const reference = channelSet('idle');
    expect(reference.size).toBe(13);
    for (const state of HERO_STATES) {
      expect(channelSet(state), state).toEqual(reference);
    }
  });

  it('one-shot clips play once; movement clips loop', () => {
    for (const state of ['jump', 'spawn', 'death'] as const) expect(HERO_CLIPS[state].loop, state).toBe('once');
    for (const state of ['idle', 'run', 'fall', 'wallSlide'] as const) expect(HERO_CLIPS[state].loop, state).toBe('loop');
  });

  it('death and spawn fire their signal events', () => {
    expect(HERO_CLIPS.death.events?.map((e) => e.name)).toContain('dead');
    expect(HERO_CLIPS.spawn.events?.map((e) => e.name)).toContain('spawned');
  });
});

describe('heroStateFromMotion', () => {
  it('maps platformer motion to the right state', () => {
    expect(heroStateFromMotion({ onGround: true, vx: 0, vy: 0 })).toBe('idle');
    expect(heroStateFromMotion({ onGround: true, vx: 120, vy: 0 })).toBe('run');
    expect(heroStateFromMotion({ onGround: false, vx: 0, vy: -300 })).toBe('jump');
    expect(heroStateFromMotion({ onGround: false, vx: 0, vy: 300 })).toBe('fall');
    expect(heroStateFromMotion({ onGround: false, vx: 0, vy: 80, onWall: true })).toBe('wallSlide');
    expect(heroStateFromMotion({ onGround: true, vx: 0, vy: 0, dead: true })).toBe('death');
  });
});

describe('DuotoneHero node', () => {
  it('is cosmetic (never enters the hash)', () => {
    expect(new DuotoneHero().cosmetic).toBe(true);
  });

  it('tracks state and facing without throwing', () => {
    const hero = new DuotoneHero({ state: 'idle', facing: 1 });
    expect(hero.currentState).toBe('idle');
    hero.setState('run');
    expect(hero.currentState).toBe('run');
    hero.setFacing(-1);
    expect(hero.facingDir).toBe(-1);
    hero.setState('run'); // no-op, same state
    expect(hero.currentState).toBe('run');
  });
});

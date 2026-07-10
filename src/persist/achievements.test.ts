// Achievements: unlock semantics, persistence round-trip, and the
// reachability gate.

import { describe, expect, it } from 'vitest';
import { Achievements, achievementIssues, type AchievementDef } from './achievements';
import { MemoryStorage } from './storage';

const DEFS: AchievementDef[] = [
  { id: 'first-win', title: 'First Light', when: (p) => p.solved === true },
  { id: 'speedrun', title: 'Swift', description: 'Win under 100 frames', when: (p) => p.solved === true && (p.frame as number) < 100 },
  { id: 'secret-room', title: 'Off the Map', secret: true }, // event-driven, no predicate
];

describe('Achievements', () => {
  it('check() unlocks passing predicates once, in definition order', () => {
    const ach = new Achievements(DEFS, new MemoryStorage());
    const seen: string[] = [];
    ach.unlocked.connect((d) => seen.push(d.id));

    expect(ach.check({ solved: false, frame: 10 })).toEqual([]);
    const fresh = ach.check({ solved: true, frame: 42 });
    expect(fresh.map((d) => d.id)).toEqual(['first-win', 'speedrun']);
    expect(seen).toEqual(['first-win', 'speedrun']);

    // Already unlocked → never re-fires.
    expect(ach.check({ solved: true, frame: 1 })).toEqual([]);
    expect(seen.length).toBe(2);
  });

  it('unlock() is idempotent and throws on unknown ids', () => {
    const ach = new Achievements(DEFS, new MemoryStorage());
    expect(ach.unlock('secret-room')).toBe(true);
    expect(ach.unlock('secret-room')).toBe(false);
    expect(() => ach.unlock('nope')).toThrow(/no such achievement/);
  });

  it('persists unlocks across instances sharing a storage', () => {
    const storage = new MemoryStorage();
    const a = new Achievements(DEFS, storage);
    a.unlock('secret-room');
    a.check({ solved: true, frame: 500 }); // first-win only

    const b = new Achievements(DEFS, storage);
    expect(b.isUnlocked('secret-room')).toBe(true);
    expect(b.isUnlocked('first-win')).toBe(true);
    expect(b.isUnlocked('speedrun')).toBe(false);
    expect(b.progress()).toEqual({ unlocked: 2, total: 3 });
  });

  it('corrupt persisted meta is a clean miss', () => {
    const storage = new MemoryStorage();
    storage.set('achievements', '{not json');
    const ach = new Achievements(DEFS, storage);
    expect(ach.progress().unlocked).toBe(0);
  });

  it('reset() clears unlocks and storage', () => {
    const storage = new MemoryStorage();
    const ach = new Achievements(DEFS, storage);
    ach.unlock('secret-room');
    ach.reset();
    expect(ach.isUnlocked('secret-room')).toBe(false);
    expect(new Achievements(DEFS, storage).isUnlocked('secret-room')).toBe(false);
  });

  it('list() marks unlock state and duplicate ids throw at construction', () => {
    const ach = new Achievements(DEFS, new MemoryStorage());
    ach.unlock('secret-room');
    expect(ach.list().map((e) => e.unlocked)).toEqual([false, false, true]);
    expect(() => new Achievements([DEFS[0], DEFS[0]], new MemoryStorage())).toThrow(/duplicate/);
  });
});

describe('achievementIssues', () => {
  const timeline = [
    { solved: false, frame: 10 },
    { solved: false, frame: 50 },
    { solved: true, frame: 90 },
  ];

  it('passes when every predicate fires somewhere on the timeline', () => {
    expect(achievementIssues(DEFS, timeline)).toEqual([]);
  });

  it('flags predicates that never fire', () => {
    const defs: AchievementDef[] = [{ id: 'impossible', title: 'Never', when: (p) => p.frame === -1 }];
    const issues = achievementIssues(defs, timeline);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/never unlocked/);
  });

  it('flags throwing predicates and duplicate ids', () => {
    const defs: AchievementDef[] = [
      { id: 'dup', title: 'A', when: (p) => (p.missing as { deep: boolean }).deep },
      { id: 'dup', title: 'B' },
    ];
    const issues = achievementIssues(defs, timeline);
    expect(issues.some((i) => i.includes('duplicate'))).toBe(true);
    expect(issues.some((i) => i.includes('threw'))).toBe(true);
  });
});

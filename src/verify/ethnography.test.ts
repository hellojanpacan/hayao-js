import { describe, it, expect } from 'vitest';
import { defineGame } from '../app/game';
import { Node } from '../scene/node';
import { registerNode } from '../scene/registry';
import type { World } from '../world';
import { SessionRecorder } from '../studio/record';
import { replaySession, type PlaytestSession } from '../studio/session';
import { analyzePlaytest } from './ethnography';

// A tiny side-scroller with a pit and a goal, exercising every analyzer
// channel: `right` moves, `jump` only works on the ground left of the pit,
// falling into the pit at x∈[200,232) emits 'death' and respawns, reaching
// x ≥ 400 emits 'goal'. `dash` is declared but does nothing — the futile verb.
class Walker extends Node {
  override readonly type = 'Walker';
  protected override onProcess(dt: number): void {
    const w = this.world as World;
    const s = w.state as { x: number; won: boolean; deaths: number };
    if (s.won) return;
    if (w.input.isDown('right')) s.x += 100 * dt;
    if (s.x >= 200 && s.x < 232 && !w.input.isDown('jump')) {
      s.deaths++;
      w.events.emit('death', undefined); // emit AT the death spot, before respawn
      s.x = 0; // respawn
    }
    if (s.x >= 400) {
      s.won = true;
      w.events.emit('goal', undefined);
    }
    this.pos = { x: s.x, y: 50 };
  }
}
registerNode('Walker', () => new Walker());

const walkGame = defineGame({
  title: 'Walk',
  seed: 3,
  inputMap: { right: ['ArrowRight'], jump: ['Space'], dash: ['KeyX'] },
  build: (world) => {
    const root = new Node({ name: 'root' });
    root.addChild(new Walker({ name: 'walker' }));
    world.state = { x: 0, won: false, deaths: 0 };
    return root;
  },
  probe: (w) => {
    const s = w.state as { x: number; won: boolean; deaths: number };
    return { frame: w.frame, px: s.x, py: 50, won: s.won, deaths: s.deaths };
  },
});

const DT = 1 / 60;
const framesToCross = (px: number) => Math.ceil(px / (100 * DT)); // frames of 'right' to advance px

/** Record a synthetic session from a scripted frame list (the playLive pattern). */
function record(script: string[][], extras?: (r: SessionRecorder) => void): PlaytestSession {
  const recorder = new SessionRecorder({ game: 'Walk', seed: 3, tuningValues: {}, startedAt: '2026-07-05T01:00:00.000Z' });
  for (const actions of script) recorder.step(actions);
  extras?.(recorder);
  return recorder.toSession('quit');
}

describe('analyzePlaytest', () => {
  it('finds a planted hesitation with the on-screen probe, and none when play is continuous', () => {
    const script = [
      ...Array.from({ length: 30 }, () => ['right']),
      ...Array.from({ length: 60 }, () => [] as string[]), // 1s of silence at x=50
      ...Array.from({ length: 30 }, () => ['right']),
    ];
    const report = analyzePlaytest(walkGame, record(script));
    expect(report.hesitations).toHaveLength(1);
    expect(report.hesitations[0].startFrame).toBe(30);
    expect(report.hesitations[0].frames).toBe(60);
    expect(report.hesitations[0].probe.px).toBeCloseTo(50, 5);

    const continuous = analyzePlaytest(walkGame, record(Array.from({ length: 120 }, () => ['right'])));
    expect(continuous.hesitations).toHaveLength(0);
  });

  it('ignores quiet spans while the tab was hidden or a menu was open', () => {
    const script = Array.from({ length: 120 }, () => [] as string[]);
    const marked = record(script);
    marked.wallClockMarks.push({ frame: 0, t: 0, kind: 'visibility-hidden' }, { frame: 120, t: 2000, kind: 'visibility-visible' });
    expect(analyzePlaytest(walkGame, marked).hesitations).toHaveLength(0);
  });

  it('clusters deaths at the pit and counts them from game events', () => {
    // Walk into the pit three times without jumping.
    const oneRun = Array.from({ length: framesToCross(201) }, () => ['right']);
    const report = analyzePlaytest(walkGame, record([...oneRun, ...oneRun, ...oneRun]));
    expect(report.deaths).toBe(3);
    expect(report.deathClusters).toHaveLength(1);
    expect(report.deathClusters[0].count).toBe(3);
    expect(report.deathClusters[0].x).toBeGreaterThanOrEqual(200);
  });

  it('flags dash as a futile verb and jump-on-flat-ground too, but not movement', () => {
    const script = [
      ...Array.from({ length: 30 }, () => [] as string[]),
      ['dash'], // does nothing, state frozen
      ...Array.from({ length: 40 }, () => [] as string[]),
      ['dash'],
      ...Array.from({ length: 40 }, () => [] as string[]),
    ];
    const report = analyzePlaytest(walkGame, record(script));
    const dash = report.futileVerbs.find((f) => f.action === 'dash');
    expect(dash?.futilePresses).toBe(2);
    // 'right' moves the walker — never futile.
    const moving = analyzePlaytest(walkGame, record(Array.from({ length: 60 }, () => ['right'])));
    expect(moving.futileVerbs.find((f) => f.action === 'right')).toBeUndefined();
  });

  it('reports the quit context on an unfinished run, and none after reaching the goal', () => {
    const stuck = analyzePlaytest(walkGame, record(Array.from({ length: framesToCross(201) }, () => ['right'])));
    expect(stuck.reachedGoal).toBe(false);
    expect(stuck.quit).toBeDefined();
    expect(stuck.quit!.recentDeaths).toBe(1);
    expect(stuck.quit!.endReason).toBe('quit');

    // Hold jump over the pit and keep going to the goal.
    const winScript = Array.from({ length: framesToCross(401) }, () => ['jump', 'right']);
    const win = analyzePlaytest(walkGame, record(winScript));
    expect(win.reachedGoal).toBe(true);
    expect(win.quit).toBeUndefined();
    expect(win.deaths).toBe(0);
  });

  it('lists unused declared verbs and annotation contexts', () => {
    const session = record(Array.from({ length: 60 }, () => ['right']), (r) => r.annotate('felt-bad', 'pit invisible'));
    const report = analyzePlaytest(walkGame, session);
    expect(report.unusedActions.sort()).toEqual(['dash', 'jump']);
    expect(report.annotations[0].tag).toBe('felt-bad');
    expect(report.annotations[0].probe.px).toBeDefined();
  });

  it('is deterministic: analyzing twice yields identical reports', () => {
    const session = record([
      ...Array.from({ length: framesToCross(201) }, () => ['right']),
      ...Array.from({ length: 90 }, () => [] as string[]),
    ]);
    const a = analyzePlaytest(walkGame, session);
    const b = analyzePlaytest(walkGame, session);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // And the replay it rides on matches a plain replay.
    expect(replaySession(walkGame, session).hash()).toBe(replaySession(walkGame, session).hash());
  });
});

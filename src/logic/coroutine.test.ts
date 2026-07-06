import { describe, it, expect, vi } from 'vitest';
import { Coroutines, sleep, waitFor, nextStep, race, all, type Wait } from './coroutine';

const DT = 0.1;

describe('Coroutines', () => {
  it('runs a body to its first yield on the step after start, and sleep() counts exact fixed steps', () => {
    const co = new Coroutines();
    const log: string[] = [];
    co.start(function* () {
      log.push('begin');
      yield sleep(0.3);
      log.push('woke');
    });
    expect(log).toEqual([]); // nothing runs at start()
    co.step(DT); // first resume: body up to the yield
    expect(log).toEqual(['begin']);
    co.step(DT); // 0.3 → 0.2
    co.step(DT); // → 0.1
    expect(log).toEqual(['begin']);
    co.step(DT); // → ~0 (float drift absorbed): resumes
    expect(log).toEqual(['begin', 'woke']);
    expect(co.active).toBe(0);
  });

  it('waitFor resumes on the first step its condition holds, checked once per step', () => {
    const co = new Coroutines();
    let flag = false;
    let checks = 0;
    let woke = false;
    co.start(function* () {
      yield waitFor(() => {
        checks++;
        return flag;
      });
      woke = true;
    });
    co.step(DT); // to the yield
    co.step(DT);
    co.step(DT);
    expect(checks).toBe(2);
    expect(woke).toBe(false);
    flag = true;
    co.step(DT);
    expect(checks).toBe(3);
    expect(woke).toBe(true);
  });

  it('race resumes with the winning index (ties go to the lowest index)', () => {
    const co = new Coroutines();
    let flag = false;
    let winner = -1;
    co.start(function* () {
      winner = yield race(sleep(10), waitFor(() => flag), sleep(10));
    });
    co.step(DT);
    co.step(DT);
    expect(winner).toBe(-1);
    flag = true;
    co.step(DT);
    expect(winner).toBe(1);
    expect(co.active).toBe(0);
  });

  it('race between two completing waits picks the lowest index deterministically', () => {
    const co = new Coroutines();
    let winner = -1;
    co.start(function* () {
      winner = yield race(sleep(0.1), sleep(0.1));
    });
    co.step(DT); // to the yield
    co.step(DT); // both complete this step
    expect(winner).toBe(0);
  });

  it('all waits for every arm', () => {
    const co = new Coroutines();
    let flag = false;
    let woke = false;
    co.start(function* () {
      yield all(sleep(0.2), waitFor(() => flag));
      woke = true;
    });
    co.step(DT); // to the yield
    flag = true;
    co.step(DT); // cond met, sleep 0.2 → 0.1
    expect(woke).toBe(false);
    co.step(DT); // sleep done → all done
    expect(woke).toBe(true);
  });

  it('advances concurrent runners in insertion order, every step', () => {
    const co = new Coroutines();
    const log: string[] = [];
    const ticker = (tag: string) =>
      function* (): Generator<Wait, void, number> {
        for (let i = 0; i < 3; i++) {
          log.push(`${tag}${i}`);
          yield nextStep();
        }
      };
    co.start(ticker('a'));
    co.start(ticker('b'));
    co.step(DT);
    co.step(DT);
    co.step(DT);
    expect(log).toEqual(['a0', 'b0', 'a1', 'b1', 'a2', 'b2']);
  });

  it('a coroutine started during step() first runs on the NEXT step', () => {
    const co = new Coroutines();
    const log: string[] = [];
    co.start(function* () {
      co.start(function* () {
        log.push('child');
        yield nextStep();
      });
      log.push('parent');
      yield nextStep();
    });
    co.step(DT);
    expect(log).toEqual(['parent']); // child deferred
    co.step(DT);
    expect(log).toEqual(['parent', 'child']);
  });

  it('yielding a handle joins that coroutine', () => {
    const co = new Coroutines();
    const log: string[] = [];
    const worker = co.start(function* () {
      yield sleep(0.2);
      log.push('worker done');
    });
    co.start(function* () {
      yield worker;
      log.push('joined');
    });
    co.step(DT); // both reach their yields
    co.step(DT); // worker sleeping
    expect(log).toEqual([]);
    co.step(DT); // worker completes
    expect(worker.done).toBe(true);
    co.step(DT); // joiner sees done
    expect(log).toEqual(['worker done', 'joined']);
  });

  it('stop() halts a runner; stopAll() clears everything', () => {
    const co = new Coroutines();
    let ran = false;
    const h = co.start(function* () {
      yield sleep(0.1);
      ran = true;
    });
    co.step(DT);
    h.stop();
    expect(h.done).toBe(true);
    co.step(DT);
    co.step(DT);
    expect(ran).toBe(false);
    co.start(function* () {
      yield sleep(1);
    });
    expect(co.active).toBe(1);
    co.stopAll();
    expect(co.active).toBe(0);
  });

  it('an exception kills only the throwing runner, with a warn naming it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const co = new Coroutines();
      const log: string[] = [];
      co.start(function* (): Generator<Wait, void, number> {
        yield nextStep();
        throw new Error('boom');
      }, 'kamikaze');
      co.start(function* () {
        log.push('alive');
        yield nextStep();
        log.push('still alive');
      });
      co.step(DT);
      co.step(DT); // kamikaze throws on resume
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain('kamikaze');
      expect(log).toEqual(['alive', 'still alive']);
      expect(co.active).toBe(0);
    } finally {
      warn.mockRestore();
    }
  });
});

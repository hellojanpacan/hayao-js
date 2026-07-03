import { describe, expect, it } from 'vitest';
import { RingBuffer, UndoStack } from './history';

// ── UndoStack ───────────────────────────────────────────────────
describe('UndoStack', () => {
  it('records and walks undo/redo over cloned state', () => {
    const u = new UndoStack<{ n: number }>();
    u.record({ n: 1 });
    u.record({ n: 2 });
    u.record({ n: 3 });
    expect(u.canUndo).toBe(true);
    expect(u.canRedo).toBe(false);
    expect(u.undo()).toEqual({ n: 2 });
    expect(u.undo()).toEqual({ n: 1 });
    expect(u.undo()).toBeUndefined(); // at the floor
    expect(u.redo()).toEqual({ n: 2 });
    expect(u.current()).toEqual({ n: 2 });
  });

  it('clones so callers cannot mutate history', () => {
    const u = new UndoStack<{ n: number }>();
    const state = { n: 1 };
    u.record(state);
    state.n = 99; // mutate after recording
    expect(u.current()).toEqual({ n: 1 });
    const got = u.current()!;
    got.n = 42; // mutate the returned clone
    expect(u.current()).toEqual({ n: 1 });
  });

  it('recording after an undo drops the redo branch', () => {
    const u = new UndoStack<{ n: number }>();
    u.record({ n: 1 });
    u.record({ n: 2 });
    u.undo();
    u.record({ n: 5 });
    expect(u.canRedo).toBe(false);
    expect(u.current()).toEqual({ n: 5 });
    expect(u.undo()).toEqual({ n: 1 });
  });

  it('bounds memory at the limit, dropping oldest', () => {
    const u = new UndoStack<{ n: number }>({ limit: 3 });
    for (let i = 1; i <= 6; i++) u.record({ n: i });
    expect(u.size).toBe(3);
    expect(u.current()).toEqual({ n: 6 });
    expect(u.undo()).toEqual({ n: 5 });
    expect(u.undo()).toEqual({ n: 4 });
    expect(u.undo()).toBeUndefined(); // 1–3 fell off the horizon
  });

  it('clears', () => {
    const u = new UndoStack<number>();
    u.record(1);
    u.clear();
    expect(u.size).toBe(0);
    expect(u.current()).toBeUndefined();
    expect(u.canUndo).toBe(false);
  });
});

// ── RingBuffer ──────────────────────────────────────────────────
describe('RingBuffer', () => {
  it('fills then overwrites oldest, oldest→newest order', () => {
    const r = new RingBuffer<number>(3);
    expect(r.length).toBe(0);
    r.push(1);
    r.push(2);
    r.push(3);
    expect(r.isFull).toBe(true);
    expect(r.toArray()).toEqual([1, 2, 3]);
    r.push(4);
    expect(r.toArray()).toEqual([2, 3, 4]); // 1 evicted
    r.push(5);
    expect(r.toArray()).toEqual([3, 4, 5]);
    expect(r.latest()).toBe(5);
    expect(r.at(0)).toBe(3);
    expect(r.at(2)).toBe(5);
    expect(r.at(3)).toBeUndefined();
  });

  it('models an 8-frame ghost trail', () => {
    const trail = new RingBuffer<{ x: number }>(8);
    for (let f = 0; f < 20; f++) trail.push({ x: f });
    expect(trail.length).toBe(8);
    expect(trail.toArray().map((p) => p.x)).toEqual([12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('clears and rejects a bad capacity', () => {
    const r = new RingBuffer<number>(2);
    r.push(1);
    r.clear();
    expect(r.length).toBe(0);
    expect(r.latest()).toBeUndefined();
    expect(() => new RingBuffer<number>(0)).toThrow();
  });
});

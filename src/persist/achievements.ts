// Achievements — deterministic unlock logic over the game's own probe, with
// meta-persistence (unlocks survive across runs, OUTSIDE world.hash()).
//
// The split that keeps determinism honest:
//   · WHEN an achievement unlocks is pure sim data — a predicate over
//     `world.probe()` (or an explicit `unlock()` call from deterministic game
//     code). The same playthrough always unlocks the same set, so a verify
//     gate can PROVE every achievement is reachable (achievementIssues).
//   · THAT it stays unlocked is meta-state, persisted via a StorageAdapter
//     like settings — never hashed, never snapshotted with the world.
// Presentation (the toast) is DOM chrome — see ui/toast.ts.

import { Signal } from '../core/events';
import { defaultStorage, type StorageAdapter } from './storage';

export interface AchievementDef {
  /** Stable id — the persistence key. Never rename a shipped id. */
  id: string;
  title: string;
  description?: string;
  /** Hidden in lists until unlocked ("???"). */
  secret?: boolean;
  /**
   * Deterministic unlock predicate over the game's probe, evaluated by
   * `check(probe)` (call it after stepping, with `world.probe()`). Omit for
   * achievements unlocked explicitly via `unlock(id)` from game logic.
   */
  when?: (probe: Record<string, unknown>) => boolean;
}

/** An achievement plus its live unlock state (for menus/lists). */
export interface AchievementEntry extends AchievementDef {
  unlocked: boolean;
}

/**
 * The achievement store: definitions + persisted unlock set + an `unlocked`
 * signal for presenters (ui/toast.ts subscribes to it).
 *
 *   const ach = new Achievements(DEFS);
 *   attachAchievementToasts(ach);
 *   // after stepping:
 *   ach.check(world.probe());
 *   // or event-driven from deterministic game code:
 *   world.events.on('boss-down', () => ach.unlock('first-boss'));
 */
export class Achievements {
  /** Fires once per fresh unlock, in definition order. */
  readonly unlocked = new Signal<AchievementDef>();

  private readonly defs: AchievementDef[];
  private readonly byId = new Map<string, AchievementDef>();
  private readonly done = new Set<string>();
  private readonly storage: StorageAdapter;
  private readonly key: string;

  constructor(defs: AchievementDef[], storage: StorageAdapter = defaultStorage('hayao.meta.'), key = 'achievements') {
    this.defs = defs;
    this.storage = storage;
    this.key = key;
    for (const d of defs) {
      if (this.byId.has(d.id)) throw new Error(`Achievements: duplicate id '${d.id}'`);
      this.byId.set(d.id, d);
    }
    // Load persisted unlocks; unknown ids are kept (a newer save meeting an
    // older build must not silently erase progress).
    for (const id of this.loadIds()) this.done.add(id);
  }

  private loadIds(): string[] {
    const raw = this.storage.get(this.key);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return []; // corrupt meta is a clean miss, never a crash
    }
  }

  private persist(): void {
    this.storage.set(this.key, JSON.stringify([...this.done]));
  }

  isUnlocked(id: string): boolean {
    return this.done.has(id);
  }

  /**
   * Unlock by id (event-driven achievements). Returns true when this call was
   * the fresh unlock (fires the signal + persists); false if already unlocked.
   * Unknown ids throw — a typo here would otherwise rot silently.
   */
  unlock(id: string): boolean {
    const def = this.byId.get(id);
    if (!def) throw new Error(`Achievements.unlock('${id}'): no such achievement. Known: ${[...this.byId.keys()].join(', ')}`);
    if (this.done.has(id)) return false;
    this.done.add(id);
    this.persist();
    this.unlocked.emit(def);
    return true;
  }

  /**
   * Evaluate every still-locked `when` predicate against a probe snapshot and
   * unlock the ones that pass (definition order). Returns the fresh unlocks.
   * Call after stepping — per frame is fine, predicates are cheap reads.
   */
  check(probe: Record<string, unknown>): AchievementDef[] {
    const fresh: AchievementDef[] = [];
    for (const d of this.defs) {
      if (!d.when || this.done.has(d.id)) continue;
      if (d.when(probe)) {
        this.done.add(d.id);
        fresh.push(d);
      }
    }
    if (fresh.length > 0) {
      this.persist();
      for (const d of fresh) this.unlocked.emit(d);
    }
    return fresh;
  }

  /** Every definition with its live unlock state, in definition order. */
  list(): AchievementEntry[] {
    return this.defs.map((d) => ({ ...d, unlocked: this.done.has(d.id) }));
  }

  /** `{ unlocked, total }` for a "7 / 12" progress readout. */
  progress(): { unlocked: number; total: number } {
    let n = 0;
    for (const d of this.defs) if (this.done.has(d.id)) n++;
    return { unlocked: n, total: this.defs.length };
  }

  /** Clear all unlocks (a settings-menu "reset progress" action). */
  reset(): void {
    this.done.clear();
    this.storage.remove(this.key);
  }
}

/**
 * Verify gate: prove the achievement set is sound against a recorded
 * playthrough. Returns human-readable issues (empty = pass):
 *   · a `when` achievement whose predicate never fired across the timeline
 *     (unreachable as played — either the run or the predicate is wrong);
 *   · predicate throws on a probe (reads a field the probe doesn't expose).
 * Feed it the frames from `recordTimeline` (verify/playthrough) of a FULL
 * solver/bot run, so "reachable" means machine-proven, not hoped.
 * Achievements without `when` are skipped — assert those with an explicit
 * `expect(ach.isUnlocked(...))` after driving the event that grants them.
 */
export function achievementIssues(defs: AchievementDef[], timeline: Record<string, unknown>[]): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const d of defs) {
    if (seen.has(d.id)) issues.push(`duplicate achievement id '${d.id}'`);
    seen.add(d.id);
  }
  for (const d of defs) {
    if (!d.when) continue;
    let fired = false;
    for (const probe of timeline) {
      try {
        if (d.when(probe)) {
          fired = true;
          break;
        }
      } catch (err) {
        issues.push(`achievement '${d.id}': when() threw on a probe frame — ${(err as Error).message}`);
        fired = true; // one report per achievement, not per frame
        break;
      }
    }
    if (!fired) issues.push(`achievement '${d.id}' never unlocked across the ${timeline.length}-frame timeline — unreachable as played`);
  }
  return issues;
}

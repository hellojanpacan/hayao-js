---
name: verify-determinism
description: Prove a hayao game deterministic and winnable using the engine's headless verify harness — run it, read its failures, and fix the root cause. Use before presenting any hayao game, and whenever a hash divergence, snapshot instability, or solver failure appears.
---

# Verify determinism (and winnability)

hayao's promise is that a game's correctness is *proven headlessly*, not
eyeballed. This skill wraps the engine's verify harness: what to run, what each
failure means, and how to fix causes instead of symptoms.

## What to run

- **Engine repo (`hayao-js`)**: `npm run verify` — chains invariants (static
  bans) → verify suites (solver + determinism + golden hashes) → feel gates.
  Scope to one game with `npm run verify -- <slug>`. Also `npm run check`
  (types) and `npm test` first; they fail faster.
- **Consumer project** (from `npm create hayao`): `npm run verify` runs the
  project's `verify.ts` proof harness.
- **Ad-hoc / new harness**: the engine exports determinism assertions on its
  public surface (grep the installed `.d.ts` or `docs/API.md` for
  `assertDeterministic`, `assertSnapshotStable`, `world.hash`, solver entry
  points — inspect for exact signatures, never assume). The canonical shape:

  ```ts
  // Two worlds from the same factory, replaying the same input log,
  // must land on the same hash.
  assertDeterministic(() => createWorld(myGame), inputLog);
  // Winnability: every level machine-proven before you present it.
  assertSolvable(myPuzzle, { level: 0 });
  ```

## Reading failures — root causes, not symptoms

**Hash divergence** (two replays disagree): a nondeterminism leak. Hunt in
this order — it covers nearly every real case:

1. `Math.random` / `Date.now` / `performance.now` / argless `new Date()` in
   sim code. All randomness must flow through `world.rng`; all time from the
   fixed clock.
2. Iteration over a `Set` or object keys in logic. Use arrays or
   insertion-ordered maps.
3. Sim state living in module-level variables or closures instead of
   `world.state` / the scene tree — it escapes the hash silently, then
   diverges on restart or replay.
4. Wall-clock `advance(dt)` values leaking into logic. The accumulator may see
   wall time; the sim must only see fixed steps.

**Snapshot instability** (`assertSnapshotStable` fails: save → load → run ≠
run): some state isn't serialized. Move it into `world.state` or node fields.

**Cosmetic leakage** (hash changes when only visuals changed): a pure-view
node is missing `cosmetic = true`. Never "fix" this by weakening the check.

**Solver failure** (a level is unwinnable): the level or the rules are wrong.
Fix the content or the `Puzzle` moves — never ship a level the solver cannot
beat, and never delete the proof to make the suite pass.

**Golden hash mismatch** after an intentional sim change (engine repo):
re-record with `UPDATE_GOLDEN=1 npm run verify` and commit `golden.json` —
only when the behavior change was intended.

## The gate

This plugin installs a Stop hook that runs the verify harness when hayao
source changed in the session. If it blocks you: fix the failure it printed —
that is the point. Do not bypass it by weakening a check, deleting a proof, or
marking sim state cosmetic. (`HAYAO_SKIP_GATE=1` exists for humans running
non-game housekeeping; it is not for you to set.)

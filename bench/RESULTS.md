# bench results — can a fresh session author a verified game from the docs alone?

One row per run. A run is **done** only if the collector (not the agent)
sees check + test + invariants + verify green, the file contract complete,
and zero out-of-scope changes. `verify iters` = how many times the agent ran
the gate in-session, counted from the transcript (includes the golden
bootstrap run and the final confirmation run). Full metrics per run live in
`bench/runs/<id>.json`.

| date | spec | model / session | done | check | test | verify | verify iters | wall | tokens / cost | hallucinated @hayao names |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-07-03 | 01-beatgate | fable-5, fresh subagent | ✅ | ✓ | ✓ | ✓ | 4 | 14m | ~113k / n/a | none (shipped or transient) |

## Run notes

### 2026-07-03 · 01-beatgate · pilot

- **Session vehicle:** the `claude` CLI on this machine is not logged in
  (headless `-p` returns 401), so the clean session was a fresh subagent —
  no conversation context, cwd = the throwaway worktree, prompt =
  bench/prompt.md + the spec verbatim. Iteration and hallucination counts
  come from the subagent transcript (parsed by collect.ts); token count is
  the subagent total (112,810); per-run USD cost is unavailable outside the
  CLI. 53 tool uses, 824s wall.
- **Outcome: done** (collector exit 0, run record
  `bench/runs/20260703-pilot-beatgate.json`). Shipped the full contract —
  pure `logic.ts`, `game.ts`, `verify.ts` with scripted win (10/10 hits)
  AND loss (3 misses) runs, frame-edge exactness proof, determinism +
  snapshot checks, pinned golden, 10 unit tests, feel probes with derived
  (not vibed) windows, reviewed filmstrip, hub card. Zero failures in other
  examples' verify sections; zero out-of-scope file changes.
- **Iterations:** `check` ×2 (green on first real run), `test` green on 2nd
  (agent's own float-edge test bug), `verify` ×4 = bootstrap
  (`UPDATE_GOLDEN=1`, 3 failures) → fix → green → final full confirmation.
- **Hallucinations: zero.** Every `@hayao` name imported exists with the
  documented signature — the agent grepped `docs/API.md` before writing
  imports, exactly as AGENTS.md instructs. The API digest did its job; the
  claim survives its first contact at difficulty 1/6.
- **Where the iterations went (the finding):** none of the three verify
  failures were API hallucinations. Two were the missing-release-frame
  input trap (documented in FUN.md; the agent read it and hit it anyway),
  one was a feel window invented before measuring. The friction is in
  *affordances*, not naming.

## Doc/API fixes suggested (batch 1 — pilot)

Every failure is a bug report against the docs/API, not the agent. Each
verified against source before listing. Triage: doc gap · doc lie · API
trap · agent error.

1. **[doc lie] VERIFICATION.md §"The gate" is stale.** Line 163 says "Wire
   your game's puzzle + game into `scripts/verify.ts`" — but that runner
   auto-discovers `examples/<slug>/verify.ts`, and CONVENTIONS.md forbids
   touching `scripts/`. The real contract (default-export
   `verify(t: VerifyContext)`) is documented only in a comment inside
   `scripts/verify.ts`. Smallest fix: replace the sentence with the
   auto-discovery contract. (The pilot agent recovered by reading the
   runner's source — a doc lie that costs a detour, not a failure.)
2. **[API trap, confirmed in src] Overlay keys double-fire into the input
   map.** `src/ui/overlay.ts:111` handles Enter/Space with
   `preventDefault()` but not `stopPropagation()`, so the same keydown
   reaches `KeyboardSource` and lands as a `confirm` edge on the next step —
   dismissing a game-over overlay can instantly score a miss in the fresh
   run. No doc mentions it; the pilot absorbed it with a 12-frame
   start-grace in game logic. Fix: stop propagation of handled keys in the
   overlay (engine change + test), or document the grace-period pattern in
   CONVENTIONS. This one deserves the engine fix — every future
   confirm-driven game will hit it.
3. **[API trap] `assertSnapshotStable` doesn't assert.** Despite the
   `assert*` prefix it returns `{ ok, hashA, hashB }` and never throws
   (src/verify/determinism.ts:67; its own docstring says "Assert that…").
   Sibling `assertSolvable` throws, `assertDeterministic` reports — the
   family is inconsistent and invites an unchecked-return bug that would
   silently pass a broken suite. Fix: make it throw on `!ok` (or rename to
   `checkSnapshotStable` alongside the existing `checkDeterministic`).
4. **[doc gap] No title-screen recipe, and no example ships one.** All 21
   examples boot straight into gameplay; "standard title / game-over
   overlays" (this spec's words, but also the natural reading of
   CONVENTIONS' "complete loop: start → play → …") has no standard for the
   *start* half. The pilot designed it fresh: `mode: 'title'` in pure state,
   DOM overlay as projection — a good pattern worth one paragraph in
   CONVENTIONS so 5 specs from now it isn't re-derived 5 ways.
5. **[minor API defect] `renderFilmstrip` panel 0 pre-dates the first
   `onProcess`,** so shapes set in a `redraw()`-style update show
   constructor defaults in the first panel. Cosmetic-only, invisible in the
   browser; worth stepping the world once before the first capture.
6. **[meta / QoL] `scripts/verify.ts` has no single-example filter.** The
   pilot paid the full 21-example portfolio (solvers included) on each of
   its 4 verify runs. A `tsx scripts/verify.ts <slug>` filter would cut the
   authoring loop's wall time several-fold at zero risk to the CI gate
   (which keeps running everything).

Observation, not a fix: the FUN.md "release between edges" input trap was
read and still hit. Docs alone may not be able to prevent it — an API
affordance (`tap(action)` emitting press+release, or a lint in the verify
context for consecutive identical press frames) would.

## Template for new batches

```
### YYYY-MM-DD · NN-slug
- Session vehicle / model:
- Outcome:
- Iterations / friction:

## Doc/API fixes suggested (batch N)
1. [triage] finding — evidence — smallest fix
```

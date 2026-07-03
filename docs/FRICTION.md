# FRICTION — process-lesson log

Where **process** lessons land: what confused an AI session, which API names
got guessed wrong, which invariant got violated and how the failure surfaced.
Engine/design lessons go to [LESSONS.md](LESSONS.md); this file is about the
*workflow*. It exists because docs are prompts — every entry here should make
the next session's mistake impossible or cheaper, and the fix column says
where that landed.

Append entries at the top. Keep them to three lines: what happened, how it
surfaced, what changed so it can't recur (or "unfixed" — an open trap).

## Format

```
## YYYY-MM-DD — <one-line title>
- **Happened:** what the session did wrong, concretely.
- **Surfaced as:** the error/symptom, verbatim if short — this is what the next
  session will see first.
- **Fix landed:** doc/check/skill updated, or "unfixed — watch for this".
```

## Entries

## 2026-07-03 — Half-scaffolded example sat in the tree failing gates

- **Happened:** a session created `examples/emberwake/` with only a `logic.ts`
  — no game.ts/main.ts/index.html/verify.ts/test — and left it uncommitted.
- **Surfaced as:** `npm run check` failed on an unused variable in the WIP
  file, and `npm run verify` failed with "no verify.ts — every example must
  prove its content", both blaming a folder the current session didn't create.
- **Fix landed:** `npm run invariants` (scripts/invariants.ts) now fails on any
  example missing the file contract, and the `/new-game` skill scaffolds all
  files up front.

## 2026-07-03 — Invariants were prose, not machinery

- **Happened:** the bans on `Math.random`, wall-clock in the sim, and non-
  `@hayao` imports lived only as sentences in AGENTS.md; nothing failed when a
  session forgot one.
- **Surfaced as:** violations would only appear later as baffling determinism
  hash mismatches, far from the cause.
- **Fix landed:** `scripts/invariants.ts` greps for all statically checkable
  invariants and runs as the first stage of `npm run verify`.

## 2026-07-03 — Hidden preview tab silently suspends the sim (rAF = 0)

- **Happened:** trying to prove the in-browser keyboard loop by dispatching
  synthetic KeyboardEvents through the harness preview; nothing moved.
- **Surfaced as:** HUD stuck at "Moves 0" with zero console errors — the
  preview tab reports `document.hidden === true`, Chrome suspends rAF
  entirely, so the driver never steps regardless of input. Looks like an
  input bug; is actually environment throttling.
- **Fix landed:** unfixed — watch for this. Rule: interaction proofs belong in
  the headless channel (scripted `world.step` replays — which already covered
  this game); use the preview ONLY for static looks judgement (screenshots of
  live pages and SVG artifacts render fine while hidden).

- **Friction:** `npm run verify` always ran the entire portfolio; iterating on
  one game's verify meant hand-rolling a scratch harness that re-implements
  the VerifyContext (goldens, artifacts, UPDATE_GOLDEN) — a second source of
  truth that can drift.
- **Fix landed:** `scripts/verify.ts` now takes slugs: `npm run verify --
  rookspire brasswick` runs only those suites (no args = whole portfolio, so
  the CI gate is unchanged).

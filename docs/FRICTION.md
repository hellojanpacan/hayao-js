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

## 2026-07-04 — `npm run verify -- <slug>` scopes nothing but the feel audit

- **Happened:** iterating on a new game, ran `npm run verify -- emberfold` to
  prove just that game. It ran the whole portfolio instead.
- **Surfaced as:** a red check (`bramblefall` sim-step perf budget, throttled
  machine) in a run I thought was scoped to my game — initially misread as MY
  game failing. Root cause: `verify` is `invariants && verify && feel`, so npm
  appends the slug only to the last command (`feel.ts`); `verify.ts`'s own
  slug filter never receives it. This silently REGRESSED the 2026-07-03 fix
  below — appending `&& feel.ts` moved the arg tail off `verify.ts`.
- **Fix landed:** filed [#28](https://github.com/hellojanpacan/hayao-js/issues/28).
  Until fixed, per-game runs must call the script directly:
  `npx tsx scripts/verify.ts <slug>` (that scoping still works). Rule: an npm
  `--` arg only reaches the LAST command in a `&&` chain — never trust it to
  filter an earlier stage.

## 2026-07-04 — In-world `Text` label was invisible (default z=0 sits behind sprites)

- **Happened:** drew value numbers on tiles with `new Text({ pos, text })` at
  the default `z=0`, while the tile sprites sat at `z=4`. The labels rendered
  BEHIND the tiles and never appeared.
- **Surfaced as:** nothing — no error, sim hashed fine, tests and
  `npm run verify` all green. Caught only by looking at the judge PNG (a board
  of numberless tiles). The reference games never trip this (their `Text` is
  non-overlapping HUD), so the copy-from path hides the trap.
- **Fix landed:** filed [#31](https://github.com/hellojanpacan/hayao-js/issues/31).
  Rule: in-world `Text` that labels a sprite needs an explicit `z` ABOVE that
  sprite — `new Text({ …, z: 6 })`. Any text-on-object needs a z; only
  non-overlapping HUD can default.

## 2026-07-04 — `Math.log2` banned, but `dmath` has no replacement for it

- **Happened:** used `Math.log2(value)` to map a power-of-two tile to a
  cosmetic tier. `npm run invariants` rejected it (implementation-defined
  `Math.*`, correctly banned for cross-engine determinism).
- **Surfaced as:** the invariant message says "use dmath:
  dsin/dcos/datan2/dexp2/dhypot" — but there is no `dlog2`/`dpow`, so the
  suggested escape hatch is a dead end.
- **Fix landed:** filed [#32](https://github.com/hellojanpacan/hayao-js/issues/32).
  Workaround: for power-of-two domains use integer math (a small
  doubling-loop `tierOf`), not `log2`. Rule: don't trust the invariant message
  to name a real `dmath` function — check `src/core/dmath.ts` first.

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

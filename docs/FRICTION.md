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

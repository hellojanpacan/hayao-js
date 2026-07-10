# FRICTION — process-lesson log

Where **process** lessons land: what confused an AI session, which API names
got guessed wrong, which invariant got violated and how the failure surfaced.
Engine/design lessons go to [LESSONS.md](LESSONS.md); this file is about the
*workflow*. It exists because docs are prompts — every entry here should make
the next session's mistake impossible or cheaper, and the fix column says
where that landed.

Append entries at the top. Keep them to three lines plus a **Status** stamp:
what happened, how it surfaced, what changed, and the current verdict.

## Status marking — so triage isn't re-run from scratch

Every entry carries a `**Status (date):**` line. A triage pass (re-reading this
whole log to decide what to act on) only has to think about `🔧 Open` entries —
`✅ Resolved` and `👁 Watch` were already decided, and the date says when. When
you resolve or re-classify an entry, update its Status line and bump the date;
don't delete history. Vocabulary:

- **✅ Resolved** — a fix landed (check / doc / skill / code). Names where. Skip
  on future triage unless it regresses.
- **👁 Watch** — an accepted tradeoff or environmental limit with no worthwhile
  fix; the strength it protects is worth the friction. Skip unless the tradeoff
  shifts.
- **🔧 Open** — actionable and unfixed. The only status a triage must weigh.

## Format

```
## YYYY-MM-DD — <one-line title>
- **Happened:** what the session did wrong, concretely.
- **Surfaced as:** the error/symptom, verbatim if short — this is what the next
  session will see first.
- **Fix landed:** doc/check/skill updated, or "unfixed — watch for this".
- **Status (YYYY-MM-DD):** ✅ Resolved / 👁 Watch / 🔧 Open — one line.
```

## Entries

## 2026-07-05 — External consumer logs (Pocket Gambit, KOAN): turn-based/pointer seams triaged

- **Happened:** two AI-authored games built ON published hayao (a chess variant
  and KOAN, a turn-based board game) each kept their own friction log against
  **v0.2.0**. Both are turn-based, pointer-driven apps on a kernel aimed at
  real-time sim — so they hit the same genre-mismatch seams *independently*,
  which is the strong signal: (a) no pointer/hit-test input — both hand-rolled
  `pointerdown` + `getScreenCTM().inverse()`; (b) `Text` carried `Paint` but the
  renderer dropped `stroke`, so one stacked 8 halo glyphs per piece to fake an
  outline; (c) undocumented draw origins (center-anchored rects, middle-baseline
  text) — read out of `dist/index.js`; (d) the learning docs/examples the README
  points at didn't ship in the tarball; (e) `runBrowser` owns the page (swaps the
  `World` on restart), fighting embed-as-one-component; (f) no UI/widget system
  beyond one centered `Shell`; (g) heavy AI freezes the frame loop (no worker).
- **Surfaced as:** all "no error, just a wall" — the type promised `stroke` and
  it silently no-op'd; keyboard-only input left pointer games with nothing to
  extend; consumers reverse-engineering positioning from compiled output.
- **Fix landed:** re-checked every theme against `main` (the tree has moved far
  past v0.2.0). Most were already closed: **(a) Resolved** — `PointerSource`
  ([src/input/source.ts](../src/input/source.ts), exported from `@hayao`) is now
  the sibling of `KeyboardSource`, returns design-space coords already
  un-letterboxed via the CTM and exposes `pointer.x/y/down` as axes.
  **(c) Resolved** — CONVENTIONS "Shape origins" documents center-anchoring +
  `anchor:'topLeft'`. **(d) Resolved** — `package.json#files` now ships
  QUICKSTART/CONVENTIONS/EMBED/VERIFICATION/WORKSHOP/API (see also the npm-drift
  entry below). **(e) partly Resolved** — `docs/EMBED.md` ships embed recipes;
  full component-embed (not owning the page) is still `runBrowser`-shaped.
  **(b) fixed here:** the SVG + canvas renderers now honor `stroke`/`strokeWidth`
  on text with the outline UNDER the fill (`paint-order="stroke"` /
  stroke-then-fill), so one `stroke` replaces the 9-command halo hack
  ([svgString.ts](../src/render/svgString.ts), [canvas.ts](../src/render/canvas.ts),
  test `svgString.test.ts`, CONVENTIONS "Outlined text").
- **Status (2026-07-05):** ✅ Resolved — text stroke landed; pointer/positioning/
  docs-shipping all confirmed closed since v0.2.0. 👁 Watch (deliberate, kept as
  tradeoffs, not bugs): **(f)** no UI toolkit — hayao is a sim kernel + renderer;
  DOM/CSS owns chrome, the scene owns the board (both logs call this the *right*
  split). **(g)** off-thread AI — the engine is synchronous fixed-step by design;
  because state is plain JSON and `Rng` is seed-reproducible, a `Web Worker`
  search "just worked" for both — the determinism made the workaround trivial,
  so this is a strength, not a gap. 🔧 Open to revisit only if demand grows:
  first-class pointer *hit-testing* helpers (grid/shape pick, beyond raw axes)
  and a documented component-embed path that doesn't hand `runBrowser` the page.

## 2026-07-05 — Triage pass: closed the npm-drift guard, marked the stale entries

- **Happened:** a full re-read of this log to decide what to act on. Three
  entries below (`verify --slug`, in-world `Text` z, `Math.log2`/`dmath`) still
  read as OPEN but their fixes had already landed on `main` — a session acting
  on this log would have re-investigated closed traps. The one truly-open item
  was the 2026-07-05 publish-guard gap right below.
- **Surfaced as:** the doubled-busywork risk itself — no marker distinguished
  "still open" from "fixed since written," so every triage re-derives ground
  truth (grepping `verify-all.ts`, `dmath.ts`, issue states) from zero.
- **Fix landed:** (1) added the **Status** marking system above — every entry now
  carries a dated `✅/👁/🔧` verdict, so the next triage only weighs `🔧 Open`
  ones; `/retro` writes the stamp on new entries. (2) Built the missing publish
  guard: [`scripts/preflight-publish.mjs`](../scripts/preflight-publish.mjs)
  fails the release if `package.json` version already exists on npm, or the
  release tag ≠ `v<version>`; wired into `publish.yml` before `npm publish`.
  (3) Restamped the three resolved entries below to point at their landed fixes.
- **Status (2026-07-05):** ✅ Resolved — marking system live; publish guard in CI
  and runnable locally (`RELEASE_TAG=vX.Y.Z node scripts/preflight-publish.mjs`).
  The heavier tarball-vs-manifest diff the 07-05 entry floated was *declined* —
  the version guard catches the exact silent-no-op failure at a fraction of the
  brittleness; revisit only if a bump-but-wrong-contents bug ever actually bites.

## 2026-07-05 — Repo drifted ahead of npm at an unchanged version → partial publish shipped

- **Happened:** Workshop, the `bin` CLIs, the `./workshop` export subpath, and 5 of
  6 docs were added to `package.json` (`files`/`bin`/`exports`) but the version
  stayed `0.2.0` — same as the last publish. So npm kept serving the OLD, thin
  `0.2.0` tarball (built from `files: ["dist", "docs/API.md"]`, no bin, no
  `./workshop`); none of the new surface ever reached consumers.
- **Surfaced as:** a downstream `hayao` consumer reported "README links to docs
  that aren't in the package" and "types look missing." Both traced to the stale
  tarball, not the source: the README's doc links were relative (`docs/….md`)
  so they 404 on npmjs.com, and `./workshop`'s `types` pointer dangled because
  `dist/workshop/vitePlugin.d.ts` was never packed. (The "types missing" read was
  itself wrong — `0.2.0` ships 77 `.d.ts` behind a re-export barrel — but the
  broken `./workshop` pointer made it plausible.) Nothing in-repo failed; `npm
  publish` just silently no-ops a re-publish at an existing version.
- **Fix landed:** bumped to `0.3.0`, rewrote README doc links to absolute
  `github.com/.../blob/main/…` URLs (resolve on npm, GitHub, and in the
  tarball). Rule: a `files`/`exports`/`bin` change is a publishable change —
  bump the version in the same commit, or it never ships.
- **Status (2026-07-05):** ✅ Resolved — the "guard still open" is now closed by
  [`scripts/preflight-publish.mjs`](../scripts/preflight-publish.mjs) in
  `publish.yml`: a release at an already-published version (the exact silent
  no-op) or a mismatched tag now fails loudly. See the triage entry above.

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
- **Status (2026-07-05):** ✅ Resolved ([#28](https://github.com/hellojanpacan/hayao-js/issues/28)
  closed) — `npm run verify` is now a single script,
  [`scripts/verify-all.ts`](../scripts/verify-all.ts), that forwards the slug
  list to every stage (invariants + verify + feel). `npm run verify -- <slug>`
  scopes correctly again; the `&&`-chain no longer exists to drop the arg tail.

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
- **Status (2026-07-05):** ✅ Resolved ([#31](https://github.com/hellojanpacan/hayao-js/issues/31)
  closed, via #36) — `layoutIssues` in
  [`src/verify/layout.ts`](../src/verify/layout.ts) is now a headless gate that
  flags in-world text fully covered by an opaque higher-z shape ("text … is
  hidden behind …"), so a wired verify suite catches it without a human looking
  at the PNG. CONVENTIONS strict-layering documents the explicit-z rule.

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
- **Status (2026-07-05):** ✅ Resolved ([#32](https://github.com/hellojanpacan/hayao-js/issues/32)
  closed) — [`src/core/dmath.ts`](../src/core/dmath.ts) now ships `dlog2`,
  `dlog10`, and `dpow` (routed through `dlog`/`dexp2`), and the
  `scripts/invariants.ts` message maps `log2→dlog2, pow→dpow, log10→dlog10`. The
  escape hatch the ban points to is now real — no integer-math workaround needed.

## 2026-07-03 — Half-scaffolded example sat in the tree failing gates

- **Happened:** a session created `examples/emberwake/` with only a `logic.ts`
  — no game.ts/main.ts/index.html/verify.ts/test — and left it uncommitted.
- **Surfaced as:** `npm run check` failed on an unused variable in the WIP
  file, and `npm run verify` failed with "no verify.ts — every example must
  prove its content", both blaming a folder the current session didn't create.
- **Fix landed:** `npm run invariants` (scripts/invariants.ts) now fails on any
  example missing the file contract, and the `/new-game` skill scaffolds all
  files up front.
- **Status (2026-07-05):** ✅ Resolved — fix landed with the entry (invariants
  file-contract gate + `/new-game` full scaffold).

## 2026-07-03 — Invariants were prose, not machinery

- **Happened:** the bans on `Math.random`, wall-clock in the sim, and non-
  `@hayao` imports lived only as sentences in AGENTS.md; nothing failed when a
  session forgot one.
- **Surfaced as:** violations would only appear later as baffling determinism
  hash mismatches, far from the cause.
- **Fix landed:** `scripts/invariants.ts` greps for all statically checkable
  invariants and runs as the first stage of `npm run verify`.
- **Status (2026-07-05):** ✅ Resolved — `scripts/invariants.ts` is the machine
  check; it runs first in `scripts/verify-all.ts` and in CI.

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
- **Status (2026-07-05):** 👁 Watch — environmental (Chrome throttles rAF in a
  hidden tab); not fixable in-engine, and the headless replay channel already
  covers interaction proofs, so no worthwhile fix. The rule stands: prove input
  headlessly, use the preview only for static looks.

## 2026-07-03 — `npm run verify` couldn't scope to one game

- **Friction:** `npm run verify` always ran the entire portfolio; iterating on
  one game's verify meant hand-rolling a scratch harness that re-implements
  the VerifyContext (goldens, artifacts, UPDATE_GOLDEN) — a second source of
  truth that can drift.
- **Fix landed:** `scripts/verify.ts` now takes slugs: `npm run verify --
  rookspire brasswick` runs only those suites (no args = whole portfolio, so
  the CI gate is unchanged).
- **Status (2026-07-05):** ✅ Resolved — slug scoping lives in `verify.ts`/`feel.ts`
  and is now correctly forwarded by `verify-all.ts` (see the 2026-07-04
  `verify --slug` entry, which fixed the regression this later introduced).

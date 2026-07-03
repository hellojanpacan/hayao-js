---
name: new-game
description: Scaffold and build a new example game following the BUILDLOG loop — spec, engine gaps, full example structure, verification gates, and the learn entry. Use when adding a game to examples/.
---

# /new-game — add a game the hayao way

You are running one iteration of the Build-Measure-Learn loop defined in
`docs/BUILDLOG.md`. Do the steps IN ORDER; the failure mode this skill exists
to prevent is the half-scaffold (a bare `logic.ts` with nothing around it).

## 1. Spec (before any code)

Write down, in your response or the BUILDLOG entry draft:
- Genre + title blend (see the roster in `docs/BUILDLOG.md` — claim the next
  unclaimed row unless the user named one).
- 3–5 stress goals: what this game challenges in the ENGINE (perf, collision,
  pathfinding…) and in DESIGN (feel, pacing, readability).
- The **fun target**: one sentence on what must feel good for a human.

## 2. Read the ground truth

- `docs/CONVENTIONS.md` — structure, house style, definition of done.
- `docs/VERIFICATION.md` — how you will prove this genre's truth.
- Grep `docs/API.md` for every API you plan to touch. Never guess a name.

## 3. Engine gaps first

If the genre needs engine capability that `src/` lacks, build it there FIRST,
with unit tests, exported through `src/index.ts` (`@hayao`), and regenerate the
surface: `npm run api`.

## 4. Scaffold the example — all files at once

Copy `examples/sokoban/` → `examples/<slug>/` and adapt. The full contract
(enforced by `npm run invariants`):

```
examples/<slug>/
  index.html      # page shell, loads main.ts
  main.ts         # browser wiring only (runBrowser + DOM screens)
  game.ts         # defineGame(): scene setup, probe(), input map
  logic.ts        # pure sim / Puzzle<State, Move> module (no engine imports)
  <slug>.test.ts  # vitest suite (headless)
  verify.ts       # export default async (t: VerifyContext) => proof of content
```

Write each file as its own Write call as soon as it is drafted. Then add a
card for the game to the root `index.html` hub (copy an existing
`<a class="card">` block).

## 5. Measure — the gates, in order

1. `npm run check` — zero errors.
2. `npm test` — green.
3. `npm run verify` — invariants clean, all suites pass, including your new
   `verify.ts` proving the genre's truth (solver proof for puzzles; scripted
   playthrough asserting the win condition on probes for real-time; balance
   sim / perf budget where that is the truth). Pin the full run's hash with
   `t.golden('full run', world.hash())`, record it via
   `UPDATE_GOLDEN=1 npm run verify`, and commit `golden.json` — this is the
   portfolio-wide refactor net (docs/VERIFICATION.md §Channel 1d).
4. Feel probes (docs/VERIFICATION.md §Channel 3): at least two
   `recordTimeline`-based metrics gated on windows derived from a run you
   actually judged — plus a `renderFilmstrip` artifact
   (`t.artifact('run-filmstrip.svg', …)`) reviewed for motion and readability.
5. Headless SVG screenshot (`HeadlessRenderer.toSVGString()`) — judge palette,
   layering, contrast, legibility. Looks only, never correctness.
6. Complete loop: start → play → win/lose → restart, keyboard-only.

The full definition of done is `docs/CONVENTIONS.md` §Definition of done — it
is a checklist, not a vibe.

## 6. Learn — close the loop

- Append the BUILDLOG entry to `docs/BUILDLOG.md` (what the engine lacked,
  what was upgraded, what convention changed, what transfers) and update the
  roster row status.
- If a lesson generalizes, land it in `docs/LESSONS.md` NOW — docs are prompts.
- If the process itself fought you (wrong API guess, invariant surprise,
  confusing failure), log it per the `/retro` skill (`docs/FRICTION.md`).

Only after step 6 present the play link.

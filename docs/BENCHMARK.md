# BENCHMARK — reproduce a ranked game

The BUILDLOG campaign (20 genres, self-picked) proved breadth. This benchmark
adds **external ground truth**: reproduce games that *humans already ranked
highly* in open jams, under hayao's determinism + proof discipline, and measure
how well engine + agent close the gap. Every reproduction is also a mining
expedition — each one that fights the engine yields a `src/` upgrade and a
[BUILDLOG](BUILDLOG.md)/[LESSONS](LESSONS.md) entry.

Source corpus: `~/Documents/js13k` — registries + cloned source for js13kGames
2020–2025 (1,164 entries, all ranked), GitHub Game Off, Ludum Dare compo, and
itch top-100s. js13k entries are the primary pool: tiny, 2D, pure-JS — the
exact shape of a hayao example.

## Why ranked games beat invented specs

1. **The design is pre-validated.** A top-10 js13k placement is a few hundred
   independent judgements that the core loop is fun. Reproducing it separates
   "can the engine express this?" from "was this fun to begin with?" — the
   BUILDLOG campaign could never fully separate those.
2. **Fidelity is checkable.** The original is playable (`play_url`) and its
   source is readable. A spec card extracted from both is a *falsifiable*
   target, unlike a from-scratch spec.
3. **The corpus is a ladder.** 1,000+ ranked designs span every 2D genre and
   difficulty of reproduction — we can always pick the next rung that stresses
   exactly the engine muscle we want to grow.

## Rules

- **Mechanics in spirit, nothing copied.** Most jam repos carry no license.
  Read source to *extract the design* (rules, constants, feel targets) into a
  spec card; never port code, art, or level layouts. Levels are authored fresh
  to teach the same mechanic arc, and solver-proven like all hayao content.
- **House conventions fully apply.** A reproduction is a normal
  `examples/<slug>/` game: `@hayao` imports only, pure `Puzzle` module where
  turn-based, `world.rng`/no wall-clock, DOM chrome, `cosmetic` view nodes,
  probes, per-example `verify.ts`, hub card. New slug, house visual style —
  the *mechanics* are the reproduction target, not the skin.
- **Engine gaps first.** As in the BUILDLOG loop: if the spec needs a missing
  primitive, build it in `src/` with tests before the game.

## Process (per reproduction)

1. **Select** a target from the ladder below (or extend the ladder from the
   registry when a specific engine muscle needs stressing).
2. **Spec card** — `examples/<slug>/SPEC.md`: identity (jam, year, rank,
   per-criterion grades), core loop, mechanics checklist (numbered M1..Mn,
   each phrased as a *testable behavior*), win/lose conditions, determinism
   hazards found in the original source, feel targets, out-of-scope list.
3. **Build** — engine gaps first, then the game per CONVENTIONS.md.
4. **Score** (see rubric) — `verify.ts` encodes the mechanics checklist as
   checks; the gate criteria must be green before the reproduction counts.
5. **Learn** — BUILDLOG entry: fidelity score, gaps found/fixed, what
   transfers.

## Scoring rubric

**Gate (pass/fail — a red gate means the reproduction doesn't count):**
- `npm run check` + `npm test` + `npm run verify` green
- winnability proof for every level (solver for puzzles, scripted bot for
  real-time), determinism + golden replay

**Score (reported in the BUILDLOG entry):**

| axis | weight | measured by |
|---|---|---|
| Mechanics fidelity | 50% | fraction of spec-card M-checklist items with a green `verify.ts` check |
| Content parity | 20% | level/content count ≥ original's teaching arc (each mechanic introduced then combined, like the original's ordering) |
| Feel & look | 20% | headless SVG/filmstrip judged against the original's play_url; feel targets from the spec card asserted where measurable (timings, counts, speeds) |
| Learning yield | 10% | engine gaps found and *fixed* (a gap deferred with a design note counts half) |

## The ladder

Tiers order the *reproduction* difficulty for this engine, not the original
game's quality. Rung 1 starts where hayao is strongest (solver-provable
puzzles) so the benchmark harness itself gets validated cheaply; later rungs
stress real-time feel, then juice/audio/scale.

| rung | tier | target (jam, year, rank) | why this one | status |
|---|---|---|---|---|
| 1 | A · solver-provable puzzle | Edge Not Found (js13k 2020, #2 Overall) | Sokoban on a *twisted torus* (wrap can shift the other axis) — same genre as the reference example, alien state model; pure solver stress | ✅ `examples/seamfold/` |
| 2 | A | Black Hole Square (js13k 2021, #9) | tap-to-collapse puzzle; different input model (pointer), still BFS-provable | ✅ `examples/gravewell/` |
| 3 | A | Dying Dreams (js13k 2022, #2) | multi-avatar turn puzzle-platformer with shared inputs; state explosion stresses solver pruning | ☐ |
| 4 | B · bot-provable real-time | Norman the Necromancer (js13k 2022, #3) | wave defense + resurrection economy; balance-bot proof, mouse aim | ☐ |
| 5 | B | Ninja vs EVILCORP (js13k 2020, #1) | speedrun action; feel-critical movement, par-time bot proof | ☐ |
| 6 | C · juice/scale stress | Space Huggers (js13k 2021, #8) | run-and-gun with destructible terrain + particles; perf + juice ceiling | ☐ |

Selection criteria for future rungs: ranked top-10 of its jam; 2D and
canvas/DOM (no WebGL-3D/WebXR/server categories); source cloned locally;
mechanics fully extractable from source + play.

## Cross-references

- Candidate mining and engine-gap frequency analysis: `docs/JS13K-MINING.md`
  (produced by the corpus-mining task).
- Per-reproduction lessons land in [BUILDLOG.md](BUILDLOG.md) under a
  `B<rung>` heading (e.g. `B1 · Seamfold`), findings in [LESSONS.md](LESSONS.md).

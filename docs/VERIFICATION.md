# Verification — how an AI proves a hayao game works

The whole engine is shaped so you can verify a game **without a browser and
without playing it**. Build the harness *before* the content; unverified content
is presumed broken (in-head verification has a documented failure rate).

Two channels, in order:

1. **Numeric channel** — headless `step()`, probes, the solver, and determinism
   checks. Proves *behavior* and *beatability*. This is where correctness lives.
2. **Visual channel** — a headless SVG screenshot. Judges *looks* only — palette,
   layout, legibility. Never correctness.

Everything below runs in Node under Vitest (`npm test`) or the CI script
(`npm run verify`).

---

## Channel 1a — scripted playthrough (any game)

Drive a world with an input log and assert on its probe. No DOM.

```ts
import { createWorld } from '@hayao';
import { myGame } from './game';

const world = createWorld(myGame);          // a live, deterministic World
world.step(['right']);                      // one fixed step, 'right' held
world.step([]);                             // release (edges need a rising edge)
world.step(['confirm']);
expect(world.probe().score).toBe(1);        // assert on game state, not pixels
```

Helpers: `scriptedPlaythrough(world, [hold(['right'], 30), wait(10)])` returns a
probe after each segment; `pump(world, n, actions)` advances n steps. Hold keys
for several frames — a 1-frame synthetic tap is treated as a real short tap.

## Channel 1b — winnability solver (puzzles / turn-based)

Keep the rules in a pure module implementing `Puzzle<State, Move>` (no engine
imports), then prove every level beatable by search:

```ts
import { solve, assertSolvable, type Puzzle } from '@hayao';

const puzzle: Puzzle<State, Move> = {
  initial: (level) => …,
  moves:   (s) => […],
  apply:   (s, m) => …,      // fold in a DETERMINISTIC opponent here if any
  isWin:   (s) => …,
  isDead:  (s) => …,          // optional: prune lost states
  key:     (s) => canonicalString(s),
};

const r = assertSolvable(puzzle, { level: 0, maxDepth: 80 }); // throws if unwinnable
console.log(r.depth, r.nodes);              // shortest solution length + search cost
```

A deterministic opponent means winnability is single-agent BFS — no adversarial
branching. `solve` returns the shortest `path`, which you can replay through the
real game (Channel 1a) to prove the *view* agrees with the *logic*.

## Channel 1c — determinism (the regression net)

Same seed + same input log must produce bit-identical state hashes. If not, some
nondeterminism leaked in (Math.random, Date.now, Set iteration, unordered map).

```ts
import { assertDeterministic, assertSnapshotStable } from '@hayao';

assertDeterministic(() => createWorld(myGame), inputLog);      // runs twice, compares every step's hash
assertSnapshotStable(() => createWorld(myGame), inputLog, 20); // snapshot→restore reproduces the tail exactly
```

`world.hash()` is the structural hash; `world.snapshot()` / `world.restore()` are
save/undo/time-travel. Mark pure-view nodes `cosmetic = true` so transient display
(move counters, particles, tweened positions) never pollutes the canonical hash.

## Channel 1d — the golden replay corpus (portfolio-wide refactor net)

Every example pins its full scripted run's final `world.hash()` in a committed
`examples/<slug>/golden.json`, checked by `t.golden(label, hash)` in its
verify suite. This turns "did my engine refactor change ANY game's behavior?"
into one command: `npm run verify` — a pure refactor leaves every golden hash
untouched; any divergence names the game and the run that changed.

```ts
// in examples/<slug>/verify.ts, after the full run:
t.golden('full run', world.hash());
```

**Re-record policy.** Golden divergence is a failing gate, on purpose. When a
behavior change is *intentional* (tuning, new content, a deliberate engine
change), re-record and say so:

1. `UPDATE_GOLDEN=1 npm run verify` — rewrites the affected `golden.json`.
2. Commit the new hashes IN THE SAME COMMIT as the change, with a line in the
   message naming which games' behavior changed and why.

Never re-record to silence a divergence you can't explain — an unexplained
golden change IS the bug the corpus exists to catch.

## Channel 2 — the visual screenshot (looks only)

```ts
import { HeadlessRenderer, createWorld } from '@hayao';

const world = createWorld(myGame);
world.step([]);
const r = new HeadlessRenderer({ width: 1280, height: 720, background: '#f3ecdb' });
r.draw(world.render());
writeFileSync('shots/title.svg', r.toSVGString());   // a real vector screenshot, in Node
```

Because rendering is SVG, the screenshot is **resolution-independent and text is
crisp** — no canvas fuzz, no GPU. You rarely need a browser at all, because the
DOM is already inspectable and the sim already runs in Node — but when a tool
must drive the real browser build, two seams exist:

**`?capture=1` → `window.__hayao`** (`src/verify/capture.ts`). Appending
`?capture=1` to a game's URL skips the splash and installs a scripted-session
API on `window`:

| Member | What it does |
|---|---|
| `pump(frames, actions?)` | Step exactly `frames` fixed steps with `actions` held (wall-clock loop suspended), then return `probe()` |
| `probe()` | The game's probe snapshot |
| `hash()` | `world.hash()` — the determinism hash |
| `shot()` | Current frame as an SVG string (a vector screenshot) |
| `save(path)` | POST that SVG to the dev server's `/__shot` endpoint; resolves `true` on success |
| `key(type, code)` | Dispatch a synthetic `keydown`/`keyup` by key code |
| `world` | The live `World` — full access when the shorthands aren't enough |

`probe` is whatever the game's `defineGame({ probe })` returns — expose exactly
the state a scripted session will assert on.

**`handle.tick(dtMs?)`** — the `runBrowser` handle can drive one frame by hand:
sample the pointer and extra sources, advance by `dtMs` (default one fixed
step) with the currently-held actions, render. It is the SAME code path the
wall-clock loop runs, so tool-driven frame stepping is the real loop, not a
simulation of it. The wall-clock loop keeps running independently — pause the
shell or hold via `RunOptions.isHeld` to make `tick()` the only driver.

**Hidden tabs and iframes keep ticking.** Browsers throttle rAF to death in
hidden tabs/iframes; the engine now owns the fallback — when `document.hidden`,
the loop pumps via `setTimeout(16)` and swaps back to native rAF on
visibility. Games and harnesses must **NOT** patch the global
`requestAnimationFrame` anymore: per-game patches double-fire and race the
engine's scheduler (the 2026-07 triage traced real bugs to exactly that).

For MOTION, use the filmstrip instead of a single frame: it samples a whole
run into one SVG contact sheet, so pacing, readability under load, and
layering during play are judgeable from a file.

```ts
import { renderFilmstrip } from '@hayao';
t.artifact('run-filmstrip.svg', renderFilmstrip(createWorld(myGame), inputFrames, {
  width: myGame.width, height: myGame.height, background: myGame.background, panels: 12,
}));
// → shots/<slug>/run-filmstrip.svg — open it and actually look.
```

## Channel 3 — feel probes (quality proxies)

Correctness channels prove the game is *not broken*; they say nothing about
whether it is *good*. Feel probes give quality a measurable proxy: compute
metrics from a per-frame probe timeline of the winning run, and gate them on
windows YOU tune per game. A window is a design decision recorded as a test —
retuning that wrecks pacing fails loudly instead of silently.

```ts
import { recordTimeline, firstFrame, inputDensity, longestLull, changeFrames, isMonotonic } from '@hayao';

const tl = recordTimeline(createWorld(myGame), winningLog);
firstFrame(tl, (p) => p.kills > 0);      // time-to-first-meaningful-action
inputDensity(winningLog);                 // engagement: waiting ↔ mashing
longestLull(changeFrames(tl, 'score'), tl.length); // dead-air detector
isMonotonic(depths, 'up', slack);         // difficulty ramps with breathers
```

What to gate is genre truth: a stealth game gates its hide/move alternation,
an incremental its unlock cadence, a puzzle its solve-depth curve. Two rules:
(1) derive windows from a run you have actually judged as feeling right —
never invent them; (2) keep them generous enough that tuning breathes, tight
enough that pacing regressions fail. These are proxies, not proof of fun —
the filmstrip and a human/AI look stay in the loop.

## Channel 4 — feel gates (the professional floor, made checkable)

Channel 3 measures *pacing* from a timeline; Channel 4 gates the small set of feel
**fundamentals** that separate amateur from professional and that are genuinely
mechanical, not matters of taste. Each returns human-readable issues (empty = pass),
exactly like `layoutIssues` — so wiring one in is one line. This is the direct
answer to "green tests, dead game": turn more of *feel* green.

```ts
import { forgivenessIssues, graceWindowIssues, feedbackIssues,
         salienceIssues, telegraphIssues, cameraIssues, lookAheadIssues } from '@hayao';
```

1. **Forgiveness.** `forgivenessIssues(cfg)` audits the grace windows (coyote,
   jump-buffer, corner-nudge) against a floor; `graceWindowIssues(label, W, accepts)`
   *behaviourally* proves a window accepts an input `0..W` frames late and refuses
   `W+1` — the exact edge FUN law 5 demands. (small-flame proves its coyote window
   by walking a rig off a lip and jumping D frames later.)
2. **Feedback completeness.** Declare a `FeedbackContract` (event → channels +
   shake/hit-stop), then `feedbackIssues(contract, events)` proves every significant
   event answers on ≥ 2 senses within the frame, with juice bounded (min to read,
   max to not nauseate).
3. **Readability.** `salienceIssues(render(), avatarFill, background)` proves the
   avatar out-contrasts both the background and the median scenery fill (WCAG
   luminance, from pure draw data). `telegraphIssues(timeline, minFrames)` proves
   every threat activation is preceded by ≥ `minFrames` of telegraph — reactive play
   needs danger to announce itself.
4. **Camera lawfulness.** `cameraIssues(samples)` proves the follow never snaps
   (bounded speed) or jerks (bounded acceleration); `lookAheadIssues(cam, target)`
   proves it leads the motion rather than trailing. Sample the *follow* position
   (exclude screen shake), and drop the pre-start frame (no camera exists yet).

The feel gates wired on a real game live in
[`examples/small-flame/verify.ts`](../examples/small-flame/verify.ts) — forgiveness,
feedback, and salience (its single-screen chamber holds a fixed camera, so the
camera gate applies to scrolling games); the authoring side is
[design/JUICE.md](../design/JUICE.md). Gate on the fundamentals; the *soul* above the floor
stays authored (a director, not a proof) — but the floor no amateur clears is now
machine-enforced.

**Portfolio floor (`npm run feel`).** A game declares its contract once —
`export const feel: FeelSpec` in `game.ts` (avatar fill → salience; controller
config → forgiveness; feedback contract → feedback; `scrolls` → camera). The audit
runs every gate each spec enables across all games and exits non-zero on any
failure; it is part of `npm run verify`, so the floor rises for ALL output, not one
game. Declare only what is honestly true — a false contract is worse than none.

## Channel 5 — the vision judge (`npm run judge`)

The gates prove the floor mechanically; they can't see that a scene is *empty* or
*flat*. `npm run judge` renders each game headlessly to PNG (SVG → `@resvg/resvg-js`,
no browser) so a multimodal model LOOKS at the pixels and scores them against
[JUDGE.md](../design/JUDGE.md) — then fixes what a human would wince at, staying cosmetic (the
golden hash unchanged). It's the one judge that can't be a pure function, which is
why an AI-first engine — deterministic sim, headless render — is uniquely built to
run it in a loop. Drive it with the `/judge` skill.

---

## The gate (`npm run verify`)

The CI verifier proves every example winnable, replays a solution through the
real game, and checks determinism — exiting non-zero on any failure. Wire your
game's puzzle + game into `scripts/verify.ts` and it becomes a pipeline gate.

## Invariants

- All randomness flows through `world.rng`. No `Math.random()` in `src/` or games.
- No wall-clock in the sim (`Date.now`, `performance.now`, argless `new Date`).
- Fixed tree order; ordered collections for logic (no `Set`/object-key order).
- Every shipped level: a solver proof OR a scripted playthrough. No exceptions.

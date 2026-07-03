# BUILDLOG — the 20-genre Build-Measure-Learn campaign

hayao.js v0.1 proved its thesis at N=1 (Sokoban — the friendliest possible
genre). This campaign stress-tests the engine across the 20 most popular 2D
indie genres, one game per genre, each a small blend of beloved indie titles.
Every build must challenge genre-typical **engineering** (perf, collision,
pathfinding, lighting…) *and* genre-typical **design** (game feel, pacing,
readability, addictiveness). The engine is upgraded after every game; lessons
land here and in [LESSONS.md](LESSONS.md).

## The loop (per game)

1. **Spec** — genre, title blend, 3–5 stress goals (engineering + design), and
   the *fun target*: what must feel good for a human.
2. **Build** — engine gaps first (new `src/` modules, tested), then the game
   under `examples/<slug>/` per [CONVENTIONS.md](CONVENTIONS.md).
3. **Measure** — `npm run check` + `npm test` + `npm run verify` green;
   a per-example `verify.ts` proving content (winnability / critical path /
   balance sim / perf budget — whatever the genre's truth is); a headless
   screenshot for looks.
4. **Learn** — a BUILDLOG entry below: what the engine lacked, what was
   upgraded, what convention changed, what transfers to other genres. Docs
   updated the moment a lesson lands (docs are prompts).

## Roster

| # | Genre | Blend inspiration | Primary stress | Status |
|---|---|---|---|---|
| 1 | Grid puzzle | Sokoban | solver proof, determinism | ✅ v0.1 |
| 2 | Precision platformer | Celeste × TowerFall | tilemap AABB collision; full platforming kit (coyote, buffer, peak gravity, corner correction, dash, lift momentum) | ✅ |
| 3 | Metroidvania | Hollow Knight-lite | world graph, ability gating, reachability proof | ✅ |
| 4 | Top-down action-adventure | Zelda × Hyper Light Drifter | combat feel/juice kit, rooms, enemy AI | ✅ |
| 5 | Stealth | Mark of the Ninja × Gunpoint | vision cones, noise propagation, guard FSM | ✅ |
| 6 | Twin-stick horde | Nuclear Throne × Vampire Survivors | 100s of entities, spatial hash, upgrade economy | ✅ |
| 7 | Bullet hell | Touhou × Jamestown | 1000+ bullets perf ceiling, pattern DSL | — |
| 8 | Tower defense | Kingdom Rush × Bloons | path following, wave balance sim, counter system | — |
| 9 | RTS-lite | (mass units) | flow fields, 300–500 units, counters, HUD density | — |
| 10 | Traditional roguelike | Brogue × Shattered Pixel | procgen + connectivity proof, FOV, turn scheduler | — |
| 11 | Roguelike deckbuilder | Slay the Spire-lite | card DSL, balance bot, addictive loop | — |
| 12 | Turn-based tactics | Into the Breach-lite | telegraphed intents, push chains, fairness proof | — |
| 13 | Match-3 | Puzzle Quest-ish | cascade choreography vs deterministic sim | — |
| 14 | Incremental/idle | Universal Paperclips-lite | big numbers, offline time, pacing curves | ✅ |
| 15 | Farming/life sim | Stardew-lite | calendar clock, save/load, gentle pacing | — |
| 16 | Survival horror | Darkwood-lite | shadowcast lighting, spatial audio, dread pacing | — |
| 17 | City/colony builder | Islanders × Mini Motorways | placement scoring, growth sim, minimal viz | — |
| 18 | Rhythm | NecroDancer-lite | audio clock vs sim clock determinism | — |
| 19 | Physics arcade | Breakout roguelite / Peggle | continuous collision, deterministic FP physics | — |
| 20 | Top-down racing | Micro Machines-lite | car handling feel, racing-line AI | — |
| 21 | Narrative decisions | Reigns-lite | content DSL, long-arc balance sim | — |

Order of battle: waves grouped by shared engine needs — movement/collision
(2–5), mass/perf (6–9), turn/UI (10–14), atmosphere/sim (15–21). Order may be
re-shuffled as lessons emerge.

## Entries

### 2 · Shard Ascent — precision platformer (Celeste × TowerFall) ✅

**Shipped:** 6 teaching-ramp levels (run/jump → coyote gaps → drop-through +
shard fetch → apex dash → spike rhythm → moving-lift finale). Every level
bot-proven beatable with 0 deaths; full-run determinism verified; spike
lethality verified; 6.4 kB gzipped. Completion telemetry: 3.1s / 3.0s / 5.2s /
2.8s / 3.1s / 8.0s — the ramp shape falls out of the verify labels for free.

**Game phase findings:**

- **Reachability arithmetic must precede level authoring.** Bolt's chasm was
  8 tiles; the movement envelope (jump distance + apex-dash bonus) computes to
  ~263px — the gap was 256px from the takeoff edge: frame-perfect, i.e. broken
  for humans. "It looks dashable" is the platformer equivalent of the Sokoban
  unwinnable-level trap. Upgrade: `jumpHeight/jumpAirtime/jumpDistance/
  dashJumpDistance(cfg)` are now engine API — derive geometry from the config.
- **Grace mechanics must persist across the state they change.** Drop-through
  required `onGround`, which the drop itself falsifies after one frame — so the
  body re-landed on the platform lip forever. The class of bug: a conditional
  input window keyed on state that the triggered action immediately invalidates
  (coyote/buffers have the same shape). Frame traces catch it; playtests just
  say "down doesn't work".
- **Reactive waypoint bots beat open-loop input scripts.** Semantic plans
  (walk/jump/dashJump/drop/waitPlat/ride, ~5-8 steps per level) survived every
  physics and level tweak during iteration; recorded frame scripts would have
  invalidated on each change. The bot found real bugs scripts would mask: the
  run-up problem (jumping the frame you land = zero-speed launch) and the
  momentum drift below. Candidate for engine promotion after two more genres
  use it (rule of three).
- **Momentum realism cuts both ways.** Low `airFriction` (added for lift
  momentum) makes a straight drop drift ~70px sideways when entered at run
  speed. The bot missed the shard; a human would too and blame the controls.
  Design rule: place drop-targets wide, or expect walk-backs.
- **Process:** two builder subagents stalled repeatedly mid-stream before
  writing code; the inline build with a trace harness (probe printout every 30
  frames) was fast and every failure was diagnosable from the trace alone —
  the headless-first architecture carried the whole debugging loop; a browser
  was never opened until the final looks check.

- **`world.hash()` had a hidden-state escape.** Canonical state kept outside
  the scene tree (a character controller's velocity/timers, pure-sim structs)
  was invisible to hashing and snapshots — determinism checks could pass while
  real state diverged. Fix: `world.state`, a plain-JSON bag included in
  `hash()`/`snapshot()`/`restore()`. Convention: pure-sim state lives there.
- **Game-feel features interact; only frame-exact tests catch it.** Lift
  momentum storage (jump inherits platform velocity) was silently destroyed by
  air friction three frames after takeoff. The unit test caught what a
  playtest would have reported as "jumps feel dead off lifts". Split
  `airAccel` (steering) from a deliberately gentle `airFriction` (no-input
  decay) — inherited momentum must survive flight.
- **Collision probes matter as much as the mover.** Corner correction (jump +
  dash) is just "try nudged positions and ask the geometry" — exposing
  `rectBlocked()` made both corrections ~10 lines each. Movers without query
  functions force reimplementation.
- **The platforming canon is provable in Node.** Coyote time, jump buffering,
  variable height, halved-gravity apex, both corner corrections, wall
  slide/jump, lift momentum: 15 tests, each pumping fixed steps and asserting
  on state. Game feel as unit-testable transitions — the engine's pitch holds
  for real-time movement, not just grid puzzles.
- **Analytic clamping beats substepping.** `moveRect` scans the tile span of
  the swept axis and clamps to the nearest obstacle edge — exact contact, no
  tunneling at any speed, no iteration count to tune.

### 3 · Sproutveil — metroidvania (Hollow Knight-lite) ✅

**Shipped:** four connected rooms (Atrium / Shaft / Roots / Crown), two
ability pickups (double-jump seed, dash boots), spike hazards, ability-gated
progression to the Heart. Bot-proven full run in 27.1s with 0 deaths; both
gates proven REAL; snapshot save/load round-trips; deterministic.

**Findings:**

- **Metroidvania gates need NEGATIVE proofs, and the movement envelope can't
  give them.** The envelope is a lower bound (apex gravity extends real jumps
  beyond it); "impassable" claims need an upper bound. Answer: simulate the
  best ungated maneuver against the real room geometry — a max-effort jump
  under ledge1 tops out 60px short; a DJ-only sprint dies in the Crown gap.
  Gate proofs are maneuver sims, not arithmetic.
- **Engine bug: `snapshot()` didn't carry input state, but `hash()` includes
  it** — restore left post-snapshot held keys in place and the hash mismatched.
  The fix is mechanical, but the class matters: every field in `hash()` MUST
  round-trip through snapshot/restore, or save/load fails determinism checks
  in ways that look like game bugs. (Second instance of "hash and snapshot
  must agree" after `world.state` — now both are engine-enforced.)
- **Tilemap OOB-is-solid conflicts with room exits.** A body in a border
  opening is clamped at the boundary, so its center can never actually leave
  the room — transitions must trigger a few px INSIDE the border, and entry
  positions must land beyond the opposite threshold or rooms ping-pong.
- **Bot lessons compound into a controller-usage manual.** Four new failure
  modes, all genre-real: mount wide ledges with a near-vertical takeoff
  (momentum drifts you under the lip); a DJ tap needs a released frame first
  (no input edge otherwise) and must then be HELD (the variable-jump cut
  slashes an instant-release air jump to 40%); gap-cross jumps want full speed
  and constant steering — the exact opposite of ledge mounts; take off from
  the ledge EDGE for max-range flights. These are things human players learn
  in minutes and bots must encode — and they generalize: any AI-authored
  platformer level should be tuned against these maneuver templates.
- Third use of the waypoint bot incoming (rule of three) — promote a
  generalized `verify/bot` to the engine during the next platformer-adjacent
  build (G4 top-down uses different steering, so likely G16/G20).

### 4 · Gleamvale — top-down action-adventure (Zelda × Hyper Light Drifter) ✅

**Shipped:** four rooms, sword-arc combat with hit-stop/knockback/i-frames,
three telegraphed enemy types (chaser, darter, sentry), key-locked vault,
heart-container win. Combat bot wins in 31.6s, 0 deaths, floor of 2/3 hearts;
door gate proven both ways; enemies containment-checked every frame;
deterministic.

**Findings:**

- **The physics layer is genre-agnostic — zero engine changes needed.**
  `moveRect` with no gravity IS a top-down mover; walls, pillars, and the
  door-as-SolidRect all came free. The platformer investment paid out here.
- **Hit-stop eats inputs unless you buffer through it.** Freezing the sim for
  juice means an attack mashed during the freeze vanishes — a real feel bug
  the test caught (a slash that "randomly" didn't come out). Rule: any pause
  the sim injects (hit-stop, screen transitions) must buffer intent across it.
  Same family as coyote/jump-buffering: grace for human timing error.
- **Combat balance verifies differently from puzzles:** no solver, but a
  kiting bot's run telemetry (win time, hp floor, deaths) is a tight proxy —
  hp floor of 2 says "comfortable"; a floor of 0-1 would demand tuning.
  Telegraphs (darter's 0.45s flash) are what make the bot — and humans —
  able to play reactively at all.
- **Design bug caught by the bot: a pillar in the exit lane.** Cover placed at
  the room's centre column blocked the only path to the north door — a
  10-second playtest find, but the bot found it headlessly, and the fix is
  asserted forever. Rule: keep exit lanes (door columns/rows) obstacle-free.
- **Third bot confirms the pattern** (probe → plan-interpreter → actions);
  steering differs per genre but the skeleton is identical. Promotion to
  `verify/bot` scheduled for the next movement game.

### 5 · Veilstep — stealth (Mark of the Ninja × Gunpoint) ✅

**Shipped:** single-level heist across three patrol bands: vision cones with
raycast LOS, a fill/drain detection meter, bush concealment, sprint noise that
pulls guards to investigate, alarm-reset. Heist bot: idol stolen and
exfiltrated in 33.3s, 0 alarms. All stealth affordances proven both ways
(exposure punished in 1.3s; a bush inside a patrol lane conceals through a
full loop; noise flips guards to investigate). Deterministic.

**Findings:**

- **Engine additions: DDA grid raycast (`raycastTiles`/`lineOfSight`/
  `inVisionCone`) and the promoted `createPlanBot`** (the fourth bot rebuild
  became the engine's plan-interpreter skeleton with pluggable step
  executors + `steer2D`). The raycast will be reused by roguelike FOV (G10)
  and horror lighting (G16).
- **Stealth verification is about proving the systems BOTH ways.** A stealth
  game where hiding isn't necessary, or hiding spots don't work, is broken in
  ways that "the bot won" can't see. The suite asserts the punishment
  (exposed = spotted fast) and the affordance (bush = never spotted) as
  first-class checks alongside the positive run.
- **Level-design lesson: every long traversal needs a safe pocket at its
  midpoint.** The first level cut had no cover near the far gap; the exfil
  required THREE patrol phases to align at once — a wait with ~2% per-cycle
  probability, i.e. unfair, discovered as bot timeouts. One bush under the
  arch made the route fair without weakening any individual guard. In stealth
  the difficulty knob is WAIT TIME, and joint-phase waits explode
  combinatorially — chain single-guard windows via safe pockets instead.
- **Guard cone range (260px) is the real balance parameter:** exfil windows
  work not because guards are far in absolute terms but because their cone
  can't touch the corridor for the duration of a continuous move. Reasoning
  about "cone-shadow duration of a path", not guard distance, is what made
  the final plan provable.

### 6 · Emberwake — twin-stick horde survival (Nuclear Throne × Vampire Survivors) ✅

**Shipped:** 120-second survival night: auto-aim fire, quadratic spawn ramp,
two enemy types with soft-separation flocking, kill-driven level-ups with
pick-1-of-3 builds (sim pauses on choice, picks are input actions).
Orbit bot survives with hp floor 5/8, peak horde 161, 569 kills;
sim step averages 0.02ms at peak (100× under the 2ms budget); deterministic.

**Findings:**

- **Perf: the SpatialHash pattern holds effortlessly.** Rebuild-per-step +
  queryCircle for bullets and separation runs the whole night at 0.02ms/step
  in Node — entity-count ceilings live in the RENDERER, not the sim. Hence
  the view lesson: pooled sprites (update-in-place, hide extras) and the
  Canvas2D backend; rebuilding hundreds of scene nodes per frame is an
  allocation storm the sim never sees.
- **Kiting bots corner themselves; orbiting bots don't.** Flee-the-centroid
  drove the bot into walls every run (all deaths at x=1236). The genre's real
  skill is orbiting the arena — once encoded, survival became a question of
  pure build/balance. Bot strategy IS design knowledge.
- **Balance tuning was three sim runs:** died-at-82s (ramp too hot) →
  untouched-with-19-alive (upgrades too strong for a linear ramp) → the
  keeper: quadratic spawn ramp vs multiplicative build growth. Horde genres
  want spawn pressure superlinear to stay ahead of exponential player DPS —
  and 'peak alive ≥ 150' is asserted so the horde FEEL can't silently
  regress.
- **rng-in-the-loop determinism works**: spawns and upgrade offers draw from
  `world.rng` inside the pure step (passed in, never imported) and the whole
  night replays hash-identical.

### 14 · Lumen Forge — incremental/idle (Paperclips × Cookie Clicker) ✅

**Shipped:** 5-tier exponential economy (lantern → dawn engine), forge clicking,
unlock-by-lifetime-total reveals, DOM shop sidebar, pulsing-forge SVG view with
orbiting fireflies. Balance sim–verified 10-minute arc: first buys at
3s / 71s / 236s / 402s / 607s, era gaps 69→164→166→205s.

**Findings:**

- **The verify suite IS the game design for this genre.** Pacing windows,
  monotone production, no unlock deserts, no click-softlock — all asserted, so
  any retune that breaks the arc fails CI. Tuning was three verify runs:
  the greedy bot exposed that rising payback ratios (cost/prod per tier)
  strangle the late game; compressing paybacks to ~15–25s across tiers fixed
  it. No human playtest could have produced this signal in minutes.
- **Engine gap found + fixed: UI clicks weren't inputs.** Only KeyboardSource
  existed — a DOM buy button had no deterministic path into the sim. Added
  `input.press(action)` virtual taps (held until ≥1 fixed step samples them,
  cleared by the driver) and exposed `input` on GameHandle. Clicks now live in
  the same replayable input log as keys. Rule: **UI intent must be an action,
  never a direct state mutation** — else record/replay silently lies.
- **Genre note:** idle games exercise almost none of the scene tree and all of
  `world.state` + probes. The cosmetic view (log-scaled pulse, entity count as
  wealth display) matters for feel but the DOM is the real interface. A
  persistent HTML side panel (not modal showScreen) was needed; candidate for
  a ui/ "panel" helper if a third game wants one.
- **Gap deferred:** offline progress needs wall-clock at the driver boundary
  (store last-seen, feed elapsed as sim ticks on load) — designed but not
  built; revisit if a sim/farming game needs calendar time.

### 1 · Sokoban (v0.1 baseline)
Proved: pure `Puzzle` module + BFS solver + `assertDeterministic` + scripted
playthrough. Weakness identified: everything about this engine was only ever
exercised by a discrete grid puzzle. Hence this campaign.

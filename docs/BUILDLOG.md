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
| 7 | Bullet hell | Touhou × Jamestown | 1000+ bullets perf ceiling, pattern DSL | ✅ |
| 8 | Tower defense | Kingdom Rush × Bloons | path following, wave balance sim, counter system | ✅ |
| 9 | RTS-lite | (mass units) | flow fields, 300–500 units, counters, HUD density | ✅ |
| 10 | Traditional roguelike | Brogue × Shattered Pixel | procgen + connectivity proof, FOV, turn scheduler | ✅ |
| 11 | Roguelike deckbuilder | Slay the Spire-lite | card DSL, balance bot, addictive loop | ✅ |
| 12 | Turn-based tactics | Into the Breach-lite | telegraphed intents, push chains, fairness proof | ✅ |
| 13 | Match-3 | Puzzle Quest-ish | cascade choreography vs deterministic sim | ✅ |
| 14 | Incremental/idle | Universal Paperclips-lite | big numbers, offline time, pacing curves | ✅ |
| 15 | Farming/life sim | Stardew-lite | calendar clock, save/load, gentle pacing | ✅ |
| 16 | Survival horror | Darkwood-lite | shadowcast lighting, spatial audio, dread pacing | ✅ |
| 17 | City/colony builder | Islanders × Mini Motorways | placement scoring, growth sim, minimal viz | ✅ |
| 18 | Rhythm | NecroDancer-lite | audio clock vs sim clock determinism | ✅ |
| 19 | Physics arcade | Breakout roguelite / Peggle | continuous collision, deterministic FP physics | ✅ |
| 20 | Top-down racing | Micro Machines-lite | car handling feel, racing-line AI | ✅ |
| 21 | Narrative decisions | Reigns-lite | content DSL, long-arc balance sim | ✅ |

Order of battle: waves grouped by shared engine needs — movement/collision
(2–5), mass/perf (6–9), turn/UI (10–14), atmosphere/sim (15–21). Order may be
re-shuffled as lessons emerge.

## Entries

### NET · Fernclash — deterministic multiplayer (lockstep + rollback netcode) ✅

The engine was always a lockstep core (`step(inputs)` pure, seeded rng,
`hash()`); this build added the missing transport and proved it with a
2-player game. New `src/net/`: player-namespaced inputs (`p1:left` — merged
frames are ordinary frames, the whole verify harness works on multiplayer
unchanged), bus transports (BroadcastChannel tabs / zero-dep WebSocket relay
in `scripts/relay.mjs` / deterministic LoopbackHub with latency+loss for
tests), `LockstepSession` (input delay, redundancy windows, stall-not-desync),
`RollbackSession` (snapshot-ring predict/rollback on the proven
`snapshot()/restore()`), room layer (seed+roster handshake, mid-game join via
snapshot shipped at an agreed future frame, leave cutoffs), periodic
`hash()` exchange that freezes on desync and dumps a replayable input log.

**Fernclash** (`examples/fernclash/`): sumo duel on a fern ring — the same
game runs hot-seat (pre-namespaced input map) and true netplay with zero
branches in game code. Verified: bot duel won 3–0; golden replay;
deterministic; **two lockstep peers finish a full match over a lossy, laggy
loopback and agree bit-for-bit**; real-socket relay covered in
`src/net/relay.test.ts`.

**Findings:**

- **Cross-machine determinism is stronger than same-machine determinism.**
  `Math.sin/cos/atan2/pow/hypot/log` are implementation-defined per JS engine.
  New `core/dmath.ts` (fdlibm-style, exactly-rounded ops only) replaced every
  sim-side call, and `npm run invariants` now bans the raw forms. Goldens
  moved once (sub-ulp shifts) and are pinned to the deterministic forms.
- **Registered custom nodes are the netplay-safe pattern.** Logic in a
  `registerNode`'d class survives `restore()`; closure behaviors don't. The
  fernclash rule: rematch flows through the *input stream* (`again` action),
  never a DOM callback that mutates state on one peer only.
- **A late joiner must not bootstrap-zero the veterans' inputs.** Only
  genuinely-new players get empty bootstrap frames; the welcome also carries
  still-pending joins. Caught by the room-level late-join test as a desync at
  the first hash interval — exactly the failure mode the hash exchange exists
  to catch.
- Full doc: [NETWORKING.md](NETWORKING.md).

### B1 · Seamfold — benchmark reproduction of Edge Not Found (js13k 2020, #2) ✅

First rung of the [BENCHMARK](BENCHMARK.md) ladder: reproduce a human-ranked
game under the house discipline. Target: Sokoban on a *twisted torus* — no
outside, seams that shift you along the other axis (`xOff`/`yOff`).

**Shipped:** pure twisted-torus rules (fixpoint wrap resolution — the original
ships a commented known bug in its x→y→x ordering), 4 original levels teaching
torus → yOff twist → xOff twist → both, 3×3 ghost-copy tiling honoring the
twist (all cosmetic), undo/restart, win/next-level loop. Verified: every level
solver-proven winnable (8→6→5→13 moves, finale deepest) AND proven UNsolvable
in a no-wrap variant — the seam is machine-proven load-bearing; full campaign
replayed through the scene view; deterministic + golden; timeline probes show
exactly one visible box seam-jump in the level-1 solve; filmstrip + stills
judged readable.

**Fidelity score (rubric in BENCHMARK.md):** mechanics 8/8 M-checks green ·
content parity: teaching arc matches, volume 4 vs the original's 20+ levels
(arc ✓, volume ✗) · feel/look ✓ (3 timeline metrics + judged artifacts) ·
learning yield: no engine gap (see below) + one new lesson + one friction fix.

**Findings:**

- **The negative solver proof is the benchmark's best fidelity instrument.**
  "Winnable" is table stakes; asserting the mechanic is *load-bearing* — same
  rules with seam-crossings forbidden, solver proves UNsolvable — turns "this
  level teaches the twist" from intent into CI. Generalizes to any
  mechanic-gated genre (see LESSONS).
- **The solver out-designed the designer twice on one level.** The finale
  hand-trace said "no-wrap solvable" (M4 violation); the solver proved the
  goal-placed boxes seal the player out of both push regions, so it's
  genuinely seam-or-nothing — a property designed by accident, discovered by
  proof. In-head verification failed in BOTH directions on a 6×6 grid.
- **Reproduction cost at rung 1 was ~zero engine work.** Grid puzzle is the
  engine's home turf; the alien state model (quotient space instead of
  bounded grid) fit `Puzzle<State, Move>` untouched. The ladder's later
  rungs (real-time feel, juice/scale) are where gaps should surface.
- **Spec-card extraction from ranked source works.** Reading the original's
  `wrapCoords` gave exact semantics (including its bug) in minutes; the spec
  card's M-checklist mapped 1:1 onto verify checks. Design extracted, zero
  code ported.

### Playtest wave 1 — the unmeasured layer (first human contact)

The first human playtest reported five defects; every one instantly read as
"no human reviewed this", and every one shares a root cause: **it lived in
the layer the verification philosophy exempted from measurement.** "The
cosmetic layer can be deleted without changing the game" had been treated as
license to never verify it. Bots read probes, not pixels; they know the
controls a priori and what every entity is — so buried HUDs, kissing labels,
bracket soup, missing onboarding, indistinguishable pickups, unearned story
payoffs, and edge-hiding cheese were invisible BY CONSTRUCTION.

Reported → root cause → systemic fix:

- **Shard Ascent: HUD under the tiles.** Text z defaulted to 0 under z2
  tiles; nothing ever asserted paint order. → `verify/layout.ts`: the display
  list is pure data, so text readability is now linted (panel-or-disjoint
  rule, scrim-aware); the HUD got a scrim, and the lint is a verify stage.
- **Thornspire: text kissing the boss; illegible bracket-soup hand.** Layout
  was absolute-positioned prose with no layout contract, information design
  never a target. → explicit layout contract in the view (the circle owns its
  band; one card per line, left-aligned, "press N · Name — effect" wording,
  energy pips), linted on BOTH screens.
- **Vantage: no way to learn the controls.** Bots emit actions directly —
  onboarding is invisible to them. → onboarding overlay + context-sensitive
  coach line, and `missingControlHints()`: every mapped action must be named
  on screen (frame-1), now portfolio convention.
- **Duskveil: ship hides at the rim + "The Duskveil lifts" pays off nothing.**
  (a) The Canvas backend STRETCHED (100%/100%, no aspect preservation — SVG
  letterboxed, canvas didn't; headless never renders through CSS, so nobody
  saw it) and the clamp ignored sprite extents. → canvas `object-fit:
  contain`; clamps include extents; a no-safe-camp probe (parked at the rim →
  hit in 9.6s). (b) Ending copy introduced a noun the game never showed. →
  the boss is NAMED in the HUD (asserted), and the fiction rule enters
  CONVENTIONS: endings may not introduce new proper nouns.
- **Hollowdeep: hp/atk unglyph'd, pickups look like monsters.** State knows
  what everything is; the screen didn't say. → flask-shaped potions, hostile
  outlines on creatures, a true-glyph legend strip, ♥/⚔/⚗ HUD — and the
  legend is part of the linted screen.

The meta-lesson joins the synthesis laws as #8: **verify the human-contact
layer with the same machinery — the display list is data, onboarding is a
checkable contract, and "would a stranger understand this screen in 30
seconds" is a test, not a vibe.** Remaining human-only judgement (taste,
tone) routes through the shots/ artifacts: emitting key screens per verify
run makes "a human looked at it" a pipeline step instead of an accident.

## Campaign synthesis (all 20 genres complete)

The portfolio's cross-genre laws, earned the hard way:

1. **Every genre has a mechanical truth, and it is provable.** Puzzles have
   solvers; movement has bots; economies have pacing windows; counter systems
   have duels; procgen has connectivity; stealth has both-ways affordance
   proofs; rhythm has frame-exact windows; narrative has content lints. The
   verify suite IS the design document.
2. **Skill-delta proofs are the closest thing to a fun proof:** drafting beats
   skipping (17/20 vs 9/20), greedy beats random (158 vs 82), braking beats
   flooring (26.2s vs 27.7s), judgement beats recklessness (19/20 vs 0/20),
   counters beat spam. If a null strategy competes with intended play, the
   game is broken — assert the delta.
3. **Derive constraints, don't vibe them:** movement envelopes before levels,
   season length ≥ growDays, turn radius vs corner radius, fuel arithmetic vs
   night length, spike damage vs block ceilings. Every "feels wrong" traced to
   a violated inequality.
4. **Null-strategy baselines are the cheapest scenario test:** the undefended
   lane, the do-nothing tactics turn, the never-draft climb, the camping
   keeper. A threat that a null strategy survives isn't a threat.
5. **Grace is a system, not polish:** coyote/buffers, i-frames, hit-stop input
   buffering, wound-before-death, mercy clears, phase-transition clears — the
   same shape at every timescale, and each is unit-testable.
6. **The observer split held everywhere:** cosmetic views (pooled sprites,
   spring choreography, particle bursts, spatial audio) were deleted-without-
   diff throughout; the instant-sim/animated-view split (Glimmerfall) is its
   purest form. The beat being sim time (Cadence) is its deepest consequence.
7. **Pure-data state pays compound interest:** structuredClone-and-score
   powered tactics options, Peggle aim search, and deckbuilder pilots; hashing
   and goldens pinned 20 games; every sim doubles as its own planning model.


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

### 7 · Duskveil — bullet hell (Touhou × Jamestown) ✅

**Shipped:** three-phase boss with a declarative pattern DSL (ring / fan /
rain, spin + arc + cadence params), 5px hitbox, focus mode, grazing,
mercy-clears on death and phase transitions. Dodge bot clears the full fight
deathless in 143.6s at 487 peak live bullets; sim rounds to 0.00ms/step;
deterministic.

**Findings:**

- **Pattern fairness has a mechanical proof: a greedy lookahead dodger.**
  9 candidate moves × 26 frames of linear bullet prediction is enough to
  survive everything a fair pattern throws; if that bot dies, humans die
  unfairly. This is the real-time analogue of the Sokoban solver — the
  strongest fairness gate in the campaign so far.
- **Dodging is trivial; UPTIME is the game.** The bot's first version
  survived forever and never won — staying alive away from the boss is easy,
  the skill is holding fire lanes under a moving boss. Scoring had to weight
  'be under where the boss WILL be' (leading its sway) above clearance
  saturation. Design mirror: bullet hells are positioning games disguised as
  dodging games; patterns should punish camping, not movement.
- **The pattern DSL earns its keep:** three phases = 8 data lines. Difficulty
  knobs (count, cadence, spin, arc) tune density independently of fairness —
  thickening phase 3 from 297 to 487 peak bullets cost the deathless bot
  nothing, confirming density ≠ difficulty when patterns stay coherent.
- **Mercy rules are structural, not polish:** the respawn bullet-clear radius
  and phase-transition clears are what keep 3 lives meaningful at this
  density — without them, deaths cascade. (Same family as i-frames.)

### 8 · Rootward — tower defense (Kingdom Rush × Bloons) ✅

**Shipped:** S-curve lane with waypoint interpolation, 12 build pads, three
counter-typed towers (arrow / frost aura / splash cannon), ten composed waves
with a bounty economy, cursor-driven building via input actions. The scripted
mixed build survives 10/10 waves at 9 lives; an arrow-only build of a larger
budget falls to the tank waves; the bare lane falls on wave 2; the pressure
curve ramps with breathers; deterministic.

**Findings:**

- **A counter system must be proven from BOTH sides.** After the first range
  buff, arrow-spam beat everything — the "counter" was decorative. It became
  real only when tank arrow-resist dropped to 0.12 (arrows ~useless), which
  is the design rule: soft resists (45%) get erased by tower-count scaling;
  counters need to be near-hard to force build diversity.
- **Tower coverage is geometry, not stats.** A range-175 tower on a pad 120px
  off the lane covers a 254px chord — 3.2s of fire, less than one grunt kill.
  Pad placement × range defines the real DPS; the range ring in the HUD is
  the single most important piece of UI in the genre.
- **A verify-driver bug masqueraded as a design failure:** holding 'next'
  every frame edges justPressed once, so the cursor stuck and NOTHING was
  built — 'mixed build' and 'undefended' were identical runs. Symmetric to
  the shard-ascent DJ-tap lesson, from the driving side: **edge-triggered
  inputs need explicit release frames in any scripted driver.** Worth a
  helper in the engine bot at synthesis time.
- **Wave curves aren't monotone — they breathe.** Runner waves are pressure
  breaks by design; the right telemetry gate is 'each wave ≥ 55% of the
  previous, finale is the peak', not monotone hp.

### 9 · Bramblefall — RTS-lite (mass units + counters + HUD) ✅

**Shipped:** keep-vs-keep skirmish: BFS flow-field pathfinding (cached per
goal tile), 260+ units steering with hash separation, spear→cavalry→archer
counter triangle, per-unit order targets, reinforcement trickle, a pulsing
enemy commander, cursor-command HUD with per-type army counts. Verified:
every counter edge wins its 40v40 duel to extinction; the commander bot
(turtle → counterpush) razes the keep in 82s with 120 standing; a walled-off
unit routes around brambles in 3.7s; 0.80ms/step at peak; deterministic.

**Findings:**

- **Flow fields are the cheapest 'real RTS tech' win:** one BFS per ordered
  goal tile (40×22 grid, cached as derived data OUTSIDE state) gives hundreds
  of units wall-aware pathing with zero per-unit search. The cache-not-state
  distinction matters: fields are recomputable projections of (map, goal), so
  hashing/serializing them would only bloat snapshots.
- **Unit arrival tolerance is API, not detail.** Units hold 50px off their
  goal tile; the verify assertion assumed 40px and 'failed' a working system.
  Wherever a sim has a behavioural tolerance, EXPORT it — tests and bots must
  share the sim's own constants, not re-guess them.
- **Strategy is the balance test in symmetric games.** Attack-move-everything
  loses the keep race; turtle-then-counterpush wins with 120 spare — the
  matchup is defender-favoured (keep + massed army beats a marching column),
  which is correct for a defend-your-base design. The verify bot documents
  the intended line of play, exactly like Rootward's build order.
- **Perf headroom confirmed for the wave:** 265 units full-combat at
  0.80ms/step — same rebuild-per-step hash pattern as Emberwake, an order of
  magnitude of margin left for a bigger RTS.

### 10 · Hollowdeep — traditional roguelike (Brogue × Shattered Pixel) ✅

**Shipped:** three procgen floors (rooms + L-corridors), raycast FOV with
lit/explored/unknown memory, turn scheduler (shades act every other turn),
bump combat, potions + a blade upgrade, descent to the Pale Amulet. Verified:
connectivity across 50 seeds × 3 floors (stairs + ALL loot reachable), seeded
layouts reproduce exactly, a full-knowledge explorer bot wins seed 1 and
10/10 random seeds, turn log replays deterministically.

**Findings:**

- **The classic procgen bug appeared on schedule and the classic proof caught
  it:** one branch of the L-corridor carver skipped its vertical leg, so
  ~half the room links were walls. 162/150-floor connectivity failures —
  and the bot's 3/10 win rate — from one wrong line. After the fix: 0 broken,
  10/10 wins. Procgen without a reachability gate is unshippable; with one,
  the bug survived less than a minute.
- **Fairness ≈ connectivity in this genre.** The bot's win-rate jumped from
  3/10 to 10/10 purely from the topology fix — no combat rebalance needed.
  Assert connectivity FIRST; only tune numbers when topology is proven.
- **Turn-based reuses the whole real-time stack:** the engine raycast does
  FOV (per-tile lineOfSight with a small inset for wall lighting), input
  edges ARE turns (one justPressed = one world step, held keys don't
  repeat), and the sokoban replay pattern covers a 900-turn run unchanged.
- **Full-knowledge bots prove winnability, not player experience** — the bot
  pathfinds with the whole map. That's the right claim for procgen ('a
  winning line exists'), the same epistemic status as the Sokoban solver.

### 11 · Thornspire — roguelike deckbuilder (Slay the Spire-lite) ✅

**Shipped:** data-driven card DSL (8 cards: dmg/hits/block/draw/vulnerable),
3-energy turns with reshuffling piles, deterministic enemy intent scripts
(attack/block/charge-doubles-next), pick-1-of-3 drafts after every fight, an
8-node climb (fights, rests, an elite, the Spire Heart). Verified: a greedy
pilot wins 17/20 seeds (target 11–19); a never-draft pilot wins 9/20 —
progression proven; 30 turns of intents audited as exactly honest; seed-1
climb pinned as a golden replay hash.

**Findings:**

- **Win-rate windows are the genre's balance instrument, and both edges
  matter.** First tuning: 3/20 (charged spikes exceeded any block ceiling —
  32 incoming vs ~16 blockable is not tension, it's a coin flip about draw
  order). Second: 20/20 (no tension at all). The keeper sits at 17/20 via
  spike damage ≤ pool+heal arithmetic. The assertion window (11–19) means
  BOTH failure directions break CI.
- **'Drafting matters' is provable:** the same pilot with drafting off drops
  from 17 to 9 wins. That delta IS the genre — if skipping every reward were
  competitive, the deckbuilder would be a solitaire timer. Assert the delta,
  not just the win rate.
- **Intent honesty is a one-line audit worth its weight:** resolve each
  telegraph and compare actual hp loss to the shown number, block included.
  Any future charge/vuln/block interaction bug fails loudly here — this is
  the perfect-information contract Into the Breach lives on (G12 next).
- Turn-based + rng-in-sim (shuffles) replays fine: the draw pile is state,
  the shuffle draws from world.rng, and the golden hash pins the whole run.

### 12 · Vantage — turn-based tactics (Into the Breach-lite) ✅

**Shipped:** 8×8 grid, three mechs (melee push / lobbing artillery / ranger),
bugs with directional telegraphs resolved exactly as shown, push mechanics
with bump damage and chain redirects, greenhouse protection over five turns,
scripted spawns. Verified: a 1-ply greedy defender achieves a PERFECT
defence; push-redirect, rim-bump and unit-bump each proven in isolation;
a do-nothing defence loses everything (threat real); golden end-state.

**Findings:**

- **The do-nothing baseline is the cheapest scenario-design test in the
  campaign.** First cut: ignoring every bug still won — bugs marching 1
  tile/turn could never reach the north row inside five turns. A genre
  scenario needs BOTH proofs: a line of play that wins AND a null strategy
  that loses. (Same shape as Rootward's undefended-lane check; now a
  standing pattern.)
- **Push-redirect is state-relative telegraphing:** storing the telegraph as
  a DIRECTION on the bug (not a target tile) is what makes pushing rewrite
  the future — the entire genre falls out of that one representation choice.
- **1-ply greedy + structuredClone is a real tactics baseline.** ~80 options
  per mech activation, scored on a cloned state (prospective telegraph
  damage weighted -90) — enough for a perfect clear of a fair scenario, no
  search tree needed. Pure-data state makes clone-and-score trivial; THIS is
  where the plain-object discipline pays.
- Turn-based command interfaces (select/cursor/move/attack/end) drive
  equally well from keys and from verify scripts — the VtCmd union is the
  sim's real API, input actions are just one binding of it.

### 13 · Glimmerfall — match-3 (Puzzle Quest-ish) ✅

**Shipped:** 8×8 six-color board, grab-and-swap input, line matches, gravity,
rng refills, cascade combos (×combo scoring), dead-board reshuffles, a
22-move / 1300-light goal. Verified: 100 fresh boards fair (no pre-matches,
always a move), the resolve script accounts for every point, a greedy
matcher hits the target on 13/20 seeds, scripted session golden-pinned.

**Findings:**

- **Instant-sim + animated-view is the right split for cascade games.** The
  sim resolves a whole cascade in one deterministic step and RETURNS the
  choreography script (what cleared at each combo depth); the view springs
  gems toward their true slots and reads the script for bursts. Delete the
  animation and the game is bit-identical — the strongest possible form of
  the cosmetic-layer rule, and it makes cascade correctness trivially
  testable (no animation timing in tests, ever).
- **Score accounting as an invariant:** `score === Σ cleared×10×combo` over
  the resolve script catches any double-count/refill-scoring bug forever.
  Economies should always ship with their own bookkeeping audit.
- **Match-3 winnability is a distribution, not a bound.** The greedy matcher
  measures the luck-adjusted difficulty; the target was tuned by win-rate
  (2/20 at 2200 → 13/20 at 1300). In luck-heavy genres, tune the GOAL to the
  measured bot distribution rather than the mechanics to a fixed goal.
- Board-generation fairness (no pre-matches + guaranteed move + reshuffle
  rescue) is the genre's connectivity proof — same slot as Hollowdeep's BFS.

### 15 · Fernrow — farming/life sim (Stardew-lite) ✅

**Shipped:** a 16-day year over four seasons, energy-budgeted days (24
actions), till/plant/water/harvest on a 10×6 farm, three season-locked crops,
overnight growth, unripe-crops-wither on season change, a 700-coin festival
goal. Verified: a diligent bot wins on day 12 (30 harvests); no-water-no-
growth; wither honesty; the energy bound; reinvestment compounds (740 vs
236 coins); golden year replay.

**Findings:**

- **Calendar arithmetic is a solvency constraint.** First cut: 3-day seasons
  with 2-3-night crops meant beans could NEVER mature (planted day 1 of
  summer, ripe the morning autumn withers them) — the bot ended the year with
  4 coins and the 'compounding' comparison read 4 vs 4. Season length ≥
  longest growDays + harvest slack is a hard inequality; check it the way
  Shard Ascent checks jump distance.
- **'Don't plant what can't mature' is player knowledge the sim shouldn't
  hide:** the bot needed a nights-left-in-season guard to stop donating seed
  money to the wither. A kind UI would surface exactly this number.
- **Ripe crops surviving the season turn** is the difference between a
  punishing calendar and a gentle one — one predicate
  (`grown < growDays` in the wither rule) sets the genre's whole mood.
- Economy proofs transfer straight from Lumen Forge: goal tuned to the
  measured bot yield, plus a reinvest-vs-hoard delta (the farming version of
  'drafting matters').

### 16 · Palewood — survival horror (Darkwood-lite) ✅

**Shipped:** one 90-second night: a raycast-shadowed lantern (radius + LOS —
trees cast real darkness), fuel that drains and cans that force fetch runs,
Pales that stalk the dark and flinch from light, wound/grace grabs, panned +
distance-attenuated growls (new engine `audio.spatial`, StereoPanner), a
dread heartbeat that quickens. Verified: the keeper survives to dawn burning
all 5 cans; fuel arithmetic proves camping impossible AND the night winnable;
light-repels and darkness-kills each proven; deterministic + golden.

**Findings:**

- **Horror difficulty lives in the resource arithmetic, not the monster.**
  Every keeper death traced to fuel economics: fetch-early wasted refuel
  overflow against the tank cap (all cans gone by t=35, dry at 47); the
  discipline that survives is 'refuel only below max−refuel'. The genre's
  dread loop IS an economy — same audit tools as Lumen Forge/Fernrow apply.
- **LOS-shadows create ambush zones; physicality keeps them fair.** Pales
  that could walk through trees became invisible adjacent killers (unlit by
  LOS *inside* the copse). Making monsters collide — including their
  knockback recoil, which otherwise embeds them in trees and freezes them —
  turned shadows from cheap deaths into readable threats. Rule: anything
  that interacts with light must interact with the light's occluders.
- **Wound + grace beats instadeath** (the i-frames family again, at horror
  pacing): one grab is a story, two is a death.
- **Spatial audio was a 20-line engine addition:** pan from horizontal
  offset, gain from distance², all driven by sim events (`ev.growl`) — the
  no-op-in-Node invariant holds, so headless verification is untouched.

### 17 · Tarnholm — city/colony builder (Islanders × Mini Motorways) ✅

**Shipped:** procgen island (water rim, forest patches, grassy heart), an
18-building queue, adjacency scoring (huts cluster, farms want open grass,
sawmills forest, docks water, temples love huts and hate industry), live
score preview under the cursor, a 150-renown target. Verified: 50 islands
always fit the queue; greedy placement wins 20/20 at avg 158 (tight); greedy
nearly doubles random placement (158 vs 82 — skill is real); scoring honesty
audited; deterministic + golden.

**Findings:**

- **The live '+N' under the cursor is the entire genre UI.** Islanders works
  because the scoring function is EXPOSED, not discovered — `placementScore`
  serves the sim, the verify suite, the greedy bot, and the cursor label from
  one function. When a genre's core rule is one pure function, put it on
  screen verbatim.
- **Skill-delta proofs generalize:** greedy-vs-random is the placement
  version of Thornspire's draft-vs-skip and Fernrow's reinvest-vs-hoard.
  Every strategy genre now ships an assertion that playing WELL matters —
  arguably the closest thing this campaign has to a mechanical 'fun proof'.
- Negative synergies (temples hating industry) create the only real decisions
  in the queue — pure positive-sum scoring plays itself. A design smell worth
  remembering: if the greedy bot never faces a tradeoff, neither does the
  player.

### 18 · Cadence Hollow — rhythm (Crypt of the NecroDancer-lite) ✅

**Shipped:** a beat-locked dungeon chamber: 120 BPM = exactly 30 fixed frames
per beat, moves legal only inside a ±4-frame window (one per beat), foes act
in lockstep on beat ticks, combos build on-beat and shatter off-beat, floor
and metronome pulse read straight from the frame counter. Verified: a
beat-perfect dancer clears the chamber; the window honest TO THE FRAME
(+4 in, +5 out); one-action-per-beat; foes provably frozen between beats;
the whole dance replays hash-identically.

**Findings:**

- **The genre's determinism paradox dissolves by inverting the dependency:
  THE BEAT IS SIM TIME.** BPM chosen so a beat is an integer number of fixed
  frames; the timing window is frame arithmetic; the music is an observer
  that schedules tones off the sim's beat counter. Nothing about rhythm
  requires an audio clock in the sim — the audio clock is a RENDERER. (In a
  shipping title you'd lookahead-schedule Web Audio from the driver to hide
  rAF jitter; the sim contract is unchanged.)
- **Rhythm = an input-legality filter over a turn-based game.** Cadence is
  Hollowdeep with a when-may-you-act rule; the whole genre layer was ~30
  lines (beatOf/onBeat/one-act-per-beat). Genres compose.
- **Frame-exact window tests are the whole feel contract:** +4 frames
  accepted, +5 refused, hammering inside one window acts once. These three
  assertions define 'tight but fair' better than any playtest adjective.

### 19 · Pinshine — physics arcade (Breakout roguelite / Peggle) ✅

**Shipped:** a Peggle-ish board: aim fan + trajectory preview, gravity flight,
SWEPT circle-vs-circle collision (closed-form time-of-impact per substep, up
to 3 impacts resolved per substep for corner rattles), restitution bounces,
a patrolling refund bucket, 10 orange goals in 8 balls. Verified: an
aim-searching sharpshooter (49 candidate aims simulated per shot on cloned
states) clears the board in 7 balls; a 24,000px/s ball cannot tunnel and a
1px graze correctly misses; bounces never add energy; golden replay.

**Findings:**

- **Swept collision is a quadratic, not a subsystem.** |v|^2 t^2 + 2(d.v)t +
  |d|^2 - R^2 = 0, take the earliest root in [0, dt] — one function gives
  exact, speed-independent contact. The 'no tunneling ever' guarantee costs
  ~15 lines; substepping alone would have needed tuning forever.
- **Physics games get shot-planning bots for free from pure state:**
  clone the state, fire a candidate aim, run the flight, count oranges —
  the same structuredClone pattern as Vantage's tactics scoring. Winnability
  proof AND a difficulty meter (7 of 8 balls needed = tight board) in one.
- **Energy honesty as an invariant:** 'a bounce never leaves the ball faster
  than it arrived' catches restitution/normal bugs that look like
  liveliness. Feel-critical physics deserves conservation checks, not just
  trajectory eyeballing.

### 20 · Vellgrove Rally — top-down racing (Micro Machines-lite) ✅

**Shipped:** whole-track fixed camera, arcade handling (thrust, hard lateral
grip, high-speed UNDERSTEER, grass drag), a 12-waypoint circuit with
ordered-checkpoint laps, two racing-line rivals (seek-ahead + brake-for-bend),
countdown start, live positions. Verified: the line finishes 3 laps in 26.5s;
braking beats flat-out (26.2 vs 27.7 — cornering is a real skill); infield
cutting advances nothing; grass caps speed at 17%% of tarmac; the player-bot
wins P1 through the input layer; golden grand prix.

**Findings:**

- **Racing feel is an inequality chain:** turn radius (speed/steer-authority)
  vs corner radius vs track width. With full authority at speed, flat-out
  made every bend and braking was pointless — the fix wasn't more grip but
  UNDERSTEER (authority falls past 240px/s), which makes the speed/line
  tradeoff physically real. Same lesson family as Fernrow's calendar and
  Shard Ascent's envelope: derive the design constraint, don't vibe it.
- **Ordered checkpoints are the whole anti-cheat:** only the NEXT waypoint
  counts, so the infield is worthless by construction — one comparison, no
  path validation.
- **The rival AI is the difficulty dial and the proof in one object:** the
  same driveLine() drives rivals, proves lap-completability, measures the
  skill delta, and pilots the player-bot through the input layer.

### 21 · Emberreign — narrative decisions (Reigns-lite) ✅

**Shipped:** four meters between two ditches, a 15-card data-driven deck
(every choice double-edged), flag-chained story arcs (the plot you pay to
learn of vs the one that springs), eight themed dooms, survive-12-years
victory. Verified: a balanced regent survives 19/20 reigns; always-left wins
0/20 (avg 17 seasons) — judgement is the game; content lints clean (unique
ids, bounded effects, all arc flags settable); every doom fires its OWN
ending; the plot arc terminates both ways; deterministic + golden.

**Findings:**

- **When content is data, editorial judgement becomes CI.** The content lint
  (double-edged options, |effect| ≤ 20, every needs-flag settable somewhere)
  catches the classes of authoring mistakes that silently break narrative
  games: dead arcs, no-op choices, meter nukes. A writers'-room checklist as
  assertions.
- **The doom-attribution audit matters more than it looks:** each of the 8
  endings must fire from ITS meter at ITS edge — a swapped ending string is
  invisible to play-testing (you died, a doom showed) but wrecks the fiction.
- **The whole genre is the balance-seeking bot's world-view inverted:** the
  regent policy is 'minimize the worst meter's deviation from 50' — Reigns is
  fun precisely because cards make that impossible to do forever. The 19-vs-0
  policy delta is this campaign's final and cleanest 'decisions matter' proof.

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

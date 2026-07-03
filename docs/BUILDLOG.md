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

# FUN.md — the game-design playbook

Distilled from the 20-genre Build-Measure-Learn campaign
([BUILDLOG.md](../docs/BUILDLOG.md)). This is a **prompt, not an archive**: when
authoring a new game, obey Part 1, look up your genre in Part 2, and run the
Part 3 checklist *before* writing any level or content data. Corpus notes cite
the js13k dataset (`js13k/data/registry.csv`, 1,164 games with per-criterion
judge ranks; `rank_gameplay` used as the fun proxy).

> **Designing from a high-level intent?** FUN.md is the *verification* half — it
> proves a genre is fair. For the *generative* half — turning "make an RTS with
> faction asymmetry" into a concrete design — start with the
> **[spine](00-process/the-spine.md)**, the Codex's primary generator: name the one
> *tension* (objective · superpower · scarcity · obstacle · renewal) and derive the
> game from it, using the "X but Y" [twist](00-process/the-twist.md) only to give
> that tension a face. The spine gives you a *loop*; the twist gives you a *pitch* —
> lead with the loop. Then return here to prove what you designed — and note **law 8**
> below is where the spine's central coupling becomes a mechanical proof.

## Part 1 — Universal laws

1. **Every genre has a mechanical truth, and it is provable.** Find yours
   before coding: solver (puzzles), bot run (movement/combat), pacing windows
   (economies), duels (counter systems), connectivity (procgen), both-ways
   affordance proofs (stealth), frame windows (rhythm), content lints
   (narrative). *Test recipe: the verify suite IS the design doc — write its
   assertions in the spec, first.*
2. **Skill-delta proofs are the closest thing to a fun proof.** Run the
   intended strategy AND a null strategy; assert the gap. Drafting 17/20 vs
   skipping 9/20; greedy 158 vs random 82; braking 26.2s vs flooring 27.7s;
   judgement 19/20 vs recklessness 0/20. If null play competes, the game is
   broken. *Test recipe: `expect(smartScore).toBeGreaterThan(nullScore * K)`.*
3. **Derive constraints, don't vibe them.** Movement envelope before levels;
   season length ≥ growDays; turn radius < corner radius; fuel budget vs night
   length; spike damage ≤ block ceiling. Every "feels wrong" traces to a
   violated inequality. *Test recipe: state the inequality in a comment,
   assert it against the actual config and content.*
4. **Null-strategy baselines are the cheapest scenario test.** The undefended
   lane, the do-nothing turn, the camping keeper. A threat a null strategy
   survives isn't a threat; a scenario needs both a winning line AND a losing
   null. *Test recipe: run the do-nothing bot, assert it loses.*
5. **Grace is a system, not polish.** Coyote time, jump/hit-stop input
   buffering, i-frames, wound-before-death, mercy clears, undo, instant retry
   — the same shape at every timescale, each unit-testable. Any pause the sim
   injects must buffer intent across it. *Test recipe: frame-pump the grace
   window, assert accepted-inside / refused-outside to the exact frame.*
   *(Corpus: CLAWSTRIKE, 2025 gameplay #2, sells itself on "each retry is
   instant, keeping the momentum alive"; Dying Dreams, 2022 gameplay #1,
   ships Undo as a first-class key.)*
6. **The cosmetic-view rule.** Views (pooled sprites, springs, particles,
   spatial audio, the audio clock itself) must be deletable without changing
   a single sim bit. The sim resolves instantly and *returns choreography*;
   the view replays it. Beat/turn/cascade timing is sim time, never
   wall-clock. *Test recipe: run headless, hash; run with view, hash; equal.*
7. **Pure-data state pays compound interest.** Plain-JSON `world.state` +
   `world.rng` makes clone-and-score bots (tactics options, aim search,
   deck pilots), golden replay hashes, and save/load all free. Every sim
   doubles as its own planning model. *Test recipe: golden hash of a full
   scripted run; snapshot→restore→hash round-trip.*
8. **Coupling is provable by ablation — the sharp form of law 2.** Law 2 proves
   *some* tension exists; it can't say *where* it lives. A game can pass law 2
   while its fun rides on one system and the rest is decoration
   ([Design Codex](70-antipatterns/decoration.md)). Localize it: build the game
   twice — once with its central coupling intact (`coupled`), once with that ONE
   coupling neutralized (`ablated` — free light, infinite water, no stamina) — and
   run the SAME skilled and lazy policies over both. A real spine
   ([00-process/the-spine.md](00-process/the-spine.md)) makes the skill-gap
   **collapse** under ablation (e.g. skilled 1.0/1.0, lazy 0.0→0.875: a 1.0 gap
   falls to 0.125). A gap that *survives* ablation proves the coupling is
   decoration — the fun comes from elsewhere and this system is unproven weight.
   This is the "does using the superpower well create the next problem?" gate,
   made mechanical. *Test recipe:
   `assertLoadBearing({ coupling, coupled, ablated, skilled, lazy })` — from
   `@hayao`; the gap must collapse (`ablation.ts`).*

## Part 2 — Per-genre cheat sheet

Each entry: what makes it fun / the mechanical truth / the verify pattern.

### 1 · Grid puzzle (Sokoban)
- Fun = a solvable knot: tension between obvious moves and the real line.
- Truth: every level has a solver-provable solution; unwinnable = unshippable.
- Provide undo/restart — puzzle grace (law 5). Ramp difficulty across levels.
- Verify: BFS/A* solver over `Puzzle<State,Move>` for every level; replay determinism.
- Corpus: Dying Dreams (2022 gameplay #1): 13 puzzles, explicit ramp ("most not too hard, except the end"), undo key.

### 2 · Precision platformer (Celeste-like)
- Fun = trust: inputs land, deaths are your fault. The canon (coyote, jump
  buffer, variable height, apex gravity, corner correction, lift momentum) is
  15 unit tests, not vibes.
- Truth: the movement envelope (`jumpDistance/dashJumpDistance(cfg)`) bounds
  what's fair — derive gap widths from it; never eyeball "looks dashable".
- Grace state must persist past the state it changes (drop-through, coyote).
- Inherited momentum must survive flight — split airAccel from airFriction.
- Verify: waypoint bot beats every level 0-deaths; full-run determinism; per-level completion times expose the ramp.
- Corpus: The Way of the Dodo (2024 gameplay #2) teaches the same canon in its controls line: "release jump to break jump" (variable height), wall jump, rhythmic flaps.

### 3 · Metroidvania
- Fun = the locked-door promise kept: gates really gate, abilities really open.
- Truth: gates need NEGATIVE proofs — simulate the best ungated maneuver
  against real geometry and show it falls short (envelope is only a lower bound).
- Room transitions trigger inside the border; entries land past the far threshold (no ping-pong).
- Verify: bot full-run with abilities; both-ways gate proof (ungated fails, gated passes); save/load hash round-trip.

### 4 · Top-down action-adventure (Zelda-like)
- Fun = readable combat: telegraphs (~0.45s flash) make reactive play possible.
- Truth: hit-stop and i-frames are the feel; hit-stop must buffer inputs through the freeze or attacks "randomly" vanish.
- Keep exit lanes (door rows/columns) obstacle-free — cover in the path is a softlock.
- Verify: kiting-bot telemetry (win time, hp floor ≥ comfortable, 0 deaths); door gate both ways; containment every frame.

### 5 · Stealth
- Fun = plannable danger: cones and noise you can read and route around.
- Truth: prove affordances BOTH ways — exposure punished fast AND hiding
  actually conceals through a full patrol loop. "The bot won" proves neither.
- Every long traversal needs a safe pocket at its midpoint; chain single-guard
  windows — joint-phase waits explode combinatorially (unfair wait times).
- Balance on cone-shadow duration of a path, not guard distance.
- Verify: heist bot 0-alarm run + punished-exposure + concealment-holds assertions.

### 6 · Twin-stick horde survival (Vampire Survivors-like)
- Fun = the rising tide vs your rising build; the skill is orbiting, not fleeing (kiting bots corner themselves).
- Truth: spawn pressure must be superlinear (quadratic ramp) to stay ahead of
  multiplicative build growth, or upgrades trivialize the night.
- Level-up picks pause the sim; picks are input actions (replayable).
- Verify: orbit-bot survives with hp floor; assert `peak alive ≥ N` so horde feel can't regress; sim ms/step budget.
- Corpus: Cat Survivors (2025 gameplay #1) is exactly this loop — survive 10 minutes, level-up picks, escalating waves.

### 7 · Bullet hell
- Fun = density that reads: coherent patterns punish camping, not movement (density ≠ difficulty).
- Truth: fairness has a mechanical proof — a greedy lookahead dodger
  (9 moves × ~26 predicted frames). If that bot dies, humans die unfairly.
- Uptime is the game: dodging is trivial, holding fire lanes under the boss is skill.
- Mercy clears on death and phase transitions are structural (law 5) — without them deaths cascade.
- Verify: dodge bot clears deathless; peak-bullet count asserted; step-time budget.

### 8 · Tower defense
- Fun = build decisions that matter: counters must be near-hard (soft resists get erased by tower-count scaling).
- Truth: coverage is geometry — range × distance-to-lane = fire-window chord; the range ring is the genre's most important UI.
- Wave curves breathe: runner waves are pressure breaks; gate on "each wave ≥ 55% of previous, finale peaks", not monotone hp.
- Verify: mixed build survives 10/10; mono build (bigger budget) fails; bare lane falls early; counter duels from both sides.
- Corpus: CLAWSTRIKE (2025 gameplay #2) and Norman the Necromancer (2022 gameplay #4) both pace waves with explicit breathers.

### 9 · RTS-lite
- Fun = mass under command: hundreds of units that path around walls and answer orders.
- Truth: flow fields (one BFS per goal tile, cached OUTSIDE state) give wall-aware mass pathing for free.
- Export behavioural tolerances (arrival radius) as API — tests must share the sim's constants.
- Strategy is the balance test: the intended line (turtle→counterpush) beats attack-move.
- Verify: every counter edge wins its NvN duel; commander bot wins; walled-off unit routes around; ms/step at peak.

### 10 · Traditional roguelike
- Fun = fair discovery: procgen that always connects, turns that always replay.
- Truth: fairness ≈ connectivity. Assert stairs + ALL loot reachable across ~50 seeds BEFORE tuning any number.
- Turn-based reuses the real-time stack: input edge = one world step; raycast = FOV.
- Full-knowledge bots prove winnability (a line exists), not player experience — that's the right claim for procgen.
- Verify: seeded reproducibility; connectivity sweep; bot wins 10/10 random seeds; turn-log replay.

### 11 · Roguelike deckbuilder
- Fun = drafts with teeth; incoming spikes must be blockable-in-principle (spike dmg ≤ block ceiling + heal), or it's a coin flip.
- Truth: the balance instrument is a win-rate WINDOW (e.g. 11–19 of 20) — both edges break CI (too hard AND too easy).
- Assert the draft delta: same pilot, drafting off, must lose much more (17→9).
- Intent honesty is a one-line audit: resolve each telegraph, compare to shown number.
- Verify: greedy pilot in window; never-draft below it; intent audit; golden climb hash.
- Corpus: Spell Spells (2024 gameplay #8) and Casual Crusade (2023 gameplay #7) both center the loop on drafting rewards into the deck.

### 12 · Turn-based tactics (Into the Breach-like)
- Fun = rewriting the telegraphed future; store telegraphs as DIRECTIONS on units, not target tiles — pushing then rewrites outcomes.
- Truth: perfect information demands perfect honesty — what's shown is exactly what resolves.
- The scenario needs both proofs: a winning line AND a losing do-nothing (first cut's bugs couldn't reach the objective at all).
- 1-ply greedy + structuredClone scoring is a real baseline defender.
- Verify: greedy bot perfect-clears; do-nothing loses everything; each mechanic (push, bump, redirect) proven in isolation; golden end-state.

### 13 · Match-3
- Fun = cascades you triggered: instant deterministic sim returns the choreography script; the view animates it (purest law 6).
- Truth: board fairness is the connectivity proof — no pre-matches, always a legal move, reshuffle rescue.
- Winnability is a distribution: tune the GOAL to the measured bot win-rate, not mechanics to a fixed goal.
- Verify: N-board fairness sweep; score accounting invariant (`score === Σ cleared×base×combo`); greedy matcher hit-rate; golden session.

### 14 · Incremental/idle
- Fun = a pacing curve with no deserts: first-buy times and era gaps are the design.
- Truth: payback ratio (cost/prod) per tier must stay ~flat (15–25s) — rising paybacks strangle the late game.
- UI intent must be an action (`input.press`), never direct state mutation, or replay lies.
- Verify: balance-sim the whole arc; assert pacing windows, monotone production, no unlock deserts, no click-softlock.

### 15 · Farming/life sim
- Fun = gentle solvency: plans that can come true. Calendar arithmetic is a hard inequality — season length ≥ longest growDays + harvest slack.
- Truth: surface player-critical numbers (nights left in season) — knowledge the bot needed, the player needs.
- One predicate (ripe crops survive the season turn) sets the genre's whole mood.
- Verify: diligent bot wins by day N; no-water-no-growth; wither honesty; reinvest-vs-hoard delta (740 vs 236); golden year.
- Corpus: Tiny Yurts (2023 gameplay #4) shows the adjacent truth — the whole game is one exposed connect-farms-to-yurts rule.

### 16 · Survival horror
- Fun = dread you can budget: difficulty lives in resource arithmetic (fuel economy), not monster stats.
- Truth: prove camping impossible AND the night winnable from the same fuel arithmetic.
- Anything that interacts with light must collide with the light's occluders — else shadows become invisible unfair killers.
- Wound + grace beats instadeath: one grab is a story, two is a death.
- Verify: keeper bot survives to dawn; light-repels and darkness-kills each proven; fuel solvency inequality; golden night.

### 17 · City/colony builder
- Fun = the exposed score: the live "+N" under the cursor IS the genre UI. One pure `placementScore` serves sim, bot, tests, and label.
- Truth: negative synergies create the only real decisions — if the greedy bot never faces a tradeoff, neither does the player.
- Verify: N-island queue-always-fits sweep; greedy ≈ 2× random (skill delta); scoring honesty audit; golden.

### 18 · Rhythm
- Fun = tight but fair, defined by three frame-exact assertions: window edge in, edge+1 out, hammering acts once.
- Truth: THE BEAT IS SIM TIME — pick BPM so a beat is an integer frame count; audio is an observer scheduling off the beat counter.
- Rhythm = an input-legality filter over a turn-based game (~30 lines on top of a roguelike).
- Verify: beat-perfect bot clears; window honest to the frame; foes provably frozen between beats; hash-identical replay.

### 19 · Physics arcade (Breakout/Peggle)
- Fun = trustworthy flight: swept collision (closed-form time-of-impact) gives "no tunneling ever" in ~15 lines — never substep-and-pray.
- Truth: energy honesty — a bounce never leaves the ball faster than it arrived; conservation checks catch bugs that look like liveliness.
- Pure state gives shot-planning bots free: clone, fire candidate aims, count results — winnability AND a difficulty meter.
- Verify: aim-search bot clears within the ball budget; 24k px/s no-tunnel + 1px-graze-misses; energy invariant; golden.

### 20 · Top-down racing
- Fun = the speed/line tradeoff being physically real: understeer (authority falls with speed), not more grip.
- Truth: the inequality chain — turn radius (speed/steer-authority) vs corner radius vs track width. Flat-out must NOT make every bend.
- Ordered checkpoints (only the NEXT one counts) are the entire anti-cheat.
- The rival AI is difficulty dial, completability proof, and skill-delta meter in one `driveLine()`.
- Verify: line finishes laps; braking beats flooring; cutting advances nothing; off-track speed cap; golden grand prix.
- Corpus: WitchCup1276 (2023 gameplay #10) and DR1V3N WILD (2024 gameplay #3) both make brake a dedicated control — the skill the genre sells.

### 21 · Narrative decisions (Reigns-like)
- Fun = impossible stewardship: every choice double-edged, meters between two ditches; judgement beats any fixed policy (19/20 vs 0/20).
- Truth: when content is data, editorial judgement becomes CI — lint for unique ids, bounded effects (|Δ| ≤ 20), every needs-flag settable, no no-op choices.
- Doom attribution matters: each ending must fire from ITS meter at ITS edge — a swapped string wrecks the fiction invisibly.
- Verify: balanced-policy bot survives; always-left loses 0/20; content lint; every doom fires its own ending; arcs terminate both ways.

## Part 3 — Before you author levels/content

Run these BEFORE writing level/content data; each is a law-3 inequality or a
standing trap from the campaign:

- [ ] **Movement envelope computed** from the actual config
      (`jumpDistance/dashJumpDistance(cfg)`); every gap/climb sits inside it
      with human slack (frame-perfect = broken).
- [ ] **Negative gate proofs planned** — for every "you can't pass yet",
      a best-ungated-maneuver sim that fails.
- [ ] **Calendar/economy solvency** — season ≥ growDays + slack; fuel budget
      covers the night with discipline but not with camping; payback ratios
      flat across tiers.
- [ ] **Coverage geometry** — tower/guard/light ranges drawn against actual
      lane/path distances; fire-window chords long enough to matter.
- [ ] **Wave/pressure curve breathes** — deliberate breather beats; finale is
      the peak; assert the shape, not monotonicity.
- [ ] **Exit lanes clear** — no cover/pillars in door rows, no safe-pocketless
      long traversals, no joint-phase patrol waits.
- [ ] **Null strategy loses** — the do-nothing/undefended/never-draft run is
      scripted and asserted to fail.
- [ ] **Skill delta asserted** — intended play beats null play by a margin.
- [ ] **Central coupling ablation-proven** — for the game's spine coupling, the
      skilled-vs-lazy gap collapses when the coupling is removed
      (`assertLoadBearing`); a gap that survives means the coupling is decoration.
- [ ] **Grace windows specced in frames** — coyote/buffer/i-frames/mercy
      values chosen and tested edge-in/edge-out.
- [ ] **Procgen connectivity gate first** — reachability sweep across seeds
      before any numeric tuning.
- [ ] **Bot-driver inputs release between edges** — edge-triggered actions
      need explicit release frames in scripts.
- [ ] **All sim state in `world.state`/entities, all rng via `world.rng`,
      all UI intent via input actions** — then goldens, snapshots, and
      clone-and-score bots come free.

If the genre is a blend, satisfy every parent genre's verify pattern —
genres compose (rhythm = roguelike + input legality; Peggle = physics +
aim search).

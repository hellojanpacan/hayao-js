---
id: mechanic-clone
title: Clone / Echo
kind: mechanic
tags: [puzzle, record-replay, coop-solo, time]
summary: Record a run, then replay it as a helper — solve alongside your past selves.
use-when: A puzzle wants self-cooperation or you-need-to-be-two-places design.
composes-with: [mechanic-rewind, pattern-emergence, genre-grid-puzzle]
verify-with: docs/FUN.md#1-·-grid-puzzle
---

**What it is.** Record a full run of inputs, then spawn a **ghost** that replays them exactly while you play a fresh pass — cooperating with the recording you just made. One player, many bodies.

**Player fantasy / why it's fun.** You are your own team. The satisfaction is *authorship*: you set up a problem for your future self and then execute it, and the "aha" lands twice — once when you see the plan, once when the echoes obey.

**The verb.** Record → commit an echo → replay it alongside a new run, chaining until the room is solved.

**How it feels / why it's fun.** The pleasure is planning made physical. Each echo is a promise you made and must now keep — miss your mark and the whole stack falls apart. Tension comes from *choreography*: bodies must not collide, must hit switches in the right order, must not strand a later self. See [[pattern-mastery-and-flow]] and [[pattern-pacing-and-tension]].

### Tuning levers

| Lever | What it controls | Sane default |
|---|---|---|
| **Echo budget** | Max simultaneous clones | 3–4 (past 5, choreography load spikes) |
| **Record granularity** | Per-tick inputs vs per-move | Discrete moves on a grid; per-tick only if physics-driven |
| **Commit trigger** | When a run becomes an echo | Reach an exit / press "record next" |
| **Reset scope** | What resets on new pass | Full room; switches held by echoes persist |
| **Collision rule** | Body-on-body contact | Block (hard) or pass-through (soft) — pick one, never mix |
| **Paradox policy** | Echo path now invalid | Fail-fast: void the run, force re-record |
| **Divergence tolerance** | Drift before desync | Zero — determinism is the contract, not a knob |

**Determinism is the whole mechanic.** An echo that replays *approximately* is a broken echo — the player blames the game, not themselves. Record the **input stream**, not positions, and feed it through the same pure step function every pass. Same seed, same inputs, same result, every time. If your sim isn't deterministic, this mechanic cannot exist. See [[pattern-fairness-and-trust]] and the determinism invariant in [[process-core-loop]].

### Slots into

- Genres: [[genre-grid-puzzle]] (the native home), [[genre-puzzle-platformer]], [[genre-precision-platformer]], [[genre-coop-chaos]] (solo-coop framing).
- Anchors: **The Talos Principle** and **Braid**'s shadow-puzzle world are the canon; [[anchor-braid]] for the record-a-shadow idea, [[anchor-baba-is-you]] for rule-legible grid solving, [[anchor-outer-wilds]] for run-scoped knowledge carrying forward.
- Systems: [[system-encounter-design]], [[system-save-and-checkpoint]] (each committed echo IS a checkpoint), [[system-onboarding]] (teach one echo before two).

### Twist seams

- **Clone but each echo is one step slower** (structure) — every ghost runs at a reduced rate, so a two-body plan must account for staggered arrival. Turns a copy into a *lead/lag* timing puzzle; pairs with [[mechanic-rewind]] for correction.
- **Clone but the echo is adversarial and hunts you** (perspective) — your recording becomes a predator replaying your own habits back at you, à la [[anchor-shadow-of-mordor]]'s memory. Now good play means recording *bait*. See [[system-enemy-ai]] and [[genre-stealth]].
- **Clone but echoes decay** (economy) — a ghost lasts N ticks then vanishes, forcing you to spend clones like a resource. Couples to [[system-resource-loops]] and [[pattern-risk-reward]].

### How it wires to Hayao

- **Record the input log, replay through the pure step.** Puzzle rules live in a pure `Puzzle<State, Move>` module; an echo is just a stored `Move[]` you re-feed each pass. The scene tree renders ghost bodies as **cosmetic** view nodes so they stay out of the state hash — the *authoritative* state is switch/door/goal flags, not the ghost sprites. See `examples/sokoban/` for the logic/view split this leans on.
- **All randomness through the world RNG.** If a room has any stochastic element, it must be seeded so every replay reproduces byte-for-byte — otherwise echoes desync. Read the record-replay and determinism labs under `sandboxes/` before wiring the loop.
- **Solver proof carries the winnability guarantee.** Because rules are pure, a solver can prove each room is completable with the given echo budget — that proof is your content gate. Pointer only; the recipe lives in the frontmatter's verify-with.

### Fails when…

- **The replay isn't exact.** Any nondeterminism (float drift, `Math.random`, wall-clock timing) makes echoes betray the player — instant trust collapse. This is [[antipattern-input-lie]].
- **Paradox is handled silently.** If a committed echo's path is now blocked and the game half-executes it, the player can't reason about the board. Void loudly and re-record, never fudge. See [[antipattern-guess-the-designer]].
- **The budget is uncapped.** Ten simultaneous echoes is unreadable soup, not a puzzle — [[antipattern-decision-paralysis]] and [[pattern-readability]] both bite. Keep it small.
- **Every room is "add one more clone."** Escalating the count without a new *idea* per room is [[antipattern-content-desert]]; each level should twist a rule, not just raise N.
- **Choreography without telegraph.** If the player can't preview where an echo will go, collisions feel unfair. Ghost paths need [[system-telegraphs]].

### See also

- [[mechanic-rewind]] · [[mechanic-time-stop]] · [[mechanic-teleport]] — sibling time/space verbs.
- [[pattern-emergence]] — echo-on-echo interactions are where surprise lives.
- [[genre-grid-puzzle]] · [[recipe-detective-deduction-board]] — deterministic, provable solving as a design spine.
- [[process-the-twist]] — run the "X but Y" pass before shipping a plain copy.

---
id: mechanic-combo-string
title: Combo String / Cancels
kind: mechanic
tags: [combat, depth, timing, mastery]
summary: Chain attacks into cancellable sequences — the depth verb; mastery is knowing what links.
use-when: Combat wants a skill ceiling of expressive, learnable sequences.
composes-with: [mechanic-lock-on, system-combat-model, system-mastery-curve]
anchors: [anchor-street-fighter]
verify-with: docs/FUN.md#4-·-action-adventure
---

**What it is.** A **string** is a sequence of attacks where the recovery of one is cut short — *cancelled* — into the startup of the next, so hits chain faster than they could stand alone. Depth lives in which moves cancel into which.

**Player fantasy / why it's fun.** The **fluency** climb. Early on you mash and things die. Later you *see* the string in your head — light, light, launcher, cancel-into-special — and your hands catch up to your intent. The move you couldn't do last week is muscle memory now.

## The verb
Press attacks in an order and rhythm; the system reads the current move's state and lets you interrupt its recovery into a permitted follow-up.

## How it feels / why it's fun
- **Legibility of skill.** A combo is a sentence the player composes. Watching a good one reads as intent, not luck — the [[pattern-mastery-and-flow]] payoff.
- **The cancel is the dopamine.** Cutting recovery you *felt* was locked is the micro-thrill; it's the moment the floor drops away and depth opens.
- **Floor and ceiling in one input.** Mash produces a valid (weak) string; precise cancels produce the strong one. Same buttons, wildly different output — the definition of a healthy [[system-mastery-curve]].
- **Whiffs teach.** A dropped combo is legible feedback: you know *which* link you missed. See [[pattern-feedback-loops]].

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| Cancel window | Frames where a follow-up is buffered/accepted | 6–10 frames (~100–160ms) |
| Input buffer | How early the next input registers | 3–5 frames — generous keeps the floor |
| Gatling vs strict link | Auto-cancel on hit vs. frame-perfect manual | Gatling for the floor, strict links for the ceiling |
| Combo scaling | Damage falloff per hit in a string | 10% decay/hit, floor at 30% — kills infinites |
| Cancel routes | Which moves link into which | Sparse graph; not everything cancels everything |
| Mash tax | Does mashing degrade the result? | Yes — mash gives 60% of optimal, never 0% |
| Reset on whiff | Miss a hit → string ends? | Yes; landing hits is the earned reward |

**The one rule:** the ceiling is *routes and timing*, never *button count*. If the optimal string is just "more inputs," you have [[antipattern-false-depth]], not depth.

## Slots into
- [[genre-fighting-game]] — the home turf. [[anchor-street-fighter]] is the canon: gatling normals into special-cancels into supers, with strict links gating the top play.
- [[genre-action-adventure]] and [[genre-soulslike]]-adjacent hack-and-slash — [[anchor-hades]] weaves attack + dash-cancel + cast into fluent loops; [[anchor-dead-cells]] rewards weapon-swap cancels.
- [[genre-roguelike]] combat where [[system-build-diversity]] rewrites which routes exist per run.
- Pairs naturally with [[mechanic-lock-on]] (keeps the string aimed), [[mechanic-dodge-roll]] and [[mechanic-parry]] (defensive cancels), and [[mechanic-dash]] as the universal cancel.

## Twist seams
- **Combos but each hit changes the next available move** (emergence) — no fixed routes; every landed hit deals a hand of possible follow-ups (element, position, target-state). The string is *discovered* mid-fight, not memorized. Leans on [[pattern-emergence]] and turns [[system-status-effects]] into the grammar.
- **Combo but the string is the same across all players and coop shares it** (perspective) — one canonical string, but two players own alternating links; the cancel window only opens if your partner set it up. The combo becomes a duet, a [[system-coop-and-competition]] handshake — see [[anchor-it-takes-two]], [[genre-coop-chaos]].
- **Combo but dropping it is the mechanic** (subversion) — the "correct" string self-destructs at the last hit; mastery is knowing *where to stop* and cancel into defense. Risk-reward on every extension ([[pattern-risk-reward]]).

## How it wires to Hayao
- **State machine, deterministically clocked.** Model each attack as a state with `startup / active / recovery` frame counts and an explicit set of legal cancel targets. Advance on the fixed sim tick so windows are frame-exact and identical across replays — never wall-clock.
- **Buffer the input, don't poll the frame.** Store the last input with its tick stamp; on entering a cancel window, consume a buffered input if it's within the buffer horizon. This is what makes the floor forgiving without loosening the ceiling.
- **Combo state is sim state.** The active string, hit count, and scaling multiplier belong in the hashable world state, not the view. Hit-sparks, screen-shake, and freeze-frames are `cosmetic` view — read [[pattern-juice-choreography]] for the split.
- **Prove the routes.** Model the cancel graph as data and assert its properties (no infinite loop, every route terminates, scaling floors out). Study the parts in isolation before wiring the whole — the `sandboxes/` labs are the reference for a single mechanic; `examples/sokoban/` for the pure-logic/view split.
- Feel, timing tolerance, and cancel-window generosity are verified against `docs/FUN.md` — design the routes here, prove the feel there.

## Fails when…
- **The floor is a cliff.** Nothing works until you hit frame-perfect links → [[antipattern-difficulty-cliff]]. Mash must always *do something*.
- **One route dominates.** A single optimal string trivializes every fight → [[antipattern-boring-optimal]]. Rotate what cancels via enemy [[system-enemy-archetypes]] or per-run [[system-build-diversity]].
- **Infinite loops.** No scaling, no whiff-reset → the game solves itself. Combo scaling is not optional.
- **Depth is fake.** Longer strings for the sake of length, no decision inside them → [[antipattern-false-depth]].
- **The buffer lies.** Input registered but ignored, or window inconsistent tick-to-tick → [[antipattern-input-lie]]. This is a trust wound; it reads as *your* failure when it's the system's.
- **Unreadable.** Cancels bury the animation so hard the player can't parse the state → [[antipattern-unreadable-juice]]; also breaks [[pattern-readability]].

## See also
- [[system-combat-model]] · [[system-mastery-curve]] · [[system-counter-systems]] · [[system-telegraphs]]
- [[mechanic-charge-attack]] · [[mechanic-parry]] · [[mechanic-dodge-roll]] · [[mechanic-lock-on]]
- [[pattern-mastery-and-flow]] · [[pattern-risk-reward]] · [[pattern-emergence]]
- [[anchor-street-fighter]] · [[anchor-hades]] · [[anchor-dead-cells]] · [[genre-fighting-game]]

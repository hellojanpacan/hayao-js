---
id: mechanic-gravity-flip
title: Gravity Flip
kind: mechanic
tags: [movement, puzzle, reorient, platformer]
summary: Reverse or rotate down — the level stays; your relationship to it inverts.
use-when: A puzzle-platformer wants a single verb that recontextualizes every room.
composes-with: [mechanic-grow-shrink, genre-puzzle-platformer, pattern-emergence]
verify-with: design/FUN.md#2-·-precision-platformer
---

**What it is.** One button changes which way is **down**. The geometry never moves; the player's frame of reference does, so the ceiling becomes a floor and a wall becomes a path.

**Player fantasy / why it's fun.** You are the exception to the world's one unbreakable rule. Every flip is a small act of authorship — the room you were stuck in is suddenly the room you own. It rewards **spatial re-reading** over reflex: the depth is in seeing the layout upside-down before you commit.

## The verb
Press flip → your gravity vector reverses (or rotates 90°) → you fall the new way until you land or flip again. The floor you leave is the ceiling you head toward.

## How it feels / why it's fun
- **Reframing, not moving.** The dopamine is the re-read: a dead end read from the ceiling is an open corridor. This is the puzzle equivalent of [[mechanic-portal]]'s "the exit was always there."
- **Commitment tension.** Mid-flight you have no floor. The interval between leaving one surface and catching the next is the whole risk — see [[pattern-risk-reward]].
- **Legibility is everything.** The player must predict where "down" points *before* pressing. If they can't, it reads as chaos, not choice — lean hard on [[pattern-readability]] and [[system-telegraphs]].

## Tuning levers
| Lever | Default | Pushed low → | Pushed high → |
|---|---|---|---|
| **Axes** | binary (up/down) | pure vertical read, VVVVVV clarity | 4-way rotate: richer, far more disorienting |
| **Flip cost** | free, unlimited | spammy, trivial | metered (per-room budget) → planning puzzle |
| **In-air control** | none (ballistic) | commit-then-watch, honest | drift-steer → forgiving, muddier reads |
| **Fall speed** | brisk, fixed | slow float = readable, sleepy | fast = punchy, easy to misjudge |
| **Flip latency** | ~2–4 frames | instant, twitchy | wind-up telegraph = fair, sluggish |
| **Turn cooldown** | none | free re-flip mid-air | lockout → each flip is a real decision |

Defaults target a **precision-read** feel. To make it a pure logic puzzle, meter the cost and kill in-air control; to make it arcade, add drift-steer and speed.

## Binary flip vs 4-way rotate
- **Binary** is the honest starting point. One axis, two states — the player always knows the answer is up or down, so difficulty lives in *layout*, not orientation math. VVVVVV is the exemplar: no jump at all, just flip.
- **4-way rotate** multiplies expressiveness but taxes the player's mental model. Every wall is now a potential floor; disorientation becomes the real boss. Gate it — teach binary first, introduce the third and fourth direction as named beats, and keep a persistent **up-indicator** on the HUD. See [[system-onboarding]] and [[pattern-mastery-and-flow]].

## Disorientation control
The failure mode is nausea-of-the-mind: the player loses track of "which way is up." Counter it:
- **Camera anchors, not the geometry.** Keep a stable horizon cue (a fixed vignette, a gravity arrow) so the eye has a constant. Rotating the whole viewport on a 4-way flip is dramatic and disorienting — offer it as an [[system-accessibility]] toggle, not a default.
- **Pre-flip preview.** A ghost of the fall path, or a half-second of slowed time, lets the player read before committing — [[pattern-anti-frustration]].
- **One verb, one meaning.** Don't overload flip with a dash or attack; keep the mental cost singular.

## One verb, many rooms
A flip is a **layout multiplier**. A single hand-built room yields two (or four) distinct challenges depending on which surface you treat as floor — spikes on the "ceiling" only bite when you're inverted. This is the cheapest content-per-tile in the genre, and it's why flip games ship dense. Design each room to be *solvable and interesting from every orientation it permits*; that constraint is where the [[pattern-emergence]] lives.

## Slots into
- **Genres:** [[genre-puzzle-platformer]] (native home), [[genre-precision-platformer]] (as a movement seasoning), [[genre-grid-puzzle]] (discrete, turn-based flips), [[genre-metroidvania]] (as a gated traversal power).
- **Anchors:** [[anchor-portal]] (spatial reframing as the core delight), [[anchor-celeste]] (tight, readable platform verbs), [[anchor-braid]] (a single rule that rewrites every screen), [[anchor-baba-is-you]] (if the flip is itself a manipulable rule).

## Twist seams
- **Gravity flip but it also flips the enemies, so timing is a duet** *(structure)*. Every foe shares your gravity vector; flip and the patrol you were dodging now falls too. Encounters become call-and-response — you're conducting, not just dodging. Pair with [[system-encounter-design]] and [[system-enemy-ai]] built around shared "down."
- **Flip but each flip permanently paints the new floor** *(mechanic-swap)*. Landing lays down persistent tiles — walked surfaces become solid/lethal/collectible-bearing. The level is a canvas you author with your falls; a late room is a record of your path. See [[mechanic-clone]]-style state accretion and [[system-collectibles]].
- **Flip but only where light falls** *(constraint)*. Gravity reverses solely in lit zones — now [[world-mood-and-atmosphere]] is a mechanic and the level teaches through shadow.

## How it wires to Hayao
- Gravity is a per-body vector on the physics step; a flip negates or rotates it, and the ballistic fall is the solver's job — study the physics lab in `sandboxes/` before you hand-roll integration.
- If flip is **turn-based / discrete** (grid puzzle), the whole thing is a pure `Puzzle<State, Move>` where a move is `{flip: dir}` and every room is machine-proven solvable — that is the point of the pure-logic spine; `examples/sokoban/` is the logic/view reference.
- Keep the **up-indicator, ghost preview, and horizon vignette** `cosmetic` — they read but don't touch `world.hash()`.
- Determinism note: identical fall arcs across replays are non-negotiable for solver proofs; all in-air variance (dust, screen-shake) is cosmetic only. Prove the *feel* against [[pattern-mastery-and-flow]] and the platformer gate in `design/FUN.md`.

## Fails when…
- **The player can't predict "down."** If flipping feels like a dice roll, you've built [[antipattern-input-lie]]. Telegraph the vector before commit.
- **Rooms only work one way up.** If a layout is trivial or unsolvable in half its orientations, you wasted the multiplier and shipped [[antipattern-false-depth]].
- **Flip is free and spammy.** Zero cost + in-air steer collapses the decision; every wall becomes reachable by mashing → [[antipattern-boring-optimal]].
- **4-way with no anchor.** Rotating the world without a persistent up-cue is motion sickness, not challenge — an accessibility failure and a readability one.
- **Overloaded verb.** Flip *and* dash *and* attack on one input muddies the mental model — [[antipattern-feature-soup]].

## See also
- [[mechanic-double-jump]] · [[mechanic-dash]] · [[mechanic-bounce]] — the traversal verbs flip most often sits beside.
- [[mechanic-grow-shrink]] · [[mechanic-portal]] · [[mechanic-rewind]] — the other "recontextualize the room" verbs.
- [[genre-puzzle-platformer]] · [[pattern-emergence]] · [[pattern-readability]] — the design frame this lives inside.

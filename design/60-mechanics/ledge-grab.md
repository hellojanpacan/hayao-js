---
id: mechanic-ledge-grab
title: Ledge Grab / Mantle
kind: mechanic
tags: [movement, platformer, recovery, traversal]
summary: Catch and pull over an edge — the mercy that converts a near-miss into a foothold.
use-when: Platforming needs recovery generosity and readable climb points.
composes-with: [mechanic-climb, system-grace, pattern-anti-frustration]
verify-with: docs/FUN.md#2-·-precision-platformer
---

**What it is.** When a jump falls short but clips an edge, the player **snaps** into a hang, then pulls up. A recovery layer bolted onto the jump — a second chance the layout never had to promise.

**Player fantasy / why it's fun.** The heart-in-throat catch. You mistimed, you should have died, and instead a fingertip finds stone. The **rescue** is the reward; the mantle just cashes it.

---

The verb · You reach toward an edge you barely made — and the game **finishes the reach for you**.

How it feels · Ledge grab is [[system-grace]] made physical. It's not a skill you press so much as a promise the game keeps: *if you were close, you're safe.* Celeste and countless 2D platformers lean on it so a whiffed jump reads as "almost" not "dead." The tuning secret — **grab window and snap radius are difficulty dials that never touch the level geometry.** Widen them and the same gap forgives more; shrink them and the same gap demands frame-precision. See [[system-difficulty-and-dda]].

## Tuning levers

| Lever | What it controls | Sane default |
|---|---|---|
| **Snap radius** | How far below/beside an edge still counts as a grab | 8–16 px (≈¼ tile) |
| **Grab window** | Frames after passing the edge where a late grab still fires | 3–6 frames |
| **Hang state** | Static hold / drains stamina / auto-mantle after delay | player-held, no drain |
| **Mantle cost** | Time to pull up (vulnerable/committed during it) | 8–14 frames |
| **Facing gate** | Grab only when facing the wall, or any approach | facing-only |
| **Re-grab lockout** | Cooldown before the same edge grabs again | ~10 frames |
| **Upward-only** | Grab on descent only, or also mid-rise | descent + apex |

Tune snap radius and grab window **together** — they are the whole generosity budget. Publish the grab zone visually (a lip highlight, a hand-reach pose) so the promise is [[pattern-readability|readable]]; a grab the player can't predict feels like the game grabbing *them*. Keep the snap deterministic — a fixed radius test, no RNG in the catch — so a repeated approach always resolves the same way; [[pattern-fairness-and-trust]] dies the first time an identical jump grabs once and whiffs once.

## Slots into

- **Genres** — [[genre-precision-platformer]] (the canonical home), [[genre-puzzle-platformer]] (mantle as a spatial gate), [[genre-metroidvania]] (a traversal upgrade you gate behind an item), [[genre-action-adventure]] and [[genre-stealth]] (climb to a vantage or an unlit approach).
- **Anchors** — [[anchor-celeste]] (forgiving 2D grab), [[anchor-braid]] (deliberate mantles under rewind), [[anchor-cuphead]] (edge-cling as the only vertical mercy in a hard run), [[anchor-spelunky]] (grab-and-mantle as core traversal, whip/climb adjacent).

## Twist seams

- **Ledge grab but hanging drains a timer you refill by moving** (constraint) — the hang stops being a safe pause and becomes a metronome: cling too long and you drop, so grabbing chains into the *next* input. Turns rest into rhythm; pairs with [[pattern-pacing-and-tension]] and [[system-status-effects]].
- **Mantle but only onto ledges you placed earlier** (structure) — the player spawns their own grab points (thrown pitons, frozen blocks, a [[mechanic-clone|deployed echo]]), so traversal becomes a two-phase puzzle: author the route, then run it. See [[pattern-emergence]] and [[mechanic-portal]] for the place-then-use loop.
- **Grab but the edge crumbles a beat after you catch it** (constraint) — every hang is a countdown, no ledge is a destination, and mantling is the only escape. Escalates cleanly across a level; see [[pattern-escalation-and-payoff]] and [[system-hazards-and-environment]].

## How it wires to Hayao

Grab is a **state machine** on the player: `airborne → hanging → mantling → grounded`, with the transition into `hanging` driven by a deterministic overlap test between a small sensor above the character and any edge collider. Keep the sensor size and window in tuning constants, not baked into art. For the collision/kinematics scaffolding, read the physics sandbox lab (`sandboxes/physics-lab`) — the grab is just an extra state gated on an edge-overlap query, not a new subsystem. Study the logic/view split in `examples/sokoban/` if you're tempted to entangle the hang *pose* (cosmetic) with the hang *state* (hashed): the pose is view, the state is truth. The pull-up animation is [[pattern-juice-choreography|juice]] layered on top — the sim can teleport the body up in one commit while the view eases it.

## Fails when…

- **The grab is invisible.** No lip highlight, no reach pose — the player can't tell a grabbable edge from a wall, so success feels random. Fix with [[system-telegraphs]] and [[pattern-readability]].
- **Snap radius is too generous.** Grabs fire on jumps the player meant to *clear*, snagging them mid-flow. Auto-grab that overrides intent is an [[antipattern-input-lie]].
- **Mantle is un-cancelable and long.** A committed 20-frame pull-up in a combat or hazard space is a death sentence you can't read your way out of.
- **It papers over bad layout.** If a gap is only clearable *because* the grab is forgiving, you've hidden a spacing bug behind mercy; the [[antipattern-difficulty-cliff]] returns the moment you tighten the window.
- **Hang has no exit pressure and no purpose.** An infinite free hang lets the player idle mid-challenge, deflating [[pattern-mastery-and-flow|flow]] and trivializing timing rooms.

## See also

- [[mechanic-climb]] · the sustained cousin — grab is the catch, climb is the ascent.
- [[mechanic-wall-jump]] · [[mechanic-wall-run]] · vertical-recovery siblings that also convert walls into affordances.
- [[mechanic-grapple]] · [[mechanic-swing]] · reach-the-edge verbs that often *feed into* a mantle.
- [[system-grace]] · [[pattern-anti-frustration]] · the design principles the grab window exists to serve.
- [[system-difficulty-and-dda]] · why snap radius is your cheapest difficulty knob.
- [[genre-precision-platformer]] · [[anchor-celeste]] · the canonical proving ground; verify feel via `docs/FUN.md#2-·-precision-platformer`.

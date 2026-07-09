---
id: mechanic-grow-shrink
title: Grow / Shrink
kind: mechanic
tags: [puzzle, scale, platformer, access]
summary: Change size to change what fits, what reaches, and what crushes — scale as a key.
use-when: A puzzle-platformer wants one verb that gates access by size.
composes-with: [mechanic-gravity-flip, genre-puzzle-platformer, pattern-emergence]
verify-with: design/FUN.md#1-·-grid-puzzle
---

**What it is.** One verb that changes the player's **size**, and with it what they fit through, what they can reach, and what they crush. Scale is the key; the level is the lock.

**Player fantasy / why it's fun.** The same body solves opposite problems — squeeze through the mouse-hole, then loom over the room and shove the boulder. **Transformation** is legible power: you see the answer before you earn it.

## The verb
Press to change **tier** (or hold to scale analog). Big self reaches high ledges, presses plates, crushes brittle floors; small self fits gaps, hides, moves fast. The lock is always the current dimension.

## How it feels / why it's fun
- **Read-before-solve.** A too-small gap or too-high ledge *reads* as "wrong size" — the puzzle statement is visible. See [[pattern-readability]].
- **One verb, two silhouettes.** Distinct posture per tier keeps state unmistakable mid-jump. See [[pattern-juice-choreography]].
- **Reversible.** No penalty for flipping size lets players experiment, not fear. See [[system-grace]], [[pattern-anti-frustration]].

## Tuning levers
| Lever | What it controls | Sane default |
| --- | --- | --- |
| **Tiers** | Discrete steps vs analog dial | 2–3 discrete (small / normal / big) |
| **Transition** | Instant snap vs animated grow | ~0.2s tween, invulnerable during |
| **Mass coupling** | Does big self weigh/crush more? | Big = heavy: cracks brittle floor |
| **Speed coupling** | Does small self move faster? | Small ×1.4 speed, big ×0.7 |
| **Reach coupling** | Jump height / arm span scales with size | Big jumps ~1.5× tile, small ~0.7× |
| **Cost / gate** | Free, cooldown, or resource-metered | Free early; meter for [[system-progression]] |
| **Hazard inversion** | What harms which tier | Spikes hurt big; crushers hurt small |

Keep tiers **few and named** — three legible states beat a mushy dial. Analog only when the fiction demands precision (fitting an exact aperture).

## Slots into
- **Genres:** [[genre-puzzle-platformer]] (its home), [[genre-grid-puzzle]] (discrete tiers = clean [[process-composition]] pieces), [[genre-metroidvania]] (size as a traversal key gating regions), [[genre-precision-platformer]] (reach coupling as a movement stat).
- **Anchors:** [[anchor-braid]] (a single mutating rule reshaping a familiar space), [[anchor-portal]] (spatial key that reads before it's solved), [[anchor-katamari]] (grow-shares-with-the-world literalized), [[anchor-into-the-breach]] (fully readable, reversible state you plan around).

## Twist seams
- **Grow but growing shares mass with the room, shrinking it** (emergence) — your gain is the world's loss: swelling drains a shared scale-budget so the doorway you needed narrows, or the platform under you shrinks out. Turns size into a two-body negotiation. See [[pattern-emergence]], [[system-emergent-systems]].
- **Shrink but tiny-you is fast and giant-you is strong** (risk-reward) — no dominant tier: small dodges and infiltrates but can't hit hard; big bulldozes but is a slow target. Every screen asks which weakness you'll accept. See [[pattern-risk-reward]].
- **Grow but only what you're touching grows** (twist: *transfer*) — the verb scales the object under your hand, not you; the "player" is a size-brush, and the puzzle is choosing what to enlarge. Pairs with [[mechanic-throw]], [[mechanic-stack]].

## How it wires to Hayao
- Size is a scalar on the actor's transform read by the collision extent — start from the physics and camera labs (`sandboxes/physics-lab`, `sandboxes/camera-lab`) to see collider extents and follow-zoom in isolation before coupling them.
- **Discrete tiers are pure state.** Make tier a field of the puzzle state so each configuration is a distinct node — the model of [[genre-grid-puzzle]] in `examples/sokoban/`. Every "does this size fit?" is a deterministic predicate, provable by the solver (see the `verify-with` pointer above).
- **Keep scale cosmetic where it's only view.** The transition tween and squash animate the sprite; the *tier* is logic, the *interpolation* is not — split them so the hash tracks only the solved-relevant value.
- Drive size changes through the same deterministic input path as any verb; never sample wall-clock for the tween.

## Fails when…
- **A dominant tier exists.** If big is always better, the verb collapses to "be big" — see [[antipattern-boring-optimal]]. Force trade: big can't fit, small can't reach.
- **Analog when discrete would do.** A continuous dial with no readable notches makes the lock ambiguous and the fit fiddly — [[antipattern-input-lie]] when a near-fit silently fails.
- **Hazards don't invert.** If both tiers fear the same things, size never *chooses* — you just resize to move, not to decide.
- **The size gate is off-screen.** If the required tier isn't legible from the obstacle, it's [[antipattern-guess-the-designer]]. Show the lock's dimension.
- **Transition is punishing.** Crushing the player mid-grow, or letting a shrink drop them into a now-lethal gap, breaks [[pattern-fairness-and-trust]] — grant i-frames or block the change.

## See also
- Traversal siblings that also re-key a space: [[mechanic-gravity-flip]], [[mechanic-portal]], [[mechanic-teleport]], [[mechanic-clone]].
- Composition & proof: [[process-composition]], [[process-the-twist]], [[system-emergent-systems]].
- Feel & fairness: [[pattern-readability]], [[pattern-risk-reward]], [[system-grace]], [[system-telegraphs]].

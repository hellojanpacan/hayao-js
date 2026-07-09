---
id: mechanic-wall-jump
title: Wall Jump
kind: mechanic
tags: [movement, platformer, vertical, traversal]
summary: Kick off a wall to climb a shaft — turns geometry into a ladder and demands rhythm.
use-when: Vertical traversal needs skill expression against walls, not just floors.
composes-with: [mechanic-wall-run, mechanic-ledge-grab, system-grace]
verify-with: design/FUN.md#2-·-precision-platformer
---

# Wall Jump

**What it is.** Press jump while pressed against a wall to launch **up-and-away** — off the surface, gaining height. Alternate walls in a shaft and you climb a space with no floor. It converts a vertical gap into a **rhythm** the player performs, not a distance they cross.

**Player fantasy / why it's fun.** *"The wall isn't stopping me — it's my next foothold."* The zip up a narrow chimney, the last-second stick before a fall, the descent turned into a controlled scramble. Walls stop being dead ends and become the terrain.

## The verb

Touch a wall while airborne → hold *toward* it (or auto-stick) → press jump. You leave the wall with a fixed **push-off vector**: outward so you clear the surface, upward so you gain. The core dyad is *cling, then kick* — the wall is a beat, not a rest.

## How it feels / why it's fun

- **Momentum you author.** Unlike a ledge grab that parks you, the wall jump keeps you moving — height is earned in a continuous scramble, never a pause.
- **Rhythm under pressure.** Alternating a shaft is a metronome; miss the beat and you fall. That cadence is where mastery lives ([[pattern-mastery-and-flow]]).
- **Recovery, not just ascent.** A mistimed jump can still be saved by catching a wall — grace on the way down feels generous and skillful at once ([[system-grace]]).
- **The read is the skill.** Which wall is climbable, from which side, at what angle — legible walls turn a fall into a plan ([[pattern-readability]]).

## Tuning levers

| Lever | What it changes | Sane default |
|---|---|---|
| **Push-off X** | Horizontal launch off the wall | ~0.7–1.0× run speed |
| **Push-off Y** | Height gained per kick | ~0.85× a floor jump |
| **Wall-stick time** | Frames you cling before sliding | 6–10 frames (a beat to react) |
| **Wall-slide speed** | Fall speed while clinging | ~40% of terminal velocity |
| **Wall coyote** | Frames after leaving a wall you can still kick | 4–6 frames |
| **Input lockout** | Frames after kick before you re-steer toward the wall | 8–12 frames (stops instant re-cling) |
| **Same-wall cooldown** | Can you re-kick the wall you just left? | No, until you touch a different surface |

The **input lockout** is the anti-cheese lever: without it, holding *into* the wall lets a player mash jump and levitate up one surface — an [[antipattern-input-lie]] where the geometry implies a limit the code doesn't enforce. Lock out re-steer for a few frames so each kick commits to leaving.

**Infinite-climb prevention** is a design decision, not just a bug fix: either the input lockout (you drift away before you can re-cling), a same-wall cooldown (a kicked wall is inert until you touch another), or a per-kick vertical decay (each same-wall kick gains less). Pick one and make it *visible* — a scuff mark, a fading grip — so the limit reads as rule, not glitch.

## Slots into (genres + anchors)

- **[[genre-precision-platformer]]** — the home genre. Celeste ([[anchor-celeste]]) makes the wall-slide + climb the spine of its movement and its skill ceiling.
- **[[genre-metroidvania]]** — as a gated traversal unlock ([[system-progression]]): the shaft you saw hour one, climbable hour three. Pairs with [[mechanic-double-jump]] and [[mechanic-dash]].
- **[[genre-puzzle-platformer]]** — walls as a spatial resource to ration (see the crumble twist below).
- **[[genre-action-adventure]]** — Dead Cells ([[anchor-dead-cells]]) folds wall-cling into fast combat traversal.

Composes tightly with [[mechanic-wall-run]] (horizontal sibling), [[mechanic-ledge-grab]] (the resting counterpart), and [[mechanic-glide]] (descend the height you climbed).

## Twist seams

- **Wall jump but each wall can only be kicked once** *(constraint)* — a wall spends on contact and goes inert (grip mark, color flip). A shaft becomes a **route puzzle**: order and reach matter, backtracking is denied. Turns free traversal into a [[genre-grid-puzzle]]-flavored plan against [[mechanic-double-jump]] for recovery.
- **Wall jump but the wall crumbles behind you** *(structure)* — the kicked surface breaks a beat later, removing the return path. Forces continuous forward rhythm and one-way ascent; a fall means a full restart of the shaft. Escalates tension the higher you climb ([[pattern-pacing-and-tension]]).
- **Wall jump but the walls are moving** *(scale)* — sliding or rotating surfaces make the *timing* of the kick the whole challenge, not the aim. The metronome now has a moving beat.

## How it wires to Hayao

- **Collision + input** are engine-generic: detect a wall contact on the airborne body, read the jump press, apply the push-off vector. The scene tree holds the walls; the body's velocity is what you set on kick.
- **Wall-stick, coyote, and lockout are frame counters** on the player state — count in fixed sim ticks so behavior is deterministic and replayable; never wall-clock time.
- **Feel first in isolation.** Prototype the push-off vector, stick-time, and lockout in a single-mechanic lab before wiring it into a level — see the platformer movement material in `sandboxes/` and the logic/view split in `examples/sokoban/`. Tune in a lab, then port.
- **Climbable walls need a readable tag** in the level data — a surface property the level author sets, and the view renders distinctly (a texture, an edge highlight). Don't infer climbability from geometry; author it, so the rule and the picture always agree.

## Fails when…

- **Infinite climb leaks.** No lockout/cooldown → hold-into-wall + mash = free flight. The mechanic loses all its rhythm and cost.
- **Climbable walls aren't legible.** The player can't tell a foothold from décor, so every shaft is trial-and-death — an [[antipattern-input-lie]] of the eyes ([[pattern-readability]]).
- **No grace on the cling.** Zero wall-coyote and a tight stick window makes correct inputs feel dropped ([[system-grace]]); the fall reads as the game's fault, not the player's.
- **Push-off fights the camera.** Launch away from a wall the camera hasn't shown yet and the player leaps blind — pair the vector with lead room in the view.
- **It's the only verb.** A whole game of shafts is monotone; wall jump shines as *one* tool in a movement kit ([[system-mastery-curve]]), not the entire kit — beware [[antipattern-content-desert]].

## See also

- [[mechanic-wall-run]] · [[mechanic-ledge-grab]] · [[mechanic-double-jump]] · [[mechanic-dash]] · [[mechanic-glide]] — the movement neighbors.
- [[system-grace]] · [[pattern-readability]] · [[pattern-mastery-and-flow]] — the feel it depends on.
- [[genre-precision-platformer]] · [[anchor-celeste]] · [[anchor-dead-cells]] — where to study it live.
- Prove push-off, coyote, and infinite-climb bounds against the precision-platformer targets in `design/FUN.md#2-·-precision-platformer`.

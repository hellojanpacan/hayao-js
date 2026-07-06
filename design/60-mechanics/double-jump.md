---
id: mechanic-double-jump
title: Double Jump
kind: mechanic
tags: [movement, platformer, air-control, traversal]
summary: A second airborne impulse — the forgiveness verb that turns one commitment into two decisions.
use-when: A platformer needs air agency and a recovery beat without full flight.
composes-with: [mechanic-wall-jump, mechanic-glide, system-grace]
verify-with: docs/FUN.md#2-·-precision-platformer
---

**What it is.** A second jump the player triggers mid-air, after the first has already committed them to an arc. One button, two impulses, one refill rule.

**Player fantasy / why it's fun.** The apex is no longer a verdict. You leap, misjudge, and *save it* — the double jump converts a botched commitment into a mid-flight negotiation. It reads as competence you didn't have to earn twice.

## The verb
Press jump while airborne to spend a second impulse, resetting vertical velocity to a new upward burst. The whole design lives in **when the charge refills**.

## How it feels / why it's fun
- **Recovery.** The first jump is a bet; the second is the hedge. This is the single largest reduction in perceived difficulty you can add without touching level geometry — see [[pattern-anti-frustration]] and [[system-grace]].
- **Expression.** Two impulses = a small vocabulary. Players route their own lines (early-double for distance, late-double for a stall-and-drop) — the seed of a [[pattern-mastery-and-flow]] curve.
- **Legibility tax.** Every extra air action is a thing the player must *feel* they still have. If the charge state isn't obvious, air control becomes a guess — an [[antipattern-input-lie]].

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| **Refill trigger** | When the second charge returns | On ground contact only |
| **Height ratio (jump 2 / jump 1)** | Whether the second is a save or a boost | 0.75× (a recovery, not a repeat) |
| **Velocity reset** | Additive vs. overwrite of vertical speed | Overwrite (predictable apex) |
| **Air control after 2** | Horizontal steer post-second-jump | Full, unchanged |
| **Buffer / coyote** | Late/early presses that still fire | ~5 frames each |
| **Charge count** | How many air jumps total | 1 (double), rarely 2+ |
| **Directional bias** | Does jump 2 kill or keep horizontal momentum | Keep momentum |

**Refill rule is the whole game.** Ground-only refill keeps tension: you *have* two, never three. Wall-refill (as in [[anchor-celeste]]'s dash economy) turns walls into gas stations and rewards route knowledge. Pickup-refill (floating charge orbs) makes the double jump a *level resource*, not a stat — now the designer places tension deliberately.

## Height ratio: the tension dial
- **1.0× (equal jumps)** reads as "you can basically fly a little." Generous, floaty, forgiving. Good for cozy or exploratory traversal.
- **0.6–0.8× (shorter second)** reads as a *save*: enough to clear a lip you undershot, not enough to trivialize a gap. This is the precision-platformer default.
- **>1.0× (bigger second)** teaches players to *deliberately* waste jump 1 to load jump 2 — a nice twist, a bad accident. Only ship it if it's the point.

## Slots into
- [[genre-precision-platformer]] — the canonical home; pairs with tight [[system-camera-and-controls]] and a merciless [[system-save-and-checkpoint]].
- [[genre-metroidvania]] — a classic gated traversal upgrade; withholding the double jump *is* the map lock (Metroid, Hollow Knight's Monarch Wings).
- [[genre-puzzle-platformer]] — when refill is a placed resource, the jump becomes a spatial puzzle piece.
- [[genre-physics-arcade]] and [[genre-action-adventure]] — air agency without full flight.
- Anchors: [[anchor-celeste]], [[anchor-dead-cells]], [[anchor-spelunky]] (the cape/climbing gloves as air-agency cousins), [[anchor-braid]] (jump-on-enemy chaining).

## Twist seams
- **Double jump but the second one costs a held resource** (constraint). Jump 2 drains a stamina/mana/heat bar you also spend on other verbs. Now every save is a budget decision, and the [[system-economy]] reaches into your traversal — see [[pattern-risk-reward]].
- **Double jump but jump 2 is a downward stomp, not an up** (mechanic-swap). The second press slams you earthward — offense and fall-control fused into one air option. This is [[mechanic-ground-pound]] wearing the double jump's slot; it inverts the recovery fantasy into a commitment.
- **Double jump but the second refills only on hitting an enemy** (constraint). Air chains become mandatory combat lines à la [[anchor-nuclear-throne]] aggression loops — the floor is lava and mobs are the only refuel.

## How it wires to Hayao
- The double jump is a **state machine on an air-charge counter**: grounded → set charge; airborne + press + charge>0 → apply impulse, decrement. Keep the counter in sim state so it lands in the world hash; render the "have a charge" tell as a [[pattern-readability]] cue.
- Read the platformer motion lab / `sandboxes/` movement lab for jump-arc math, coyote time, and input buffering in isolation — don't reinvent apex tuning inside a full game.
- The gated-upgrade version (metroidvania) is progression, not physics: model the unlock as a flag in your [[system-progression]] / worldgraph, provable like any other lock.
- Feel and forgiveness are proven downstream — the frontmatter's `verify-with` (docs/FUN.md precision-platformer) and Channel-4 feel gates own that. Design the rule here; prove the arc there.

## Fails when…
- **Charge state is invisible.** Player can't tell if they have the second jump → every air moment is a coin flip. Fix with an unmissable tell (sprite state, dust puff, meter) — [[pattern-readability]].
- **It erases the level.** If jump 2 clears everything jump 1 was designed to gate, your platforming collapses into hold-right — an [[antipattern-boring-optimal]]. Geometry must assume the second jump exists.
- **Refill is too generous.** Air-refill with no cost = flight. If you wanted flight, ship [[mechanic-glide]] or a [[mechanic-swing]], not an infinite ladder.
- **The second is a strict repeat of the first.** Two identical impulses add reach but no decision. Differentiate via height ratio, stomp-swap, or a cost.
- **Buffer/coyote missing.** Frame-perfect double jumps read as an [[antipattern-input-lie]]; the player pressed, the game shrugged.

## See also
- Air-agency siblings: [[mechanic-wall-jump]], [[mechanic-dash]], [[mechanic-glide]], [[mechanic-wall-run]], [[mechanic-ledge-grab]], [[mechanic-bounce]], [[mechanic-gravity-flip]].
- Swap target for the stomp twist: [[mechanic-ground-pound]].
- Forgiveness + tuning: [[system-grace]], [[pattern-anti-frustration]], [[pattern-mastery-and-flow]], [[system-mastery-curve]].
- Where it lives: [[genre-precision-platformer]], [[genre-metroidvania]], [[system-camera-and-controls]].

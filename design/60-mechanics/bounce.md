---
id: mechanic-bounce
title: Bounce / Pogo
kind: mechanic
tags: [platformer, momentum, combat, chain]
summary: Rebound off surfaces or enemies — turns hazards into trampolines and demands you keep the chain alive.
use-when: A platformer wants aerial chaining and enemies-as-terrain.
composes-with: [mechanic-ground-pound, mechanic-double-jump, pattern-mastery-and-flow]
verify-with: design/FUN.md#19-·-physics-arcade
---

**What it is.** A downward or lateral hit that **rebounds** you off the thing you struck — a spring, a spike, an enemy's head. Land on it, launch off it, never touch ground.

**Player fantasy / why it's fun.** You're airborne and you *stay* airborne. Every threat below becomes a stepping stone; the floor is failure. The **chain** is the fantasy — one clean pogo is fine, twelve in a row is virtuosity.

## The verb

You **strike-and-launch**: a jump-timed or attack-timed input that, on contact, sends you back the way you came with reset air control. The player converts a collision into a **restitution** vector instead of a stop.

## How it feels / why it's fun

- The moment of **contact** is the whole feel — a hitstop pinch, a chunky sound, a launch that reads as *earned*. See [[pattern-juice-choreography]] for the choreography of that pinch.
- **Chaining** is a self-set difficulty knob. The floor punishes greed; the greedy player learns the rhythm anyway. This is [[pattern-mastery-and-flow]] made physical.
- Reading the arc *before* you commit is the skill. Enemies become terrain you plan across — [[system-telegraphs]] and [[pattern-readability]] decide whether that plan is fair.
- Height escalation is the **reward schedule**: each successful bounce grants a taller apex, so the chain visibly climbs. Payoff you can see. See [[system-reward-schedules]].

## Tuning levers

| Lever | What it does | Sane default |
|---|---|---|
| **Restitution** | Fraction of impact speed returned on bounce | 0.85–1.0 (spring), 0.7 (enemy head) |
| **Bounce apex** | Fixed launch height vs. momentum-scaled | Fixed for pogo, scaled for springs |
| **Chain bonus** | Extra height/speed per consecutive bounce | +8% apex, cap at 5th bounce |
| **Input window** | Timing tolerance to convert contact to bounce | 5–7 frames pre-contact buffer |
| **Air control** | Steering authority mid-arc | Reset to full on each bounce |
| **Miss penalty** | Cost of a whiffed pogo | Land normally; no death unless a hazard is below |
| **Bounce cooldown** | Frames before another bounce registers | 0 (chaining), 4–6 (deliberate) |

Keep the input window generous — buffer the intent, not the frame. A dropped chain should feel like *your* read was wrong, never that the game ate the input (see [[antipattern-input-lie]]).

## Slots into

- **Genres:** [[genre-precision-platformer]], [[genre-puzzle-platformer]], [[genre-metroidvania]], [[genre-action-adventure]], [[genre-physics-arcade]].
- **Anchors:** [[anchor-celeste]] (springs as chained lift), [[anchor-cuphead]] (the pink-parry pogo as a rhythm layer), [[anchor-hades]] and [[anchor-dead-cells]] (downward strikes that pop enemies). [[anchor-spelunky]] treats the whip/jump-on-head as improvised terrain.

## Twist seams

- **Bounce but every bounce raises the floor beneath you** (structure). The tiles you launch off rise into place — you're building the level upward as you chain, so a dropped chain strands you on the platform you just made. Pairs with [[system-progression]] and [[mechanic-stack]].
- **Pogo but the ground is lava that rises** (constraint). The floor is death and it's climbing. Bouncing isn't optional style, it's survival tempo — miss a beat and the rising hazard catches you. See [[system-hazards-and-environment]] and [[pattern-pacing-and-tension]].
- **Bounce but each surface has a different restitution** (system). Springs fling, mud absorbs, enemies pop soft — the player reads the *material* to plan the arc. Emergent routing from a small material vocabulary; see [[pattern-emergence]].

## How it wires to Hayao

- Bounce is a **restitution collision**: on contact you flip and scale the velocity component along the surface normal. Keep the impulse in the sim (part of `world.hash()`), not the view. Study the physics/arcade lab under `sandboxes/` for how a deterministic step resolves a rebound the same way every frame — the chain must replay identically for [[process-core-loop]] to hold.
- The **chain counter** is pure state: a monotonic integer reset on ground-contact, incremented on bounce, drives the apex bonus. Machine-checkable, no floats in the win condition.
- Feed all launch variance through the deterministic RNG if you want jitter; never `Math.random`. The bounce *feel* (hitstop, squash) is cosmetic — mark those view nodes so they stay out of the hash.

## Fails when…

- **The floor isn't a threat.** With no cost to landing, chaining is decoration, not a decision. Give the ground *some* stakes — a reset, a hazard, a lost combo — or the mechanic is [[antipattern-false-depth]].
- **Contact is unreadable.** If the player can't tell a bounceable surface from a lethal one before committing, every death feels stolen. This is [[antipattern-guess-the-designer]]; fix with [[pattern-readability]] and [[system-telegraphs]].
- **The window is too tight.** Frame-perfect pogo with no buffer reads as [[antipattern-input-lie]] and kills flow.
- **Height escalation has no ceiling.** Uncapped chain bonus lets one loop trivialize a level — the classic [[antipattern-boring-optimal]]. Cap the ramp or gate it on new inputs.
- **Bounce is the only verb.** A pure pogo game exhausts its idea fast; compose it with a second layer (attack, dash) or it's a [[antipattern-content-desert]].

## See also

- Composes with: [[mechanic-ground-pound]] (the natural downward strike), [[mechanic-double-jump]] (recovery when the chain drops), [[mechanic-dash]] (horizontal reposition mid-arc), [[mechanic-wall-jump]] (keep the chain going off geometry).
- Contrast: [[mechanic-parry]] and [[mechanic-deflect]] — same read-and-commit timing, but the reward is a counter, not lift.
- Frame it with: [[pattern-risk-reward]] (greed vs. safety on every bounce), [[system-mastery-curve]] (how the chain teaches itself), [[process-the-twist]] (which seam above makes it *yours*).

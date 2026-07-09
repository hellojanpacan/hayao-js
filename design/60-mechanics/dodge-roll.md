---
id: mechanic-dodge-roll
title: Dodge Roll
kind: mechanic
tags: [combat, i-frames, defense, timing]
summary: A rolling evade with invulnerability frames — the get-out verb whose recovery is the honest cost.
use-when: Action combat wants a reactive escape gated by commitment.
composes-with: [mechanic-dash, system-grace, mechanic-parry]
anchors: [anchor-dark-souls]
verify-with: design/FUN.md#4-·-action-adventure
---

**What it is.** A short, committed lunge along the ground that grants **invulnerability frames** through the incoming hit, then locks you in a **recovery** you can't cancel. The i-frame window is the reward; the recovery is the price.

**Player fantasy / why it's fun.** You read the wind-up, roll *into* the blade, and the strike passes through you — mastery expressed as nerve. The pleasure is in the near-miss, not the retreat.

## The verb
Tap a button → a fixed-length roll fires in the aim/stick direction, immune for part of its length, spendable only when **stamina** allows.

## How it feels / why it's fun
- **Commitment, not safety.** Unlike a free step, the roll *takes time* you don't own. The animation is a decision you can't retract — that's what makes a good read feel earned.
- **The window is the skill.** I-frames covering only frames 5–15 of a 30-frame roll means panic-rolling early gets you clipped. Reactivity is trained by punishing the wrong rhythm, not the wrong direction.
- **Stamina turns defense into a resource.** A whiffed roll spent your last bar — now the follow-up lands. This is [[pattern-risk-reward]] on a two-second clock.

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| **I-frame window** | Which frames of the roll are immune | frames 5–15 of 30 (≈0.17–0.5s at 60fps) |
| **Animation length** | Total commitment / recovery tail | 30 frames; ~12-frame vulnerable tail |
| **Roll distance** | Repositioning vs pure evade | 2–3 body-widths |
| **Stamina cost** | Rolls before exhaustion | 20–25% of bar; ~1.5s full regen |
| **Cancel points** | Can attack/roll interrupt recovery? | recovery locked; attack cancels only after tail |
| **Directional lock** | Steer mid-roll or fixed vector? | fixed at commit (readable, punishable) |
| **Equip-load scaling** | Weight slows roll / shrinks window | optional; the Souls "fat roll" knob |

Read the levers as a pair: a *long* animation with a *wide* window is forgiving (Bloodborne); a *short* animation with a *narrow* window is exacting (Sekiro-adjacent). Move them together, never one in isolation. See [[system-difficulty-and-dda]] for scaling the window by tier instead of the enemy.

## Slots into
- [[genre-soulslike]] — the canonical home; [[anchor-dark-souls]] made recovery the tax.
- [[genre-action-adventure]] and [[genre-metroidvania]] — [[anchor-hades]], [[anchor-dead-cells]] fold the roll into fast offense.
- [[genre-bullet-hell]] and [[genre-horde-survival]] — the roll is a spatial reset against pattern walls.
- [[genre-roguelike]] — pairs with [[system-build-diversity]]: relics that widen the window or refund stamina redefine the verb per run.

## Twist seams
- **Roll but it has no i-frames — only positioning saves you** *(constraint)*. Strip immunity entirely; the roll is pure displacement. Now spacing, not timing, is the whole game. Enemy hitboxes and your footwork carry the tension — closer to a fighting game's walk-back than a Souls roll. Forces honest [[system-telegraphs]] because there's no cheat past a bad read.
- **Dodge but a perfect one slows time for everyone else** *(mechanic-swap)*. A last-frame evade triggers a bullet-time punish window — the Bayonetta "Witch Time" move. The verb flips from *escape* to *invitation*: you bait attacks to farm the slowdown. Retunes the whole loop around greed, not survival. See [[mechanic-time-stop]].
- **Roll but stamina is shared with your attacks** *(constraint)*. One pool feeds offense and defense, so every dodge is a swing you didn't take. Turns the fight into a budget, tightening [[pattern-pacing-and-tension]].

## How it wires to Hayao
- The roll is a **state machine** over frames — `windup → iframe → recovery` — so immunity is a flag checked in collision, not a physics trick. Keep the flag and the stamina counter in simulation state so replays and the solver see identical outcomes.
- All timing lives in **fixed-step frames**, never wall-clock, so the i-frame window is deterministic; the tuning table above is just data. See the physics and hitbox handling in `sandboxes/physics-lab`, and character-controller patterns there too.
- The evade animation and any dust/afterimage are **cosmetic** — they read the sim's roll state but never feed `hash()`. The immunity itself is simulation truth.
- Directional input resolves once at commit; store the vector so mid-roll steering (if enabled) stays a single, replayable decision.

## Fails when…
- **Recovery is free.** Cancel-anything rolls delete the cost, and spam becomes optimal — [[antipattern-boring-optimal]]. If rolling forever beats reading the fight, you built a treadmill.
- **The window is invisible.** Players can't learn a rhythm they can't perceive; feed feedback ([[pattern-readability]], [[pattern-juice-choreography]]) on the immune frames or the mechanic feels like [[antipattern-guess-the-designer]].
- **Every enemy is roll-immune-checkable the same way.** One dodge answers all attacks → [[antipattern-false-depth]]. Mix in unrollable grabs, tracking swings, and delayed strikes so the verb has counters ([[system-counter-systems]], [[system-enemy-archetypes]]).
- **Stamina never bites.** If the bar refills faster than you can spend it, defense is unlimited and the [[pattern-risk-reward]] loop is dead.
- **The roll input lies.** Buffered too loosely or dropped under load → the strike you *saw* dodged still lands: [[antipattern-input-lie]]. The immune frames must map to the input the player felt.

## See also
[[mechanic-dash]] · [[mechanic-parry]] · [[mechanic-deflect]] · [[mechanic-block]] · [[mechanic-lock-on]] · [[system-grace]] · [[system-combat-model]] · [[system-boss-design]] · [[system-telegraphs]] · [[pattern-fairness-and-trust]] · [[pattern-mastery-and-flow]] · [[anchor-hades]] · [[anchor-cuphead]]

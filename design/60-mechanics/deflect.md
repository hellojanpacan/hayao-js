---
id: mechanic-deflect
title: Deflect / Reflect
kind: mechanic
tags: [combat, projectile, defense, bullet]
summary: Bat a projectile back at its sender — turns incoming danger into your ammo.
use-when: Ranged threat should be answerable with timing, not just dodging.
composes-with: [mechanic-parry, genre-bullet-hell, system-telegraphs]
verify-with: docs/FUN.md#7-·-bullet-hell
---

**What it is.** A timed input that flips a projectile's ownership and heading — the shot that was about to hit you now carries *your* damage tag back toward whoever fired it. Deflect is a [[mechanic-parry]] whose payload is a bullet, not a blade.

**Player fantasy / why it's fun.** The screen full of danger becomes a screen full of loaded guns. Every incoming shot is a question with a rhythmic answer, and the answer is *offense*. You feel calm inside chaos — the pull is turning fear into supply.

## The verb
Press deflect inside a short active window as a projectile enters your hit-zone; it reverses heading, changes team, and (usually) gains a speed or damage bonus. No window, no reflect — it's read-and-time, not hold.

## How it feels / why it's fun
- **Legibility of danger flips.** A telegraphed shot stops being a thing to flee and becomes a thing to *catch*. See [[system-telegraphs]], [[pattern-readability]].
- **Rhythm under pressure.** Deflect turns [[genre-bullet-hell]] density into a metronome — pure [[pattern-mastery-and-flow]].
- **Ownership as reward.** The dopamine is watching your enemy eat their own shot. It closes a [[pattern-feedback-loops]] tight loop in one input.

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| **Active window** | Frames the input reflects | 6–8 frames (~120ms) |
| **Aim mode** | Where the reflected shot goes | Auto-lock to nearest hostile |
| **Speed multiplier** | Return velocity vs incoming | 1.5× |
| **Damage owner** | Whose damage the shot carries | Player (full), or shared |
| **Whiff cost** | Punish for a missed press | None → small recovery lag |
| **Reflectable set** | Which projectiles qualify | Flag per bullet; boss orbs opt-in |
| **Cooldown** | Gap between deflects | 0 (spammable) → gated |

Two ships in the aim mode: **auto-lock** (accessible, [[system-accessibility]]) reads as skill because *timing* is the challenge; **manual angle** (deflect on a directional stick) makes placement the skill and rewards [[system-mastery-curve]] depth. Pick one and commit — mixing them muddies the read.

## Damage ownership — the load-bearing decision
The reflected shot's **team** and **damage number** are the whole design.
- *Player-owned, full damage* → deflect is your primary DPS; enemies exist to feed you. (Boss-rush energy.)
- *Player-owned, reduced* → deflect is a tempo tool, not a win button.
- *Neutralized (no damage, just gone)* → deflect is defense only; keeps it a survival verb, not an economy. See [[system-resource-loops]].
State the rule once and telegraph it — an [[antipattern-input-lie]] here (looks reflected, deals nothing) rots trust fast; see [[pattern-fairness-and-trust]].

## Slots into
- **Genres:** [[genre-bullet-hell]], [[genre-soulslike]], [[genre-fighting-game]], [[genre-action-adventure]], [[genre-horde-survival]], [[genre-physics-arcade]].
- **Anchors:** [[anchor-cuphead]] (parry-pink taught a generation to slap projectiles), [[anchor-nuclear-throne]] and [[anchor-vampire-survivors]] (bullet density that *wants* an answer), [[anchor-peggle]] for the satisfaction of a ricochet.

## Twist seams
- **Deflect but reflected shots multiply** (risk-reward) — one deflect splits into three fan-out returns, but the split-shots can *also* be re-fired by enemies, escalating the board. Greed vs. survival, live. See [[pattern-risk-reward]], [[system-difficulty-and-dda]].
- **Deflect but only the last shot you dodged is reflectable** (constraint) — you can't reflect anything; you have to *dodge* a bullet first to arm it, then reflect the memory of it. Couples deflect to [[mechanic-dodge-roll]] and makes evasion the setup, not the escape. See [[pattern-mastery-and-flow]].
- **Deflect but the return is a projectile you don't control** (chaos) — reflected shots home on the nearest *anything*, including you. Reframes deflect as [[pattern-emergence]] you steer by positioning, not aiming.

## How it wires to Hayao
- **Bullets** are pooled entities in the scene tree; a deflect flips two fields — a heading vector and a team/owner tag — on the projectile under the input window. Keep the flip a pure state transition so it lands in `world.hash()`.
- **The timing window** reads from a deterministic frame clock, never wall time; the reflect result must be identical for the same input frame on replay. All spawn/spread angles go through the deterministic RNG, never `Math.random`.
- Study projectile spawning, pooling, and collision in the **projectile/bullet sandbox lab** before wiring reflection; study the input-window read against a telegraph in the relevant timing lab. The reflected shot is *view-agnostic* — the ricochet flash and hit-spark are `cosmetic`; the damage and heading are sim.

## Fails when…
- **The window is invisible.** No telegraph on the incoming shot and no tell on your active frames → it feels like [[antipattern-rng-frustration]], not skill. Deflect demands [[system-telegraphs]].
- **Everything is reflectable.** If every bullet qualifies with auto-aim and full damage, the optimal play is *mash deflect* — [[antipattern-boring-optimal]]. Gate the reflectable set or the aim.
- **Reflect trivializes bosses.** Full player-owned damage + a boss that only shoots = the fight solves itself; see [[system-boss-design]]. Give bosses melee phases or unreflectable attacks.
- **Ownership is a lie.** Visuals say reflected, sim says nothing happened — [[antipattern-input-lie]].
- **It replaces dodging entirely.** If deflect is strictly better than moving, you've deleted [[mechanic-dodge-roll]] and the spatial game with it. Keep some threats un-deflectable.

## See also
- Siblings: [[mechanic-parry]], [[mechanic-block]], [[mechanic-dodge-roll]], [[mechanic-bounce]], [[mechanic-throw]].
- Systems: [[system-telegraphs]], [[system-counter-systems]], [[system-combat-model]], [[system-boss-design]], [[system-status-effects]].
- Patterns: [[pattern-risk-reward]], [[pattern-readability]], [[pattern-fairness-and-trust]], [[pattern-mastery-and-flow]].
- Recipe: [[recipe-one-button-boss-rush]] — deflect is a natural one-button verb.
- Prove the feel with `docs/FUN.md#7-·-bullet-hell`; judge the ricochet read with `docs/JUDGE.md`.

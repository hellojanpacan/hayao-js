---
id: mechanic-time-stop
title: Time Stop / Slow
kind: mechanic
tags: [time, combat, puzzle, control]
summary: Freeze or slow the world while you act — bullet-time as a spendable resource.
use-when: You want reaction relief, planning windows, or a power fantasy of control.
composes-with: [mechanic-rewind, system-telegraphs, pattern-pacing-and-tension]
verify-with: design/JUICE.md
---

**What it is.** Bend the world's clock: freeze everything or drag it to a crawl while you keep acting near-normal speed. The gap between your clock and theirs is the whole mechanic.

**Player fantasy / why it's fun.** The moment of overwhelm — bullets inbound, three enemies mid-lunge — inverts into a moment of authorship. You stop being reactive and become the only mover in a still room. Mastery is spending the window, not just surviving it.

## The verb

Trigger the slow; act inside the stolen window; watch the world resume and pay for what you spent. One button, but the depth is in *what a frozen frame lets you do that a live one won't*.

## How it feels / why it's fun

- **Relief → agency.** Panic converts to a plan. The best time-stop makes you feel smart, not safe.
- **Legibility.** A frozen frame is a readable frame. Trajectories you couldn't parse at speed become a solvable board — see [[pattern-readability]].
- **Punctuation.** Slow-mo is the exclamation point of a fight. Reserve it and the finisher lands harder — see [[pattern-juice-choreography]].
- **The tell.** The activation cue (desaturation, a chime, a chromatic shudder) is half the pleasure. Make entering the window feel like a held breath.

## Tuning levers

| Lever | What it controls | Sane default |
| --- | --- | --- |
| **Stop vs slow** | Hard freeze (planning) vs time-scale drag (still-live combat) | 0.15× slow for combat; hard 0 for puzzle |
| **You move too?** | Do you act at full speed, slowed, or also frozen | Player at ~0.9×, world at 0.15× |
| **Meter cost** | Duration you can afford per activation | 3s bank, drains only while active |
| **Refill source** | Time on cooldown / hits landed / pickups / rhythm | Kills + slow trickle |
| **Cooldown floor** | Minimum gap between casts | 2–4s; prevents perma-uptime |
| **What ignores it** | Bosses, hazards, or scripted beats that keep ticking | 1–2 threats stay live |
| **Ramp curve** | Enter/exit blend time | 120ms in, 200ms out |

Default failure mode is *too generous*. Start stingy; a 2-second window that the player rations beats a 6-second one they spam. See [[system-resource-loops]] and [[system-difficulty-and-dda]].

## Slots into

- **Genres:** [[genre-bullet-hell]] (reaction relief), [[genre-action-adventure]] and [[genre-immersive-sim]] (Dishonored's Bend Time — [[anchor-dishonored]]), [[genre-grid-puzzle]] and [[genre-puzzle-platformer]] (Braid's frozen-object logic — [[anchor-braid]]), [[genre-precision-platformer]], [[genre-tactics]] (the pause-plan-resume of [[anchor-into-the-breach]] is stop taken to its structural limit).
- **Anchors:** [[anchor-into-the-breach]], [[anchor-dishonored]], [[anchor-braid]], [[anchor-celeste]] (assist-mode slow as [[system-grace]]).

## Twist seams

- **Time stop but you can only act on what you can see frozen** *(constraint)* — line of sight is the leash. Enemies behind cover keep their momentum; the freeze is a lens, not a god-mode. Turns it into a positioning problem and pairs with [[genre-stealth]].
- **Slow-mo but it also slows your own inputs** *(risk-reward)* — the window is symmetric. You gain time to *read* but not to *out-speed*; aiming and turning drag too, so you trade reaction for precision. See [[pattern-risk-reward]].
- **Stop but the meter is the boss's patience** *(inversion)* — every frozen second is banked against you; the world resumes angrier. Spend recklessly and you've built the difficulty spike yourself — [[system-boss-design]].

## How it wires to Hayao

Time control is a **time-scale** problem, not an animation trick: multiply the sim's per-tick delta for the world while keeping the player's near 1.0, and keep it deterministic (all pacing derived from the fixed step, never wall-clock). Study the pause/time-scale seam in `sandboxes/juice-lab` for how eased scalars ramp without snapping, and `sandboxes/particle-workshop` for the desaturate-and-trail activation look. Keep the freeze **cosmetic where it's only a look** (vignette, chroma shift) so it stays out of `world.hash()` — the mechanical truth is the single scalar. For turn-based stop (plan, then commit), the frozen board is literally a `Puzzle<State, Move>` snapshot; the resume is one applied move sequence — see [[anchor-into-the-breach]] and the solver discipline in `examples/sokoban`.

## Fails when…

- **It trivializes threat.** If the optimal play is "always cast, then act unopposed," you've deleted the fight. Gate uptime hard; let 1–2 threats ignore it. See [[antipattern-boring-optimal]] and [[system-counter-systems]].
- **It's free.** No cost means no decision. Bind it to a scarce meter or a real cooldown or it's just a slower game — [[antipattern-fake-choice]].
- **The window is dead air.** If nothing interesting is *doable* in the freeze, it's a loading screen. Every stop must open an action the live frame denied.
- **The camera lies.** Enter/exit with no telegraph and players won't feel the gift. Cue it loud — [[system-telegraphs]], [[antipattern-unreadable-juice]].
- **It desyncs.** Any wall-clock reference in the slow logic breaks determinism and replay. Route everything through the fixed step.
- **It never escalates.** Same window, same threats, forever — the power fantasy goes stale. Ramp what stays live, or shrink the meter, over the run. See [[pattern-escalation-and-payoff]].

## See also

[[mechanic-rewind]] · [[mechanic-teleport]] · [[mechanic-dodge-roll]] · [[mechanic-parry]] · [[system-telegraphs]] · [[system-grace]] · [[pattern-pacing-and-tension]] · [[pattern-risk-reward]] · [[pattern-juice-choreography]] · [[system-difficulty-and-dda]]

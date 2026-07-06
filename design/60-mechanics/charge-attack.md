---
id: mechanic-charge-attack
title: Charge & Release
kind: mechanic
tags: [combat, commitment, timing, risk]
summary: Hold to build power, release to spend it — a visible commitment the enemy can read too.
use-when: You want a risk/reward beat where power costs exposure.
composes-with: [mechanic-ground-pound, pattern-risk-reward, system-telegraphs]
verify-with: docs/JUICE.md
---

**What it is.** Hold an input to accumulate power over time; release to spend it in one committed strike. The hold is public — a windup the world can see, so the enemy gets to react before you land.

**Player fantasy / why it's fun.** The slow-burn threat. You feel the shot getting heavier under your thumb, and every extra frame of charge is a bet: more damage, more exposure. Peak charge is a dare thrown at the whole room.

**The verb.** Press-and-hold to wind up, release to fire — the longer the hold, the bigger the payload and the deeper the commitment.

**How it feels / why it's fun.**
- **Tension you author yourself.** Unlike a cooldown, the timer is your finger. You choose how far to lean over the ledge before you jump.
- **A body you can't hide.** Charging is a **telegraph** — glow, hum, tremble. The enemy reads it as clearly as you do, which turns a damage move into a mind game. See [[system-telegraphs]], [[pattern-readability]].
- **The release is the payoff.** All that stored tension discharges in one frame of screen-shake and light. This is textbook [[pattern-juice-choreography]] — anticipation, then impact.

**Tuning levers.**

| Lever | What it controls | Sane default | Push it up → | Push it down → |
|---|---|---|---|---|
| Charge time to full | Seconds of hold for peak | 0.9 s | Ponderous, high-stakes swings | Spammy, charge stops mattering |
| Tier count | Discrete power breakpoints | 3 (tap / half / full) | Nuanced, hard to read | Binary, but crisp feedback |
| Move penalty | Speed while holding | 40% walk | Rooted, must pre-commit position | Kite-and-charge, low risk |
| Overcharge window | Grace past "full" before overload | 0.3 s | Forgiving peak | Punishing frame-perfect cap |
| Cancel cost | Penalty for aborting a charge | Small stamina/cooldown | Real commitment, no free bluffs | Free feints (a different game) |
| Damage curve | Tap→full scaling shape | Quadratic | Full charge feels earned | Flat, no reason to hold |

Default the curve **nonlinear** — a full charge should feel like a decision, not a tax. If tap and full differ by 20%, nobody waits.

**The two-way telegraph.** This is the load-bearing idea. Charging must cost **legibility**: the same signal that tells you "almost full" tells the enemy "dodge now." Design the windup so a smart opponent can punish a greedy hold — that's the risk half of [[pattern-risk-reward]]. Pair it with a movement penalty so the player can't safely charge mid-scramble; commitment means planting your feet. See [[pattern-fairness-and-trust]]: the tell must be honest both directions.

**Slots into.**
- Genres: [[genre-soulslike]], [[genre-fighting-game]], [[genre-action-adventure]], [[genre-precision-platformer]], [[genre-bullet-hell]], [[genre-metroidvania]], [[genre-tactics]] (charge as a spent action).
- Anchors: [[anchor-dark-souls]] (charged R2, the whole risk grammar), [[anchor-street-fighter]] (charge motions — hold back, then punch), [[anchor-cuphead]] (the charged shot as boss-DPS tool), [[anchor-hades]] (Bull Rush / special charges), [[anchor-celeste]] (dash-as-commitment cousin).

**Twist seams.**
- **Charge but releasing early is a feint that baits their dodge** (mechanic-swap). Swap the payload for information: a half-charge flash makes the enemy burn their dodge, and *now* you land the real hit. The move stops being about damage and becomes about reading their read. Give feints a real cancel cost or they dominate — see [[mechanic-parry]], [[mechanic-dodge-roll]].
- **Charge but it charges from ambient sound, not a button** (theme). No hold input — your weapon fills from the world's volume: nearby combat, a beating drum, a storm. Loud rooms arm you; silence disarms you, and the enemy learns to fight quiet. Reframes charge as environmental resource. See [[world-soundscape]], [[system-hazards-and-environment]].
- **Charge but every tier is a different move** (mechanic-swap). Tap fires, half sweeps, full launches — one input, three verbs gated by hold time. Depth from timing, not extra buttons. Watch readability: distinct tier tells or it becomes [[antipattern-guess-the-designer]].

**How it wires to Hayao.**
- The charge value is **state** that advances with elapsed time each tick — hold it in the sim, off the view, so it lives in the world hash. Keep timing deterministic; drive any variance (crit rolls on release) through a deterministic RNG, never wall-clock.
- The windup is **view**: glow, particles, a swelling ring. Mark it cosmetic so it stays out of `hash()` — pure feedback, no logic. The split is the `examples/sokoban/` convention.
- For the release burst — screen-shake, particle spray, hitstop — study a particles/camera sandbox in isolation (`sandboxes/`) before wiring it into a whole game, per the doctrine. Don't survey full examples for the effect.
- If the design is turn-based (charge = an action spent across turns), the charge tier belongs in the pure `Puzzle<State, Move>` rules, and the solver proves the encounter is winnable.

**Fails when…**
- The tap and the full charge feel the same → nobody holds → dead lever. Fix the [[antipattern-false-depth]]: make the curve steep.
- Charging is free (no move penalty, no legible tell) → always charge, no decision → [[antipattern-boring-optimal]].
- The windup and the release read alike, or the tier tells blur together → the player can't tell what they cast → [[antipattern-unreadable-juice]].
- Enemies can't actually punish a greedy hold → the "risk" is fiction → it's just a slow attack button.
- Full-charge damage climbs faster than encounter HP over a run → [[antipattern-power-creep]] / [[antipattern-stat-inflation]].
- The input holds but the strike lags or the tier snaps wrong → [[antipattern-input-lie]]; commitment demands the crispest possible release frame.

**See also.**
[[mechanic-ground-pound]] · [[mechanic-parry]] · [[mechanic-deflect]] · [[mechanic-dash]] · [[mechanic-block]] · [[system-telegraphs]] · [[system-combat-model]] · [[system-counter-systems]] · [[pattern-risk-reward]] · [[pattern-juice-choreography]] · [[pattern-readability]] · [[recipe-one-button-boss-rush]]

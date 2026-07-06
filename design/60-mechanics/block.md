---
id: mechanic-block
title: Block / Guard
kind: mechanic
tags: [combat, defense, stamina, tempo]
summary: Hold to absorb hits at a cost — the patient answer; guard breaks are the tension.
use-when: Combat wants a low-skill-floor defense with a resource ceiling.
composes-with: [mechanic-parry, system-combat-model, mechanic-charge-attack]
verify-with: docs/VERIFICATION.md
---

**What it is.** Hold a button to raise a guard that absorbs incoming hits, trading a resource — **stamina**, chip HP, or positioning — for safety. The defensive floor that anyone can reach.

**Player fantasy / why it's fun.** You are the wall. The tension isn't the block — it's the **meter draining** while the enemy hammers, and the moment you must gamble on when to drop it and strike back.

## The verb

Hold to raise guard; incoming attacks hit the guard instead of you, paying a cost each time. Release to act.

## How it feels / why it's fun

- **Low floor, high ceiling.** Blocking is one held button — trivial to reach, so a new player survives the first fight. Mastery lives in *when to stop*: guard-break punishes patience taken too far.
- **Tempo, not spike.** Block sets the *rhythm* of a fight — it slows the exchange, forces the attacker to commit, and buys thinking time. Compare [[mechanic-parry]], which sets *spikes*: a parry is a razor-thin window that flips momentum instantly. Block is the metronome; parry is the drum hit. A combat model that offers both gives players a defensive [[system-counter-systems|counter]] gradient from safe-and-slow to risky-and-explosive.
- **The meter is the drama.** A full guard bar is confidence; a flickering one is panic. Draining it is the [[pattern-risk-reward|risk/reward]] pump — see [[system-resource-loops]].

## Tuning levers

| Lever | What it controls | Sane default |
|---|---|---|
| **Chip %** | Fraction of blocked damage that leaks through | 10–25% of raw |
| **Guard meter** | Stamina pool that blocking spends | 100, blocks ~5–7 heavy hits |
| **Per-hit drain** | Meter cost per blocked hit (scale by attack weight) | light 8 / heavy 30 |
| **Regen delay + rate** | Pause before meter refills, then speed | 1.0 s delay, 20/s |
| **Guard-break stun** | Frames you're helpless when meter empties | 0.8–1.5 s (one free heavy) |
| **Chip-kill?** | Can chip reduce you below 1 HP? | No (floor at 1) — chip-kills feel unfair |
| **Directional?** | Must guard face the attacker | On for 1v1 depth, off for hordes |
| **Startup frames** | Delay before guard is active | 2–4 frames (punishable if late) |

Cross the drain rate against enemy DPS so a *held* block is a losing trade over time — that pressure is what forces the release. If holding forever is safe, block becomes [[antipattern-boring-optimal|the boring optimal]].

## Slots into

- **Genres:** [[genre-soulslike]] (the canonical stamina-guard), [[genre-fighting-game]] (block-stun + guard meter + chip), [[genre-action-adventure]], [[genre-metroidvania]], [[genre-survival-horror]] (scarce guard = dread).
- **Anchors:** [[anchor-dark-souls]] (shield stamina, guard-break, poise), [[anchor-street-fighter]] (block-stun, chip damage, guard crush), [[anchor-hades]] (the Aspect-of-Aegis block-into-bash), [[anchor-cuphead]] (parry-only *absence* of block sharpens why block matters).
- **Systems:** [[system-combat-model]], [[system-counter-systems]], [[system-telegraphs]] (you must read the wind-up to block it), [[system-enemy-archetypes]] (guard-breakers exist to answer turtling), [[system-status-effects]].

## Twist seams

- **Block but the damage is stored and released when you attack** (mechanic-swap). Guard doesn't spend the hit — it *banks* it. Your next strike deals the accumulated chip as bonus damage, so blocking becomes a loading gesture, not just survival. Turtling now sets up a payoff; see [[mechanic-charge-attack]] and [[pattern-escalation-and-payoff]].
- **Block but blocking recharges the enemy, not you** (perspective). Every hit you absorb feeds *their* super meter or breaks *your* poise faster — so defense funds the offense you're defending against. Patience is a slow-bleed trap that forces aggression; pairs with [[system-difficulty-and-dda]] pressure and [[pattern-pacing-and-tension]].
- **Block but it's positional** (mode-shift). Guard only covers one facing; hold it and you can't turn, so blocking commits your orientation. Now defense is a spatial puzzle against flankers — leans toward [[genre-tactics]] and [[system-encounter-design]].

## How it wires to Hayao

- **Model block as a pure state on the combat entity**, not a view flag: a `guarding` boolean plus a numeric guard meter that lives in simulation state and flows into `world.hash()`. Chip, drain, regen, and break are deterministic transitions on that state — the guard-break stun is just a timed status. See [[system-combat-model]] for the state/resolution split.
- **Resolve hits in a stable, ordered pass** so simultaneous attacks against a guard drain the meter identically every run. Route any variance (crit chip, break-chance) through a **deterministic RNG**, never wall-clock.
- For the input feel — hold-to-hold, buffered release, startup frames — prototype the timing in isolation before wiring it to a whole fight. Study the parry timing lab under `sandboxes/` as the sibling reference for frame windows; block is the same clock with a wider mouth.
- The guard flash, spark, and meter bar are **cosmetic view** — keep them out of the hash. Choreograph the impact (see [[pattern-juice-choreography]]) so a blocked hit *reads* as blocked; prove the feel per [[pattern-readability]] and the verify half.

## Fails when…

- **Holding forever is free.** No drain, no break, infinite chip-immunity → the fight stalls into a turtle. Block needs a ceiling. → [[antipattern-boring-optimal]].
- **Chip kills feel arbitrary.** Dying through a "successful" block reads as an [[antipattern-input-lie]] unless the chip-kill is loudly telegraphed and consistent. Floor at 1 HP by default.
- **Guard-break isn't telegraphed.** If the meter or the break has no [[system-telegraphs|tell]], the punish feels like [[antipattern-rng-frustration|randomness]], not a lesson.
- **Block trivializes parry.** If safe blocking is nearly as good as a risky parry, the parry is [[antipattern-fake-choice|dead weight]] — the whole point is that block is the *safer, slower* option and parry pays more.
- **Startup is instant.** Zero-frame guard means every reaction is free; the read stops mattering. Give block a punishable cost for lateness.

## See also

- [[mechanic-parry]] · [[mechanic-deflect]] · [[mechanic-dodge-roll]] — the defensive family; block is the tempo, parry/deflect the spike, dodge the reposition.
- [[system-combat-model]] · [[system-counter-systems]] · [[system-telegraphs]] — where block earns its depth.
- [[mechanic-charge-attack]] · [[pattern-risk-reward]] — the store-and-release seam.
- [[recipe-one-button-boss-rush]] — a place block-vs-punish carries a whole loop.

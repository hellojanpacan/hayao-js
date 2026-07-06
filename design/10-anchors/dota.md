---
id: anchor-dota
title: Dota 2
kind: anchor
tags: [moba, asymmetry, objectives, comeback, teamplay]
summary: Lane-and-objective team strategy with a huge asymmetric hero roster — a snowball economy braced by comeback mechanics.
use-when: You want deep team strategy from asymmetric roles around shared objectives.
composes-with: [genre-moba, system-faction-asymmetry, pattern-feedback-loops]
anchors: [anchor-dota]
verify-with: docs/VERIFICATION.md
---

**What it is.** Two teams of asymmetric heroes farm a shared map, buy items with the gold they earn, and push lanes to destroy the enemy base. Individual power compounds — but the map hands the losing side explicit levers to claw back.

**Player fantasy / why it's fun.** You are one specialist in a five-part machine. Your lane is a personal economy; the map is a shared clock. The high is the teamfight where your one role — the initiator, the carry, the save — is the piece that turns the whole board.

## Design DNA

The compressed essence, four gears turning together:

- **Asymmetric roles.** Each hero is a distinct verb, not a stat block. Identity comes from *what only you can do* (blink-initiate, global heal, split-push), not from being numerically bigger. See [[system-faction-asymmetry]], [[system-unit-rosters]].
- **Lane economy.** Time on the map converts to gold and XP; gold buys items; items are the real power curve. The map is a farm, not just a battlefield. See [[system-economy]], [[system-resource-loops]].
- **Objective tempo.** Fights are *about* something — a tower, a buff creature, a lane of pressure. Kills matter because they buy an objective window, not for the kill count. See [[system-quests-and-objectives]], [[pattern-risk-reward]].
- **Comeback valves.** Bounties, catch-up XP, and one game-ending objective mean a lead is a lease, not a deed. The snowball is real but never sealed. See [[pattern-feedback-loops]], [[system-difficulty-and-dda]].

## Load-bearing structures

| Structure | Why it works |
| --- | --- |
| **Role asymmetry** — heroes are verbs, not tiers | Depth per hero, not per number; the roster is a strategy space, not a power ladder. [[system-faction-asymmetry]] · [[system-counter-systems]] |
| **Farm-to-power curve** — time earns gold, gold is the power | Effort converts to strength on a legible clock; the weak-early/strong-late arc is a *promise* the player can spend against. [[system-economy]] · [[system-progression]] |
| **Positive feedback (snowball)** — a lead earns more lead | Fights have stakes; a won teamfight opens the map. Tension comes from a real, compounding advantage. [[pattern-feedback-loops]] · [[pattern-risk-reward]] |
| **Negative feedback (comeback brace)** — bounties, catch-up, the Ancient | The dominant brake on snowball; keeps the trailing team playing and the leading team honest. Without it, minute 10 decides minute 40. [[pattern-feedback-loops]] · [[pattern-fairness-and-trust]] |
| **Shared objectives** — towers, buff creature, the core | A win condition that isn't "more kills"; forces the team to converge in space and time. [[system-quests-and-objectives]] · [[system-map-and-navigation]] |
| **Counter-picking** — every threat has an answer verb | Rock-paper-scissors at the roster level; no single hero is the correct answer to the board. [[system-counter-systems]] · [[antipattern-solved-metagame]] |

## What to steal

- **Role identity over role tier.** Build a roster where each unit is the *only* one that does its thing. A player should pick for a fantasy ("I zone the whole lane"), not for a win-rate. Contrast [[system-unit-rosters]] and its trap, [[antipattern-fake-choice]].
- **A legible farm clock.** Let time-on-task convert to power on a curve the player can read and plan against. The "weak now, terrifying at 20 minutes" arc is portable to any economy. See [[system-resource-loops]].
- **The comeback brace — the crown jewel.** Any game with a compounding lead *needs* an explicit negative-feedback valve or it decides itself early. Steal the bounty (killing the leader pays more), the catch-up (trailing gains accelerate), and the single sudden-death objective. See [[pattern-feedback-loops]], [[system-difficulty-and-dda]].
- **Objective-shaped fights.** Never reward the kill for its own sake. Reward what the kill *buys* — a tower, a window, a map. See [[pattern-risk-reward]].
- **Counter-web, not tier-list.** A threat should always have an answer that isn't "the strongest unit." See [[system-counter-systems]].

## What's just theme (drop it)

- **The 100+ hero onboarding cliff.** The roster's *size* is a live-service moat, not a design virtue — it's a wall for new players. Steal asymmetry with 6–12 sharply distinct roles; the depth is in the interactions, not the count. See [[antipattern-difficulty-cliff]], [[system-onboarding]].
- **Five human teammates.** The teamplay is load-bearing; needing *four coordinated strangers* to feel it is not. Fantasy survives with fewer, or none — see the twist seams.
- **The 40-minute match.** Session length is a genre habit, not a mechanic. The snowball/comeback loop works at any duration. See [[system-session-structure]].
- **Denying, couriers, rune timings.** Depth-flexing rituals that raise the skill floor without carrying the core fantasy. Keep the economy; drop the arcana. See [[antipattern-false-depth]].
- **The high-fantasy skin.** Ancient, Roshan, dire/radiant — pure dressing. See [[world-theme-vectors]].

## Composes into

- **[[genre-moba]]** — the direct genre; this anchor is its clearest spine.
- **[[genre-rts]]** — asymmetry + objectives + economy, scaled to command instead of a single hero. See [[anchor-starcraft]], [[anchor-age-of-empires]].
- **[[genre-tower-defense]]** — lane pressure and objective creep as the enemy side of the same coin.
- **[[system-faction-asymmetry]]**, **[[system-economy]]**, **[[system-counter-systems]]** — the reusable subsystems, extractable whole.

## Twist seams

- **MOBA but solo vs an AI lane, no teammates to blame** *(perspective)* — collapse the team to one hero against an AI-driven enemy lane. You feel the snowball and the comeback brace directly, with none of the coordination tax. The design load moves entirely onto the [[system-enemy-ai]] as a credible, escalating lane opponent — and onto the comeback valve staying *fair*, since there's no ally to cover a mistake. See [[pattern-fairness-and-trust]].
- **MOBA but the map is the only unit you command** *(mechanic-swap)* — you never control a hero. You command the *terrain*: reroute lanes, place towers, seed buff creatures, tune the economy that autonomous heroes farm. The strategy is objective-tempo and comeback-tuning at the board level, closer to [[anchor-loop-hero]] or [[anchor-mini-metro]] than to twitch play. The fun is watching your economic bracing decide the fight you never touched.

## See also

- Anchors: [[anchor-starcraft]] (RTS asymmetry + macro), [[anchor-loop-hero]] (command the map, not the hero), [[anchor-into-the-breach]] (objective-shaped combat, no kill-chasing), [[anchor-slay-the-spire]] (build-defined identity).
- Systems: [[system-faction-asymmetry]], [[system-economy]], [[system-counter-systems]], [[system-difficulty-and-dda]], [[system-onboarding]].
- Patterns: [[pattern-feedback-loops]], [[pattern-risk-reward]], [[pattern-fairness-and-trust]].
- Traps: [[antipattern-difficulty-cliff]], [[antipattern-solved-metagame]], [[antipattern-false-depth]], [[antipattern-fake-choice]].
- Process: [[process-the-twist]], [[process-composition]].

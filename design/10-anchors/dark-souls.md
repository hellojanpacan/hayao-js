---
id: anchor-dark-souls
title: Dark Souls
kind: anchor
tags: [soulslike, deliberate-combat, risk, world-as-lock, stamina]
summary: Deliberate combat + a world that gates itself + the bonfire risk loop — tension from commitment and the fear of losing banked progress.
use-when: You want weighty, readable combat where every attack is a commitment and rest is a gamble.
composes-with: [genre-soulslike, mechanic-dodge-roll, system-save-and-checkpoint]
anchors: [anchor-dark-souls]
verify-with: docs/FUN.md#4-·-action-adventure
---

**What it is.** Slow, legible melee combat where **stamina** rations your every move, resting **respawns the world** and re-arms every enemy, and death drops your entire **currency** on the ground for one anxious retrieval run.

**Player fantasy / why it's fun.** You are not a hero; you are a survivor who earned it. The pull is **commitment** — you chose that swing, you paid for it, and the win feels like it belongs to your hands, not the numbers.

## Design DNA (the compressed essence)

- **Stamina is the whole combat.** Attack, dodge, block, and sprint all draw one bar. Empty stamina = you are punished. Every fight is a resource-management [[pattern-risk-reward]] loop, not a mash.
- **Telegraph-and-punish.** Enemies wind up slow and readable; you learn the tell, then take the opening. Threat lives in the [[system-telegraphs]], not in hidden dice.
- **Souls as risked currency.** Kills bank a single fungible currency for both leveling and buying. Die and it drops where you fell; die again before reclaiming it and it is gone forever.
- **The bonfire loop.** Rest to heal and refill flasks — but the act **respawns every ordinary enemy**. Safety and progress are the same lever pulled opposite directions.
- **World as lock.** One continuous, folded map. Shortcuts you unlock loop back to the last rest. Progress is spatial knowledge, not a level counter. See [[genre-metroidvania]] for the same spine.

## Load-bearing structures

| Structure | Why it works |
| --- | --- |
| **Stamina economy** on one bar | Forces spacing and patience; turns combat into [[system-resource-loops]] instead of reflex spam — the [[system-combat-model]] backbone. |
| **Dropped-souls-on-death** | Loss is felt, not narrated. The retrieval run is the tensest lap in the game — pure [[pattern-pacing-and-tension]]. |
| **Bonfire = heal + respawn** | Every rest is a decision, not a freebie. Couples recovery to a cost via [[system-save-and-checkpoint]]. |
| **Readable telegraphs** | Difficulty reads as *fair*: you lost because you misread, not because you were cheated. See [[pattern-fairness-and-trust]]. |
| **Dodge-roll with i-frames** | The core verb of survival — a timed commitment, not a free escape. [[mechanic-dodge-roll]]. |
| **Lock-on** targeting | Keeps a duel legible under camera chaos; the frame that makes telegraphs readable. [[mechanic-lock-on]]. |
| **Interconnected world** | Shortcuts convert exploration into permanent, remembered relief. [[system-map-and-navigation]]. |
| **Bosses as exams** | Each boss is a set-piece test of a specific skill you've been drilling — [[system-boss-design]]. |
| **Estus flasks** (capped heals) | Finite, refill-at-rest healing rations attrition into a plan. [[pattern-risk-reward]]. |

## What to steal

- The **bonfire loop**: rest heals you *and* refills the map with enemies. Recovery and challenge share one button.
- The **commitment tax**: attacks have startup and recovery you cannot cancel. You buy each swing with vulnerability.
- **Dropped currency on death** with a one-shot reclaim. Banking vs. spending becomes a live gamble every corridor.
- **Telegraph-first enemy design**: slow, honest wind-ups. Threat you can *read* is threat you can *master*. [[system-enemy-ai]].
- **Shortcuts that fold back** to the last checkpoint — the single best relief beat in the genre.
- **One fungible currency** for both leveling and shopping (see [[system-economy]]): every soul is an agonizing spend-or-save choice.
- **Stamina spacing** — even a block costs the bar, so turtling is not free.

## What's just theme (drop it)

- **Lore obscurity** — the "figure it out from item descriptions" mystique is signature but *optional*. Your world can be legible without losing weight. Steal the [[world-mood-and-atmosphere]], skip the riddle.
- **Grimdark palette.** Ash and rust are aesthetic, not mechanic. The loop works cozy, neon, or pastel — see [[world-theme-vectors]].
- **Cryptic questlines** and hidden NPCs. Great flavor, zero load-bearing; cut them before they eat your scope.
- **Punishing-for-punishment's-sake** framing. The tension comes from *legible* risk (telegraphs + banked currency), not from opacity. Opacity that hides the rules is [[antipattern-guess-the-designer]] — reject it.
- **Sprawl.** DS's size is a AAA luxury. A short world with well-placed shortcuts carries the whole feel.

## Composes into

- [[genre-soulslike]] — the direct genre; this anchor *is* its reference implementation.
- [[genre-action-adventure]] and [[genre-metroidvania]] — the world-as-lock structure ports cleanly.
- [[system-combat-model]] + [[system-telegraphs]] + [[system-boss-design]] — the combat trio.
- [[system-save-and-checkpoint]] + [[system-resource-loops]] — the rest/risk economy.
- [[system-progression]] via one currency; layer [[system-difficulty-and-dda]] carefully — DS's fixed difficulty is a design *choice*, not an oversight.
- Pairs with [[recipe-one-button-boss-rush]] if you want the exam-fights without the world.

## Twist seams

- **Souls but death moves the world forward without you** *(structure)* — instead of the world resetting to the bonfire, each death advances a clock: NPCs die, doors seal, the map decays. Your dropped souls persist, but the geography around them rots. Reclaiming is a race against a world that is done waiting.
- **Soulslike but coop-only — one body, two players** *(perspective)* — two players share a single character: one drives movement + dodge, the other drives attacks + stamina spend. Neither can act alone; the commitment tax becomes a *conversation*. See [[genre-coop-chaos]] and [[system-coop-and-competition]], and steal the shared-body tension from [[anchor-it-takes-two]].
- **Stamina but it's a shared party pool** *(constraint)* — a small squad draws from one stamina bar. Every dodge you spend is an attack your ally can't make. Turns the [[system-resource-loops]] solo tension into a party-allocation puzzle.
- **Bonfire but it's a one-way ratchet** *(structure)* — resting is permanent progress you can never undo; there is no reset, only forward. The respawn cost becomes a decision you live with, not a loop you re-run.

## See also

- [[anchor-hades]] — the *other* death-loop, but generous and narrative where DS is austere; contrast the [[system-meta-progression]] philosophies.
- [[anchor-dead-cells]] — soulslike verbs at roguelike speed; steals telegraph combat, drops the persistent world.
- [[anchor-shadow-of-mordor]] — enemies that remember you; a different answer to "make death mean something."
- [[anchor-celeste]] — precision and death-as-teacher without the currency risk; the *fair-failure* cousin.
- [[system-mastery-curve]] and [[pattern-mastery-and-flow]] — the earned-competence feeling this anchor is built to deliver.
- [[antipattern-fail-loop-tax]] — the failure mode to guard against: make the retrieval run *tense*, never *tedious*.

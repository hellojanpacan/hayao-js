---
id: genre-soulslike
title: Soulslike
kind: genre
tags: [deliberate-combat, risk, stamina, world-as-lock, tension]
summary: Weighty, readable combat + a risked-currency loop + a world that gates itself — tension from commitment and banked progress.
use-when: You want deliberate combat where every swing commits and rest is a gamble.
composes-with: [anchor-dark-souls, mechanic-dodge-roll, system-save-and-checkpoint, system-telegraphs]
anchors: [anchor-dark-souls]
verify-with: design/FUN.md#4-·-action-adventure
---

**What it is.** Deliberate melee combat where every action **commits** to an animation, paired with a currency you drop on death and must recover, laid over a world that unlocks itself through shortcuts. Reading the enemy is the game.

**Player fantasy / why it's fun.** Mastery of a wall that never moves. The boss that killed you forty times becomes trivial — not because you leveled, but because you *learned it*. Tension lives in the gap between a swing you can't cancel and a tell you must trust.

## Pillars (exactly 3)
1. **Committed combat.** No input is free. Attacks, dodges, heals all consume time and stamina and lock you into recovery. Threat is legible; the cost of misreading it is total. See [[system-combat-model]], [[system-telegraphs]].
2. **Risk economy.** One currency for both leveling and buying. Death drops it where you fell; die again on the way back and it's gone. Every step from safety is a wager. See [[system-economy]], [[pattern-risk-reward]].
3. **Interconnected world.** The map is the puzzle. Shortcuts fold long, dangerous paths back onto the last rest point. Progress is measured in doors you can now open. See [[system-map-and-navigation]], [[genre-metroidvania]].

## The loop stack
| Layer | Beat |
|---|---|
| **Moment** | Read a wind-up → dodge or block on the frame → punish the recovery. One exchange, fully legible. |
| **Encounter** | Spend a stamina bar and a heal budget to clear a room or a boss. Manage the meter, not just the hit. |
| **Session** | Push from the last rest into unknown ground, bank a shortcut, retreat before the currency you carry gets too heavy to risk. |
| **Meta** | Convert banked currency into stats and gear; the wall you couldn't pass becomes the floor you stand on. See [[system-progression]], [[system-meta-progression]]. |

## Essential systems
- [[system-combat-model]] — commitment, hitstop, and hurtboxes. The whole genre is here.
- [[system-telegraphs]] — every attack readable *before* it lands, or the difficulty is a lie. See [[pattern-readability]].
- [[system-save-and-checkpoint]] — the rest point (bonfire) is the spine: it heals, respawns enemies, and is the death anchor.
- [[system-economy]] — one fungible currency; the risk loop dies if leveling and spending use different tokens. Avoid [[antipattern-currency-spaghetti]].
- [[system-boss-design]] — the genre's exam. Multi-phase, pattern-based, punishing but fair.
- [[system-enemy-archetypes]] — a small, deeply-read roster beats a large forgettable one. See [[system-enemy-ai]].
- [[system-status-effects]] — poise, poison, bleed: pressure that stacks between hits.
- [[system-camera-and-controls]] — [[mechanic-lock-on]] frames the duel; a bad camera *is* the hardest boss.

## Content & difficulty model
- **Difficulty is authored, not scaled.** No sliders, no rubber-band. The challenge is fixed and the player rises to it. This is [[pattern-mastery-and-flow]], not [[system-difficulty-and-dda]] — deviate deliberately, and read [[system-accessibility]] before you refuse assists.
- **The rest point paces everything.** Distance between checkpoints *is* the tension knob. Long runs raise stakes; a shortcut is a reward that spends that tension. See [[pattern-pacing-and-tension]].
- **Bosses are the content spikes; corridors are the rhythm.** Trash between bosses teaches the vocabulary the boss will test. See [[system-encounter-design]].
- **Enemy density and placement carry the run-back.** Every enemy you re-clear on the return trip is authored friction — make it a re-test, not a tax. Watch [[antipattern-fail-loop-tax]] and [[antipattern-backtracking-tax]].
- **Gear is horizontal, not just vertical.** Weapons change *how* you fight (moveset, range, timing), not only the number. See [[system-build-diversity]], [[system-loot-tables]].
- **New Game+ is the endgame.** The same world, harder, with carried power. See [[system-prestige-and-newgame-plus]].

## Signature-mechanic seeds
1. **Soulslike but coop-only, one body two players** *(perspective)*. Two players share a single character — one owns movement and dodge, one owns the weapon and stamina. A swing only lands if both commit on the same tell. Commitment becomes conversation. See [[system-coop-and-competition]], [[anchor-it-takes-two]].
2. **Souls but death advances the world without you** *(structure)*. Your dropped currency doesn't wait to be recovered — it seeds a new enemy, a raised gate, a boss that grows. Every death permanently reshapes the map; recovery means fighting the consequence of your last fall. See [[system-spawn-directors]], [[world-level-as-story]].
3. **Stamina but shared with the environment** *(constraint)*. Torches, levers, and rest all draw from the same bar that fights. Explore aggressively and you arrive at the boss exhausted. Turns [[system-resource-loops]] into a route-planning problem.
4. **Telegraph but you author the enemy's tell** *(agency)*. Before a fight, choose which of a boss's attacks flash a warning — buying readability on one pattern by going blind on another. Difficulty becomes a build choice. See [[pattern-meaningful-choice]].
5. **Bonfire but it's the enemy respawn AND your only weapon forge** *(tension)*. Resting arms you but rearms them. Every heal is a decision to re-fill the world with threats. Sharpens the [[pattern-risk-reward]] loop to a single button.

## Common pitfalls
- **Opacity mistaken for depth.** Hidden mechanics, unmarked stat effects, and cryptic item text are *not* difficulty — they're a guessing game. The genre is hard because it's *readable and unforgiving*, not because it's obscure. See [[antipattern-guess-the-designer]], [[antipattern-false-depth]].
- **The run-back tax.** A long, enemy-choked walk back to a boss adds tedium, not challenge. Punish the fight, not the commute. See [[antipattern-fail-loop-tax]], [[antipattern-backtracking-tax]].
- **Unreactable attacks.** If the tell can't be answered on reaction, the "skill" is memorization of an unfair frame. See [[antipattern-input-lie]], [[pattern-fairness-and-trust]].
- **Difficulty cliffs at boss gates.** A boss that jumps two tiers above the corridor that fed it snaps the mastery curve. See [[antipattern-difficulty-cliff]], [[system-mastery-curve]].
- **Currency spaghetti.** Split the risked currency into three tokens and the death loop loses its teeth. See [[antipattern-currency-spaghetti]].
- **Stat inflation over moveset variety.** If a "new" weapon is only a bigger number, build diversity is fake. See [[antipattern-stat-inflation]], [[antipattern-fake-choice]].

## Adjacent genres
- [[genre-action-adventure]] — the parent; soulslike is its committed, risk-loaded dialect.
- [[genre-metroidvania]] — the world-as-lock pillar; shortcuts over ability-gates.
- [[genre-survival-horror]] — shared scarcity and dread; horror hides the threat, soulslike shows it and dares you.
- [[genre-fighting-game]] — the frame-level read of committed combat, one-on-one.

## Anchors
- [[anchor-dark-souls]] — the canonical text. Every pillar above is a distillation of it. For the coop seam, cross-reference [[anchor-it-takes-two]]; for boss-rush purity, [[anchor-cuphead]].

## Verify
Prove the committed-combat and risk-loop feel against `design/FUN.md#4-·-action-adventure`. Keep rendered chrome out of the sim hash per the view/logic split; judge looks headlessly per [[process-refine-and-handoff]].

---
id: system-loot-tables
title: Loot Tables
kind: system
tags: [drops, randomness, reward, weighting, pity]
summary: The math of what drops and how often — weighted tables, rarity tiers, and pity timers that keep variance from feeling cruel.
use-when: You need to design drops, rewards, or randomized acquisition.
composes-with: [system-reward-schedules, antipattern-rng-frustration, system-economy]
verify-with: docs/FUN.md#10-·-traditional-roguelike
---

**What it is.** A table maps a **roll** to a reward. Weight each entry, sort into rarity tiers, and pull from it with a deterministic RNG. The whole design of "what you get and how badly you wanted it" lives in these numbers.

**Player fantasy / why it's fun.** The **pull** of the unknown chest, the spike when the gold-bordered thing drops, the story of the run that hinged on one lucky roll. Loot turns repetition into anticipation — but only when the odds feel authored, not hostile.

## When to use / when NOT

- **Use** when acquisition should feel *earned-but-surprising*: roguelike drops ([[genre-roguelike]]), deckbuilder card offers ([[genre-deckbuilder]]), horde-survival upgrade picks ([[genre-horde-survival]]), any [[system-reward-schedules]] with a variable payoff.
- **Use** to gate build variety ([[system-build-diversity]]) — the table decides which pieces a player can even assemble.
- **NOT** for deterministic progression. If the fourth boss should *always* give the double-jump, that is [[system-progression]], not a table. Randomizing a required unlock is a trap.
- **NOT** as a substitute for content. A wide table over three items is a [[antipattern-content-desert]] wearing a rarity costume.
- **NOT** where the player expects a promise kept. Quest rewards, story beats, tutorial gifts — hand-place those.

## Variants

| Variant | Shape | Feels like | Reach for it when |
|---|---|---|---|
| **Flat** | Every entry equal odds | Fair, flat, forgettable | Prototyping; tiny pools where all outcomes are fine |
| **Weighted** | Per-entry integer weights | Some things are "the good drop" | Default. Common junk, rare jackpots — one table |
| **Tiered** | Roll a tier first, then an item in it | Legible rarity ("orange!") | You want players to *read* value at a glance |
| **Smart loot** | Bias toward what the player can use | Generous, tailored, low-junk | Class/build systems where off-slot drops are dead ([[genre-action-adventure]], Diablo 3) |
| **Pity / bad-luck protection** | A counter that guarantees a rare after N misses | Trustworthy, never cruel | Long grinds; capping the worst-case tail ([[system-meta-progression]]) |
| **Pool without replacement** | Drawn entries removed until refill | No dupes, guaranteed spread | Card offers, run-scoped collectibles ([[system-collectibles]]) |

## Twist seams

- **Loot but the table is visible and you influence it** *(perspective)*. Surface the odds and let the player nudge weights — a "luck" stat, a reroll, a slot they lock. Balatro shows every card's tag and lets you tag-hunt; Hades shows the boon rarity before you pick. Transparency converts blind gambling into a decision. See [[pattern-meaningful-choice]] and [[anchor-balatro]].
- **Drops but rarity is set by how you killed, not luck** *(mechanic-swap)*. Skill sets the tier: a no-hit kill, a parry-finish ([[mechanic-parry]]), a hazard-assisted death rolls on a richer table. Now variance rewards *play*, not patience — the [[pattern-risk-reward]] curve becomes the loot curve. Compare [[anchor-shadow-of-mordor]] nemesis kills and [[system-spawn-directors]] tuning stakes.

## Tuning levers

- **Rarity spread** — the ratio between common and rarest weight. Tight (5:1) reads as "everything's useful"; wide (1000:1) manufactures chase items and highlight-reel moments. Decide the emotional gap you want, then set the numbers.
- **Pity threshold** — how many dry rolls before the guarantee fires. Set it just past the point where players start to *notice* the drought. Too low and the rare feels handed-out; too high and you've already lost them ([[antipattern-grind-wall]]).
- **Dupe handling** — dead dupes rot a table fast. Convert to shards/currency ([[system-economy]]), remove-until-refill, or upgrade the owned copy. Never let the jackpot roll be a thing they already have.
- **Table scope** — global vs per-source. A shared table is simple; per-enemy or per-biome tables let you *place* meaning (this boss is the only orange source). More scope, more authorship, more upkeep.
- **Floor & ceiling** — guarantee a minimum-quality drop so a chest is never *nothing*, and cap how many jackpots stack so a hot streak doesn't trivialize the run ([[system-difficulty-and-dda]]).
- **Level-gating the pool** — swap or reweight entries by depth/act so early tables can't spit end-game power ([[antipattern-power-creep]], [[system-progression]]).

## How it wires to Hayao

- **Every roll goes through `world.rng`.** No `Math.random`, no `Date.now`-seeded noise — determinism is sacred, and a seeded table means a run replays identically and a level's drops are provable. Weighted pick = one rng draw into a prefix-sum over the weights.
- **Ordered iteration.** Build the weighted list in a stable order before you draw, or two machines disagree on the same seed. Sort keys, don't rely on insertion whim.
- **Pity is state, not vibes.** The dry-streak counter lives in sim state and is part of `world.hash()` — it saves, loads, and replays with the run ([[system-save-and-checkpoint]]).
- **Cosmetic is the sparkle, not the roll.** The gold beam, the rarity chime, the item-name flourish are pure view — mark them `cosmetic` so they never touch the hash. The *drop* is logic; the *dazzle* is decoration ([[pattern-juice-choreography]], see docs/JUICE.md).
- For a randomness primitive in isolation, read the procgen lab under `sandboxes/`; for the reward-cadence half, pair with [[system-reward-schedules]].

## Fails when…

- **Variance erases agency.** If the run's outcome is 90% which orange dropped and 10% how you played, you've built a slot machine. Loot should *amplify* skill expression, not replace it. See [[antipattern-rng-frustration]] and [[pattern-fairness-and-trust]].
- **The dry streak has no floor.** No pity, wide spread, long grind — the tail of the distribution is where players quit. Cap the worst case ([[pattern-anti-frustration]]).
- **Junk drowns signal.** A table that's 95% vendor-trash makes every drop a shrug. Trim, or route junk straight to currency ([[antipattern-currency-spaghetti]]).
- **The choice is fake.** Three drops that are strictly worse than the one you have is a non-decision ([[antipattern-fake-choice]]).
- **The metagame solves it.** If there's one correct farm and one correct table, the loot is theater over a spreadsheet ([[antipattern-solved-metagame]], [[antipattern-boring-optimal]]).

## Verify

Odds are a claim you can prove. Roll the table thousands of times against a fixed seed and assert empirical frequencies match the authored weights within tolerance; assert the pity counter *always* fires by its threshold; assert no roll can exceed the level-gated ceiling. Feel-check the drought and the spike against the roguelike track in verify-with (docs/FUN.md#10-·-traditional-roguelike). The reward *lands* elsewhere — see docs/JUDGE.md for whether the drop reads as loot at a glance.

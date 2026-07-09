---
id: anchor-katamari
title: Katamari Damacy
kind: anchor
tags: [growth, absurd, physics, single-verb, joy]
summary: Roll a ball that grows by absorbing the world — one verb, exponential scale, pure escalating delight.
use-when: You want a single growth verb whose scale change IS the whole arc.
composes-with: [mechanic-grow-shrink, mechanic-merge, genre-physics-arcade]
anchors: [anchor-katamari]
verify-with: design/FUN.md#19-·-physics-arcade
---

**What it is.** You push a sticky ball. Anything smaller than the ball sticks and adds to it. It grows, so the threshold rises, so bigger things stick — until a katamari that started eating thumbtacks is eating cows, then houses, then clouds. One verb, run against a clock.

**Player fantasy / why it's fun.** The world is one continuous ramp of *loot*, and you are the loot funnel. Every second, something new crosses the threshold from scenery into snack. The joy is not skill — it's **recontextualization**: the desk you couldn't dent is now a crumb. See [[pattern-escalation-and-payoff]], [[pattern-surprise-and-delight]].

## Design DNA

The compressed essence — three gears, nothing else:

- **Absorb-to-grow.** Contact + `size(object) < size(ball)` → attach. One rule, applied uniformly. See [[mechanic-grow-shrink]], [[mechanic-merge]].
- **Scale that recontextualizes.** Growth doesn't add stats — it **redefines the object taxonomy**. The same object flips from wall → obstacle → snack → dust as you cross its size band. The world is authored once; scale re-reads it.
- **The timer.** A clock turns "roll around forever" into "how big *can* you get." It makes every skipped item a cost and every dense room a jackpot. See [[pattern-pacing-and-tension]], [[system-session-structure]].

Kill any one gear and it collapses: no threshold → no arc, no scale → no wonder, no clock → no tension.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Uniform size threshold** | One comparison drives attach/reject/collide. Cheap to author, legible to the player, and the *only* number the whole game turns on. See [[mechanic-grow-shrink]]. |
| **Exponential size bands** | Objects grouped by order-of-magnitude, not linearly. Each band unlock feels like a new game. This IS the reward schedule — [[system-reward-schedules]], [[system-progression]]. |
| **World-as-loot-table** | Every prop is pickup-able at *some* scale. No inert scenery. Density of small things = early flow; sparse giants = late aspiration. See [[system-collectibles]], [[system-loot-tables]]. |
| **Threshold nag** | Objects just above your size wobble/resist instead of vanishing. The "almost!" that pulls you back after the next growth tick. See [[pattern-feedback-loops]], [[pattern-risk-reward]]. |
| **Camera that pulls back with size** | The zoom-out is the payoff *made visible* — you literally watch your frame of reference expand. Cosmetic, but load-bearing joy. See [[system-camera-and-controls]], [[pattern-juice-choreography]]. |
| **Clock + size goal** | Fail state and win state on one axis. Bounds the session, sets the aspiration. See [[system-session-structure]], [[system-quests-and-objectives]]. |

## What to steal

- **The single verb.** Resist adding a second interaction. Katamari has no attack, no jump, no menu-in-the-moment. The whole design budget goes into *what the one verb touches*. See [[process-pillars]], [[antipattern-feature-soup]].
- **The exponential payoff.** Reward should feel like an order-of-magnitude jump, not +1. Tune bands so each unlock re-opens the map. This is the incremental-genre dopamine loop wearing a physics costume — [[genre-incremental]], [[system-resource-loops]].
- **The "what can I pick up NOW" pull.** After every growth tick, the player's eyes re-scan the room for the newly-eligible. Design rooms so a size-up *reveals* a fresh layer of targets sitting in plain sight the whole time. See [[pattern-surprise-and-delight]].
- **World authored once, re-read by scale.** Cheapest content multiplier there is — a single dense scene yields minutes of escalation. See [[system-procgen-design]], [[pattern-emergence]].
- **Threshold friction as feedback.** Too-big objects bounce you and knock stuff off. Loss is legible and comedic, never a wall. See [[pattern-fairness-and-trust]], [[pattern-anti-frustration]].

## What's just theme (drop it)

- **The King of All Cosmos, the cousins, the story of the stars.** Charming, orthogonal. The verb survives without narrative — see [[world-tonal-juxtaposition]] if you want your own flavor.
- **The exact object list (sushi, sumo, pandas).** The *absurdity* is load-bearing — do NOT drop the tonal whiplash of eating a whole town. But the specific props are swappable. Pick a domain where scale escalation is inherently funny or awe-inducing; keep the whiplash, change the nouns. See [[world-theme-vectors]], [[world-mood-and-atmosphere]].
- **Twin-stick tank controls.** A period artifact, not the design. Any push-a-ball control works; simpler is better. See [[system-camera-and-controls]].

**Do not** drop: the timer, the uniform threshold, the exponential bands, or the absurd scale jump. Those four are the game.

## Composes into

- [[genre-physics-arcade]] — the native home; contact-driven, forgiving, feel-first. Verify feel there.
- [[genre-incremental]] — Katamari is a clicker with a camera. Growth-per-second, unlock-gated content, number-go-up made spatial. See [[system-resource-loops]].
- [[genre-horde-survival]] — swap "absorb props" for "absorb XP/enemies" and you get the [[anchor-vampire-survivors]] snowball; same escalation spine, combat skin.
- [[genre-sandbox-survival]] / [[genre-management-tycoon]] — the "grow your footprint, the map re-reads at each tier" loop generalizes to base and colony scale.
- Feeds [[system-collectibles]], [[system-session-structure]], [[system-reward-schedules]] as a self-contained loop kit.

## Twist seams

- **Katamari but you shrink and the world grows around you** *(perspective)* — invert the verb: you *shed* to slip between molecules, and the "world" is a cell, a circuit, an atom. Same recontextualization, run downward. The dread/wonder flips: scale becomes claustrophobia. See [[mechanic-grow-shrink]], [[world-tonal-juxtaposition]].
- **Roll-and-grow but you must shed mass to fit through gates** *(constraint)* — add a subtractive verb. Doorways, pipes, and sieves gate on max-size, so hoarding is punished and *deciding what to drop* becomes the skill. Turns a flow toy into a [[genre-grid-puzzle]]-adjacent optimization — [[pattern-risk-reward]], [[system-resource-loops]].
- **Absorb-to-grow but the world absorbs YOU back** *(threat)* — bigger entities roll too. Now it's a food-chain arena — an agar.io out of Katamari's guts. See [[system-enemy-ai]], [[pattern-pacing-and-tension]].
- **Grow-by-absorbing but only matching *types* stick** *(filter)* — add a [[mechanic-merge]] color/category rule. Now routing matters: a red ball needs red mass, so the map becomes a sorting puzzle wearing an arcade skin. See [[genre-match3]].

## See also

- [[anchor-vampire-survivors]] — the other great "snowball a single number" anchor; steal its escalation, skip its combat if you want pure Katamari.
- [[anchor-tetris]] / [[anchor-peggle]] — single-verb physics-arcade clarity; how one rule carries a whole game.
- [[mechanic-grow-shrink]], [[mechanic-merge]], [[mechanic-magnet]], [[mechanic-stack]] — the mechanical parts you'll wire.
- [[genre-physics-arcade]], [[genre-incremental]], [[genre-horde-survival]] — where this DNA lands.
- [[pattern-escalation-and-payoff]], [[pattern-surprise-and-delight]] — the two patterns doing the emotional work.
- [[process-the-twist]] — start from the verb, twist one vector, don't survey the corpus.

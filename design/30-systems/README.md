# 30-systems/ — The Modular Systems Library

The **parts bin**. Where [`20-genres/`](../20-genres/) gives you a whole
skeleton, this section gives you the *organs* — progression, economy, combat,
factions, AI, rewards — each a self-contained module you bolt onto a design and
tune. The [COMPOSE step](../README.md) of the pipeline lives here: pick the genre
template, then pull the `system-*` modules it needs and wire them together. Every
module says **what it is · when to use / when NOT · variants · tuning levers ·
how it wires to Hayao · fails when… · verify** — so you compose the known, then
bend it, and hand off proofs to [`docs/FUN.md`](../../docs/FUN.md).

Each entry links `verify-with` into FUN/JUICE/VERIFICATION rather than restating
the proof. Cross-link with `[[system-id]]`; follow `composes-with`.

## Progression · economy · rewards

| id | title | summary |
|---|---|---|
| [[system-progression]] | Progression | XP / levels / the power curve; pacing power gain, vertical vs horizontal |
| [[system-skill-trees]] | Skill Trees | Branching unlocks; builds; meaningful exclusivity; respec as grace |
| [[system-meta-progression]] | Meta-Progression | Roguelite persistent unlocks; power-creep vs options; "always earn something" |
| [[system-mastery-curve]] | Mastery Curve | Learnable depth; skill ceiling; easy-to-learn-hard-to-master as a mechanism |
| [[system-economy]] | Economy | Faucets & sinks; currencies; inflation control; the pacing window |
| [[system-resource-loops]] | Resource Loops | Gather→convert→spend cycles; bottlenecks as pacing |
| [[system-crafting]] | Crafting | Recipes; combinatorial depth; discovery vs lookup |
| [[system-tech-tree]] | Tech Tree | Research gating; branch exclusivity; the ramp of options |
| [[system-reward-schedules]] | Reward Schedules | Variable-ratio drops/chests/loot; ethical compulsion, dark patterns to refuse |
| [[system-collectibles]] | Collectibles | Sets, completion, cosmetics; optional goals with pull |

## Combat · factions

| id | title | summary |
|---|---|---|
| [[system-combat-model]] | Combat Model | Damage, resolution, timing; the shape of a hit |
| [[system-telegraphs]] | Telegraphs | Tells, windups, readable threat; reaction windows |
| [[system-status-effects]] | Status Effects | DoT / buffs / debuffs; stacking rules; build interaction |
| [[system-counter-systems]] | Counter Systems | Rock-paper-scissors; near-hard counters; the duel matrix |
| [[system-faction-asymmetry]] | Faction Asymmetry | Asymmetric identities that balance; "different but fair" |
| [[system-unit-rosters]] | Unit Rosters | Unit roles, tiers, diversity; a legible roster |
| [[system-boss-design]] | Boss Design | Phases, telegraphs, spectacle; the set-piece fight |
| [[system-build-diversity]] | Build Diversity | Weapons / loadouts / synergies; many viable strategies |
| [[system-grace]] | Grace | Coyote / i-frames / buffer / mercy as a system |
| [[system-enemy-ai]] | Enemy AI | Behavior, aggro / threat, steering; readable, beatable minds |
| [[system-enemy-archetypes]] | Enemy Archetypes | Tank / skirmisher / artillery / swarm / support; the enemy alphabet |
| [[system-encounter-design]] | Encounter Design | Composing archetypes into fights; pressure & pockets |

## Structure · AI · procgen · meta · social

| id | title | summary |
|---|---|---|
| [[system-difficulty-and-dda]] | Difficulty & DDA | Difficulty curves; spikes / breathers; dynamic difficulty; assist |
| [[system-onboarding]] | Onboarding | Tutorialization; teach-by-doing; the first ten minutes |
| [[system-accessibility]] | Accessibility | Assist modes; remap; colour / contrast; readability floors |
| [[system-procgen-design]] | Procgen Design | Runs, seeds, variance as content; controlled randomness |
| [[system-session-structure]] | Session Structure | Run / campaign / level / world; session length & shape |
| [[system-save-and-checkpoint]] | Save & Checkpoint | Save, checkpoint, retry; respecting the player's time |
| [[system-emergent-systems]] | Emergent Systems | Nemesis-style memory, relationships, reputation; systemic story |
| [[system-coop-and-competition]] | Coop & Competition | Coop / PvP hooks; asymmetric coop; interdependence & rivalry |

## Generate the content; don't hand-author it

Most of these systems produce *content* — levels, recipes, unlock curves, drop
tables. The Hayao way is to **generate and prove** it, not to hand-write forty
balanced rooms and hope. Point your progression/economy/loop pacing at
[`src/content/`](../../src/content/) — `generateLevels` (solver-verified,
in-band levels), `composeCampaign` (acts that ramp), `assertRamp`/`rampIssues`
(the curve has no deserts, no walls). The 42-level generated reference is
[`examples/lanternfold/`](../../examples/lanternfold/). Design the *shape* here;
let the generator fill it and the verify suite prove it.

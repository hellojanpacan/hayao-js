---
id: genre-moba
title: MOBA
kind: genre
tags: [team, asymmetry, objectives, lanes, comeback]
summary: Asymmetric heroes contest lanes and objectives — a team snowball economy braced by explicit comeback valves.
use-when: You want team strategy from asymmetric roles around shared objectives.
composes-with: [anchor-dota, system-faction-asymmetry, system-coop-and-competition, pattern-feedback-loops]
anchors: [anchor-dota]
verify-with: docs/VERIFICATION.md
---

**What it is.** Two teams of asymmetric **heroes** farm a lane economy into power, then spend that power on shared **objectives** until one base falls. The map is a clock; the roster is the vocabulary.

**Player fantasy / why it's fun.** You own one role deeply — the carry who inflates, the support who enables, the initiator who opens the fight — and your five decisions ripple into a team-scale swing. Mastery is legible: this hero, this matchup, this five seconds. See [[pattern-mastery-and-flow]].

## Pillars (exactly 3)

1. **Role identity.** Every hero answers "what am I for, and who am I bad against." A pick is a promise. Kill any hero's silhouette and the game is a stat sheet — see [[system-faction-asymmetry]], [[world-faction-identity]].
2. **Objective tempo.** Kills are means; the map is the end. Towers, camps, timed neutral objectives (Roshan, Dragon) set a shared clock so fights have *stakes beyond the frag*. See [[system-quests-and-objectives]].
3. **Comeback possibility.** A losing team must always have a *readable* path back. Snowball without a brake is a 40-minute funeral the loser can't quit. This is the pillar that most often collapses — brace it explicitly. See [[pattern-fairness-and-trust]], [[system-difficulty-and-dda]].

## The loop stack

| Scale | What the player does |
| --- | --- |
| **Moment** | Last-hit for gold; dodge a skillshot; land a stun; trade an ability for a summoner's cooldown. |
| **Encounter** | Win a lane; gank a sidelane; commit five bodies to a teamfight around an objective. |
| **Session** | One match: laning → mid-game rotations → objective sieges → base push. 20–40 min, one clean arc. |
| **Meta** | Learn heroes, matchups, item builds, and map timings across matches. Mastery is the retention engine. See [[system-mastery-curve]], [[system-meta-progression]]. |

Design the **session** first — a single match must arc without external progression. See [[system-session-structure]], [[pattern-pacing-and-tension]].

## Essential systems

- **Asymmetric roster** — the whole genre. Distinct kits, hard counters, role slots. See [[system-unit-rosters]], [[system-faction-asymmetry]], [[system-counter-systems]], [[system-combat-model]].
- **Lane economy** — gold and XP as the currency of power; farm patterns, denies, bounties. This is the snowball substrate. See [[system-economy]], [[system-resource-loops]], [[pattern-feedback-loops]].
- **Snowball brakes** — comeback gold, bounty scaling on the leader, respawn timers that grow with the lead, objectives that reward the *underdog's* coordination. See [[pattern-risk-reward]], [[system-reward-schedules]].
- **In-match progression** — levels, ability points, item builds *reset every match*. Depth without permanence. See [[system-progression]], [[system-skill-trees]], [[system-build-diversity]].
- **Status & control** — stuns, silences, slows are the grammar of teamfights; readable durations are non-negotiable. See [[system-status-effects]], [[system-telegraphs]], [[pattern-readability]].
- **Map & vision** — fog, wards, objective timers. Information asymmetry is a mechanic, not decoration. See [[system-map-and-navigation]].
- **Onboarding** — the genre's hardest problem; see pitfalls. [[system-onboarding]].

## Content & difficulty model

- **Content lives in the roster.** N heroes × item space × map objectives = the combinatorial depth. Ship a *tight* launch roster with sharp identities over a bloated one — [[antipattern-feature-soup]], [[antipattern-power-creep]].
- **Difficulty is human**, not authored: the opponent is the difficulty curve. Your job is matchmaking fairness and a floor that a novice can stand on. Model the *skill gap*, not a level ladder. See [[system-difficulty-and-dda]], [[system-accessibility]].
- **Determinism check.** Route every roll — crit, spawn, camp stack, bounty rune — through a deterministic RNG so a match is replayable and provably fair. Same seed, same fight.
- **Balance is a live discipline.** Counters and comeback valves get tuned post-launch; treat the roster as a system to steer, not a shipped artifact. See [[system-live-ops-and-seasons]].

## Signature-mechanic seeds

1. **MOBA but PvE, the lanes are the enemy** (perspective). Five players cooperate against an AI-directed enemy team and lane pressure. The "opponent" is a [[system-spawn-directors]] escalation, not a mirror. Cuts the toxicity and the matchmaking problem at a stroke; keeps role identity and objective tempo. See [[system-coop-and-competition]], [[system-enemy-ai]].
2. **MOBA but you swap heroes mid-match** (mechanic-swap). No permanent pick — bank a pool and hot-swap at the fountain to counter the enemy comp in real time. Turns draft into a continuous decision; comeback becomes a *composition* problem, not just a gold one. Watch [[antipattern-decision-paralysis]]; gate swaps behind a cost.
3. **One-lane duel MOBA** (compression). Strip to a single lane, 1v1 or 2v2, 8-minute matches. Purest form of matchup + last-hit + objective; ideal small-scope target — see [[recipe-one-button-boss-rush]] for the compression instinct.
4. **Draft-only MOBA** (abstraction). The match *is* the pick/ban and item plan; a solver resolves the fight. A pure [[genre-abstract-strategy]] read on the counter web. See [[system-counter-systems]].
5. **Roguellike MOBA** (genre-graft). Between waves, draft augments à la [[anchor-hades]] boons; the "enemy team" is a [[genre-roguelike]] gauntlet. Meta-progression across runs replaces MMR. See [[system-meta-progression]].

## Common pitfalls

- **Toxic snowball.** The lead compounds and the loser is a spectator for 25 minutes with no quit valve. The signature genre failure — see [[antipattern-fail-loop-tax]], [[antipattern-stat-inflation]]. Fix with comeback gold, growing bounties on the leader, and objectives that reward the underdog's coordination.
- **Brutal onboarding wall.** 100+ abilities, item timings, and last-hitting gate the novice out before fun starts — [[antipattern-endless-tutorial]] on one side, [[antipattern-difficulty-cliff]] on the other. Sequence complexity; give a role-limited entry mode.
- **Solved metagame.** Two heroes dominate; the other forty are cosmetic — [[antipattern-solved-metagame]], [[antipattern-fake-choice]]. Counters and live tuning are the antidote.
- **Power creep.** Each new hero out-classes the last to sell it — [[antipattern-power-creep]]. Design new kits as *lateral* additions to the counter web, not vertical.
- **Stat inflation.** Numbers balloon patch over patch until control durations and burst are unreadable — [[antipattern-stat-inflation]], [[antipattern-unreadable-juice]]. Cap the vocabulary of what a fight can do.
- **Currency spaghetti.** Gold, XP, plus three meta currencies with unclear conversion — [[antipattern-currency-spaghetti]]. Keep the in-match economy to gold+XP; keep meta currencies few and legible.

## Anchors

- [[anchor-dota]] — the reference: extreme asymmetry, denies, comeback gold, timed neutral objectives. Study how the *map clock* structures a match.
- Adjacent reading: [[genre-rts]] (macro + unit rosters), [[genre-tactics]] (asymmetric-kit encounters), [[genre-auto-battler]] (draft/counter without the mechanics), [[genre-fighting-game]] (matchup + counter mastery at 1v1).

## Verify

Design lives here; proof lives in `docs/VERIFICATION.md`. Assert the invariants that make a MOBA *itself*: no dominant pick (counter web holds), comeback valves measurably close leads, matches resolve in the target window, and every roll is deterministic under a fixed seed. See also [[process-the-twist]] for turning a seam above into a brief.

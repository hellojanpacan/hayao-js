---
id: genre-immersive-sim
title: Immersive Sim
kind: genre
tags: [systemic, player-expression, stealth, emergent, tools]
summary: Consistent, interacting systems + a verb toolkit = every problem has many valid solutions the designer never scripted.
use-when: You want player expression and emergent solutions over authored paths.
composes-with: [anchor-dishonored, system-emergent-systems, pattern-emergence, mechanic-possess]
anchors: [anchor-dishonored]
verify-with: docs/FUN.md#5-·-stealth
---

**What it is.** A space of **consistent, interacting systems** and a small **verb toolkit**, arranged so any obstacle admits several valid solutions the designer never scripted. The author builds the physics, not the path.

**Player fantasy / why it's fun.** *This was my plan.* You read a situation, combine tools nobody promised would combine, and the world honors it — the win is authored by you, not handed to you.

## Pillars (exactly 3)

1. **Systemic consistency.** Fire spreads, water conducts, guards hear noise, gas ignites — everywhere, always, no exceptions for the "real" puzzle. The rule that holds once must hold every time or the fantasy collapses into guesswork ([[antipattern-guess-the-designer]]).
2. **Player authorship.** Many verbs (move / see / hide / manipulate / possess) with wide overlap. Depth comes from *combination*, not from a longer list ([[system-build-diversity]], [[pattern-emergence]]).
3. **Meaningful stealth-or-force choice.** The core tension: sneak past, talk around, or fight through — each a real, costed lane, none the "correct" one ([[pattern-meaningful-choice]], [[pattern-risk-reward]]).

## The loop stack

| Scale | The loop |
|---|---|
| **Moment** | Observe a hazard/guard/lock → pick a verb → act → the systems react (legibly). |
| **Encounter** | A defended space with 3+ ingresses; scout, improvise a route, recover when the plan breaks. |
| **Session** | A mission arc: infiltrate → objective → exfiltrate, your choices logged (kills, alarms, mercy). |
| **Meta** | Spend on tools/upgrades that *widen the verb set*, not just raise numbers ([[system-progression]], [[system-skill-trees]]). |

## Essential systems

- **Honest AI.** Guards perceive by real senses — sight cones, sound falloff, corpse/light discovery — and their state is *readable* on the actor. If the player can't infer why a guard reacted, the sim is broken. See [[system-enemy-ai]], [[system-telegraphs]], and the [[genre-stealth]] detection model.
- **Interacting hazards.** Fire, water, electricity, gas, gravity, light — each a system that touches the others, not decoration. See [[system-hazards-and-environment]], [[system-status-effects]].
- **A toolkit.** Traversal + manipulation verbs that compose: [[mechanic-possess]], [[mechanic-teleport]], [[mechanic-grapple]], [[mechanic-throw]], [[mechanic-time-stop]]. Pick verbs that multiply each other.
- **Legible spaces.** Level geometry that advertises its options — vents, high ledges, water, cover — so the sandbox is *seen*, not memorized. See [[system-map-and-navigation]], [[world-level-as-story]], [[pattern-readability]].
- **Consequence tracking.** The world remembers your body count and alarms and reflects it ([[system-quests-and-objectives]], the Chaos system in Dishonored).

The hard part is **legibility**. A deep system nobody can read is [[antipattern-false-depth]]; build systems that *show their state* before you make them deep.

## Content & difficulty model

- **Author the sandbox, not the solution.** Design each space as a set of affordances; verify at least three intended routes exist, then let players find the fourth. Solver-proof *reachability*, never a single canonical path.
- **Difficulty is denial, not damage.** Harder = fewer verbs available, tighter patrols, deadlier discovery — not fatter health bars. Tune via [[system-difficulty-and-dda]], [[system-encounter-design]].
- **Onboard the systems, not the story.** Teach fire+water, sight+sound in a safe first space where consequences are cheap ([[system-onboarding]]); one clean interaction beats a wall of tooltips ([[antipattern-endless-tutorial]]).
- **Reward exploration and restraint both.** Ghost/pacifist runs and murder runs each need payoffs, or one lane becomes the [[antipattern-boring-optimal]].
- **Density over sprawl.** A few hand-built, deeply reactive spaces beat a large map of thin ones ([[antipattern-content-desert]]).

## Signature-mechanic seeds

- **Imm-sim but non-lethal only** *(constraint)*. Ban killing; every verb must resolve to sleep, distract, trap, or reroute. The toolkit's *reach* now defines difficulty, and the moral fantasy sharpens — cf. Dishonored's low-chaos path made mandatory.
- **Imm-sim but the systems reset each loop** *(structure)*. The mission repeats like Outer Wilds; hazards, patrols, and locks reset, but *your knowledge* persists. The upgrade tree is what-you-learned, not what-you-bought — see [[anchor-outer-wilds]], [[mechanic-rewind]].
- **Imm-sim but the tools are enemies** *(inversion)*. Every verb is a possessed foe — you have no innate powers, only bodies you steal ([[mechanic-possess]], [[mechanic-clone]]); the roster of nearby enemies *is* your inventory.
- **Imm-sim but one shared meter** *(economy)*. Traversal, powers, and healing all draw one resource ([[system-resource-loops]], [[system-economy]]); every teleport is a healing potion you didn't drink.
- **Imm-sim but the AI writes the story** *(systemic narrative)*. A nemesis system remembers who beat you and escalates them ([[anchor-shadow-of-mordor]], [[recipe-colony-nemesis]]) — the antagonist is emergent, not scripted.

## Common pitfalls

- **[[antipattern-guess-the-designer]]** — the intended solution masquerades as the only one; players poke and get punished. Fix: honor every solution the systems permit.
- **[[antipattern-false-depth]]** — systems interact in theory but their state is unreadable, so nobody discovers it. Fix: legibility before depth.
- **[[antipattern-fake-choice]]** — three routes that all funnel to the same scripted beat. Fix: let outcomes actually diverge.
- **[[antipattern-boring-optimal]]** — one verb (or the murder lane) dominates because it's strictly safer/faster. Fix: cost every lane; reward the hard ones.
- **[[antipattern-feature-soup]]** — twenty verbs, none composing. Fix: fewer verbs, higher overlap ([[antipattern-second-system]]).
- **[[antipattern-input-lie]]** — a guard "should" have heard you but didn't, or did unfairly. Fix: perception must match its telegraph exactly.

## Anchors

- **[[anchor-dishonored]]** — the reference: sight/sound AI, a verb toolkit (Blink, Possession, Windblast), interacting hazards, and Chaos as consequence. Study how each power multiplies the others.
- **[[anchor-outer-wilds]]** — the knowledge-is-progress, systems-reset variant; proof that the toolkit can be *understanding* instead of items.
- **[[anchor-shadow-of-mordor]]** — the nemesis system as emergent, remembered narrative.

Neighbors worth raiding: [[genre-stealth]] (the detection core), [[genre-metroidvania]] (verb-gated space), [[genre-action-adventure]] (the traversal+combat frame).

## Verify

Prove the systems, not the vibe. Reachability of every intended route belongs in a pure solver; the stealth detection and consequence model verify against **docs/FUN.md#5-·-stealth**. Feel and legibility are proven in JUICE/JUDGE, not asserted here.

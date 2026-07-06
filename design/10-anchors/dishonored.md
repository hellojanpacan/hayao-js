---
id: anchor-dishonored
title: Dishonored
kind: anchor
tags: [immersive-sim, stealth, player-expression, systemic, powers]
summary: Immersive sim where overlapping systems + a toolkit of powers make every problem solvable many ways — the world is a sandbox of verbs.
use-when: You want player expression through systemic interaction, not authored solutions.
composes-with: [genre-immersive-sim, mechanic-possess, system-emergent-systems]
anchors: [anchor-dishonored]
verify-with: docs/FUN.md#5-·-stealth
---

**What it is.** A first-person **immersive sim**: hand-crafted levels, a small toolkit of magical **verbs** (teleport, possess, freeze time, summon), and honest AI + physics that all obey the same rules the player does. The world doesn't script your route — it simulates, and you route through it.

**Player fantasy / why it's fun.** *This is my problem, and I own the solution.* The joy is the private plan you improvise — Blink to a rafter, possess a rat, drop under a door, freeze a bullet and step around it. The game never says "correct." It says "that worked."

## Design DNA (the compressed essence)

- **Consistent systems over authored answers.** Water, height, sightlines, unconsciousness, physics, and time all follow one rulebook. Powers plug into that rulebook, not into special-case triggers. See [[system-emergent-systems]].
- **The ≥3-answers contract.** Every meaningful obstacle has at least three honest solutions the designer verified — front door, side infiltration, over-the-top, straight murder. Player-chosen, not menu-chosen. Contrast [[antipattern-fake-choice]].
- **A verb toolkit, not a gear list.** Few powers, each a *general operator* that combines with every system. Depth is `verbs × systems`, not `count of items`. See [[system-build-diversity]], [[pattern-emergence]].
- **Honest, readable AI.** Guards have vision cones, hearing, alert states, and memory you can read and exploit. The stealth is a legible system, not a coin flip. See [[system-enemy-ai]], [[system-telegraphs]], [[pattern-readability]].
- **The world reacts and remembers.** Bodies, alarms, and a Chaos meter mean choices leave marks; the level and ending shift under how you played. See [[pattern-feedback-loops]], [[pattern-meaningful-choice]].

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **One rulebook** all actors share (player, AI, physics) | Emergence needs consistency — surprise only reads as *fair* when the world plays by rules you know. [[pattern-emergence]], [[pattern-fairness-and-trust]] |
| **General-operator powers** (Blink, Possess, Bend Time, Windblast) | Each verb multiplies against every system, so N verbs feel like N² tools. [[mechanic-teleport]], [[mechanic-possess]], [[mechanic-time-stop]] |
| **The ≥3-solution obstacle** | Guarantees expression: the level is a question, not a corridor. [[system-encounter-design]] |
| **Legible AI + stealth loop** (see→suspect→search→alert→forget) | Readable enemy state turns sneaking into a puzzle you solve live. [[system-enemy-ai]], [[system-telegraphs]] |
| **Consequence layer** (Chaos, body count, faction reactions) | Play *style* becomes narrative, closing the loop between verb and world. [[pattern-feedback-loops]], [[world-faction-identity]] |
| **Vertical, connected space** (rooftops, vents, under-paths) | Height and hidden routes are what make three answers physically exist. [[system-map-and-navigation]] |
| **Ghost / no-kill run as opt-in mastery** | A self-imposed constraint the systems support, extending replay for experts. [[pattern-mastery-and-flow]], [[system-mastery-curve]] |

## What to steal

- **The ≥3-answers contract as a design law.** Before an obstacle ships, name three honest solutions and prove each is reachable with the toolkit. If you can only find one, it's a corridor — see [[antipattern-fake-choice]], [[system-encounter-design]].
- **General verbs, not special items.** Ship 3-5 operators that each interact with *every* system. Refuse the drawer of single-use gadgets — that road ends at [[antipattern-feature-soup]].
- **A shared rulebook.** Make the player's powers, the AI's senses, and the physics run on the *same* systems. That's the seedbed for [[pattern-emergence]] and the guardrail against a scripted feel.
- **Readable enemy state.** Vision cones, alert tiers, and "last known position" you can see and outsmart. Legibility is the whole stealth game — [[system-telegraphs]], [[pattern-readability]].
- **A style-tracking consequence layer.** Let *how* the player solved things bend the world (an ending, a faction, the next level's density). Cheap to author, huge for ownership — [[pattern-feedback-loops]].
- **Vertical, over/under connectivity.** Every space wants a high route and a low route. Flat space kills the third answer.

## What's just theme (drop it)

- **The plague-ridden grimdark whaling city.** Atmosphere, not mechanism. Retheme freely — a heist manor, a candy factory, a coral reef. Keep the systems; see [[world-theme-vectors]], [[world-tonal-juxtaposition]].
- **First-person / realistic scale.** The DNA is systemic verbs, not the camera. Works top-down, 2.5D, or side-on with the same contract. See [[system-camera-and-controls]].
- **Magic as flavor.** "Powers" are just general operators. They can be gadgets, spells, hacks, or physics tricks — the fiction is skin.
- **The morality frame.** Chaos-as-guilt is one framing of the consequence layer; a heist's *heat*, a factory's *cleanliness*, or a garden's *balance* work identically. Framing ≠ mechanic.

## Composes into

- **Genres:** [[genre-immersive-sim]] (the home), [[genre-stealth]], [[genre-metroidvania]] (toolkit gates space), [[genre-action-adventure]], [[genre-sandbox-survival]].
- **Systems:** [[system-emergent-systems]], [[system-enemy-ai]], [[system-encounter-design]], [[system-build-diversity]], [[system-map-and-navigation]], [[system-quests-and-objectives]].
- **Patterns:** [[pattern-emergence]], [[pattern-meaningful-choice]], [[pattern-readability]], [[pattern-feedback-loops]], [[pattern-mastery-and-flow]].
- **Kin:** [[anchor-shadow-of-mordor]] (systemic enemies that remember), [[anchor-rimworld]] and [[anchor-minecraft]] (rulebook-driven emergence), [[anchor-into-the-breach]] (readable-state tactics).

## Twist seams

- **Dishonored but the powers are shared with the guards** *(perspective)* — the AI teleports, possesses, and freezes time too, so every route you plan, they can also walk. Stealth becomes a mind-game against equals; the level is a duel of the same verbs. Leans hard on [[system-enemy-ai]] and [[pattern-fairness-and-trust]].
- **Immersive sim but non-lethal is the only option, so tools are social** *(constraint)* — no kills, no knockouts; your "powers" are distraction, bribery, disguise, rumor, and misdirection. The obstacle is other minds, and the ≥3-answers contract runs on persuasion instead of violence. See [[system-dialogue-and-branching]], [[pattern-meaningful-choice]].
- **Dishonored but one verb, deeply** *(compression)* — ship only Possess (or only Blink) and let a whole game mine its interactions with every system. Depth from combinatorics, not from count. See [[mechanic-possess]], [[pattern-restraint-and-negative-space]].
- **Immersive sim but the world resets and remembers your last run** *(temporal)* — a looping day where guards learn the routes you used, forcing new solutions each cycle. Marries the ≥3-contract to [[anchor-outer-wilds]]-style knowledge progression.

## See also

- **Sibling anchors:** [[anchor-shadow-of-mordor]], [[anchor-rimworld]], [[anchor-minecraft]], [[anchor-outer-wilds]], [[anchor-disco-elysium]].
- **Core systems:** [[system-emergent-systems]], [[system-enemy-ai]], [[system-encounter-design]], [[system-build-diversity]].
- **Watch out for:** [[antipattern-fake-choice]] (routes that only look distinct), [[antipattern-feature-soup]] (gadget sprawl instead of general verbs), [[antipattern-false-depth]] (systems that never actually interact).
- **Process:** [[process-the-twist]] to spin a seam above, [[process-pillars]] to lock the ≥3-answers contract as a pillar.
- **Verify:** stealth legibility and the solve-it-many-ways feel are proven against `docs/FUN.md#5-·-stealth`, not asserted here.

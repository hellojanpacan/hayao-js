---
id: anchor-spelunky
title: Spelunky
kind: anchor
tags: [roguelite, systemic, emergent-chaos, platformer, fair-death]
summary: A systemic roguelite platformer where consistent rules + interacting hazards generate emergent, always-fair disasters.
use-when: You want emergent chaos from a small set of rigid, interacting systems.
composes-with: [genre-puzzle-platformer, pattern-emergence, system-procgen-design]
anchors: [anchor-spelunky]
verify-with: docs/FUN.md#10-·-traditional-roguelike
---

**What it is.** A procedurally-generated platformer where a handful of rigidly consistent objects — arrow traps, boulders, shopkeepers, bombs, snakes — collide with each other and with you to produce disasters no designer ever scripted. Death is total; the level is fresh every run.

**Player fantasy / why it's fun.** You are the sole author of your own catastrophe. Every death is a sentence you can finish: *I threw the bomb, it woke the shopkeeper, he shot me into the spikes.* Mastery is legible, so failure is fuel.

## Design DNA

- **Few rules, rigidly consistent.** Small object vocabulary. Each object does exactly one thing, everywhere, forever. No exceptions, no "unless."
- **Everything interacts.** Objects don't just coexist — they compose. Arrow trap fires arrow; arrow shoves boulder; boulder crushes snake; snake was your only threat. Emergence is the product of the interaction table, not of any single system.
- **Death is always your fault.** The world never cheats. Every hazard telegraphs, every rule is knowable, so the player internalizes blame — which is the same as internalizing *lessons*. See [[pattern-fairness-and-trust]].
- **The generator is a level *grammar*, not a shuffle.** Rooms are assembled from templates along a guaranteed path, then decorated with hazards. Solvability is structural, not hoped-for. See [[system-procgen-design]].

## Load-bearing structures

| Structure | Why it works |
|---|---|
| Rigid object rules (one verb each) | Consistency is what makes emergence *learnable* — the player can predict interactions because rules never bend. [[pattern-emergence]] |
| Interaction matrix (things act on things) | Depth comes from N objects × N objects, not from N features. The chaos is combinatorial, cheap to author. [[system-emergent-systems]] |
| The fairness contract (no unfair death) | Total loss is only tolerable if it's *earned*; telegraphs + knowable rules convert punishment into instruction. [[pattern-fairness-and-trust]] · [[system-telegraphs]] |
| Guaranteed-path generation | Procedural variety without unwinnable seeds; the grammar proves a route exists before decorating. [[system-procgen-design]] |
| The shopkeeper (a systemic NPC) | Turns a vendor into a *hazard with memory* — rob him and every future shopkeeper hunts you. Reputation as a rule, not a cutscene. [[system-enemy-ai]] |
| Bomb + rope (universal verbs) | Two tools that interact with *every* object and the terrain itself; expressive because they're general, not special-cased. |
| Permadeath + short runs | Raises stakes so each interaction *matters*, and resets fast enough that lessons compound. [[system-session-structure]] · [[system-save-and-checkpoint]] |
| Escalating hazard density per depth | Same grammar, more objects colliding — tension climbs without new rules. [[pattern-pacing-and-tension]] |

## What to steal

- **The hazard grammar: systemic, never scripted.** Author objects and their pairwise interactions; let the *level* be an accident of those rules. Do not hand-place "the hard part." If a moment feels authored, you're doing it wrong.
- **The fairness contract as a hard constraint.** Before shipping a hazard, ask: *could a knowledgeable player have avoided this?* If no, cut or telegraph it. This is the single rule that makes permadeath feel generous instead of cruel. Prove telegraph coverage against [[system-telegraphs]].
- **One verb per object.** Resist the urge to give the arrow trap a second behavior. Power comes from *combining* single-verb objects, and single verbs are what keep the interaction table legible.
- **Universal tools over special items.** A bomb that affects everything beats ten items that each affect one thing. General verbs multiply with the object set for free. Contrast with [[antipattern-feature-soup]].
- **Make the vendor a system.** An NPC that *remembers* and *reacts* by rule (not by script) turns economy into risk. See [[system-economy]] · [[pattern-risk-reward]].
- **Legible death.** The player must be able to reconstruct the causal chain in one sentence. If they can't, the hazard was unreadable — see [[pattern-readability]] and the anti-case [[antipattern-guess-the-designer]].

## What's just theme (drop it)

Nothing structural. The caves, the Mayan skins, the damsel, the Tunnel Man — pure dressing over the systemic core. **The systems ARE the game.** Reskin freely: the object-grammar works as a space station, a haunted library, a kitchen. What you must *not* drop is the rigidity: the instant one object gets a special-case exception, the emergence stops being learnable and the fairness contract breaks.

## Composes into

- **Genres:** [[genre-roguelike]] · [[genre-puzzle-platformer]] · [[genre-precision-platformer]] · [[genre-sandbox-survival]]
- **Systems:** [[system-procgen-design]] · [[system-emergent-systems]] · [[system-hazards-and-environment]] · [[system-spawn-directors]] · [[system-economy]] · [[system-difficulty-and-dda]]
- **Patterns:** [[pattern-emergence]] · [[pattern-fairness-and-trust]] · [[pattern-risk-reward]] · [[pattern-pacing-and-tension]]
- **Process:** run it through [[process-the-twist]] before you build — the object vocabulary is your knob.

## Twist seams

- **Spelunky but one screen, and the level rearranges as you play** *(structure)* — no scrolling descent; the room re-tiles itself around a fixed camera each time you act, so the *grammar* becomes a live puzzle you're always re-reading. The interaction table stays; the traversal becomes spatial reasoning. Compare the single-screen discipline of [[anchor-nuclear-throne]].
- **Systemic roguelite but coop where you are each other's hazard** *(perspective)* — two players share one physics space and one bomb radius; your teammate is now an object in the interaction matrix. The fairness contract must hold *between players*, not just world-to-player. See [[genre-coop-chaos]] · [[system-coop-and-competition]] · [[anchor-it-takes-two]].
- **Spelunky but the shopkeeper's memory is the whole meta-layer** *(system)* — persist NPC reputation across runs; the world's factions *learn* who you are. The systemic-NPC idea scaled to [[system-meta-progression]] and [[anchor-shadow-of-mordor]]'s nemesis logic.
- **Spelunky but deterministic seed-sharing is the sport** *(economy)* — same seed, race for the exit; emergence becomes a shared, comparable object. Leans on [[system-achievements-and-leaderboards]] and the daily-challenge loop.

## See also

- [[anchor-nuclear-throne]] — the same "always your fault" fairness on a twin-stick chassis.
- [[anchor-dead-cells]] · [[anchor-hades]] — roguelite descendants that trade some emergence for run-to-run [[system-meta-progression]].
- [[anchor-into-the-breach]] — perfect-information systemic hazards; fairness taken to full determinism.
- [[anchor-minecraft]] · [[anchor-terraria]] — the object-grammar scaled to an open world instead of a run.
- [[anchor-rimworld]] — systemic emergence where the *story* is the output, not the disaster.
- **Verify** the roguelite loop and fairness bar with `docs/FUN.md#10-·-traditional-roguelike`; the interaction chaos must still read cleanly under [[pattern-readability]].

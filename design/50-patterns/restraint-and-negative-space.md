---
id: pattern-restraint-and-negative-space
title: Restraint & Negative Space
kind: pattern
tags: [focus, subtraction, elegance, pillars, minimalism]
summary: Subtraction as design — what you leave out defines the game as much as what you add; every element must earn its place.
use-when: Your design is growing and you sense it should be smaller, not bigger.
composes-with: [process-pillars, antipattern-feature-soup, anchor-mini-metro]
anchors: [anchor-mini-metro]
verify-with: docs/FUN.md
---

**What it is.** Depth from few, well-chosen elements. You cut everything the [[process-pillars|pillars]] don't require, then tune what remains until it sings. The **absence** carries meaning: the empty rooms, the mechanic you didn't ship, the second button you refused.

**Why it's fun.** A small verb set the player fully understands becomes a language they can speak fluently. Mastery is legible — they can *see* the whole game and still be surprised by it. Elegance reads as respect for the player's time.

## The core move

One question, asked of every noun on the design doc:

> **Does this earn its place?** — does it serve a pillar, deepen an existing verb, or is it here because it seemed cool?

If the answer is "cool," cut it. Cool is cheap; **focus** is expensive. The discipline is not adding less — it's adding, testing, and then having the nerve to remove.

| Lever | What it does | Tune by |
| --- | --- | --- |
| **One-mechanic discipline** | Ship a single core verb; make everything a variation on it | Count your verbs — if a new player must learn 5 before playing, you have 4 too many |
| **Earn-its-place test** | Trace each element to a pillar; orphans get cut | Delete it in a build; if nobody misses it, it stays deleted |
| **Negative space** | Let silence, emptiness, and absence do work | Where does the game breathe? A screen with nothing on it is a design choice |
| **Depth over breadth** | Recombine few elements instead of adding new ones | Interaction count > element count is the goal |

## Why it works

- **Legibility.** The player holds the whole system in their head. [[pattern-readability|Readability]] is trivial when there's little to read.
- **Tunability.** Fewer elements means fewer interactions to balance; you can actually reach the [[antipattern-boring-optimal|no-dominant-line]] ideal. See [[process-refine-and-handoff]] — restraint is what makes refinement finite.
- **The twist lands.** A [[process-the-twist|twist]] is only visible against a clean background. Clutter drowns novelty.
- **Emergence gets room.** [[pattern-emergence|Emergent depth]] comes from few rules interacting — not many rules coexisting. [[anchor-baba-is-you|Baba Is You]] has a handful of words and infinite puzzles.

## Reference lines

- **[[anchor-mini-metro|Mini Metro]]** — draw a line, that's the verb. No text, no tutorial, no menus of upgrades. The negative space *is* the aesthetic; the map's emptiness makes the growing tangle legible.
- **[[anchor-tetris|Tetris]]** — seven pieces, one grid, gravity. Nothing has been added in forty years because nothing needs to be.
- **[[anchor-into-the-breach|Into the Breach]]** — perfect information, 8×8 grid, three mechs. It cut fog-of-war and army-building from the strategy genre and got a deeper game.
- **[[anchor-braid|Braid]]** — one time mechanic per world, never mixed. Each world is negative space around a single idea.
- **[[anchor-return-of-the-obra-dinn|Return of the Obra Dinn]]** — one verb (identify the dead), a two-color palette. The restraint of the whole thing *is* the elegance.
- **[[anchor-katamari|Katamari Damacy]]** — roll things up, get bigger. One rule, a whole cosmos of consequence.

## Twist seams

Restraint is a lens you point at another idea — the twist is *what* you refuse to add.

- **A deckbuilder but the deck never grows** (subtraction vector) — you only ever remove and upgrade cards, never add. Scarcity becomes the whole meta. Cf. [[genre-deckbuilder]], [[system-build-diversity]].
- **A survival game but with one resource** (compression vector) — no wood/stone/food/water spaghetti; a single meter you feed. Pairs against [[antipattern-currency-spaghetti]]; see [[system-resource-loops]].
- **A metroidvania but with no map screen** (removal vector) — navigation lives in your memory of the space, so levels must be legible by architecture alone. Cf. [[genre-metroidvania]], [[system-map-and-navigation]].
- **A tactics game but with no hit-points** (binary vector) — units live or die; every attack is lethal or nothing, so positioning is everything. See [[anchor-into-the-breach]], [[genre-tactics]].
- **A boss rush but one button** (input vector) — the entire skill ceiling lives in *timing* one input. See [[recipe-one-button-boss-rush]].

## Ties to the pillars

Restraint is the enforcement arm of [[process-pillars]]. The pillars say what the game *is about*; restraint is the willingness to act on that by cutting what isn't. A pillar you won't defend by cutting is just a wish. Run the loop: [[process-intent-to-brief|brief]] → pillars → this test → [[process-composition|compose]] the survivors.

## Overdone when

Restraint starves. Subtraction is a tool, not a religion — cut past the pillars and you get an empty, repetitive husk that reads as *unfinished*, not *elegant*.

| Symptom | Diagnosis | Fix |
| --- | --- | --- |
| Player exhausts the game in 20 minutes | You cut [[system-progression\|progression]] and [[system-mastery-curve\|mastery]] with the fat | Add depth *inside* the verb, not a second verb |
| "Minimalist" but boring | Restraint became [[antipattern-content-desert\|content-desert]] | Negative space needs something to be negative *around* |
| Every level feels identical | One mechanic, zero variation | Recombine and escalate the one verb — see [[pattern-escalation-and-payoff]] |
| Elegant but forgettable | You cut the [[pattern-surprise-and-delight\|surprise]] too | Keep one thing that breaks the pattern |

The elegant-but-empty failure is a real ceiling: [[anchor-mini-metro|Mini Metro]] survives on procedural escalation, not novelty. Without a rising [[pattern-pacing-and-tension|tension curve]], one mechanic goes stale fast.

## The opposite failure

The far more common sin is the other direction: adding because you can. That's [[antipattern-feature-soup]] — pillar-less accretion where every feature is defensible in isolation and the whole is mush. If you catch yourself justifying a feature by *"players might like it"* rather than *"a pillar needs it,"* you are already in the soup. Restraint is the antidote; [[antipattern-second-system]] is what happens when you forget it on the sequel.

Related failure modes restraint prevents: [[antipattern-false-depth]] (many shallow systems faking one deep one), [[antipattern-decision-paralysis]] (too many options, no clear read), [[antipattern-currency-spaghetti]] (resources multiplied past comprehension).

## Checklist

- [ ] Can you name the game's pillars in one breath? If not, cut until you can.
- [ ] Can a new player describe the core verb after 30 seconds? ([[system-onboarding]])
- [ ] Have you deleted at least one feature you were fond of?
- [ ] Does every screen have room to breathe, or is it wall-to-wall?
- [ ] Is your depth coming from *interactions* between few elements, not the *count* of elements? ([[pattern-emergence]])
- [ ] Did you keep exactly one thing that surprises? ([[pattern-surprise-and-delight]])

**Prove the restraint held.** A focused design is *felt*, and feel is verified downstream — check `docs/FUN.md` for the fun-loop gates. If the game reads as elegant on paper but plays as thin, the cut went too deep; if it reads as busy, it didn't go deep enough.

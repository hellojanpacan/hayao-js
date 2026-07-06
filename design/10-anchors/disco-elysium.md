---
id: anchor-disco-elysium
title: Disco Elysium
kind: anchor
tags: [rpg, dialogue, skills-as-voices, narrative, choice]
summary: An RPG where the stats are voices in your head — the build shapes what you can even perceive and say.
use-when: You want character-building expressed through dialogue and perception, not combat.
composes-with: [genre-visual-novel, system-dialogue-and-branching, world-character-design]
anchors: [anchor-disco-elysium]
verify-with: docs/FUN.md#21-·-narrative-decisions
---

**What it is.** A detective RPG with no combat: your **stats are named voices** (Logic, Empathy, Inland Empire, Electrochemistry…) that speak up unprompted, argue with each other, and unlock lines you literally cannot see if the skill is too low. You solve a murder by talking — to people, to objects, to your own necktie.

**Player fantasy / why it's fun.** You aren't controlling a character; you're **negotiating with one**. The pull is discovering *who you built* by watching which voice wins. A high-Empathy cop and a high-Electrochemistry cop walk into the same room and perceive two different rooms. The build is the character.

## Design DNA

- **Skills are speakers, not sliders.** A stat's job is to generate a **line of interior dialogue** with a point of view, not to add +2 to a roll you never read.
- **Your build changes what you can perceive.** Low skill = the option is invisible or garbled; the world redacts itself to fit who you are. This is the load-bearing trick — steal it.
- **Checks fail forward.** A failed roll is not a wall; it's a *worse, funnier, more revealing* branch. Failure is content, never a retry loop. See [[pattern-meaningful-choice]] and contrast [[antipattern-fail-loop-tax]].
- **The world remembers who you decided to be.** NPCs, objects, and the internal cast react to your stances, your archetype, your accumulated Thoughts.

## Load-bearing structures

| Structure | Why it works |
| --- | --- |
| **Skills-as-voices** — each stat is a character that interjects with attitude | Turns a number into a **perspective**; the sheet becomes a cast. Ties build directly to voice → [[world-character-design]] |
| **Perception gating** — options hidden/revealed by stat threshold | Two players see two games from one script; replay value with zero new content. Author via [[system-dialogue-and-branching]] |
| **Fail-forward checks** — a lost roll opens a branch, never a dead end | Removes save-scum pressure; makes the RNG *generative*. Design the odds with [[pattern-risk-reward]], keep it fair per [[pattern-fairness-and-trust]] |
| **White vs. Red checks** — retryable (skill-up) vs. one-shot (permanent) | Two stakes tiers: grind-able curiosity and irreversible consequence. Consequence permanence anchors [[system-quests-and-objectives]] |
| **Thought Cabinet** — internalize a belief over time for a stat swing + flavor | A build system made of *ideas*; slow-cooked buffs with narrative cost. A gentle [[system-skill-trees]] reskin |
| **Reactive world state** — the cast tracks your stances and archetype | Choices accrete into an identity the game reflects back. Delivery via [[world-narrative-delivery]] |

## What to steal

- **"Your build changes what you notice."** The single most portable idea. Any check with a hidden branch behind a threshold gets it: locked lines, phantom paths, an object that only "speaks" if you're built for it. Cheaper than branching *outcomes* — you're branching *visibility*.
- **Failure-as-content.** Author the failed branch *first*, and make it the more interesting one. A check the player *wants* to fail is the tell you nailed it.
- **Stats with a voice and an agenda.** Give each stat a name, a tone, and a bias. Let two of them disagree in front of the player and force a pick.
- **Two stakes tiers.** Retryable checks for texture, one-shot checks for scars. Mixing them keeps every roll from feeling load-bearing or throwaway.
- **Identity accretion.** Small stated stances compound into an archetype the world names back at you.

## What's just theme (drop it)

- **The 1970s-Soviet-collapse melancholy.** Atmosphere, not mechanism. Your world can be anything → set the vector with [[world-theme-vectors]] and [[world-mood-and-atmosphere]].
- **24 skills.** The count is *density for a 60-hour game*. At small scope, **6–8 voices** is plenty; more is [[antipattern-decision-paralysis]] and content you can't author.
- **Isometric painterly art / voice acting.** Production cost, not the design. The trick survives in pure text.
- **The murder plot.** The mystery is a *container* for the checks, not the mechanic. Any pretext that generates conversations works.

## Composes into

- [[genre-visual-novel]] — the natural home: text-first, choice-driven, no combat loop to carry.
- [[genre-narrative-decisions]] and [[genre-walking-sim]] — when the whole game *is* the talking.
- [[genre-immersive-sim]] — skills-as-perception layers cleanly onto a systemic world where stats also gate physical solutions.
- [[system-dialogue-and-branching]] + [[system-quests-and-objectives]] — the machinery underneath; author gated lines and consequence-tracking here.
- [[system-build-diversity]] — the payoff: distinct builds should read as *distinct playthroughs*, not distinct numbers.

## Twist seams

- **Disco but the voices are other players advising you** *(perspective)* — replace the internal cast with live or asynchronous whispers from past players. Each "skill" is a crowd of humans who once stood here; you pick whose advice to trust. Turns the sheet into a [[pattern-surprise-and-delight]] séance. Cousins with [[anchor-return-of-the-obra-dinn]]'s echoes.
- **Skills-as-voices but they argue and you pick who to believe** *(structure)* — surface the disagreement as an explicit UI: two voices give opposing reads, and *choosing which to trust* is the move, not a background flavor line. The check becomes "who do you believe," and being wrong is [[pattern-risk-reward]] content.
- **Perception-gating but for a co-op pair** *(structure)* — two players built differently see two halves of the same scene and must talk to reconcile them. See [[anchor-it-takes-two]] for the asymmetric-perception co-op backbone.
- **Fail-forward but the failures compound into your ending** *(consequence)* — every lost check leaves a mark, and the finale is *assembled from your failures*, not your successes. Leans on [[system-save-and-checkpoint]] state and [[pattern-escalation-and-payoff]].

## See also

- [[anchor-reigns]] — choice-as-whole-game at the opposite scope: two swipes, no stats, same "the world reacts to who you are" spine.
- [[anchor-papers-please]] — moral weight from a tight loop; systems-as-storytelling without an RPG sheet.
- [[anchor-return-of-the-obra-dinn]] — deduction-driven, world-as-story; a sibling in "figure out what happened by looking hard."
- [[recipe-detective-deduction-board]] — a build recipe when the *mystery* is the point and you want the deduction structure prebuilt.
- [[world-narrative-delivery]] · [[world-character-design]] · [[system-dialogue-and-branching]] — the three docs you'll live in to build this.
- Prove the choices land in `docs/FUN.md#21-·-narrative-decisions`; a fake branch fools no one → [[antipattern-fake-choice]].

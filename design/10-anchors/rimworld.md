---
id: anchor-rimworld
title: RimWorld
kind: anchor
tags: [colony-sim, story-generator, ai-director, emergent, drama, pacing, simulation]
summary: A colony sim built as a story generator — an AI director paces crises against your state so the *narrative*, not a win screen, is the product.
use-when: The design wants players to leave with stories, not scores; you need a director that authors drama over a deep sim.
composes-with: [genre-city-builder, system-emergent-systems, system-difficulty-and-dda, system-enemy-ai, system-resource-loops]
anchors: []
verify-with: design/FUN.md#17-citycolony-builder
---

# RimWorld

**What it is.** A colony sim whose real product is **stories**. You keep a handful
of flawed characters alive on a hostile map, but the game's genius is the **AI
storyteller** — a director that watches your state and *paces* raids, disasters,
and lulls to build tension and release like a screenwriter, not a random-event
table. You don't win RimWorld; you *tell someone about* your RimWorld.

**Player fantasy.** The anecdote you can't wait to share: the pyromaniac who
saved the colony, the winter you ate your own dead. The pull is that every crisis
lands on *characters you know*, and the director times them so the disaster
arrives exactly when it'll hurt — and mean — the most.

## Design DNA

Fun here is **emergent narrative** — story as the output of interacting systems,
not authored scenes. Two engines make it work. First, a deep, legible **sim of
needs and traits** (mood, injuries, relationships, resources) so consequences
*chain* into stories. Second, an **AI director** ([[system-emergent-systems]],
[[system-difficulty-and-dda]]) that reads your current state and schedules events
for *dramatic* effect — hit you when you're strong, breathe when you're
reeling — turning a difficulty curve into a plot. The characters are the stakes;
the director is the author; the sim is the ink.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **AI storyteller / director** | Paces events against live state (wealth, health, morale) for tension→release, not flat randomness. The heart. → [[system-difficulty-and-dda]]. |
| **Characters with traits & relationships** | Named pawns with quirks and bonds make every consequence *personal* — the stakes that turn events into stories. → [[system-emergent-systems]]. |
| **Deep need/mood sim** | Hunger, sleep, mood, breaks; needs interact and cascade (a bad meal → a tantrum → a fire). Consequence chains = plot. |
| **Interacting subsystems** | Medicine, temperature, food, defence, social — each affects the others; second-order events emerge nobody scripted. → [[pattern-emergence]]. |
| **No win state** | Open-ended survival; the "goal" is the story you generate, which removes the "solved, done" cliff. → [[system-session-structure]]. |
| **Legible cause-and-effect** | You can always trace *why* it went wrong — the story is coherent, so it's tellable. → [[pattern-readability]]. |

## What to steal

- The **director-as-author**: schedule events against player state for dramatic
  shape (strike when strong, relent when reeling), not uniform randomness. This is
  the single most stealable idea here. → [[system-difficulty-and-dda]].
- **Named, flawed characters** as the stakes: a trait/relationship layer turns
  "a unit died" into "*Grigori* died." Personalisation is what makes emergence
  *tellable*. → [[system-emergent-systems]].
- **Consequence chains**: design needs/systems that *cascade*, so one bad event
  spawns three — the raw material of story.
- **Traceable failure**: keep cause-and-effect legible (FUN.md §17: the exposed
  score) so the player can narrate what happened.

## What's just theme (drop it)

- The **sci-fi frontier** setting — the loop is a survival colony of *anything*
  (a ship, a village, an office, a hive). Theme is a [[world-theme-vectors]] pick.
- **The specific event menagerie** (raids, blights, solar flares) — those are
  content slotted into the director; the *director* is the transferable part.
- **Top-down colony-management UI** — one presentation of "watch a system, nudge
  it." A card game or a text log could host the same director.
- **Real-time-with-pause** — the sim can be turn/tick-based; timing is sim time
  (FUN.md law 6), and pausing to think is a [[system-save-and-checkpoint]] concern.

## Composes into

- [[genre-city-builder]] — the parent colony/management genre (the exposed score,
  negative synergies).
- [[system-emergent-systems]] — RimWorld is the canonical *story-generator* case:
  memory, relationships, and reputation producing systemic narrative.
- [[system-difficulty-and-dda]] — the storyteller is dynamic difficulty *as
  drama*, not just as a fairness knob.
- [[system-enemy-ai]] — raiders/threats the director deploys.
- [[pattern-emergence]] — interacting subsystems as the source of unscripted story.

## Twist seams

- **RimWorld but one character** *(perspective / constraint)* — no colony; the
  director paces a single life's crises. The story-generator shrinks to a memoir.
- **RimWorld but the director is visible and adversarial** *(mechanic-swap)* — the
  storyteller is a named opponent you can bargain with or sabotage; drama becomes
  a duel. Pairs with [[genre-narrative-decisions]].
- **RimWorld but cozy** *(tonal)* — strip lethality; the director paces *heart-warming*
  beats (a wedding, a harvest, a reunion) instead of raids. Pairs with
  [[anchor-stardew-valley]].
- **RimWorld but swipe-to-decide** *(structure)* — collapse the sim into
  card-choices the director deals from colony state. Pairs with [[anchor-reigns]].

## See also

- [`design/FUN.md#17-citycolony-builder`](../FUN.md) — the exposed score;
  negative synergies create the only real decisions; scoring-honesty audit.
- [[system-emergent-systems]] · [[system-difficulty-and-dda]] ·
  [[anchor-shadow-of-mordor]] (the other systemic-memory anchor).

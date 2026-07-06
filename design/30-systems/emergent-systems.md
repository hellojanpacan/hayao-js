---
id: system-emergent-systems
title: Emergent Systems
kind: system
tags: [emergence, nemesis, memory, relationships, reputation, systemic-story, story-generator, second-order]
summary: Nemesis-style memory, relationships, and reputation — systemic story generators where the game remembers you and interactions author drama.
use-when: You want stories the designer didn't script — rivalries, grudges, and reputations that arise from the player's own play.
composes-with: [system-enemy-ai, system-faction-asymmetry, pattern-emergence, world-narrative-delivery]
anchors: [anchor-shadow-of-mordor, anchor-rimworld]
verify-with: docs/FUN.md#7-pure-data-state-pays-compound-interest
---

# Emergent Systems

**What it is.** Systems that **remember and relate** so the game authors stories no
designer wrote. The exemplar is Shadow of Mordor's **nemesis system**: an orc that
kills you gets promoted, scars, and a grudge — and when you meet again, *the game
remembers*. The family includes relationships (who likes whom), reputation (how the
world treats you), and any **systemic memory** that turns a one-off event into an
ongoing thread.

**Player fantasy / why it's fun.** *A story that's mine because it happened to me.*
Emergent drama beats scripted drama on ownership: the rival who humiliated you three
runs ago carries weight no cutscene can. The pull is a world that reacts to your
history, not a script that ignores it.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Replayability + memorable specific antagonists/allies | A tight linear story — scripting owns it |
| The world should react to *your* history | Pure skill games where memory adds noise, not meaning |
| You want stories from interaction, not authoring | You can't afford the systemic-consequence budget (it must *ripple*) |

> **Memory only matters if it changes play.** A tracked grudge that never alters an
> encounter is a stat, not a story. The nemesis is fun because the promoted orc is
> genuinely *tougher and taunts you* — the memory has mechanical teeth
> ([[process-the-twist]]: cosmetic signatures don't carry a game).

## Variants

| Variant | Remembers | Expresses as | Anchor |
|---|---|---|---|
| **Nemesis / rival** | who bested/fled whom | promoted, scarred, taunting foes | [[anchor-shadow-of-mordor]] |
| **Relationship web** | who likes/loathes whom | mood, cooperation, feuds | [[anchor-rimworld]] pawns |
| **Reputation** | your deeds toward a group | prices, aggression, access | RPG factions |
| **World state memory** | choices & consequences | changed places, remembered NPCs | narrative games |
| **Ecology / rivalry** | predator/prey, territory | shifting balance you disturbed | sim sandboxes |

## Tuning levers

| Lever | Effect | Watch for |
|---|---|---|
| **Memory salience** | how much the game references history | too little = forgettable; too much = nagging |
| **Consequence magnitude** | how hard memory hits play | cosmetic memory = no story; brutal = punishing |
| **Promotion/decay rules** | how relationships evolve | no decay = the web ossifies |
| **Legibility of memory** | can the player *see* the history? | invisible memory reads as randomness |

## How it wires to Hayao

- **Memory is pure data.** Grudges, relationships, and reputation are plain JSON in
  `world.state`, advanced through `dmath`, rolled through `world.rng` — so a
  nemesis roster is part of `world.hash()`, saves, and replays for free (FUN.md
  law 7). "Pure-data state pays compound interest": the *same* property that makes
  a story generator deterministic makes it save/loadable and testable.
- **The behavior hangs off [[system-enemy-ai]].** A promoted rival is an archetype
  with a memory-derived stat block and a targeting bias toward *you* — same brain,
  history-tuned numbers.
- **Ordered iteration is mandatory.** Relationship/promotion resolution must iterate
  in a deterministic order (by id), never by insertion or hash order, or the story
  diverges between machines (CLAUDE.md invariant 2).
- **Expression is often systemic narrative** — the memory shows up in the world,
  not a text dump ([[world-narrative-delivery]]).
- **A director can dramatize it.** `pollDirector` ([[system-difficulty-and-dda]])
  can weight spawns toward a remembered rival's return.

## Fails when…

- **Memory with no mechanical consequence.** A tracked history that never changes an
  encounter is a spreadsheet, not a saga.
- **Non-deterministic resolution.** Iteration-order or wall-clock in the memory
  update breaks `world.hash()` and desyncs the story.
- **Illegible memory.** If the player can't perceive *why* a foe hates them, the
  emergent story reads as random difficulty ([[pattern-readability]]).
- **Runaway feuds.** No decay or bounds and relationships spiral into an unreadable
  tangle ([[pattern-feedback-loops]]).
- **Over-narration.** The system reminding you of every past event constantly kills
  the surprise it exists to create.

## Verify

- **Determinism of the story:** golden-hash a scripted multi-run sequence; the
  nemesis/relationship state must replay bit-exactly
  ([FUN.md law 7](../../docs/FUN.md#part-1--universal-laws)).
- **Save round-trip:** snapshot→restore→hash the memory state — a rivalry survives a
  save intact (CONVENTIONS; [[system-save-and-checkpoint]]).
- **Consequence delta:** assert a remembered rival is measurably harder / behaves
  differently than a fresh spawn — memory has teeth (FUN.md law 2 skill-delta shape).
- **Bounded evolution:** relationship/reputation values stay inside bounds across a
  long sim (no runaway, per [[pattern-feedback-loops]]).

## Composes with

- [[system-enemy-ai]] — the behavior a memory-tuned rival runs.
- [[system-faction-asymmetry]] — reputation and relationships across distinct groups.
- [[pattern-emergence]] — the second-order design this is the flagship case of.
- [[world-narrative-delivery]] — how the remembered story reaches the player.
- [[system-difficulty-and-dda]] — a director can stage a rival's return.

## See also

- [`docs/FUN.md` law 7](../../docs/FUN.md#part-1--universal-laws) — pure-data state as the enabler.
- [[anchor-shadow-of-mordor]] — the nemesis system, distilled.
- [[anchor-rimworld]] — relationships + a director as a story engine.

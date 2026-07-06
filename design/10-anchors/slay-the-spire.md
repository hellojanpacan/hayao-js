---
id: anchor-slay-the-spire
title: Slay the Spire
kind: anchor
tags: [deckbuilder, roguelike, draft, map-choice, synergy, deck-thinning, run-based]
summary: The roguelike deckbuilder — every card is a draft-of-3-or-skip, every fight thins or thickens your deck, and the map is a route of risk you choose in advance.
use-when: Designing a run where the player's growing toolkit (a deck) IS the strategy, refined choice by choice against escalating threats.
composes-with: [genre-deckbuilder, system-build-diversity, system-procgen-design, system-reward-schedules]
anchors: [anchor-slay-the-spire]
verify-with: docs/FUN.md#11-·-roguelike-deckbuilder
---

# Slay the Spire

**What it is.** Climb a branching map, fighting turn-based card battles. After
each fight, draft one card of three (or skip). Your deck is your build; the
run is one long refinement of it against enemies whose damage you can read in
advance.

**Player fantasy / why it's fun.** *I am sculpting a machine and watching it
come alive.* The pull is **the deck as an evolving strategy**: a pile of weak
cards slowly becomes an engine, and the moment two cards click into a combo is
the whole genre's dopamine. Every choice — which card, which path, which relic
— compounds.

## Design DNA

Make **the growing toolkit the game**. The player doesn't level a character;
they *curate a deck*, and every reward is a fork: take this card (and dilute
your draw) or skip it (and stay lean). Wrap that in a **route of pre-visible
risk** — a branching map where you choose your fights, elites, shops, and
rests before you take them — and escalating enemies whose intents are *shown*,
so losing is a planning failure, not a coin flip.

The magic is **subtractive as well as additive**: a good deck is often a
*small* deck. Thinning is a strategy, not just adding. This is the
counter-intuitive core — most progression systems only grow, so "the reward
you decline" and "the card you delete" are dead concepts. Slay the Spire makes
*both* live decisions: the skip has teeth because every card you add dilutes
the odds of drawing the ones you already want, and card-removal at shops is
often the strongest purchase. Power is a function of *consistency*, and
consistency is a function of *restraint*.

Every layer — the draft, the map, the relics, the energy budget — is a
decision made against *incomplete future information but perfect present
information*. You never know the next reward, but you always know exactly what
this fight will do.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Draft-of-3-with-skip** | Every reward is a real decision — including the decision to *not* dilute. The skip is what makes drafting have teeth. FUN.md truth. [[system-reward-schedules]]. |
| **Deck as build; thinning matters** | Power comes from *composition*, not stats. Removing weak cards is as strong as adding good ones. [[system-build-diversity]]. |
| **Pre-visible branching map** | You choose the route (elite for a relic? shop? rest?) before committing — [[pattern-risk-reward]] made spatial. [[system-procgen-design]]. |
| **Telegraphed enemy intents** | Each enemy shows next-turn damage/effect; combat is a solvable puzzle, not a gamble. Intent honesty is CI (FUN.md). [[system-telegraphs]]. |
| **Relics = passive multipliers** | Persistent modifiers that warp the whole run's math and reward committing to an archetype. [[pattern-emergence]]. |
| **Energy as the real constraint** | Cards are cheap; the per-turn energy budget forces every hand into a small optimisation. [[system-economy]]. |
| **Win-rate window as the balance instrument** | Tune to a band (e.g. 11–19/20), not a point — both "too hard" and "too easy" break CI. |

## What to steal

- **Draft-of-N *with a skip*.** The skip converts "free reward" into
  "meaningful decision." Steal this into any progression, not just cards.
- **Make composition the power, and let subtraction be a strategy.** A leaner
  deck/loadout should sometimes beat a bigger one.
- **A pre-visible route of risk.** Show the map's fights/rewards ahead; make
  the player commit to a path. This is portable to any run structure.
- **Telegraphed intents** so every fight is solvable. Assert intent honesty as
  a one-line audit (FUN.md).
- **Balance to a win-rate window** (e.g. 11–19/20), not a point — both edges
  break CI, since "too easy" is as broken as "too hard." Assert the draft
  delta: same pilot drafting-off must lose far more (FUN.md's 17→9).
- **A per-turn budget (energy) as the real constraint.** Cards being cheap to
  acquire but limited to play per turn means every hand is a small
  optimisation puzzle — the budget, not the card pool, is where tactical depth
  lives. See [[system-economy]].

## What's just theme (drop it)

- **The spire / the Ironclad-Silent-Defect fiction.** Cosmetic; the loop is
  theme-agnostic.
- **Playing *cards* specifically.** The structure is "draft-refine a personal
  toolkit of single-use actions." It could be spells, dishes, dance moves —
  see [[system-build-diversity]].
- **The relic art and names.** *Passive run-warping modifiers* is structural;
  the trinkets are flavour.
- **Fantasy monsters.** Any enemy that can *show its next move* satisfies the
  telegraph truth — [[system-telegraphs]].

## Composes into

- [[genre-deckbuilder]] — its canonical anchor; the draft-refine loop lives
  there.
- [[system-build-diversity]] — deck-as-build with meaningful thinning.
- [[system-procgen-design]] — the branching, pre-visible map.
- [[system-reward-schedules]] — draft-of-3-with-skip cadence.
- [[system-telegraphs]] — intent-driven, solvable combat.

## Twist seams

- **Slay the Spire but the deck is shared and you draft *against* an
  opponent** *(perspective)* — every skip becomes a card denied to them; the
  route is a contested board. Pushes toward [[system-coop-and-competition]].
- **Slay the Spire but the map is the deck** *(mechanic-swap)* — you draft
  *rooms* onto a path and then walk them; placement is the build. This is the
  [[anchor-loop-hero]] bend.
- **Slay the Spire but you can only ever hold 10 cards — every add forces a
  cut** *(constraint)* — makes thinning mandatory, not optional; the whole run
  is a rolling replace-decision. Sharpens the subtractive pillar into the core
  verb.
- **Slay the Spire but tonal — the deck is a diplomatic hand and fights are
  negotiations** *(tonal)* — recolor combat as conversation; "damage" is
  persuasion, "block" is patience, intents are the other party's next
  argument. Keeps the draft-refine spine, swaps violence for stewardship.
  Pairs with [[genre-narrative-decisions]].

## See also

- [[genre-deckbuilder]] · [[anchor-balatro]] · [[anchor-loop-hero]] ·
  [[system-telegraphs]]
- `docs/FUN.md#11-·-roguelike-deckbuilder` — win-rate window + draft-delta +
  intent audit.
- `examples/lanternfold/` — generated, all-channels reference (drafted content
  pipeline).
- `sandboxes/procgen-lab/` — `Rng`/`pickEntry` for weighted card & map
  generation.

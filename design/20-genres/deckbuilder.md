---
id: genre-deckbuilder
title: Roguelike Deckbuilder
kind: genre
tags: [deckbuilder, cards, draft, synergy, roguelike, build, win-rate]
summary: Drafts with teeth — a deck that evolves run-to-run, where the draft delta is provable and every spike is blockable in principle.
use-when: You want a run-based card game where the deck is the strategy and picking cards well is the whole skill.
composes-with: [system-build-diversity, system-reward-schedules, system-meta-progression, system-procgen-design, system-status-effects, system-telegraphs]
anchors: [anchor-slay-the-spire, anchor-balatro]
verify-with: docs/FUN.md#11--roguelike-deckbuilder
---

# Roguelike Deckbuilder

**What it is.** A run-based game where your **deck is your build**. You start
with a weak pile, and after each fight you **draft** a card (usually 1 of 3, with
a skip) — so the deck *becomes* a strategy over the run. Fights are the pressure
test; the draft is the decision.

**Player fantasy / why it's fun.** *"I built this engine one card at a time and
watched it come online."* The pull is the draft with teeth: each pick is a
commitment, synergies compound, and a deck clicking into a combo is the payoff.

## Pillars

1. **Drafts with teeth.** The reward-of-3-with-a-skip is the core decision.
   Picks must matter — the same pilot drafting *off* must lose far more (the
   17→9 delta). If any card is fine, drafting isn't a skill.
2. **Spikes are blockable in principle.** Incoming damage must be answerable —
   spike dmg ≤ block ceiling + heal — or a fight is a coin flip, not a puzzle.
   Perfect telegraph honesty: what's shown is exactly what resolves.
3. **Balance is a win-rate window.** The health instrument is a *range* (e.g.
   11–19 of 20), not a target. Both edges break: too-easy AND too-hard are bugs.

## The loop stack

| Scale | The beat |
|---|---|
| **Moment** | Play a card from hand: read the telegraph, spend energy, resolve — the choreography returns. |
| **Encounter** | A fight: your deck's engine vs an enemy's telegraphed intents; block/attack/status math. |
| **Session** | A run: map choice → fights → draft rewards → shape the deck → boss. Thin vs wide is the arc. |
| **Meta** | Unlock cards/characters, add to the pool; carry archetype knowledge between runs. |

## Essential systems

| System | Why it's load-bearing |
|---|---|
| [[system-build-diversity]] | Multiple viable deck archetypes; the reason to re-run. Making many strategies work. |
| [[system-reward-schedules]] | The card-reward-of-3, relics, shop, rare drops — the draft cadence and its pull. |
| [[system-status-effects]] | Poison/block/vulnerable/strength — the stacking rules that create combos. |
| [[system-telegraphs]] | Enemy intents shown ahead; the honesty that makes fights plannable, not luck. |
| [[system-procgen-design]] | Seeded map, reward, and enemy variance — each run a fresh hand of choices. |

## Content & difficulty model

- **Content is the card pool + relics + enemy intents.** Depth is *interactions*
  (synergy engines), not raw card count. A small pool with deep combos beats a
  big pile of vanilla cards.
- **Tune the goal to the measured win-rate**, not mechanics to a fixed goal — run
  a greedy pilot, place the window, adjust rewards/enemy math to land inside it.
- **Draft delta is the proof.** Same pilot, drafting on vs skipping, must show a
  large gap (17/20 vs 9/20). If null drafting competes, the draft is
  decorative.
- **Intent honesty is a one-line audit.** Resolve each telegraph, compare to the
  shown number — they must match exactly (law 6 / perfect-info honesty).
- **Meta adds cards, not power.** Unlocks widen the pool; guard against the deck
  being decided at the menu. See [[system-meta-progression]].

## Signature-mechanic seeds

- **Deckbuilder but hands score like poker** *(mechanic-swap)* — Balatro's
  bend: the multiplier engine, not the fight, is the number-go-up. Pairs
  [[anchor-balatro]].
- **Deckbuilder but the enemy drafts from your discards** *(structure)* — your
  cast cards arm the boss; deck-thinning becomes a defensive art.
- **Deckbuilder but one card, played, is gone forever** *(constraint)* — a
  scarcity deckbuilder; every play is a spend, hoarding stalls you.
- **Deckbuilder but cards are inked and fade** *(theme + tonal)* — Kentō
  woodblock cards that wear with use; the deck is a weathering artifact.
- **Deckbuilder but two players share one deck** *(perspective + coop)* —
  alternating draws, one strategy; drafting is negotiation. Pairs
  [[system-coop-and-competition]].

## Common pitfalls

- **Every card is fine.** With no bad picks, drafting has no teeth. Some cards
  must be traps in the wrong deck.
- **Unblockable spikes.** Damage past the block ceiling turns fights into coin
  flips. Keep spikes answerable in principle.
- **Single dominant archetype.** If one build always wins,
  [[system-build-diversity]] failed and replay dies.
- **Dishonest intents.** A telegraph that resolves to a different number breaks
  the plannability the whole genre rests on.
- **Balancing to one edge.** Tuning only against "too hard" ships a too-easy
  game; the window has two walls.

## Anchors

- [[anchor-slay-the-spire]] — the reference: draft-of-3, map choice, deck-as-
  evolving-strategy. Steal the whole spine.
- [[anchor-balatro]] — the score-multiplier variant; steal the joker-synergy
  "number goes up" juice for a scoring-first bend.

## Verify

Prove it in **[FUN.md §11 · Roguelike
deckbuilder](../../docs/FUN.md#11--roguelike-deckbuilder)**: a greedy pilot lands
in the win-rate window, a never-draft pilot falls below it, the intent audit
matches, and a golden climb hash replays.

## Composes with

- [[system-build-diversity]] — the multiple viable archetypes that carry replay.
- [[system-reward-schedules]] — the draft cadence and its ethical pull.
- [[system-status-effects]] — the stacking rules that make synergy engines.

## See also

- [`sandboxes/procgen-lab`](../../sandboxes/procgen-lab) — seeded map/reward
  variance wiring.
- [`examples/sokoban`](../../examples/sokoban) — pure-state resolution + returned
  choreography; a card fight is the same pattern (law 6, 7).

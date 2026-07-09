---
id: recipe-cozy-deckbuilder
title: Cozy Deckbuilder
kind: recipe
tags: [deckbuilder, cozy, no-fail, recipe, composition]
summary: Slay-the-Spire's draft-and-build with the stakes removed — a gentle, no-death deckbuilder about tending, not surviving.
use-when: You want deckbuilding depth in a calm, no-fail wrapper.
composes-with: [anchor-slay-the-spire, genre-deckbuilder, genre-farming-sim, process-the-twist]
anchors: [anchor-slay-the-spire, anchor-stardew-valley]
verify-with: design/FUN.md#11-·-deckbuilder
---

# Cozy Deckbuilder

**What it is.** A [[genre-deckbuilder]] where you never die and nothing attacks
you. You draft cards and play hands, but the target of every card is a **garden**
you're growing — not an enemy you're killing. The draft has teeth; the loop has
no fangs.

**Player fantasy / why it's fun.** *"I built a little engine, and now my garden is
blooming because of it."* The dopamine of a synergy clicking into place, minus the
dread of a boss that undoes your run. You play to make something grow, and the
worst outcome is *slower*, never *dead*.

## The brief

**Slay the Spire but cozy.** Same draft-and-build spine — a weak starter deck that
becomes a strategy one card at a time — bent so the pressure test is *tending*, not
*surviving*. Cards feed a board that only ever improves.

## Anchors

- **[[anchor-slay-the-spire]]** — the load-bearing structure: draft-1-of-3, energy
  economy, deck-as-build, a run that compounds. Steal the *engine*, drop the death.
- **[[anchor-stardew-valley]]** — the tonal register and the goal shape: a warm,
  open-ended tend loop where progress is a place getting nicer, not a bar hitting
  zero. Steal the *calm* and the *because-of-me* growth.

## Genre + systems pulled

Compose, don't restate — each link carries the mechanics.

| Module | What it contributes |
|---|---|
| [[genre-deckbuilder]] | The draft, the deck-as-build, the hand-per-turn loop, the synergy hunt. |
| [[genre-farming-sim]] | The calm core loop: a persistent board you improve, seasons, no clock forcing you. |
| [[system-collectibles]] | Cards, seeds, and garden tiles as the thing you *gather* — the pull to keep drafting. |
| [[system-resource-loops]] | Water / sun / soil as the currencies cards spend and generate — the engine's fuel. |
| [[system-reward-schedules]] | Steady, legible growth beats after every hand; no dry stretches, no punishment beats. |
| [[system-progression]] | The garden itself is the progress bar — new plots, new card tiers, new synergies unlock as it fills. |

## The twist applied

Primary vector: **tonal** (per [[process-the-twist]] — horror→cozy is the classic;
here it's roguelike-survival→cozy-tending). One flip — *remove the opponent* — and
every system reorganizes around growth instead of attrition. Secondary vector:
**mechanic-swap** — the "attack" verb becomes a "plant/tend" verb, and "block"
becomes "protect from frost."

The signature mechanic is **the garden board as the target of every card.** No
damage numbers on a monster; there are *growth* numbers on a plot. Make that legible
in one screenshot (see [[pattern-readability]]) and the pitch reads itself.

Twist seams to reach for:

- **Slay the Spire but you never die** *(constraint: remove the fail state)* — a run
  that only ends when *you* decide the garden is done, or a season closes gently.
- **Balatro but the score is a blooming meadow** *(tonal + mechanic-swap)* — poker-hand
  scoring recolored as watering; the number going up *is* the garden filling in.
- **Stardew Valley but a whole day is one hand of cards** *(structure)* — the farming
  loop compressed into deckbuilding turns, so a session is short and complete.

Guardrails — a no-fail loop is where tension usually leaks out, so watch:

- **[[antipattern-boring-optimal]]** — with no threat, a single dominant card line
  goes unpunished. Give the *garden* soft goals (bloom this before that) so draft
  choices still trade off. See [[pattern-risk-reward]] for stakes without death.
- **[[antipattern-content-desert]]** — cozy games live long; a thin card pool
  exposes fast. Lean on [[system-build-diversity]] and procgen'd garden layouts.
- **[[antipattern-currency-spaghetti]]** — three cozy resources max. Water, sun,
  soil. No fourth.

## The 3 pillars

Per [[process-pillars]] — every card, tile, and season must serve one of these:

1. **Draftable depth.** The 1-of-3 draft *matters* — synergies, tiers, and payoffs
   that reward planning. The deck is a real build, not a slideshow.
2. **Zero punishment.** No death, no timer that fails you, no run wiped by a bad
   draw. The floor is "slower," never "over." Assist and grace are the default
   (see [[system-grace]], [[system-accessibility]]).
3. **Satisfying growth.** Every hand visibly nudges the board — a plot greens, a
   flower opens, a plot unlocks. Progress you can *see*, choreographed (see
   [[pattern-juice-choreography]]).

If a proposed feature serves none of the three, cut it ([[antipattern-feature-soup]]).

## Scope & first playable

The smallest thing that proves the fantasy — build *this*, then widen.

| Slice | First playable |
|---|---|
| Deck | One starter deck, ~12 cards, ~2 synergy lines (e.g. *water-engine* vs *pollinator*). |
| Board | One garden, ~9 plots, 3 growth stages per plot. |
| Resources | Two currencies to start (water, sun); add soil only if depth demands it. |
| Draft | Draft-1-of-3-with-skip after each hand; ~20-card unlockable pool. |
| Win | **Win by tending** — fill the board to full bloom. No lose condition; a season may end softly and bank progress. |
| Session | One garden = one sitting (~10 min). Complete, calm, repeatable. |

First-playable test: a new player finishes one garden, *smiles*, and immediately
wants a second run with a different draft. That's the loop working
([[process-core-loop]]). Everything past that — seasons, a village, more decks — is
[[process-refine-and-handoff]] territory.

## Handoff

Prove it where the mechanics get judged, don't re-argue it here:

- **[design/FUN.md#11-·-deckbuilder](../FUN.md)** — the deckbuilder fun-gate:
  is the draft delta real, is every hand a decision, does the deck become a build?
  A cozy deck still has to pass this — *calm is not an excuse for a flat draft.*
- **The no-fail loop** — verify the reward cadence never dries and the floor is
  always "slower, not dead." Lean on [[system-reward-schedules]] and
  [[pattern-pacing-and-tension]] to keep tension present without a threat.

## Composes with

- [[genre-deckbuilder]] — the spine; this recipe *is* it, wrapped in calm.
- [[genre-farming-sim]] — the tend loop and the tone the twist borrows.
- [[process-the-twist]] — the tonal flip that makes it yours, not a Spire reskin.
- [[system-grace]] — the no-punishment stance, made a first-class system.
- [[pattern-feedback-loops]] — the growth engine that keeps the garden climbing.

## See also

- `examples/sokoban/` — the reference for the pure-logic / view split; a cozy
  deckbuilder's card rules want the same clean seam.
- `design/FUN.md` §11 (deckbuilder) and the no-fail loop notes — the fun-gate this
  recipe hands off to.

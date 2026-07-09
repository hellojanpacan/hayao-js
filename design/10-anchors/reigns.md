---
id: anchor-reigns
title: Reigns
kind: anchor
tags: [narrative, choice, swipe, meters, stewardship, cards, decisions]
summary: Swipe-choice narrative — binary decisions nudge four meters you must keep between two ditches, so ruling is an act of doomed balance, not victory.
use-when: The intent is a minimal-input, choice-driven game where the tension is balancing competing meters and every decision is double-edged.
composes-with: [genre-narrative-decisions, system-reward-schedules, system-difficulty-and-dda, system-collectibles, pattern-risk-reward]
anchors: []
verify-with: design/FUN.md#21-narrative-decisions-reigns-like
---

# Reigns

**What it is.** A narrative game reduced to one gesture: **swipe left or right**. An
advisor presents a situation on a card; you choose one of two answers; the choice
nudges **four meters** (church, people, army, treasury). Every meter has *two*
lethal edges — too low *and* too high both kill you. Ruling is **stewardship**: not
winning, just staying alive between the ditches one more reign.

**Player fantasy.** The impossible throne. Every decision helps one faction and
hurts another; you can never satisfy everyone, only *balance* them. The pull is the
grim comedy of doomed juggling — and the itch to see the next situation, because
the deck is full of tiny stories you've only glimpsed.

## Design DNA

The engine is **meters between two ditches, fed by double-edged binary choices**.
Three parts. First, **two-sided meters**: a resource you must keep in a *band*, not
maximise — depletion and excess both kill ([[genre-narrative-decisions]]). Second,
**every choice is a tradeoff**: no move is pure gain; helping one meter costs
another, so there's no dominant policy ([[pattern-risk-reward]]). Third, **minimal
input, maximal consequence**: one swipe, but it ripples through four systems — the
depth is in the *content* (the card deck), not the controls. Judgement must beat
any fixed policy (FUN.md §21: 19/20 vs always-left's 0/20).

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Two-lethal-edge meters** | Keeping a resource in a *band* (not maxed) makes every gain a future risk — the core stewardship tension. → [[genre-narrative-decisions]]. |
| **Double-edged binary choices** | Every option helps one meter and hurts another; no dominant policy, so judgement matters. → [[pattern-risk-reward]]. |
| **One-gesture input** | Swipe left/right; the entire skill is *reading and deciding*, not executing. Radical accessibility. → [[system-accessibility]]. |
| **Card-deck content** | Situations are data cards drawn against state; content *is* the game, and it's cheap to author and lint. → [[system-collectibles]]. |
| **Conditional/flagged cards** | Cards unlock from prior choices, threading arcs and callbacks through a shuffled deck. → [[system-emergent-systems]]. |
| **Death as the loop** | You *will* die; each reign is a run, and the deck keeps dealing new stories. → [[system-session-structure]]. |

## What to steal

- **Two-sided meters**: a resource you keep *in a band* creates far richer tension
  than one you maximise — every gift is a future liability. → [[genre-narrative-decisions]].
- **Make every choice double-edged**: if any option is pure upside, delete it
  (FUN.md §21: "no no-op choices"). The tradeoff *is* the game.
- **Content-as-data**: author situations as linted cards (unique ids, bounded
  effects |Δ|≤20, every needs-flag settable) so editorial judgement becomes CI.
- **One gesture, deep consequence**: minimal input keeps the design about
  *decisions*, and makes it trivially accessible. → [[system-accessibility]].

## What's just theme (drop it)

- The **medieval-monarch fiction** — swipe-meters-stewardship fits a ship captain,
  a startup CEO, a dungeon master, a parent. → [[world-theme-vectors]].
- **The four specific factions** — the count and identities are tuning; 2–5
  two-sided meters all work. → [[system-difficulty-and-dda]].
- **The literal swipe** — left/right is one binary-choice UI; buttons or dialogue
  options carry the same DNA.
- **Death-by-succession framing** — the "reign" wrapper is flavour on "a run ends,
  a new one deals fresh cards." → [[system-session-structure]].

## Composes into

- [[genre-narrative-decisions]] — the parent genre; Reigns is its defining anchor
  (impossible stewardship; meters between two ditches).
- [[pattern-risk-reward]] — every card is a double-edged, teeth-bearing choice.
- [[system-difficulty-and-dda]] — meter volatility and card weighting are the
  difficulty knobs.
- [[system-collectibles]] — the card deck as content the player uncovers.
- [[system-accessibility]] — one-gesture input as a floor-level design.

## Twist seams

- **Reigns but the meters are a factory** *(mechanic-swap)* — swipes route
  throughput between competing subsystems; stewardship becomes logistics. Pairs
  with [[anchor-factorio]].
- **Reigns but two rulers, one kingdom** *(perspective)* — coop where each player
  owns two of the four meters and swipes can undermine the partner. Pairs with
  [[system-coop-and-competition]].
- **Reigns but the deck is a colony sim** *(structure)* — a RimWorld director deals
  the cards from live colony state; systemic drama in swipe form. Pairs with
  [[anchor-rimworld]].
- **Reigns but cozy** *(tonal)* — the "ditches" are gentle (a garden, a friendship)
  and death is retirement; balance without dread. Pairs with [[anchor-stardew-valley]].

## See also

- [`design/FUN.md#21-narrative-decisions-reigns-like`](../FUN.md) — content
  lint (unique ids, bounded effects, no no-op choices); balanced-policy bot
  survives; always-left loses 0/20; every doom fires its own ending.
- [[genre-narrative-decisions]] · [[pattern-risk-reward]] · [[system-collectibles]].

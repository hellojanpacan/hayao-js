---
id: recipe-swipe-kingdom
title: Swipe Kingdom
kind: recipe
tags: [reigns, city-builder, stewardship, recipe, meters]
summary: Reigns' swipe-choice stewardship fused with a city-builder — each yes/no card also nudges a settlement you watch grow.
use-when: You want lightweight narrative choice with visible systemic consequence.
composes-with: [anchor-reigns, genre-city-builder, genre-narrative-decisions, pattern-feedback-loops]
anchors: [anchor-reigns]
verify-with: docs/FUN.md#21-·-narrative-decisions-reigns-like
---

# Swipe Kingdom

**What it is.** Reigns' left/right card deck, but every swipe also lays a brick.
Four **meters** you keep off the ditches; one **settlement** on screen that visibly
grows or rots as those meters move. Choice stays one gesture; the consequence
stops being an abstract bar and becomes a place.

**Player fantasy / why it's fun.** You are the harried steward who can never
please everyone — say yes to the miller, the guild seethes; fund the wall, the
granary empties. The pull is watching your **town** answer back. A good reign
is a skyline; a bad one is a ruin you built one careless swipe at a time.

## The brief

> **Reigns but your choices build a city** — twist vector: **mechanic-swap**.
> Keep the swipe; swap the invisible faction bars for a settlement you can see.

## Anchors

- [[anchor-reigns]] — the whole spine: card deck, binary swipe, four hidden-then-
  shown meters, death when any meter hits an edge. Steal the loop wholesale.
- Secondary read: [[anchor-frostpunk]] for how a settlement's *state* carries moral
  weight better than a number ever does — the city is the scoreboard.

## Genre + systems pulled

- [[genre-narrative-decisions]] — the swipe grammar, card authoring, and the rule
  that every choice is a real fork, not flavor (guard against [[antipattern-fake-choice]]).
- [[genre-city-builder]] — the **exposed-score** discipline: meters render as
  buildings, roads, crowds. Its economy of visible upkeep is your feedback surface.
- [[system-economy]] — the four resources the meters *are*: coin, faith, army,
  people. Cards spend and grant them.
- [[pattern-feedback-loops]] — the balance-between-ditches tension: nudging one
  meter up drags another down, so equilibrium is fragile and every card matters.
- [[system-resource-loops]] — pin the loop cadence so the deck can't stall into a
  dominant no-brainer swipe (guard against [[antipattern-boring-optimal]]).

Do not restate these — open them. This recipe is the wiring diagram; they are the parts.

## The twist applied

**Vector: mechanic-swap.** Reigns already runs on four meters — you don't add a
system, you *re-render* one. The bars leave the HUD and become the town:

| Reigns meter | Swipe Kingdom meter | What it renders as |
|---|---|---|
| Church | Faith | temple + shrines lit or dark |
| People | People | houses, market crowd density |
| Army | Army | walls, barracks, banners |
| Treasury | Coin | granary fill, gilding, potholes |

The **death condition** is unchanged (any meter to either edge ends the reign),
but now the player *reads the danger off the skyline* instead of a bar — the
settlement is the telegraph. See [[world-narrative-delivery]] for showing state
through place, not text.

## The 3 pillars

1. **Impossible stewardship.** No card is free. Every yes robs a Peter to pay a
   Paul — the four meters are a zero-sum-ish web (via [[pattern-feedback-loops]]),
   so you are always trading, never winning outright.
2. **Visible consequence.** The town is the meter. A swipe must produce a *seen*
   change within the same beat — a house goes up, a banner falls — or the twist
   is dead weight and you've just re-skinned Reigns ([[antipattern-false-depth]]).
3. **Meters between ditches.** Fun lives in the narrow band away from all four
   edges. Cards that shove a meter hard are the drama; the deck's job is to keep
   you sweating that band, never comfortable, never instantly dead.

## Twist seams to explore

Each is another "X but Y" you could bend further — pick one, don't stack all:

- **Reigns but the deck is drawn from your city's state** *(rules-recontext)* —
  a starving town draws famine cards; a rich one draws greed cards. The
  settlement authors the deck, closing the [[pattern-feedback-loops]] into itself.
- **Reigns but the city persists across reigns** *(structure)* — the heir inherits
  the skyline you left, so a ruin is a real bequest. Ties into
  [[system-meta-progression]] and gives death a legacy instead of a reset.
- **Reigns but two rulers swipe the same city** *(mechanic-swap)* — split the
  deck across a monarch and a rival; contradictory swipes fight over one
  settlement. See [[genre-city-builder]] pressure meets asymmetric authorship.

Keep exactly one seam for the first playable. A second is a sequel, not a scope.

## Scope & first playable

The smallest thing that proves the twist is *felt*, not just present:

| Piece | First-playable scope |
|---|---|
| Deck | 20–30 cards, hand-authored, each with a left and right consequence tuple |
| Meters | 4 values, 0–100, start at 50; edge on either end ends the reign |
| Settlement | One screen, ~4 building clusters, each cluster mapped to one meter's value |
| Swipe | Drag left / right; card text + speaker; reveal the two nudges on release |
| Death | Any meter hits 0 or 100 → end card naming which meter killed the reign |
| Score | Reign length in cards survived — the [[genre-city-builder]] exposed score |

Build order: meters + swipe + death first (that's playable Reigns), *then* wire
the settlement render to the meters. Ship nothing until the town visibly reacts —
that reaction is the entire reason this recipe exists. Author the settlement as a
cosmetic view of meter state (a pure function of the four numbers), so it never
touches game logic — see [[pattern-readability]] for keeping the read instant.

**First feel-check:** swipe once and ask *did the town change where I looked?*
If the eye has to hunt for the consequence, the twist failed — tighten the map
from meter to building before adding a single card.

## Handoff

A design isn't done until it names its proofs.

- **Choice quality** → **docs/FUN.md §21 · Narrative Decisions** (the `verify-with`
  target): every card a real fork, no dominant swipe, deck can't be solved on
  turn one. Guard against [[antipattern-fake-choice]] and [[antipattern-decision-paralysis]].
- **Systemic read** → [[genre-city-builder]]'s exposed-score discipline: a
  spectator must infer meter health from the skyline alone.
- **Loop tension** → [[pattern-feedback-loops]] + [[pattern-pacing-and-tension]]:
  prove the meters stay in the sweaty band and that no swipe is free.

## Composes with

- [[anchor-reigns]] — the loop this recipe borrows whole.
- [[genre-narrative-decisions]] — card grammar and fork integrity.
- [[genre-city-builder]] — the settlement as visible scoreboard.
- [[pattern-feedback-loops]] — the zero-sum web that makes every swipe cost.
- [[system-economy]] — the four resources the meters model.

## See also

- **docs/FUN.md §21 · Narrative Decisions** — the choice-quality bar and proof.
- [[process-the-twist]] — the mechanic-swap vector this recipe rides.
- [[process-composition]] — how anchor + genre + system + twist assemble into a brief.

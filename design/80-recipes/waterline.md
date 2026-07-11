---
id: recipe-waterline
title: Waterline
kind: recipe
tags: [survival, city-builder, single-resource, scarcity, drought, recipe]
summary: A desert well-town where water meters everything — and every draw to grow now lowers the table you'll die without later.
use-when: You want a survival/management game whose entire play is one master resource, with a deferred-consequence spine.
composes-with: [genre-city-builder, genre-horde-survival, system-resource-loops, system-weather-and-time, process-the-spine]
anchors: [anchor-frostpunk, anchor-rimworld]
spine: "Water is the single currency under everything, and drawing it to grow now is exactly what dries the table you'll need later."
verify-with: design/FUN.md
---

# Waterline

**What it is.** A stepwell town in a drying age. **Water** is the only resource that
matters — food, people, shelter, and defense are all just water in another shape.
You draw from a finite aquifer to expand, but every draw *lowers the water table*,
and a lower table means slower recharge, deeper wells, and a harder next year. The
game is the long tension between growing now and having water later, punctuated by
dune-storms and raiders who come *because* you have the well.

**Player fantasy / why it's fun.** Not "manage resources" but "*I am living on
borrowed water, and every field I plant today is a well I can't dig tomorrow.*" The
dread is the **waterline** — a gauge always on screen, always dropping a little
faster than you'd like, and the knowledge that the choice keeping you alive this
season is the one that dooms you three seasons out.

## The brief

**Frostpunk but the generator is an aquifer you're draining** — one master resource,
except spending it *degrades the source*, so the pressure compounds.

## The spine

*Water is the single currency under everything, and drawing it to grow now is
exactly what dries the table you'll need later.*

| Part | This game |
|---|---|
| **Objective** | Sustain the town through the dry years (or dominate the basin) |
| **Superpower** | **Draw water** → fields, people, walls, cisterns — grow anything |
| **Scarcity** | The **aquifer**: a finite, slowly-recharging table. Drawing lowers it; a lower table recharges slower and costs more to reach |
| **Obstacle** | Dune-storms that bury infrastructure + raiders drawn to the well — *plus* the deferred obstacle of your own drawdown |
| **Renewal** | Maps differ **primarily by water-table depth & recharge rate**; survival mode escalates dry-season sieges |

## Resonance

Every element traces to the spine — the coherence proof (see [[process-the-spine]]).
Note that death-handling here is the **opposite** of [[recipe-emberfall]]'s, and
that's correct: the spine *derives* it.

| Element | Arrow back to the spine |
|---|---|
| Verb: draw water to grow | The single agency; everything you build is water reshaped |
| **Power creates the problem** | Every draw lowers the table you depend on → growing is the drought engine; greed now is death later *(passes the gate)* |
| Scarcity: the aquifer degrades as you spend | Makes each draw a *deferred* trade, not a flat cost — the spine's signature |
| Renewal: maps vary by table depth/recharge | The one variable that matters *is* the variable that changes — like [[anchor-frostpunk]]'s cold, one axis owns the difficulty |
| Death-handling: a run **can collapse to drought**, and loss stings | Spine is *survival under scarcity*; a cheap respawn would be **dissonant** ([[antipattern-dissonance]]) — the loss must land |
| Setting: a stepwell town in a drying age | The objective made physical; the well *is* the town's life, dug deeper each year |
| Theme: living beyond your means on borrowed water (civilizational drawdown) | The mechanic (spend the source to survive) is the metaphor (a society outrunning its aquifer) |
| Raiders come *because* of the well | The obstacle is *caused by* your success — pressure scales with the thing you're protecting |
| Feel: the ever-present waterline gauge, dropping | Makes the deferred scarcity *legible and dreadful* every second ([[pattern-readability]]) |

No decoration; no dissonance. The gate holds: **the only way to survive this season
is to make next season harder.**

## The twist applied — *mechanic-swap (deferred consequence)*

The bend that found the spine (via [[process-the-twist]], the sub-tool of
[[process-the-spine]]): take a single-master-resource survival game and make
spending the resource *degrade its own source*. Frostpunk's heat is a flat drain;
**water here is a drawdown** — the cost is paid in the *future's* scarcity. That one
swap turns steady-state management into a slow-motion tragedy you author yourself.

## The three pillars

Fall out of the spine — see [[process-pillars]].

1. **One resource, everything.** Food, people, defense are all water. If a system
   can be paid for *without* water, it's off the spine — guard [[antipattern-feature-soup]].
2. **The trade is deferred, and legible.** The player must *see* the table dropping
   and *understand* today's draw as tomorrow's drought, or it's [[antipattern-fake-choice]]
   dressed as tragedy. Surface it: [[system-telegraphs]], [[pattern-readability]].
3. **Scarcity, not grind.** Difficulty comes from the drawdown curve, never from
   busywork hauling buckets. Guard [[antipattern-grind-wall]].

## Scope & first playable

Ruthlessly minimal. One well, one dry-season cycle, a visible table.

| Layer | First playable | Deliberately deferred |
|---|---|---|
| Resource | one aquifer with a level + recharge rate | multiple wells, aquifer geology |
| Verb | draw water → build field / house / cistern (each a water cost) | trade, research, cistern chains |
| Drawdown | every draw lowers the table; lower table = slower recharge | salinization, collapse zones |
| Obstacle | **one** dry-season siege of raiders; storms deferred | dune-storms, faction politics |
| Renewal | 3 maps differing only in table depth/recharge | [[system-procgen-design]] basin generator |
| Show | the **waterline gauge**, always visible, dropping | full weather VFX, portraits |

The beat the first playable must earn: **the season the player realizes the draw
that saved them is what's killing them** — the tragic turn. If that recognition
doesn't land in one dry cycle with one well, more systems won't add it. Avoid
[[antipattern-content-desert]]: prove the drawdown tragedy, *then* widen the basin.

Determinism is the hard constraint. Aquifer recharge, storm timing, and raid
composition all roll through the world's deterministic RNG so a seed replays the
same collapse — a survival tragedy is only fair if the run is reproducible. The
waterline gauge is state (it's in `world.hash()`); its rendering is cosmetic. See
[[system-resource-loops]] for the draw/recharge model and [[system-weather-and-time]]
for the dry-season clock.

## Handoff

A design isn't done until it names its proofs.

- **`design/FUN.md` law 8 — the ablation proof.** Build the basin twice: `coupled`
  (draws lower the table) and `ablated` (static aquifer). Run a skilled steward and
  a lazy one over both; `assertLoadBearing({ coupling: 'aquifer drawdown', coupled,
  ablated, skilled, lazy })` must show the skill-gap **collapse** when drawdown is
  removed. If flat-aquifer plays the same, the deferred tragedy was never in the
  loop and the spine is a lie.
- **[[system-resource-loops]]** — verify the coupling: a draw must measurably slow
  future recharge, and the player must be able to *see* it. If the table is static
  under the hood, you built Frostpunk, not Waterline.
- **Coherence gate** — the Resonance table stays complete; every new system earns a
  row to the spine or it's [[antipattern-decoration]].

Then design *your own* deferred-scarcity spine from the mechanic — don't reskin this
one. See [[process-refine-and-handoff]].

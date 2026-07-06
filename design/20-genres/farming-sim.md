---
id: genre-farming-sim
title: Farming / Life Sim
kind: genre
tags: [farming, life-sim, calendar, crops, seasons, cozy, solvency, routine]
summary: Calm calendar-driven life sim where the fun is gentle solvency — plans made on a season that can actually come true.
use-when: Designing a cozy farming/life sim whose pull is a routine of small plans paying off within an honest calendar.
composes-with: [system-resource-loops, system-session-structure, system-economy, pattern-pacing-and-tension]
anchors: [anchor-stardew-valley, anchor-animal-crossing]
verify-with: docs/FUN.md#15--farminglife-sim
---

# Farming / Life Sim

**What it is.** A calendar and a plot of land. You plant, water, wait, harvest,
sell, and reinvest across seasons — a routine of small chores whose payoff arrives
on a schedule you can read. Optional threads (relationships, foraging, upgrades)
braid around the core crop loop.

**Player fantasy / why it's fun.** *"I made a plan on Monday and by harvest it came
true."* The pull is **gentle solvency**: no fail-screen looming, just plans that
resolve. Calm isn't the absence of goals — it's goals that are *reachable*, a to-do
list that closes itself one satisfying day at a time.

## Pillars

1. **Plans that can come true.** The calendar is a hard inequality, not a vibe:
   **season length ≥ longest growDays + harvest slack**. Every crop the game sells
   must fit the season it's sold in.
2. **The player knows what the bot knew.** Surface the critical numbers — *nights
   left in the season*, days to ripen — on screen. Knowledge the diligent bot needs
   to win is knowledge the player needs to plan.
3. **One predicate sets the whole mood.** *"Ripe crops survive the season turn"* (or
   don't) is a single rule that defines the genre's entire emotional register —
   forgiving vs. punishing. Choose it deliberately.

## The loop stack

| Layer | The beat |
|---|---|
| **Moment** | A chore: plant / water / harvest / feed. Small, tactile, done. |
| **Encounter** | A day: spend energy/time on the plan, watch it advance a step. |
| **Session** | A season: the plan matures; you reinvest the yield. |
| **Meta** | The year and beyond: upgrades, relationships, land, mastery. |

## Essential systems

| System | Why this genre needs it |
|---|---|
| [[system-resource-loops]] | Gather→convert→spend (seed→crop→cash→seed) is the beating core; bottlenecks (energy, water, space) are the pacing. |
| [[system-session-structure]] | Day / season / year nesting sets session length and the calendar arithmetic every plan is checked against. |
| [[system-economy]] | Faucets (harvest) and sinks (seeds, upgrades) must keep reinvestment strictly better than hoarding. |
| [[pattern-pacing-and-tension]] | Peaks (harvest day, festival) and valleys (the mid-season wait); the calm needs a rhythm, not a flatline. |
| [[system-collectibles]] | Recipes, shipped items, friendships — the open-ended goals that pull without pressure. |
| [[system-onboarding]] | The first day must teach plant→water→wait→harvest by doing, on one short crop. |

## Content & difficulty model

- **The calendar is a proof, not a setting.** Assert `seasonLength ≥ max(growDays) +
  harvestSlack` against the actual crop table. A crop that can't finish its season is
  a broken promise; a lint should refuse it.
- **Difficulty is solvency margin.** A "hard" year is a *tighter* budget, not a
  meaner world. Prove a diligent bot reaches the target by day N; prove no-water →
  no-growth; prove wither is honest (a crop dies visibly, on a rule).
- **Reinvest must beat hoard.** Assert the delta — a reinvesting bot out-earns a
  hoarding one (FUN.md measures 740 vs 236). If hoarding competes, the economy has no
  loop.
- **Expose the countdown.** *Nights left in season* is the single most load-bearing
  number; it turns anxiety into planning.
- **Content grows sideways.** More crops, animals, tools, and social threads — *width*
  the player chooses, not a difficulty wall. Solvency stays gentle; ambition scales.

## Signature-mechanic seeds

- **Farming sim but you tend a garden of grief** — each crop is a memory; the season
  ends when you're ready to release it (tonal + mechanic-swap; the [[process-the-twist]]
  worked example — calm becomes coming-to-terms).
- **Farming sim but the plot is one screen, no expansion** — a hard spatial constraint
  turns every tile into a decision (constraint; solvency gets tight and tactical).
- **Farming sim but crops are tiles you match** — harvest is a board clear; a bend
  toward [[genre-match3]] where planting sets up cascades (mechanic-swap).
- **Farming sim but nights are survival** — day tends, night defends the harvest with a
  fuel-budgeted lamp (structure + tonal; splices [[genre-survival-horror]]'s dread you
  can budget onto a cozy day).
- **Farming sim but the whole game is one exposed rule** — connect farms to yurts, and
  that single legible predicate is the content (structure; the Tiny Yurts read).

## Common pitfalls

- **Calendar that lies.** Crops that can't ripen in their season, or a season that ends
  mid-growth without warning — the fastest way to break the "plans come true" promise.
- **Hidden critical numbers.** If the player can't see nights-left or grow-time, they
  can't plan, and planning is the fun.
- **Hoarding beats reinvesting.** Kills the loop; the economy must reward putting the
  yield back in.
- **Fake calm.** No peaks, no valleys, just undifferentiated chores → boredom.
  [[pattern-pacing-and-tension]] gives the calm its rhythm.
- **Width as busywork.** New crops that don't change a decision are clutter; each
  should open a plan the player couldn't make before.

## Anchors

- [[anchor-stardew-valley]] — the calm compulsion loop, open-ended goals, and the
  day/season/year nesting; the definitive DNA for this genre.
- [[anchor-animal-crossing]] — the zero-fail, real-clock sibling; steal its
  reward-the-ritual-of-returning loop if you want to drop the season-end pressure.

## Verify

Diligent bot wins by day N; no-water-no-growth; wither honesty; reinvest-vs-hoard
delta; golden year → **[docs/FUN.md §15 · Farming/life sim](../../docs/FUN.md#15--farminglife-sim)**.
Design the calendar and loop here; prove the inequality there.

## Composes with

- [[system-resource-loops]] — the seed→crop→cash→seed cycle at the genre's heart.
- [[system-session-structure]] — the day/season/year calendar the plans are checked against.
- [[anchor-stardew-valley]] — the touchstone whose loop you import pre-solved.

## See also

- [docs/FUN.md §15](../../docs/FUN.md#15--farminglife-sim) — mechanical truth + verify recipe.
- [`sandboxes/`](../../sandboxes/) — the economy/procgen lab to headless-sim a season's
  solvency before authoring a crop table.

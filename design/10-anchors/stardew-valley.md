---
id: anchor-stardew-valley
title: Stardew Valley
kind: anchor
tags: [life-sim, farming, cozy, open-ended, compulsion-loop, calendar, progression]
summary: Gentle life sim whose pull is a calm compulsion loop — open-ended goals, a daily rhythm, and "one more day" pacing that never punishes.
use-when: The intent is a low-stress, open-ended progression game where the player sets their own goals and the loop is soothing, not tense.
composes-with: [genre-farming-sim, system-progression, system-collectibles, system-economy, system-session-structure]
anchors: []
verify-with: docs/FUN.md#15-farminglife-sim
---

# Stardew Valley

**What it is.** A life sim with **no fail state and no forced goal**. You inherit a
farm and a town; a **daily loop** (wake, tend, forage, socialise, sleep) advances
a calendar of seasons and festivals. Progress is broad and **self-directed** —
farm, mine, fish, befriend, decorate — and every strand pays out on its own gentle
schedule. The genius is *calm compulsion*: "one more day" without pressure.

**Player fantasy.** A softer life you're quietly building. The pull isn't winning;
it's tending — a plot filling in, a friendship deepening, a collection nearing
complete. You always have three small things you *want* to do next, and none of
them can go badly.

## Design DNA

The loop is **open-ended progression with a soft clock**. A day is a fixed budget
of time/energy; the calendar (seasons, crop timers, festivals) gives structure and
anticipation *without* threat. Many parallel goal-strands
([[system-collectibles]], [[system-progression]]) mean the player always has a
choice and never a dead end — if farming stalls, go fish. The compulsion is
*variable-but-safe*: rewards come on legible timers, so you can always plan a
satisfying tomorrow. Crucially, **calendar arithmetic is a hard inequality**
(FUN.md §15): a season must be long enough to grow what it offers, or the calm
breaks into frustration.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Daily loop with a time/energy budget** | A fixed day forces gentle prioritisation; ending the day is a natural save/breather. → [[system-session-structure]]. |
| **Seasonal calendar** | Seasons gate crops and stage festivals — anticipation and rhythm without a threat clock. → [[system-progression]]. |
| **Parallel self-directed goals** | Farm/mine/fish/social/collect run in parallel; the player always has an appealing next thing and no dead end. → [[system-collectibles]]. |
| **No fail state** | You can't lose the farm; setbacks cost a day, never a run. The safety *is* the genre. → [[pattern-anti-frustration]]. |
| **Gentle solvency economy** | Plans that can come true: crop→sell→reinvest with margins that reward diligence, not optimisation. → [[system-economy]]. |
| **Relationship meters** | Slow, warm progress bars on townsfolk; social as a collectible you tend over seasons. → [[system-emergent-systems]]. |
| **Surfaced deadlines** | "Days left in season" is shown — the one number the player must plan around. (FUN.md §15). |

## What to steal

- The **no-fail soft clock**: a calendar that gives rhythm and anticipation while
  *nothing can go badly*. This is the mood engine; guard it above all.
- **Parallel goal-strands**: enough independent tracks that the player always has
  three things they *want* to do and never a wall. → [[system-collectibles]].
- **Gentle solvency**: an economy where diligence pays and optimisation isn't
  required — reinvest-vs-hoard has a clear right answer but a soft penalty (FUN.md
  §15's 740-vs-236 delta).
- **Surface the one deadline** the player must plan around; hide the rest. Knowledge
  the bot needed, the player needs.

## What's just theme (drop it)

- The **rural-farm fiction** — the loop is "tend parallel strands on a soft clock,"
  which fits a bookshop, a spaceship, a garden, a shrine equally. →
  [[world-theme-vectors]].
- **Farming as the central verb** — it's one strand among many; a Stardew of
  *fishing* or *repair* or *ritual* keeps the DNA. → [[process-the-twist]]
  mechanic-swap.
- **Combat/mines** — an optional pressure strand many cozy players skip. Cut it
  before you cut the calm.
- **Pixel-art / marriage / specific NPCs** — content and dressing on the
  relationship-meter and collection systems.

## Composes into

- [[genre-farming-sim]] — the parent (gentle solvency, calendar as a hard
  inequality).
- [[system-progression]] — broad, self-directed power/skill growth across strands.
- [[system-collectibles]] — sets, completion, decoration: optional goals with pull.
- [[system-economy]] — the solvent, forgiving money loop that funds tending.
- [[system-session-structure]] — the day as the session; the season as the
  campaign.

## Twist seams

- **Stardew but a garden of grief** *(tonal + mechanic-swap)* — the calm loop
  becomes coming-to-terms; each crop is a memory you eventually release. (The
  worked example in [[process-the-twist]].)
- **Stardew but a run ends the year** *(structure)* — roguelite seasons: you lose
  the farm each year but keep meta-unlocks, turning cozy into a run loop. Pairs
  with [[system-meta-progression]].
- **Stardew but one plot, no expansion** *(constraint)* — a single tiny space you
  perfect instead of sprawl; depth over breadth. Pairs with [[genre-grid-puzzle]].
- **Stardew but two farmers, one day** *(perspective)* — coop where the shared
  time-budget forces gentle coordination. Pairs with [[genre-coop-chaos]].

## See also

- [`docs/FUN.md#15-farminglife-sim`](../../docs/FUN.md) — season ≥ growDays +
  slack; surface nights-left; reinvest-vs-hoard delta; golden year.
- [[genre-farming-sim]] · [[anchor-rimworld]] (the tense-sim cousin) ·
  [[pattern-anti-frustration]].

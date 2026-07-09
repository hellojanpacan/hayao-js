---
id: system-economy
title: Economy — Faucets, Sinks & the Pacing Window
kind: system
tags: [economy, currency, faucets, sinks, inflation, balance, pacing, incremental]
summary: Currencies flowing in through faucets and out through sinks; keeping the two in tension so the player is always almost-able-to-afford the next thing.
use-when: The design has resources or currency the player earns and spends, and you need them to stay meaningful instead of trivial or crushing.
composes-with: [system-resource-loops, system-progression, system-crafting, system-reward-schedules, system-meta-progression]
anchors: [anchor-factorio, anchor-stardew-valley, anchor-civilization]
verify-with: design/FUN.md#14-incrementalidle
---

# Economy — Faucets, Sinks & the Pacing Window

**What it is.** Every currency is a bucket with **faucets** (where it flows in)
and **sinks** (where it drains out). The economy is the *ratio* between them over
time. Get the ratio right and the player lives in a productive tension — always
almost able to afford the next thing. Get it wrong and money is either worthless
or a wall.

**Player fantasy / why it's fun.** "I can *almost* afford it — one more run."
A good economy makes desire renewable: the moment you can buy the thing, a better
thing is just out of reach. The pull is the **pacing window** itself.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Earning and spending is a core loop (RPG, sim, incremental) | The game has no persistent resource (pure arcade, puzzle) |
| You want the player pacing themselves via what they can afford | A flat unlock list reads clearer than a currency |
| Multiple currencies segment progress into tracks | One currency would do — don't invent five |

**Currency count is a tax.** Each currency the player must track is cognitive
overhead. Add a second only when it *segments* meaningfully (soft vs premium,
common vs prestige, run vs meta). Civilization's gold/science/culture each gate a
different track; that earns its complexity.

## Variants

| Variant | Shape | Best for | Watch for |
|---|---|---|---|
| **Single currency** | One in, one out | Small games; clarity | Boredom if one sink dominates |
| **Multi-currency** | Parallel buckets, separate tracks | Sims, 4X, gacha | Confusion; conversion loopholes |
| **Convertible chain** | A → B → C ([[system-resource-loops]]) | Crafting, production | Bottleneck placement is the whole game |
| **Closed loop** | Fixed total, only moves | Auto-battler gold; poker chips | No growth fantasy |
| **Open (growth)** | Faucets > sinks by design | Incrementals, idlers | Inflation → late-game money is meaningless |

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Faucet rate** | Income per unit time/effort | Tie to *effort/skill*, not idle time, or you've built a clock |
| **Sink appetite** | How fast money leaves | Sinks must scale *with* faucets or inflation eats meaning |
| **Payback ratio** (cost ÷ production) | Time to recoup a purchase | Keep ~flat per tier (**~15–25s** in idlers). Rising payback strangles the late game (**[[FUN.md §14]]**) |
| **First-buy time** | The onboarding hook | Fast — the first affordable purchase within the first minute |
| **Inflation control** | Whether late money matters | New, costlier sinks per era; or a prestige reset ([[system-meta-progression]]) |
| **Currency count** | Cognitive load | As few as segment the game meaningfully |

The discipline that defines a healthy economy is the **pacing window**: state the
payback inequality as a law-3 constraint and *assert it holds across the whole
arc* — no tier where the next purchase is a desert, none where it's instant
(**[[FUN.md §14]]**, law 3).

## How it wires to Hayao

- **The ledger is state.** Balances live in `world.state`; every earn and spend is
  an **input action** (`input.press`), *never* a direct mutation — this is the
  exact rule incremental/idle lives by so replays don't lie (**[[FUN.md §14]]**).
- **Balance-sim the whole arc.** Because state is pure JSON and rng flows through
  `world.rng`, script a bot that plays the economy start-to-finish and assert the
  pacing windows, monotone production, and *no unlock deserts* — the incremental
  verify pattern. Grep `docs/API.md` for the ramp/pacing helpers
  (`assertRamp`/`rampIssues`).
- **The HUD is cosmetic.** Balance labels, floating "+N", coin sprites render on
  `LAYER_HUD` and are `cosmetic = true` — deletable without changing
  `world.hash()` (**[[FUN.md law 6]]**). The city-builder truth applies: the live
  "+N under the cursor" is a *pure* score serving sim, bot, test, and label at
  once (**[[FUN.md §17]]**).
- **Shops/upgrade menus are chrome** — `showScreen()` DOM (CLAUDE.md invariant 4).

## Fails when…

- **Inflation.** Faucets outrun sinks; late-game money is meaningless and every
  purchase is trivial. Scale sinks with faucets; add prestige resets.
- **A desert.** A tier where the next thing costs far more than income can reach in
  a fun span — the player grinds a solved loop. The payback assertion catches it.
- **Idle-not-effort faucets.** Income from waiting, not playing, turns the game
  into a timer. Tie faucets to skill/effort.
- **Currency soup.** Five currencies where one would do; players lose the thread.
- **A conversion loophole.** A → B → A at profit breaks a multi-currency economy —
  prove no cycle nets positive.

## Verify

- Pacing windows, monotone production, no deserts, no click-softlock — the
  incremental balance-sim: **[[FUN.md §14]]**.
- Payback ratio as an asserted law-3 inequality across tiers: **[[FUN.md law 3]]**.
- The exposed score as one pure function (sim = bot = test = label):
  **[[FUN.md §17]]** (city-builder).
- Reinvest-vs-hoard skill delta (740 vs 236): **[[FUN.md §15]]** (farming).

## Composes with

- [[system-resource-loops]] — the gather→convert→spend cycles the economy prices.
- [[system-progression]] — XP/levels are one faucet–sink pair among many.
- [[system-crafting]] — recipes are structured sinks with combinatorial payoff.
- [[system-reward-schedules]] — the drip that fills the faucet.
- [[system-meta-progression]] — prestige/meta currency as an inflation reset.
- [[pattern-feedback-loops]] — income→buy→more income is the runaway loop to tame.

## See also

- [`design/FUN.md`](../FUN.md) §14 (incremental pacing) · §15 (farming
  solvency) · §17 (exposed score) — the three economy proofs.
- `src/content/` + `assertRamp` — pace-as-data; balance-sim the arc, don't vibe it.
- **[[anchor-factorio]]** (production economy) · **[[anchor-civilization]]**
  (multi-currency tracks).

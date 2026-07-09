---
id: genre-incremental
title: Incremental / Idle
kind: genre
tags: [incremental, idle, clicker, prestige, economy, pacing, payback, ramp]
summary: Number-goes-up economy where the design IS the pacing curve — first-buy times and era gaps tuned so there are no deserts.
use-when: Designing a clicker/idle/prestige game whose fun is a smooth ramp of unlocks with no dead stretches waiting for a wall.
composes-with: [system-economy, system-progression, pattern-feedback-loops, system-reward-schedules]
anchors: [anchor-balatro, anchor-factorio]
verify-with: design/FUN.md#14--incrementalidle
---

# Incremental / Idle

**What it is.** An economy that grows itself. You buy producers, producers make
currency, currency buys more producers; periodically a **prestige** reset trades
progress for a permanent multiplier. The number goes up — the question is only
*how fast, and toward what next unlock*.

**Player fantasy / why it's fun.** *"I keep crossing thresholds I couldn't afford a
minute ago."* The pull is a horizon that keeps arriving: every purchase is close, the
next tier is visible, and a reset makes the whole climb feel faster. Fun is the
**pacing curve with no deserts** — the moment you're bored, the game has failed.

## Pillars

1. **The curve is the game.** First-buy times and the gaps between eras *are* the
   design surface. You are authoring a rhythm of "soon", not a set of numbers.
2. **Every tier pays back on schedule.** Cost-over-production per tier stays roughly
   flat (a ~15–25s payback). A rising payback silently strangles the late game.
3. **Intent is an action, never a mutation.** A click is `input.press`, not a direct
   state write — or the replay lies and the balance-sim can't trust the arc.

## The loop stack

| Layer | The beat |
|---|---|
| **Moment** | Afford the next thing → buy it → watch the rate tick up. |
| **Encounter** | Reach a tier / unlock / milestone that changes what you optimise. |
| **Session** | Climb toward a prestige; decide when to reset. |
| **Meta** | Prestige multipliers, permanent upgrades, new mechanic layers per reset. |

## Essential systems

| System | Why this genre needs it |
|---|---|
| [[system-economy]] | Faucets, sinks, and currencies are the entire object; inflation control keeps late tiers meaningful. |
| [[system-progression]] | The power curve *is* the content; pacing power gain is pacing the game. |
| [[pattern-feedback-loops]] | Production→currency→production is a runaway positive loop; prestige is the negative-loop reset that re-paces it. |
| [[system-reward-schedules]] | Milestone unlocks and offline-earnings payouts are the variable, anticipated rewards. |
| [[system-meta-progression]] | Prestige currency + permanent buffs are cross-run meta; power vs. new options is the tuning axis. |
| [[system-onboarding]] | The first three buys must land in under a minute or the ramp never catches. |

## Content & difficulty model

- **Balance-sim the whole arc.** Run the economy headless from zero to endgame; assert
  the pacing windows (first-buy times, era-to-era gaps), **monotone production**, and
  **no unlock deserts** — no stretch where nothing new is affordable for too long.
- **Flat payback per tier.** State the inequality: `cost_n / production_n ≈ const`
  (~15–25s) across tiers. A tier whose payback balloons is a wall; assert it against
  the actual config, don't vibe it.
- **No click-softlock.** Prove the player can always progress without a required
  manual click storm — an idle game must idle.
- **Difficulty = slope, not spikes.** You never "make it harder"; you shape how long
  each threshold takes. A desert is the only real failure state.
- **New layer per prestige.** Each reset should unlock a *mechanic*, not just a bigger
  multiplier, or the late loop flattens into staring.

## Signature-mechanic seeds

- **Incremental but the producers are a factory graph** — outputs feed inputs, and
  the bottleneck moves (mechanic-swap toward [[anchor-factorio]]; the curve becomes a
  logistics puzzle).
- **Incremental but every prestige is a poker deck** — reset trades score for jokers
  that reshape the next run's multipliers (mechanic-swap toward [[anchor-balatro]]).
- **Incremental but it's a tended garden** — production is crops maturing on a
  calendar; the tonal bend swaps grind-anxiety for [[genre-farming-sim]] calm.
- **Incremental but one hard constraint: one currency, one screen** — no menus, the
  whole ramp legible at once (constraint; forces ruthless curve design).
- **Incremental but the number going up is a story meter** — thresholds unlock
  narrative, not just power (tonal; pairs with [[genre-narrative-decisions]]).

## Common pitfalls

- **Rising payback ratios.** The classic strangler: late tiers cost far more than they
  return, the ramp stalls, the player quits. The flat-payback inequality exists to
  catch exactly this.
- **Unlock deserts.** Any dead stretch waiting on a wall is the genre's cardinal sin;
  the balance-sim asserts against them.
- **Direct-mutation UI.** Buttons that write state instead of pressing an input make
  replay and the balance-sim untrustworthy — the arc can't be proven.
- **Prestige-as-only-content.** Resets that add a multiplier and nothing else flatten
  the meta; each should open a new mechanical layer.
- **Punishing idle.** If afk means you fall behind, it isn't idle. Offline earnings and
  a click-free path are load-bearing.

## Anchors

- [[anchor-balatro]] — the "number goes up" surge and the reset-for-multipliers loop;
  the direct reference for the prestige-as-deck seed.
- [[anchor-factorio]] — production feeding production, complexity scaling with the
  curve; the reference for the factory-graph bend.

## Verify

Balance-sim the arc; assert pacing windows, monotone production, no unlock deserts,
no click-softlock → **[design/FUN.md §14 · Incremental/idle](../FUN.md#14--incrementalidle)**.
Author the curve here; prove its windows there.

## Composes with

- [[system-economy]] — the faucet/sink model the whole ramp rides on.
- [[system-progression]] — the power curve you are literally pacing.
- [[pattern-feedback-loops]] — the runaway production loop and the prestige brake.

## See also

- [design/FUN.md §14](../FUN.md#14--incrementalidle) — mechanical truth + verify recipe.
- [`sandboxes/`](../../sandboxes/) — the procgen/economy lab to prototype a payback
  curve headless before wiring UI.

---
id: antipattern-boring-optimal
title: The Boring Optimal
kind: antipattern
tags: [incentives, feel, tedium, depth]
summary: The best strategy is the least fun one — the game punishes you for playing it the exciting way.
use-when: Your reward structure makes the tedious line the correct line.
composes-with: [pattern-risk-reward, system-economy, pattern-meaningful-choice]
verify-with: docs/FUN.md
---

**What it is.** The **dominant strategy** is the dull one: grind, turtle, kite, wait. Skilled play and exciting play diverge, and the numbers side with tedium.

**Why it hurts.** The player learns the fun move is a *tax* — flashier means worse. So they stop taking it, the game they wanted to play evaporates, and what's left is a spreadsheet they solve on autopilot. The fantasy dies not from a missing feature but from an **incentive** pointed the wrong way.

## The smell

The line a mastery player converges on is the line a bored player would also pick. **Optimal** and **fun** are unrelated, or worse, opposed. Watch for the phrase "yeah, it's boring, but it's just better."

## How it happens

- **Safety pays more than risk.** The aggressive option and the passive option have the same expected value — but the passive one has lower variance, so it wins every long-run calculation. See [[pattern-risk-reward]].
- **Time is free.** If nothing costs the clock, waiting/grinding/farming is a pure-upside strategy. No pressure, no reason to stop. See [[system-resource-loops]].
- **The flashy tool is strictly worse.** The cool mechanic ([[mechanic-parry]], [[mechanic-combo-string]], the risky combo) does less than the safe poke, so it's cosmetic. See [[system-combat-model]].
- **Attrition beats expression.** Whittling from max range is safe and slow; committing is fast and risky. Nothing rewards the commit, so the whittle is correct.
- **Metagame collapse.** One build/opener out-values all others; every choice upstream funnels to it. This is the endgame of [[antipattern-solved-metagame]].

## The tell (check YOUR design)

- Simulate the **optimal** player. Are they doing the thing your trailer shows? If the trailer is a lie, you have this bug.
- Ask: "What's the most boring thing that still wins?" If it wins comfortably, it dominates.
- Is your safe line *also* your high-EV line? Then risk is [[antipattern-fake-choice]] — it never pays to take it.
- Does any strategy scale with **patience** instead of **skill**? Patience isn't gameplay; it's a wait.
- Would a speedrunner and a scared player pick the same route? If yes, the route has no texture.

## Twist seams

- **A turtle strategy, but the shield decays every second it's raised** (twist: turtling is possible but on a timer). Punish the wait; make defense a resource, not a state. See [[system-status-effects]].
- **A grind loop, but yields halve on repeat and the boss heals while you farm** (twist: the clock is no longer free). Efficient play now demands commitment. See [[pattern-pacing-and-tension]].
- **A safe poke, but every hit builds a meter only aggression spends** (twist: safety funds the flashy line but can't cash it). The exciting move becomes the payoff, not the tax. See [[system-reward-schedules]].

## The fix

**Pay out the fun line; tax the degenerate one.** The exciting play must be the *correct* play, or at least a live equal.

| Lever | Fix | Link |
|---|---|---|
| Reward | Make the risky/expressive move the highest-EV move under pressure | [[pattern-risk-reward]] |
| Clock | Cost the wait — timers, escalating spawns, decaying resources | [[pattern-pacing-and-tension]] |
| Economy | Diminishing returns on grind; scarcity that forces commitment | [[system-economy]] |
| Choice | Ensure two live lines with real tradeoffs, not one plus decoys | [[pattern-meaningful-choice]] |
| Feedback | Amplify the flashy line's payoff so it *feels* and *scores* better | [[pattern-feedback-loops]] |
| Combat | Break the poke's dominance with counters that punish passivity | [[system-counter-systems]] |

Design principle: **asymmetric payout.** The boring line should cap low; the exciting line should have a higher ceiling *and* pull its weight at the median. Aggression that only pays at expert level is still a tax for everyone else.

## Seen in…

- **Fighting games** — the "throw a fireball, walk back, repeat" zoning that beats everyone who won't approach. [[genre-fighting-game]] fixes this with chip damage, timers, and meter that rewards commitment; [[anchor-street-fighter]] tuning lives or dies here.
- **Turn-based RPGs** — spamming the basic attack because MP is precious and the flashy spell is net-negative. [[system-resource-loops]] that make big moves *worth* their cost break the spam.
- **RTS turtling** — walling up and macroing forever when the map has no pressure. [[anchor-starcraft]] taxes it with map control and expansion economies; contrast a mode with no clock.
- **Idle grind** in RPGs and [[genre-incremental]] — farming a safe early zone because it's the highest gold-per-risk, ignoring the whole game. See [[antipattern-grind-wall]].
- **[[anchor-slay-the-spire]] counterexample** — the Ascension ladder and event costs keep passive "just survive" decks from dominating; risk (elite fights, curses for power) is priced to pay off.
- **[[anchor-into-the-breach]] counterexample** — no grind, no hoarding; every turn forces a committed, legible decision. Waiting is never an option because the threat is always scored and visible.

## Verify / guard

This is a **FUN** failure — the mechanic works but the incentive misfires. Prove the fun line pays: model or playtest the optimal strategy and confirm it's the one you want played. See `docs/FUN.md` for the incentive-audit gate, and cross-check with [[pattern-mastery-and-flow]] — if mastery converges on tedium, the payout curve is inverted. Related smells to rule out together: [[antipattern-fake-choice]], [[antipattern-solved-metagame]], [[antipattern-grind-wall]].

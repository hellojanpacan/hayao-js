---
id: pattern-risk-reward
title: Risk / Reward
kind: pattern
tags: [risk, reward, push-your-luck, tradeoff, double-edged, gambling, tension, choice]
summary: A choice with teeth — every reward priced in real risk, every option double-edged, so decisions cost something.
use-when: You're designing a decision, upgrade, or resource spend and it feels like a no-brainer (strictly-better = no choice).
composes-with: [pattern-feedback-loops, pattern-pacing-and-tension, system-reward-schedules, system-build-diversity]
verify-with: design/FUN.md#21-·-narrative-decisions-reigns-like
---

# Risk / Reward

**What it is.** A decision has **teeth** when its upside is priced in a real,
legible downside — push deeper for more loot at rising odds of losing it all;
take the strong card that also feeds your discard pile; heal now or bank the mana.
The pattern is the enemy of the *no-brainer*: if one option is strictly better,
there was never a choice.

**Player fantasy.** *"Do I dare?"* The pull of the greedy line and the dread of
the cost, held in the same breath. Owning the outcome — the win you earned by
holding your nerve, the loss you earned by one more push.

## Why it works

- **A choice is only a choice if both sides cost something.** Strictly-better
  options are content the player clicks past; double-edged options are content the
  player *thinks about*. Depth is measured in agonised pauses.
- **Push-your-luck manufactures tension for free.** Each "one more" raises the
  stake and the dread on its own — you don't script the peak, the player's greed
  builds it (see [[pattern-pacing-and-tension]]).
- **Variance is fun *when the player chose it*.** A gamble you opted into reads as
  drama; the same swing forced on you reads as unfair. Risk must be *elected*.
- **The bank point is the whole tension.** The moment you *can* lock in gains is
  where push-your-luck lives — one-more-push against cash-out-now. Remove the bank
  point and it's not a gamble, it's an outcome; the choice of *when to stop* is the game.

## Levers

| Lever | Effect | Example |
|---|---|---|
| **Bust probability** | How fast the greedy line collapses | Each extra room: +15% ambush |
| **Reward slope** | How steep the payoff for pushing | Pot doubles each step; last multiplier is the sweetener |
| **Bank point** | When you can lock in gains | Cash out at any chest; commit at the door |
| **Double edge** | The cost baked into the *good* option | The power card also damages you (Reigns' |Δ| ≤ 20) |
| **Information** | How much you know before committing | Telegraphed odds vs blind draw ([[pattern-readability]]) |
| **Loss size** | What a bust actually costs | Lose the run's haul vs lose one heal |

## Applied across genres

| Genre | The teeth |
|---|---|
| **Narrative decisions** ([[genre-narrative-decisions]]) | Every swipe double-edged; meters between two ditches; |Δ| ≤ 20 keeps any single choice from deciding the reign (FUN.md §21) |
| **Roguelike** ([[genre-roguelike]]) | The cursed item, the risky shortcut, the elite room for elite loot |
| **Deckbuilder** ([[genre-deckbuilder]]) | Powerful cards with a downside; the skip-the-reward-for-tempo choice |
| **Physics arcade** ([[genre-physics-arcade]]) | The guarded multiplier peg; last-ball-for-the-jackpot pressure |
| **Blackjack / push-your-luck** ([[anchor-balatro]]) | Hit or stand; the score you have vs the score you could |
| **Farming sim** ([[genre-farming-sim]]) | Plant the long crop that might not ripen before the season turn (FUN.md §15) |
| **Tactics** ([[genre-tactics]]) | Overextend for the kill vs hold the defensible tile |

## Overdone when…

- **The no-brainer.** One option dominates in every state — it's not a decision,
  it's a speed bump. Cut it or add a cost.
- **Fake risk.** The "gamble" always pays (odds too kind, loss too small) — players
  learn to always push and the tension evaporates. The bust must *bite*.
- **Swing with no agency.** Variance the player didn't choose (a coin-flip boss, an
  unblockable spike) reads as unfair, not thrilling. FUN.md §11: an incoming spike
  must be *blockable in principle*, or it's a coin flip, not a decision.
- **One choice ends the game.** A single decision with an unbounded downside is a
  trap, not a risk. Reigns caps single-choice effects (|Δ| ≤ 20) so stewardship,
  not one swipe, is the game.
- **Risk with no signposting.** A gamble whose odds and stakes the player can't read
  isn't a decision, it's a blind draw — the tension needs the number *shown*
  ([[pattern-readability]]). Elected risk requires *informed* consent.

## Verify / feel-gate link

Risk/reward is provable as a **skill-delta with bounded stakes**:

- **Judgement beats recklessness.** The Reigns proof (FUN.md §21): a balanced
  policy survives, always-push loses — assert `judgementScore ≫ recklessScore`
  (19/20 vs 0/20). If reckless play competes, the risk has no teeth.
- **Bounded double-edge.** The content lint for two-sided choices — every effect
  `|Δ| ≤ 20`, no no-op choices, every needs-flag settable (FUN.md §21). A choice
  that's all upside is a lint failure.
- **Blockable-in-principle.** For combat variance, assert the worst incoming ≤ the
  player's answer ceiling (FUN.md §11) — the difference between a hard choice and a
  coin flip.

## Worked micro-example

*"A deckbuilder reward screen where the choice actually hurts."* The naive screen
offers three cards, pick one — but the strong card is *strictly* strong, so it's a
no-brainer, not a choice. Add teeth three ways: (1) the strong card carries a
**double edge** (it bloats your draw or damages you); (2) a **skip-for-tempo**
option (take nothing, keep the deck lean); (3) **information** — telegraph the next
elite so the player weighs power-now against consistency-later
([[pattern-readability]]). Now every reward is a *decision*. Prove it: the greedy
pilot lands in the win-rate window, and a never-skip / always-grab pilot drops out
of it — the cost was real (FUN.md §11).

## Composes with

- [[pattern-feedback-loops]] — whether to *bank* a lead or *compound* it is a
  push-your-luck decision riding on the loop's gain.
- [[system-reward-schedules]] — variable-ratio payoffs are risk/reward with the
  odds set by the drop table; keep them ethical, not exploitative.
- [[system-build-diversity]] — double-edged upgrades are what make many builds
  viable; a strictly-best upgrade collapses the build space.
- [[pattern-pacing-and-tension]] — push-your-luck is a self-building tension curve.

## See also

- [`design/FUN.md`](../FUN.md) §21 (Reigns) & §11 (deckbuilder blockability) —
  the two proofs that risk has teeth *and* is fair.
- [[anchor-reigns]] · [[anchor-balatro]] — the double-edged-choice and
  push-your-luck fantasies as whole games.
- [[anchor-slay-the-spire]] — the draft-of-3-with-a-skip is risk/reward as a whole
  reward economy; the skip is the double edge made a first-class option.

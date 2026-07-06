---
id: antipattern-rng-frustration
title: RNG Frustration
kind: antipattern
tags: [randomness, fairness, variance, feel]
summary: Variance that erases skill — a good decision loses to a coin flip, and the loss feels stolen, not earned.
use-when: Randomness affects outcomes players feel they controlled.
composes-with: [system-procgen-design, pattern-fairness-and-trust, system-loot-tables]
verify-with: docs/FUN.md#10-·-traditional-roguelike
---

**What it is.** Randomness sits on the **output** of a decision instead of its input, so a correct play loses to a die roll. The player did the math, made the read, executed — and the result was overwritten by a number they never saw coming.

**Why it hurts.** Skill only feels like skill when the same input reliably yields the same result. When a **coin flip** stands between choice and consequence, the game stops teaching. Wins feel unowned, losses feel robbed, and both erode the trust that keeps a player pressing forward. See [[pattern-fairness-and-trust]] and [[pattern-mastery-and-flow]].

---

## The smell

**Attribution flips from self to fate.** The player stops saying "I misjudged that" and starts saying "the game screwed me." Once losses route to luck instead of choice, the feedback loop that drives [[system-mastery-curve]] is severed — nothing learned, nothing to do differently next time.

## How it happens

| Trap | What it does |
|---|---|
| **Output randomness** | The move is committed, then a roll decides if it lands. 85% hit that whiffs three times running. |
| **No floor** | A drop table with no [[system-loot-tables]] pity can leave a player 0-for-40 on the item the build needs. |
| **Compounding rolls** | Ten independent coin flips per run; one bad tail cascades into an unrecoverable state. |
| **Invisible math** | The die is rolled behind the curtain — the player can't price the risk, so they can't consent to it. |
| **Swing > play** | The variance band is wider than the skill band. The best and worst players converge on the same win rate. |

## The tell (check your own design)

- Can a player make the **objectively correct** move and still lose to a number? If the loss is common, not tail-rare, you have it.
- Read your own playtest notes: how often does "unlucky" appear versus "I should have"? A high ratio is the alarm.
- Is the **randomness visible before commit**? If the odds surface only in the death screen, the player never chose the risk. Contrast the honesty of [[pattern-risk-reward]].
- Would a spectator watching the input predict the output? If not, the game is narrating dice, not decisions.
- Does the swing swamp the skill? Simulate a great player and a mediocre one over 100 runs — if their outcomes overlap heavily, variance owns the game, not the player.

## The fix

**Randomize the inputs, not the outputs.** Deal the hand randomly, then let skill resolve it deterministically. The randomness that *sets the problem* is generative; the randomness that *overturns the answer* is theft.

| Cure | How | Link |
|---|---|---|
| **Move RNG upstream** | Random draw, random spawn, random board — deterministic resolution. The player adapts to the variance instead of being punished by it. | [[system-procgen-design]] · [[system-spawn-directors]] |
| **Pity & floors** | Bad-luck protection: rising odds, guaranteed drop after N misses, no-repeat windows. | [[system-loot-tables]] · [[system-reward-schedules]] |
| **Surface the math** | Show the hit chance *before* commit, and consider showing the roll. Consented risk stops feeling stolen. | [[pattern-fairness-and-trust]] · [[pattern-readability]] |
| **Bound the swing** | Cap variance so the skill band stays wider than the luck band. Deterministic damage, telegraphed enemy intent. | [[system-difficulty-and-dda]] · [[system-telegraphs]] |
| **Grant recovery** | One bad roll shouldn't end the run. Rerolls, mulligans, second chances keep agency alive. | [[system-grace]] · [[pattern-anti-frustration]] |

**Design axiom:** if you can't remove the die, make the player *choose to roll it* with the odds in hand. See also [[antipattern-fake-choice]] — invisible RNG turns a real choice into a fake one.

## Twist seams

- **Roguelike run but the seed is shown and the resolution is deterministic** (twist vector: *legible variance* — [[anchor-into-the-breach]] shows every enemy's next move, so loss is always your read, never the dice).
- **Loot chase but misses raise the floor** (twist vector: *guaranteed convergence* — pity counters mean the grind has a horizon, not an abyss; see [[system-loot-tables]]).
- **Card draw but you sculpt the deck** (twist vector: *authored luck* — the player builds the odds they'll face, so variance is a plan, not an ambush — [[genre-deckbuilder]], [[system-build-diversity]]).

## Seen in…

- **[[anchor-slay-the-spire]]** and **[[anchor-balatro]]** — models of the fix. The *draw* is random; how you build and play it is not. You lose to your deck, not to the shuffle.
- **[[anchor-into-the-breach]]** — every threat is fully telegraphed and damage is deterministic. Pure information, zero output RNG; the antipattern's opposite pole.
- **[[anchor-hades]]** — boon offers are random, but a strong player wins with almost any set; the variance sets the puzzle, not the verdict.
- **XCOM's 95%-that-misses** — the canonical wound. The read was right, the shot was right, and the game overruled both. Later entries added streak-breakers precisely to blunt this.
- **[[anchor-tetris]]** — the modern **7-bag** randomizer exists to kill drought: it randomizes the input while guaranteeing no piece starves you. A floor baked into the RNG itself.
- **[[anchor-spelunky]]** — the daily seed is brutal *and* fair because it's the same for everyone; the variance is the shared problem, not a personal betrayal.

## Verify / guard

Design here, prove there. Assert that skill dominates variance before handoff: simulate skilled vs. unskilled agents over many seeded runs and confirm their win rates separate — if they don't, the swing is too wide. Confirm pity floors actually trigger and that every advertised probability is visible pre-commit. The frontmatter's `verify-with` (docs/FUN.md, traditional roguelike) is the fun bar; run the fairness checks in [[pattern-fairness-and-trust]] and the schedule guards in [[system-reward-schedules]] alongside it.

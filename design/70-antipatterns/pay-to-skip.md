---
id: antipattern-pay-to-skip
title: Pay-to-Skip
kind: antipattern
tags: [monetization, ethics, friction, dark-pattern]
summary: Design that manufactures friction so it can sell the cure — the game is built worse on purpose.
use-when: A monetization idea would profit from making the base game more tedious.
composes-with: [system-economy, system-reward-schedules, antipattern-grind-wall]
verify-with: design/FUN.md
---

**What it is.** You inflate a cost — time, taps, waiting, backtracking — and then sell the antidote. The friction is not a design consequence; it is the **inventory**. The game is deliberately built worse so a purchase can make it briefly good.

**Why it hurts.** Every tuning decision now has a second, hostile master: the worse the base experience, the higher the willingness to pay. Design and player interest are pointed in **opposite** directions, so the game rots toward tedium by design.

## The smell

**Manufactured friction sold back as relief.** The paid fix cures a problem the design invented. Strip the store and the game gets *better*, not worse — proof the friction was never for the player.

## How it happens

| Step | What you do | The lie you tell yourself |
|---|---|---|
| 1 | Set base progression far slower than fun | "It respects long-term players." |
| 2 | Add a timer / stamina / dropped-drop gate | "Pacing. Retention." |
| 3 | Price the skip against the pain, not the value | "Optional. Nobody's forced." |
| 4 | Tune the pain *up* when revenue dips | "Rebalancing the economy." |

The tell of step 4 is the whole tell: the difficulty and grind knobs are wired to the wallet, not to the player's skill or the fantasy. See [[system-difficulty-and-dda]] — DDA that reads a payment signal instead of a skill signal is this antipattern wearing a lab coat.

## The tell (check YOUR OWN design)

Ask these before handoff. Any *yes* is a flare.

- **Remove the store — does the game improve?** If the base loop is *only* tolerable with the purchase, the friction is the product.
- **Would you cut this friction for free** if it cost no revenue? If yes, you kept it *for* the revenue. That's the line.
- **Does the skip return time, or return fun?** Selling a fun new toy is content. Selling *back the minutes you stole* is a ransom.
- **Is a grind knob tuned by revenue dashboards?** If the drop rate moves when sales dip, players are the resource being farmed.
- **Is the "premium" tier just the honest game** and the free tier a demo that punishes? Then you built two games and shipped the bad one.
- **Does waiting exist only so waiting can be bought?** Energy/stamina that gates a *single-player* loop is friction with a price tag.

## Twist seams (where it sneaks in disguised)

- **Deckbuilder run pacing but the reroll is metered** *(vector: convenience-as-currency)* — [[anchor-slay-the-spire]] gives free rerolls because the choice IS the game; sell that choice by the tap and you've sold the fun back.
- **Farming-sim cozy loop but the crops need real-time waiting you can skip for cash** *(vector: time-as-hostage)* — [[anchor-stardew-valley]] earns its wait with anticipation; the same wait becomes a ransom the instant a "grow now" button appears. Contrast [[genre-farming-sim]] done as craft vs. as timer.
- **Roguelike meta-progression but the unlock grind is priced per-unlock** *(vector: mastery-gated-behind-wallet)* — [[anchor-hades]] gates power behind *play*; the antipattern gates it behind *pay*, then slows play to widen the gap.
- **Horde-survival power fantasy but revive/continue costs currency mid-run** *(vector: fail-state-as-toll-booth)* — folds directly into [[antipattern-fail-loop-tax]]: the death you engineered becomes a checkout.

## The fix

Sell **expression and content**, never **relief from self-inflicted grind**.

| Instead of selling… | Sell… | Why it's honest |
|---|---|---|
| Skipping the grind | A *new* build/biome/campaign | Adds fun; doesn't first subtract it |
| Stamina refills | Cosmetics, skins, themes | Zero effect on the loop's health |
| Faster timers | A harder mode / new roster | Player *asks* for more, not less |
| Rerolls / conveniences | Nothing — bake them in free | Convenience is table stakes, not SKU |

Anchor the whole economy to [[system-reward-schedules]] and its ethics section: a schedule tuned for *player satisfaction* and one tuned for *spend* diverge fast, and the divergence is the antipattern. Then pressure-test the loop with [[system-economy]] — a healthy economy has sinks that serve fantasy (crafting, prestige, [[system-prestige-and-newgame-plus]]), not sinks that exist to be topped up with money.

Two design guards make the temptation structurally hard:

- **The free game must stand alone as good.** Design it as if monetization didn't exist (borrow the discipline of [[process-pillars]] — pillars name what the game *is*, and "sellable friction" is never a pillar). Then add paid *content* on top. If you can't make the free loop fun, more grind won't fix it — see [[antipattern-content-desert]], the honest reason you were tempted to pad.
- **Respect the player's time as a covenant.** [[pattern-fairness-and-trust]] is the currency you're actually spending; pay-to-skip cashes it out for money. Once players smell the ransom, [[pattern-anti-frustration]] can't win them back — trust doesn't refund.

Distinguish grind that's *content* from grind that's *tax*. A long, fun mastery climb ([[system-mastery-curve]], [[pattern-mastery-and-flow]]) is not this antipattern. The line: does the time spent *teach or delight*, or does it only *exist to be skipped*? If it only exists to be skipped, it's [[antipattern-grind-wall]] with a price tag — cut it, don't monetize it.

## Seen in…

- **Mobile energy/stamina gates** — the canonical form: a single-player loop artificially rationed so refills sell. The wait teaches nothing; it only prices impatience.
- **Free-to-play RPG "time-skip" and "instant-finish" buttons** — construction/research timers set to hours, then dissolved for a coin. The timer is the SKU.
- **Grind-then-sell-the-cure MMOs** — XP curves widened to sell boosters; the level gap is manufactured, then rented back.
- **Full-price games with paid XP boosts** — shipping the *slow* game and selling the *normal* one; the base curve was slackened to make the boost feel necessary. (Broadly reported blowback around 2017-era AAA progression tuning.)

Counter-examples that sell content honestly: [[anchor-stardew-valley]] (no store; the wait is the point), [[anchor-slay-the-spire]] (paid *characters*, not paid rerolls), [[anchor-vampire-survivors]] (cheap DLC adds toys, never removes friction).

## Verify / guard

- **Design gate:** run the "remove the store" thought-experiment above and note the result in the brief ([[process-intent-to-brief]]). If the loop *needs* the store to be fun, the loop is not done — return to [[process-core-loop]].
- **Feel gate:** [[design/FUN.md]] — a loop that only pays off after a purchase fails the intrinsic-motivation check. Pay-to-skip is a *fun-debt* the store is quietly servicing; the proof surface catches the debt even when the pitch hides it.
- **Sibling checks:** [[antipattern-grind-wall]] (the friction), [[antipattern-fail-loop-tax]] (the death toll), [[antipattern-currency-spaghetti]] (the obfuscation that hides the price).

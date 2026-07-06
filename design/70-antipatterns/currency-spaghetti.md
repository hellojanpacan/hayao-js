---
id: antipattern-currency-spaghetti
title: Currency Spaghetti
kind: antipattern
tags: [economy, ui, clarity, bloat]
summary: Too many currencies with unclear roles — the wallet becomes a puzzle the player never asked to solve.
use-when: You are about to add another resource type or premium currency.
composes-with: [system-economy, system-inventory-and-ui, antipattern-feature-soup]
verify-with: docs/VERIFICATION.md
---

**What it is.** The game has six kinds of money and the player can name what none of them does. Every new feature bolted on its own **token**, and the wallet became a HUD of orphaned counters.

**Why it hurts.** Currency is a promise: earn this, spend it there. When the map from earn → spend blurs, players hoard everything, spend nothing, and stop feeling the pull of a reward. A resource nobody can price is not a reward — it is clutter with a number on it. See [[system-economy]] for the sinks/faucets discipline this violates.

## The smell

A resource whose **spend** the player can't state without opening a menu. If "what's this for?" needs a wiki, the currency has no job.

## How it happens

- **Feature-first minting.** Each system ships its own currency for isolation — [[antipattern-feature-soup]] wearing an economy hat. Gems for the shop, shards for crafting, cores for upgrades, dust for rerolls. Nobody merged them because each shipped in a different sprint.
- **Monetization layering.** A soft currency, a hard currency, a battle-pass currency, an event currency, a limited-time currency — see [[system-live-ops-and-seasons]] and [[antipattern-pay-to-skip]] for how this metastasizes.
- **Fear of one economy.** Designers split currencies to "prevent" a dominant strategy, then never notice the split just moved the confusion into the wallet, not out of it.
- **Reward-schedule padding.** More counters look like more progression. It's [[system-reward-schedules]] faked with noise instead of paced with signal.

## The tell (check YOUR design)

- List every currency. Next to each, write **one sentence**: "You earn X by ___, you spend X on ___." Any currency that needs two sentences or a "usually" is spaghetti.
- Two currencies share the same **decision horizon** (both spent in the same shop, same session, on the same axis of power). They are one currency wearing two coats. Merge.
- A currency's balance only ever goes **up** — a faucet with no sink. It's a score, not money; relabel it or cut it.
- Players **hoard**. Full wallets, empty carts. When nobody spends, the currency isn't valued — it's illegible.
- Your onboarding ([[system-onboarding]]) needs a dedicated screen just to explain the wallet. The tutorial length is the symptom; the wallet is the disease.

## Twist seams (X but Y)

- **A deckbuilder economy but one currency, three timescales** (twist vector: *reuse the same coin at run / shop / meta so the player learns it once*). [[anchor-slay-the-spire]] runs gold in-run and one meta unlock track — not five wallets.
- **A city-builder but resources ARE the puzzle, not the clutter** (twist vector: *every resource has a visible sink you can point at on the map*). If a resource has no on-screen consumer, it's spaghetti; if it does, it's [[genre-city-builder]] design. See [[system-resource-loops]].
- **A roguelite but the premium currency is diegetic and singular** (twist vector: *one thing to bank between runs, spent on one board*). [[anchor-hades]] banks a small, legible set with obvious spends — contrast a mobile port that would add four.

## The fix

**One currency per decision horizon.** A horizon is a distinct question the player answers with money: *what do I buy this fight*, *what do I unlock this run*, *what do I keep forever*. Give each horizon exactly one currency; merge the rest into it.

| Move | From | To |
|---|---|---|
| **Merge same-horizon** | gems + shards + dust, all spent in the meta shop | one meta currency |
| **Cut faucet-only** | a counter that only rises | a stat/score, off the wallet |
| **Collapse premium tiers** | soft + hard + event + pass currencies | one earnable + at most one paid |
| **Relabel non-money** | "energy" that gates play | a cooldown, not a wallet slot |

Guardrails while you cut:

- **Three is the ceiling** for most games; two is healthy; one is often enough. Every currency past three must earn its slot by owning a horizon nothing else touches.
- Each currency needs a **named faucet** and a **named sink** the player can point to — the sinks/faucets model in [[system-economy]] and the loop discipline in [[system-resource-loops]].
- Put the wallet where the **spend** is. Currency shown far from its shop reads as noise. This is [[system-inventory-and-ui]] and [[pattern-readability]] work, not an economy tweak.
- If a currency exists to stop a dominant build, fix the build with [[system-counter-systems]] or [[system-build-diversity]] — don't tax the wallet to patch balance.
- A currency the player never *chooses* to spend is [[antipattern-fake-choice]] in ledger form. Real money buys a tradeoff; illegible money buys a shrug.

## Seen in…

- **[[anchor-slay-the-spire]]** — the counter-example. Gold + one meta track; you always know what each buys. Its clarity is why the economy disappears and the *choices* stay foregrounded.
- **[[anchor-hades]]** — several currencies, but each has a loud, single, diegetic spend (Darkness → mirror, Keys → weapons/talents). Legible because roles don't overlap.
- **[[anchor-loop-hero]]** — resource sprawl that flirts with the smell: many mats feed the camp, and early players genuinely can't say which mat gates which building. Saved by a tight sink list, not by the count.
- **Free-to-play RPGs (broadly)** — the textbook offender: gold, gems, crystals, stamina, arena coins, guild coins, event tokens, shards per hero. The wallet becomes a spreadsheet; spending becomes a chore. This is where [[antipattern-pay-to-skip]] and [[system-live-ops-and-seasons]] compound the mess.
- **[[anchor-stardew-valley]]** — mostly one currency (gold) doing enormous work; the few special tokens (Qi gems, tickets) arrive late, isolated, and clearly labeled. Restraint is the design.

## Verify / guard

Design-time gate: enumerate currencies, write the one-sentence earn→spend for each, and count distinct **decision horizons**. Currencies > horizons means merge before handoff. Then prove the sinks/faucets balance and that no currency is faucet-only — the economy checks in [[system-economy]], the wallet-readability check in [[system-inventory-and-ui]], and the run-through in `docs/VERIFICATION.md`.

Before you add currency N+1, answer in one line: *which horizon does it own that no existing currency owns?* If you can't, you're not adding money — you're adding spaghetti.

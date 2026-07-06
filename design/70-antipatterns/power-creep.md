---
id: antipattern-power-creep
title: Power Creep
kind: antipattern
tags: [balance, progression, inflation, live-ops]
summary: Each new addition outclasses the old — content decays on arrival and the back catalog dies.
use-when: You are adding new units/cards/gear over time (live-ops or expansions).
composes-with: [system-progression, system-live-ops-and-seasons, antipattern-stat-inflation]
verify-with: docs/VERIFICATION.md
---

**What it is.** Every new unit, card, or piece of gear is strictly better than what shipped before it. The **newest thing is always the best thing**, so yesterday's content is dead the moment today's drops.

**Why it hurts.** Your library *shrinks* as it grows. Players don't gain options — they gain a new mandatory answer and lose everything it replaced. The catalog you spent years building collapses into a thin, always-current meta, and returning players find their old favorites benched.

## The smell
The new addition beats the old one on **every axis** — more damage, more range, more utility, cheaper cost. No trade sits on the table. "Better" is the only relationship two items ever have.

## How it happens
- **Numbers are the only lever.** New content ships by nudging stats up, because +10% is faster to design than a genuinely new role. See [[antipattern-stat-inflation]] — power creep is its progression-over-time face.
- **Sales pressure.** The new set must feel worth buying, so it must feel *stronger*. Marketing demands a bump; the bump becomes a ratchet.
- **No sunset plan.** Content only accumulates. Nothing rotates out, so old and new must share one power budget forever — and the budget only tilts forward.
- **Fear of "sidegrade" reads as boring.** A designer worried players won't chase a horizontal option reaches for a vertical one instead, killing [[pattern-meaningful-choice]].
- **The chase reward *is* the power.** When [[system-reward-schedules]] pay out in raw strength, every drop must out-drop the last to feel like a reward.

## The tell (check your own design)
- Can you name a **living reason** to pick a two-year-old item over this season's? If the only answer is "nostalgia" or "budget deck," you've crept.
- Line up every item that fills a role by ship date. Is the **strongest one always the newest**? That monotonic staircase is the fingerprint.
- Does a returning player's old loadout still function, or is it **auto-obsolete**?
- Are your patch notes 90% "increased X" and 0% "here is a new thing X is good *at*"? Buffs-only is creep in slow motion.
- Would removing the newest tier collapse the meta to the *previous* newest? If power is a single tower, not a web of counters, [[system-counter-systems]] never got built.

## The fix
- **Sidegrade, don't upgrade.** New content should open a *new axis*, not raise an old one. Give it a strength that costs a weakness — trade damage for range, reliability for ceiling. This is [[pattern-risk-reward]] applied to the catalog itself, and it's how [[system-build-diversity]] survives past launch.
- **Rotate, don't stack.** Cap what's legal at once. Seasons that cycle a pool keep the *total* power flat while the *current* mix stays fresh — the core discipline of [[system-live-ops-and-seasons]]. A rotating format is a sunset plan you build once.
- **Design counters, not ceilings.** Route new power through [[system-counter-systems]] so the answer to a strong thing is *another* thing, not a stronger version of it. A meta that self-corrects doesn't need you to out-buff it.
- **Balance the whole roster, not just the new tier.** Buff the forgotten to meet the new instead of always raising the ceiling — [[system-unit-rosters]] and [[system-faction-asymmetry]] stay legible when the floor rises to the ceiling, not the reverse.
- **Give power a shape, not a size.** Tie progression to *specialization* — [[system-skill-trees]], [[system-build-diversity]] — so "more powerful" reads as "more particular," and [[system-progression]] deepens choice instead of flattening it.
- **Sink the old currency of power.** [[system-prestige-and-newgame-plus]] and reset-friendly [[system-meta-progression]] let you re-flatten periodically instead of inflating forever.

## Twist seams
- **A live-ops card game but power is a fixed budget every season redistributes (twist: conservation vector).** New cards don't add power; they *move* it — every buff is funded by a nerf, so the catalog stays flat while the meta churns. [[system-live-ops-and-seasons]] · [[genre-deckbuilder]].
- **An expansion roster but every new unit hard-counters an old staple and loses to another (twist: rock-paper-scissors vector).** Strength is relational, not absolute — the newest unit is *situationally* best, never globally. [[system-counter-systems]] · [[genre-rts]] · [[system-faction-asymmetry]].
- **A gear ladder but each new tier trades a stat instead of raising it (twist: sidegrade vector).** Late gear is *different*, not stronger — new builds open, old builds keep working. [[pattern-risk-reward]] · [[system-build-diversity]].

## Seen in / avoided in
| Game | What it shows |
|---|---|
| **Slay the Spire** ([[anchor-slay-the-spire]]) | Card additions are sidegrades — new rares open archetypes, they don't dominate; commons stay relevant for years. [[genre-deckbuilder]]. |
| **Into the Breach** ([[anchor-into-the-breach]]) | A tight, closed roster with counter-relationships. No creep because there's no drip of new "stronger" mechs — every squad is a *shape*. [[system-counter-systems]]. |
| **StarCraft** ([[anchor-starcraft]]) / **Dota** ([[anchor-dota]]) | Balance-by-nerf-and-buff on a fixed cast: power is redistributed patch to patch, not added. [[system-faction-asymmetry]]. |
| **Balatro** ([[anchor-balatro]]) | Jokers are lateral engines, not a power ladder — synergy, not a strictly-better tier, drives the build. [[system-build-diversity]]. |
| **Hearthstone-style live-ops TCGs** | The cautionary case: yearly sets that out-stat the last, forcing *rotation* as a retrofitted cure once the catalog became unplayable. |

## Adjacent failure modes
- Creep that voids old content is a cousin of [[antipattern-solved-metagame]] — when only the newest tier is correct, the game solves to one deck fast.
- Numbers-only escalation with no new decisions is [[antipattern-stat-inflation]]; if it also floods the player with must-buy tiers, watch for [[antipattern-pay-to-skip]] and [[antipattern-grind-wall]].
- A "new axis" that's actually just a reskin is [[antipattern-false-depth]] — a sidegrade must genuinely change how you play, not the label on the stat.

## Verify / guard
This is a design-time smell — catch it before handoff by auditing the roster for a monotonic power staircase (strongest-always-newest) and confirming each new item carries a real trade. See [[process-refine-and-handoff]] and the verification bar in `docs/VERIFICATION.md`. Balance proof and roster health live in the JUDGE half, not here — [[system-live-ops-and-seasons]] carries the rotation discipline that keeps this from recurring across seasons.

---
id: system-live-ops-and-seasons
title: Live-Ops & Seasons
kind: system
tags: [live-service, seasons, rotation, retention, content]
summary: How a game stays alive after launch — seasonal rotation, events, and refresh, without power-creeping the back catalog to death.
use-when: You are planning post-launch content cadence and retention.
composes-with: [system-reward-schedules, antipattern-power-creep, system-achievements-and-leaderboards]
verify-with: docs/VERIFICATION.md
---

**What it is.** The post-launch content engine: a repeating **cadence** of seasons, events, and rotations that gives a shipped game a reason to be reopened. Live-ops is the calendar; the game is the venue.

**Player fantasy / why it's fun.** *The game is a place, not a purchase.* Something is happening right now that won't be happening next month — so coming back feels like showing up, not grinding.

## When to use / when NOT

Use when the loop is **replayable** and you can author content faster than players exhaust it — [[genre-roguelike]], [[genre-deckbuilder]], [[genre-horde-survival]], [[genre-auto-battler]], competitive [[genre-fighting-game]]. Live-ops is a promise of *more*; only make it if you can keep it.

**Do NOT** bolt seasons onto a finite, authored, one-and-done experience ([[genre-walking-sim]], [[genre-puzzle-platformer]], a tight [[genre-metroidvania]]). A season on a game with no evergreen loop is a countdown to [[antipattern-content-desert]]. And never ship the calendar before the [[process-core-loop]] is fun on day one — live-ops amplifies a good loop, it does not create one.

## Variants

| Variant | Shape | Reference | Best for |
|---|---|---|---|
| **Battle-pass season** | Fixed-length track of rewards; play to progress tiers | *Fortnite*, *Dead Cells* daily/seasonal ([[anchor-dead-cells]]) | Steady engagement, cosmetic monetization |
| **Rotating modes** | A pool of modifiers/rulesets cycles in and out | *Slay the Spire* dailies ([[anchor-slay-the-spire]]), *Hades* Pact heat ([[anchor-hades]]) | Reframing existing content cheaply |
| **Limited-time event** | Themed content live for a window, then gone | *Vampire Survivors* patches ([[anchor-vampire-survivors]]), holiday events | Spikes, novelty, community moments |
| **Living map / world beat** | The shared world state visibly changes each season | *Fortnite* map, *Animal Crossing* seasons ([[anchor-animal-crossing]]) | Persistence, "you had to be there" |
| **Ranked ladder reset** | Competitive standing wipes and re-climbs on a clock | *StarCraft* ([[anchor-starcraft]]), *Dota* ([[anchor-dota]]) MMR seasons | Keeping [[system-achievements-and-leaderboards]] fresh |

## The twist seams

- **Seasons but content rotates OUT, never just in** *(constraint)*. The default failure mode is accretion: every season adds, nothing leaves, and the game bloats into [[antipattern-feature-soup]]. Flip it — a season *swaps* the active pool. Old content vaults; new content takes its slot. The total surface stays legible, the game stays balanceable, and "it's leaving soon" creates honest urgency without a paywall. This is the single strongest defense against [[antipattern-power-creep]]: if nothing is permanent, nothing has to out-stat what came before.
- **Live-ops but the community authors the season** *(perspective)*. Stop being the sole content factory. Let the playerbase supply the theme, the challenge, the map layout, or the featured builds — via voting, community-run tournaments, or a curated workshop. *Dota 2*'s community-voted arcanas and *Minecraft*'s ([[anchor-minecraft]]) mod-driven seasonal servers show the load can shift outward. Your job becomes curation and framing, not endless origination — and the season means more because players made it.

## Tuning levers

| Lever | Turn up → | Turn down → |
|---|---|---|
| **Cadence** | Faster (weekly) = habit, but burns content and staff | Slower (quarterly) = each drop is an event, but dead air between |
| **Rotation vs accumulation** | Rotate out → legible, balanceable, urgent | Accumulate → collector satisfaction, but bloat + creep |
| **Track length** | Long pass = commitment, but a completion cliff for late joiners | Short pass = casual-friendly, but weaker retention hook |
| **Catch-up generosity** | Generous → newcomers belong ([[system-onboarding]]) | Stingy → early adopters feel elite, latecomers bounce |
| **Exclusivity** | Never-again rewards = urgency + status | Re-earnable = fairness, but softer pull |
| **Reward mix** | Cosmetic-heavy = safe (no creep) | Power-heavy = the fastest road to [[antipattern-pay-to-skip]] and creep |

## FOMO ethics — the line you don't cross

Urgency is fine. Manufactured anxiety is a dark pattern. Hold the line:

- **Reward time, not panic.** A season should feel like *"I got to be there,"* never *"I'll lose something if I sleep."* Missing a season should cost status, not power.
- **Cap the demand.** A season the average player finishes in normal play is a treat. One that requires a daily-login, multi-hour tax to complete is a **second job** — see [[antipattern-grind-wall]] and [[antipattern-fail-loop-tax]].
- **No power behind the paywall.** Sell cosmetics, sell the pass, sell time-savers that don't tilt PvP. Selling raw strength collapses the [[system-economy]] and poisons [[system-coop-and-competition]].
- **Honest countdowns.** No fake "only 3 left" scarcity, no reset-the-timer manipulation. Trust is the retention asset ([[pattern-fairness-and-trust]]); spend it once and it's gone.
- **Respect the lapsed player.** Design catch-up so returning after a break is a welcome, not a wall of missed obligations.

## How it wires to Hayao

Live-ops is **content scheduling over a deterministic base** — the sim never learns the real calendar; a season is data fed in, not wall-clock read inside the loop. Keep it clean:

- **Seasons are content, not code.** A season is a manifest — active pool, modifiers, reward track, theme — selected by an explicit season id passed into world setup. Never branch the sim on an argless `new Date`; that breaks determinism and replay. Feed the date-derived season id *in* from the shell.
- **Modifiers ride existing systems.** A rotating mode is a modifier layered onto [[system-difficulty-and-dda]] or [[system-procgen-design]] — the same seed + season id must reproduce the same run. Study the daily-challenge shape in a roguelike reference: one seed, one ruleset, everyone gets the identical board.
- **Reward tracks are a [[system-reward-schedules]] instance.** The battle-pass tier ladder is a schedule; author it there, don't reinvent pacing here.
- **Menu chrome is DOM.** Season shop, pass progress, and event banners are screens, not sim state — keep them cosmetic and out of the world hash.

## Fails when…

- It becomes **power-creep**: every season must out-stat the last to feel worth it → [[antipattern-power-creep]] and [[antipattern-stat-inflation]]. Rotation-out is the cure.
- It becomes a **second job**: completion demands a grind tax players resent → [[antipattern-grind-wall]], [[antipattern-fail-loop-tax]].
- The **evergreen loop was never fun**, so live-ops is life support on a corpse → fix the [[process-core-loop]] first.
- Sold **power collapses fairness** → [[antipattern-pay-to-skip]].
- Content is announced faster than it ships → [[antipattern-content-desert]] between drops feels worse than never promising.
- Novelty is all breadth, no depth → [[antipattern-false-depth]]; a reskin is not a season.

## Verify

Frontmatter sets the target: see **docs/VERIFICATION.md**. Season selection must be deterministic (same season id + seed → same run) and all season state must stay out of the world hash where it's cosmetic. Prove the reward track's pacing against [[system-reward-schedules]], and confirm catch-up math lets a mid-season joiner reach the finale within the remaining window.

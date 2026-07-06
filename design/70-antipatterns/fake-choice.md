---
id: antipattern-fake-choice
title: Fake Choice
kind: antipattern
tags: [decisions, balance, depth, illusion]
summary: Options that look meaningful but collapse to one right answer — the menu is a costume for a corridor.
use-when: You are adding choices; check whether any is actually taken by informed players.
composes-with: [pattern-meaningful-choice, system-build-diversity, antipattern-solved-metagame]
verify-with: docs/FUN.md
---

**What it is.** A branch presented as a **decision** that, once understood, has one dominant answer or no answer at all. The player picks, but the pick doesn't change anything that matters.

**Why it hurts.** A choice you always resolve the same way is a **corridor** wearing the mask of agency. It costs UI, costs the player deliberation time, and pays out nothing — worse, it teaches players their agency is theater, so they stop reading your real choices too.

## The smell

The **dominated option**: two doors, one strictly better on every axis. Or the **cosmetic fork**: three builds that differ in flavor text but converge on the same numbers. Informed players don't agonize — they autopilot.

## How it happens

| Origin | What you did |
|---|---|
| Balance drift | One option got a buff (or the rest got nerfed) and now dominates. |
| Same-axis options | "+10 damage" vs "+15 damage" — more of the identical thing, never a real fork. |
| Illusion for narrative | A [[genre-narrative-decisions]] branch that reconverges two lines later with no state change — see [[antipattern-guess-the-designer]] when it's *readable* but pointless. |
| Fear of commitment | You refused to let a choice lock the player out of anything, so nothing is at stake. |
| Content padding | Options added to *look* deep — the [[antipattern-false-depth]] cousin. |

## The tell (check YOUR OWN design)

- **The informed pick.** Imagine a wiki-literate player. Do they hesitate? If the "right" answer is common knowledge, the choice is decoration.
- **Pick rate.** Instrument it. If one branch takes >70-80% among experienced players, it's dominant — that's the same signal a [[antipattern-solved-metagame]] leaves, one node early.
- **The strict-better test.** List every axis (damage, cost, risk, speed, range). If option A beats B on *all* of them, B is dead. A live choice needs a trade — A wins here, B wins there.
- **The reconverge test.** Trace where the branches lead. If they rejoin with identical world state, the fork was cosmetic.
- **The "why not both" reflex.** If the smart move is to grab both eventually and order barely matters, it's a to-do list, not a choice.

## The fix

**Give options different axes, not different amounts.** A real choice is a **trade** — each side pays a cost the other doesn't, and no single axis ranks them. Route the fix through [[pattern-meaningful-choice]]; the surrounding systems that keep it live:

- **Orthogonal payoffs.** Not "more damage" vs "more damage" — make it *burst now* vs *scaling later*, *safe* vs *greedy*. See [[pattern-risk-reward]] and [[system-build-diversity]].
- **Cost and opportunity cost.** A choice with no exclusion isn't one. Let picks lock others out; lean on [[system-economy]] and [[system-resource-loops]] so every yes is a no elsewhere.
- **Situational dominance.** Balance so each option is best *sometimes* — [[system-counter-systems]] and [[system-encounter-design]] rotate which axis matters, so no global winner exists.
- **Context that shifts the answer.** [[system-difficulty-and-dda]], enemy mix, and board state should change which fork wins turn to turn.
- **Legible stakes.** If the trade is real but invisible, players still autopilot — surface it with [[pattern-readability]] and [[system-telegraphs]].

## Twist seams

- **A skill tree but every node is a trade with a permanent lockout** (twist vector: *exclusion*) — no completionist path, so each pick is a real fork. See [[system-skill-trees]].
- **A shop but the cheap item and the strong item are never both affordable this run** (twist vector: *scarcity gating*) — [[anchor-slay-the-spire]] and [[anchor-balatro]] keep offers live by pricing you out of "just take both."
- **A dialogue branch but the world remembers and re-serves the cost hours later** (twist vector: *deferred consequence*) — [[anchor-disco-elysium]] / [[anchor-reigns]] turn narrative forks into commitments, not flavor.

## Seen in…

| Game | Live choice | Why it holds |
|---|---|---|
| [[anchor-into-the-breach]] | Every turn: which threat to eat | Full information, yet no dominant line — you *trade* damage taken for board control. |
| [[anchor-slay-the-spire]] | Card picks and path branches | Cards trade tempo vs scaling vs defense; the "best" card depends on your deck's axis. |
| [[anchor-civilization]] | Tech and policy forks | Each opens a different victory axis; dominance is situational, not global. |
| [[anchor-dishonored]] | Lethal vs ghost | Different playstyle *and* different world-state outcome — orthogonal, not more-vs-less. |
| [[anchor-hades]] | Boon choices | Boons trade build identity ([[system-build-diversity]]); rarity + duo constraints keep any one from dominating. |

**Failure cases to study:** RPGs where a "morality choice" reconverges with no mechanical delta; loot systems where every drop is "+X to the same stat" (the [[antipattern-stat-inflation]] trap); talent trees with an obvious optimal spread everyone copies — the [[antipattern-boring-optimal]] endpoint of a fake choice left to rot.

## Composition notes

- Fake choices that survive to the metagame become a [[antipattern-solved-metagame]] — one fork upstream, same disease. Fix the choice and you starve the solve.
- Fixing this by piling on *more* options invites [[antipattern-decision-paralysis]] and [[antipattern-feature-soup]]. Fewer choices, each a real trade, beats many that are cosmetic — see [[pattern-restraint-and-negative-space]].
- Depth-by-illusion is the sibling failure: distinguish *fake choice* (options collapse to one) from [[antipattern-false-depth]] (systems that look deep but don't interact). Both fail [[pattern-emergence]].

## Verify / guard

Before handoff, run the design against [[docs/FUN.md]]: for each branch, name the axis it wins on and the axis it loses on. If you can't name a losing axis, it's dominant — cut it or re-cost it. Instrument pick rates once playable ([[system-achievements-and-leaderboards]] telemetry, or the studio playtest loop) and treat any >80% branch among informed players as a fake choice to fix, not ship.

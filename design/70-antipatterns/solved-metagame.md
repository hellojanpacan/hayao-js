---
id: antipattern-solved-metagame
title: Solved Metagame
kind: antipattern
tags: [balance, depth, dominant-strategy, build]
summary: One build/deck/opener dominates — mastery becomes copying the wiki, and the space collapses.
use-when: Playtest data or your own play shows convergence on a single strategy.
composes-with: [system-build-diversity, system-counter-systems, pattern-meaningful-choice]
verify-with: docs/VERIFICATION.md
---

**What it is.** Your option space has one right answer. The correct move is knowable in advance, so play stops being a decision and becomes recall. Mastery = reading the tier list, not reading the board.

**Why it hurts.** A game's depth is the number of *live* choices per moment. When one build wins everywhere, every other option is a trap and every match is the same match. Discovery dies, expression dies, replay dies. Worse: the player who copies the wiki beats the player who thinks — you punished engagement.

## The smell

There is an **S-tier answer to every situation**, and it isn't situational. The optimal loadout is a constant, not a function of the state you're in.

## How it happens

| Cause | What it looks like |
|---|---|
| **Unconditional payoffs** | An option is strong in all contexts, so nothing ever beats it. No rock-paper-scissors, only rock. |
| **Free power** | The best pick has no opportunity cost — you'd take it even if it were second-best, because it costs nothing to slot. |
| **Flat cost curves** | Strong and weak options cost the same. Price never taxes strength, so strength is always correct. |
| **A degenerate combo** | Two pieces multiply instead of add; the loop scales faster than any counter can. See [[antipattern-power-creep]]. |
| **No answers exist** | You shipped a threat but never shipped the check for it. The metagame can't self-correct because the tools aren't in the box. |

Note the shape: this is [[antipattern-fake-choice]] arrived at empirically. Fake choice ships options that are *obviously* junk; a solved metagame ships options that *looked* balanced until players did the math. The tell differs, the cure overlaps.

## The tell (check YOUR design)

- You can name the best build **without knowing the opponent, the seed, or the board**.
- Playtest logs show pick-rate for one option climbing past ~40% and still rising.
- Your own "what would I take?" answer is the same across every scenario you imagine.
- Win-rate splits by build, not by skill — the loadout, not the player, predicts the outcome.
- Nobody talks about matchups anymore; they talk about *the* build.
- A new option ships and either does nothing or instantly becomes the only option. No middle.

If two of these fire, you don't have a balance nudge — you have a collapsed space. Treat convergence as data ([[system-build-diversity]] is the health metric), not opinion.

## The fix

The cure is to make strength **conditional** — pay for it, counter it, or situate it. Reach for these systems:

| Lever | What it does | Link |
|---|---|---|
| **Soft counters** | Every strong line has a line that answers it — not a hard lock, a favorable trade. Counters exist *in the box*, so the meta self-corrects. | [[system-counter-systems]] |
| **Cost curves** | Price strength. A dominant effect that costs double stops being free; now it's a real bet. | [[system-economy]], [[pattern-risk-reward]] |
| **Situational payoffs** | Make the ceiling context-dependent. The build that wins vs. aggro loses vs. control. Now the choice is a read. | [[pattern-meaningful-choice]] |
| **Roster / archetype spread** | Ship options that want different states, so no single loadout covers the field. | [[system-build-diversity]], [[system-enemy-archetypes]] |
| **Asymmetric matchups** | Lean into faction/kit identity so "best" is relative to who you face. | [[system-faction-asymmetry]] |

The design test: **can you draw the counter-graph?** Every top option should have an arrow pointing at it from something else that's also viable. If the graph has a sink — a node nothing beats — that's your solved build. Cut its floor, raise its cost, or ship its answer before handoff.

## Twist seams

- **Deckbuilder but the S-tier card is a liability at 3+ copies** (twist: dominance self-taxes) — the strongest piece degrades when stacked, so the "solve" caps itself.
- **Roguelike but the map re-tiers your build each floor** (twist: the meta is re-solved every run) — what's S-tier depends on the biome/modifier rolled, so there's no portable answer to copy. See [[system-procgen-design]], [[anchor-into-the-breach]] for state-first evaluation.
- **Tactics but every unit hard-checks exactly one other** (twist: no strategy, only reads) — the optimal pick is a pure function of what the enemy fielded, never of a tier list. [[anchor-into-the-breach]] makes threats fully legible so the answer is a puzzle, not a build.

## Seen in…

- **StarCraft / StarCraft II** ([[anchor-starcraft]]) — decades of balance patches *are* the war against solved metagames; a single dominant build order triggers a nerf because it flattens the [[system-faction-asymmetry]].
- **Slay the Spire** ([[anchor-slay-the-spire]]) — mitigates it structurally: card rewards are drafted from a random pool, so no run hands you the same "best deck." The meta is soft because the inputs are.
- **Hearthstone-style deckbuilders** — the textbook failure: when one net-deck posts a 60% win-rate, ladder becomes mirror matches and the community reports the game as "solved" until the patch.
- **Dota 2 / MOBAs** ([[anchor-dota]], [[genre-moba]]) — patch cadence exists to keep the hero/item space from settling; a "must-pick" is treated as a bug, not a favorite.
- **Vampire Survivors** ([[anchor-vampire-survivors]]) — deliberately *low* on this axis in the endgame (a few evolutions dominate), and survives it only because the fantasy is power-fantasy overload, not competition. Know which forgiveness your genre buys you.

The pattern: competitive and PvP games treat convergence as a five-alarm fire; solo power-fantasy games can tolerate a settled meta *if* the loop's pleasure isn't optimization. Diagnose against your genre — see [[system-mastery-curve]] and [[pattern-mastery-and-flow]] for whether a stable "best" is a bug or a plateau you intended.

## Verify / guard

Convergence is measurable, so measure it. Track pick-rate and win-rate *by option* across a batch of seeded runs; a spike past your threshold on either is the alarm. Because Hayao sims are deterministic (fixed-seed RNG), you can replay the same field against every build and read the counter-graph directly instead of guessing. Wire the check per [[system-build-diversity]] and gate it in **docs/VERIFICATION.md** before handoff — a design that can't show a live spread of viable options hasn't cleared this antipattern. Related failure modes to check alongside: [[antipattern-boring-optimal]] (the optimal is dull even when it's not unique), [[antipattern-power-creep]] (the solve that arrives via inflation), [[antipattern-fake-choice]] (its symptom-level cousin).

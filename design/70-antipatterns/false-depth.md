---
id: antipattern-false-depth
title: False Depth
kind: antipattern
tags: [depth, complexity, clarity, mastery]
summary: Complexity mistaken for depth — many rules, few meaningful decisions; the game is complicated, not deep.
use-when: Your system has grown many rules; check whether they create decisions.
composes-with: [pattern-emergence, pattern-meaningful-choice, system-mastery-curve]
verify-with: docs/FUN.md
---

**What it is.** A system that is **complicated**, not **deep**: many rules the player must memorize, but only one live decision at any moment. Depth comes from rules *interacting*; false depth stacks rules that never touch.

**Why it hurts.** The player pays a rising **memorization tax** — more stats, more keywords, more edge cases — and gets no new expression for it. Mastery feels like homework, not fluency. The system looks rich in a wiki and plays flat at the table.

## The smell

Rules go up. Decisions stay flat. Every new mechanic is a *separate lever* the player pulls in isolation — not a new axis that reshapes the levers already there. **Combinatorics near zero.**

## How it happens

- **Additive design.** Each patch bolts on a subsystem to feel bigger. Nobody asks whether it *multiplies* against the others.
- **Keyword sprawl.** Twelve status effects that each do one flat thing to one target; none reacts to another. See [[system-status-effects]] for the interacting kind.
- **Stat soup.** Six damage types, six resistances, and no reason to ever prefer one — the matchup collapses to "bring the biggest number." Cousin of [[antipattern-stat-inflation]].
- **Rules as flavor.** A mechanic exists to justify the theme, not to change what you'd do. It reads as depth in the manual and is inert in play.
- **Fear of subtraction.** The team measures depth by rule count, so cutting a rule feels like cutting depth. It's the opposite.

## The tell (check YOUR design)

- Name the **decisions per turn/second**, not the rules. If rules climbed and live decisions didn't, you have false depth.
- **The interaction grid.** List your mechanics on both axes. Fill each cell with what happens when the two combine. Mostly empty grid → complicated, not deep. Slay the Spire's grid is dense (block × strength × frailty × exhaust); a stat-soup RPG's is diagonal-only.
- **The dominant-line test.** Ask a strong player for the optimal play in three spots. If the answer is the same shape every time regardless of the trimmings, the trimmings are decoration. See [[antipattern-boring-optimal]].
- **Explain-the-cut test.** Delete a rule on paper. If skilled play barely changes, that rule was memorization load, not depth.
- **Wiki vs. hands.** The design impresses on a reference page but nobody debates lines in it. Depth generates arguments; complication generates lookups.
- **Onboarding pain without payoff.** [[system-onboarding]] balloons and the ceiling doesn't rise — a classic false-depth signature, adjacent to [[antipattern-endless-tutorial]].

## The fix

Depth is **interacting rules, not more of them**. Before adding, make what you have multiply.

- **Route through [[pattern-emergence]].** Give existing rules a shared currency, resource, or state they all read and write, so combining them produces situations you didn't script. Fewer rules, more outcomes.
- **Every rule must earn a decision.** Hold each mechanic to [[pattern-meaningful-choice]]: it must create a fork a skilled player would deliberate over, with a real cost on both sides ([[pattern-risk-reward]]). A rule that never changes the optimal play is cut, not kept.
- **Shape the ceiling with [[system-mastery-curve]].** Depth you can't grow into is trivia. The curve should show new decisions unlocking at each tier, not new vocabulary.
- **Compound, don't append.** New content should recombine old verbs — see [[system-emergent-systems]] and [[system-build-diversity]]. A card, unit, or relic that only interacts with itself is a dead cell in the grid.
- **Subtract to sharpen.** Cut the flat keyword; deepen a remaining one so it now reacts to two others. Net rules down, net depth up. This is [[pattern-restraint-and-negative-space]] applied to systems.
- **When you must add, do it as a twist.** Route the addition through [[process-the-twist]] so it bends the whole system, not sits beside it.

### Twist seams

- **Baba's rulebook but the rules are objects you rearrange mid-level** (interaction vector: every rule now composes with every other because they share one substrate — pushable word-blocks — see [[anchor-baba-is-you]]).
- **A deckbuilder but each new card rewrites how two existing cards resolve** (multiplication vector: content count stays low, the interaction grid fills — the [[anchor-balatro]] / [[anchor-slay-the-spire]] model, [[genre-deckbuilder]]).
- **A tactics game but the whole ruleset fits on a card and the depth lives in board state** (subtraction vector: [[anchor-into-the-breach]] proves few interacting rules beat many isolated ones; [[genre-tactics]]).

## Seen in…

| Case | What it looks like |
| --- | --- |
| Stat-soup RPGs | Many damage/resist types that never create a real matchup — you always bring the biggest number. Contrast the tight elemental loops that *do* interact. |
| Late-patch fighting games | Move lists balloon; the viable neutral shrinks to a few dominant options. Vocabulary up, decisions flat — see [[anchor-street-fighter]] as the counter-example when the roster stays *legible*. |
| Feature-creeped 4X | Twenty overlapping resource tracks that don't feed each other; [[antipattern-currency-spaghetti]] wearing a depth costume ([[genre-4x]]). |
| Kitchen-sink survival | A crafting tree with hundreds of recipes, most inert. Contrast [[anchor-factorio]], where every recipe feeds the throughput puzzle — the tree *is* the interaction. |

**Positive proof (deep by interaction, not by count):** [[anchor-into-the-breach]] (a handful of rules, a combinatorial board), [[anchor-slay-the-spire]] and [[anchor-balatro]] (small card pools, dense synergy grids), [[anchor-tetris]] (one verb, infinite decisions), [[anchor-dark-souls]] combat (few stats, deep matchups). Each has *low* rule count and *high* decision density — the exact inverse of this antipattern.

## Neighbors

- [[antipattern-feature-soup]] — the systems-level parent: unrelated features bolted on. False depth is what feature soup feels like from the *player's* seat.
- [[antipattern-fake-choice]] — options that don't matter; false depth is *rules* that don't matter.
- [[antipattern-boring-optimal]] — the endgame symptom: a dominant line that ignores most of the rules.
- [[antipattern-decision-paralysis]] — the opposite failure. Too many *meaningful* choices at once overwhelms; false depth has too few meaningful choices under too many rules. Both are miscalibrated decision density.

## Verify / guard

Prove decision density, not rule count. Take the interaction-grid and dominant-line checks above into playtest and confirm against **docs/FUN.md** — the front half designs for depth; the verify half asserts the choices are real. If skilled play collapses to one line, you shipped complication.

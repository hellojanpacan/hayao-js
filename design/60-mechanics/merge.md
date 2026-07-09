---
id: mechanic-merge
title: Merge / Combine
kind: mechanic
tags: [puzzle, combine, number-go-up, grid]
summary: Fuse like-with-like into the next tier — the compulsive "combine to ascend" verb.
use-when: You want a simple combinatorial growth loop with escalating payoff.
composes-with: [mechanic-stack, genre-match3, system-crafting]
anchors: [anchor-katamari]
verify-with: design/FUN.md#13-·-match-3
---

**What it is.** Two tokens of the same **tier** collide and become one token of the next tier up. The board is finite; every merge frees a cell, every non-merge fills one. 2048 in a sentence.

**Player fantasy / why it's fun.** Watching a number climb by your own hand. The **tier-up pop** is a tiny slot-machine payout you caused — legible cause, escalating reward, and the constant low dread that the board is filling faster than you can clear it.

## The verb
Bring two like tiles together; they collapse into one tile one tier higher. That's it — the depth is *where* and *when*, not *how*.

## How it feels / why it's fun
- **Cause you own.** No RNG in the fuse itself — the payout reads as skill, not luck. Contrast the drip of [[system-reward-schedules]]; here the schedule is *self-paced*.
- **The pop.** The merge is the whole hit. Land the juice on it — scale-punch, pitch-rising chime, tier color shift. See [[pattern-juice-choreography]] and the choreography cousin [[mechanic-stack]].
- **Compounding stakes.** Each tier is exponentially rarer, so a high tile is a visible trophy and a visible liability (it hogs a cell forever until it merges).
- **Board pressure.** Spawns arrive whether you want them or not. The tension is space, not time — the [[pattern-pacing-and-tension]] comes from the shrinking margin. See also [[pattern-risk-reward]].

## Tuning levers
| Lever | What it controls | Sane default |
|---|---|---|
| Merge count | tiles needed to fuse | 2 (2048) — 3 tightens the vise |
| Tier ratio | value jump per tier | ×2 (doubling reads instantly) |
| Spawn rate | new tokens per action | 1 per move |
| Spawn mix | which tiers can spawn | 90% tier-1, 10% tier-2 |
| Spawn control | does the player *place*? | none (slide) vs. aim (drop) |
| Board size | cells before choke | 4×4 (classic squeeze) |
| Win/loss | tier goal vs. board-full | reach tier-11 / no legal move |

Small board + forced spawn = pressure cooker. Big board + player-placed spawn = cozy sandbox. Pick the axis first; it *is* the genre.

## Slots into
- [[genre-grid-puzzle]] — the native home (2048, Threes).
- [[genre-match3]] — merge is match-3's greedier sibling; see its own [[design/FUN.md#13-·-match-3]] proof.
- [[genre-incremental]] — merge boards are a clean [[system-resource-loops]] engine; the tier IS the number-go-up. See [[recipe-merge-factory]].
- [[genre-city-builder]] / [[genre-management-tycoon]] — merge-2 mobile builders (Gram Games' *Merge Dragons*) stack a soft economy on top; watch for [[system-economy]] and [[antipattern-pay-to-skip]].
- Anchors: [[anchor-katamari]] (fuse-by-absorption — same "small-becomes-large" dopamine at physical scale), [[anchor-tetris]] (the finite-board-fills sibling; merge is Tetris where lines clear by likeness, not rows).

## Twist seams
- **Merge but merging costs the space you need** (constraint) — the fused tile is *bigger* than its inputs, so ascending shrinks your board instead of freeing it. Now every merge is a bet against your own room. Ties to [[pattern-risk-reward]] and the pressure logic of [[anchor-tetris]].
- **Merge but two DIFFERENT things fuse into a third** (a mechanic-swap toward crafting) — abandon like-with-like; wood + fire → torch. This *is* a recipe graph, so lean on [[system-crafting]] and [[system-tech-tree]]. The design cost: players must *learn* combos, so pair with [[system-onboarding]] or a discoverable [[pattern-emergence]].
- **Merge but the tiers are a deck** (mechanic-swap) — fuse two cards into a rarer card mid-run; [[anchor-balatro]]/[[genre-deckbuilder]] territory, where the merge shapes a build. See [[system-build-diversity]].

## How it wires to Hayao
- Pure-logic first. The board is a `Puzzle<State, Move>` — a grid of tiers, a move enumerator, a deterministic resolver. Every merge is a state transition; every level is machine-proven reachable. This is exactly the logic/view split `examples/sokoban/` demonstrates.
- **Spawns through the deterministic RNG only** — seed it so a board is replayable and the solver can prove the goal tier is attainable. No `Math.random` in the fuse or the spawn.
- The pop is **cosmetic**: scale-punch, particle, chime live in view nodes flagged `cosmetic` so they never touch the world hash. Study a particle/tween isolation in `sandboxes/` before choreographing.
- Ordered iteration when resolving a whole row of merges — left-to-right, one fuse per tile per move (the 2048 rule), or the sim drifts non-deterministic.

## Fails when…
- **Spawns outrun clears.** If the board fills before skill can matter, it's not tension, it's a coin flip — [[antipattern-rng-frustration]]. Cap spawn tiers and pace them.
- **One optimal path.** Corner-hoard-and-snake is 2048's solved line; if your board rewards a single rote pattern you've built [[antipattern-boring-optimal]]. Add spawn control, hazards, or an objective that punishes hoarding.
- **The number stops meaning anything.** Tier-40 feels identical to tier-8 — [[antipattern-false-depth]] and [[antipattern-stat-inflation]]. Re-skin tiers into distinct *things*, or gate a new mechanic every N tiers.
- **Grind for a paywall.** Merge economies slide fast into [[antipattern-grind-wall]] and [[antipattern-pay-to-skip]]. Keep the loop paced by the board, not the wallet.
- **The pop is mushy.** No punch on the fuse and the whole verb goes flat — that's [[antipattern-unreadable-juice]] read backwards: too little, not too much.

## See also
[[mechanic-stack]] · [[genre-match3]] · [[genre-grid-puzzle]] · [[genre-incremental]] · [[system-crafting]] · [[recipe-merge-factory]] · [[pattern-risk-reward]] · [[pattern-juice-choreography]] · [[anchor-tetris]] · [[anchor-katamari]] · [[process-the-twist]]

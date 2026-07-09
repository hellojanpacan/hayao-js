---
id: mechanic-portal
title: Portal / Linked Doors
kind: mechanic
tags: [puzzle, space, teleport, momentum]
summary: Two openings become one — carry momentum and sightlines through folded space.
use-when: A spatial puzzle wants folded geometry and momentum tricks.
composes-with: [mechanic-teleport, genre-puzzle-platformer, pattern-emergence]
anchors: [anchor-portal]
verify-with: design/FUN.md#1-·-grid-puzzle
---

**What it is.** Two openings are welded into **one seam**: whatever crosses opening A exits opening B at the same speed, rotated to B's facing. Space folds; the level's true topology is not its layout.

**Player fantasy / why it's fun.** You see through a wall to somewhere else, aim at it, and *arrive* — the "speedy thing goes in, speedy thing comes out" loop of *Portal*. The joy is turning a dead-end room into a launch tube by re-parenting gravity through geometry.

## The verb
Aim a portal at a surface, then walk, fall, or fling yourself through the resulting seam.

## How it feels / why it's fun
- **Momentum is preserved** — a long drop into a floor portal fires you out a wall portal at that same speed. Flinging beats walking; that gap is the whole skill ceiling.
- **The sightline is the tutorial.** If the player can *see* the far room framed inside the near portal, they already understand the connection. Break that view and you break comprehension — see [[pattern-readability]].
- **One rule, deep tree.** A single "in-here-is-out-there" law composes into puzzles nobody hand-authored. That's [[pattern-emergence]] doing the design work.

## Tuning levers
| Lever | What it changes | Sane default |
|---|---|---|
| Momentum carry | fraction of speed kept through the seam | 1.0 (lossless — the fun) |
| Placeable count | portals the player owns at once | 2 (one pair) |
| Placement surfaces | which walls accept a portal | "portalable" material only |
| Exit-facing rule | how velocity rotates on exit | align to exit normal |
| Cooldown / recharge | delay before re-firing | 0; instant is snappier |
| Who may pass | player / objects / enemies / light | player + objects |
| Persistence | does a portal survive room reset | pair persists until re-fired |

## Slots into
- [[genre-puzzle-platformer]] — the native home; folded rooms plus [[mechanic-double-jump]]-free traversal.
- [[genre-grid-puzzle]] — quantized portals as discrete edges of a graph; pairs with [[system-map-and-navigation]].
- [[genre-metroidvania]] — a portal *gun* is a gated traversal power; place it behind [[system-progression]].
- [[genre-immersive-sim]] — portals as one of several ways past a wall; rewards [[pattern-emergence]].
- Anchor: [[anchor-portal]] is the canon. Study its "momentum in, momentum out" and its blue/orange colour-coding.

## Twist seams
- **Portals but only enemies can pass through, not you** *(constraint)* — the seam is a hazard, not a tool: you redirect *their* patrols and projectiles, never step through. Kin to a deflect ([[mechanic-deflect]]) at level scale; leans on [[system-enemy-ai]] and [[genre-stealth]].
- **Portal but placing one closes the last** *(structure)* — you never hold a pair; you hold a single moving door and must chain placements, so the puzzle is *sequencing* placements in time, not arranging them in space. Turns the mechanic into a [[mechanic-teleport]] with a breadcrumb tax.
- **Portals but light and sightlines pass, mass does not** *(constraint)* — you route lasers, guard vision cones, and camera views through the fold while your body stays put; pairs with [[system-telegraphs]] and stealth detection.

## How it wires to Hayao
- Model the pair as **linked transforms**: on cross, remap position into the partner's local frame and rotate velocity by the frame delta. Keep the math in pure logic so [[genre-grid-puzzle]] variants stay machine-provable.
- For the discrete case, treat portals as **extra edges in the level graph** and prove reachability with the same solver you'd use for any turn-based puzzle — the sokoban example is the reference for the logic/view split.
- The **seam preview** (rendering the far room inside the near opening) is pure view — mark those nodes cosmetic so they stay out of the world hash. Study a camera/render lab in `sandboxes/` for the framing trick rather than a whole game.
- Momentum-through-a-portal is a physics coupling; prototype the carry rule in a physics `sandboxes/` lab before wiring it to a level.
- Determinism note: portal traversal must resolve identically every run — order the "who crossed this tick" checks; no wall-clock, all randomness through the world RNG.

## Fails when…
- **Momentum is dropped on exit.** Lossless carry is the mechanic; bleed it and you've built a fancy [[mechanic-teleport]]. Don't silently cap speed — that's an [[antipattern-input-lie]].
- **The far side can't be read.** No sightline, no preview, or a disorienting exit-facing means the player fires blind and rages. See [[pattern-readability]] and [[pattern-fairness-and-trust]].
- **Every surface is portalable.** Infinite placement collapses the puzzle; the *constraint* (only some walls accept portals) is what creates the problem. Unbounded freedom here is [[antipattern-false-depth]].
- **Too many pairs at once.** Three-plus open seams overwhelm spatial reasoning and invite [[antipattern-decision-paralysis]]; the two-portal limit is load-bearing.
- **The twist isn't the whole game.** A portal bolted onto an unrelated loop is [[antipattern-feature-soup]] — fold the geometry into the core verb or cut it. See [[process-the-twist]].

## See also
- [[mechanic-teleport]] · [[mechanic-clone]] · [[mechanic-gravity-flip]] · [[mechanic-bounce]]
- [[genre-puzzle-platformer]] · [[genre-grid-puzzle]] · [[genre-immersive-sim]]
- [[pattern-emergence]] · [[pattern-readability]] · [[anchor-portal]]
- [[process-the-twist]] · [[system-map-and-navigation]]

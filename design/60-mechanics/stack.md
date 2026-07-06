---
id: mechanic-stack
title: Stack / Tower
kind: mechanic
tags: [physics, puzzle, balance, build]
summary: Pile objects into a growing, wobbling structure — height is score and jeopardy at once.
use-when: You want a build-and-balance toy where growth is tension.
composes-with: [mechanic-throw, genre-physics-arcade, pattern-risk-reward]
verify-with: docs/FUN.md#19-·-physics-arcade
---

**What it is.** The player adds pieces to a vertical structure that must not fall. Each new piece raises the **score** and lowers the **margin** — the tower that earns you points is the tower that kills you.

**Player fantasy / why it's fun.** "One more, I can balance it." Growth is visible, precarious, and self-inflicted. You are not fighting an enemy — you are fighting the thing you built, and every point is a debt against gravity.

### The verb
Place, drop, or fling a piece so it settles on what is already there — then decide whether to push your luck with another.

### How it feels / why it's fun
- **Legible jeopardy.** A leaning tower telegraphs its own doom; the player reads risk with their eyes, no UI. See [[pattern-readability]].
- **Self-authored tension.** The difficulty curve is the player's own greed. Height is both the reward and the threat — a pure [[pattern-risk-reward]] engine.
- **The wobble is the whole game.** Instability must be *felt* before it's fatal: sway, creak, a lean that recovers. That anticipation is the juice — [[pattern-pacing-and-tension]].

### Tuning levers

| Lever | What it controls | Sane default |
|---|---|---|
| **Placement model** | Snap-to-grid vs free physics | Free physics (wobble) for arcade; snap for puzzle |
| **Center-of-mass tolerance** | How far the stack can lean before collapse | Fail past ~15° from vertical, or COM outside base footprint |
| **Piece variance** | Uniform blocks vs mixed shapes/weights | Mostly uniform early; introduce odd shapes by piece ~8 |
| **Sway / recovery** | Does a lean self-correct or only worsen? | Small self-recovery early, none late — the safety net thins |
| **Placement aid** | Overlap bonus, ghost preview, magnetized snap | Reward clean overlap; no ghost in physics mode (readability is the skill) |
| **Failure grace** | Full collapse vs lose top N pieces | Lose-top for cozy; full-collapse for high-stakes |
| **Wind / disturbance** | External force that tests margin | Off until height N, then gentle gusts (a director beat) |

Default to the **wobble** model over pure snap: instability is where the fun lives. Reserve snap for grid-puzzle framings where the tension comes from footprint, not physics.

### Slots into
- [[genre-physics-arcade]] — the native home; toppling towers, one-more loops.
- [[genre-incremental]] — height as a resource you spend and rebuild; see [[system-resource-loops]].
- [[genre-grid-puzzle]] — snap-stacking where the puzzle is packing, adjacency, and footprint.
- [[genre-tower-defense]] — literal towers whose reach scales with a stacked base.
- [[genre-coop-chaos]] — two hands on one tower; see [[system-coop-and-competition]].

Anchors worth studying: [[anchor-tetris]] (packing pressure, line-clear as controlled collapse), [[anchor-katamari]] (accretion as growth-is-power, growth-is-unwieldy), [[anchor-peggle]] (physics arcade juice on a single satisfying act), [[anchor-minecraft]] and [[anchor-terraria]] (stacking as construction, not jeopardy — the calm end of the spectrum).

### Twist seams
- **Stack but the tower is your health bar** (mechanic-swap). Damage removes pieces from the top; you heal by stacking under fire. Losing height *is* taking a hit, so building and surviving are the same verb. Pairs with [[system-combat-model]] and [[pattern-feedback-loops]].
- **Stack but the pieces are your defeated enemies** (theme). Every kill drops a corpse you must place; a good run builds a monument, a bad run buries you. Reframes [[system-enemy-archetypes]] as building material and ties score to combat — see [[world-motif-and-symbol]] and [[world-theme-vectors]].
- **Stack but gravity flips on a timer** (mechanic-swap). The tower you balanced upward must now hang stable downward. Composes with [[mechanic-gravity-flip]] and forces the player to build symmetric, defensible structures.

### How it wires to Hayao
- Use a **deterministic** physics step so a given seed of piece order and drop timings always collapses the same way — proofs and replays depend on it. Read the physics-lab under `sandboxes/` for the rigid-body seam and how contact resolution stays reproducible.
- For the **snap / grid** framing, model the stack as a pure `Puzzle<State, Move>` (footprint occupancy + a stability predicate) so every layout is machine-checkable and levels are provably clearable — the `examples/sokoban/` split is the reference for logic-vs-view.
- The wobble, dust, and creak are **cosmetic**: sway animation, particle puffs, and shake read as pure-view and must stay out of the sim hash. See [[pattern-juice-choreography]].
- Score, current height, and collapse are **logic** state that lives in the hash; the lean *animation* is not. Keep the boundary clean or replays desync.
- Verification lives in `docs/FUN.md#19-·-physics-arcade` — prove the collapse is fair and the wobble reads before you tune the greed curve.

### Fails when…
- **The collapse feels random, not earned.** If the player can't see *why* it fell, jeopardy becomes noise — the [[antipattern-rng-frustration]] and [[antipattern-input-lie]] trap. Telegraph the lean; let the eye predict the fall.
- **Snap-stacking with zero instability.** No wobble, no packing pressure = you've built a stacking *animation*, not a game. That's [[antipattern-false-depth]]: the verb has no stakes.
- **Height with no ceiling on tension.** If a tall tower is strictly safer than a short one (better base, more mass), greed stops being a gamble and the loop goes flat — [[antipattern-boring-optimal]].
- **Full collapse with no grace.** Wiping a 40-piece tower on one bad drop is a rage-quit; offer lose-top or a checkpoint. See [[pattern-anti-frustration]] and [[system-grace]].
- **Too many piece shapes too soon.** Variance before the player masters the base verb reads as chaos, not challenge — respect the [[system-onboarding]] ramp.

### See also
- [[mechanic-throw]] — the delivery verb when pieces are flung, not dropped.
- [[mechanic-merge]] — the sibling growth loop: combine-to-grow instead of pile-to-grow.
- [[mechanic-grow-shrink]] — scale as the tension axis rather than height.
- [[genre-physics-arcade]], [[genre-incremental]], [[genre-grid-puzzle]] — the three homes.
- [[pattern-risk-reward]], [[pattern-pacing-and-tension]] — the tension spine.
- [[recipe-merge-factory]] — a build-and-grow loop you can cannibalize for structure.
- [[process-the-twist]] — where the "X but Y" seams above come from.

---
id: mechanic-teleport
title: Teleport / Blink
kind: mechanic
tags: [movement, positioning, puzzle, combat]
summary: Instant relocation to a chosen spot — collapses distance into a targeting decision.
use-when: You want positional puzzles or combat repositioning without travel time.
composes-with: [mechanic-portal, mechanic-clone, system-telegraphs]
verify-with: docs/JUICE.md
---

**What it is.** Press a button, aim, and **you** are somewhere else — no arc, no travel, no in-between frames the world can react to. Distance becomes a menu of destinations, not a journey.

**Player fantasy / why it's fun.** You are *un-cornerable*. The hit that should have landed passes through empty air; the wall that should have stopped you is now behind you. Teleport sells mastery-of-space — the reward is being where the danger isn't, exactly when it counts. See [[pattern-mastery-and-flow]].

## The verb

Aim at a target point, commit, appear there. The whole decision is *where* — and, because motion is instant, *when*. Unlike [[mechanic-dash]] (a fast slide that still crosses ground and can be intercepted mid-travel), a blink skips the crossing entirely. That single property rewrites every relationship it touches: collision, line of sight, and enemy [[system-telegraphs|telegraphs]].

## How it feels / why it's fun

- **Deletion of travel time** turns a chase into a puzzle: the question is never "can I get there" but "which there".
- **Zero i-frame ambiguity.** A dash dodge is a timing read; a blink is a *position* read. Different skill, different fantasy — Tracer's blink in Overwatch vs. a Souls roll.
- **The relocation is a promise the world must honor.** If the destination is legal, you are safe there. That guarantee is the whole thrill — and the whole balancing problem.

## Tuning levers

| Lever | What it controls | Sane default | Push it |
|---|---|---|---|
| **Range** | max distance per blink | 4–6 tiles / ~2 dash-lengths | Long range = escape tool; short = combo tool |
| **Line-of-sight rule** | can you blink through walls? | destination must be visible + unoccupied | Through-walls = puzzle key; LoS-only = grounded combat |
| **Cooldown** | blinks per unit time | 1.5–4 s | Low CD = mobility identity; high CD = panic button |
| **Charges** | banked blinks | 1 (or 2 with slow recharge) | Charges let you chain; singles force commitment |
| **Aim model** | how you pick the spot | cursor/reticle, clamp to max range | Free-aim = expressive; snap-to-node = readable |
| **Cast time** | frames before you vanish | 0 (instant) | Non-zero cast = counterplay window, kills the "un-cornerable" fantasy — use deliberately |
| **Landing legality** | what's a valid spot | ground/floor only, no inside-geometry | Air-blink enables platforming; strict ground grounds it |

Defaults assume a **combat repositioning** blink. For a **puzzle** blink, kill the cooldown, make range and LoS the only constraints, and lean on level geometry — see [[genre-grid-puzzle]].

## Slots into

- **Genres:** [[genre-immersive-sim]] (Dishonored's Blink is the archetype), [[genre-precision-platformer]], [[genre-grid-puzzle]], [[genre-bullet-hell]], [[genre-metroidvania]] (a gated traversal verb), [[genre-tactics]] (per-turn reposition).
- **Anchors:** [[anchor-dishonored]] (short-range Blink as the spine of movement + stealth), [[anchor-portal]] (relocation as pure puzzle logic), [[anchor-hades]] (Athena/Zeus dashes read as blinks), [[anchor-into-the-breach]] (teleport as a tactical verb with full information).

## Twist seams

- **Blink but you leave a decoy where you were** (mechanic-swap): a body double stands at your origin and eats the next hit or draws aggro. Now the blink is *deception*, not just escape — the enemy commits to a target that isn't you. Composes with [[mechanic-clone]] and [[system-enemy-ai]]; the AI must be legible enough that baiting it feels earned, not random. See [[pattern-risk-reward]].
- **Teleport but only to where a thrown marker lands** (constraint): you can't blink freely — you first *place* a target (a thrown dagger, a tossed orb), then recall to it. Two-step commitment turns instant motion into a plan: throw now, cash it later. This is the throw-marker-then-recall energy at the core of many grid puzzles. Composes with [[mechanic-throw]] and [[genre-puzzle-platformer]].
- **Blink but it swaps you with the thing you target** (mechanic-swap): aim at a crate, a guard, a projectile — and trade places. Repositioning becomes *rearranging the board*, not just yourself. Pairs with [[mechanic-possess]] and [[system-hazards-and-environment]].

## How instant motion changes telegraph math

This is the lever most designs botch. A [[system-telegraphs|telegraph]] is a contract: "danger will land *here* in N frames, move." Teleport breaks the contract two ways —

- **It shrinks the reaction window to near-zero** on the player's side. If a blink is instant + off-cooldown, the player can ignore telegraph *timing* and only read telegraph *position*. Windup-heavy bosses become trivial. Fix: give attacks that *track* the player at resolution, or hazards that fill an area rather than a point, so relocating still leaves a decision.
- **It lets the player dodge the un-dodgeable**, which is fun *once*. Repeatedly, it flattens the encounter. Gate it: cooldown ≥ the enemy's telegraph period so you spend a blink and then must read the next attack honestly. See [[system-encounter-design]] and [[system-boss-design]].

Design the enemy roster *around* the blink, not despite it — see [[system-counter-systems]]. An enemy that punishes the landing spot (a mine, a delayed AoE where you'll appear) restores tension.

## How it wires to Hayao

- **The move is a state edit, not a physics event.** Validate the destination (in range, unoccupied, legal surface / LoS satisfied), then set position in one step — no interpolated frames the sim can react to. Route any randomness (scatter, miss-chance) through the deterministic RNG so replays and the solver agree; see the invariants in [[process-composition]].
- **In turn-based/puzzle use, teleport is just a `Move`** in a pure rules module — the destination-legality check is a pure predicate, and every level stays machine-proven winnable. Study the logic/view split in `examples/sokoban/` before wiring puzzle blinks.
- **For the feel** (the vanish/appear pop, dust at origin + destination, a beat of hitstop), that's cosmetic view work — pull the recipe from a particles / tween lab under `sandboxes/`, and keep every effect node out of `world.hash()`. Choreograph the two endpoints so the eye tracks the jump; see [[pattern-juice-choreography]] and the frontmatter's `verify-with`.

## Fails when…

- **It's instant AND cheap AND unconstrained** — the "un-cornerable" fantasy becomes "the game plays itself". No cost, no read, no tension. See [[antipattern-boring-optimal]].
- **The destination rules are opaque.** If the player can't predict where a blink is legal, every cast is a coin flip. This is [[antipattern-input-lie]] — the aim showed a spot, the game refused it silently. Always render the valid destination *before* commit.
- **Enemies were tuned as if teleport didn't exist**, so telegraph-heavy attacks whiff and bosses trivialize. See [[antipattern-fake-choice]] — the "dodge" was never a choice.
- **It's a get-out-of-jail button with no window**, so there's no counterplay and PvP/boss fights stall. Add a tell, a cast time, or a punishable landing.
- **It exists only to skip level geometry** the designer forgot to gate — traversal collapses and the [[genre-metroidvania]] map loses its locks.

## See also

- Movement kin: [[mechanic-dash]], [[mechanic-portal]] (the destination *persists* — a placed thing, not a personal verb), [[mechanic-grapple]], [[mechanic-double-jump]].
- Combat framing: [[system-telegraphs]], [[system-counter-systems]], [[system-combat-model]], [[mechanic-dodge-roll]].
- Design process: [[process-the-twist]] (mine more "teleport but Y" seams), [[pattern-risk-reward]], [[pattern-readability]].

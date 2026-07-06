---
id: system-hazards-and-environment
title: Hazards & Environment
kind: system
tags: [traps, terrain, systemic, threat, interaction]
summary: The level fights back — traps, terrain, and environmental systems that interact with the player AND the enemies.
use-when: You want the space itself to be a threat and a tool, not just a backdrop.
composes-with: [system-encounter-design, pattern-emergence, mechanic-magnet]
anchors: [anchor-spelunky]
verify-with: docs/VERIFICATION.md
---

**What it is.** The **level** is an actor. Spikes, fire, water, crumbling floors, gas — hazards that damage, block, or transform, and that obey rules the player can read, exploit, and turn against the enemies who share the space.

**Player fantasy / why it's fun.** The room is a loaded gun. You learn where it points, then you turn it. The best hazard moment isn't dying to a trap — it's kiting a shopkeeper onto it. Mastery of the **space** outranks mastery of the fight.

## When to use / when NOT

Use when:
- The space should carry difficulty so you can ship fewer, dumber enemies. A saw blade never needs an AI.
- You want [[pattern-emergence]] — hazards that touch enemies too produce stories you didn't script.
- Procgen needs cheap, composable threat. Hazards tile; bespoke bosses don't. See [[system-procgen-design]].

NOT when:
- The game is about precise, legible duels ([[genre-fighting-game]], [[genre-soulslike]] arenas) — a random gas cloud is noise, not tension.
- Hazards only punish the player and never the AI. That's a tax, not a system — see Fails below.
- The threat must be authored beat-for-beat. Then it's a [[system-telegraphs]] set-piece, not an environment.

## Variants

| Variant | What it is | Signature | Design cost |
|---|---|---|---|
| **Static trap** | Fixed damage on contact/trigger; spikes, saws, pits, arrow plates | Learn once, dodge forever | Cheap; risks rote |
| **Systemic hazard** | Simulated spread; fire ignites, water floods, gas diffuses, ice slicks | Same tile does different things each run | Expensive; needs a sim tick |
| **Destructible terrain** | Walls/floors you (and blasts) can remove | Turns geometry into a resource | Rebuild pathing + collision |
| **Kinetic / crushing** | Moving mass — boulders, pistons, closing walls | Timing, not just position | Motion + telegraph budget |
| **Environmental force** | Wind, current, conveyor, low-grav zones that push everything | Alters movement, not health | Retune every [[mechanic-dash]]/jump |
| **Contagion state** | Hazard that infects units — on fire, frozen, poisoned in the world | Bleeds into [[system-status-effects]] | Sim + status bookkeeping |

Best when variants **interact**: a bomb ([[mechanic-throw]]) opens a floor, water pours in, the pour douses the fire an enemy was standing in. [[anchor-spelunky]] is the reference — every element is a verb that touches every other. [[anchor-minecraft]] and [[anchor-terraria]] make terrain the whole loop; [[anchor-nuclear-throne]] uses destructible cover as tactical texture.

## Tuning levers

- **Telegraph.** How far ahead, and in what channel, the threat announces itself. Wind-up, floor crack, pressure hiss, red tint. Unfair without it; trivial with too much. Own the read via [[system-telegraphs]] and [[pattern-readability]].
- **Reversibility.** Can the state undo? Fire burns out, ice thaws, floods drain, but a collapsed floor is forever. Reversible hazards invite play; permanent ones demand respect. Mix both.
- **Enemy-affects-too.** The single highest-leverage switch. If a hazard only threatens the player, it's punishment; if it threatens all bodies, it's a **tool**. Flip this on and encounters ([[system-encounter-design]]) design themselves.
- **Trigger source.** Contact, proximity, timer, weight, line-of-sight, or player action. Determines whether the hazard is dodged, waited out, or weaponized.
- **Spread rate.** For systemic hazards — how fast fire jumps tiles or water rises. Too fast reads as instant-death; too slow reads as scenery. Gate to reaction time.
- **Density & placement.** How much of the room is lethal. Procgen must guarantee a solvable path — see Verify. Pair scarcity with reward via [[pattern-risk-reward]].
- **Interaction matrix.** Which hazards transform which (fire→ice→water→electricity). A small NxN table buys enormous [[system-emergent-systems]] depth. Keep it under 6 elements or it becomes [[antipattern-feature-soup]].

## Twist seams

- **Hazards but they only hurt whoever moved last** *(constraint)* — the floor is safe until you step; then the tile behind you arms. Turns a level into a [[genre-grid-puzzle]] of ordering. Pairs with [[mechanic-rewind]] to undo a bad step. See [[anchor-baba-is-you]] for rule-as-hazard framing.
- **Environment but the player plants the hazards for enemies** *(perspective)* — you don't dodge traps, you set them. Bear traps, tripwires, lured pits. Now it's [[genre-tower-defense]] wearing a [[genre-stealth]] coat; see [[anchor-dishonored]] for weaponized environment and [[mechanic-magnet]] for pulling foes into your kill zone.

## How it wires to Hayao

- Model each hazard as a **cell/entity in the scene tree** carrying its own state (armed, burning, flooded, cracked). The visual — flicker, glow, spread animation — sets `cosmetic = true` so it stays out of `world.hash()`; the damage/spread *logic* stays in the deterministic sim.
- Systemic spread is a **cellular tick**: iterate hazard cells in a fixed, ordered pass and mutate next-frame state from current-frame neighbors. Never `Math.random` a spread — draw from the deterministic RNG so a seed replays identically.
- For grid-locked "whoever moved last" hazards, keep the rule in a pure `Puzzle<State, Move>` module so every layout is machine-proven survivable, mirroring `examples/sokoban/`.
- For continuous fire/fluid/collapse, study the physics and particle labs — read the matching `sandboxes/<x>-lab` for one mechanic in isolation before wiring several together.
- Destructible terrain must **rebuild navigation** after a change; enemy pathing ([[system-enemy-ai]]) reads the mutated grid, not the original.

## Fails when…

- The hazard only hurts the player and never the AI → [[antipattern-boring-optimal]] (memorize the safe lane, ignore the system).
- No telegraph, or a telegraph in an unreadable channel → [[antipattern-input-lie]] and [[antipattern-rng-frustration]]; the death feels stolen.
- Systemic layers stacked past legibility (fire + gas + wind + collapse in one tile) → [[antipattern-feature-soup]] and [[antipattern-unreadable-juice]].
- Procgen drops a hazard across the only path with no guaranteed solve → [[antipattern-difficulty-cliff]]; the run is dead on spawn.
- Permanent hazards with a checkpoint far behind → [[antipattern-fail-loop-tax]]. Pair reversibility with [[system-save-and-checkpoint]] and [[pattern-anti-frustration]].
- The "trap" is just flat chip damage with no counterplay → [[antipattern-false-depth]]; it reads as depth, plays as a toll.

## Verify

Prove it in `docs/VERIFICATION.md`. Assert on `world.probe()`/`hash()`: a seeded spread replays byte-identical; every procgen layout has a solver-proven survivable path; the enemy-affects-too switch actually deals damage to non-player bodies. The vision judge confirms telegraphs read from a headless SVG — see [[pattern-readability]] and [[system-telegraphs]] for the design bar those checks enforce.

---
id: system-encounter-design
title: Encounter Design
kind: system
tags: [encounter, combat, pacing, pressure, safe-pocket, exit-lane, waves, composition]
summary: Composing archetypes into a fight — pressure and safe pockets, exit lanes, and a wave curve that breathes.
use-when: You have enemy roles and need to arrange them into a specific fight that reads, pressures, and resolves fairly.
composes-with: [system-enemy-archetypes, system-enemy-ai, system-difficulty-and-dda, system-boss-design]
anchors: [anchor-into-the-breach, anchor-vampire-survivors]
verify-with: docs/FUN.md#5-stealth
---

# Encounter Design

**What it is.** The **arrangement** of enemies, space, and time into a single
fight. If [[system-enemy-archetypes]] is the alphabet, an encounter is the
*sentence*: which roles, in what count, entering from where, with what geometry —
and crucially, where the player can **breathe**. A fight is a rhythm of **pressure
and pocket**, not a constant scream.

**Player fantasy / why it's fun.** The satisfaction of *reading a room and solving
it live*. A great encounter poses a legible problem, ramps the pressure, gives one
honest window to recover, then peaks. FUN.md §5's "plannable danger" is the whole
ideal: the player should be able to route the fight, not just survive noise.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Hand-authoring set-piece fights or rooms | Endless horde — that's a *pressure curve* (§6), tune the director not the room |
| A boss arena with adds | The fight IS one entity — go to [[system-boss-design]] |
| Roguelike rooms assembled from parts | Pure puzzle levels — that's solver-authored (§1) |

## The anatomy of an encounter

| Element | The design question | Failure mode |
|---|---|---|
| **Composition** | which archetypes, how many? | all-tank slog / all-swarm noise |
| **Ingress** | where do they enter, in what order? | everything at once → no read |
| **Pressure curve** | does intensity rise, then peak? | flat = boring; monotone-hard = unfair |
| **Safe pocket** | where can the player recover mid-fight? | none = a war of attrition, not a fight (§5) |
| **Exit lanes** | are doors/escape routes obstacle-free? | cover in the door row = **softlock** (§4) |
| **Resolution** | how does it end — clear, timer, objective? | ambiguous end = the fight overstays |

## Tuning levers

| Lever | Turns up… | Watch for |
|---|---|---|
| **Enemy budget** (a points cost per role) | raw difficulty | cheap way to overshoot — cap it |
| **Ingress cadence** | how fast the room fills | dumping all at frame 0 kills the read |
| **Pocket size / duration** | recovery generosity | zero pocket = frustration; huge pocket = no tension |
| **Arena geometry** (pillars, funnels) | kiting arcs & LoS breaks | a pillar in an exit lane softlocks (§4) |
| **Composition ratio** | the *kind* of pressure | shift ratios to reface a reused arena |

## How it wires to Hayao

- **Encounters are data.** A room is a list of spawns + positions in `world.state`,
  fed to the shared archetype behaviors. Timed ingress rides
  `pollDirector(waves, state, world.time, world.rng)` — a repeating wave with an
  `end` is a controlled trickle, a one-shot wave is an ambush
  ([`src/content/dsl.ts`](../../src/content/dsl.ts)).
- **Geometry legibility** is a lint, not a vibe: `astarGrid`/`connectedComponents`
  (grep `docs/API.md`) prove exit lanes stay traversable and every enemy can reach
  the player — cover in a door row shows up as an unreachable path.
- **Procedural rooms** compose from proven parts: `generateDungeon` /
  `generateLevels` (see [[system-procgen-design]]) with a per-room accept rule that
  every spawn is reachable and a pocket exists.
- **Wave curve** shares the tower-defense breather math — see
  [[system-difficulty-and-dda]] for `assertRamp`/`rampIssues`.

## Fails when…

- **No safe pocket.** A long fight with nowhere to recover is attrition, not
  skill — FUN.md §5 requires a pocket at the *midpoint* of any long traversal.
- **Blocked exit lanes.** A pillar or an enemy parked in a door row is a softlock;
  keep door rows/columns clear (§4).
- **Everything at once.** Simultaneous ingress erases the read — the player never
  gets to *solve* the room, only flail.
- **Flat pressure.** No rise, no peak → the fight is texture, not an arc
  ([[pattern-pacing-and-tension]]).
- **Joint-phase waits** (stealth): chaining two guard windows that must *both*
  align makes wait times explode (§5) — chain single windows.

## Verify

- **Both-ways affordance / safe pocket:** the stealth proof pattern — punished
  exposure AND concealment-holds AND a mid-path pocket
  ([FUN.md §5](../../docs/FUN.md#5-stealth)).
- **Beatable:** a bot clears the encounter deathless with hp floor ≥ comfortable
  ([FUN.md §4](../../docs/FUN.md#4-top-down-action-adventure-zelda-like)).
- **Curve breathes:** assert the pressure *shape* (each wave ≥ ~55% of prior,
  finale peaks) with `rampIssues`, not monotonicity ([FUN.md §8](../../docs/FUN.md#8-tower-defense)).
- **Exit lanes clear:** reachability lint over the actual room geometry (FUN.md Part 3).

## Composes with

- [[system-enemy-archetypes]] — the letters this arranges into sentences.
- [[system-enemy-ai]] — the behaviors that animate each spawn.
- [[system-difficulty-and-dda]] — encounters are the units a director sequences.
- [[system-boss-design]] — a boss arena is an encounter with a super-archetype.
- [[pattern-pacing-and-tension]] — pressure/pocket is pacing at fight scale.

## See also

- [`docs/FUN.md` §4/§5/§8](../../docs/FUN.md) — readable combat, plannable danger, breathing waves.
- [`src/content/dsl.ts`](../../src/content/dsl.ts) — director-driven ingress.
- [[anchor-into-the-breach]] — the perfectly legible, fully telegraphed encounter.

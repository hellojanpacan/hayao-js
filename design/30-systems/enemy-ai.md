---
id: system-enemy-ai
title: Enemy AI
kind: system
tags: [ai, behavior, aggro, threat, steering, flow-field, pathfinding, kiting, telegraph]
summary: Readable, beatable enemy minds — aggro/threat, steering, and pathing that the player can predict, route around, and outplay.
use-when: A design needs enemies that move and decide, and you want them to feel intelligent without being unfair or opaque.
composes-with: [system-enemy-archetypes, system-encounter-design, system-telegraphs, system-difficulty-and-dda]
anchors: [anchor-nuclear-throne, anchor-shadow-of-mordor]
verify-with: docs/FUN.md#4-top-down-action-adventure-zelda-like
---

# Enemy AI

**What it is.** The **decision + movement** an enemy runs each tick: who to
target, whether to press or retreat, and how to get there without walking into a
wall. Good enemy AI is not *smart* — it is **legible**. The player must be able to
read its intent, predict its next move, and beat it with position and timing.

**Player fantasy / why it's fun.** The fantasy is *outwitting a mind*. That only
lands if the mind is knowable: a shark that telegraphs its lunge is thrilling; one
that teleports behind you is cheap. The skill the player buys is *reading and
routing* — FUN.md §4's kiting bot exists because "the enemy is beatable by
positioning" is a provable claim.

## When to use / when NOT

| Use it when | Skip it / go simpler when |
|---|---|
| Enemies must chase, flank, or hold ground | Bullet-hell foes: they emit **patterns**, not decisions (§7) — script the pattern, not a brain |
| The player's skill is spacing & threat-reading | Pure puzzle enemies: they're **rules**, deterministic and solver-legible (§1, §12) |
| You want emergent pressure from a few archetypes | A single scripted boss: hand-author phases ([[system-boss-design]]), don't build a general AI |
| Mass units under command (RTS) | One enemy, one behavior: a state flag beats a behavior tree |

> **Never build a mind the player can't read.** Perfect aim, wall-hacks, and
> reaction-time-zero are the difficulty of a slot machine. Difficulty comes from
> *count, geometry, and telegraph windows* — not from the AI cheating.

## Variants

| Variant | The mind | Reads as | Best for |
|---|---|---|---|
| **Direct seeker** | steer straight at the target | "it wants me" | swarms, zombies (§6) |
| **Flow-field mass** | one BFS per goal, every unit follows the field | "the tide is coming" | RTS-lite, hordes (§9) |
| **Kiter / spacer** | hold a preferred range, back off when close | "keep your distance" | archers, ranged skirmishers (§4) |
| **Ambusher** | wait in a state until a trigger, then commit | "don't step there" | stealth, traps (§5) |
| **State-machine bruiser** | idle → aggro → windup → attack → recover | "here comes the swing" | melee bosses, mini-bosses (§4) |
| **Threat-driven** | pick target by an aggro/threat score, not proximity | "I pulled it" | party fights, taunt play |

## Tuning levers

| Lever | Turns up… | Watch for |
|---|---|---|
| **Aggro radius** | when the enemy notices you | too large = no safe pockets ([[system-encounter-design]]) |
| **Threat weights** | *who* it targets (damage dealt, distance, taunt) | must be deterministic & ordered — ties break by entity id, never by iteration order |
| **Preferred range** (kiters) | the spacing the fight settles at | range < player reach = it's just a melee foe |
| **Windup / telegraph frames** | the reaction window before a hit | too short = unreadable; own this in [[system-telegraphs]] |
| **Steering deadzone** | jitter vs. commitment near the target | too tight = enemies vibrate on the spot |
| **Repath cadence** | how fast it reacts to you moving | every frame = twitchy & expensive; every N frames = readable |

## How it wires to Hayao

- **Pathing:** `astarGrid` and `floodFill` (grep `docs/API.md`) give per-enemy
  paths and wall-aware reachability. For **mass** pathing, one BFS per goal tile
  cached *outside* `world.state` is the flow field (FUN.md §9) — hundreds of units
  share it. `connectedComponents` proves a goal is even reachable before you spawn
  a chaser that would path into nothing.
- **Steering:** `steer2D(px,py,tx,ty,out,dead)` emits the same action strings a
  human would press, so an enemy and a bot driver share one movement path — and
  the enemy replays deterministically. The `dead` deadzone is your jitter lever.
- **Threat/aggro:** plain data in `world.state` — a per-enemy target id and score,
  advanced through `dmath`, ordered iteration for ties. No wall-clock, all rolls
  through `world.rng`.
- **See it in isolation:** [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo/)
  — `astarGrid`/`floodFill` with paintable walls and a movable goal, no genre
  attached. Learn the primitive there, not from a whole game.

## Fails when…

- **The mind cheats.** Perfect prediction, seeing through walls, or homing that
  can't be dodged. The FUN.md §7 dodge-bot exists precisely to prove a human
  *can* survive; an enemy that beats the bot is unfair to people too.
- **No safe pocket.** Every enemy aggros at once with no gap to breathe → it's a
  wall of pressure, not a fight ([[system-encounter-design]], FUN.md §5).
- **Iteration-order targeting.** Picking a target by array order leaks
  non-determinism into the sim and breaks `world.hash()`. Order by an explicit
  key.
- **Repathing every frame** — cost spikes and the enemy twitches; humans read
  *committed* motion, not a gradient-follower recomputing constantly.
- **Melee foes that outrun you with no telegraph** — the fight becomes a coin
  flip, not a read.

## Verify

- **Beatable by positioning:** the kiting-bot telemetry pattern — win time, hp
  floor ≥ comfortable, **0 deaths** — is the proof an enemy roster is fair
  ([FUN.md §4](../../docs/FUN.md#4-top-down-action-adventure-zelda-like)).
- **Reachability first:** `connectedComponents` / flow-field over the actual
  geometry before spawning chasers ([FUN.md §9](../../docs/FUN.md#9-rts-lite)).
- **Feel floor:** every attack telegraphs before its hitbox goes live — the
  readability gate in [`src/verify/gates.ts`](../../src/verify/gates.ts) checks it.
- **Determinism:** golden-hash a scripted encounter; targeting and steering must
  replay bit-exactly (FUN.md law 6/7).

## Composes with

- [[system-enemy-archetypes]] — AI is the *how it moves*; archetypes are the
  *what role it plays*. Same brain, different stats, different feel.
- [[system-telegraphs]] — a readable mind is mostly a well-telegraphed one; the
  windup frames live here.
- [[system-encounter-design]] — one enemy is a behavior; a fight is a *composition*
  of them with pressure and pockets.
- [[system-difficulty-and-dda]] — aggro radius and count are the director's dials.
- [[pattern-readability]] — the salience floor that makes a mind knowable.

## See also

- [`docs/FUN.md` §4/§7/§9](../../docs/FUN.md) — kiting, dodge-bot fairness, flow fields.
- [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo/) — the pathing primitive alone.
- [[anchor-nuclear-throne]] — tight-loop enemies whose danger is *count + read*, never cheating.
- [[anchor-shadow-of-mordor]] — where a readable mind grows a *history* ([[system-emergent-systems]]).

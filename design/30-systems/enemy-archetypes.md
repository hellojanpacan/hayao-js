---
id: system-enemy-archetypes
title: Enemy Archetypes
kind: system
tags: [enemy, archetypes, roles, tank, skirmisher, artillery, swarm, support, roster]
summary: The enemy alphabet — tank/skirmisher/artillery/swarm/support — a small set of roles that combine into fights bigger than their parts.
use-when: You need a legible enemy roster where each foe demands a different answer and pairs interact.
composes-with: [system-enemy-ai, system-encounter-design, system-unit-rosters, system-counter-systems]
anchors: [anchor-vampire-survivors, anchor-into-the-breach]
verify-with: design/FUN.md#4-top-down-action-adventure-zelda-like
---

# Enemy Archetypes

**What it is.** A **role vocabulary** for enemies, not a bestiary. Five roles cover
almost every action game: **tank** (soaks, blocks lanes), **skirmisher** (fast,
flanks, punishes greed), **artillery** (ranged, forces you to close or break line
of sight), **swarm** (individually trivial, dangerous in numbers), **support**
(buffs/heals/shields others — the *priority* target). The alphabet is small on
purpose: a player learns five answers, then every fight is a *sentence* of them.

**Player fantasy / why it's fun.** Recognition, then adaptation. Seeing an
artillery unit behind a tank behind a swarm is a *puzzle you read at a glance* —
the fun is choosing the order to solve it. FUN.md §4's whole claim is "readable
combat"; archetypes are how a fight becomes readable before it becomes hard.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Combat has ≥3 enemy types and you want them to *combine* | A single-enemy game (one boss, one rival) — design that fight directly |
| You need difficulty from *composition*, not stat inflation | Puzzle "enemies" that are really rules ([[genre-grid-puzzle]], §12) |
| The player should learn one answer per role | Pure horde where the enemy is *count itself* — one type, superlinear spawn (§6) |

## Variants

The five roles and what each *demands*:

| Role | Job in the fight | Player answer | Signature knob |
|---|---|---|---|
| **Tank** | control space, absorb, block a lane | reposition or burst; don't trade | HP + a lane it denies |
| **Skirmisher** | punish overextension, flank | spacing, patience, don't chase | speed > player, low HP |
| **Artillery** | force movement, deny camping | close the gap or break LoS | range + a telegraph ([[system-telegraphs]]) |
| **Swarm** | overwhelm, chip, cover others | AoE, funnels, kiting arcs (§6) | trivial each, superlinear count |
| **Support** | multiply everyone else | **kill it first** — it's the priority | a buff radius you can see |

**Compositions** are where the alphabet earns its keep:

| Pair | Emergent problem |
|---|---|
| Tank + artillery | the tank buys the artillery time; you're pressured while you dig |
| Support + swarm | the swarm won't die until the support does — inverts your target order |
| Skirmisher + tank | the tank pins you where the skirmisher wants you |
| Artillery + skirmisher | ranged forces motion, flanker punishes it — a positioning vice |

## Tuning levers

| Lever | Effect | Watch for |
|---|---|---|
| **Role stat ratios** (HP/speed/range) | how sharply a role reads | roles that overlap muddy the read — keep silhouettes distinct |
| **Threat priority** (support first) | the target-order puzzle | if killing in any order works, the roles aren't interacting |
| **Count per role** | swarm-ness vs. elite-ness | one "swarm" unit is just a weak melee foe |
| **Telegraph length by role** | reaction budget | artillery needs the longest tell; skirmishers the shortest |

## How it wires to Hayao

- An archetype is **data**: a stat block in `world.state` (`hp`, `speed`, `range`,
  `role`) driving the shared behaviors from [[system-enemy-ai]]. Same brain,
  different numbers — a tank is a seeker with high HP and a wide body; a kiter is
  the ranged archetype.
- **Spawning by role** rides the director: `WaveDef.spawn` takes a weighted set,
  so `pollDirector(waves, state, world.time, world.rng)` (grep `docs/API.md`) can
  roll "2 swarm + 1 support" per firing, deterministically. See
  [`src/content/dsl.ts`](../../src/content/dsl.ts).
- **Silhouette & palette** carry the read — distinct shapes and Kentō-palette
  hues per role ([[world-aesthetic-direction]], JUDGE). The player must name the
  role from the silhouette alone.
- **Roster legibility** shares the design of [[system-unit-rosters]] — the enemy
  roster is a roster with the same "one glance, one role" bar.

## Fails when…

- **Stat-only enemies.** Five foes that differ only in HP are one enemy with a
  slider. Roles must demand *different answers*, not different patience.
- **No priority target.** Without support (or an equivalent "kill this first"),
  every fight is a spray — order stops mattering.
- **Illegible silhouettes.** If you can't tell artillery from tank at a glance,
  the read collapses ([[pattern-readability]], JUDGE).
- **Swarm that isn't a swarm.** Too few, too tanky, and it's just chip damage with
  extra steps — swarm fun is *many trivial* (§6).

## Verify

- **Each role beatable with its answer:** kiting-bot telemetry per archetype —
  0 deaths, hp floor ≥ comfortable
  ([FUN.md §4](../FUN.md#4-top-down-action-adventure-zelda-like)).
- **Composition, not inflation:** assert a *skill delta* — the correct target
  order clears far faster than a naive one (FUN.md law 2). If order doesn't
  matter, the roles don't interact.
- **Swarm pressure holds:** `peak alive ≥ N` so the horde feel can't silently
  regress ([FUN.md §6](../FUN.md#6-twin-stick-horde-survival-vampire-survivors-like)).
- **Readability gate:** telegraph-before-hitbox in [`src/verify/gates.ts`](../../src/verify/gates.ts).

## Composes with

- [[system-enemy-ai]] — the shared brain each archetype re-skins with stats.
- [[system-encounter-design]] — archetypes are letters; encounters are the words.
- [[system-counter-systems]] — roles imply near-hard counters (AoE vs. swarm).
- [[system-unit-rosters]] — the same legibility discipline, player-side.
- [[system-boss-design]] — a boss is often a super-archetype with phases.

## See also

- [`design/FUN.md` §4/§6](../FUN.md) — readable combat; horde pressure.
- [`src/content/dsl.ts`](../../src/content/dsl.ts) — `WaveDef`/`pollDirector` role spawning.
- [[anchor-vampire-survivors]] — the swarm archetype as the *whole* game.
- [[anchor-into-the-breach]] — every enemy role telegraphed as a solvable board.

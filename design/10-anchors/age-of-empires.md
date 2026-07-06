---
id: anchor-age-of-empires
title: Age of Empires
kind: anchor
tags: [rts, economy, tech-tree, build-order, power-spike, ramp, macro]
summary: RTS whose fun is the eco→tech ramp — you bank a peaceful economy into age-up power spikes, and the build order is the real game.
use-when: The intent is an economy-first RTS/strategy where teching up and timing a power spike is the core decision.
composes-with: [genre-rts, system-tech-tree, system-economy, system-resource-loops, system-unit-rosters]
anchors: []
verify-with: docs/FUN.md#9-rts-lite
---

# Age of Empires

**What it is.** An RTS where you spend most of your time *not fighting*: you
harvest four resources, sink them into a **tech ramp**, and cash the whole
economy in at an **age-up** — a discrete power spike that unlocks a better army
and a better economy at once. The **build order** — what you build, in what
sequence, timed to the second — is the skill.

**Player fantasy.** You are a civilisation *becoming*. The dopamine is watching a
handful of villagers snowball into a stone-age hamlet, a feudal town, an imperial
war machine — each age a visible, audible level-up you *earned* by planning ahead
instead of fighting now.

## Design DNA

The engine is a **delayed-gratification loop**: every resource spent on economy or
tech is an army you *didn't* build. The tension is always "expand now, or convert
to power now?" Ages are the **commitment gates** that make that tension legible —
you can *see* the next tier of units greyed out, and you know exactly what banking
toward it costs. Combat exists to punish players who over-bank (you die with a
great economy and no army) and reward players who time the spike (you hit Feudal
with an army while the enemy is still stone-age).

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Multi-resource economy** (food/wood/gold/stone) | Each resource gates a different axis; scarcity of one forces build-order choices. Reduces to faucets/sinks → [[system-economy]]. |
| **Villager compounding** | Workers make workers; early economy investment pays exponential interest. The core [[pattern-feedback-loops]] runaway. |
| **Age-up as discrete power spike** | A single expensive gate unlocks a whole tier at once — a legible level-up, not a slow drip. → [[system-tech-tree]]. |
| **Build order** | A near-optimal opening sequence, timed to seconds; mastery is executing it under pressure. → [[system-mastery-curve]]. |
| **Tech tree with branch cost** | Upgrades are cheap individually, ruinous in aggregate; you can't have everything, so you specialise. → [[system-tech-tree]]. |
| **Timing attacks** | The whole game is "hit the enemy in the gap between *my* spike and *their* spike." Skill = reading tempo. |
| **Counter roster** | Units answer units (spears→cavalry, archers→infantry); army comp is a live rock-paper-scissors. → [[system-counter-systems]]. |

## What to steal

- The **age-up gate**: one expensive, visible, irreversible spike that unlocks a
  *tier*, not a stat. It converts a grind into a milestone.
- The **build-order skill floor**: a deterministic opening that rewards knowledge
  and execution — the thing a null "just make army" player loses to hard (FUN.md
  law 2 skill-delta).
- **Idle-worker guilt**: surface the number of idle villagers as UI. The exposed
  inefficiency *is* the macro game (cf. the city-builder "+N" cursor, FUN.md §17).
- **Bank-vs-spend tension** at every second: the economy you build is the army you
  postpone. This is the whole loop; keep it sharp.

## What's just theme (drop it)

- The **historical civilisations** — Britons vs Franks is flavour on a shared
  spine. Real asymmetry lives in [[system-faction-asymmetry]], not in names.
- **Four** specific resources — the count is tuning. Two well-differentiated
  resources can carry the same tension (see [[system-resource-loops]]).
- **Wonders / relics / one-more-victory-condition** — win-condition garnish, not
  the loop. Cut them until the ramp is fun alone.
- **Literal town-building sim** — the base is a means to the ramp, not a SimCity.

## Composes into

- [[genre-rts]] — the parent; AoE is its economy-first exemplar (mass under
  command, but macro over micro).
- [[system-tech-tree]] — the age-up spike is a tech-tree gate; this is its home
  system.
- [[system-economy]] · [[system-resource-loops]] — faucets/sinks and the
  gather→convert→spend cycle that funds the ramp.
- [[system-unit-rosters]] · [[system-counter-systems]] — the army the economy pays
  for, and why comp matters.
- [[pattern-feedback-loops]] — villager compounding is the runaway loop that needs
  a comeback brake.

## Twist seams

- **AoE but the age-up is a roguelite draft** *(structure)* — each age offers a
  choice-of-3 civ perks instead of a fixed tree; runs diverge. Pairs with
  [[system-meta-progression]].
- **AoE but hunger is the fifth clock** *(mechanic-swap)* — food isn't banked, it
  *drains*; your economy starves if it stalls. (This is Fertile Crescent's
  signature bend — see [[process-the-twist]].)
- **AoE but you command one age at a time on a single screen** *(constraint /
  perspective)* — no map scroll; the ramp happens in one arena, tower-defense
  tempo. Pairs with [[genre-tower-defense]].
- **AoE but cozy** *(tonal)* — drop combat entirely; the "spike" is a festival, the
  pressure is a seasonal deadline. Pairs with [[genre-farming-sim]].

## See also

- [`docs/FUN.md#9-rts-lite`](../../docs/FUN.md) — mass pathing via cached flow
  fields; the intended line (turtle→counterpush) must beat attack-move.
- [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo) — `astarGrid` /
  flow-field wiring for wall-aware unit movement.
- [[genre-rts]] · [[system-tech-tree]] · [[system-economy]].

---
id: anchor-starcraft
title: StarCraft
kind: anchor
tags: [rts, asymmetry, faction, balance, macro, micro, matchup]
summary: The gold standard of RTS faction asymmetry — three rosters that share almost no units yet balance across every matchup because each expresses one clear identity.
use-when: The design needs deeply different sides that still play fair; you're building faction identity, not palette-swaps.
composes-with: [genre-rts, system-faction-asymmetry, system-unit-rosters, system-counter-systems, system-mastery-curve]
anchors: []
verify-with: docs/FUN.md#9-rts-lite
---

# StarCraft

**What it is.** An RTS whose reputation rests on one achievement: **three
factions that share almost nothing** — different units, different economy quirks,
different production models — yet stay balanced across all three matchups and
mirror matches. Terran, Zerg, Protoss aren't reskins; they're three *answers to
the same question* (how do I convert economy into a winning army?), and the
answers stay fair.

**Player fantasy.** You don't pick a colour, you pick an *identity* — the swarm
that drowns you in cheap bodies, the machine-precise army that trades up, the
elite few that each hit like a truck. Mastering a faction feels like learning a
language; the matchup is a conversation.

## Design DNA

Asymmetry is a **promise about identity, balanced by a shared power budget**. Each
faction gets a distinct *fantasy* (swarm / tech / elite) and a distinct *texture*
(macro rhythm, unit feel), but every unit is priced against a common yardstick so
no faction's answer dominates. The magic is that **different but fair** multiplies
depth: three factions × three opponents = far more than three times the
strategies, because each matchup has its own logic. See
[[system-faction-asymmetry]] for the balancing discipline this demands.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **One faction = one identity** | Zerg *are* the swarm; Protoss *are* few-and-elite. A one-word fantasy keeps every unit on-theme and legible. → [[world-faction-identity]]. |
| **Distinct production model per side** | Larva/hatch vs build-from-structure vs warp-in. The economy *feels* different, not just the units. |
| **Shared power budget** | Cheap-but-weak and expensive-but-strong cost out to the same value; asymmetry without a hidden best side. → [[system-faction-asymmetry]]. |
| **Matchup-specific logic** | ZvP ≠ ZvT ≠ PvT. Each pairing is its own puzzle; balance is per-matchup, not global. |
| **Counter web, not counter list** | Units soft-counter across factions; comp and timing decide fights, not a lookup table. → [[system-counter-systems]]. |
| **Macro/micro split as skill ceiling** | Economy management (macro) and unit control (micro) are separable skills; the ceiling is doing both at once. → [[system-mastery-curve]]. |

## What to steal

- **Identity-first faction design**: write the one-word fantasy *before* the unit
  list. Every unit must express it or it doesn't belong. → [[world-faction-identity]].
- **A shared power budget** as the balance instrument: price every asymmetric thing
  against a common yardstick so "different" never means "better."
- **Per-matchup balance**, not global: verify each faction-vs-faction duel wins its
  own NvN (FUN.md §9), including the mirror.
- **Separable macro/micro**: two skills the player improves independently gives a
  long mastery curve with early wins available.

## What's just theme (drop it)

- The **sci-fi fiction** — bugs vs marines vs psionic knights is one dressing of
  swarm/tech/elite. Fantasy, historical, or abstract carries the same spine.
- **Exactly three** factions — three is a sweet spot (each matchup distinct,
  still tractable), but the principle is "N identities on one budget," not the 3.
- **The specific units** — a Zergling is a delivery mechanism for "cheap swarm
  body." The role matters; the sprite doesn't.
- **Hard-APM execution** — the *demand* for macro+micro is the ceiling; you can
  raise it with automation without losing the strategic identity.

## Composes into

- [[genre-rts]] — the parent genre; StarCraft is its asymmetry exemplar.
- [[system-faction-asymmetry]] — the home system; this anchor is its canonical
  case study of "different but fair."
- [[system-unit-rosters]] — three legible rosters, each a clear set of roles.
- [[system-counter-systems]] — the cross-faction counter web.
- [[world-faction-identity]] — the fiction that makes each side feel distinct.

## Twist seams

- **StarCraft but the factions are drafted mid-run** *(structure)* — roguelite:
  each run you compose a roster from a pool, and the "faction" is your draft.
  Pairs with [[system-build-diversity]].
- **StarCraft but one hero, not an army** *(perspective)* — you *are* a single
  unit inside the swarm/machine/elite fantasy; the faction becomes a class.
- **StarCraft but no micro** *(constraint)* — armies auto-resolve; the whole game
  is macro and comp. Pairs with [[genre-auto-battler]].
- **StarCraft but the third faction is the map** *(mechanic-swap)* — an
  environmental "faction" (creep, weather, tide) plays against both players as a
  neutral asymmetric force.

## See also

- [`docs/FUN.md#9-rts-lite`](../../docs/FUN.md) — "strategy is the balance test";
  every counter edge must win its NvN duel; flow-field mass pathing.
- [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo) — wall-aware
  mass movement the roster rides on.
- [[system-faction-asymmetry]] · [[anchor-age-of-empires]] (economy-first cousin).

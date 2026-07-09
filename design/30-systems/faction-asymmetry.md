---
id: system-faction-asymmetry
title: Faction Asymmetry — different but fair
kind: system
tags: [factions, asymmetry, balance, rts, matchup, identity, starcraft]
summary: Asymmetric factions that play nothing alike yet balance — distinct rosters, economies, and win conditions held fair by cross-matchup duels, not mirrors.
use-when: You want factions/sides that feel genuinely different to play, not palette-swaps, and still need them to be fair against each other.
composes-with: [system-counter-systems, system-unit-rosters, system-combat-model, system-economy, system-build-diversity]
anchors: [anchor-starcraft, anchor-age-of-empires]
verify-with: design/FUN.md#9-rts-lite
---

# Faction Asymmetry — different but fair

**What it is.** Sides that share almost nothing — different units, different
economies, different *ways to win* — yet remain balanced against each other. The
StarCraft achievement: Terran, Zerg, and Protoss have no unit in common and play
like three different games, and the matchups are still fair. This is the hardest,
highest-value system in competitive design, and the flagship companion to
[[world-faction-identity]] (the fiction) and [[system-counter-systems]] (the math).

**Player fantasy / why it's fun.** *Mastery of a way of being.* Picking Zerg isn't
picking a color — it's committing to swarm-and-macro, to a whole thesis about how
war works. Asymmetry turns faction choice into an identity and every matchup into a
genuinely new problem. Mirror factions give you *variety*; asymmetric factions give
you *depth times N*.

## When to use / when NOT

| Use asymmetry when… | Use mirror/symmetric when… |
|---|---|
| Factions are a pillar, not a skin | You need guaranteed fairness cheaply |
| Replayability comes from *re-learning* | The game is fast/casual; parity reads as fair |
| You can afford N× the balance work | Ranked integrity matters more than flavor |
| PvE or asymmetric-coop (each role differs) | You have one competitive ladder and thin resources |

**The honest cost:** N asymmetric factions is not N× a mirror — it's ~N² matchups
to balance (each pair, from both sides). Budget for it or ship fewer, deeper sides.

## Variants — where the asymmetry lives

| Axis | The bend | Anchor |
|---|---|---|
| **Roster** | different units, roles overlap in function | every RTS |
| **Economy** | different resource flow / build mechanic | [[anchor-starcraft]] (larvae vs supply vs warpgate) |
| **Tech path** | different tree shapes, timings, spikes | [[anchor-age-of-empires]] civ bonuses |
| **Win condition** | sides win differently (rush vs turtle vs econ) | asymmetric board games |
| **Mechanic-swap** | one faction has a unique verb the others lack | Vampire: The Masquerade-style |
| **Information** | one side hides, one side scouts | asymmetric horror (4v1) |

The strongest identities bend **two axes at once** — a distinct economy *and* a
distinct win condition — so the faction feels like a different game, not a different
army. That's the [[process-the-twist]] "X but Y" applied per side.

## The balance doctrine — how "different" stays "fair"

Symmetry makes fairness free; asymmetry makes you *earn* it. Four disciplines:

1. **Balance on outcomes, not stats.** You cannot compare a Zergling to a Marine —
   they don't share a scale. You compare *matchups*: does faction A, played well,
   win ~50% vs faction B, played well? Fairness is a win-rate window across the
   matrix, not stat parity (FUN.md §11's window logic, applied to sides).
2. **Every faction needs an answer to every threat — a different answer.** Asymmetry
   is *not* "A has no counter to air." Each side must be able to respond to each
   strategy, through its *own* tools ([[system-counter-systems]] across the mirror).
   A hole isn't identity; it's a broken matchup.
3. **Trade strengths, don't gift them.** A faction strong early must be weak
   somewhere the opponent can exploit — a cheap early economy pays with a fragile
   mid-game. Symmetric power with asymmetric *timing* is the safest asymmetry.
4. **Design the cross-matchups, not the units.** Balance TvZ, not the Marine. The
   unit is a means; the matchup is the product. First-cut asymmetry always balances
   each faction in a vacuum and ships a broken pairing.

> **The StarCraft lesson.** Three rosters, zero shared units, one of the most
> enduring competitive balances ever — because Blizzard tuned *matchups over years*,
> not units in isolation, and because every faction could answer every strategy in
> its own idiom. Asymmetry is a balance *process*, not a balance *state*.

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Matchup win-rate** | fairness per pair, top play | ~45–55% each side of every pair |
| **Power-timing offset** | when each faction spikes | staggered — no shared "best time to attack" |
| **Overlap floor** | shared *functions*, distinct *forms* | each side answers each threat; no capability hole |
| **Identity distance** | how different sides feel | far enough to re-learn; not so far one is unteachable |
| **Comeback symmetry** | each side's recovery tools | asymmetric loss should still be recoverable both ways |

## How it wires to Hayao

- **Matchups are cross-faction duels.** Pure state + `world.rng` lets you clone the
  world and run faction-A-comp vs faction-B-comp headlessly (FUN.md law 7). Assert
  the intended line of each side wins its share; assert *every counter edge across
  the mirror* wins its NvN duel (FUN.md §9). This is the direct fairness proof.
- **Mass pathing is shared, rosters aren't.** Flow fields (one BFS per goal tile,
  cached *outside* `world.state`) give every faction wall-aware mass movement for
  free (FUN.md §9). Grep [`docs/API.md`](../../docs/API.md) for `astarGrid`/`floodFill`
  before citing pathing.
- **Strategy is the balance test** (FUN.md §9): the intended line (e.g. turtle→counterpush)
  beats attack-move — assert per faction, so a side isn't secretly all-in-only.
- **Economy asymmetry** wires through [[system-economy]] — different faucets/sinks,
  same solvency requirement; pace each with its own inequality (FUN.md law 3).
- The fiction of the sides is [[world-faction-identity]]; the unit vocabulary is
  [[system-unit-rosters]]. This module owns only the *balance*.

## Fails when…

- **Palette-swap "asymmetry."** Same units, different colors — you paid nothing and
  gained nothing. If the twist is cosmetic, it's not a faction ([[process-the-twist]] cosmetic trap).
- **A capability hole.** "Faction A just can't deal with air" isn't flavor, it's a
  lost matchup. Every side answers every threat in its own way.
- **Balanced-in-a-vacuum.** Each faction tuned alone, matchups never simulated →
  one pairing is 80/20 and the meta collapses to a single faction.
- **Unteachable distance.** So different the player can't transfer *any* skill, so
  most players main one side and the others rot.
- **The strongest side is also the easiest.** Power *and* low skill floor on one
  faction kills the ladder. If a side is strong, make it demanding.

## Verify

- **[FUN.md §9](../FUN.md)** — every counter edge wins its NvN duel; commander
  bot wins with the intended line; walled units route around; ms/step at peak.
- **[FUN.md §11 window logic](../FUN.md)** — matchup win-rates sit inside a
  fairness window (both edges break CI: 80/20 *and* an unlosable 99/1).
- **[FUN.md law 2](../FUN.md)** — per faction, the intended strategy beats a
  null (attack-move / do-nothing) strategy.
- Determinism: golden hash of a scripted cross-faction match.

## Composes with

- [[world-faction-identity]] — the fiction/voice/look that makes the asymmetry *read*;
  design the two together (mechanics + meaning).
- [[system-counter-systems]] — asymmetry balances *through* near-hard counters that
  cross the mirror.
- [[system-unit-rosters]] — each faction's roster is its vocabulary of pieces.
- [[system-economy]] — asymmetric resource flow is a primary identity axis.
- [[process-the-twist]] — each faction is an "X but Y" applied to the base kit.

## See also

- [`design/FUN.md`](../FUN.md) §9 (RTS-lite duels), §11 (fairness as a window).
- [[anchor-starcraft]] — the reference: three rosters, one balance, tuned as matchups.
- [[anchor-age-of-empires]] — asymmetry via civ bonuses on a shared unit base (a gentler dose).
- [`sandboxes/pathfinding-demo`](../../sandboxes/pathfinding-demo) — mass pathing all factions share.

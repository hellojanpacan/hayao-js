---
id: mechanic-climb
title: Climb (stamina)
kind: mechanic
tags: [traversal, stamina, exploration, risk]
summary: Ascend any surface against a draining stamina bar — freedom rented against a countdown.
use-when: Open traversal wants risk budgeting rather than fixed handholds.
composes-with: [mechanic-ledge-grab, system-resource-loops, pattern-risk-reward]
verify-with: docs/VERIFICATION.md
---

**What it is.** Any surface is climbable, but holding on **spends stamina**. The
bar drains while you cling and climb, refills only when you stand on ground or a
rest ledge. Run dry mid-face and you fall.

**Player fantasy / why it's fun.** The whole cliff is yours — but not for free.
Every ascent is a **wager**: can I reach that ledge before the meter empties?
Freedom and dread in the same gesture. Breath of the Wild sold a generation on
this exact tension.

## The verb

Press toward a surface to grip; hold up to climb. You are always asking one
question — **"do I have enough left?"**

## How it feels / why it's fun

- The cliff stops being geometry and becomes a **route-planning puzzle** solved
  in real time: which ledges to rest on, which overhang to sprint past.
- The meter converts a static wall into **pacing** — tension climbing, release at
  the ledge. See [[pattern-pacing-and-tension]].
- Reading the surface for the cheapest path is skill that compounds. See
  [[pattern-mastery-and-flow]] and [[system-mastery-curve]].
- It is a live [[pattern-risk-reward]] dial: the shortcut costs more stamina than
  the switchback, and you feel the price in your thumbs.

## Tuning levers

| Lever | What it controls | Sane default |
| --- | --- | --- |
| **Drain rate** | Stamina spent per second while climbing | full bar = ~6s of vertical climb |
| **Regen rate** | Refill while grounded/resting | full refill in ~2s |
| **Rest ledges** | Grippable surfaces that halt or slow drain | drain paused, no regen |
| **Bar size** | Total climb budget before rest | one long face = ~1.5 bars |
| **Warning band** | Low-stamina cue (flash, tremor, audio) | last 20% |
| **Grip-hang cost** | Drain while clinging without moving | ~40% of climb rate |
| **Recovery grip** | Whether an empty bar drops you or grants a beat | one beat to grab a ledge |
| **Upgrade axis** | What [[system-progression]] buys | +bar size before +speed |

Tune the **warning band** before anything else — a fall the player didn't see
coming reads as a lie, not a lesson. See [[pattern-fairness-and-trust]] and
[[antipattern-input-lie]].

## Slots into

- **Genres:** [[genre-exploration]], [[genre-metroidvania]],
  [[genre-action-adventure]], [[genre-survival-horror]], and
  [[genre-precision-platformer]] when the meter replaces pure timing.
- **Anchors:** [[anchor-celeste]] (stamina on the wall-climb),
  [[anchor-shadow-of-mordor]] (climb-anywhere Nemesis fortresses),
  [[anchor-minecraft]] and [[anchor-terraria]] (climb as world-access verb).

## Twist seams

- **Climb but rain makes surfaces slick and stamina drains double** (constraint) —
  weather rewrites the route mid-session; the safe face at noon is a death trap in
  a storm. Wire it through [[system-weather-and-time]] and
  [[system-hazards-and-environment]]; the player re-plans around
  [[pattern-pacing-and-tension]].
- **Climb but stamina is shared with your co-op partner** (perspective) — one bar,
  two climbers; whoever pushes hard strands the other. Forces the ledge-swap
  negotiation of [[anchor-it-takes-two]]. See [[genre-coop-chaos]] and
  [[system-coop-and-competition]].
- **Climb but the bar is a currency you also spend on attacks** (economy) — every
  swing is a rung you didn't climb, so combat mid-face is a debt. Pull from
  [[system-resource-loops]] and [[system-economy]].

For the machinery behind these, see [[process-the-twist]].

## How it wires to Hayao

- Stamina is one **scalar in state** that ticks each fixed step; drain and regen
  are deterministic functions of grip state and surface tag. Keep it in
  simulation state so it enters the world hash — the fall must be reproducible.
- Route the low-stamina flash/tremor through the **cosmetic** view layer so the
  cue never touches the hash. See the pause/timeScale and screen-shake wiring in
  the `sandboxes/` labs for the pattern, not a game.
- The meter widget (bar, color ramp, warning pulse) is chrome — a
  [[system-inventory-and-ui]] concern, drawn cosmetic.
- Surface-slickness and weather multipliers belong in one lookup keyed by tag, so
  the rain twist is a data change, not new code.

## Fails when…

- **The bar never bites.** If a full bar clears every intended face, stamina is
  decoration — cut it or shrink it. This is [[antipattern-false-depth]].
- **Falls feel unfair.** No warning band, or regen so fiddly the player can't plan
  → [[antipattern-rng-frustration]] by feel. See [[pattern-fairness-and-trust]].
- **Re-climbing is the punishment.** A long slog back up after every miss is
  [[antipattern-backtracking-tax]] and [[antipattern-fail-loop-tax]]; add rest
  ledges and generous checkpoints ([[system-save-and-checkpoint]],
  [[system-grace]]).
- **Upgrades erase the meter.** If [[system-progression]] hands out infinite
  stamina early, the mechanic dies at the exact moment it should deepen —
  [[antipattern-power-creep]]. Grow the walls, not just the bar.
- **One optimal path.** If the cheapest route is always obvious, planning
  collapses into [[antipattern-boring-optimal]]. Vary surface tags and ledge
  placement.

## See also

- Traversal siblings: [[mechanic-ledge-grab]], [[mechanic-wall-run]],
  [[mechanic-wall-jump]], [[mechanic-grapple]], [[mechanic-glide]].
- Systems: [[system-resource-loops]], [[system-progression]],
  [[system-map-and-navigation]], [[system-accessibility]] (stamina-off toggle as
  a difficulty option — see [[system-difficulty-and-dda]]).
- Patterns: [[pattern-risk-reward]], [[pattern-pacing-and-tension]],
  [[pattern-mastery-and-flow]].
- Process: [[process-core-loop]], [[process-the-twist]].

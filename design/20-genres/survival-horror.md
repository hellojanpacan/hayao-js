---
id: genre-survival-horror
title: Survival Horror
kind: genre
tags: [survival-horror, dread, resource, fuel, light, darkness, tension, scarcity]
summary: Scarcity-driven dread where difficulty lives in resource arithmetic — dread you can budget, not monster stats you can't.
use-when: Designing a survival-horror game whose fear is scarcity you must ration, with light/dark and a fuel economy as the pressure.
composes-with: [system-economy, system-grace, pattern-pacing-and-tension, system-resource-loops]
anchors: [anchor-outer-wilds]
verify-with: design/FUN.md#16--survival-horror
---

# Survival Horror

**What it is.** A hostile dark you must cross with too little to cross it. Fuel, light,
ammo, and health are scarce; the monster is a pressure, not a stat-check. You budget
your way to dawn — every lit second spends a resource you can't get back.

**Player fantasy / why it's fun.** *"I can survive this if I spend right — and I'm not
sure I can afford it."* The fear is **dread you can budget**: horror that lives in
arithmetic, so the player is always calculating, never merely reacting. Tension is a
ledger with a monster leaning over it.

## Pillars

1. **Difficulty is resource arithmetic.** The night is hard because the **fuel economy**
   is tight, not because the monster hits for more. Balance lives in a spreadsheet you
   expose to the player as scarcity.
2. **Camping is impossible; the night is winnable — from the same numbers.** One fuel
   inequality must prove *both*: you cannot hide until dawn, and dawn is reachable if
   you spend well. That single arithmetic sets the whole difficulty.
3. **Wound before death; grace over instadeath.** One grab is a story; two is a death.
   The genre's mercy is a [[system-grace]] system — a wound state and buffered intent —
   not a coin-flip kill.

## The loop stack

| Layer | The beat |
|---|---|
| **Moment** | Spend light to see → move through danger → the meter drops. |
| **Encounter** | A room/threat: cross it on a fuel budget, take a wound or spend to avoid it. |
| **Session** | A night: reach dawn before the economy runs dry. |
| **Meta** | Nights, upgrades, map knowledge; scarcity eases as mastery grows. |

## Essential systems

| System | Why this genre needs it |
|---|---|
| [[system-economy]] | Fuel/light/ammo faucets and sinks ARE the difficulty; a tight, honest ledger is the whole tension. |
| [[system-grace]] | The wound-before-death mercy; one grab buffers, two kills — grace as a system, unit-tested to the frame. |
| [[pattern-pacing-and-tension]] | Dread needs valleys (safe rooms, saved light) to make the peaks (a chase, a dark corridor) land. |
| [[system-resource-loops]] | Gather light/fuel → spend to survive → find more; the bottleneck is the pacing. |
| [[system-save-and-checkpoint]] | Horror respects the player's time between dread spikes; a punishing retry loop turns fear into resentment. |
| [[system-enemy-ai]] | The monster must be readable and beatable — a pressure with tells, not an invisible dice roll. |

## Content & difficulty model

- **Prove both halves of the fuel inequality.** From one arithmetic: a **keeper/camping
  bot must die** (you can't hide to dawn) AND a diligent bot **survives to dawn** (the
  night is winnable). If camping survives, there's no threat; if nothing survives, it's
  unfair.
- **Light must collide with the world.** Anything that interacts with light must collide
  with the light's occluders — or shadows hide invisible, unfair killers. Prove
  *light-repels* and *darkness-kills* each as a rule, against the actual geometry.
- **Difficulty = tighter budget, not bigger numbers.** A harder night gives less fuel,
  a longer dark, fewer safe rooms — never a monster with more HP. Scarcity scales; the
  monster stays a pressure.
- **Wound honesty.** A grab wounds visibly and buffers; the next is lethal. Assert the
  grace window frame-exactly (same shape as any grace system).
- **Content is nights + map.** New nights add a new arithmetic wrinkle (a new sink, a
  darker map); knowledge of the map is the real progression.

## Signature-mechanic seeds

- **Survival horror but cozy by day, dread by night** — you tend and rebuild in light,
  then defend on a fuel budget in the dark (tonal + structure; splices
  [[genre-farming-sim]]'s calm against the night's ledger).
- **Survival horror but knowledge is the only weapon** — no combat; you survive by what
  you've learned about the monster's rules (mechanic-swap toward [[anchor-outer-wilds]];
  dread becomes deduction).
- **Survival horror but the light is a shared resource in coop** — two players, one fuel
  ledger, forced communication in the dark (perspective + constraint; pairs with
  [[system-coop-and-competition]]).
- **Survival horror but every death rewrites the house** — the map remembers and mutates
  around your failures (structure; systemic memory à la [[system-emergent-systems]]).
- **Survival horror but one candle, one screen, sixty seconds** — a hard constraint that
  makes every second of light a decision (constraint).

## Common pitfalls

- **Difficulty in monster stats.** Scaling HP/damage makes horror a stat-check, not a
  budget; the fear evaporates into a health bar. Scale scarcity instead.
- **Light without occlusion.** Shadows that don't collide become invisible killers — the
  single most unfair bug the genre invites.
- **Campable nights.** If hiding survives to dawn, there's no threat; the fuel inequality
  exists to forbid it.
- **Instadeath.** A coin-flip kill reads as unfair and breaks the budgeting fantasy; wound
  first, buffer intent, then kill.
- **Relentless dread.** Unbroken tension goes numb; without safe valleys the peaks stop
  spiking. [[pattern-pacing-and-tension]] is load-bearing here.

## Anchors

- [[anchor-outer-wilds]] — knowledge as the only progression; the reference for the
  no-combat, dread-as-deduction bend, and for a curiosity-gated dark to explore.

## Verify

Keeper bot survives to dawn; light-repels and darkness-kills each proven; fuel solvency
inequality; golden night → **[design/FUN.md §16 · Survival horror](../FUN.md#16--survival-horror)**.
Author the ledger and the mood-predicate here; prove the inequality there.

## Composes with

- [[system-economy]] — the fuel/light ledger that IS the difficulty.
- [[system-grace]] — the wound-before-death mercy that keeps dread fair.
- [[pattern-pacing-and-tension]] — the valleys that make the dread spikes land.

## See also

- [design/FUN.md §16](../FUN.md#16--survival-horror) — mechanical truth + verify recipe.
- [design/JUICE.md](../JUICE.md) — feel gates for the light/shadow and wound choreography.
- [`sandboxes/`](../../sandboxes/) — the light/physics lab to prove occlusion and a fuel
  budget before building a night.

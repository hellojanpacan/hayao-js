---
id: anchor-vampire-survivors
title: Vampire Survivors
kind: anchor
tags: [horde-survival, auto-attack, build-growth, rising-tide, minimal-input, power-fantasy]
summary: One-stick horde survival where you only move — weapons fire themselves — and the whole game is your multiplying build racing an escalating swarm.
use-when: Designing a low-input game whose fun is watching a snowballing build outrun a superlinear threat curve.
composes-with: [genre-horde-survival, system-build-diversity, system-reward-schedules, system-progression]
anchors: [anchor-vampire-survivors]
verify-with: design/FUN.md#6-·-twin-stick-horde-survival-vampire-survivors-like
---

# Vampire Survivors

**What it is.** You steer a character with one stick; every weapon auto-fires.
Kill enemies, collect gems, level up, pick one of three upgrades, and repeat
until you're a screen-clearing storm of projectiles — or the swarm finally
catches you.

**Player fantasy / why it's fun.** *I started weak and now I am a walking
apocalypse.* The pull is the **power-curve crossover**: for the first minutes
you barely survive; then your build tips over a threshold and the same enemies
that terrified you become confetti. Minimal input, maximal escalation.

## Design DNA

Strip combat down to **positioning only** — remove aiming, remove firing — so
the entire skill expression is *where you stand* and *what you build*. Then
run two exponentials against each other: a **multiplicatively growing build**
vs a **superlinearly rising tide** of enemies. Fun is the race between those
curves, and the drama is whether your build tips over before the swarm does.

The whole design lives or dies on the **crossover point**. Set it too early
and the run is a boring victory lap; too late and it's a frustrating grind
that never pays off. The spawn curve must be *superlinear* (quadratic ramp)
precisely because the build is *multiplicative* — a linear threat can't stay
ahead of a build that stacks area × count × cooldown, so the upgrades would
trivialise the night. Two matched exponentials is what keeps the tension taut
for the full timer.

The upgrade draft is the whole game's decision surface. Everything else is a
treadmill you're outrunning — which is why the draft cadence (frequent,
low-stakes, one-of-three) matters more than any single weapon's numbers.

## Load-bearing structures

| Structure | Why it works |
|---|---|
| **Auto-attack; you only move** | Removes execution skill, foregrounds build + positioning. Radically low input, high legibility. |
| **Superlinear spawn pressure** | Enemy density ramps quadratically so it can stay ahead of a multiplicative build — or upgrades trivialise the run. FUN.md truth. [[system-difficulty-and-dda]]. |
| **Level-up draft-of-3, sim paused** | The one decision that matters, delivered as a frequent, low-stakes pick. Picks are *input actions* so runs replay. [[system-reward-schedules]]. |
| **Multiplicative build growth** | Weapons + passives stack multiplicatively (area × count × cooldown), so builds *tip over* rather than climb linearly. [[system-build-diversity]]. |
| **Evolution recipes** | Weapon + matching passive fuses into a super-weapon — a hidden combinatorial goal that rewards knowledge. [[system-crafting]]. |
| **Orbiting is the skill** | The safe play is circling the horde, not fleeing (kiting corners you). The map teaches this by shape. |
| **Session = a fixed timer** | ~15–30 min "survive the clock" gives a clean win condition and a legible arc. [[system-session-structure]]. |

## What to steal

- **Auto-fire so the only inputs are move + draft.** The lowest-input action
  loop that still feels like combat. Instant onboarding.
- **Two racing curves.** Multiplicative build vs superlinear swarm. Tune the
  crossover point — that's the whole difficulty design. Assert `peak alive ≥
  N` so the horde feel can't regress (FUN.md).
- **Frequent low-stakes draft-of-3.** Many small choices beat few big ones for
  flow; keep the sim paused during the pick and log it as input.
- **Hidden fusion recipes** as a knowledge-reward layer over the visible
  draft.
- **A survive-the-timer session frame** for a clean, repeatable arc — a fixed
  clock gives a legible win, a natural finale spike, and a stable unit for
  balancing the two curves.
- **Foreground positioning by making the safe play *circling*.** Design the
  arena and enemy speeds so orbiting the horde beats fleeing it; a kiting-bot
  that corners itself proves the map teaches the right instinct (FUN.md §6).

## What's just theme (drop it)

- **Gothic/vampire skin.** Pure paint — the same loop ships as bugs, robots,
  or emoji.
- **The specific weapon roster.** The *categories* (orbit, projectile, aura,
  melee) are structural; garlic vs holy-water is flavour — see
  [[system-build-diversity]].
- **Meta gold shop.** A common bolt-on ([[system-meta-progression]]) but not
  essential; the in-run curve carries the fun alone.
- **The pixel-swarm look.** Aesthetic. The tide only needs to *read* as
  overwhelming.

## Composes into

- [[genre-horde-survival]] — its canonical anchor; the rising-tide-vs-build
  loop lives there.
- [[system-build-diversity]] — the multiplicative-stack draft is the exemplar.
- [[system-reward-schedules]] — the paced level-up draft.
- [[system-progression]] — in-run power pacing.
- [[system-difficulty-and-dda]] — the superlinear spawn curve as the
  difficulty engine.

## Twist seams

- **Vampire Survivors but you place the build before the run and only watch**
  *(structure)* — pushes it toward [[genre-auto-battler]]: the draft moves to
  a prep phase, positioning becomes formation. Bends who decides when.
- **Vampire Survivors but one weapon, and the draft upgrades the *map***
  *(mechanic-swap)* — instead of stacking weapons you reshape the arena
  (walls, funnels, hazards); the tide stays, the build becomes level design.
- **Vampire Survivors but the tide is time itself** *(constraint)* — no
  enemies; the "swarm" is a rising flood or dark you outbuild by
  lighting/pumping. Same crossover drama, no combat. Pairs with
  [[genre-survival-horror]].
- **Vampire Survivors but tonally serene — you're growing a garden the weeds
  are racing** *(tonal)* — the swarm becomes encroaching overgrowth, the build
  becomes cultivation; the same two-exponential race, recolored from panic to
  tending. Pairs with [[genre-farming-sim]].

## See also

- [[genre-horde-survival]] · [[system-build-diversity]] ·
  [[system-reward-schedules]]
- `design/FUN.md#6-·-twin-stick-horde-survival-vampire-survivors-like` —
  orbit-bot + peak-alive verify.
- `sandboxes/particle-workshop/` — pooled, cosmetic swarm rendering (deletable
  per law 6).
- `design/JUICE.md` — the level-up / crit / clear feedback choreography.

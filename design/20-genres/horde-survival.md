---
id: genre-horde-survival
title: Twin-stick Horde Survival (Vampire Survivors-like)
kind: genre
tags: [horde, survivors, twin-stick, auto-attack, build, wave, roguelite, orbit]
summary: The rising tide vs your rising build — minimal input, auto-attacks, and a level-up draft that races a superlinear swarm you must out-scale.
use-when: Designing a survive-the-timer game where the skill is positioning and build-drafting against an escalating horde.
composes-with: [system-build-diversity, system-meta-progression, system-reward-schedules, system-difficulty-and-dda, system-procgen-design, system-session-structure]
anchors: [anchor-vampire-survivors, anchor-nuclear-throne]
verify-with: design/FUN.md#6--twin-stick-horde-survival-vampire-survivors-like
---

# Twin-stick Horde Survival (Vampire Survivors-like)

**What it is.** You move; you don't aim. Weapons fire automatically. The screen
fills with enemies at a rising rate, and every few seconds you pick one upgrade
from a draft. The run is a race between the **swarm's growth** and your **build's
growth** — survive the timer, or drown.

**Player fantasy / why it's fun.** *"My build came online."* The turn from
scraping by to mowing hundreds — the multiplicative moment when three upgrades
click and the horde that was killing you becomes XP confetti. Minimal input,
maximal escalation.

## Pillars

1. **Positioning is the only input.** No aiming, no reloading — the skill is
   *orbiting* the horde so your auto-attacks sweep them, herding density into your
   fire. (Kiting bots corner themselves; the skill is the orbit — FUN.md §6.)
2. **Build growth is multiplicative.** Upgrades compound — +area × +count ×
   +damage — so the power fantasy accelerates. This is why the tide must be
   superlinear to keep pace ([[system-build-diversity]]).
3. **The tide always rises.** Spawn pressure climbs relentlessly (quadratic ramp)
   so the run is always tightening; the peak-alive count is a designed target, not
   an accident.

## The loop stack

| Scale | The loop |
|---|---|
| **Moment** | Orbit; sweep a cluster; scoop the XP gems it drops. |
| **Encounter** | A wave / minute band: survive its density, then the level-up draft that answers it. |
| **Session** | One ~10–20 min run: draft a build, out-scale the tide, reach the timer or die. |
| **Meta** | Between-run persistent unlocks (new characters, weapons, permanent perks) that change *what you can draft*. |

## Essential systems

| System | Why it's needed |
|---|---|
| [[system-build-diversity]] | The draft is the game; many upgrades × real synergies make each run a different build story. Pillar 2. |
| [[system-meta-progression]] | Persistent between-run unlocks that add *options* (not just power) — the reason to run again. Pillar of retention. |
| [[system-reward-schedules]] | XP gems, chests, level-up timing — the drip that paces the power fantasy; keep it ethical (no dark patterns). |
| [[system-difficulty-and-dda]] | The tide curve; the quadratic spawn ramp is the difficulty. Assist = slower ramp or a revive. |
| [[system-procgen-design]] | Enemy composition and pickup placement varied per run within provable pressure bounds. |
| [[system-session-structure]] | A run is a fixed-length timer; define the band structure (minute → boss-minute → finale). |

## Content & difficulty model

- **Spawn pressure must be superlinear.** Multiplicative build growth out-runs a
  linear tide by minute three; the horde needs a *quadratic* ramp to stay a threat
  through the finale (FUN.md §6). Derive the ramp from expected build DPS, not by
  feel.
- **Level-up picks pause the sim, and are input actions.** The draft freezes time;
  each pick is a replayable input, never a direct mutation (FUN.md §6, law 6).
- **Assert `peak alive ≥ N`.** Lock in the horde feel so it can't silently regress
  — a build that trivialises the swarm should still face a wall of bodies at the
  peak (FUN.md §6).
- **Synergies over stat sticks.** A weapon that *combines* with another (garlic +
  knockback = a grinder) beats a flat +10% damage. Build the upgrade pool so 3–4
  archetypes each have a payoff spike.

Reference wiring: [`examples/emberwake`](../../examples/emberwake) — the horde sim
in `world.state` with a *pooled-sprite* view (the cosmetic-view rule under load);
the orbit-bot survival proof and `peak alive` assertion pattern. Grep
[`docs/API.md`](../../docs/API.md) for the pooling and particle primitives.

## Signature-mechanic seeds

"X but Y" ([[process-the-twist]]) — bend the *input*, the *tide*, or the *draft*.

- **Survivors but you draw your attack path** — one gesture per few seconds aims
  the sweep; positioning *plus* one deliberate stroke. (mechanic-swap)
- **Survivors but the horde is your XP economy AND your clock** — kills you don't
  scoop become the enemies of the next minute. (structure)
- **Survivors but you draft the enemies too** — pick your upgrade *and* what the
  tide sends next; risk-reward push-your-luck. (mechanic-swap — pairs with [[pattern-risk-reward]])
- **Survivors but two players share one XP pool and one screen** — coop where you
  fight over the draft. (perspective — pairs with [[genre-coop-chaos]])
- **Survivors but the map shrinks each minute** — the arena, not just the spawn
  rate, is the rising tide. (constraint)

## Common pitfalls

- **Linear tide, exponential build.** By minute three the player is a god and
  bored. The ramp must be superlinear (FUN.md §6). This is the #1 failure.
- **Aiming.** Adding a manual aim verb breaks the minimal-input fantasy and the
  orbit skill. Keep the hands quiet; the mind does the building.
- **Flat upgrade pool.** All-stat-sticks, no synergies → every run is the same
  build. Author payoff spikes ([[system-build-diversity]]).
- **Meta that only adds raw power.** If unlocks just make you stronger, runs
  homogenise. Add *options* that change the draft ([[system-meta-progression]]).
- **A draft that doesn't pause.** Picking under fire is stress, not strategy —
  freeze the sim for the choice.

## Anchors

- [[anchor-vampire-survivors]] — the minimal-input horde loop; build-growth vs
  rising tide; the auto-attack fantasy.
- [[anchor-nuclear-throne]] — arcade twin-stick roguelite tightness; steal the
  run-based mastery and moment-to-moment feel.

## Verify

Prove it with **[FUN.md §6 · Horde survival](../FUN.md#6--twin-stick-horde-survival-vampire-survivors-like)** —
orbit-bot survives with an hp floor; `peak alive ≥ N` asserted so the horde can't
regress; the superlinear spawn ramp checked against build DPS; sim ms/step budget
under load. Design the tide-vs-build here; prove the race there.

## Composes with

- [[system-build-diversity]] — the draft is the game; synergies over stat sticks.
- [[system-meta-progression]] — between-run options are the retention loop.
- [[pattern-feedback-loops]] — the build's positive loop must stay just behind the tide.

## See also

- [`examples/emberwake`](../../examples/emberwake) — the reference horde sim + pooled view.
- [`design/FUN.md §6`](../FUN.md#6--twin-stick-horde-survival-vampire-survivors-like) — the proof playbook.

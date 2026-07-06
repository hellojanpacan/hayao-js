---
id: system-spawn-directors
title: Spawn & AI Directors
kind: system
tags: [pacing, ai-director, spawns, tension, dynamic]
summary: The invisible hand that paces threat — spawn budgets and an AI director that shapes tension in real time.
use-when: You need to pace encounters dynamically rather than hand-place every threat.
composes-with: [system-encounter-design, system-difficulty-and-dda, pattern-pacing-and-tension]
anchors: [anchor-rimworld]
verify-with: docs/VERIFICATION.md
---

**What it is.** An invisible system that decides *what* threat appears, *when*, and *how much* — from hand-placed spawns, to budget-priced waves, to a reactive **director** that reads player state and drives a tension curve. It is the author of pacing you never see.

**Player fantasy / why it's fun.** The world feels alive and out to get you — pressure that swells and releases like breathing, a lull that's earned and a peak that's survived. The best directors feel *authored*, never random: every spike reads as a story beat the player will retell.

## When to use / when NOT

**Use when:** replayable content (roguelike, [[genre-horde-survival]], [[genre-extraction-shooter]]) where hand-placing every threat is impossible; when you want the same map to feel different each run; when pacing must adapt to how well the player is doing.

**Don't use when:** a tightly authored [[genre-precision-platformer]] or [[genre-grid-puzzle]] where every element is a designed problem — a director robs you of the deliberate difficulty ramp. Also skip for a first-timer's opening minutes: hand-place the [[system-onboarding]] so the tutorial is legible, then hand control to the director.

## Variants

| Variant | How it decides | Reference | Best for |
|---|---|---|---|
| **Fixed spawns** | Author places each threat at a location/trigger | [[anchor-dark-souls]], [[anchor-celeste]] | Authored campaigns, memorizable rooms |
| **Wave tables** | Timed list: at t=30s spawn N of type X | [[anchor-vampire-survivors]], tower defense | [[genre-horde-survival]], [[genre-tower-defense]] |
| **Budget-based** | Spend a points budget on a shop of enemies; budget grows over time | [[anchor-nuclear-throne]], [[anchor-spelunky]] rooms | Procedural rooms, varied but bounded threat |
| **Reactive director** | Reads player stress/health/pace; adds or holds threat to hit a target curve | L4D, [[anchor-rimworld]] storyteller | Dynamic tension, high replay value |
| **Narrative director** | Director serves a story arc, not just difficulty — themed events, escalating stakes | [[anchor-rimworld]], [[anchor-frostpunk]] | Emergent stories the player recounts |

Budgets and directors compose: price threats with a budget, then let the director decide *when* to spend. See [[system-encounter-design]] for the per-encounter grammar the director assembles from.

## Tuning levers

- **Intensity curve.** The shape the director aims for over a session — the target it steers toward. Peak-and-valley, not a flat line or a monotone climb. See [[pattern-pacing-and-tension]].
- **Peak-and-valley rhythm.** L4D's model: build-up → **peak** → relax → *ensure* a lull → repeat. The valley is not idle time; it is the setup that makes the next peak legible. Cut it and the player numbs.
- **Budget cap.** Ceiling on threat priced per beat. Prevents a bad roll from stacking three elites in one room. Cap scales with run length, not real time.
- **Cooldown / lull floor.** Minimum quiet between peaks. Guarantees the player can reload, heal, breathe — the anti-frustration valve.
- **Spawn distance & sightlines.** *Where* threat appears governs fairness as much as *how much*. Off-screen-but-audible telegraphs (see [[system-telegraphs]]) beat teleport-behind-you every time.
- **Composition weights.** Ratio of fodder to specials to elites. Shifts the *texture* of a peak, not just its height. Pull from [[system-enemy-archetypes]].
- **Reactivity gain.** How hard the director leans on player performance. High gain = rubber-band ([[system-difficulty-and-dda]]); low gain = mostly scripted with light adaptation. Tune conservatively — players smell rubber-band.

## Twist seams

- **Director but it targets the strongest player** *(risk-reward)* — in co-op, the director concentrates threat on whoever is dominating: the fed player draws the elite, the swarm, the special. Rewards mastery with pressure, protects the struggling teammate, and manufactures the clutch save. See [[pattern-risk-reward]], [[system-coop-and-competition]].
- **Spawns but the player sets the budget for a reward** *(perspective)* — flip authorship: the player *dials up* the spawn budget before a run (more threat) in exchange for richer loot. The director becomes a wager. [[anchor-rimworld]] and Risk-of-Rain-style difficulty dials live here; ties into [[system-loot-tables]] and [[system-reward-schedules]].

## How it wires to Hayao

- **Determinism is non-negotiable.** Every spawn roll, budget draw, and director decision goes through the world's deterministic RNG — never wall-clock time or ambient randomness. A director that can't be replayed can't be proven fair or debugged. Same seed, same run.
- **Model the director as pure state.** Keep tension, budget, and cooldown timers as explicit fields advanced by a pure step function — the same discipline as a turn-based rules module. The scene tree only reflects what the director decided; view stays cosmetic.
- **Read player state through a stable probe.** The director consumes a snapshot (health, position, recent damage, pace) — not live view nodes. Order every iteration (enemy lists, spawn candidates) so decisions are reproducible.
- **Learn the parts in isolation** before wiring a director: procedural placement and seeded rolls belong in a procgen sandbox; enemy behavior once spawned belongs with [[system-enemy-ai]]. Compose, don't conflate.

## Fails when…

- It feels **unfair**: threat teleports in, spawns in your blind spot, or peaks with no telegraph → [[antipattern-guess-the-designer]], and see [[pattern-fairness-and-trust]].
- It feels **arbitrary**: pure randomness with no curve reads as noise, not authorship. A bad seed ruins a run → [[antipattern-rng-frustration]].
- **No valleys**: relentless pressure with no lull numbs the player and erases the peaks it's trying to sell → [[antipattern-fail-loop-tax]].
- **Rubber-band too visible**: punishing success so hard that playing *worse* is optimal → [[antipattern-boring-optimal]]. Keep reactivity gain low; see [[system-difficulty-and-dda]].
- **Content desert**: three enemy types on infinite shuffle — a director needs a deep archetype roster to compose from, or every peak feels the same → [[antipattern-content-desert]].

## Verify

Determinism and fairness are the whole game here — prove them, don't assert them by feel. A seeded run must replay identically; the intensity curve must show peaks *and* valleys, not a flat or monotone line; no spawn may violate the distance/sightline fairness rule. Hold it to **docs/VERIFICATION.md**.

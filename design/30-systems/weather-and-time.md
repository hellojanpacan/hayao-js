---
id: system-weather-and-time
title: Weather & Time-of-Day
kind: system
tags: [simulation, day-night, weather, pacing, systemic]
summary: A living clock and sky that change play — day/night threat, weather that alters systems, time as pacing and pressure.
use-when: You want ambient systemic variety or time-driven pressure and mood.
composes-with: [system-hazards-and-environment, world-mood-and-atmosphere, pattern-pacing-and-tension]
anchors: [anchor-minecraft]
verify-with: docs/VERIFICATION.md
---

**What it is.** A clock and a sky that advance on their own and feed back into rules — light level, spawn tables, movement, visibility, resource yield. Time is a variable other systems read; weather is a modifier layered on top.

**Player fantasy / why it's fun.** The world is alive without you. You learn to read the sky, race the dusk, hoard shelter before the storm — the game breathes on a rhythm you don't fully control but can *anticipate*.

## When to use / when NOT

Use it when you want **ambient variety** that costs no new content, a **pacing engine** that isn't scripted, or **mood** that shifts under the same mechanics. Time is free replayability: the same map at 6am and midnight is two encounters.

Do NOT use it when the sky is **noise** — if weather changes nothing the player can act on, cut it or make it purely [[world-mood-and-atmosphere]] and stop pretending it's a system. Precision genres ([[genre-precision-platformer]], [[genre-fighting-game]]) usually reject it: unpredictable rules poison fair reads. See [[antipattern-fake-choice]] and [[antipattern-rng-frustration]].

## Variants

| Variant | What changes | Coupling | Reference |
|---|---|---|---|
| **Cosmetic sky** | View only — tint, fog, rain particles | none | most action games' backdrops |
| **Systemic weather** | Movement, sightlines, fire, crops, AI | high | [[anchor-rimworld]] cold snaps, [[anchor-frostpunk]] |
| **Day/night threat** | Night spawns harder; night is the danger | high | [[anchor-minecraft]], [[anchor-terraria]] |
| **Clock as deadline** | Time = resource; running out is loss | high | [[anchor-stardew-valley]] day timer, [[anchor-outer-wilds]] loop |
| **Forecast telegraph** | Coming weather shown; plan around it | high | [[anchor-into-the-breach]]-style preview logic |
| **Summoned weather** | Player *causes* it, at a cost | high | see twist below |

## Twist seams

- **Weather but the player summons it at a cost** *(perspective)* — rain isn't ambient, it's a spell with a price. You call the storm to douse a fire or hide a crossing, spending mana/turns/heat. Now the sky is a [[pattern-risk-reward]] verb, not a backdrop — and legibility matters double because *you* chose it.
- **Day/night but the two are two different games** *(structure)* — day is a [[genre-farming-sim]]/build phase; night is [[genre-horde-survival]] defense. The clock isn't a modifier, it's a mode switch, like [[anchor-terraria]]'s bosses or a tower-defense wave gate ([[recipe-tower-defense-roguelite]]). Each half teaches and funds the other.

## Tuning levers

| Lever | Loose end | Tight end |
|---|---|---|
| **Cycle length** | 20-min real days (ambient, forgettable) | 90-sec cycles (frantic, [[anchor-minecraft]]-fast) |
| **Gameplay coupling** | tint only | spawns + movement + yield all shift |
| **Forecast legibility** | surprise weather (feels random) | full preview N turns out ([[system-telegraphs]]) |
| **Real-time vs game-time** | wall-clock ([[anchor-animal-crossing]]) | in-sim ticks only (deterministic, replayable) |
| **Reversibility** | fixed march of the clock | player can [[mechanic-rewind]]/wait/skip |
| **Threat delta** | night 10% harder | night is a wholly different threat model |

**Real-time vs game-time is a fork, not a slider.** Wall-clock ([[anchor-animal-crossing]] shops close at night IRL) trades determinism for uncanny presence — the world moves while you're gone. In-sim time keeps every run reproducible and is the default for anything with a solver or verify pass. Don't mix them silently; pick one and telegraph which.

## How it wires to Hayao

- **The clock is sim state.** Advance it in fixed ticks so the same inputs yield the same day. All weather rolls go through the world's deterministic RNG — never wall-clock, never `Math.random` — so a stormy seed replays stormy. (`new Date`/real time only for the wall-clock variant, and only read *outside* the hashed sim.)
- **Sky is cosmetic; consequences are not.** The tint, fog, rain particles, and lantern glow are pure-view nodes (`cosmetic = true`) — they stay out of the world hash. The *spawn multiplier*, *movement penalty*, *crop yield* are real state and must hash. Split them cleanly or your view breaks determinism.
- **Read the labs, not memory.** For the ambient-view layer (fog, particle rain, day tint) study the relevant `sandboxes/` lab in isolation; for a full day-loop game structure, `examples/` is the convention reference. Keep the modifier a plain number your systems already read (spawn director, resource loop), not a special case bolted on.
- Feeds [[system-spawn-directors]] (night waves), [[system-loot-tables]] (weather-gated drops), [[system-resource-loops]] (light-dependent yield), and stacks with [[system-hazards-and-environment]] (lightning, floods) and [[system-status-effects]] (soaked, frozen, blinded).

## Composition

- [[pattern-pacing-and-tension]] — the cycle is a free tension curve: dusk is the ramp, night is the peak. Let it breathe.
- [[world-mood-and-atmosphere]] + [[world-soundscape]] — same mechanics, different weather = different feeling; the sky is your cheapest mood lever.
- [[system-difficulty-and-dda]] — night as a difficulty knob the player can *see coming* and prepare for.
- [[system-map-and-navigation]] — fog/night that shrinks sightlines turns a known map back into unknown.

## Fails when…

- **The sky is theater.** Weather that changes nothing is [[antipattern-fake-choice]] wearing a raincoat — either couple it or demote it to cosmetic and admit it.
- **The storm is unfair.** Surprise weather that instantly kills, with no forecast and no counter, is [[antipattern-rng-frustration]]. Telegraph it ([[system-telegraphs]]) or bound its damage.
- **Night is just longer.** A night that's identical play but slower is [[antipattern-content-desert]] — padding, not a phase. Change the *threat model*, not the clock speed.
- **Coupling turns into a knot.** Weather touching every system with no through-line is [[antipattern-feature-soup]]. One clear axis (light → threat) beats ten fuzzy ones.
- **Wall-clock breaks trust.** Time-gates that lock content behind real hours read as [[antipattern-pay-to-skip]] bait or just annoy; use sparingly and never for core progress.

## Verify

Prove the clock advances deterministically and weather rolls are seed-stable — same seed, same sky — per the harness in `docs/VERIFICATION.md`. Confirm the cosmetic sky layer stays out of the world hash (view-only), while the coupled modifiers (spawns, movement, yield) are hashed sim state. If you shipped the summoned-weather or two-games twist, verify the *cost* and the *mode switch* are legible and reachable, not soft-locking.

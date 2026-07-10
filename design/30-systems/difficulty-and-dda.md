---
id: system-difficulty-and-dda
title: Difficulty & Dynamic Difficulty
kind: system
tags: [difficulty, dda, curve, spikes, breathers, ai-director, assist, ramp, pacing]
summary: Difficulty curves that breathe — spikes and breathers, an AI director that authors pressure, and assist modes that never shame.
use-when: You need to shape challenge over a session, react to a player's skill, or offer honest difficulty options.
composes-with: [system-encounter-design, system-onboarding, system-accessibility, pattern-pacing-and-tension]
anchors: [anchor-rimworld, anchor-celeste]
verify-with: design/FUN.md#8-tower-defense
---

# Difficulty & Dynamic Difficulty

**What it is.** How hard the game is, *over time* and *per player*. Three tools:
a **difficulty curve** (a designed sequence of spikes and breathers), a **director**
(a system that spawns pressure in response to state), and **assist modes** (honest
knobs that let anyone find their edge). The goal is the **flow channel** — challenge
tracking skill, never far above or below ([[pattern-mastery-and-flow]]).

**Player fantasy / why it's fun.** Being *tested at exactly your level*. A curve
that breathes lets tension land — a boss hits harder after a quiet corridor. A
director makes a run feel *authored to you*. Assist modes let the humane version of
the fantasy exist (Celeste): the game meets you, it doesn't gate-keep you.

## When to use / when NOT

| Tool | Reach for it when | Don't when |
|---|---|---|
| **Authored curve** | linear/campaign content; you control order | fully procedural — shape the *generator's* band instead |
| **Director (DDA)** | survival, colony sim, replayable runs; you want reactive pressure | tight puzzles — perfect information forbids hidden dials (§12) |
| **Assist modes** | any single-player skill game | competitive PvP where fairness is symmetry |

> **Two ditches.** Static difficulty leaves half your players bored and the other
> half walled out. A *hidden* rubber-band that punishes doing well ("do better,
> get punished") betrays trust the moment it's noticed. DDA must nudge, never lie.

## Variants

| Variant | How it decides | Feels like | Anchor |
|---|---|---|---|
| **Authored curve** | fixed schedule of encounters | a designed rollercoaster | most campaigns |
| **Threat-budget director** | spends a rising budget on spawns | escalating siege | [[anchor-rimworld]]'s storyteller |
| **Performance DDA** | reads hp/deaths/time, adjusts spawns | "the game read me" | Left-4-Dead-style |
| **Player-chosen tiers** | difficulty menu | honest self-selection | Doom, most action games |
| **Assist toggles** | per-axis mercy (speed, i-frames, skip) | "I set my own edge" | [[anchor-celeste]] assist mode |

## Tuning levers

| Lever | Effect | Watch for |
|---|---|---|
| **Spike/breather rhythm** | tension arc | monotone-rising = exhausting; flat = dull |
| **Director budget slope** | how fast pressure grows | superlinear needed to outpace build growth (§6) |
| **DDA sensitivity** | how sharply it reacts | too twitchy = visibly rubber-bandy |
| **DDA bounds** | floor/ceiling on adjustment | unbounded = trivializes or walls |
| **Assist granularity** | per-axis vs. one slider | one slider forces all-or-nothing |

## How it wires to Hayao

- **The director already exists.** `initDirector(waves)` +
  `pollDirector(waves, state, world.time, world.rng)` (grep `docs/API.md`,
  [`src/content/dsl.ts`](../../src/content/dsl.ts)) is a deterministic pressure
  authorer: waves fire on sim time, weighted spawns roll through `world.rng`, and
  catch-up after a restore never drops spawns. Keep `DirectorState` in
  `world.state` so pressure is hashed and replayable.
- **Performance DDA reads the probe.** The same numbers `world.probe()` exposes
  (hp floor, time alive, deaths) are the DDA inputs — bounded, ordered, and part of
  `world.hash()` so difficulty can't silently escape determinism.
- **The curve is checkable.** `assertRamp(difficulty, opts)` / `rampIssues` (grep
  `docs/API.md`) assert the *shape* — a designed ramp with breathers, not
  monotonicity. Author the sequence, then prove it breathes.
- **Assist modes are tuning.** Model them as declared `tuning:` knobs
  ([`docs/WORKSHOP.md`](../../docs/WORKSHOP.md)); their resolved values live in
  `world.hash()` via `world.tune(key)`, so an assisted run is still a first-class,
  replayable artifact — not a second-class cheat path.

## Fails when…

- **Monotone difficulty.** Always-harder with no breather has no arc — tension
  can't spike without a valley (FUN.md §8, [[pattern-pacing-and-tension]]).
- **Visible rubber-band.** Players who notice they're punished for playing well
  stop trying — the trust cost outweighs the smoothing.
- **Unbounded DDA.** No floor/ceiling and the director either trivializes the game
  or spirals it out of reach.
- **Assist as shame.** Locking achievements or nagging on assist turns a humane
  tool into a punishment. Assist is a *setting*, not a confession (Celeste).
- **Sublinear survival pressure.** In hordes, linear spawn loses to multiplicative
  build growth — the ramp must be superlinear (§6).

## Verify

- **Curve breathes:** `assertRamp`/`rampIssues` on the difficulty series — each
  wave ≥ ~55% of prior, finale peaks ([FUN.md §8](../FUN.md#8-tower-defense)).
- **Win-rate window, not a point:** a competent bot should land *inside* a band
  (e.g. 11–19 of 20) — both edges break CI ([FUN.md §11](../FUN.md#11-roguelike-deckbuilder)).
- **Null loses at every tier:** the do-nothing/undefended run fails on easy too
  (FUN.md law 4).
- **Determinism under DDA:** golden-hash a scripted run at each setting; tuning
  values are in `world.hash()` (WORKSHOP knob-change semantics).

## Composes with

- [[system-encounter-design]] — the units a curve or director sequences.
- [[system-onboarding]] — the first ten minutes are the gentlest slope; the curve starts here.
- [[system-accessibility]] — assist modes are the accessible face of difficulty.
- [[pattern-pacing-and-tension]] — spikes/breathers are pacing made mechanical.
- [[pattern-mastery-and-flow]] — the flow channel is the target the curve tracks.

## See also

- [`design/FUN.md` §6/§8/§11](../FUN.md) — superlinear pressure, breathing waves, win-rate windows.
- [`src/content/dsl.ts`](../../src/content/dsl.ts) — the director primitive.
- [[anchor-rimworld]] — the AI storyteller as difficulty *and* narrative.
- [[anchor-celeste]] — assist mode as the humane difficulty floor.

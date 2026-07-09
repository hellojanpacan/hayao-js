---
id: system-progression
title: Progression — XP, Levels, the Power Curve
kind: system
tags: [progression, xp, levels, power-curve, pacing, growth, vertical, horizontal]
summary: Turning play into steadily-earned power; pacing the curve so growth never stalls and never trivialises the challenge it feeds.
use-when: The design promises the player gets stronger over time and you need to shape how fast, along which axes, and how it stays fun.
composes-with: [system-skill-trees, system-economy, system-reward-schedules, system-mastery-curve, system-difficulty-and-dda]
anchors: [anchor-hades, anchor-vampire-survivors, anchor-dead-cells]
verify-with: design/FUN.md#14-incrementalidle
---

# Progression — XP, Levels, the Power Curve

**What it is.** The **curve** that converts time-and-skill spent into durable
power. XP fills a bar, the bar pops a level, the level buys a gain. The design
work is not the bar — it is the *shape* of the curve and *what each level is
worth*.

**Player fantasy / why it's fun.** "I am becoming stronger, and I can feel it."
Every session ends with the character measurably ahead of where it started. The
pull is the **next** gain always sitting just inside reach.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| The fun is a rising arc — you *build* toward power | Mastery is the whole point; power is flat (Tetris, chess) |
| Sessions need a between-run ledger of "I earned something" | A run should reset clean every time with no carryover |
| You want a difficulty dial that the *player* turns by playing | Handing power out would erase the challenge that IS the game |

If the game is pure execution (**[[genre-precision-platformer]]**,
**[[genre-bullet-hell]]**), don't bolt on XP — the level *is* the reward. A
platformer's "progression" is new *verbs* (**[[genre-metroidvania]]**), not
bigger numbers.

## Variants

| Variant | Power comes from | Feels like | Example |
|---|---|---|---|
| **Vertical** | Bigger numbers on the same actions | Overwhelming what used to threaten you | Diablo levels; Vampire Survivors' in-run levels |
| **Horizontal** | New *options*, not more damage | A wider toolbox, same lethality | Zelda items; Hades' boon variety |
| **In-run (soft)** | Growth reset each run | A build arc per session | VS level-ups; roguelite per-run picks |
| **Meta (hard)** | Growth persists between runs | A campaign under the runs | See [[system-meta-progression]] |
| **Milestone** | Discrete unlocks at thresholds | Earned checkpoints, not a smooth ramp | "Beat act 2 → new class" |

Most games layer two: an **in-run** vertical ramp under a **meta** horizontal
one (Hades, Dead Cells). Name which axis carries the fantasy before you tune.

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **XP-to-next curve** | How fast levels come | Gentle geometric (×1.1–1.4/level). Flat = trivial; steep = a wall |
| **Power-per-level** | The size of a gain | Each level must be *felt* — no "+0.3% crit" filler levels |
| **Time-to-first-level** | The onboarding hook | Fast (< 60–90s of play). The first pop teaches the loop |
| **Power-vs-challenge gap** | Whether growth trivialises | Enemies/costs must ramp *with* the player (law 3 inequality) |
| **Level cap / soft cap** | Where the curve flattens | Cap before gains stop being felt, or switch axes (vertical→horizontal) |
| **Catch-up** | Whether a behind player recovers | Optional; XP scaling on lower levels. Pairs with [[system-difficulty-and-dda]] |

The one number that breaks games: **power outrunning challenge.** State it as a
law-3 inequality — *enemy HP(t) grows ≥ player DPS(t)* — and assert it, exactly
as horde-survival asserts superlinear spawn pressure against multiplicative
build growth (**[[FUN.md §6]]**).

## How it wires to Hayao

- **Power is state.** XP, level, and stat totals live in `world.state`; the
  level-up is a **sim step**, and the pick that spends it is an **input action**
  (never a direct mutation) so replays and goldens stay honest — the same rule
  incremental/idle lives by (**[[FUN.md §14]]**).
- **The pop is choreography.** The sim resolves the level instantly and *returns*
  a "leveled-up" beat; the view (flash, chime, particles on `LAYER_HUD`) replays
  it and is `cosmetic = true`, deletable without changing `world.hash()`
  (**[[FUN.md §6]]**).
- **The curve is content, not code.** Pace levels the way `src/content/`
  generates and ramps levels: express the difficulty series and feed it to
  `assertRamp`/`rampIssues` (grep `docs/API.md`) so "the curve has no deserts and
  no walls" is a test, not a vibe. See the generated-campaign flagship
  `examples/lanternfold/`.
- **Meta power persists** through `SaveManager` — see [[system-meta-progression]].

## Fails when…

- **Filler levels.** A gain you can't feel is a chore bar. Fewer, bigger levels
  beat many tiny ones.
- **The curve deserts.** A long stretch with no reachable next gain — the
  incremental sin (**[[FUN.md §14]]**). Assert first-gain times per tier.
- **Power laps challenge.** The build trivialises the content and the game turns
  to autopilot; or challenge laps power and it's a wall. Both break the CI
  *window* (**[[FUN.md §6]]**).
- **Vertical-only forever.** Numbers with no new decisions get boring; introduce
  a horizontal axis (options, [[system-skill-trees]]) once damage stops thrilling.
- **Grind to progress.** If the only path to the next level is repeating a solved
  encounter, you've built a timer, not a game.

## Verify

- Pacing/no-deserts and the payback discipline: **[[FUN.md §14]]** (incremental).
- Power-vs-challenge as an asserted inequality: **[[FUN.md §6]]** (horde) and law
  3 (derive constraints).
- Ramp shape as a test: `assertRamp`/`rampIssues` over the level/curve series —
  the same instrument `examples/lanternfold/` uses.
- Skill-delta: intended play out-earns null play by a margin (universal law 2).

## Composes with

- [[system-skill-trees]] — where horizontal power *branches* into builds.
- [[system-economy]] — XP is one faucet; levels are one sink among many.
- [[system-meta-progression]] — the persistent layer under run-scoped growth.
- [[system-mastery-curve]] — power should *raise the ceiling*, not replace skill.
- [[system-reward-schedules]] — the drip that fills the XP bar between levels.
- [[pattern-pacing-and-tension]] — the level curve IS a pacing curve.

## See also

- [`design/FUN.md`](../FUN.md) §6, §14 — the pacing and challenge-gap proofs.
- `src/content/generate.ts` · `campaign.ts` — generate-and-ramp content, don't
  hand-author the curve.
- `examples/lanternfold/` — a 42-level generated, ramp-asserted campaign.

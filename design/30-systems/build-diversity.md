---
id: system-build-diversity
title: Build Diversity — many viable strategies
kind: system
tags: [builds, loadouts, synergy, diversity, dominant-strategy, viability, balance]
summary: Many strategies that all win — weapons, loadouts, and synergies tuned so the fun is choosing a build, not solving for the one correct build.
use-when: The player assembles a strategy from parts (weapons, cards, relics, skills) and you need more than one path to be worth taking.
composes-with: [system-status-effects, system-counter-systems, system-skill-trees, system-reward-schedules, system-meta-progression]
anchors: [anchor-slay-the-spire, anchor-vampire-survivors, anchor-hades]
verify-with: docs/FUN.md#11-roguelike-deckbuilder
---

# Build Diversity — many viable strategies

**What it is.** The discipline of keeping **many builds viable** — so a player
assembling weapons, cards, relics, or skills faces *choices*, not a solved optimum.
The enemy of build diversity is the **dominant strategy**: the one loadout that
outperforms all others, collapsing the build screen into a lookup.

**Player fantasy / why it's fun.** *Expression.* "This is *my* run — poison stacks,
or crit-and-glass, or turtle-and-scale." Build diversity is what makes a roguelite
replayable: the mechanics are fixed, but the *strategy you author* is new each time.

## When to use / when NOT

| Use it when… | Less critical when… |
|---|---|
| The player composes from many parts | There's one fixed kit |
| Replayability comes from strategy variety | Content variety carries replay instead |
| Synergies/[[system-status-effects]] exist | The game is short/linear |

## Variants — where the diversity lives

| Source | Diversity from | Anchor |
|---|---|---|
| **Loadout** | pick a weapon/kit, whole run reorganizes | [[anchor-hades]] weapons/aspects |
| **Synergy engine** | parts combo multiplicatively | [[anchor-slay-the-spire]] archetypes; [[anchor-balatro]] jokers |
| **Passive stacking** | choices compound into a style | [[anchor-vampire-survivors]] evolutions |
| **Skill tree** | branch exclusivity forces identity | [[system-skill-trees]] |
| **Draft** | reward-of-N shapes the deck over time | Slay the Spire card-reward-of-3 + skip |

## The anti-dominant-strategy discipline

A build system is healthy when **several distinct strategies clear the game at a
similar rate**. Four levers keep it that way:

1. **Multiple engines, none strictly best.** Poison, crit, block-scaling, summons —
   each should win in the hands of a pilot who commits. If one wins with *no* commit,
   it's dominant. Cut or nerf it.
2. **Near-hard counters keep any single engine honest.** A build with no weakness is
   a dominant build; give each strategy a matchup it dreads
   ([[system-counter-systems]]). Diversity and counters are the same problem.
3. **Meaningful exclusivity.** If you can take *everything*, there's no build — just
   a checklist. Force trades: branch exclusivity ([[system-skill-trees]]), deck size,
   slot limits, opportunity cost.
4. **Reward the synergy, not the pile.** Diversity comes from parts that *interact*
   ([[system-status-effects]] combos), not from a longer list of flat +damage. Flat
   stacking always converges on one optimum.

> **The proof is the delta, not the roster.** A big list of weapons proves nothing.
> What proves diversity is: *pilot build A, it wins; pilot build B, it wins; pilot
> the null / flat-stack build, it loses.* (FUN.md law 2, §11 draft-delta.)

## Tuning levers

| Lever | Does | Healthy range |
|---|---|---|
| **Win-rate spread across builds** | how even the top strategies are | tight — no build ≫ the field |
| **Synergy multiplier** | payoff of a combo'd build | big enough to reward commitment, not so big it's mandatory |
| **Exclusivity** | how much you must give up to specialize | real trades; you can't have it all |
| **Floor build power** | how the "no plan" run does | it *loses* — the null baseline (law 2) |
| **Ramp/scaling** | how builds keep pace with difficulty | multiplicative build vs superlinear threat (§6) |

## How it wires to Hayao

- **Pilot bots per build.** Pure state + `world.rng` (FUN.md law 7) lets you script a
  greedy pilot for each archetype, run it, and compare win-rates. Assert the intended
  builds land inside a win window and the null build falls below it (FUN.md §11).
- **The draft delta is the direct test.** Same pilot, drafting *off*, must lose much
  more (Slay the Spire's 17→9). That single assertion catches "the build doesn't
  matter" and "one build dominates" at once.
- **Synergies are pure status/state** — no special API; it's your data (grep
  [`docs/API.md`](../../docs/API.md)). Reward drops via `weightedPick`/`pickEntry`
  through `world.rng` keep the offer fair and replayable ([[system-reward-schedules]]).
- Reference: [[anchor-slay-the-spire]] DNA (draft-of-3 + skip, archetype engines).

## Fails when…

- **A dominant strategy.** One build ≫ the field; every run converges on it, the
  build screen is a lookup. The single most common diversity failure.
- **Flat stacking.** +damage on +damage always has one optimum; no interaction, no
  identity ([[pattern-emergence]] is absent).
- **No exclusivity.** You take everything → there's no build, just accumulation.
- **Trap options.** Choices that are *always* wrong aren't diversity — they're
  padding. Every offered part should win *somewhere*.
- **Diversity that doesn't survive scaling.** Builds that all work at easy but only
  one keeps pace with the ramp (§6) — that's a dominant build in slow motion.

## Verify

- **[FUN.md §11](../../docs/FUN.md)** — greedy pilot per build in the win window;
  never-draft/null build below it; the draft delta.
- **[FUN.md law 2](../../docs/FUN.md)** — each viable build beats the null build by a margin.
- **[FUN.md §6](../../docs/FUN.md)** — builds keep pace with a superlinear ramp (for
  horde/survivor builds).
- Determinism: golden hash of a scripted run per build.

## Composes with

- [[system-status-effects]] — the interacting parts that make synergy engines.
- [[system-counter-systems]] — near-hard counters keep any single build honest.
- [[system-skill-trees]] — branch exclusivity is a primary diversity source.
- [[system-reward-schedules]] — how build parts are offered (draft-of-N, drops).
- [[system-meta-progression]] — persistent unlocks widen the build space over time.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §11 (draft-delta), §6 (build-vs-tide), law 2 (skill delta).
- [[anchor-slay-the-spire]], [[anchor-balatro]] — synergy engines that stay diverse.
- [[pattern-emergence]] — diversity comes from interacting parts, not longer lists.

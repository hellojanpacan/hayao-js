---
id: system-tech-tree
title: Tech Tree — Research Gating & the Ramp of Options
kind: system
tags: [tech-tree, research, gating, branch-exclusivity, strategy, unlocks, ramp]
summary: Research-gated unlocks at the strategy scale; branch exclusivity and a widening ramp of options that shape a whole playthrough's arc.
use-when: The game unlocks strategic capabilities (units, buildings, abilities) over a session and you need the order and exclusivity of those unlocks to matter.
composes-with: [system-skill-trees, system-resource-loops, system-economy, system-faction-asymmetry, system-progression]
anchors: [anchor-age-of-empires, anchor-civilization, anchor-factorio]
verify-with: docs/FUN.md#9-rts-lite
---

# Tech Tree — Research Gating & the Ramp of Options

**What it is.** A **tech tree** is a **[[system-skill-trees]]** at the *strategy*
scale: a graph of researchable capabilities — units, buildings, upgrades, ages —
where each unlock widens what the player can *do*, and prerequisites impose an
order. Where a skill tree shapes a *character*, a tech tree shapes a *civilization's
whole arc*.

**Player fantasy / why it's fun.** "My tech path is my strategy." The order you
research is a plan; a well-timed unlock is a power spike (**[[anchor-age-of-empires]]**
age-ups). The pull is the branch just out of reach — the tech that would answer
what's beating you.

## When to use / when NOT

| Use it when | Skip it when |
|---|---|
| Strategy is expressed through *what you unlock, when* (RTS, 4X) | The game has a fixed toolset from the start |
| Build orders and tech timing are a skill | Research would just be a passive timer |
| You want power spikes to punctuate a long session | Sessions are too short to ramp options |

The tech tree is the RTS/4X engine of **[[pattern-pacing-and-tension]]**: each age
or era is a plateau, each unlock a spike. If unlocks don't create *timing decisions*
(rush this or bank for that?), you have a checklist, not a tree.

## Variants

| Variant | Structure | The decision is | Example |
|---|---|---|---|
| **Age/era gates** | Discrete tiers; advance to unlock a bracket | *When* to age up (spike vs eco) | AoE ages; Civ eras |
| **Prerequisite web** | Deep dependency graph | *Route* through the tree | Civ tech web; Factorio science |
| **Exclusive branches** | Pick a path, lock the other | *Identity/commitment* | Civ policy trees; StarCraft tech choices |
| **Cost-gated flat** | No prereqs, priced by power | *Priority* | Simple upgrade shops |
| **Faction trees** | Different tree per faction | *Asymmetric strategy* | See [[system-faction-asymmetry]] |

## Tuning levers

| Lever | What it controls | Healthy range / rule |
|---|---|---|
| **Tier/age spacing** | Time between power spikes | Long enough to *feel* the plateau, short enough to keep momentum |
| **Branch exclusivity** | Whether a path costs another | Some branches exclusive, or every game converges to the same tech |
| **Research cost curve** | The ramp of options | Rising cost per tier; but each tier's *value* must rise with it |
| **Gate depth** | Prereqs before a payoff tech | Shallow — burying the fun behind filler tech is grind |
| **Counter-availability** | Can you tech *into* an answer? | Yes — a tech tree is where RTS counters live; every threat needs a reachable response |
| **Snowball vs comeback** | Does a tech lead compound? | Add catch-up / comeback techs, or leaders run away ([[pattern-feedback-loops]]) |

## How it wires to Hayao

- **The tree is a data graph + pure logic.** Nodes (`id, cost, prereqs, unlocks`)
  in `world.state`; researching is an **input action** that spends resources and
  flips availability flags; unit/ability availability is pure logic reading those
  flags. So a *build order* is a reproducible input script a bot can pilot
  (**[[FUN.md law 7]]**).
- **Strategy is the balance test.** The RTS truth (**[[FUN.md §9]]**): the intended
  line (e.g. turtle → tech → counterpush) must *beat* a naive line (attack-move /
  one-tech rush). Pilot both, assert the delta — that's your proof the tech
  choices matter (law 2).
- **Counters must be reachable.** Every enemy threat needs a tech-reachable answer;
  assert it the way tower-defense proves counter duels from both sides
  (**[[FUN.md §8]]**) and RTS proves every counter edge wins its NvN
  (**[[FUN.md §9]]**).
- **The tech panel is chrome** — `showScreen()` DOM; the research *state* is sim
  (CLAUDE.md invariant 4). Generate/ramp the option-unlock curve as content
  (`src/content/`, `assertRamp`).

## Fails when…

- **A dominant path.** One tech order is always best; the tree collapses to a line.
  Skill-delta between *paths* should be small; each viable path should beat null.
- **Unreachable counters.** A threat with no tech answer is unfair — the RTS/TD
  counter proof fails from one side.
- **Filler gating.** Dead prereq techs padding the route to the good one — grind.
- **Runaway snowball.** A tech lead that compounds into an unbeatable lead with no
  comeback tech ([[pattern-feedback-loops]]).
- **Spikes with no plateau.** Constant unlocks = no pacing; the age-up thrill needs
  the plateau before it.

## Verify

- Intended tech line beats naive line (strategy is the test): **[[FUN.md §9]]**,
  law 2.
- Every counter edge wins its duel, both sides: **[[FUN.md §9]]** (RTS) /
  **[[FUN.md §8]]** (TD).
- Build order as a reproducible pilot: **[[FUN.md law 7]]**.
- Option ramp shape as a test: `assertRamp`/`rampIssues` over the unlock curve.

## Composes with

- [[system-skill-trees]] — the same graph shape at the character scale.
- [[system-resource-loops]] — research consumes the production chain's output.
- [[system-economy]] — research points/cost are a currency and a sink.
- [[system-faction-asymmetry]] — different trees are a core asymmetry lever.
- [[system-counter-systems]] — the tree is where reachable counters live.
- [[pattern-pacing-and-tension]] — ages/eras are the plateau-and-spike engine.

## See also

- [`docs/FUN.md`](../../docs/FUN.md) §9 (RTS strategy-as-test) · §8 (counter duels)
  — the tech-tree proofs.
- **[[anchor-age-of-empires]]** (age spikes) · **[[anchor-civilization]]** (deep web).
